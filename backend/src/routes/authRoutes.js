import { Router } from 'express';
import { profile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.get('/profile', authenticate, profile);
export default router;
