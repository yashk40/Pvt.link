import { db, FieldValue } from '../config/firebase.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { id, requireFields, string } from '../utils/validation.js';
import { dispatchCommand, isDeviceOnline } from '../sockets/socketServer.js';
import { writeLog } from '../services/logService.js';

const valid = new Set(['lock', 'unlock', 'restart', 'shutdown', 'sleep', 'screenshot', 'webcam']);
const owns = (deviceData, uid) => (deviceData.userIds || []).includes(uid) || deviceData.userId === uid;
let io;
export const setCommandSocket = (server) => { io = server; };

export const sendCommand = asyncHandler(async (req, res) => {
  requireFields(req.body, ['deviceId', 'type']); const deviceId = id(req.body.deviceId, 'deviceId'); const type = string(req.body.type, 'type', { max: 32 }).toLowerCase();
  if (!valid.has(type)) throw new AppError('Unsupported command type', 400, 'COMMAND_INVALID');
  const device = await db.collection('devices').doc(deviceId).get();
  if (!device.exists || !owns(device.data(), req.user.sub)) throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
  const ref = db.collection('commands').doc(); const command = { id: ref.id, userId: req.user.sub, deviceId, type, payload: req.body.payload && typeof req.body.payload === 'object' ? req.body.payload : {}, status: isDeviceOnline(deviceId) ? 'sent' : 'pending', createdAt: FieldValue.serverTimestamp(), completedAt: null };
  await ref.set(command); const delivered = io && dispatchCommand(io, command);
  await writeLog({ userId: req.user.sub, deviceId, type: 'COMMAND_SENT', message: `${type} command queued`, metadata: { commandId: ref.id, delivered: Boolean(delivered) } });
  res.status(202).json({ command: { ...command, status: delivered ? 'sent' : 'pending' } });
});

export const commandHistory = asyncHandler(async (req, res) => {
  // Read only this user's commands via the auto-created single-field `userId`
  // index (avoids the composite `userId ASC, createdAt DESC` index that
  // Firestore does NOT auto-create), then sort newest-first in memory.
  const snapshot = await db.collection('commands').where('userId', '==', req.user.sub).get();
  const commands = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  commands.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? (a.createdAt?.seconds ?? 0) * 1000;
    const tb = b.createdAt?.toMillis?.() ?? (b.createdAt?.seconds ?? 0) * 1000;
    return tb - ta;
  });
  res.json({ commands: commands.slice(0, 100) });
});
