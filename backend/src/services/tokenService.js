import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db, FieldValue, Timestamp } from '../config/firebase.js';
import { AppError } from '../utils/AppError.js';

const accessOptions = { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30d' };
const refreshOptions = { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' };
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');

export function createAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_ACCESS_SECRET, accessOptions);
}

export async function createRefreshToken(user, metadata = {}) {
  const token = jwt.sign({ sub: user.id, nonce: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET, refreshOptions);
  const decoded = jwt.decode(token);
  await db.collection('sessions').add({
    userId: user.id, tokenHash: hash(token), userAgent: metadata.userAgent || null, ip: metadata.ip || null,
    expiresAt: Timestamp.fromMillis(decoded.exp * 1000), revokedAt: null, createdAt: FieldValue.serverTimestamp(),
  });
  return token;
}

export async function rotateRefreshToken(token, metadata) {
  let claims;
  try { claims = jwt.verify(token, process.env.JWT_REFRESH_SECRET); }
  catch { throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN'); }
  const snapshot = await db.collection('sessions').where('tokenHash', '==', hash(token)).limit(1).get();
  if (snapshot.empty || snapshot.docs[0].data().revokedAt) throw new AppError('Refresh token has been revoked', 401, 'INVALID_REFRESH_TOKEN');
  await snapshot.docs[0].ref.update({ revokedAt: FieldValue.serverTimestamp() });
  const userDoc = await db.collection('users').doc(claims.sub).get();
  if (!userDoc.exists) throw new AppError('User no longer exists', 401, 'INVALID_REFRESH_TOKEN');
  const user = { id: userDoc.id, ...userDoc.data() };
  return { accessToken: createAccessToken(user), refreshToken: await createRefreshToken(user, metadata) };
}
