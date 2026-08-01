import { Router } from 'express';
import { commandHistory, sendCommand } from '../controllers/commandController.js';
import { authenticate } from '../middleware/auth.js';
const router = Router(); router.use(authenticate);
for (const type of ['lock', 'unlock', 'restart', 'shutdown', 'sleep', 'screenshot', 'webcam']) router.post(`/${type}`, (req, _res, next) => { req.body.type = type; next(); }, sendCommand);
router.get('/history', commandHistory); export default router;
