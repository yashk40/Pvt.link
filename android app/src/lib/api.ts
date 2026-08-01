import type { Device } from './types';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

// The local Node backend is the target. Point at it with EXPO_PUBLIC_API_URL
// (e.g. http://192.168.1.7:4000 for a phone, http://10.0.2.2:4000 for an
// emulator). We deliberately do NOT fall back to any remote worker, so the
// realtime websocket always stays on the local backend.
const defaultApiUrl = 'http://localhost:4000';
const PRIMARY_URL = (process.env.EXPO_PUBLIC_API_URL || defaultApiUrl).replace(/\/$/, '');
let activeUrl = PRIMARY_URL;

const mapDevice = (device: Record<string, any>): Device => ({
    id: device.id, name: device.deviceName || device.hostname || 'Windows PC', os: device.os || 'windows', status: device.status || 'offline',
    lastActive: device.lastSeen?.toDate?.() ? device.lastSeen.toDate().toLocaleString() : (device.lastSeen ? String(device.lastSeen) : 'Not seen yet'), battery: 100, network: device.status === 'online' ? 'wifi' : 'disconnected',
    ip: device.localIp || device.publicIp || 'Unknown', cpuUsage: 0, ramUsage: 0, ramTotal: Number.parseInt(device.ram, 10) || 0, storageUsed: 0, storageTotal: 0,
    model: device.hostname || device.os || 'Desktop', systemVersion: device.os || 'Windows', connectionQuality: device.status === 'online' ? 'excellent' : 'poor', location: 'Not available', screenshots: 0, webcamCaptures: 0,
});

// React Native's fetch has no default timeout, so a hung request would leave
// callers (e.g. the Pair button) spinning forever. Abort after this many ms.
const REQUEST_TIMEOUT_MS = 15000;

async function request(path: string, options: RequestInit = {}) {
    const token = await getAccessToken();
    const buildHeaders = () => ({
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
    });
    const fetchWithTimeout = (url: string, init: RequestInit) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
    };
    try {
        const response = await fetchWithTimeout(`${activeUrl}${path}`, { ...options, headers: buildHeaders() });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.error?.message || body?.error || 'Server request failed');
        return body;
    } catch (err) {
        // No remote fallback: keep the app pinned to the configured local backend.
        throw err;
    }
}

export const fetchDevices = async () => (await request('/devices')).devices.map(mapDevice) as Device[];
const normalizePairCode = (code: string) => code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
export const pairDesktop = async (pairCode: string) => {
    const token = await getAccessToken();
    if (!token) throw new Error('Sign in before pairing a PC');
    const normalized = normalizePairCode(pairCode);
    if (normalized.length < 8) throw new Error('Enter the 8-character code shown in the Windows app');
    return request('/pair/verify', { method: 'POST', body: JSON.stringify({ pairCode: normalized }) });
};
export const sendDeviceCommand = async (deviceId: string, type: 'lock' | 'unlock' | 'restart' | 'shutdown' | 'sleep' | 'screenshot' | 'webcam') => request(`/commands/${type}`, { method: 'POST', body: JSON.stringify({ deviceId }) });
export const fetchCommandHistory = async () => request('/commands/history');

// Firebase Auth is the single source of truth for the worker. The bearer token
// is the Firebase ID token, fetched on demand so it auto-refreshes (~1h TTL).
export async function getAccessToken(): Promise<string | null> {
    try {
        const user = auth.currentUser;
        return user ? await user.getIdToken() : null;
    } catch {
        return null;
    }
}

export const clearBackendSession = () => signOut(auth);
export const getApiUrl = () => activeUrl;
