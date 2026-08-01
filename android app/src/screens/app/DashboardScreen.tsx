import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { auth } from '../../lib/firebase';
import {
    View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Modal, TextInput, Alert,
    ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { CameraView, useCameraPermissions } from 'expo-camera';
import {
    Monitor, Wifi, Terminal, Camera, Video, Shield, ChevronRight, Link2, X,
    Lock, BarChart3,
} from 'lucide-react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';
import type { ActivityItem, ActivityType } from '../../lib/types';
import { fetchCommandHistory, fetchDevices, pairDesktop } from '../../lib/api';
import BrandLogo from '../../components/BrandLogo';

const T = {
    bg: '#f5f5f7',
    card: '#ffffff',
    cardAlt: '#f2f2f7',
    border: '#e5e5ea',
    borderStrong: '#d2d2d7',
    teal: '#0F766E',
    tealLight: '#14B8A6',
    tealBg: '#ecfdf5',
    tealBorder: '#d1fae5',
    ink: '#172554',
    inkSoft: '#1d1d1f',
    muted: '#64748b',
    faint: '#94a3b8',
    danger: '#dc2626',
    warning: '#d97706',
    info: '#0284c7',
    success: '#059669',
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.base * 2 - SPACING.sm) / 2;

type DashboardCommand = { id: string; deviceId: string; type: ActivityType; deviceName: string; timestamp: string; detail?: string };

function getActMap(): Record<ActivityType, { icon: React.ReactNode; label: string; color: string; bg: string }> {
    return {
        locked: { icon: <Lock size={14} color={T.warning} />, label: 'Device Locked', color: T.warning, bg: '#fef3c7' },
        unlock: { icon: <Lock size={14} color={T.success} />, label: 'Device Unlocked', color: T.success, bg: T.tealBg },
        screenshot: { icon: <Camera size={14} color={T.teal} />, label: 'Screenshot Captured', color: T.teal, bg: T.tealBg },
        webcam: { icon: <Video size={14} color={T.info} />, label: 'Webcam Captured', color: T.info, bg: '#e0f2fe' },
        connected: { icon: <Wifi size={14} color={T.success} />, label: 'Device Connected', color: T.success, bg: T.tealBg },
        disconnected: { icon: <Wifi size={14} color={T.danger} />, label: 'Device Disconnected', color: T.danger, bg: '#fee2e2' },
        restart: { icon: <Monitor size={14} color={T.warning} />, label: 'Device Restarted', color: T.warning, bg: '#fef3c7' },
        shutdown: { icon: <Monitor size={14} color={T.danger} />, label: 'Device Shutdown', color: T.danger, bg: '#fee2e2' },
    };
}

function StatCard({ label, value, icon, iconBg, w }: { label: string; value: number | string; icon: React.ReactNode; iconBg: string; w: number }) {
    return (
        <View style={[styles.statCard, { width: w }]}>
            <View style={[styles.statIcon, { backgroundColor: iconBg }]}>{icon}</View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function QuickAction({ icon, label, tint, onPress }: { icon: React.ReactNode; label: string; tint: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.action} activeOpacity={0.8} onPress={onPress}>
            <View style={[styles.actionIcon, { backgroundColor: `${tint}15` }]}>{icon}</View>
            <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

function formatTimestamp(createdAt: any) {
    if (!createdAt) return 'Unknown time';
    if (typeof createdAt === 'string') return new Date(createdAt).toLocaleString();
    if (typeof createdAt.seconds === 'number') return new Date(createdAt.seconds * 1000).toLocaleString();
    return 'Unknown time';
}

export default function DashboardScreen({ navigation }: any) {
    const userName = auth.currentUser?.displayName?.split(' ')[0] || 'there';
    const ACT_MAP = getActMap();
    const [pairOpen, setPairOpen] = useState(false);
    const [pairCode, setPairCode] = useState('');
    const [pairing, setPairing] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [pairMode, setPairMode] = useState<'type' | 'scan'>('type');
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState<any[]>([]);
    const [activities, setActivities] = useState<DashboardCommand[]>([]);
    const [permission, requestPermission] = useCameraPermissions();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [deviceList, history] = await Promise.all([
                fetchDevices(),
                fetchCommandHistory().catch(() => ({ commands: [] })),
            ]);

            const deviceMap = (deviceList || []).reduce((acc: Record<string, string>, d: any) => {
                acc[d.id] = d.name;
                return acc;
            }, {});

            const mapped = (history.commands || []).map((c: any) => ({
                id: c.id,
                deviceId: c.deviceId,
                type: (c.type === 'lock' ? 'locked' : c.type) as ActivityType,
                deviceName: deviceMap[c.deviceId] || 'Windows PC',
                timestamp: formatTimestamp(c.createdAt),
                detail:
                    c.result?.imageUrl || c.result?.imageBase64
                        ? 'Tap to view image'
                        : c.status === 'completed'
                            ? 'Command successful'
                            : c.status === 'failed'
                                ? 'Command failed'
                                : 'Pending',
            }));

            setDevices(deviceList || []);
            setActivities(mapped);
        } catch (error: any) {
            console.warn('Failed to load dashboard:', error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const stats = useMemo(() => ({
        totalDevices: devices.length,
        onlineDevices: devices.filter((d: any) => d.status === 'online').length,
        commandsToday: activities.length,
        screenshots: activities.filter((a) => a.type === 'screenshot').length,
    }), [devices, activities]);

    const recentActivities = activities.slice(0, 4);

    const pairPc = async (codeOverride?: string) => {
        const code = (codeOverride ?? pairCode).trim();
        if (!code) return;
        setPairing(true);
        try {
            await pairDesktop(code);
            setPairOpen(false);
            setPairCode('');
            await load();
            Alert.alert('PC paired', 'Your Windows PC is ready. Open Devices to send commands.', [
                { text: 'Open Devices', onPress: () => navigation.navigate('Devices') },
                { text: 'Later' },
            ]);
        } catch (error: any) {
            Alert.alert('Pairing failed', error.message);
        } finally {
            setPairing(false);
        }
    };

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        // Stop scanning to prevent multiple rapid scans firing
        setScanning(false);
        setPairCode(data);
        // Pair immediately using the scanned value (state update is async, so pass it directly)
        pairPc(data);
    };

    const openScanMode = async () => {
        if (!permission?.granted) {
            const res = await requestPermission();
            if (!res.granted) return;
        }
        setScanning(true);
        setPairMode('scan');
    };

    return (
        <View style={styles.root}>
            <LinearGradient colors={COLORS.bg.gradient} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <View>
                    <BrandLogo size="md" />
                    <Text style={styles.headerSub}>Hey, {userName} 👋</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <LinearGradient colors={COLORS.isDark ? ['#102a2b', '#111820'] : [COLORS.brand.softBg, COLORS.bg.secondary]} style={styles.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <View style={styles.bannerIcon}><Shield size={20} color={T.teal} /></View>
                    <View style={styles.bannerText}>
                        <Text style={styles.bannerTitle}>All Systems Secure</Text>
                        <Text style={styles.bannerSub}>
                            {stats.onlineDevices} of {stats.totalDevices || 0} devices online · Live data synced
                        </Text>
                    </View>
                    <View style={styles.secureDot} />
                </LinearGradient>

                <TouchableOpacity style={styles.pairCard} activeOpacity={0.85} onPress={() => setPairOpen(true)}>
                    <LinearGradient colors={COLORS.brand.gradient} style={styles.pairIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Link2 size={21} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.pairTitle}>Pair a Windows PC</Text>
                        <Text style={styles.pairSub}>Enter the code displayed in the Windows app</Text>
                    </View>
                    <ChevronRight size={20} color={T.teal} />
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Overview</Text>
                <View style={styles.statsGrid}>
                    <StatCard label="Total Devices" value={stats.totalDevices} icon={<Monitor size={18} color={T.teal} />} iconBg={T.tealBg} w={CARD_WIDTH} />
                    <StatCard label="Online Now" value={stats.onlineDevices} icon={<Wifi size={18} color={T.success} />} iconBg={T.tealBg} w={CARD_WIDTH} />
                    <StatCard label="Commands Today" value={stats.commandsToday} icon={<Terminal size={18} color={T.info} />} iconBg="#e0f2fe" w={CARD_WIDTH} />
                    <StatCard label="Screenshots" value={stats.screenshots} icon={<Camera size={18} color={T.warning} />} iconBg="#fef3c7" w={CARD_WIDTH} />
                </View>

                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsRow}>
                    <QuickAction icon={<Lock size={20} color={T.warning} />} label="Lock PC" tint={T.warning} onPress={() => navigation.navigate('Devices')} />
                    <QuickAction icon={<Camera size={20} color={T.teal} />} label="Screenshot" tint={T.teal} onPress={() => navigation.navigate('Devices')} />
                    <QuickAction icon={<Video size={20} color={T.info} />} label="Webcam" tint={T.info} onPress={() => navigation.navigate('Devices')} />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Command Activity</Text>
                    <Text style={styles.cardSub}>{loading ? 'Loading live data...' : 'Latest commands from your devices'}</Text>
                    {loading ? (
                        <View style={styles.chartEmpty}>
                            <ActivityIndicator color={COLORS.brand.primary} />
                        </View>
                    ) : recentActivities.length === 0 ? (
                        <View style={styles.chartEmpty}>
                            <View style={styles.emptyIconWrap}><BarChart3 size={26} color={T.faint} /></View>
                            <Text style={styles.emptyText}>Activity will appear here once you send commands.</Text>
                        </View>
                    ) : (
                        <View style={{ marginTop: SPACING.md }}>
                            {recentActivities.map((item, i) => {
                                const a = ACT_MAP[item.type] || ACT_MAP.restart;
                                return (
                                    <View key={item.id} style={styles.timeline}>
                                        <View style={styles.timelineLeft}>
                                            <View style={[styles.timelineDot, { backgroundColor: a.bg, borderColor: a.color }]}>{a.icon}</View>
                                            {i !== recentActivities.length - 1 && <View style={styles.timelineLine} />}
                                        </View>
                                        <View style={styles.timelineContent}>
                                            <Text style={styles.timelineLabel}>{a.label}</Text>
                                            <Text style={styles.timelineDevice}>{item.deviceName}</Text>
                                            <Text style={styles.timelineDetail}>{item.detail}</Text>
                                            <Text style={styles.timelineTime}>{item.timestamp}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>

                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Activity')}>
                        <Text style={styles.seeAll}>See all</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.card}>
                    {recentActivities.length === 0 ? (
                        <View style={styles.emptyActivity}>
                            <View style={styles.emptyIconWrap}><BarChart3 size={24} color={T.faint} /></View>
                            <Text style={styles.emptyText}>No recent activity</Text>
                            <Text style={styles.emptySub}>Commands you send will show up here.</Text>
                        </View>
                    ) : recentActivities.map((item, i) => {
                        const a = ACT_MAP[item.type] || ACT_MAP.restart;
                        return (
                            <View key={item.id} style={styles.timeline}>
                                <View style={styles.timelineLeft}>
                                    <View style={[styles.timelineDot, { backgroundColor: a.bg, borderColor: a.color }]}>{a.icon}</View>
                                    {i !== recentActivities.length - 1 && <View style={styles.timelineLine} />}
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timelineLabel}>{a.label}</Text>
                                    <Text style={styles.timelineDevice}>{item.deviceName}</Text>
                                    <Text style={styles.timelineDetail}>{item.detail}</Text>
                                    <Text style={styles.timelineTime}>{item.timestamp}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            <Modal transparent visible={pairOpen} animationType="fade" onRequestClose={() => setPairOpen(false)}>
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <TouchableOpacity style={styles.close} onPress={() => setPairOpen(false)}>
                            <X size={20} color={T.muted} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Pair Windows PC</Text>
                        <Text style={styles.modalText}>
                            Windows app me jo 8-character code dikh raha hai, yahan enter karo ya scan karein.
                        </Text>

                        {/* Toggle between type and scan modes */}
                        <View style={styles.modeToggle}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                    setScanning(false);
                                    setPairMode('type');
                                }}
                                style={[
                                    styles.modeButton,
                                    pairMode === 'type' ? styles.modeButtonActive : styles.modeButtonInactive
                                ]}
                            >
                                <Text style={[styles.modeText, pairMode === 'type' ? { color: T.teal } : { color: T.muted }]}>Type Code</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={openScanMode}
                                style={[
                                    styles.modeButton,
                                    pairMode === 'scan' ? styles.modeButtonActive : styles.modeButtonInactive
                                ]}
                            >
                                <Text style={[styles.modeText, pairMode === 'scan' ? { color: T.teal } : { color: T.muted }]}>Scan Code</Text>
                            </TouchableOpacity>
                        </View>

                        {pairMode === 'type' ? (
                            // Type view
                            <View style={styles.typeForm}>
                                <TextInput
                                    style={styles.codeInput}
                                    value={pairCode}
                                    onChangeText={setPairCode}
                                    placeholder="AB12CD34"
                                    placeholderTextColor={T.faint}
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                    maxLength={12}
                                />
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    disabled={pairing || !pairCode.trim()}
                                    onPress={() => pairPc()}
                                >
                                    <LinearGradient
                                        colors={pairing || !pairCode.trim() ? ['#cbd5e1', '#cbd5e1'] : COLORS.brand.gradient}
                                        style={styles.connect}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {pairing ? <ActivityIndicator color="#fff" /> : <Text style={styles.connectText}>Pair PC</Text>}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            // Scan view
                            <View style={styles.scannerContainer}>
                                {!permission?.granted ? (
                                    <TouchableOpacity
                                        style={[styles.cancelScanButton, { position: 'relative', backgroundColor: T.teal, borderRadius: RADIUS.md }]}
                                        onPress={openScanMode}
                                    >
                                        <Text style={styles.cancelScanText}>Grant Camera Permission</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <>
                                        <CameraView
                                            style={StyleSheet.absoluteFill}
                                            facing="back"
                                            barcodeScannerSettings={{
                                                barcodeTypes: ['qr'],
                                            }}
                                            onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
                                        />
                                        <TouchableOpacity
                                            style={styles.cancelScanButton}
                                            onPress={() => {
                                                setScanning(false);
                                                setPairMode('type');
                                            }}
                                        >
                                            <Text style={styles.cancelScanText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.base,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 4 : 44,
        paddingBottom: SPACING.sm,
    },
    headerSub: { fontSize: FONTS.sizes.sm, fontFamily: 'Poppins_400Regular', color: T.muted, marginTop: 1 },
    scroll: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.tabBar },

    banner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: T.tealBorder, marginBottom: SPACING.lg },
    bannerIcon: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
    bannerText: { flex: 1 },
    bannerTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, fontFamily: 'Poppins_600SemiBold', color: T.ink },
    bannerSub: { fontSize: FONTS.sizes.xs, fontFamily: 'Poppins_400Regular', color: T.muted, marginTop: 2 },
    secureDot: { width: 10, height: 10, borderRadius: RADIUS.full, backgroundColor: T.success },

    pairCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.base, marginBottom: SPACING.xl, borderRadius: RADIUS.xl, backgroundColor: T.card, borderWidth: 1, borderColor: T.tealBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    pairIcon: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
    pairTitle: { color: T.ink, fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, fontFamily: 'Poppins_600SemiBold' },
    pairSub: { color: T.muted, fontSize: FONTS.sizes.xs, fontFamily: 'Poppins_400Regular', marginTop: 2 },

    sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, fontFamily: 'Poppins_700Bold', color: T.ink, marginBottom: SPACING.sm },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
    seeAll: { fontSize: FONTS.sizes.sm, color: T.teal, fontWeight: FONTS.weights.medium, fontFamily: 'Poppins_500Medium' },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
    statCard: { backgroundColor: T.card, borderRadius: RADIUS.xl, padding: SPACING.base, borderWidth: 1, borderColor: T.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
    statIcon: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
    statValue: { fontSize: FONTS.sizes['2xl'], fontWeight: FONTS.weights.bold, fontFamily: 'Poppins_700Bold', color: T.ink, marginBottom: 2 },
    statLabel: { fontSize: FONTS.sizes.xs, color: T.muted, fontWeight: FONTS.weights.medium, fontFamily: 'Poppins_500Medium' },

    actionsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
    action: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: SPACING.md, backgroundColor: T.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: T.border },
    actionIcon: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { fontSize: FONTS.sizes.xs, color: T.inkSoft, fontWeight: FONTS.weights.medium, fontFamily: 'Poppins_500Medium', textAlign: 'center' },

    card: { backgroundColor: T.card, borderRadius: RADIUS.xl, padding: SPACING.base, borderWidth: 1, borderColor: T.border, marginBottom: SPACING.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
    cardTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, fontFamily: 'Poppins_600SemiBold', color: T.ink },
    cardSub: { fontSize: FONTS.sizes.xs, fontFamily: 'Poppins_400Regular', color: T.muted, marginTop: 2 },
    chartEmpty: { height: 140, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
    emptyIconWrap: { width: 52, height: 52, borderRadius: RADIUS.full, backgroundColor: T.cardAlt, alignItems: 'center', justifyContent: 'center' },
    emptyActivity: { alignItems: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm },
    emptyText: { color: T.muted, fontSize: FONTS.sizes.sm, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
    emptySub: { color: T.faint, fontSize: FONTS.sizes.xs, fontFamily: 'Poppins_400Regular', textAlign: 'center' },

    timeline: { flexDirection: 'row', gap: SPACING.md },
    timelineLeft: { alignItems: 'center', width: 32 },
    timelineDot: { width: 32, height: 32, borderRadius: RADIUS.full, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
    timelineLine: { flex: 1, width: 1.5, backgroundColor: T.border, marginVertical: 4 },
    timelineContent: { flex: 1, paddingBottom: SPACING.lg, gap: 2 },
    timelineLabel: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, fontFamily: 'Poppins_600SemiBold', color: T.ink },
    timelineDevice: { fontSize: FONTS.sizes.sm, color: T.teal, fontWeight: FONTS.weights.medium, fontFamily: 'Poppins_500Medium' },
    timelineDetail: { fontSize: FONTS.sizes.sm, color: T.muted, fontStyle: 'italic' },
    timelineTime: { fontSize: FONTS.sizes.xs, color: T.faint, marginTop: 2 },

    // Pairing modal styles
    modeToggle: { flexDirection: 'row', marginVertical: SPACING.lg },
    modeButton: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: T.cardAlt },
    modeButtonActive: { backgroundColor: T.tealBg },
    modeButtonInactive: { backgroundColor: T.cardAlt },
    modeText: { textAlign: 'center', color: T.ink, fontWeight: FONTS.weights.medium },
    typeForm: { marginTop: SPACING.lg },
    scannerContainer: { position: 'relative', height: 200, borderRadius: RADIUS.md, overflow: 'hidden' },
    cancelScanButton: { position: 'absolute', bottom: 20, left: 0, right: 0, paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    cancelScanText: { color: '#fff', fontWeight: FONTS.weights.bold },

    overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
    modal: { width: '100%', backgroundColor: T.card, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: T.border },
    close: { alignSelf: 'flex-end' },
    modalTitle: { color: T.ink, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, fontFamily: 'Poppins_700Bold', marginTop: -20 },
    modalText: { color: T.muted, fontSize: FONTS.sizes.sm, fontFamily: 'Poppins_400Regular', marginTop: SPACING.sm, lineHeight: 20 },
    codeInput: { color: T.ink, backgroundColor: T.cardAlt, borderRadius: RADIUS.md, borderWidth: 1, borderColor: T.borderStrong, marginTop: SPACING.lg, padding: 14, fontSize: 20, letterSpacing: 2, fontWeight: FONTS.weights.semibold, fontFamily: 'Poppins_600SemiBold' },
    connect: { alignItems: 'center', borderRadius: RADIUS.md, padding: 14, marginTop: SPACING.md },
    connectText: { color: '#fff', fontWeight: FONTS.weights.semibold, fontFamily: 'Poppins_600SemiBold' },
});