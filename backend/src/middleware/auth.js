import jwt from 'jsonwebtoken';
import admin from '../config/firebase.js';
import { AppError } from '../utils/AppError.js';

// Firebase Auth is the single source of truth for user identity. We verify the
// Firebase ID token from the Authorization header and expose the Firebase UID
// as `req.user.sub`, which is what the rest of the app reads.
export async function authenticate(req, _res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.slice(7);
  if (!token) return next(new AppError('Authentication token is required', 401, 'AUTH_REQUIRED'));
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { sub: decoded.uid, email: decoded.email ?? null, name: decoded.name ?? null };
    return next();
  } catch {
    return next(new AppError('Invalid or expired access token', 401, 'INVALID_TOKEN'));
  }
}

export function authenticateAgent(req, _res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.slice(7);
  if (!token) return next(new AppError('Agent token is required', 401, 'AGENT_REQUIRED'));
  try {
    const agent = jwt.verify(token, process.env.JWT_AGENT_SECRET);
    if (agent.type !== 'device-agent') throw new Error('Invalid agent token');
    req.agent = agent;
    return next();
  } catch {
    return next(new AppError('Invalid or expired agent token', 401, 'INVALID_AGENT_TOKEN'));
  }
}
