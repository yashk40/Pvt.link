import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
    KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Mail, ArrowLeft, Send } from 'lucide-react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props { navigation: NativeStackNavigationProp<any>; }

export default function ForgotPasswordScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleReset = async () => {
        if (!email) { setError('Please enter your email.'); return; }
        setLoading(true); setError('');
        try {
            await sendPasswordResetEmail(auth, email);
            setSent(true);
        } catch (e: any) {
            setError(e.message?.replace('Firebase: ', '') || 'Failed to send reset email.');
        } finally { setLoading(false); }
    };

    return (
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <LinearGradient colors={COLORS.bg.gradient} style={StyleSheet.absoluteFill} />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={20} color={COLORS.text.primary} />
                </TouchableOpacity>

                <View style={styles.logoRow}>
                    <LinearGradient colors={COLORS.brand.gradient} style={styles.logoIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Shield size={22} color="#fff" />
                    </LinearGradient>
                </View>

                <Text style={styles.headline}>Reset password</Text>
                <Text style={styles.subtext}>Enter your email and we'll send you a link to reset your password.</Text>

                <View style={styles.card}>
                    {sent ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successTitle}>Email sent!</Text>
                            <Text style={styles.successText}>Check your inbox for a password reset link from Firebase.</Text>
                        </View>
                    ) : (
                        <>
                            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email address</Text>
                                <View style={styles.inputWrap}>
                                    <Mail size={16} color={COLORS.text.muted} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="you@example.com"
                                        placeholderTextColor={COLORS.text.muted}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleReset} activeOpacity={0.85} disabled={loading}>
                                <LinearGradient colors={COLORS.brand.gradient} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                    {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                                        <><Send size={16} color="#fff" /><Text style={styles.btnText}>Send Reset Link</Text></>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <TouchableOpacity style={styles.backToLogin} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.backToLoginText}>← Back to Login</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg.primary },
    scroll: { paddingHorizontal: SPACING.base, paddingBottom: SPACING['4xl'] },
    backBtn: { marginTop: 60, width: 40, height: 40, borderRadius: 40, backgroundColor: COLORS.bg.overlay, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.bg.glassBorder },
    logoRow: { marginTop: SPACING.xl, marginBottom: SPACING.xl },
    logoIcon: { width: 48, height: 48, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
    headline: { fontSize: FONTS.sizes['3xl'], fontWeight: FONTS.weights.black, color: COLORS.text.primary, letterSpacing: -0.8 },
    subtext: { fontSize: FONTS.sizes.base, color: COLORS.text.secondary, marginTop: 6, marginBottom: SPACING.xl, lineHeight: 22 },
    card: { backgroundColor: COLORS.bg.card, borderRadius: RADIUS['2xl'], padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.bg.glassBorder, gap: SPACING.md },
    errorBox: { backgroundColor: 'rgba(220,38,38,0.10)', borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)' },
    errorText: { color: COLORS.danger, fontSize: FONTS.sizes.sm },
    successBox: { gap: SPACING.sm, padding: SPACING.sm },
    successTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.success },
    successText: { fontSize: FONTS.sizes.base, color: COLORS.text.secondary, lineHeight: 22 },
    inputGroup: { gap: 6 },
    label: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.text.secondary },
    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg.overlay, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 14, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.bg.glassBorder },
    input: { flex: 1, color: COLORS.text.primary, fontSize: FONTS.sizes.base },
    btn: { paddingVertical: 16, borderRadius: RADIUS.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#0F766E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 12, elevation: 5 },
    btnText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: '#fff' },
    backToLogin: { alignItems: 'center', marginTop: SPACING.xl },
    backToLoginText: { color: COLORS.brand.primary, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium },
});
