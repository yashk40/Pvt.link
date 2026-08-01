import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../theme';
import { useTheme } from '../theme/ThemeContext';

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
    variant?: 'default' | 'danger' | 'success' | 'warning';
    disabled?: boolean;
    style?: ViewStyle;
}

const getVariantMap = (colors: ReturnType<typeof useTheme>['colors']) => ({
    default: { bg: colors.brand.tint, border: colors.brand.tintBorder, text: colors.brand.primary },
    danger: { bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.25)', text: COLORS.danger },
    success: { bg: 'rgba(5,150,105,0.10)', border: 'rgba(5,150,105,0.25)', text: COLORS.success },
    warning: { bg: 'rgba(217,119,6,0.10)', border: 'rgba(217,119,6,0.25)', text: COLORS.warning },
});

export default function ActionButton({
    icon,
    label,
    onPress,
    variant = 'default',
    disabled = false,
    style,
}: ActionButtonProps) {
    const { colors } = useTheme();
    const v = getVariantMap(colors)[variant];
    return (
        <TouchableOpacity
            style={[styles.btn, { backgroundColor: v.bg, borderColor: v.border }, disabled && styles.disabled, style]}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled}
        >
            {icon}
            <Text style={[styles.label, { color: v.text }]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    btn: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        minWidth: 68,
    },
    label: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.medium,
        textAlign: 'center',
    },
    disabled: { opacity: 0.4 },
});
