import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import admin, { db, FieldValue } from '../config/firebase.js';
import { writeLog } from '../services/logService.js';

const deviceSockets = new Map(); // deviceId -> socket.id
const allowedCommands = new Set(['lock', 'unlock', 'restart', 'shutdown', 'sleep', 'screenshot', 'webcam']);
const origins = (process.env.CLIENT_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
const IMGHOSTING_UPLOAD_URL = 'https://api.imghosting.in/upload';

async function uploadScreenshot(result) {
  if (!result?.imageBase64) return { ...result, imageAvailable: false };

  const apiKey = process.env.IMGHOSTING_API_KEY;
  if (!apiKey) {
    const { imageBase64, ...metadata } = result;
    return { ...metadata, imageAvailable: true, imageBase64 };
  }

  try {
    const imageBuffer = Buffer.from(result.imageBase64, 'base64');
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer], { type: result.mimeType || 'image/jpeg' }), 'screenshot.jpg');

    const response = await fetch(IMGHOSTING_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'X-Free-API-Key': apiKey,
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    const imageUrl = data?.data?.url || data?.url || data?.result?.url || data?.result?.data?.url || null;

    if (!response.ok || !imageUrl) {
      throw new Error(data?.message || data?.error || 'Image upload failed');
    }

    const { imageBase64, ...metadata } = result;
    return { ...metadata, imageUrl, imageAvailable: true };
  } catch (error) {
    console.warn('Screenshot upload failed, falling back to base64 delivery:', error.message);
    const { imageBase64, ...metadata } = result;
    return { ...metadata, imageAvailable: true, imageBase64 };
  }
}

export const getConnectedDeviceIds = () => [...deviceSockets.keys()];
export const isDeviceOnline = (deviceId) => deviceSockets.has(deviceId);
// Emit an event to the live socket of a specific device (e.g. pairing pushes).
export const emitToDevice = (io, deviceId, event, payload) => {
  const socketId = deviceSockets.get(deviceId);
  if (socketId) io.sockets.sockets.get(socketId)?.emit(event, payload);
};

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, { maxHttpBufferSize: 8e6, cors: { origin: origins.length ? origins : false, methods: ['GET', 'POST'], credentials: true } });
  io.use(async (socket, next) => {
    try {
      const { token, agentToken } = socket.handshake.auth || {};
      if (agentToken) {
        const agent = jwt.verify(agentToken, process.env.JWT_AGENT_SECRET);
        if (agent.type !== 'device-agent') throw new Error('Invalid agent token');
        socket.agent = agent;
      } else {
        if (!token) throw new Error('Token is required');
        // Firebase Auth is the single source of truth for users.
        const decoded = await admin.auth().verifyIdToken(token);
        socket.user = { sub: decoded.uid, email: decoded.email ?? null, name: decoded.name ?? null };
      }
      next();
    } catch { next(new Error('Unauthorized socket connection')); }
  });

  io.on('connection', (socket) => {
    console.log(`[sock] CONNECT id=${socket.id} agent=${socket.agent?.deviceId ?? '-'} user=${socket.user?.sub ?? '-'}`);
    if (socket.user) socket.join(`user:${socket.user.sub}`);
    socket.on('device:identify', async ({ deviceId } = {}, acknowledge = () => {}) => {
      try {
        if (typeof deviceId !== 'string') throw new Error('deviceId is required');
        const ref = db.collection('devices').doc(deviceId); const doc = await ref.get();
        if (!doc.exists) throw new Error('Device is not registered');
        const userOwns = !socket.agent && ((doc.data().userIds || []).includes(socket.user.sub) || doc.data().userId === socket.user.sub);
        if (socket.agent ? socket.agent.deviceId !== deviceId : !userOwns) throw new Error('Device access denied');
        const oldSocket = deviceSockets.get(deviceId); if (oldSocket && oldSocket !== socket.id) io.sockets.sockets.get(oldSocket)?.disconnect(true);
        deviceSockets.set(deviceId, socket.id); socket.data.deviceId = deviceId;
        const ownerIds = [...(doc.data().userIds || [])]; if (doc.data().userId) ownerIds.push(doc.data().userId);
        for (const ownerId of ownerIds) socket.join(`user:${ownerId}`);
        await ref.update({ status: 'online', lastSeen: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
        for (const ownerId of ownerIds) io.to(`user:${ownerId}`).emit('device:online', { deviceId });
        acknowledge({ ok: true, heartbeatIntervalMs: 30000 });
        console.log(`[sock] IDENTIFY OK device=${deviceId} socket=${socket.id} owners=${ownerIds.length}`);
      } catch (error) { acknowledge({ ok: false, error: error.message }); console.log(`[sock] IDENTIFY FAIL device=${deviceId} socket=${socket.id} error=${error.message}`); }
    });

    socket.on('device:heartbeat', async (acknowledge = () => {}) => {
      if (!socket.data.deviceId) return acknowledge({ ok: false, error: 'Identify device first' });
      await db.collection('devices').doc(socket.data.deviceId).update({ status: 'online', lastSeen: FieldValue.serverTimestamp() }); acknowledge({ ok: true });
    });

    socket.on('command:acknowledge', async ({ commandId, status, result = null } = {}, acknowledge = () => {}) => {
      if (!socket.data.deviceId || !commandId || !['completed', 'failed'].includes(status)) return acknowledge({ ok: false, error: 'Invalid acknowledgement' });
      const ref = db.collection('commands').doc(commandId); const command = await ref.get();
      if (!command.exists || command.data().deviceId !== socket.data.deviceId) return acknowledge({ ok: false, error: 'Command not found' });
      const ownerId = command.data().userId;
      const storedResult = await uploadScreenshot(result);
      await ref.update({ status, result: storedResult, completedAt: FieldValue.serverTimestamp() });
      io.to(`user:${ownerId}`).emit('command:status', { commandId, deviceId: socket.data.deviceId, status, result: storedResult }); acknowledge({ ok: true });
    });

    socket.on('disconnect', async (reason) => {
      console.log(`[sock] DISCONNECT id=${socket.id} device=${socket.data.deviceId ?? '-'} reason=${reason}`);
      const deviceId = socket.data.deviceId; if (!deviceId || deviceSockets.get(deviceId) !== socket.id) return;
      deviceSockets.delete(deviceId);
      try {
        await db.collection('devices').doc(deviceId).update({ status: 'offline', lastSeen: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
        const device = await db.collection('devices').doc(deviceId).get();
        const data = device.data() || {};
        const ownerIds = [...(data.userIds || [])]; if (data.userId) ownerIds.push(data.userId);
        for (const ownerId of ownerIds) io.to(`user:${ownerId}`).emit('device:offline', { deviceId });
        await writeLog({ userId: data.userId, deviceId, type: 'DEVICE_OFFLINE', message: 'Device socket disconnected' });
      } catch (error) { console.error('Failed to process socket disconnect', error); }
    });
  });
  return io;
}

export function dispatchCommand(io, command) {
  if (!allowedCommands.has(command.type)) throw new Error('Unsupported command');
  const socketId = deviceSockets.get(command.deviceId);
  if (!socketId) return false;
  const { id, deviceId, type, payload } = command;
  io.to(socketId).emit('command:receive', { id, deviceId, type, payload }); return true;
}
