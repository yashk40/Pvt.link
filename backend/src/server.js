import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { createSocketServer } from './config/socket.js';
import { setCommandSocket } from './controllers/commandController.js';
import { setPairSocket } from './controllers/pairController.js';

// User auth is delegated to Firebase; only the desktop-agent secret is needed.
for (const name of ['JWT_AGENT_SECRET']) {
  if (!process.env[name] || process.env[name].length < 32) throw new Error(`${name} must be configured with at least 32 characters`);
}
const server = http.createServer(app); const io = createSocketServer(server); setCommandSocket(io); setPairSocket(io);
const port = Number(process.env.PORT || 5000);
server.listen(port, () => console.log(`Pvt.link backend listening on port ${port}`));

function shutdown(signal) {
  console.log(`${signal} received; closing server`); server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT')); process.on('SIGTERM', () => shutdown('SIGTERM'));
