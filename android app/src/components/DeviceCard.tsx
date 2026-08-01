import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
} from 'react-native';
import {
    Monitor,
    Smartphone,
    Apple,
    Server,
    Wifi,
    WifiOff,
    Battery,
    BatteryLow,
    Lock,
    Camera,
    Video,
    RefreshCw,
    Power,
    ChevronRight,
} from 'lucide-react-native';
import { FONTS, RADIUS, SHADOWS, SPACING, type ThemeColors } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import StatusBadge from './StatusBadge';
import ActionButton from './ActionButton';
import type { Device, DeviceOS } from '../lib/types';

function OsIcon({ os, colors, size = 20 }: { os: DeviceOS; colors: ThemeColors; size?: number }) {
    const color = colors.os[os];
    switch (os) {
        case 'android': return <Smartphone size={size} color={color} />;
        case 'ios': return <Apple size={size} color={color} />;
        case 'linux': return <Server size={size} color={color} />;
        default: return <Monitor size={size} color={color} />;
    }
}

interface ConfirmActionModal {
    visible: boolean;
    title: string;
    body: string;
    confirmText: string;
    variant: 'default' | 'danger' | 'warning';
    onConfirm: () => void;
    onCancel: () => void;
}

interface DeviceCardProps {
    device: Device;
    onPress: () => void;
    onCommand?: (type: 'lock' | 'unlock' | 'restart' | 'shutdown' | 'sleep' | 'screenshot' | 'webcam') => void;
}

