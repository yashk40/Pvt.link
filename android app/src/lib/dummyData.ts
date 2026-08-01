import { Platform } from 'react-native';

export type DeviceOS = 'android' | 'ios' | 'windows' | 'macos' | 'linux';
export type DeviceStatus = 'online' | 'offline' | 'idle';
export type ActivityType =
    | 'locked'
    | 'screenshot'
    | 'webcam'
    | 'connected'
    | 'disconnected'
    | 'restart'
    | 'shutdown';

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

export interface NotificationItem {
    id: string;
    title: string;
    body: string;
    timestamp: string;
    read: boolean;
    type: 'success' | 'warning' | 'info' | 'danger';
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

// ─── DEVICES ──────────────────────────────────────────────
export const DUMMY_DEVICES: Device[] = [
    {
        id: 'd1',
        name: "Yash's Laptop",
        os: 'windows',
        status: 'online',
        lastActive: '2 min ago',
        battery: 78,
        network: 'wifi',
        ip: '192.168.1.105',
        cpuUsage: 34,
        ramUsage: 6.2,
        ramTotal: 16,
        storageUsed: 245,
        storageTotal: 512,
        model: 'Dell XPS 15',
        systemVersion: 'Windows 11 Pro 23H2',
        connectionQuality: 'excellent',
        location: 'Mumbai, India',
        screenshots: 12,
        webcamCaptures: 4,
    },
    {
        id: 'd2',
        name: 'Office Desktop',
        os: 'windows',
        status: 'online',
        lastActive: '5 min ago',
        battery: 100,
        network: 'ethernet',
        ip: '192.168.1.112',
        cpuUsage: 18,
        ramUsage: 8.1,
        ramTotal: 32,
        storageUsed: 780,
        storageTotal: 1000,
        model: 'Custom Build',
        systemVersion: 'Windows 11 Pro 23H2',
        connectionQuality: 'excellent',
        location: 'Mumbai, India',
        screenshots: 28,
        webcamCaptures: 7,
    },
    {
        id: 'd3',
        name: "Mom's Phone",
        os: 'android',
        status: 'offline',
        lastActive: '3 hours ago',
        battery: 45,
        network: 'mobile',
        ip: '10.0.0.24',
        cpuUsage: 0,
        ramUsage: 1.8,
        ramTotal: 4,
        storageUsed: 58,
        storageTotal: 128,
        model: 'Samsung Galaxy A54',
        systemVersion: 'Android 14',
        connectionQuality: 'poor',
        location: 'Pune, India',
        screenshots: 3,
        webcamCaptures: 1,
    },
    {
        id: 'd4',
        name: "Yash's MacBook",
        os: 'macos',
        status: 'idle',
        lastActive: '20 min ago',
        battery: 62,
        network: 'wifi',
        ip: '192.168.1.108',
        cpuUsage: 8,
        ramUsage: 5.4,
        ramTotal: 16,
        storageUsed: 312,
        storageTotal: 512,
        model: 'MacBook Pro M2',
        systemVersion: 'macOS Sonoma 14.4',
        connectionQuality: 'good',
        location: 'Mumbai, India',
        screenshots: 9,
        webcamCaptures: 2,
    },
    {
        id: 'd5',
        name: 'Home Server',
        os: 'linux',
        status: 'online',
        lastActive: 'Just now',
        battery: 100,
        network: 'ethernet',
        ip: '192.168.1.2',
        cpuUsage: 55,
        ramUsage: 12,
        ramTotal: 64,
        storageUsed: 1800,
        storageTotal: 4000,
        model: 'Raspberry Pi 4',
        systemVersion: 'Ubuntu 22.04 LTS',
        connectionQuality: 'excellent',
        location: 'Mumbai, India',
        screenshots: 0,
        webcamCaptures: 0,
    },
];

// ─── ACTIVITY ─────────────────────────────────────────────
export const DUMMY_ACTIVITIES: ActivityItem[] = [
    { id: 'a1', type: 'screenshot', deviceName: "Yash's Laptop", deviceId: 'd1', timestamp: '2 min ago', detail: 'Screen captured successfully' },
    { id: 'a2', type: 'connected', deviceName: 'Office Desktop', deviceId: 'd2', timestamp: '5 min ago' },
    { id: 'a3', type: 'locked', deviceName: "Mom's Phone", deviceId: 'd3', timestamp: '18 min ago', detail: 'Remote lock applied' },
    { id: 'a5', type: 'webcam', deviceName: 'Office Desktop', deviceId: 'd2', timestamp: '1 hour ago', detail: 'Webcam photo captured' },
    { id: 'a6', type: 'disconnected', deviceName: "Mom's Phone", deviceId: 'd3', timestamp: '3 hours ago' },
    { id: 'a7', type: 'restart', deviceName: 'Home Server', deviceId: 'd5', timestamp: '5 hours ago', detail: 'Scheduled restart completed' },
    { id: 'a9', type: 'screenshot', deviceName: "Yash's MacBook", deviceId: 'd4', timestamp: 'Yesterday, 9:12 PM' },
    { id: 'a10', type: 'shutdown', deviceName: 'Office Desktop', deviceId: 'd2', timestamp: 'Yesterday, 6:00 PM', detail: 'Scheduled shutdown' },
    { id: 'a11', type: 'connected', deviceName: "Yash's Laptop", deviceId: 'd1', timestamp: 'Yesterday, 8:30 AM' },
    { id: 'a12', type: 'locked', deviceName: "Yash's Laptop", deviceId: 'd1', timestamp: '2 days ago, 11:45 PM', detail: 'Lock applied remotely' },
];

// ─── NOTIFICATIONS ────────────────────────────────────────
export const DUMMY_NOTIFICATIONS: NotificationItem[] = [
    { id: 'n1', title: 'Screenshot Ready', body: "Screenshot from Yash's Laptop is ready to download.", timestamp: '2 min ago', read: false, type: 'success' },
    { id: 'n2', title: 'Device Online', body: 'Office Desktop came online.', timestamp: '5 min ago', read: false, type: 'info' },
    { id: 'n3', title: 'Lock Successful', body: "Mom's Phone has been locked successfully.", timestamp: '18 min ago', read: false, type: 'success' },
    { id: 'n5', title: 'Webcam Captured', body: 'New webcam photo from Office Desktop.', timestamp: '1 hour ago', read: true, type: 'success' },
    { id: 'n6', title: 'Device Offline', body: "Mom's Phone went offline.", timestamp: '3 hours ago', read: true, type: 'danger' },
    { id: 'n7', title: 'Battery Low', body: "Mom's Phone battery is below 20%.", timestamp: '4 hours ago', read: true, type: 'warning' },
    { id: 'n8', title: 'Restart Completed', body: 'Home Server restarted successfully.', timestamp: '5 hours ago', read: true, type: 'success' },
];

// ─── SCREENSHOTS ──────────────────────────────────────────
export const DUMMY_SCREENSHOTS: GalleryItem[] = [
    { id: 's1', deviceId: 'd1', deviceName: "Yash's Laptop", url: 'https://picsum.photos/seed/sc1/400/250', capturedAt: 'Today, 8:42 PM', size: '1.2 MB', type: 'screenshot' },
    { id: 's2', deviceId: 'd2', deviceName: 'Office Desktop', url: 'https://picsum.photos/seed/sc2/400/250', capturedAt: 'Today, 6:15 PM', size: '980 KB', type: 'screenshot' },
    { id: 's3', deviceId: 'd4', deviceName: "Yash's MacBook", url: 'https://picsum.photos/seed/sc3/400/250', capturedAt: 'Yesterday, 9:12 PM', size: '1.5 MB', type: 'screenshot' },
    { id: 's4', deviceId: 'd1', deviceName: "Yash's Laptop", url: 'https://picsum.photos/seed/sc4/400/250', capturedAt: 'Yesterday, 4:30 PM', size: '1.1 MB', type: 'screenshot' },
    { id: 's5', deviceId: 'd2', deviceName: 'Office Desktop', url: 'https://picsum.photos/seed/sc5/400/250', capturedAt: '2 days ago, 2:00 PM', size: '850 KB', type: 'screenshot' },
    { id: 's6', deviceId: 'd4', deviceName: "Yash's MacBook", url: 'https://picsum.photos/seed/sc6/400/250', capturedAt: '3 days ago, 10:00 AM', size: '1.3 MB', type: 'screenshot' },
];

// ─── WEBCAM CAPTURES ──────────────────────────────────────
export const DUMMY_WEBCAM: GalleryItem[] = [
    { id: 'w1', deviceId: 'd2', deviceName: 'Office Desktop', url: 'https://picsum.photos/seed/wc1/400/300', capturedAt: 'Today, 7:05 PM', size: '640 KB', type: 'webcam' },
    { id: 'w2', deviceId: 'd1', deviceName: "Yash's Laptop", url: 'https://picsum.photos/seed/wc2/400/300', capturedAt: 'Today, 4:22 PM', size: '580 KB', type: 'webcam' },
    { id: 'w3', deviceId: 'd4', deviceName: "Yash's MacBook", url: 'https://picsum.photos/seed/wc3/400/300', capturedAt: 'Yesterday, 11:00 AM', size: '720 KB', type: 'webcam' },
    { id: 'w4', deviceId: 'd2', deviceName: 'Office Desktop', url: 'https://picsum.photos/seed/wc4/400/300', capturedAt: '2 days ago, 3:30 PM', size: '610 KB', type: 'webcam' },
];

// ─── STATS ────────────────────────────────────────────────
export const DASHBOARD_STATS = {
    connectedDevices: 5,
    onlineDevices: 3,
    commandsToday: 14,
    screenshotsTotal: 52,
    webcamTotal: 14,
};

export const CHART_DATA = [
    { day: 'Mon', commands: 8, screenshots: 3, webcam: 1 },
    { day: 'Tue', commands: 15, screenshots: 6, webcam: 2 },
    { day: 'Wed', commands: 6, screenshots: 2, webcam: 0 },
    { day: 'Thu', commands: 22, screenshots: 9, webcam: 3 },
    { day: 'Fri', commands: 18, screenshots: 7, webcam: 2 },
    { day: 'Sat', commands: 11, screenshots: 4, webcam: 1 },
    { day: 'Sun', commands: 14, screenshots: 5, webcam: 2 },
];
