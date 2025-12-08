// Usage: node import_region_crop_xlsx.js /path/to/file.xlsx
// Requires package: xlsx (npm i xlsx)
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const inputPath = process.argv[2] || path.join(process.env.USERPROFILE || '', 'Downloads', 'cameroon_region_crop_fertilizer_pests.xlsx');
const outDir = path.join(__dirname, '..', 'data');
const outPath = path.join(outDir, 'region_crop_data.json');

function normalizeCell(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function main() {
  if (!fs.existsSync(inputPath)) {
    console.error('Input file not found:', inputPath);
    process.exit(1);
  }

  const wb = xlsx.readFile(inputPath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  // Normalized summary rows (common fields)
  const out = rows.map(r => {
    const region = normalizeCell(r.Region || r.region || r.RegionName || r.RegionName);
    const crop = normalizeCell(r.Crop || r.crop || r.CropName || r.CropName);

    // Build fertilizer recommendation from N/P/K columns if available
    const n = r.N_kg_per_ha || r.N || r.N_kg || '';
    const p = r.P2O5_kg_per_ha || r.P || r.P_kg || '';
    const k = r.K2O_kg_per_ha || r.K || r.K_kg || '';
    const split = r.Split_Timing || r.SplitTiming || r.Split || r.Split_Timing || '';
    const method = r.Application_Method || r.ApplicationMethod || r.Application_Method || '';

    const fertilizerParts = [];
    if (n !== '' && n !== null && n !== undefined) fertilizerParts.push(`N ${n} kg/ha`);
    if (p !== '' && p !== null && p !== undefined) fertilizerParts.push(`P2O5 ${p} kg/ha`);
    if (k !== '' && k !== null && k !== undefined) fertilizerParts.push(`K2O ${k} kg/ha`);
    if (split) fertilizerParts.push(`Timing: ${normalizeCell(split)}`);
    if (method) fertilizerParts.push(`Method: ${normalizeCell(method)}`);
    const fertilizer = fertilizerParts.join('; ');

    // Pests, diseases and control methods from the raw columns
    const pests = normalizeCell(r.Common_Pests || r.CommonPests || r['Common_Pests'] || r.Common_Pests || r.Common_Pests || r.Common_Pests || r.Common_Pests || r.Common_Pests || r.Common_Pests || r.Common_Pests || r.Common_Pests || r.Common_Pests || r.Common_Pests || r.Common_Pests || r.Common_Pests || r.Common_Pests || r.Common_Pests || r.Common_Pests || r.Common_Pests || r.Common_Pests || r['Common_Pests'] || r['Common pests'] || r.Pests || r.PestList || r.Pests || '');
    const diseases = normalizeCell(r.Common_Diseases || r.CommonDiseases || r['Common_Diseases'] || r.Common_Diseases || r.Common_Diseases || r.Common_Diseases || r.Common_Diseases || r.Common_Diseases || r.Common_Diseases || r.Common_Diseases || r.Common_Diseases || r.Common_Diseases || r.Common_Diseases || r.Common_Diseases || r.Common_Diseases || r.Common_Diseases || r.Common_Diseases || r.Common_Diseases || r['Common_Diseases'] || r.Diseases || r.Disease || '');
    const pest_control = normalizeCell(r.Pest_Control_Methods || r.PestControlMethods || r.Pest_Control || r.Pest_Control_Methods || r.Pest_Control_Methods || r.Pest_Control_Methods || r.PestControl || r.PestControlMethods || r.Pest_Control || r.Pest_Control_Methods || r.Easy_Treatments || r.Easy_Treatment || r['Pest_Control_Methods'] || r['Pest Control'] || '');
    const notes = normalizeCell(r.Notes || r.notes || r.Remarks || r.Notes_Remarks || r.Remark || r.Adaptation_Notes || r.Soil_Type_Notes || '');

    return {
      region,
      crop,
      fertilizer,
      pests,
      diseases,
      pest_control,
      notes
    };
  });

  // Also write a full/raw export containing every column exactly as read from the sheet
  const fullOutPath = path.join(outDir, 'region_crop_full.json');
  const fullRows = rows.map(r => {
    // Normalize all keys to strings and trim values
    const obj = {};
    Object.keys(r).forEach(k => {
      const v = r[k];
      obj[k] = v === undefined || v === null ? '' : (typeof v === 'string' ? v.trim() : v);
    });
    return obj;
  });

  // Also expose the discovered column names for inspection
  const columns = Array.from(new Set(rows.flatMap(r => Object.keys(r))));

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  fs.writeFileSync(fullOutPath, JSON.stringify(fullRows, null, 2), 'utf8');
  // Write discovered column names
  fs.writeFileSync(path.join(outDir, 'region_crop_columns.json'), JSON.stringify(columns, null, 2), 'utf8');

  console.log('Wrote', outPath, 'with', out.length, 'normalized entries');
  console.log('Wrote', fullOutPath, 'with', fullRows.length, 'raw entries');
  console.log('Columns discovered:', columns.length, ' — sample:', columns.slice(0, 12));
}

main();
