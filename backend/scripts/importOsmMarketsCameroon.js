/*
  Import Cameroon markets from OpenStreetMap (Overpass API) into the Markets table.

  Criteria (as requested):
  - Only entries with name containing: Market / Marche / Marché
  - Exclude supermarkets (name contains supermarket/supermarché or tag shop=supermarket)
  - Pulls amenity=marketplace within Cameroon boundary.

  Run from backend/:
    node scripts/importOsmMarketsCameroon.js

  Options:
    --dry-run   Fetch + show counts, no DB writes
    --limit N   Only insert first N (after filtering)

    Advanced (optional):
      --include-all-marketplace   Import all amenity=marketplace (still excludes supermarkets)
      --include-other-names       Include marketplaces whose names do NOT contain Market/Marche
      --include-unnamed           Include marketplaces with no name (auto-generate a Market name)
*/

require('dotenv').config();

const axios = require('axios');
const { Op } = require('sequelize');

const db = require('../src/models');
const { Market } = db;
const logger = require('../src/config/logger');

const OVERPASS_URL = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';

const MARKET_NAME_RE = /(market|march[eé])/i;
const SUPERMARKET_NAME_RE = /(super\s*market|supermarket|super\s*march[eé]|supermarch[eé])/i;

function parseArgs(argv) {
  const args = {
    dryRun: false,
    limit: null,
    includeAllMarketplace: false,
    includeOtherNames: false,
    includeUnnamed: false
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--include-all-marketplace') args.includeAllMarketplace = true;
    else if (a === '--include-other-names') args.includeOtherNames = true;
    else if (a === '--include-unnamed') args.includeUnnamed = true;
    else if (a === '--limit') {
      const v = Number(argv[i + 1]);
      if (Number.isFinite(v) && v > 0) {
        args.limit = v;
        i++;
      }
    }
  }

  if (args.includeAllMarketplace) {
    args.includeOtherNames = true;
    args.includeUnnamed = true;
  }

  return args;
}

function toGeoPoint(lng, lat) {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { type: 'Point', coordinates: [lng, lat] };
}

function normalizeString(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function makeNaturalKey({ name, city, region }) {
  return `${normalizeString(name)}|${normalizeString(city)}|${normalizeString(region)}`;
}

function isSupermarket(tags) {
  const name = tags && tags.name ? String(tags.name) : '';
  const n = normalizeString(name);
  if (SUPERMARKET_NAME_RE.test(n)) return true;
  if (n.includes('super store') || n.includes('superstore')) return true;
  if (tags && tags.shop && normalizeString(tags.shop) === 'supermarket') return true;
  return false;
}

function nameMatchesMarket(tags) {
  const name = tags && tags.name ? String(tags.name) : '';
  return !!name && MARKET_NAME_RE.test(name);
}

function elementToMarketRow(el, options) {
  const tags = el.tags || {};

  const lat = Number.isFinite(el.lat) ? el.lat : (el.center && Number.isFinite(el.center.lat) ? el.center.lat : null);
  const lon = Number.isFinite(el.lon) ? el.lon : (el.center && Number.isFinite(el.center.lon) ? el.center.lon : null);

  if (lat == null || lon == null) return null;

  const rawName = tags.name ? String(tags.name).trim() : '';
  const name = rawName || null;
  if (!name && !(options && options.includeUnnamed)) return null;

  const finalName = name || `Market (OSM ${el.type}:${el.id})`;

  const osmId = `${el.type}:${el.id}`;

  const city = tags['addr:city'] || tags['is_in:city'] || tags['addr:town'] || null;
  const region = tags['addr:state'] || tags['addr:region'] || tags['is_in:state'] || null;

  const addressParts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
    tags['addr:postcode']
  ].filter(Boolean);

  const address = addressParts.length > 0 ? addressParts.join(', ') : (tags['addr:full'] || null);

  const marketType = tags.marketplace ? String(tags.marketplace) : (tags.amenity ? String(tags.amenity) : null);

  return {
    name: finalName,
    description: tags.description || null,
    address,
    city,
    region,
    country: tags['addr:country'] || 'Cameroon',
    market_type: marketType,
    location_lat: lat,
    location_lng: lon,
    location: toGeoPoint(lon, lat),
    contact_phone: tags.phone || tags['contact:phone'] || null,
    contact_email: tags.email || tags['contact:email'] || null,
    website: tags.website || tags['contact:website'] || null,
    is_active: true,
    verified: false,
    osm_id: osmId,
    data_source: 'osm',
    additional_info: {
      source: 'osm_overpass',
      osm_type: el.type,
      osm_numeric_id: el.id,
      had_osm_name: !!rawName,
      tags
    }
  };
}

async function overpassQuery(query, attempt = 1) {
  const maxAttempts = 5;
  try {
    const res = await axios.post(OVERPASS_URL, query, {
      headers: { 'Content-Type': 'text/plain' },
      timeout: 180000
    });
    return res.data;
  } catch (err) {
    const status = err && err.response ? err.response.status : null;
    const retriable = status === 429 || status === 504 || status === 502 || status === 503;
    if (retriable && attempt < maxAttempts) {
      const delayMs = Math.min(30000, 1000 * Math.pow(2, attempt));
      logger.warn(`Overpass request failed (${status || 'no status'}). Retry ${attempt}/${maxAttempts} in ${delayMs}ms`);
      await new Promise(r => setTimeout(r, delayMs));
      return overpassQuery(query, attempt + 1);
    }
    throw err;
  }
}

