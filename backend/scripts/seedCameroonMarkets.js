/*
  Seeds Cameroon markets into the configured Postgres database (Neon).
  - Idempotent: only inserts markets that don't already exist.
  - Imports markets from backend/Markets/*.kmz (Google Earth export).
  - Adds a small curated list of major markets across regions.

  Run from backend/:
    node scripts/seedCameroonMarkets.js
*/

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const db = require('../src/models');
const { Market } = db;
const logger = require('../src/config/logger');
const { fetchOsmMarketsCameroon } = require('./importOsmMarketsCameroon');

const CITY_TO_REGION = {
  // South West
  Buea: 'South West',
  Limbe: 'South West',
  Kumba: 'South West',
  Tiko: 'South West',
  Mutengene: 'South West',
  Muyuka: 'South West',
  Idenau: 'South West',

  // North West
  Bamenda: 'North West',
  Mbengwi: 'North West',
  Bali: 'North West',
  Kumbo: 'North West',
  Ndop: 'North West',

  // Littoral
  Douala: 'Littoral',
  Edea: 'Littoral',
  Édéa: 'Littoral',

  // Centre
  Yaounde: 'Centre',
  Yaoundé: 'Centre',

  // West
  Bafoussam: 'West',
  Foumbot: 'West',
  Dschang: 'West',
  Mbouda: 'West',

  // Adamawa
  Ngaoundere: 'Adamawa',
  Ngaoundéré: 'Adamawa',

  // East
  Bertoua: 'East',

  // North
  Garoua: 'North',

  // Far North
  Maroua: 'Far North',

  // South
  Ebolowa: 'South',
  Kribi: 'South'
};

