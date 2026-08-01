import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield } from 'lucide-react-native';
import { FONTS, RADIUS } from '../theme';
import { useTheme } from '../theme/ThemeContext';

interface BrandLogoProps {
    /** Icon + wordmark height scale */
    size?: 'sm' | 'md' | 'lg';
    /** Hide the "pvt.link" text and show icon only */
    iconOnly?: boolean;
}

const DIMENSIONS = {
    sm: { box: 30, icon: 15, font: FONTS.sizes.md, radius: RADIUS.sm },
    md: { box: 36, icon: 18, font: FONTS.sizes.lg, radius: RADIUS.md },
    lg: { box: 44, icon: 22, font: FONTS.sizes.xl, radius: RADIUS.md },
} as const;

export default function BrandLogo({ size = 'md', iconOnly = false }: BrandLogoProps) {
    const { colors: COLORS } = useTheme();
    const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
    const d = DIMENSIONS[size];

    return (
        <View style={styles.row}>
            <LinearGradient
                colors={COLORS.brand.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.icon, { width: d.box, height: d.box, borderRadius: d.radius }]}
            >
                <Shield size={d.icon} color={COLORS.text.inverse} />
            </LinearGradient>
            {!iconOnly && (
                <Text style={[styles.wordmark, { fontSize: d.font }]}>
                    <Text style={styles.pvt}>pvt</Text>
                    <Text style={styles.link}>.link</Text>
                </Text>
            )}
        </View>
    );
}

const makeStyles = (COLORS: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    icon: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    wordmark: {
        letterSpacing: -0.5,
        fontFamily: 'Poppins_700Bold',
    },
    pvt: {
        color: COLORS.text.primary,
        fontWeight: FONTS.weights.bold,
    },
    link: {
        color: COLORS.brand.primary,
        fontWeight: FONTS.weights.bold,
    },
});
