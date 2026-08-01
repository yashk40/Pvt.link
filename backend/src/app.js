import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import pairRoutes from './routes/pairRoutes.js';
import commandRoutes from './routes/commandRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const origins = (process.env.CLIENT_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
const app = express();
app.set('trust proxy', 1);
app.use(helmet());
// Allow configured origins plus any `http://localhost:<port>` origin. The Expo
// web build (react-native-web) runs on an arbitrary localhost port (8081, 8082,
// …) and its browser requests carry that port as the Origin, so a fixed list
// breaks as soon as the dev port changes. Native apps send no Origin header at
// all and are unaffected.
app.use(cors({
  origin(origin, callback) {
    if (!origin || origins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false }), authRoutes);
app.use('/devices', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }), deviceRoutes);
app.use('/pair', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false }), pairRoutes); app.use('/commands', commandRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'pvtlink-backend', time: new Date().toISOString() }));
app.use(notFound); app.use(errorHandler);
export default app;
