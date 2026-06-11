// import-recipes.js
// Run once with Node.js to load all 669 recipes into Firestore.
//
// SETUP:
//   1. npm install firebase-admin
//   2. Download your Firebase service account key:
//      Firebase Console → Project Settings → Service Accounts → Generate new private key
//      Save it as serviceAccountKey.json in this folder
//   3. node import-recipes.js

import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

const recipes = JSON.parse(readFileSync('./gfg_recipes.json', 'utf8'));

console.log(`Importing ${recipes.length} recipes…`);

// Firestore batches are limited to 500 ops each
const BATCH_SIZE = 400;
let imported = 0;

for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
  const batch = db.batch();
  const chunk = recipes.slice(i, i + BATCH_SIZE);

  chunk.forEach(recipe => {
    const ref = db.collection('recipes').doc(recipe.id);
    // Clean up: remove the local id field (Firestore uses doc ID)
    const { id, ...data } = recipe;
    data.createdAt = new Date().toISOString();
    batch.set(ref, data);
  });

  await batch.commit();
  imported += chunk.length;
  console.log(`  ${imported}/${recipes.length} imported…`);
}

console.log('✅ Import complete!');
process.exit(0);
