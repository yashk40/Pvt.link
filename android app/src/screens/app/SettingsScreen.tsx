import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, TextInput, ActivityIndicator, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    User, Shield, Palette, Monitor, Trash2, LogOut,
    ChevronRight, Check, X,
} from 'lucide-react-native';
import { updateProfile, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { clearBackendSession } from '../../lib/api';
import { confirm, notify } from '../../lib/dialog';
import {
    ACCENT_LABELS,
    type AccentColor,
} from '../../lib/settings';
import { useSettings } from '../../lib/SettingsContext';
import AppHeader from '../../components/AppHeader';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

function SettingsRow({
    icon, label, value, onPress, rightEl, danger = false,
}: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    onPress?: () => void;
    rightEl?: React.ReactNode;
    danger?: boolean;
}) {
    const { colors: COLORS } = useTheme();
    const styles = makeStyles(COLORS);
    return (
        <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress && !rightEl}>
            <View style={[styles.rowIcon, danger && { backgroundColor: 'rgba(220,38,38,0.10)' }]}>
                {icon}
            </View>
            <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, danger && { color: COLORS.danger }]}>{label}</Text>
                {value ? <Text style={styles.rowValue}>{value}</Text> : null}
            </View>
            {rightEl ?? (onPress ? <ChevronRight size={16} color={COLORS.text.muted} /> : null)}
        </TouchableOpacity>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    const { colors: COLORS } = useTheme();
    const styles = makeStyles(COLORS);
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionCard}>{children}</View>
        </View>
    );
}

export default function SettingsScreen({ navigation }: any) {
    const { colors: COLORS } = useTheme();
    const styles = makeStyles(COLORS);
    const { settings, patchSettings } = useSettings();

    const user = auth.currentUser;
    const [displayName, setDisplayName] = useState(user?.displayName || 'User');
    const email = user?.email || 'no-email@pvtlink.app';
    const initial = (displayName?.trim()?.[0] || email[0] || 'U').toUpperCase();
    const [busy, setBusy] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [nameDraft, setNameDraft] = useState(displayName);
    const [accentOpen, setAccentOpen] = useState(false);

    const handleSaveName = async () => {
        const name = nameDraft.trim();
        if (!name) { notify('Name required', 'Please enter a display name.'); return; }
        if (!user) { notify('Not signed in', 'You need to be signed in to edit your profile.'); return; }
        setBusy(true);
        try {
            await updateProfile(user, { displayName: name });
            setDisplayName(name);
            setEditOpen(false);
        } catch (e: any) {
            notify('Update failed', e?.message?.replace('Firebase: ', '') || 'Could not update profile.');
        } finally {
            setBusy(false);
        }
    };

    const handleChangePassword = () => {
        if (!user?.email) { notify('No email', 'No email is associated with this account.'); return; }
        confirm(
            'Change Password',
            `We'll send a password reset link to ${user.email}. Continue?`,
            async () => {
                try {
                    await sendPasswordResetEmail(auth, user.email!);
                    notify('Email sent', 'Check your inbox for a password reset link.');
                } catch (e: any) {
                    notify('Failed', e?.message?.replace('Firebase: ', '') || 'Could not send reset email.');
                }
            },
            { confirmText: 'Send Link' }
        );
    };

    const handleManageDevices = () => {
        navigation.navigate('Devices');
    };

    const handleLogout = () => {
        confirm(
            'Logout',
            'Are you sure you want to sign out?',
            async () => {
                // clearBackendSession signs out of Firebase Auth. onAuthStateChanged
                // in App.tsx flips user -> null, which swaps the root navigator
                // back to the Auth flow automatically.
                try {
                    await clearBackendSession();
                } catch (e: any) {
                    notify('Logout failed', e?.message?.replace('Firebase: ', '') || 'Could not sign out.');
                }
            },
            { confirmText: 'Logout', destructive: true }
        );
    };

    const handleDeleteAccount = () => {
        confirm(
            'Delete Account',
            'This will permanently delete your account and all device data. This action cannot be undone.',
            async () => {
                try {
                    if (user) await deleteUser(user);
                    // On success, onAuthStateChanged flips user -> null and
                    // the root navigator swaps back to the Auth flow.
                } catch (e: any) {
                    // Firebase requires a recent login to delete; fall back to sign-out
                    // so the app still returns to the login screen.
                    if (e?.code === 'auth/requires-recent-login') {
                        notify('Re-login required', 'Please log in again to confirm account deletion.');
                    }
                    try { await clearBackendSession(); } catch { /* ignore */ }
                }
            },
            { confirmText: 'Delete', destructive: true }
        );
    };

    return (
        <View style={styles.root}>
            <LinearGradient colors={COLORS.bg.gradient} style={StyleSheet.absoluteFill} />
            <AppHeader title="Settings" showBrand />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Profile */}
                <View style={styles.profileCard}>
                    <LinearGradient colors={COLORS.brand.gradient} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Text style={styles.avatarInitial}>{initial}</Text>
                    </LinearGradient>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
                        <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
                    </View>
                </View>

                <Section title="Profile">
                    <SettingsRow
                        icon={<User size={16} color={COLORS.brand.primary} />}
                        label="Edit Profile"
                        value="Update your display name"
                        onPress={() => { setNameDraft(displayName); setEditOpen(true); }}
                    />
                </Section>

                <Section title="Security">
                    <SettingsRow icon={<Shield size={16} color={COLORS.brand.primary} />} label="Change Password" onPress={handleChangePassword} />
                </Section>

                <Section title="Appearance">
                    <SettingsRow
                        icon={<Palette size={16} color={COLORS.warning} />}
                        label="Accent Color"
                        value={ACCENT_LABELS[settings.accentColor]}
                        onPress={() => setAccentOpen(true)}
                    />
                </Section>

                <Section title="Connected Devices">
                    <SettingsRow icon={<Monitor size={16} color={COLORS.info} />} label="Manage Devices" value="View all devices" onPress={handleManageDevices} />
                </Section>

                <Section title="Danger Zone">
                    <SettingsRow
                        icon={<LogOut size={16} color={COLORS.warning} />}
                        label="Logout"
                        onPress={handleLogout}
                    />
                    <SettingsRow
                        icon={<Trash2 size={16} color={COLORS.danger} />}
                        label="Delete Account"
                        onPress={handleDeleteAccount}
                        danger
                    />
                </Section>

                <Text style={styles.versionText}>Pvt.link v1.0.0 · End-to-end encrypted</Text>
            </ScrollView>

            {/* Edit Profile modal */}
            <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => !busy && setEditOpen(false)}>
                    <Pressable style={styles.modalCard} onPress={() => {}}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => !busy && setEditOpen(false)}>
                                <X size={20} color={COLORS.text.muted} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalLabel}>Display Name</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={nameDraft}
                            onChangeText={setNameDraft}
                            placeholder="Your name"
                            placeholderTextColor={COLORS.text.muted}
                            autoFocus
                            editable={!busy}
                        />
                        <TouchableOpacity onPress={handleSaveName} activeOpacity={0.85} disabled={busy}>
                            <LinearGradient colors={COLORS.brand.gradient} style={styles.modalBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalBtnText}>Save</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Accent color picker */}
            <PickerModal
                visible={accentOpen}
                title="Accent Color"
                options={Object.entries(ACCENT_LABELS).map(([value, label]) => ({ value, label }))}
                selected={settings.accentColor}
                onSelect={(v) => { patchSettings({ accentColor: v as AccentColor }); setAccentOpen(false); }}
                onClose={() => setAccentOpen(false)}
                COLORS={COLORS}
            />
        </View>
    );
}

