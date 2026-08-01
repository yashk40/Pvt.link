import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Monitor, Smartphone, Server, Apple, Wifi, Cpu, HardDrive,
    Battery, MapPin, Calendar, Signal, Camera, Video,
} from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';
import StatusBadge from '../../components/StatusBadge';
import type { Device } from '../../lib/types';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../../theme';

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <View style={rowStyles.row}>
            <View style={rowStyles.left}>
                {icon && <View style={rowStyles.iconWrap}>{icon}</View>}
                <Text style={rowStyles.label}>{label}</Text>
            </View>
            <Text style={rowStyles.value}>{value}</Text>
        </View>
    );
}

function UsageBar({ label, used, total, unit, color }: { label: string; used: number; total: number; unit: string; color: string }) {
    const pct = (used / total) * 100;
    return (
        <View style={barStyles.container}>
            <View style={barStyles.header}>
                <Text style={barStyles.label}>{label}</Text>
                <Text style={barStyles.value}>{used}{unit} / {total}{unit}</Text>
            </View>
            <View style={barStyles.track}>
                <View style={[barStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={barStyles.pct}>{Math.round(pct)}%</Text>
        </View>
    );
}

export default function DeviceDetailsScreen({ route, navigation }: any) {
    const { deviceId } = route.params;
    const device: Device | undefined = route.params?.device;

    if (!device) {
        return (
            <View style={styles.root}>
                <LinearGradient colors={COLORS.bg.gradient} style={StyleSheet.absoluteFill} />
                <AppHeader title="Device" subtitle="Not connected" showBack />
                <View style={styles.empty}><Text style={styles.emptyText}>This device is no longer available.</Text></View>
            </View>
        );
    }

    const qualityColor = {
        excellent: COLORS.success,
        good: COLORS.info,
        fair: COLORS.warning,
        poor: COLORS.danger,
    }[device.connectionQuality];

    return (
        <View style={styles.root}>
            <LinearGradient colors={COLORS.bg.gradient} style={StyleSheet.absoluteFill} />
            <AppHeader title={device.name} subtitle={device.model} showBack />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Status Card */}
                <LinearGradient
                    colors={[COLORS.brand.tint, COLORS.bg.glass]}
                    style={styles.hero}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                    <View style={styles.heroIcon}>
                        {device.os === 'android' ? <Smartphone size={36} color={COLORS.os.android} /> :
                            device.os === 'ios' ? <Apple size={36} color={COLORS.os.ios} /> :
                                device.os === 'linux' ? <Server size={36} color={COLORS.os.linux} /> :
                                    <Monitor size={36} color={COLORS.os.windows} />}
                    </View>
                    <StatusBadge status={device.status} />
                    <View style={[styles.qualityBadge, { borderColor: qualityColor }]}>
                        <Signal size={12} color={qualityColor} />
                        <Text style={[styles.qualityText, { color: qualityColor }]}>
                            {device.connectionQuality.charAt(0).toUpperCase() + device.connectionQuality.slice(1)} Connection
                        </Text>
                    </View>
                </LinearGradient>

                {/* Device Info */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Device Information</Text>
                    <Row label="IP Address" value={device.ip} icon={<Wifi size={14} color={COLORS.info} />} />
                    <Row label="System" value={device.systemVersion} icon={<Monitor size={14} color={COLORS.brand.primary} />} />
                    <Row label="Location" value={device.location} icon={<MapPin size={14} color={COLORS.danger} />} />
                    <Row label="Last Active" value={device.lastActive} icon={<Calendar size={14} color={COLORS.text.muted} />} />
                    <Row label="Network" value={device.network.toUpperCase()} icon={<Wifi size={14} color={COLORS.success} />} />
                    <Row label="Battery" value={`${device.battery}%`} icon={<Battery size={14} color={COLORS.warning} />} />
                </View>

                {/* Usage */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>System Usage</Text>
                    <UsageBar label="CPU" used={device.cpuUsage} total={100} unit="%" color={COLORS.brand.primary} />
                    <UsageBar label="RAM" used={device.ramUsage} total={device.ramTotal} unit=" GB" color={COLORS.info} />
                    <UsageBar label="Storage" used={device.storageUsed} total={device.storageTotal} unit=" GB" color={COLORS.warning} />
                </View>

                {/* Quick Gallery Links */}
                <View style={styles.galleryRow}>
                    <TouchableOpacity
                        style={styles.galleryBtn}
                        onPress={() => navigation.navigate('Screenshots', { deviceId: device.id })}
                        activeOpacity={0.8}
                    >
                        <LinearGradient colors={[COLORS.brand.tint, COLORS.bg.glass]} style={styles.galleryBtnGrad}>
                            <Camera size={22} color={COLORS.brand.primary} />
                            <Text style={styles.galleryBtnCount}>{device.screenshots}</Text>
                            <Text style={styles.galleryBtnLabel}>Screenshots</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.galleryBtn}
                        onPress={() => navigation.navigate('Webcam', { deviceId: device.id })}
                        activeOpacity={0.8}
                    >
                        <LinearGradient colors={['rgba(2,132,199,0.12)', 'rgba(2,132,199,0.02)']} style={styles.galleryBtnGrad}>
                            <Video size={22} color={COLORS.info} />
                            <Text style={[styles.galleryBtnCount, { color: COLORS.info }]}>{device.webcamCaptures}</Text>
                            <Text style={styles.galleryBtnLabel}>Webcam Captures</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg.primary },
    scroll: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.tabBar },
    hero: {
        alignItems: 'center',
        gap: SPACING.sm,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(15,118,110,0.2)',
        marginBottom: SPACING.base,
    },
    heroIcon: {
        width: 72,
        height: 72,
        borderRadius: RADIUS['2xl'],
        backgroundColor: COLORS.bg.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    qualityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: RADIUS.full,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        backgroundColor: COLORS.bg.card,
    },
    qualityText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold },
    card: {
        backgroundColor: COLORS.bg.card,
        borderRadius: RADIUS.xl,
        padding: SPACING.base,
        borderWidth: 1,
        borderColor: COLORS.bg.glassBorder,
        marginBottom: SPACING.base,
        ...SHADOWS.sm,
        gap: 2,
    },
    cardTitle: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.bold,
        color: COLORS.text.primary,
        marginBottom: SPACING.sm,
    },
    galleryRow: { flexDirection: 'row', gap: SPACING.sm },
    galleryBtn: { flex: 1, borderRadius: RADIUS.xl, overflow: 'hidden' },
    galleryBtnGrad: {
        padding: SPACING.base,
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(15,118,110,0.2)',
        borderRadius: RADIUS.xl,
    },
    galleryBtnCount: {
        fontSize: FONTS.sizes['2xl'],
        fontWeight: FONTS.weights.bold,
        color: COLORS.brand.primary,
    },
    galleryBtnLabel: { fontSize: FONTS.sizes.xs, color: COLORS.text.muted, fontWeight: FONTS.weights.medium },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
    emptyText: { color: COLORS.text.muted, fontSize: FONTS.sizes.base, textAlign: 'center' },
});

const rowStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.bg.glassBorder,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconWrap: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
    label: { fontSize: FONTS.sizes.sm, color: COLORS.text.secondary },
    value: { fontSize: FONTS.sizes.sm, color: COLORS.text.primary, fontWeight: FONTS.weights.medium, maxWidth: '55%', textAlign: 'right' },
});

const barStyles = StyleSheet.create({
    container: { marginVertical: SPACING.sm, gap: 6 },
    header: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: FONTS.sizes.sm, color: COLORS.text.secondary, fontWeight: FONTS.weights.medium },
    value: { fontSize: FONTS.sizes.xs, color: COLORS.text.muted },
    track: { height: 6, backgroundColor: COLORS.bg.tertiary, borderRadius: RADIUS.full, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: RADIUS.full },
    pct: { fontSize: FONTS.sizes.xs, color: COLORS.text.muted, alignSelf: 'flex-end' },
});
