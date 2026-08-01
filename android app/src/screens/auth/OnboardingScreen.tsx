import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Smartphone, Lock, Eye } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONTS, RADIUS, SPACING } from '../../theme';

const { width } = Dimensions.get('window');

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

export default function OnboardingScreen({ navigation }: Props) {
    // FEATURES defined inside the component to avoid module-level JSX evaluation
    const FEATURES = [
        { icon: <Lock size={22} color="#0F766E" />, title: 'Remote Lock', desc: 'Lock any device instantly from anywhere in the world.' },
        { icon: <Eye size={22} color={COLORS.info} />, title: 'Live Screenshot', desc: 'Capture the current screen of your connected device.' },
        { icon: <Smartphone size={22} color={COLORS.success} />, title: 'Multi-Device', desc: 'Manage all your Android, iOS, Windows & Mac devices.' },
        { icon: <Shield size={22} color={COLORS.warning} />, title: 'End-to-End Secure', desc: 'All commands are encrypted and authenticated.' },
    ];

    return (
        <View style={styles.root}>
            <LinearGradient
                colors={COLORS.bg.gradient}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Logo */}
                <View style={styles.logoRow}>
                    <LinearGradient
                        colors={COLORS.brand.gradient}
                        style={styles.logoIcon}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Shield size={26} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.logoText}>pvt<Text style={styles.logoDot}>.link</Text></Text>
                </View>

                {/* Hero */}
                <View style={styles.heroSection}>
                    <View style={styles.phoneIllustration}>
                        <LinearGradient
                            colors={COLORS.isDark ? ['#102a2b', '#111820'] : ['#ecfdf5', '#f7fffb']}
                            style={styles.phoneBg}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.phoneScreen}>
                                <View style={styles.phoneDot} />
                                <View style={[styles.phoneLine, { width: '80%' }]} />
                                <View style={[styles.phoneLine, { width: '60%' }]} />
                                <View style={styles.phoneGrid}>
                                    {[COLORS.brand.primary, COLORS.info, COLORS.success, COLORS.warning].map((c, i) => (
                                        <View key={i} style={[styles.phoneBlock, { backgroundColor: `${c}25` }]} />
                                    ))}
                                </View>
                            </View>
                        </LinearGradient>
                        {/* Floating badge */}
                        <View style={styles.floatingBadge}>
                            <View style={styles.floatingDot} />
                            <Text style={styles.floatingText}>4 Devices Secured</Text>
                        </View>
                    </View>

                    <Text style={styles.headline}>
                        Control Every{'\n'}Device,{' '}
                        <Text style={styles.headlineAccent}>Anywhere</Text>
                    </Text>
                    <Text style={styles.subtext}>
                        Pvt.link gives you complete remote control over all your devices — lock, monitor, capture, and secure from a single app.
                    </Text>
                </View>

                {/* Features */}
                <View style={styles.featuresSection}>
                    {FEATURES.map((f, i) => (
                        <View key={i} style={styles.featureCard}>
                            <View style={styles.featureIcon}>{f.icon}</View>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>{f.title}</Text>
                                <Text style={styles.featureDesc}>{f.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* CTA Buttons */}
                <View style={styles.ctas}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <LinearGradient
                            colors={COLORS.brand.gradient}
                            style={styles.primaryBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.primaryBtnText}>Get Started — Free</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.secondaryBtnText}>Sign in to existing account</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.footer}>End-to-end encrypted · No ads · No data selling</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f5f5f7' },
    scroll: { paddingHorizontal: 20, paddingBottom: SPACING['4xl'] },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingTop: 56,
        marginBottom: SPACING['2xl'],
    },
    logoIcon: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: FONTS.sizes['2xl'],
        fontWeight: FONTS.weights.bold,
        fontFamily: 'Poppins_700Bold',
        color: '#172554',
        letterSpacing: -0.5,
    },
    logoDot: { color: '#0F766E' },
    heroSection: { alignItems: 'center', marginBottom: 36 },
    phoneIllustration: { width: '100%', alignItems: 'center', marginBottom: SPACING.lg },
    phoneBg: {
        width: 196,
        height: 196,
        borderRadius: 28,
        padding: SPACING.base,
        borderWidth: 1,
        borderColor: '#d2d2d7',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
    },
    phoneScreen: { gap: SPACING.sm },
    phoneDot: {
        width: 52,
        height: 8,
        borderRadius: RADIUS.sm,
        backgroundColor: 'rgba(15,118,110,0.35)',
        alignSelf: 'center',
    },
    phoneLine: {
        height: 8,
        borderRadius: RADIUS.full,
        backgroundColor: 'rgba(30,41,59,0.12)',
        alignSelf: 'center',
    },
    phoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    phoneBlock: {
        width: '45%',
        height: 30,
        borderRadius: RADIUS.sm,
    },
    floatingBadge: {
        position: 'absolute',
        bottom: -14,
        right: 54,
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: RADIUS.full,
        paddingHorizontal: 12,
        paddingVertical: 7,
        alignItems: 'center',
        gap: 7,
        borderWidth: 1,
        borderColor: '#d1fae5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 3,
    },
    floatingDot: {
        width: 8,
        height: 8,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.success,
    },
    floatingText: {
        fontSize: FONTS.sizes.sm,
        fontWeight: FONTS.weights.semibold,
        fontFamily: 'Poppins_600SemiBold',
        color: '#172554',
    },
    headline: {
        fontSize: FONTS.sizes['3xl'],
        fontWeight: FONTS.weights.black,
        fontFamily: 'Poppins_900Black',
        color: '#172554',
        textAlign: 'center',
        letterSpacing: -1.2,
        lineHeight: 40,
        marginTop: SPACING.lg,
    },
    headlineAccent: { color: '#0F766E' },
    subtext: {
        fontSize: FONTS.sizes.base,
        fontFamily: 'Poppins_400Regular',
        color: '#475569',
        textAlign: 'center',
        lineHeight: 23,
        marginTop: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    featuresSection: { gap: 10, marginBottom: 28 },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e5e5ea',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f2f2f7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: { flex: 1 },
    featureTitle: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.semibold,
        fontFamily: 'Poppins_600SemiBold',
        color: '#172554',
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: FONTS.sizes.sm,
        fontFamily: 'Poppins_400Regular',
        color: '#64748b',
        lineHeight: 18,
    },
    ctas: { gap: SPACING.sm },
    primaryBtn: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#0F766E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 12,
        elevation: 5,
    },
    primaryBtnText: {
        fontSize: FONTS.sizes.md,
        fontWeight: FONTS.weights.bold,
        fontFamily: 'Poppins_700Bold',
        color: '#fff',
        letterSpacing: 0.3,
    },
    secondaryBtn: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d2d2d7',
    },
    secondaryBtnText: {
        fontSize: FONTS.sizes.base,
        fontWeight: FONTS.weights.medium,
        fontFamily: 'Poppins_500Medium',
        color: '#0F766E',
    },
    footer: {
        textAlign: 'center',
        fontSize: FONTS.sizes.xs,
        fontFamily: 'Poppins_400Regular',
        color: '#64748b',
        marginTop: SPACING.xl,
    },
});
