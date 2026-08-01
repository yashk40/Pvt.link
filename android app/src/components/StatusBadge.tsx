import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';

type Status = 'online' | 'offline' | 'idle';

interface StatusBadgeProps {
    status: Status;
    size?: 'sm' | 'md';
}

const STATUS_MAP = {
    online: { color: COLORS.status.online, label: 'Online', bg: 'rgba(5,150,105,0.12)' },
    offline: { color: COLORS.status.offline, label: 'Offline', bg: 'rgba(220,38,38,0.12)' },
    idle: { color: COLORS.status.warning, label: 'Idle', bg: 'rgba(217,119,6,0.12)' },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const config = STATUS_MAP[status];
    const isSmall = size === 'sm';

    return (
        <View style={[styles.container, { backgroundColor: config.bg }, isSmall && styles.containerSm]}>
            <View style={[styles.dot, { backgroundColor: config.color }, isSmall && styles.dotSm]} />
            <Text style={[styles.label, { color: config.color }, isSmall && styles.labelSm]}>
                {config.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: RADIUS.full,
        gap: 5,
    },
    containerSm: {
        paddingHorizontal: 7,
        paddingVertical: 3,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: RADIUS.full,
    },
    dotSm: { width: 5, height: 5 },
    label: {
        fontSize: FONTS.sizes.sm,
        fontWeight: FONTS.weights.semibold,
    },
    labelSm: { fontSize: FONTS.sizes.xs },
});
