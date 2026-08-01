import { Router } from 'express';
import { deleteDevice, listDevices, registerDevice, updateDevice } from '../controllers/deviceController.js';
import { authenticate } from '../middleware/auth.js';
const router = Router(); router.use(authenticate); router.post('/register', registerDevice); router.get('/', listDevices); router.patch('/:id', updateDevice); router.delete('/:id', deleteDevice);
export default router;
