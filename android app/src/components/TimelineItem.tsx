import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
    Lock,
    Camera,
    Video,
    RefreshCw,
    Power,
    Wifi,
    WifiOff,
} from 'lucide-react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme';
import type { ActivityType } from '../lib/types';
import { useTheme } from '../theme/ThemeContext';

interface TimelineItemProps {
    type: ActivityType;
    deviceName: string;
    timestamp: string;
    detail?: string;
    isLast?: boolean;
}

function getTypeMap(brand: { primary: string; secondary: string; tint: string }) {
    return {
    locked: { icon: <Lock size={14} color="#d97706" />, label: 'Device Locked', color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
    unlock: { icon: <Lock size={14} color="#059669" />, label: 'Device Unlocked', color: '#059669', bg: 'rgba(5,150,105,0.12)' },
    screenshot: { icon: <Camera size={14} color={brand.primary} />, label: 'Screenshot Captured', color: brand.primary, bg: brand.tint },
    webcam: { icon: <Video size={14} color="#0284c7" />, label: 'Webcam Captured', color: '#0284c7', bg: 'rgba(2,132,199,0.12)' },
    connected: { icon: <Wifi size={14} color="#059669" />, label: 'Device Connected', color: '#059669', bg: 'rgba(5,150,105,0.12)' },
    disconnected: { icon: <WifiOff size={14} color="#dc2626" />, label: 'Device Disconnected', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
    restart: { icon: <RefreshCw size={14} color="#d97706" />, label: 'Device Restarted', color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
    shutdown: { icon: <Power size={14} color="#dc2626" />, label: 'Device Shutdown', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
    } satisfies Record<ActivityType, { icon: React.ReactNode; label: string; color: string; bg: string }>;
}

export default function TimelineItem({ type, deviceName, timestamp, detail, isLast }: TimelineItemProps) {
    const { colors } = useTheme();
    const typeMap = getTypeMap(colors.brand);
    const t = typeMap[type] || typeMap.restart;
    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <View style={[styles.iconDot, { backgroundColor: t.bg, borderColor: t.color }]}>
                    {t.icon}
                </View>
                {!isLast && <View style={styles.line} />}
            </View>
            <View style={styles.content}>
                <Text style={styles.label}>{t.label}</Text>
                <Text style={styles.device}>{deviceName}</Text>
                {detail ? <Text style={styles.detail}>{detail}</Text> : null}
                <Text style={styles.timestamp}>{timestamp}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    left: {
        alignItems: 'center',
        width: 32,
    },
    iconDot: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.full,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    line: {
        flex: 1,
        width: 1.5,
        backgroundColor: COLORS.bg.glassBorder,
        marginVertical: 4,
    },
    content: {
        flex: 1,
        paddingBottom: SPACING.lg,
        gap: 2,
    },
    label: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.text.primary,
    },
    device: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.brand.primary,
        fontWeight: FONTS.weights.medium,
    },
    detail: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.text.secondary,
        fontStyle: 'italic',
    },
    timestamp: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.text.muted,
        marginTop: 2,
    },
});
