import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, Smartphone, Activity, Settings } from 'lucide-react-native';
import Animated, {
    useAnimatedStyle,
    withTiming,
    interpolate,
    useDerivedValue,
} from 'react-native-reanimated';
import { RADIUS, SHADOWS } from '../theme';
import { useTheme } from '../theme/ThemeContext';

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
    Dashboard: LayoutDashboard,
    Devices: Smartphone,
    Activity: Activity,
    Settings: Settings,
};

function TabItem({
    focused,
    routeName,
    onPress,
    onLongPress,
}: {
    focused: boolean;
    routeName: string;
    onPress: () => void;
    onLongPress: () => void;
}) {
    const { colors } = useTheme();
    const Icon = ICONS[routeName] ?? Activity;

    const progress = useDerivedValue(() => withTiming(focused ? 1 : 0, { duration: 220 }));

    const pillStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ scale: interpolate(progress.value, [0, 1], [0.8, 1]) }],
    }));

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.1]) }],
    }));

    const color = focused ? colors.brand.primary : colors.text.muted;

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
            android_ripple={{ color: colors.brand.glow, borderless: true, radius: 40 }}
            hitSlop={8}
        >
            <View style={styles.pillWrap}>
                <Animated.View style={[styles.pill, { backgroundColor: colors.brand.glow }, pillStyle]} />
                <Animated.View style={iconStyle}>
                    <Icon size={24} color={color} />
                </Animated.View>
            </View>
        </Pressable>
    );
}

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
            <View style={[styles.bar, { backgroundColor: colors.bg.card, borderColor: colors.bg.glassBorder }]}>
                {state.routes.map((route, index) => {
                    const focused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!focused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({ type: 'tabLongPress', target: route.key });
                    };

                    return (
                        <TabItem
                            key={route.key}
                            focused={focused}
                            routeName={route.name}
                            onPress={onPress}
                            onLongPress={onLongPress}
                        />
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: RADIUS.full,
        borderWidth: 1,
        borderColor: '#e5e5ea',
        paddingVertical: 8,
        paddingHorizontal: 8,
        ...SHADOWS.lg,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pillWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: RADIUS.full,
        overflow: 'hidden',
    },
    pill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15,118,110,0.25)',
        borderRadius: RADIUS.full,
    },
});