function normalizeString(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function makeNaturalKey({ name, city, region }) {
  return `${normalizeString(name)}|${normalizeString(city)}|${normalizeString(region)}`;
}

function isLikelyMarketName(name) {
  const n = normalizeString(name);
  return n.includes('market') || n.includes('marché') || n.includes('marche');
}

function inferCityAndRegion({ explicitCity, explicitRegion, address, fileName, folderName, placemarkName }) {
  const rawCandidates = [explicitCity, explicitRegion, address, fileName, folderName, placemarkName]
    .filter(Boolean)
    .map(String);

  let city = explicitCity || null;
  let region = explicitRegion || null;

  if (!city) {
    for (const text of rawCandidates) {
      for (const knownCity of Object.keys(CITY_TO_REGION)) {
        if (text.toLowerCase().includes(knownCity.toLowerCase())) {
          city = knownCity;
          break;
        }
      }
      if (city) break;
    }
  }

  if (!region) {
    if (city && CITY_TO_REGION[city]) region = CITY_TO_REGION[city];
  }

  return { city, region };
}

function toGeoPoint(lng, lat) {
  if (typeof lng !== 'number' || typeof lat !== 'number') return null;
  return { type: 'Point', coordinates: [lng, lat] };
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractKmzToKmlText(kmzPath) {
  // KMZ is a zip; on Windows we can use Expand-Archive (PowerShell 5+).
  // This keeps the repo dependency-free.
  const tempRoot = path.join(os.tmpdir(), 'ycd_kmz_extract');
  fs.mkdirSync(tempRoot, { recursive: true });

  const base = path.basename(kmzPath, path.extname(kmzPath));
  const workDir = path.join(tempRoot, base.replace(/[^a-z0-9\-_]/gi, '_'));

  try {
    fs.rmSync(workDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
  fs.mkdirSync(workDir, { recursive: true });

  const zipPath = path.join(workDir, `${base}.zip`);
  fs.copyFileSync(kmzPath, zipPath);

  const ps =
    `Expand-Archive -Force -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${workDir.replace(/'/g, "''")}'`;

  execFileSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'ignore' });

  const kmlPath = path.join(workDir, 'doc.kml');
  if (!fs.existsSync(kmlPath)) {
    throw new Error(`No doc.kml found after extracting: ${kmzPath}`);
  }
  return fs.readFileSync(kmlPath, 'utf8');
}

function parseKmlPlacemarkEntries(kmlText) {
  const placemarkMatches = kmlText.match(/<Placemark[\s\S]*?<\/Placemark>/g) || [];

  const getTagValue = (xml, tag) => {
    const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return m ? m[1].trim() : null;
  };

  const folderName = (() => {
    const m = kmlText.match(/<Folder[\s\S]*?>[\s\S]*?<name>([\s\S]*?)<\/name>/i);
    return m ? m[1].trim() : null;
  })();

  const entries = [];
  for (const xml of placemarkMatches) {
    const name = getTagValue(xml, 'name');
    const address = getTagValue(xml, 'address');
    const phoneNumber = getTagValue(xml, 'phoneNumber');

    const coordsText = (() => {
      const m = xml.match(/<coordinates>([\s\S]*?)<\/coordinates>/i);
      return m ? m[1].trim() : null;
    })();

    let lng = null;
    let lat = null;
    if (coordsText) {
      const parts = coordsText.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        lng = Number(parts[0]);
        lat = Number(parts[1]);
      }
    }

    entries.push({
      name: name || null,
      address: address || null,
      phoneNumber: phoneNumber || null,
      lng: Number.isFinite(lng) ? lng : null,
      lat: Number.isFinite(lat) ? lat : null,
      folderName
    });
  }
  return entries;
}

function kmzMarketsToMarketRows(kmzPath) {
  const kmlText = extractKmzToKmlText(kmzPath);
  const placemarks = parseKmlPlacemarkEntries(kmlText);

  const fileName = path.basename(kmzPath);
  const rows = [];

  for (const pm of placemarks) {
    if (!pm.name || !isLikelyMarketName(pm.name)) continue;
    if (pm.lat == null || pm.lng == null) continue;

    const inferred = inferCityAndRegion({
      explicitCity: null,
      explicitRegion: null,
      address: pm.address,
      fileName,
      folderName: pm.folderName,
      placemarkName: pm.name
    });

    rows.push({
      name: pm.name,
      description: null,
      address: pm.address,
      city: inferred.city,
      region: inferred.region,
      country: 'Cameroon',
      market_type: 'Market',
      location_lat: pm.lat,
      location_lng: pm.lng,
      location: toGeoPoint(pm.lng, pm.lat),
      contact_phone: pm.phoneNumber || null,
      is_active: true,
      verified: false,
      data_source: 'kmz',
      additional_info: {
        source: 'backend/Markets',
        source_file: fileName,
        folder_name: pm.folderName
      }
    });
  }

  return rows;
}

// Curated list for major cities/regions not covered by KMZ exports.
// Keep names distinctive to reduce collisions; dedupe is handled via (name|city|region).
const curatedMarkets = [
  // ============ CENTRE (YAOUNDE) ============
  {
    name: 'Mokolo Market',
    description: 'One of the largest and most famous markets in Yaounde.',
    address: 'Mokolo, Yaounde',
    city: 'Yaounde',
    region: 'Centre',
    country: 'Cameroon',
    market_type: 'Traditional Market',
    location_lat: 3.8667,
    location_lng: 11.5167,
    location: toGeoPoint(11.5167, 3.8667),
    operating_hours: {
      monday: { open: '06:00', close: '18:00' },
      tuesday: { open: '06:00', close: '18:00' },
      wednesday: { open: '06:00', close: '18:00' },
      thursday: { open: '06:00', close: '18:00' },
      friday: { open: '06:00', close: '18:00' },
      saturday: { open: '06:00', close: '18:00' }
    },
    market_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    is_active: true,
    verified: true,
    data_source: 'manual',
    additional_info: { curated: true }
  },
  {
    name: 'Mfoundi Market',
    description: 'Central market area in Yaounde (Mfoundi division).',
    address: 'Centre-ville, Yaounde',
    city: 'Yaounde',
    region: 'Centre',
    country: 'Cameroon',
    market_type: 'Traditional Market',
    location_lat: 3.8480,
    location_lng: 11.5021,
    location: toGeoPoint(11.5021, 3.8480),
    is_active: true,
    verified: true,
    data_source: 'manual',
    additional_info: { curated: true }
  },
  {
    name: 'Essos Market',
    description: 'Popular neighborhood market in Essos, Yaounde.',
    address: 'Essos, Yaounde',
    city: 'Yaounde',
    region: 'Centre',
    country: 'Cameroon',
    market_type: 'Traditional Market',
    location_lat: 3.8732,
    location_lng: 11.5160,
    location: toGeoPoint(11.5160, 3.8732),
    is_active: true,
    verified: true,
    data_source: 'manual',
    additional_info: { curated: true }
  },
  {
    name: 'Mvog Mbi Market',
    description: 'Market serving the Mvog Mbi area of Yaounde.',
    address: 'Mvog Mbi, Yaounde',
    city: 'Yaounde',
    region: 'Centre',
    country: 'Cameroon',
    market_type: 'Traditional Market',
    location_lat: 3.8489,
    location_lng: 11.5079,
    location: toGeoPoint(11.5079, 3.8489),
    is_active: true,
    verified: true,
    data_source: 'manual',
    additional_info: { curated: true }
  },

  // ============ LITTORAL (DOUALA) ============
  {
    name: 'Douala Central Market',
    description: 'Main market in Douala, the economic capital of Cameroon.',
    address: 'Douala',
    city: 'Douala',
    region: 'Littoral',
    country: 'Cameroon',
    market_type: 'Traditional Market',
    location_lat: 4.0511,
    location_lng: 9.7679,
    location: toGeoPoint(9.7679, 4.0511),
    is_active: true,
    verified: true,
    data_source: 'manual',
    additional_info: { curated: true }
  },
  {
    name: 'New Bell Market',
    description: 'Busy market in New Bell neighborhood, Douala.',
    address: 'New Bell, Douala',
    city: 'Douala',
    region: 'Littoral',
    country: 'Cameroon',
    market_type: 'Traditional Market',
    location_lat: 4.0485,
    location_lng: 9.7054,
    location: toGeoPoint(9.7054, 4.0485),
    is_active: true,
    verified: true,
    data_source: 'manual',
    additional_info: { curated: true }
  },
  {
    name: 'Bonaberi Market',
    description: 'Market serving Bonaberi area of Douala.',
    address: 'Bonaberi, Douala',
    city: 'Douala',
    region: 'Littoral',
    country: 'Cameroon',
    market_type: 'Traditional Market',
    location_lat: 4.0970,
    location_lng: 9.6520,
    location: toGeoPoint(9.6520, 4.0970),
    is_active: true,
    verified: true,
    data_source: 'manual',
    additional_info: { curated: true }
  },
  {
    name: 'Deido Market',
    description: 'Market in Deido neighborhood, Douala.',
    address: 'Deido, Douala',
    city: 'Douala',
    region: 'Littoral',
    country: 'Cameroon',
    market_type: 'Traditional Market',
    location_lat: 4.0628,
    location_lng: 9.7059,
    location: toGeoPoint(9.7059, 4.0628),
    is_active: true,
    verified: true,
    data_source: 'manual',
    additional_info: { curated: true }
  },

  // ============ ADAMAWA (NGAOUNDERE) ============
  {
    name: 'Ngaoundéré Central Market',
    description: 'Main market in Ngaoundéré serving the Adamawa plateau.',
    address: 'Ngaoundéré',
    city: 'Ngaoundéré',
    region: 'Adamawa',
    country: 'Cameroon',
    market_type: 'Traditional Market',
    location_lat: 7.3167,
    location_lng: 13.5833,
    location: toGeoPoint(13.5833, 7.3167),
    is_active: true,
    verified: true,
    data_source: 'manual',
    additional_info: { curated: true }
  },
  {
    name: 'Meiganga Market',
    description: 'Market in Meiganga, Adamawa Region.',
    address: 'Meiganga',
    city: 'Meiganga',
    region: 'Adamawa',
    country: 'Cameroon',
    market_type: 'Traditional Market',
    location_lat: 6.5167,
    location_lng: 14.3000,
    location: toGeoPoint(14.3000, 6.5167),
    is_active: true,
    verified: true,
    data_source: 'manual',
    additional_info: { curated: true }
  },

  // ============ NORTH (GAROUA) ============
  {
    name: 'Garoua Central Market',
    description: 'Main market in Garoua serving the North Region.',
    address: 'Garoua',
    city: 'Garoua',
    region: 'North',
    country: 'Cameroon',
    market_type: 'Traditional Market',
    location_lat: 9.3000,
    location_lng: 13.4000,
    location: toGeoPoint(13.4000, 9.3000),
    is_active: true,
    verified: true,
    data_source: 'manual',
    additional_info: { curated: true }
  },
  {
    name: 'Guider Market',
    description: 'Market in Guider, North Region.',
    address: 'Guider',
    city: 'Guider',
    region: 'North',
    country: 'Cameroon',
    market_type: 'Traditional Market',
    location_lat: 9.9333,
    location_lng: 13.9500,
    location: toGeoPoint(13.9500, 9.9333),
    is_active: true,
    verified: true,
    data_source: 'manual',
    additional_info: { curated: true }
  },

  // ============ FAR NORTH (MAROUA + OTHERS) ============
  {
    name: 'Maroua Central Market',
    description: 'Main market in Maroua serving the Far North Region.',
    address: 'Maroua',
    city: 'Maroua',
    region: 'Far North',
    country: 'Cameroon',
    market_type: 'Traditional Market',
    location_lat: 10.5908,
    location_lng: 14.3158,
    location: toGeoPoint(14.3158, 10.5908),
    is_active: true,
    verified: true,
    data_source: 'manual',
    additional_info: { curated: true }
  },
  {
    name: 'Kousséri Market',
    description: 'Market in Kousséri near the Cameroon-Chad border.',
    address: 'Kousséri',
    city: 'Kousséri',
    region: 'Far North',
    country: 'Cameroon',
    market_type: 'Traditional Market',
    location_lat: 12.0833,
    location_lng: 15.0333,
    location: toGeoPoint(15.0333, 12.0833),
    is_active: true,
    verified: true,
    data_source: 'manual',
    additional_info: { curated: true }
  },
  {
    name: 'Mokolo (Far North) Market',
    description: 'Market in Mokolo town (Far North Region).',
    address: 'Mokolo',
    city: 'Mokolo',
    region: 'Far North',
    country: 'Cameroon',
    market_type: 'Traditional Market',
    location_lat: 10.7420,
    location_lng: 13.8020,
    location: toGeoPoint(13.8020, 10.7420),
    is_active: true,
    verified: true,
    data_source: 'manual',
    additional_info: { curated: true }
  }
];

function sanitizeMarketRow(row) {
  // Keep only columns that exist on the Market model/table.
  // Extra data is stuffed into additional_info.
  const allowed = {
    name: row.name,
    description: row.description ?? null,
    location_lat: row.location_lat ?? null,
    location_lng: row.location_lng ?? null,
    address: row.address ?? null,
    city: row.city ?? null,
    region: row.region ?? null,
    country: row.country ?? 'Cameroon',
    market_type: row.market_type ?? null,
    operating_hours: row.operating_hours ?? null,
    market_days: row.market_days ?? null,
    contact_phone: row.contact_phone ?? null,
    contact_email: row.contact_email ?? null,
    website: row.website ?? null,
    average_rating: row.average_rating ?? undefined,
    total_reviews: row.total_reviews ?? undefined,
    is_active: row.is_active ?? true,
    verified: row.verified ?? false,
    osm_id: row.osm_id ?? null,
    data_source: row.data_source ?? null,
    additional_info: row.additional_info ?? null,
    location: row.location ?? null
  };

  // If caller gave extra keys, preserve them.
  const extra = {};
  for (const [k, v] of Object.entries(row)) {
    if (Object.prototype.hasOwnProperty.call(allowed, k)) continue;
    extra[k] = v;
  }

  if (Object.keys(extra).length > 0) {
    const base = typeof allowed.additional_info === 'object' && allowed.additional_info ? allowed.additional_info : {};
    allowed.additional_info = { ...base, extra };
  }

  // Ensure location is set when lat/lng exists.
  if (!allowed.location && typeof allowed.location_lat === 'number' && typeof allowed.location_lng === 'number') {
    allowed.location = toGeoPoint(allowed.location_lng, allowed.location_lat);
  }

  return allowed;
}

async function seedCameroonMarkets() {
  logger.info('Starting Cameroon markets seeding...');

  // Clean up the two test rows we inserted during debugging (safe + precise).
  await Market.destroy({ where: { name: 'Test Market', city: 'Test', region: 'Test' } });
  await Market.destroy({ where: { name: 'Buea Test Market', description: 'Test market for seeding' } });

  const existingMarkets = await Market.findAll({
    attributes: ['name', 'city', 'region']
  });

  const existingKeys = new Set(existingMarkets.map(m => makeNaturalKey(m)));
  logger.info(`Existing markets in DB: ${existingMarkets.length}`);

  // Build candidate list: curated + KMZ-derived
  const marketsDir = path.join(__dirname, '..', 'Markets');
  const kmzFiles = fs.existsSync(marketsDir)
    ? fs.readdirSync(marketsDir).filter(f => f.toLowerCase().endsWith('.kmz')).map(f => path.join(marketsDir, f))
    : [];

  const kmzRows = [];
  for (const kmzPath of kmzFiles) {
    try {
      const rows = kmzMarketsToMarketRows(kmzPath);
      kmzRows.push(...rows);
      logger.info(`Parsed ${rows.length} markets from ${path.basename(kmzPath)}`);
    } catch (e) {
      logger.warn(`Failed to parse ${path.basename(kmzPath)}: ${e.message}`);
    }
  }

  // OSM import (all Cameroon, filtered to Market/Marche names; excludes supermarkets)
  let osmRows = [];
  try {
    const osmResult = await fetchOsmMarketsCameroon();
    osmRows = Array.isArray(osmResult) ? osmResult : (osmResult && osmResult.rows) ? osmResult.rows : [];
    logger.info(`Fetched ${osmRows.length} OSM markets (filtered)`);
  } catch (e) {
    logger.warn(`OSM fetch failed (continuing with curated+KMZ only): ${e.message}`);
  }

  const candidates = [...curatedMarkets, ...kmzRows, ...osmRows]
    .map(sanitizeMarketRow)
    .filter(m => m && m.name && typeof m.location_lat === 'number' && typeof m.location_lng === 'number');

  logger.info(`Candidate markets (curated + KMZ): ${candidates.length}`);

  const toInsert = [];
  for (const m of candidates) {
    // Ensure city/region if possible
    const inferred = inferCityAndRegion({
      explicitCity: m.city,
      explicitRegion: m.region,
      address: m.address,
      fileName: (m.additional_info && m.additional_info.source_file) || null,
      folderName: (m.additional_info && m.additional_info.folder_name) || null,
      placemarkName: m.name
    });
    m.city = inferred.city || m.city;
    m.region = inferred.region || m.region;

    const key = makeNaturalKey(m);
    if (existingKeys.has(key)) continue;
    existingKeys.add(key);
    toInsert.push(m);
  }

  if (toInsert.length === 0) {
    logger.info('No new markets to add (already up to date).');
    return { existing: existingMarkets.length, added: 0, fromKmz: 0, fromCurated: 0 };
  }

  const fromKmz = toInsert.filter(m => m.data_source === 'kmz').length;
  const fromCurated = toInsert.filter(m => m.data_source === 'manual').length;

  await Market.bulkCreate(toInsert);

  logger.info(`Seeded ${toInsert.length} markets (KMZ: ${fromKmz}, curated: ${fromCurated})`);
  return { existing: existingMarkets.length, added: toInsert.length, fromKmz, fromCurated };
}

if (require.main === module) {
  (async () => {
    try {
      console.log('Seeding Cameroon markets to Neon (DATABASE_URL)...');
      await db.sequelize.authenticate();
      const result = await seedCameroonMarkets();
      console.log('Done:', result);
      process.exit(0);
    } catch (error) {
      console.error('Seeding failed:', error && error.message ? error.message : error);
      logger.error('Seeding failed', { error: error && error.message ? error.message : String(error), stack: error && error.stack ? error.stack : undefined });
      process.exit(1);
    }
  })();
}

module.exports = seedCameroonMarkets;
