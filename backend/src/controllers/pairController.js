import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db, FieldValue, Timestamp } from '../config/firebase.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { id, requireFields, pairCode } from '../utils/validation.js';
import { emitToDevice } from '../sockets/socketServer.js';

let io;
export const setPairSocket = (server) => { io = server; };

const newCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();
const PAIR_CODE_TTL_MS = 2 * 60 * 1000;

// Owner details are captured at pairing time (Firebase Auth is the source of
// truth), so we read them from the device doc rather than a users store.
const getDeviceOwners = (deviceData) => deviceData.owners || [];

const isOwner = (deviceData, uid) =>
  (deviceData.userIds || []).includes(uid) || (deviceData.userId && deviceData.userId === uid);

const issuePairCode = async (deviceId, userId = null) => {
  const expiresAtMillis = Date.now() + PAIR_CODE_TTL_MS;
  let code;
  do { code = newCode(); } while ((await db.collection('pairCodes').doc(code).get()).exists);
  await db.collection('pairCodes').doc(code).set({
    deviceId, userId, expiresAtMillis, expiresAt: Timestamp.fromMillis(expiresAtMillis), usedAt: null, createdAt: FieldValue.serverTimestamp(),
  });
  return { code, expiresAtMillis };
};

// A desktop creates this short-lived session before it has an account owner.
export const createDesktopSession = asyncHandler(async (req, res) => {
  requireFields(req.body, ['deviceName', 'os']);
  const deviceId = crypto.randomUUID();
  const device = {
    userId: null, userIds: [], owners: [], status: 'offline',
    deviceName: String(req.body.deviceName).slice(0, 128), os: String(req.body.os).slice(0, 32),
    hostname: String(req.body.hostname || '').slice(0, 128), cpu: String(req.body.cpu || '').slice(0, 256), ram: String(req.body.ram || '').slice(0, 128),
    localIp: String(req.body.localIp || '').slice(0, 64), publicIp: req.ip || null, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), lastSeen: null,
  };
  await db.collection('devices').doc(deviceId).set(device);
  const { code, expiresAtMillis } = await issuePairCode(deviceId);
  const agentToken = jwt.sign({ type: 'device-agent', deviceId }, process.env.JWT_AGENT_SECRET, { expiresIn: '180d' });
  res.status(201).json({ deviceId, pairCode: code, agentToken, expiresAt: new Date(expiresAtMillis).toISOString(), owners: [], paired: false });
});

// Desktop refreshes the code it shows on screen. Always returns a fresh code,
// whether or not the device is already paired (pairing persists regardless).
export const refreshDesktopPairCode = asyncHandler(async (req, res) => {
  const deviceId = req.agent.deviceId;
  const device = await db.collection('devices').doc(deviceId).get();
  if (!device.exists) throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
  const owners = getDeviceOwners(device.data());
  const { code, expiresAtMillis } = await issuePairCode(deviceId);
  res.status(201).json({ deviceId, pairCode: code, expiresAt: new Date(expiresAtMillis).toISOString(), owners, paired: owners.length > 0 });
});

// Read pairing state without issuing a new code (desktop polls this).
export const getDesktopStatus = asyncHandler(async (req, res) => {
  const deviceId = req.agent.deviceId;
  const device = await db.collection('devices').doc(deviceId).get();
  if (!device.exists) throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
  const owners = getDeviceOwners(device.data());
  res.json({ deviceId, paired: owners.length > 0, owners });
});

export const createPairCode = asyncHandler(async (req, res) => {
  requireFields(req.body, ['deviceId']); const deviceId = id(req.body.deviceId, 'deviceId');
  const device = await db.collection('devices').doc(deviceId).get();
  if (!device.exists || !isOwner(device.data(), req.user.sub)) throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
  const { code, expiresAtMillis } = await issuePairCode(deviceId, req.user.sub);
  res.status(201).json({ pairCode: code, deviceId, expiresAt: new Date(expiresAtMillis).toISOString() });
});

// Mobile claims the device using the code shown on the desktop.
export const verifyPairCode = asyncHandler(async (req, res) => {
  requireFields(req.body, ['pairCode']); const code = pairCode(req.body.pairCode);
  const ref = db.collection('pairCodes').doc(code); const doc = await ref.get();
  if (!doc.exists || doc.data().usedAt || (doc.data().expiresAtMillis || 0) < Date.now()) throw new AppError('Pair code is invalid or expired', 400, 'PAIR_CODE_INVALID');
  if (doc.data().userId && doc.data().userId !== req.user.sub) throw new AppError('Pair code belongs to a different account', 403, 'PAIR_CODE_FORBIDDEN');
  await ref.update({ usedAt: FieldValue.serverTimestamp(), userId: req.user.sub });

  const deviceRef = db.collection('devices').doc(doc.data().deviceId);
  const deviceSnap = await deviceRef.get();
  const deviceData = deviceSnap.exists ? deviceSnap.data() : {};
  const owner = { id: req.user.sub, email: req.user.email ?? null, name: req.user.name ?? null };
  const update = {
    userIds: [...new Set([...(deviceData.userIds || []), req.user.sub])],
    owners: [...(deviceData.owners || []), owner],
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (deviceData.userId) update.userId = null;
  await deviceRef.update(update);

  // Push a live pairing notification so the Windows agent and any online
  // controller socket for this account react immediately instead of waiting
  // for the desktop's pairing-status poll.
  if (io) {
    const payload = { deviceId: doc.data().deviceId, userId: req.user.sub, userEmail: owner.email, userName: owner.name };
    emitToDevice(io, doc.data().deviceId, 'device:paired', payload);
    io.to(`user:${req.user.sub}`).emit('device:paired', payload);
  }

  res.json({ success: true, deviceId: doc.data().deviceId });
});

// Desktop requests to unpair all accounts.
export const unpairDesktop = asyncHandler(async (req, res) => {
  const deviceId = req.agent.deviceId;
  const device = await db.collection('devices').doc(deviceId).get();
  if (!device.exists) throw new AppError('Device not found', 404, 'DEVICE_NOT_FOUND');
  const owners = (device.data().owners || []).slice();
  await device.ref.update({ userId: null, userIds: [], owners: [], updatedAt: FieldValue.serverTimestamp() });

  // Notify the desktop and every affected account socket so the UI drops the
  // paired state immediately.
  if (io) {
    const payload = { deviceId };
    emitToDevice(io, deviceId, 'device:unpaired', payload);
    for (const owner of owners) io.to(`user:${owner.id}`).emit('device:unpaired', payload);
  }

  res.json({ success: true });
});