export default function DeviceCard({ device, onPress, onCommand }: DeviceCardProps) {
    const { colors: COLORS } = useTheme();
    const styles = makeStyles(COLORS);
    const [modal, setModal] = useState<ConfirmActionModal | null>(null);

    const showConfirm = (
        title: string,
        body: string,
        confirmText: string,
        variant: 'default' | 'danger' | 'warning' = 'default',
        command?: 'lock' | 'unlock' | 'restart' | 'shutdown' | 'sleep' | 'screenshot' | 'webcam'
    ) =>
        setModal({
            visible: true,
            title,
            body,
            confirmText,
            variant,
            onConfirm: () => {
                setModal(null);
                if (command) onCommand?.(command);
            },
            onCancel: () => setModal(null),
        });

    const batteryColor =
        device.battery > 50
            ? COLORS.success
            : device.battery > 20
                ? COLORS.warning
                : COLORS.danger;

    return (
        <>
            <View style={styles.card}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconBg}>
                        <OsIcon os={device.os} colors={COLORS} size={22} />
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.name} numberOfLines={1}>{device.name}</Text>
                        <Text style={styles.model}>{device.model}</Text>
                    </View>
                    <StatusBadge status={device.status} size="sm" />
                </View>

                {/* Battery + Network */}
                <View style={styles.row}>
                    <View style={styles.metaItem}>
                        {device.battery < 20 ? (
                            <BatteryLow size={13} color={batteryColor} />
                        ) : (
                            <Battery size={13} color={batteryColor} />
                        )}
                        <Text style={[styles.metaText, { color: batteryColor }]}>{device.battery}%</Text>
                    </View>
                    <View style={styles.metaDot} />
                    <View style={styles.metaItem}>
                        {device.network === 'disconnected' ? (
                            <WifiOff size={13} color={COLORS.text.muted} />
                        ) : (
                            <Wifi size={13} color={COLORS.info} />
                        )}
                        <Text style={styles.metaText}>{device.network}</Text>
                    </View>
                    <View style={styles.metaDot} />
                    <Text style={styles.metaText}>{device.lastActive}</Text>
                </View>

                {/* Battery bar */}
                <View style={styles.batteryBarBg}>
                    <View style={[styles.batteryBarFill, { width: `${device.battery}%`, backgroundColor: batteryColor }]} />
                </View>

                {/* Action Buttons */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
                    <View style={styles.actions}>
                        <ActionButton
                            icon={<Lock size={16} color={COLORS.warning} />}
                            label="Lock"
                            variant="warning"
                            onPress={() => showConfirm('Lock Device', `Lock ${device.name} remotely?`, 'Lock', 'warning', 'lock')}
                        />
                        <ActionButton
                            icon={<Camera size={16} color={COLORS.brand.primary} />}
                            label="Screenshot"
                            onPress={() => showConfirm('Capture Screenshot', `Capture a screenshot from ${device.name}?`, 'Capture', 'default', 'screenshot')}
                        />
                        <ActionButton
                            icon={<Video size={16} color={COLORS.info} />}
                            label="Webcam"
                            onPress={() => showConfirm('Capture Webcam', `Capture webcam photo from ${device.name}?`, 'Capture', 'default', 'webcam')}
                        />
                        <ActionButton
                            icon={<RefreshCw size={16} color={COLORS.info} />}
                            label="Restart"
                            variant="warning"
                            onPress={() => showConfirm('Restart Device', `Restart ${device.name}?`, 'Restart', 'warning', 'restart')}
                        />
                        <ActionButton
                            icon={<Power size={16} color={COLORS.danger} />}
                            label="Shutdown"
                            variant="danger"
                            onPress={() => showConfirm('Shutdown Device', `Shutdown ${device.name}? You won't be able to turn it back on remotely.`, 'Shutdown', 'danger', 'shutdown')}
                        />
                    </View>
                </ScrollView>

                {/* Details link */}
                <TouchableOpacity style={styles.detailsBtn} onPress={onPress} activeOpacity={0.7}>
                    <Text style={styles.detailsText}>View Details</Text>
                    <ChevronRight size={14} color={COLORS.brand.primary} />
                </TouchableOpacity>
            </View>

            {/* Confirmation Modal */}
            {modal && (
                <Modal transparent animationType="fade" visible={modal.visible}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>{modal.title}</Text>
                            <Text style={styles.modalBody}>{modal.body}</Text>
                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={modal.onCancel}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.confirmBtn, modal.variant === 'danger' && styles.confirmBtnDanger, modal.variant === 'warning' && styles.confirmBtnWarning]}
                                    onPress={modal.onConfirm}
                                >
                                    <Text style={styles.confirmText}>{modal.confirmText}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </>
    );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
    card: {
        backgroundColor: COLORS.bg.card,
        borderRadius: RADIUS.xl,
        padding: SPACING.base,
        borderWidth: 1,
        borderColor: COLORS.bg.glassBorder,
        ...SHADOWS.md,
        gap: SPACING.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    iconBg: {
        width: 42,
        height: 42,
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.bg.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.bg.glassBorder,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.bold,
        color: COLORS.text.primary,
    },
    model: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.text.muted,
        marginTop: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.text.muted,
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: COLORS.text.muted,
        marginHorizontal: 2,
    },
    batteryBarBg: {
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.bg.overlay,
        overflow: 'hidden',
    },
    batteryBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    actionsScroll: {
        marginHorizontal: -SPACING.base,
        paddingHorizontal: SPACING.base,
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        paddingVertical: 2,
    },
    detailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingTop: SPACING.xs,
        borderTopWidth: 1,
        borderTopColor: COLORS.bg.glassBorder,
    },
    detailsText: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.brand.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    modalCard: {
        width: '100%',
        backgroundColor: COLORS.bg.cardRaised,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.bg.glassBorder,
        gap: SPACING.md,
    },
    modalTitle: {
        fontSize: FONTS.sizes.lg,
        fontWeight: FONTS.weights.bold,
        color: COLORS.text.primary,
    },
    modalBody: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.text.secondary,
        lineHeight: 20,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: SPACING.sm,
        marginTop: SPACING.xs,
    },
    cancelBtn: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
    },
    cancelText: {
        fontSize: FONTS.sizes.sm,
        color: COLORS.text.muted,
        fontWeight: FONTS.weights.medium,
    },
    confirmBtn: {
        backgroundColor: COLORS.brand.primary,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
    },
    confirmBtnDanger: {
        backgroundColor: COLORS.danger,
    },
    confirmBtnWarning: {
        backgroundColor: COLORS.warning,
    },
    confirmText: {
        fontSize: FONTS.sizes.sm,
        color: '#FFFFFF',
        fontWeight: FONTS.weights.semibold,
    },
});
