import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Download, Trash2 } from 'lucide-react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme';
import type { GalleryItem } from '../lib/types';

interface GalleryCardProps {
    item: GalleryItem;
    onDelete?: () => void;
}

export default function GalleryCard({ item, onDelete }: GalleryCardProps) {
    return (
        <View style={styles.card}>
            <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
            <View style={styles.overlay}>
                <View style={styles.info}>
                    <Text style={styles.deviceName} numberOfLines={1}>{item.deviceName}</Text>
                    <Text style={styles.time}>{item.capturedAt}</Text>
                    <Text style={styles.size}>{item.size}</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Download size={14} color={COLORS.brand.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
                        <Trash2 size={14} color={COLORS.danger} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        backgroundColor: COLORS.bg.overlay,
        borderWidth: 1,
        borderColor: COLORS.bg.glassBorder,
    },
    image: {
        width: '100%',
        height: 120,
        backgroundColor: COLORS.bg.tertiary,
    },
    overlay: {
        padding: SPACING.sm,
        gap: SPACING.xs,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    info: { flex: 1, gap: 1 },
    deviceName: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.text.primary,
    },
    time: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.text.muted,
    },
    size: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.text.muted,
    },
    actions: {
        flexDirection: 'row',
        gap: 6,
    },
    actionBtn: {
        width: 30,
        height: 30,
        borderRadius: RADIUS.sm,
        backgroundColor: 'rgba(15,118,110,0.10)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(15,118,110,0.2)',
    },
    deleteBtn: {
        backgroundColor: 'rgba(220,38,38,0.10)',
        borderColor: 'rgba(220,38,38,0.2)',
    },
});
