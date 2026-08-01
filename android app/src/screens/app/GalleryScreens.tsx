import React, { useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, Dimensions, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AppHeader from '../../components/AppHeader';
import GalleryCard from '../../components/GalleryCard';
import type { GalleryItem } from '../../lib/types';
import { fetchCommandHistory, fetchDevices } from '../../lib/api';
import { COLORS, FONTS, SPACING } from '../../theme';

const { width } = Dimensions.get('window');
const CARD_W = (width - SPACING.base * 2 - SPACING.sm) / 2;

// The backend keeps every command (and its captured image) in the user's
// command history, so the gallery is that history filtered by capture type.
// Captures taken from the Devices list show up here automatically on focus.
type HistoryCommand = {
    id: string;
    deviceId: string;
    type?: string;
    status?: string;
    result?: { imageBase64?: string; imageUrl?: string; mimeType?: string; capturedAt?: string } | null;
    createdAt?: unknown;
    completedAt?: unknown;
};

// Tolerate every shape a server timestamp can arrive as: a ms number, an ISO
// string, a Firestore Timestamp (`{ _seconds, _nanoseconds }`) or the in-memory
// fallback's MockTimestamp (`{ seconds, nanoseconds }`).
const toMillis = (ts: unknown): number => {
    if (ts == null) return Date.now();
    if (typeof ts === 'number') return ts;
    if (typeof ts === 'string') { const d = Date.parse(ts); return Number.isNaN(d) ? Date.now() : d; }
    if (typeof ts === 'object') {
        const obj = ts as { _seconds?: unknown; seconds?: unknown };
        const s = obj._seconds ?? obj.seconds;
        if (s != null) return Number(s) * 1000;
    }
    return Date.now();
};

const formatBytes = (n: number) => (n > 0 ? `${(n / 1024).toFixed(0)} KB` : '—');

const toGalleryItem = (command: HistoryCommand, names: Map<string, string>): GalleryItem | null => {
    if (command.status !== 'completed') return null;
    const result = command.result;
    const imageBase64 = result?.imageBase64;
    const imageUrl = result?.imageUrl;
    if (!imageBase64 && !imageUrl) return null;
    const url = imageUrl || `data:${result?.mimeType || 'image/jpeg'};base64,${imageBase64}`;
    const captured = result?.capturedAt || command.completedAt || command.createdAt;
    const bytes = imageBase64 ? Math.round((imageBase64.length * 3) / 4) : 0;
    return {
        id: command.id,
        deviceId: command.deviceId,
        deviceName: names.get(command.deviceId) || 'Windows PC',
        url,
        capturedAt: new Date(toMillis(captured)).toLocaleString(),
        size: formatBytes(bytes),
        type: command.type === 'webcam' ? 'webcam' : 'screenshot',
    };
};

function useGallery(type: 'screenshot' | 'webcam') {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const [history, devices] = await Promise.all([fetchCommandHistory(), fetchDevices()]);
            const names = new Map<string, string>(devices.map((d) => [d.id, d.name]));
            const list = (history.commands || [])
                .filter((c: HistoryCommand) => c.type === type)
                .map((c: HistoryCommand) => toGalleryItem(c, names))
                .filter((x: GalleryItem | null): x is GalleryItem => Boolean(x));
            setItems(list);
        } catch (error: any) {
            console.warn(`Gallery (${type}) load failed:`, error.message);
        }
    }, [type]);

    // Reload every time the screen gains focus so a freshly captured image
    // (taken from the Devices list) is visible without a manual refresh.
    useFocusEffect(useCallback(() => { load(); }, [load]));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    return { items, refreshing, onRefresh };
}

function GalleryScreen({ title, items, refreshing, onRefresh }: any) {
    return (
        <View style={styles.root}>
            <LinearGradient colors={COLORS.bg.gradient} style={StyleSheet.absoluteFill} />
            <AppHeader title={title} subtitle={`${items.length} ${items.length === 1 ? 'capture' : 'captures'}`} showBack />
            <FlatList
                data={items}
                keyExtractor={(i: GalleryItem) => i.id}
                numColumns={2}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.text.muted} />}
                renderItem={({ item }) => (
                    <View style={{ width: CARD_W }}>
                        <GalleryCard item={item} />
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No {title.toLowerCase()} yet</Text>
                        <Text style={styles.emptyHint}>Capture one from the Devices list to see it here.</Text>
                    </View>
                }
            />
        </View>
    );
}

export function ScreenshotGalleryScreen() {
    const gallery = useGallery('screenshot');
    return <GalleryScreen title="Screenshots" {...gallery} />;
}

export function WebcamGalleryScreen() {
    const gallery = useGallery('webcam');
    return <GalleryScreen title="Webcam Captures" {...gallery} />;
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg.primary },
    grid: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.tabBar, flexGrow: 1 },
    row: { gap: SPACING.sm, marginBottom: SPACING.sm },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: COLORS.text.muted, fontSize: FONTS.sizes.base },
    emptyHint: { color: COLORS.text.muted, fontSize: FONTS.sizes.sm, marginTop: 8, textAlign: 'center', paddingHorizontal: 24 },
});
