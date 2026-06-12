// update-recipes.js
// Updates Firestore with the merged DVO + existing recipe data.
// - Updates ingredients for recipes missing them
// - Adds new recipes not already in Firestore
// - Leaves notes, manual edits, archived status untouched
//
// Run with: node update-recipes.js

import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const merged = JSON.parse(readFileSync('./gfg_recipes_merged.json', 'utf8'));
console.log(`Loaded ${merged.length} merged recipes`);

// Get all existing Firestore recipes
console.log('Fetching existing Firestore recipes...');
const snap = await db.collection('recipes').get();
const existing = {};
snap.docs.forEach(d => {
  const name = (d.data().name || '').toUpperCase().trim();
  existing[name] = { id: d.id, ...d.data() };
});
console.log(`Found ${Object.keys(existing).length} existing recipes in Firestore`);

let updated = 0;
let added = 0;
let skipped = 0;
const BATCH_SIZE = 400;

// Split into batches
for (let i = 0; i < merged.length; i += BATCH_SIZE) {
  const batch = db.batch();
  const chunk = merged.slice(i, i + BATCH_SIZE);

  for (const recipe of chunk) {
    const key = recipe.name.toUpperCase().trim();
    const existing_r = existing[key];

    if (existing_r) {
      // Recipe exists — only update if it's missing ingredients
      const hasIng = (existing_r.ingredients || []).some(i => i.type === 'ingredient');
      const newHasIng = (recipe.ingredients || []).some(i => i.type === 'ingredient');

      if (!hasIng && newHasIng) {
        // Fill in missing ingredients, update category if it was Uncategorized
        const updateData = {
          ingredients: recipe.ingredients,
          dataSource: recipe.dataSource,
          updatedAt: new Date().toISOString()
        };
        if ((existing_r.categories || ['Uncategorized'])[0] === 'Uncategorized' &&
            recipe.categories[0] !== 'Uncategorized') {
          updateData.categories = recipe.categories;
        }
        batch.update(db.collection('recipes').doc(existing_r.id), updateData);
        updated++;
      } else {
        skipped++;
      }
    } else {
      // New recipe — add it
      const { id, ...data } = recipe;
      const newId = 'recipe_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
      batch.set(db.collection('recipes').doc(newId), {
        ...data,
        createdAt: new Date().toISOString()
      });
      added++;
    }
  }

  await batch.commit();
  console.log(`  Processed ${Math.min(i + BATCH_SIZE, merged.length)}/${merged.length}...`);
}

console.log('\n✅ Update complete!');
console.log(`   Updated (ingredients added): ${updated}`);
console.log(`   New recipes added: ${added}`);
console.log(`   Skipped (already complete): ${skipped}`);
process.exit(0);
