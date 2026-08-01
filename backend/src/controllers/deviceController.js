import crypto from 'crypto';
import { db, FieldValue } from '../config/firebase.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { id, requireFields, string } from '../utils/validation.js';
import { writeLog } from '../services/logService.js';

const allowedInfo = ['os', 'deviceName', 'hostname', 'publicIp', 'localIp', 'cpu', 'ram'];
const cleanInfo = (source = {}) => Object.fromEntries(allowedInfo.filter((key) => source[key] !== undefined).map((key) => [key, String(source[key]).slice(0, 256)]));

export const registerDevice = asyncHandler(async (req, res) => {
  requireFields(req.body, ['deviceName', 'os']);
  const deviceId = req.body.deviceId ? id(req.body.deviceId, 'deviceId') : crypto.randomUUID();
  const ref = db.collection('devices').doc(deviceId); const current = await ref.get();
  if (current.exists && current.data().userId !== req.user.sub) throw new AppError('Device ID belongs to another user', 403, 'DEVICE_FORBIDDEN');
  const info = cleanInfo({ ...req.body.info, deviceName: req.body.deviceName, os: req.body.os });
  const device = { userId: req.user.sub, userIds: FieldValue.arrayUnion(req.user.sub), ...info, status: 'offline', lastSeen: null, updatedAt: FieldValue.serverTimestamp(), ...(current.exists ? {} : { createdAt: FieldValue.serverTimestamp() }) };
  await ref.set(device, { merge: true }); await writeLog({ userId: req.user.sub, deviceId, type: 'DEVICE_REGISTER', message: 'Device registered', metadata: { os: info.os } });
  res.status(current.exists ? 200 : 201).json({ device: { id: deviceId, ...device } });
});

export const listDevices = asyncHandler(async (req, res) => {
  const [legacy, multi] = await Promise.all([
    db.collection('devices').where('userId', '==', req.user.sub).get(),
    db.collection('devices').where('userIds', 'array-contains', req.user.sub).get(),
  ]);
  const map = new Map();
  for (const doc of [...legacy.docs, ...multi.docs]) map.set(doc.id, { id: doc.id, ...doc.data() });
  res.json({ devices: [...map.values()] });
});

const owns = (deviceData, uid) => (deviceData.userIds || []).includes(uid) || deviceData.userId === uid;

export const updateDevice = asyncHandler(async (req, res) => {
  const deviceId = id(req.params.id, 'deviceId'); const ref = db.collection('devices').doc(deviceId); const doc = await ref.get();
  if (!doc.exists) throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND'); if (!owns(doc.data(), req.user.sub)) throw new AppError('Device access denied', 403, 'DEVICE_FORBIDDEN');
  const update = cleanInfo(req.body); if (!Object.keys(update).length) throw new AppError('No valid device fields provided', 400, 'VALIDATION_ERROR');
  if (update.deviceName) update.deviceName = string(update.deviceName, 'deviceName', { min: 1, max: 128 }); update.updatedAt = FieldValue.serverTimestamp();
  await ref.update(update); res.json({ device: { id: deviceId, ...doc.data(), ...update } });
});

export const deleteDevice = asyncHandler(async (req, res) => {
  const deviceId = id(req.params.id, 'deviceId'); const ref = db.collection('devices').doc(deviceId); const doc = await ref.get();
  if (!doc.exists) throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND'); if (!owns(doc.data(), req.user.sub)) throw new AppError('Device access denied', 403, 'DEVICE_FORBIDDEN');
  await ref.delete(); await writeLog({ userId: req.user.sub, deviceId, type: 'DEVICE_DELETE', message: 'Device deleted' }); res.status(204).end();
});
