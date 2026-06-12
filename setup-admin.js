// setup-admin.js
// Run ONCE after import-recipes.js to create Rod's admin profile in Firestore.
// This links his existing Firebase Auth account to his user profile with admin role.
//
// Run with: node setup-admin.js

import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });

const db   = getFirestore();
const auth = getAuth();

const ADMIN_EMAIL = 'rod@gourmetforgood.com';

try {
  // Look up Rod's UID from Firebase Auth
  const user = await auth.getUserByEmail(ADMIN_EMAIL);
  console.log(`Found user: ${user.uid}`);

  // Write his profile to Firestore
  await db.collection('users').doc(user.uid).set({
    firstName: 'Rod',
    lastName:  'Salyer',
    email:     ADMIN_EMAIL,
    role:      'admin',
    createdAt: new Date().toISOString()
  });

  console.log('✅ Admin profile created for Rod Salyer');
  console.log('   You can now sign in at https://radslayer.github.io/GFG/');
} catch (e) {
  console.error('Error:', e.message);
  console.log('Make sure rod@gourmetforgood.com exists in Firebase Authentication first.');
}

process.exit(0);
