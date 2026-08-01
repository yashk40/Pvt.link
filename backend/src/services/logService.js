import { db, FieldValue } from '../config/firebase.js';

export async function writeLog({ userId = null, deviceId = null, type, message, metadata = {} }) {
  await db.collection('logs').add({ userId, deviceId, type, message, metadata, createdAt: FieldValue.serverTimestamp() });
}
