import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    StatusBar,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '../theme';
import BrandLogo from './BrandLogo';

interface AppHeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightIcon?: React.ReactNode;
    onRightPress?: () => void;
    /** Show the pvt.link wordmark above the title (top-level tab screens) */
    showBrand?: boolean;
}

export default function AppHeader({
    title,
    subtitle,
    showBack = false,
    rightIcon,
    onRightPress,
    showBrand = false,
}: AppHeaderProps) {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            {showBrand && !showBack && (
                <View style={styles.brandRow}>
                    <BrandLogo size="sm" />
                </View>
            )}
            <View style={styles.bar}>
                <View style={styles.left}>
                    {showBack && (
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                            <ArrowLeft size={20} color={COLORS.text.primary} />
                        </TouchableOpacity>
                    )}
                    <View style={styles.titleWrap}>
                        <Text style={styles.title}>{title}</Text>
                        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                    </View>
                </View>
                <View style={styles.right}>
                    {rightIcon ? (
                        <TouchableOpacity style={styles.iconBtn} onPress={onRightPress} activeOpacity={0.7}>
                            {rightIcon}
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: SPACING.base,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 4 : 44,
        paddingBottom: SPACING.sm,
        backgroundColor: COLORS.bg.primary,
    },
    brandRow: {
        marginBottom: SPACING.sm,
    },
    bar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        flex: 1,
    },
    titleWrap: {
        flex: 1,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 38,
        backgroundColor: COLORS.bg.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: FONTS.sizes.xl,
        fontWeight: FONTS.weights.bold,
        fontFamily: 'Poppins_700Bold',
        color: COLORS.text.primary,
    },
    subtitle: {
        fontSize: FONTS.sizes.sm,
        fontFamily: 'Poppins_400Regular',
        color: COLORS.text.muted,
        marginTop: 1,
    },
    right: {},
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 40,
        backgroundColor: COLORS.bg.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
});
