import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props { navigation: NativeStackNavigationProp<any>; }

export default function RegisterScreen({ navigation }: Props) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async () => {
        if (!name || !email || !password) { setError('Please fill all fields.'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        setLoading(true); setError('');
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(cred.user, { displayName: name });
            // onAuthStateChanged in App.tsx automatically switches to AppNavigator
        } catch (e: any) {
            setError(e.message?.replace('Firebase: ', '') || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.logoRow}>
                    <View style={styles.logoIcon}>
                        <Shield size={22} color="#fff" />
                    </View>
                    <Text style={styles.logoText}>pvt<Text style={{ color: '#0F766E' }}>.link</Text></Text>
                </View>

                <Text style={styles.headline}>Create account</Text>
                <Text style={styles.subtext}>Get started securing your devices in seconds</Text>

                <View style={styles.card}>
                    {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputWrap}>
                            <User size={16} color={COLORS.text.muted} />
                            <TextInput
                                style={styles.input}
                                placeholder="John Doe"
                                placeholderTextColor={COLORS.text.muted}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
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
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrap}>
                            <Lock size={16} color={COLORS.text.muted} />
                            <TextInput
                                style={styles.input}
                                placeholder="Min 8 characters"
                                placeholderTextColor={COLORS.text.muted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPw}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowPw(v => !v)}>
                                {showPw ? <EyeOff size={16} color={COLORS.text.muted} /> : <Eye size={16} color={COLORS.text.muted} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity onPress={handleRegister} activeOpacity={0.85} disabled={loading}>
                        <View style={styles.btn}>
                            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                                <><Text style={styles.btnText}>Create Account</Text><ArrowRight size={18} color="#fff" /></>
                            )}
                        </View>
                    </TouchableOpacity>

                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.footerLink}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f5f5f7' },
    scroll: { paddingHorizontal: 20, paddingBottom: SPACING['4xl'] },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingTop: 56, marginBottom: 36 },
    logoIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#0F766E', justifyContent: 'center', alignItems: 'center' },
    logoText: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, fontFamily: 'Poppins_700Bold', color: '#1d1d1f' },
    headline: { fontSize: FONTS.sizes['3xl'], fontWeight: FONTS.weights.black, fontFamily: 'Poppins_900Black', color: '#1d1d1f', letterSpacing: -1.1 },
    subtext: { fontSize: FONTS.sizes.base, fontFamily: 'Poppins_400Regular', color: '#64748b', marginTop: 6, marginBottom: SPACING.xl },
    card: { backgroundColor: '#ffffff', borderRadius: 20, padding: SPACING.xl, borderWidth: 1, borderColor: '#e5e5ea', gap: SPACING.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
    errorBox: { backgroundColor: '#fef2f2', borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: '#fecaca' },
    errorText: { color: '#dc2626', fontSize: FONTS.sizes.sm, fontFamily: 'Poppins_400Regular' },
    inputGroup: { gap: 6 },
    label: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, fontFamily: 'Poppins_500Medium', color: '#334155' },
    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f2f7', borderRadius: 14, paddingHorizontal: SPACING.md, paddingVertical: 14, gap: SPACING.sm, borderWidth: 1, borderColor: '#e5e5ea' },
    input: { flex: 1, color: '#1d1d1f', fontSize: FONTS.sizes.base, fontFamily: 'Poppins_400Regular' },
    btn: { paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0F766E', shadowColor: '#0F766E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 12, elevation: 5 },
    btnText: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, fontFamily: 'Poppins_700Bold', color: '#fff' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
    footerText: { color: '#64748b', fontSize: FONTS.sizes.sm, fontFamily: 'Poppins_400Regular' },
    footerLink: { color: '#0F766E', fontWeight: FONTS.weights.semibold, fontSize: FONTS.sizes.sm, fontFamily: 'Poppins_600SemiBold' },
});
