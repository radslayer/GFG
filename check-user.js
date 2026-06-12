import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const auth = getAuth();

// Check Rod's user profile
const user = await auth.getUserByEmail('rod@gourmetforgood.com');
console.log('Auth UID:', user.uid);

const profile = await db.collection('users').doc(user.uid).get();
console.log('Firestore profile:', profile.data());

// Also check cookbooks
const cbs = await db.collection('cookbooks').get();
console.log('Cookbooks in Firestore:', cbs.docs.map(d => d.id));
process.exit(0);
