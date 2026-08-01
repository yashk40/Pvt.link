import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';
import TimelineItem from '../../components/TimelineItem';
import type { ActivityItem, ActivityType } from '../../lib/types';
import { fetchCommandHistory, fetchDevices } from '../../lib/api';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../../theme';

const TYPE_FILTERS: { label: string; value: ActivityType | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Lock', value: 'locked' },
    { label: 'Screenshot', value: 'screenshot' },
    { label: 'Webcam', value: 'webcam' },
    { label: 'Connect', value: 'connected' },
];

export default function ActivityScreen() {
    const [filter, setFilter] = useState<ActivityType | 'all'>('all');
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const loadHistory = useCallback(async () => {
        try {
            setLoading(true);
            const [{ commands }, devices] = await Promise.all([
                fetchCommandHistory(),
                fetchDevices().catch(() => [])
            ]);
            
            const deviceMap = (devices || []).reduce((acc: any, d: any) => {
                acc[d.id] = d.name;
                return acc;
            }, {} as Record<string, string>);

            const mapped = (commands || []).map((c: any) => ({
                id: c.id,
                type: (c.type === 'lock' ? 'locked' : c.type) as ActivityType,
                deviceName: deviceMap[c.deviceId] || 'Windows PC',
                timestamp: c.createdAt ? (typeof c.createdAt === 'string' ? new Date(c.createdAt).toLocaleString() : new Date((c.createdAt.seconds || 0) * 1000).toLocaleString()) : 'Unknown time',
                detail: c.status === 'completed' ? 'Command successful' : (c.status === 'failed' ? 'Command failed' : 'Pending'),
                imageBase64: c.result?.imageBase64,
                imageUrl: c.result?.imageUrl,
                mimeType: c.result?.mimeType
            }));
            
            setActivities(mapped);
        } catch (error: any) {
            console.warn('Failed to load history:', error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const filtered = activities.filter(a => filter === 'all' || a.type === filter);

    return (
        <View style={styles.root}>
            <LinearGradient colors={COLORS.bg.gradient} style={StyleSheet.absoluteFill} />
            <AppHeader title="Activity" subtitle="Command history" showBrand />

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersScroll}
                contentContainerStyle={styles.filters}
            >
                {TYPE_FILTERS.map(f => (
                    <TouchableOpacity
                        key={f.value}
                        style={[styles.filterTab, filter === f.value && styles.filterTabActive]}
                        onPress={() => setFilter(f.value)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.empty}><ActivityIndicator color={COLORS.brand.primary} /></View>
                ) : filtered.length === 0 ? (
                    <View style={styles.empty}><Text style={styles.emptyText}>No activity found</Text></View>
                ) : (
                    <View style={styles.timeline}>
                        {filtered.map((item: any, i) => (
                            <TouchableOpacity 
                                key={item.id} 
                                activeOpacity={item.imageBase64 || item.imageUrl ? 0.7 : 1}
                                onPress={() => {
                                    if (item.imageUrl) {
                                        setSelectedImage(item.imageUrl);
                                    } else if (item.imageBase64) {
                                        setSelectedImage(`data:${item.mimeType || 'image/jpeg'};base64,${item.imageBase64}`);
                                    }
                                }}
                            >
                                <TimelineItem
                                    type={item.type}
                                    deviceName={item.deviceName}
                                    timestamp={item.timestamp}
                                    detail={item.imageBase64 || item.imageUrl ? 'Tap to view image' : item.detail}
                                    isLast={i === filtered.length - 1}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            <Modal transparent visible={Boolean(selectedImage)} animationType="fade" onRequestClose={() => setSelectedImage(null)}>
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <TouchableOpacity style={styles.close} onPress={() => setSelectedImage(null)}>
                            <X size={20} color={COLORS.text.muted} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Saved image</Text>
                        {selectedImage ? <Image source={{ uri: selectedImage }} resizeMode="contain" style={styles.screenshot} /> : null}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg.primary },
    filtersScroll: { maxHeight: 50 },
    filters: {
        paddingHorizontal: SPACING.base,
        paddingBottom: SPACING.sm,
        gap: SPACING.xs,
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterTab: {
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.bg.overlay,
        borderWidth: 1,
        borderColor: COLORS.bg.glassBorder,
    },
    filterTabActive: {
        backgroundColor: 'rgba(15,118,110,0.12)',
        borderColor: 'rgba(15,118,110,0.4)',
    },
    filterText: { fontSize: FONTS.sizes.sm, color: COLORS.text.muted, fontWeight: FONTS.weights.medium },
    filterTextActive: { color: COLORS.brand.primary },
    scroll: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.tabBar },
    timeline: {
        backgroundColor: COLORS.bg.card,
        borderRadius: RADIUS.xl,
        padding: SPACING.base,
        borderWidth: 1,
        borderColor: COLORS.bg.glassBorder,
    },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: COLORS.text.muted, fontSize: FONTS.sizes.sm },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.72)', alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
    modal: { width: '100%', backgroundColor: COLORS.bg.cardRaised, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.bg.glassBorder },
    close: { alignSelf: 'flex-end' },
    modalTitle: { color: COLORS.text.primary, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, marginTop: -20 },
    screenshot: { width: '100%', height: 300, marginTop: SPACING.lg, borderRadius: RADIUS.md, backgroundColor: '#000' },
});
