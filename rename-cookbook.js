import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

await db.collection('cookbooks').doc('the_ultimate_cook_n_cookbook').update({
  title: 'Brainstorming'
});
console.log('✅ Renamed to Brainstorming');
process.exit(0);
