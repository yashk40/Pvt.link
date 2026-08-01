export type DeviceOS = 'android' | 'ios' | 'windows' | 'macos' | 'linux';
export type DeviceStatus = 'online' | 'offline' | 'idle';
export type ActivityType = 'locked' | 'unlock' | 'screenshot' | 'webcam' | 'connected' | 'disconnected' | 'restart' | 'shutdown';

export interface Device {
    id: string;
    name: string;
    os: DeviceOS;
    status: DeviceStatus;
    lastActive: string;
    battery: number;
    network: 'wifi' | 'mobile' | 'ethernet' | 'disconnected';
    ip: string;
    cpuUsage: number;
    ramUsage: number;
    ramTotal: number;
    storageUsed: number;
    storageTotal: number;
    model: string;
    systemVersion: string;
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
    location: string;
    screenshots: number;
    webcamCaptures: number;
}

export interface ActivityItem {
    id: string;
    type: ActivityType;
    deviceName: string;
    deviceId: string;
    timestamp: string;
    detail?: string;
}

export interface GalleryItem {
    id: string;
    deviceId: string;
    deviceName: string;
    url: string;
    capturedAt: string;
    size: string;
    type: 'screenshot' | 'webcam';
}
