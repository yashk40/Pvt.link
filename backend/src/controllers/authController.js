import { asyncHandler } from '../utils/AppError.js';

// Firebase Auth is the single source of truth for identity. User registration,
// login and token refresh are handled by Firebase itself, so this controller no
// longer manages its own users collection or JWT access/refresh tokens.

export const profile = asyncHandler(async (req, res) => {
  // Identity comes from the verified Firebase ID token attached by `authenticate`.
  res.json({ user: { id: req.user.sub, email: req.user.email, name: req.user.name, createdAt: null } });
});
