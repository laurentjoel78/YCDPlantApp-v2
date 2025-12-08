const fs = require('fs');
const path = require('path');

// Small alias map and fuzzy matching helper to increase match rates for crops/regions
const CROP_ALIASES = {
  corn: 'maize',
  'field corn': 'maize',
  'sweet corn': 'maize',
  'yardlong bean': 'cowpea',
  'cow pea': 'cowpea',
  'sorghum bicolor': 'sorghum'
};

function levenshtein(a, b) {
  if (!a || !b) return (a === b) ? 0 : Math.max(a ? a.length : 0, b ? b.length : 0);
  a = a.toString(); b = b.toString();
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - (levenshtein(a, b) / maxLen);
}

class RegionCropService {
  constructor() {
    this.summaryPath = path.join(__dirname, '..', '..', 'data', 'region_crop_data.json');
    this.fullPath = path.join(__dirname, '..', '..', 'data', 'region_crop_full.json');
    this._summary = null; // normalized summary rows
    this._full = null; // raw full rows
    this._loadData();
  }

  _loadData() {
    try {
      if (fs.existsSync(this.summaryPath)) {
        const raw = fs.readFileSync(this.summaryPath, 'utf8');
        this._summary = JSON.parse(raw);
      } else {
        this._summary = [];
      }

      if (fs.existsSync(this.fullPath)) {
        const rawFull = fs.readFileSync(this.fullPath, 'utf8');
        this._full = JSON.parse(rawFull);
      } else {
        this._full = [];
      }
    } catch (err) {
      console.error('Failed to load region crop data:', err.message);
      this._summary = [];
      this._full = [];
    }
  }

  // Normalize region and crop to simple lowercase keys for matching
  _key(region, crop) {
    return `${(region || '').toString().trim().toLowerCase()}::${(crop || '').toString().trim().toLowerCase()}`;
  }

  getRecommendations(region, crop) {
    // Prefer the full/raw dataset if present (contains all columns)
    const dataset = (this._full && this._full.length > 0) ? this._full : (this._summary || []);
    if (!dataset || dataset.length === 0) return null;

    const key = this._key(region, crop);
    // Exact match on full/raw rows: try normalized comparison on raw keys too
    let found = dataset.find(r => this._key(r.Region || r.region || r.RegionName, r.Crop || r.crop || r.CropName) === key);
    if (found) return found;

    // Fallback: match using normalized summary if present
    if (this._summary && this._summary.length > 0) {
      found = this._summary.find(r => this._key(r.region, r.crop) === key);
      if (found) return found;
    }

    // Region-only fallback (search both datasets)
    const regionLower = (region || '').toString().trim().toLowerCase();
    const regionOnlyFull = dataset.find(r => ((r.Region || r.region || r.RegionName || '').toString().trim().toLowerCase() === regionLower) && (!(r.Crop || r.crop || r.CropName)));
    if (regionOnlyFull) return regionOnlyFull;

    if (this._summary && this._summary.length > 0) {
      const regionOnly = this._summary.find(r => r.region && r.region.toString().trim().toLowerCase() === regionLower && (!r.crop || r.crop === ''));
      if (regionOnly) return regionOnly;
    }

    // Attempt alias mapping for crop names (e.g., corn -> maize)
    const cropLower = (crop || '').toString().trim().toLowerCase();
    const canonicalCrop = CROP_ALIASES[cropLower] || cropLower;
    if (canonicalCrop !== cropLower) {
      // try exact with canonical name across datasets
      const tryKey = this._key(region, canonicalCrop);
      found = dataset.find(r => this._key(r.Region || r.region || r.RegionName, r.Crop || r.crop || r.CropName) === tryKey);
      if (found) return found;
    }

    // Fuzzy matching: score by crop + region similarity across dataset; pick best candidate above threshold
    let best = null;
    let bestScore = 0;
    const THRESHOLD = 0.65;
    const targetRegion = (region || '').toString().trim().toLowerCase();
    const targetCrop = (canonicalCrop || '').toString().trim().toLowerCase();
    for (const r of dataset) {
      const rRegion = (r.Region || r.region || r.RegionName || '').toString().trim().toLowerCase();
      const rCrop = (r.Crop || r.crop || r.CropName || '').toString().trim().toLowerCase();
      const regionScore = targetRegion ? similarity(targetRegion, rRegion) : 0.5;
      const cropScore = targetCrop ? similarity(targetCrop, rCrop) : 0.5;
      const score = (regionScore * 0.55) + (cropScore * 0.45); // slight preference to region
      if (score > bestScore) { bestScore = score; best = r; }
    }
    if (best && bestScore >= THRESHOLD) return best;

    // Nothing found
    return null;
  }
}

module.exports = new RegionCropService();