function PickerModal({
    visible, title, options, selected, onSelect, onClose, COLORS,
}: {
    visible: boolean;
    title: string;
    options: { value: string; label: string }[];
    selected: string;
    onSelect: (value: string) => void;
    onClose: () => void;
    COLORS: ReturnType<typeof useTheme>['colors'];
}) {
    const styles = makeStyles(COLORS);
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.modalBackdrop} onPress={onClose}>
                <Pressable style={styles.modalCard} onPress={() => {}}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={20} color={COLORS.text.muted} />
                        </TouchableOpacity>
                    </View>
                    {options.map((opt) => {
                        const active = opt.value === selected;
                        return (
                            <TouchableOpacity key={opt.value} style={styles.optionRow} onPress={() => onSelect(opt.value)} activeOpacity={0.7}>
                                <Text style={[styles.optionLabel, active && { color: COLORS.brand.primary, fontWeight: FONTS.weights.semibold }]}>
                                    {opt.label}
                                </Text>
                                {active ? <Check size={18} color={COLORS.brand.primary} /> : null}
                            </TouchableOpacity>
                        );
                    })}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const makeStyles = (COLORS: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg.primary },
    scroll: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.tabBar },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        backgroundColor: COLORS.bg.card,
        borderRadius: RADIUS.xl,
        padding: SPACING.base,
        borderWidth: 1,
        borderColor: COLORS.bg.glassBorder,
        marginBottom: SPACING.xl,
        ...SHADOWS.sm,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: '#fff' },
    profileInfo: { flex: 1 },
    profileName: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.text.primary },
    profileEmail: { fontSize: FONTS.sizes.sm, color: COLORS.text.muted, marginTop: 2 },
    section: { marginBottom: SPACING.xl },
    sectionTitle: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.semibold,
        color: COLORS.text.muted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.sm,
    },
    sectionCard: {
        backgroundColor: COLORS.bg.card,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.bg.glassBorder,
        overflow: 'hidden',
        ...SHADOWS.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.bg.glassBorder,
    },
    rowIcon: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.bg.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowContent: { flex: 1, gap: 2 },
    rowLabel: { fontSize: FONTS.sizes.base, color: COLORS.text.primary, fontWeight: FONTS.weights.medium },
    rowValue: { fontSize: FONTS.sizes.xs, color: COLORS.text.muted },
    versionText: { textAlign: 'center', color: COLORS.text.muted, fontSize: FONTS.sizes.xs, marginTop: SPACING.sm },

    // Modals
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
    },
    modalCard: {
        backgroundColor: COLORS.bg.card,
        borderRadius: RADIUS['2xl'],
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.bg.glassBorder,
        gap: SPACING.md,
        ...SHADOWS.lg,
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.text.primary },
    modalLabel: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.text.secondary },
    modalInput: {
        backgroundColor: COLORS.bg.overlay,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: COLORS.bg.glassBorder,
        color: COLORS.text.primary,
        fontSize: FONTS.sizes.base,
    },
    modalBtn: {
        paddingVertical: 15,
        borderRadius: RADIUS.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.xs,
    },
    modalBtnText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: '#fff' },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.bg.glassBorder,
    },
    optionLabel: { fontSize: FONTS.sizes.base, color: COLORS.text.primary },
});
