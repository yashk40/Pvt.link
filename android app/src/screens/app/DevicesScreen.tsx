import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Modal, Alert, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Link2, X } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';
import DeviceCard from '../../components/DeviceCard';
import type { Device } from '../../lib/types';
import { fetchDevices, pairDesktop, sendDeviceCommand } from '../../lib/api';
import { connectRealtime } from '../../lib/realtime';
import { FONTS, RADIUS, SPACING, type ThemeColors } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

const FILTER_TABS = ['All', 'Online', 'Offline', 'Idle'];
type Command = 'lock' | 'unlock' | 'restart' | 'shutdown' | 'sleep' | 'screenshot' | 'webcam';

export default function DevicesScreen({ navigation }: any) {
    const { colors: COLORS } = useTheme();
    const styles = makeStyles(COLORS);
    const [devices, setDevices] = useState<Device[]>([]); const [search, setSearch] = useState(''); const [activeTab, setActiveTab] = useState('All');
    const [pairOpen, setPairOpen] = useState(false); const [pairCode, setPairCode] = useState(''); const [busy, setBusy] = useState(false); const [screenshot, setScreenshot] = useState<string | null>(null);
    const toImageUri = (result: { imageUrl?: string; imageBase64?: string; mimeType?: string }) => {
        if (result.imageUrl) return result.imageUrl;
        if (result.imageBase64) return `data:${result.mimeType || 'image/jpeg'};base64,${result.imageBase64}`;
        return null;
    };
    const load = useCallback(async () => { try { setDevices(await fetchDevices()); } catch (error: any) { console.warn(error.message); } }, []);
    useEffect(() => { load(); }, [load]);
    useEffect(() => connectRealtime((event) => {
        const imageUri = toImageUri(event.result || {});
        if (imageUri) {
            Alert.alert('Image Received', 'Image is ready to view!');
            setScreenshot(imageUri);
        }
        else if (event.status === 'failed') Alert.alert('Command failed', event.result?.message || 'The PC could not complete the command.');
    }, load), [load]);
    const pair = async () => {
        const code = pairCode.trim();
        if (!code) { Alert.alert('Pairing failed', 'Enter the 8-character code shown in the Windows app.'); return; }
        setBusy(true); try { await pairDesktop(code); setPairOpen(false); setPairCode(''); await load(); Alert.alert('PC paired', 'Your Windows device is ready to control.'); }
        catch (error: any) { Alert.alert('Pairing failed', error.message); } finally { setBusy(false); }
    };
    const command = async (device: Device, type: Command) => {
        try { await sendDeviceCommand(device.id, type); Alert.alert('Command sent', `${type} was sent to ${device.name}.`); }
        catch (error: any) { Alert.alert('Command failed', error.message); }
    };
    const filtered = devices.filter((d) => (d.name.toLowerCase().includes(search.toLowerCase()) || d.model.toLowerCase().includes(search.toLowerCase())) && (activeTab === 'All' || d.status === activeTab.toLowerCase()));
    return <View style={styles.root}>
        <LinearGradient colors={COLORS.bg.gradient} style={StyleSheet.absoluteFill} />
        <AppHeader title="Devices" subtitle={`${devices.length} paired`} showBrand />
        <View style={styles.controls}>
            <View style={styles.topRow}><View style={styles.searchWrap}><Search size={16} color={COLORS.text.muted} /><TextInput style={styles.searchInput} placeholder="Search devices..." placeholderTextColor={COLORS.text.muted} value={search} onChangeText={setSearch} /></View>
                <TouchableOpacity style={styles.pairButton} onPress={() => setPairOpen(true)}><Link2 size={17} color="#fff" /><Text style={styles.pairText}>Pair PC</Text></TouchableOpacity></View>
            <View style={styles.tabs}>{FILTER_TABS.map((tab) => <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}><Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text></TouchableOpacity>)}</View>
        </View>
        <FlatList data={filtered} keyExtractor={(d) => d.id} contentContainerStyle={styles.list} refreshing={busy} onRefresh={load} renderItem={({ item }) => <DeviceCard device={item} onPress={() => navigation.navigate('DeviceDetails', { deviceId: item.id, device: item })} onCommand={(type) => command(item, type)} />} ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No PCs paired yet</Text><Text style={styles.emptyHint}>Open the Windows app and enter its pairing code here.</Text></View>} ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />} />
        <Modal transparent visible={pairOpen} animationType="fade" onRequestClose={() => setPairOpen(false)}><View style={styles.overlay}><View style={styles.modal}><TouchableOpacity style={styles.close} onPress={() => setPairOpen(false)}><X size={20} color={COLORS.text.muted} /></TouchableOpacity><Text style={styles.modalTitle}>Pair Windows PC</Text><Text style={styles.modalText}>Enter the 8-character code shown in the Windows RemoteLock app.</Text><TextInput style={styles.codeInput} value={pairCode} onChangeText={setPairCode} placeholder="AB12CD34" placeholderTextColor={COLORS.text.muted} autoCapitalize="characters" maxLength={12} /><TouchableOpacity style={styles.connect} disabled={busy} onPress={pair}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.connectText}>Pair device</Text>}</TouchableOpacity></View></View></Modal>
        <Modal transparent visible={Boolean(screenshot)} animationType="fade" onRequestClose={() => setScreenshot(null)}><View style={styles.overlay}><View style={styles.modal}><TouchableOpacity style={styles.close} onPress={() => setScreenshot(null)}><X size={20} color={COLORS.text.muted} /></TouchableOpacity><Text style={styles.modalTitle}>Live screenshot</Text>{screenshot ? <Image source={{ uri: screenshot }} resizeMode="contain" style={styles.screenshot} /> : null}</View></View></Modal>
    </View>;
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg.primary }, controls: { paddingHorizontal: SPACING.base, gap: SPACING.sm, marginBottom: SPACING.sm }, topRow: { flexDirection: 'row', gap: SPACING.sm },
    searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg.card, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 12, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.bg.glassBorder }, searchInput: { flex: 1, color: COLORS.text.primary, fontSize: FONTS.sizes.base },
    pairButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.brand.primary, paddingHorizontal: SPACING.md, borderRadius: RADIUS.lg }, pairText: { color: '#fff', fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold }, tabs: { flexDirection: 'row', gap: SPACING.xs }, tab: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.bg.overlay, borderWidth: 1, borderColor: COLORS.bg.glassBorder }, tabActive: { backgroundColor: COLORS.brand.tint, borderColor: COLORS.brand.tintBorder }, tabText: { fontSize: FONTS.sizes.sm, color: COLORS.text.muted, fontWeight: FONTS.weights.medium }, tabTextActive: { color: COLORS.brand.primary },
    list: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.tabBar, flexGrow: 1 }, empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 }, emptyText: { color: COLORS.text.primary, fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold }, emptyHint: { color: COLORS.text.muted, fontSize: FONTS.sizes.sm, textAlign: 'center', marginTop: 8 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.72)', alignItems: 'center', justifyContent: 'center', padding: SPACING.xl }, modal: { width: '100%', backgroundColor: COLORS.bg.cardRaised, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.bg.glassBorder }, close: { alignSelf: 'flex-end' }, modalTitle: { color: COLORS.text.primary, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, marginTop: -20 }, modalText: { color: COLORS.text.secondary, fontSize: FONTS.sizes.sm, marginTop: SPACING.sm, lineHeight: 20 }, codeInput: { color: COLORS.text.primary, backgroundColor: COLORS.bg.overlay, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.bg.glassBorder, marginTop: SPACING.lg, padding: 14, fontSize: 20, letterSpacing: 2, fontWeight: FONTS.weights.semibold }, connect: { backgroundColor: COLORS.brand.primary, alignItems: 'center', borderRadius: RADIUS.md, padding: 14, marginTop: SPACING.md }, connectText: { color: '#fff', fontWeight: FONTS.weights.semibold },
    screenshot: { width: '100%', height: 300, marginTop: SPACING.lg, borderRadius: RADIUS.md, backgroundColor: '#000' },
});