async function fetchOsmMarketsCameroon(options = {}) {
  // Use country boundary by ISO code; then pull all marketplace nodes/ways/relations.
  // We filter by name locally to enforce "Market/Marche" and exclude supermarkets.
  const query = `
[out:json][timeout:180];
area["ISO3166-1"="CM"][admin_level=2]->.cm;
(
  nwr["amenity"="marketplace"](area.cm);
);
out center tags;
`;

  logger.info('Querying Overpass for Cameroon marketplaces...');
  const data = await overpassQuery(query);
  const elements = Array.isArray(data && data.elements) ? data.elements : [];

  logger.info(`Overpass returned ${elements.length} marketplace elements (pre-filter).`);

  const rows = [];
  const stats = {
    total: elements.length,
    included: 0,
    includedMatchedName: 0,
    includedOtherNamed: 0,
    includedUnnamed: 0,
    excludedSupermarket: 0,
    excludedNoCoords: 0,
    excludedByNameRule: 0
  };

  for (const el of elements) {
    const tags = el.tags || {};

    // Hard constraints
    if (tags.amenity && normalizeString(tags.amenity) !== 'marketplace') {
      stats.excludedByNameRule++;
      continue;
    }
    if (isSupermarket(tags)) {
      stats.excludedSupermarket++;
      continue;
    }

    const hasName = !!(tags.name && String(tags.name).trim());
    const matches = nameMatchesMarket(tags);

    // Default behavior (strict): require Market/Marche in the name.
    // Optional behavior: include other named marketplaces, and/or unnamed marketplaces.
    if (!matches) {
      if (hasName && !(options.includeOtherNames || options.includeAllMarketplace)) {
        stats.excludedByNameRule++;
        continue;
      }
      if (!hasName && !(options.includeUnnamed || options.includeAllMarketplace)) {
        stats.excludedByNameRule++;
        continue;
      }
    }

    const row = elementToMarketRow(el, options);
    if (!row) {
      stats.excludedNoCoords++;
      continue;
    }

    rows.push(row);

    stats.included++;
    if (!hasName) stats.includedUnnamed++;
    else if (matches) stats.includedMatchedName++;
    else stats.includedOtherNamed++;
  }

  logger.info(
    `Filtered rows: ${rows.length} included; ` +
    `matchedName=${stats.includedMatchedName}, otherNamed=${stats.includedOtherNamed}, unnamed=${stats.includedUnnamed}; ` +
    `excluded(supermarket)=${stats.excludedSupermarket}, excluded(no coords)=${stats.excludedNoCoords}, excluded(by name rule)=${stats.excludedByNameRule}`
  );

  return { rows, stats };
}

async function insertMissingByOsmId(rows, limit = null) {
  const limited = limit ? rows.slice(0, limit) : rows;
  const osmIds = [...new Set(limited.map(r => r.osm_id).filter(Boolean))];

  const existing = await Market.findAll({
    where: { osm_id: { [Op.in]: osmIds } },
    attributes: ['osm_id']
  });

  const existingSet = new Set(existing.map(r => r.osm_id));
  const toInsert = limited.filter(r => r.osm_id && !existingSet.has(r.osm_id));

  if (toInsert.length === 0) {
    return { inserted: 0, skippedExisting: limited.length, totalCandidates: limited.length };
  }

  await Market.bulkCreate(toInsert);
  return { inserted: toInsert.length, skippedExisting: limited.length - toInsert.length, totalCandidates: limited.length };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  await db.sequelize.authenticate();

  const { rows, stats } = await fetchOsmMarketsCameroon({
    includeAllMarketplace: args.includeAllMarketplace,
    includeOtherNames: args.includeOtherNames,
    includeUnnamed: args.includeUnnamed
  });

  // Some OSM entries may have empty city/region; still ok.
  // But we also dedupe within this run by (osm_id) primarily.

  if (args.dryRun) {
    const naturalKeys = new Set(rows.map(r => makeNaturalKey(r)));
    console.log('DRY RUN');
    console.log('Mode:', {
      includeAllMarketplace: args.includeAllMarketplace,
      includeOtherNames: args.includeOtherNames,
      includeUnnamed: args.includeUnnamed
    });
    console.log('Stats:', stats);
    console.log('Candidates:', rows.length);
    console.log('Distinct (name|city|region):', naturalKeys.size);
    return;
  }

  const result = await insertMissingByOsmId(rows, args.limit);
  logger.info(`OSM import complete. Inserted ${result.inserted}, skipped existing ${result.skippedExisting}, candidates ${result.totalCandidates}`);
  console.log('OSM import result:', result);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      const msg = err && err.response && err.response.data
        ? String(err.response.data).slice(0, 500)
        : (err && err.message ? err.message : String(err));
      console.error('Import failed:', msg);
      logger.error('OSM import failed', { error: msg, stack: err && err.stack ? err.stack : undefined });
      process.exit(1);
    });
}

module.exports = { fetchOsmMarketsCameroon };
