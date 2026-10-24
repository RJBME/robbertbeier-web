// Built-in Bambu Lab color list for the Filament Tracker's "Find a Bambu color" search.
// Picking one fills in the name, code, material and swatch of a new color.
// Swatch hexes are close approximations of Bambu's colors, not official values. Codes are filled in
// only where known (PLA Basic series, plus codes confirmed on receipts); a blank code means "add it
// from the receipt" — the color is still searchable by name. To add more: [code, name, hex, hex2?].
const BAMBU_CATALOG = (function () {
  const groups = {
    'PLA Basic': [
      ['10100', 'Jade White', '#F4F4F0'], ['10101', 'Black', '#111111'], ['10102', 'Silver', '#A6A9AA'],
      ['10103', 'Gray', '#8E9089'], ['10104', 'Light Gray', '#D1D3D5'], ['10105', 'Dark Gray', '#545454'],
      ['10200', 'Red', '#C12E1F'], ['10201', 'Beige', '#F7E6DE'], ['10202', 'Magenta', '#EC008C'],
      ['10203', 'Pink', '#F55A74'], ['10204', 'Hot Pink', '#F5547C'], ['10205', 'Maroon Red', '#9D2235'],
      ['10300', 'Orange', '#FF6A13'], ['10301', 'Pumpkin Orange', '#FF9016'],
      ['10400', 'Yellow', '#F4EE2A'], ['10401', 'Gold', '#E4BD68'], ['10402', 'Sunflower Yellow', '#FEC600'],
      ['10501', 'Bambu Green', '#00AE42'], ['10502', 'Mistletoe Green', '#3F8E43'], ['10503', 'Bright Green', '#BECF00'],
      ['10601', 'Blue', '#0A2989'], ['10602', 'Blue Gray', '#5B6579'], ['10603', 'Cyan', '#0086D6'],
      ['10604', 'Cobalt Blue', '#0056B8'], ['10605', 'Turquoise', '#00B1B7'],
      ['10700', 'Purple', '#5E43B7'], ['10701', 'Indigo Purple', '#482960'],
      ['10800', 'Brown', '#9D432C'], ['10801', 'Bronze', '#847D48'], ['10802', 'Cocoa Brown', '#6F5034']
    ],
    'PLA Matte': [
      ['11100', 'Ivory White', '#FFFFF0'], ['11101', 'Charcoal', '#3A3A3C'], ['', 'Bone White', '#CBC6B8'],
      ['', 'Ash Gray', '#9B9EA0'], ['', 'Nardo Gray', '#757575'], ['', 'Desert Tan', '#E8DBB7'],
      ['', 'Latte Brown', '#D3B7A7'], ['', 'Caramel', '#AE835B'], ['', 'Dark Brown', '#7D6556'],
      ['', 'Terracotta', '#B15533'], ['', 'Mandarin Orange', '#F99963'], ['', 'Lemon Yellow', '#F7D959'],
      ['11201', 'Sakura Pink', '#E8AFCF'], ['', 'Scarlet Red', '#DE4343'], ['', 'Dark Red', '#BB3D43'],
      ['', 'Plum', '#950051'], ['', 'Lilac Purple', '#AE96D4'], ['', 'Apple Green', '#C2E189'],
      ['', 'Grass Green', '#61C680'], ['', 'Dark Green', '#68724D'], ['', 'Ice Blue', '#A3D8E1'],
      ['', 'Sky Blue', '#56B7E6'], ['', 'Marine Blue', '#0078BF'], ['', 'Dark Blue', '#042F56']
    ],
    'PLA Silk Multi-Color': [
      ['13902', 'Midnight Blaze', '#1D3FBF', '#C8102E'], ['13916', 'Phantom Blue', '#00629B', '#1A1A1A'],
      ['', 'Dawn Radiance', '#F9C3D3', '#F8E08E'], ['', 'Aurora Purple', '#7F3696', '#0091A6'],
      ['', 'South Beach', '#F7A8C4', '#3FC1C9'], ['', 'Neon City', '#E62E8C', '#1F4FE0'],
      ['', 'Gilded Rose', '#C9A227', '#C2185B'], ['', 'Blue Hawaii', '#1E88E5', '#43A047'],
      ['', 'Velvet Eclipse', '#1A1A1A', '#B71C1C']
    ],
    'PLA Silk+': [
      ['', 'Gold', '#D4AF37'], ['', 'Silver', '#C0C2C4'], ['', 'Titan Gray', '#5F6367'], ['', 'White', '#F5F5F5'],
      ['', 'Champagne', '#E8D3B0'], ['', 'Rose Gold', '#C9A296'], ['', 'Pink', '#F4A6C1'], ['', 'Candy Red', '#C8102E'],
      ['', 'Candy Green', '#118C4F'], ['', 'Mint', '#9FE2BF'], ['', 'Baby Blue', '#89CFF0'], ['', 'Blue', '#1F4FBF'],
      ['', 'Purple', '#7B3FA0']
    ],
    'PETG HF': [
      ['', 'Black', '#111111'], ['', 'White', '#F5F5F5'], ['', 'Gray', '#8E9089'], ['', 'Dark Gray', '#4A4A4A'],
      ['', 'Cream', '#F3E9D2'], ['', 'Peanut Brown', '#8D5B3E'], ['', 'Red', '#C62828'], ['', 'Orange', '#F57C00'],
      ['', 'Yellow', '#F9D23C'], ['', 'Lime Green', '#8BC34A'], ['', 'Green', '#2E9D4A'], ['', 'Forest Green', '#2F4F2F'],
      ['', 'Lake Blue', '#1F8FBF'], ['', 'Blue', '#1F4FBF']
    ],
    'Support for PLA': [['65104', 'Support for PLA', '#E9E6DA']]
  };
  const out = [];
  Object.entries(groups).forEach(([material, rows]) =>
    rows.forEach(([code, name, hex, hex2]) => out.push({ code, name, material, brand: 'Bambu Lab', hex, hex2: hex2 || '' })));
  return out;
})();

// Best matches for a search: code prefix first, then name/material words. Empty query → [].
function searchBambuCatalog(q, limit) {
  q = String(q || '').trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/);
  const scored = [];
  BAMBU_CATALOG.forEach(c => {
    const hay = (c.name + ' ' + c.material + ' ' + c.code).toLowerCase();
    if (!words.every(w => hay.includes(w))) return;
    let score = 0;
    if (c.code && c.code.startsWith(q)) score += 100;
    if (c.name.toLowerCase().startsWith(words[0])) score += 10;
    if (c.material === 'PLA Basic') score += 1;
    scored.push([score, c]);
  });
  return scored.sort((a, b) => b[0] - a[0]).slice(0, limit || 8).map(x => x[1]);
}
