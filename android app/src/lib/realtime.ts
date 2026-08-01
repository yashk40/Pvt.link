import { io, Socket } from 'socket.io-client';
import { getApiUrl, getAccessToken } from './api';

export type CommandStatus = { commandId: string; deviceId: string; status: 'completed' | 'failed'; result?: { message?: string; imageBase64?: string; imageUrl?: string; mimeType?: string } };

// Real-time updates via socket.io against the Node backend. The mobile connects
// as a user socket (auth token = Firebase ID token); the server joins it to the
// user's room and emits command:status / device:online / device:offline etc.
export function connectRealtime(onCommandStatus: (event: CommandStatus) => void, onDeviceChange?: () => void): () => void {
    let socket: Socket | null = null;
    let disposed = false;

    const connect = async () => {
        const token = await getAccessToken();
        if (!token || disposed) return;

        socket = io(getApiUrl(), {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 30000,
        });

        socket.on('connect', () => {
            console.log('Connected to realtime (socket.io) at', getApiUrl());
        });

        socket.on('command:status', (payload: CommandStatus) => onCommandStatus(payload));

        socket.on('device:online', () => onDeviceChange?.());
        socket.on('device:offline', () => onDeviceChange?.());
        socket.on('device:paired', () => onDeviceChange?.());
        socket.on('device:unpaired', () => onDeviceChange?.());

        socket.on('connect_error', (err) => console.warn('Realtime connect_error:', err.message));
    };

    connect();

    // Cleanup is returned synchronously so it can be used from a useEffect.
    return () => {
        disposed = true;
        try { socket?.disconnect(); } catch {}
    };
}
