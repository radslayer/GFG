import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const cbSnap = await db.collection('cookbooks').get();
console.log('Cookbooks collection count:', cbSnap.docs.length);
cbSnap.docs.forEach(d => console.log(' -', d.id, JSON.stringify(d.data())));

if (cbSnap.docs.length > 0) {
  for (const cb of cbSnap.docs) {
    const recipeSnap = await db.collection('cookbooks').doc(cb.id).collection('recipes').get();
    console.log('  Recipes in', cb.id, ':', recipeSnap.docs.length);
  }
}
process.exit(0);
