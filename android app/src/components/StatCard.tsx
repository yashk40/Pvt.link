import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../theme';

interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    gradientColors?: [string, string];
    style?: ViewStyle;
}

export default function StatCard({
    label,
    value,
    icon,
    trend,
    trendUp,
    gradientColors = [COLORS.brand.tint, COLORS.bg.glass],
    style,
}: StatCardProps) {
    return (
        <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, style]}
        >
            <View style={styles.header}>
                <View style={styles.iconWrap}>{icon}</View>
                {trend ? (
                    <View style={[styles.trend, { backgroundColor: trendUp ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)' }]}>
                        <Text style={[styles.trendText, { color: trendUp ? COLORS.success : COLORS.danger }]}>
                            {trend}
                        </Text>
                    </View>
                ) : null}
            </View>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        borderRadius: RADIUS.xl,
        padding: SPACING.base,
        borderWidth: 1,
        borderColor: COLORS.bg.glassBorder,
        ...SHADOWS.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    iconWrap: {
        width: 38,
        height: 38,
        borderRadius: RADIUS.md,
        backgroundColor: 'rgba(15,118,110,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trend: {
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: RADIUS.full,
    },
    trendText: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.semibold,
    },
    value: {
        fontSize: FONTS.sizes['2xl'],
        fontWeight: FONTS.weights.bold,
        color: COLORS.text.primary,
        marginBottom: 2,
    },
    label: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.text.secondary,
        fontWeight: FONTS.weights.medium,
    },
});
