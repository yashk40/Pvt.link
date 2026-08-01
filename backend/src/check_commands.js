import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  })
});

const db = admin.firestore();

try {
  const snapshot = await db.collection('commands').orderBy('createdAt', 'desc').limit(5).get();
  console.log(`Recent commands: ${snapshot.size}`);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`Command ID: ${doc.id}`);
    console.log(`  Type: ${data.type}`);
    console.log(`  Status: ${data.status}`);
    console.log(`  User ID: ${data.userId}`);
    console.log(`  Device ID: ${data.deviceId}`);
    console.log(`  Created At: ${data.createdAt?.toDate()}`);
    console.log(`  Completed At: ${data.completedAt?.toDate()}`);
    console.log(`  Result: ${JSON.stringify(data.result)}`);
    console.log('---');
  });
} catch (err) {
  console.error(err);
}

process.exit(0);
