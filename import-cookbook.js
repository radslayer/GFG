// import-cookbook.js
// Imports any Cook'n .dvo export into Firestore as a separate cookbook.
// Admins can browse it in the app and "Graduate" recipes to GFG.
//
// Usage: node import-cookbook.js path/to/COOKBOOK.dvo
// Example: node import-cookbook.js "The Ultimate Cookn Cookbook.dvo"

import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const dvoPath = process.argv[2];
if (!dvoPath) {
  console.error('Usage: node import-cookbook.js path/to/COOKBOOK.dvo');
  process.exit(1);
}

// Extract the .dvo zip to a temp directory
const tmpDir = path.join(os.tmpdir(), 'dvo_import_' + Date.now());
mkdirSync(tmpDir, { recursive: true });
execSync(`unzip -o "${dvoPath}" -d "${tmpDir}"`);

// Load extracted files
const recipes   = JSON.parse(readFileSync(path.join(tmpDir, 'recipes.json'), 'utf8'));
const foods     = JSON.parse(readFileSync(path.join(tmpDir, 'foods.json'), 'utf8'));
const units     = JSON.parse(readFileSync(path.join(tmpDir, 'units.json'), 'utf8'));
const chapters  = JSON.parse(readFileSync(path.join(tmpDir, 'chapters.json'), 'utf8'));
const cookbooks = JSON.parse(readFileSync(path.join(tmpDir, 'cookbooks.json'), 'utf8'));

// Build lookups
const foodMap    = Object.fromEntries(foods.map(f => [f.ID, f.NAME]));
const unitMap    = Object.fromEntries(units.map(u => [u.ID, u.SINGULAR || '']));
const chapterMap = Object.fromEntries(chapters.map(c => [c.ID, c.TITLE]));
const cbTitle    = cookbooks[0]?.TITLE || path.basename(dvoPath, '.dvo');

console.log(`Importing: "${cbTitle}" (${recipes.length} recipes)`);

// Parse recipes
function parseDvo(r) {
  const ings = (r.ingredients || [])
    .sort((a, b) => a.DISPLAY_ORDER - b.DISPLAY_ORDER)
    .map(i => {
      const fname = foodMap[i.INGREDIENT_FOOD_ID] || '';
      const uname = unitMap[i.AMOUNT_UNIT] || '';
      const pre   = (i.PRE_QUALIFIER || '').trim();
      const post  = (i.POST_QUALIFIER || '').trim();
      const name  = [pre, fname, post].filter(Boolean).join(' ');
      return name ? {
        type: 'ingredient',
        qty:  (i.AMOUNT_QTY_STRING || '').trim(),
        unit: uname,
        name,
        preparation: ''
      } : null;
    })
    .filter(Boolean);

  return {
    name:        r.TITLE.trim(),
    servings:    String(r.SERVES || r.YIELD || '').trim(),
    categories:  [chapterMap[r.PARENT] || 'Uncategorized'],
    ingredients: ings,
    directions:  (r.INSTRUCTIONS || '').trim(),
    note:        (r.DESCRIPTION || '').trim(),
    author:      '',
    dataSource:  cbTitle,
    createdAt:   new Date().toISOString()
  };
}

const parsed = recipes.map(parseDvo);

// Create or update the cookbook document in Firestore
const cbId = cbTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
await db.collection('cookbooks').doc(cbId).set({
  title:     cbTitle,
  isGFG:     false,
  adminOnly: true,
  importedAt: new Date().toISOString(),
  recipeCount: parsed.length
});

console.log(`Created cookbook: ${cbId}`);

// Import recipes into cookbooks/{cbId}/recipes subcollection
const BATCH_SIZE = 400;
let count = 0;

for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
  const batch = db.batch();
  const chunk = parsed.slice(i, i + BATCH_SIZE);
  chunk.forEach((recipe, j) => {
    const recipeId = `recipe_${String(i + j + 1).padStart(4, '0')}`;
    batch.set(db.collection('cookbooks').doc(cbId).collection('recipes').doc(recipeId), recipe);
  });
  await batch.commit();
  count += chunk.length;
  console.log(`  ${count}/${parsed.length} imported…`);
}

console.log(`\n✅ Import complete!`);
console.log(`   Cookbook: "${cbTitle}"`);
console.log(`   Firestore path: cookbooks/${cbId}/recipes`);
console.log(`   Recipes: ${parsed.length}`);
console.log(`\n   Reload the app to see the new cookbook tab.`);
process.exit(0);
