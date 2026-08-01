import type { AccentColor } from '../lib/settings';

const STATUS = {
    online: '#059669',
    offline: '#dc2626',
    warning: '#d97706',
    info: '#0284c7',
} as const;

const OS = {
    android: '#059669',
    ios: '#64748b',
    windows: '#0284c7',
    macos: '#64748b',
    linux: '#d97706',
} as const;

const SEMANTIC = {
    danger: '#dc2626',
    success: '#059669',
    warning: '#d97706',
    info: '#0284c7',
} as const;

export const ACCENT_PALETTES: Record<AccentColor, {
    primary: string;
    secondary: string;
    glow: string;
    glass: string;
    tint: string;
    tintBorder: string;
    softBg: string;
    softBorder: string;
}> = {
    teal: {
        primary: '#0F766E',
        secondary: '#14B8A6',
        glow: 'rgba(15,118,110,0.25)',
        glass: 'rgba(15,118,110,0.04)',
        tint: 'rgba(15,118,110,0.12)',
        tintBorder: 'rgba(15,118,110,0.4)',
        softBg: '#ecfdf5',
        softBorder: '#d1fae5',
    },
    blue: {
        primary: '#1D4ED8',
        secondary: '#3B82F6',
        glow: 'rgba(29,78,216,0.25)',
        glass: 'rgba(29,78,216,0.04)',
        tint: 'rgba(29,78,216,0.12)',
        tintBorder: 'rgba(29,78,216,0.4)',
        softBg: '#eff6ff',
        softBorder: '#dbeafe',
    },
    purple: {
        primary: '#7C3AED',
        secondary: '#A78BFA',
        glow: 'rgba(124,58,237,0.25)',
        glass: 'rgba(124,58,237,0.04)',
        tint: 'rgba(124,58,237,0.12)',
        tintBorder: 'rgba(124,58,237,0.4)',
        softBg: '#f5f3ff',
        softBorder: '#ede9fe',
    },
    rose: {
        primary: '#E11D48',
        secondary: '#FB7185',
        glow: 'rgba(225,29,72,0.25)',
        glass: 'rgba(225,29,72,0.04)',
        tint: 'rgba(225,29,72,0.12)',
        tintBorder: 'rgba(225,29,72,0.4)',
        softBg: '#fff1f2',
        softBorder: '#ffe4e6',
    },
    amber: {
        primary: '#D97706',
        secondary: '#FBBF24',
        glow: 'rgba(217,119,6,0.25)',
        glass: 'rgba(217,119,6,0.04)',
        tint: 'rgba(217,119,6,0.12)',
        tintBorder: 'rgba(217,119,6,0.4)',
        softBg: '#fffbeb',
        softBorder: '#fef3c7',
    },
};

export function buildLightColors(accent: AccentColor = 'teal') {
    const palette = ACCENT_PALETTES[accent];
    return {
        bg: {
            primary: '#f5f5f7',
            secondary: '#ffffff',
            tertiary: '#f2f2f7',
            card: '#ffffff',
            cardRaised: '#ffffff',
            overlay: '#f2f2f7',
            glass: palette.glass,
            glassBorder: '#e5e5ea',
            gradient: ['#f5f5f7', '#ffffff'] as [string, string],
        },
        brand: {
            primary: palette.primary,
            secondary: palette.secondary,
            gradient: [palette.primary, palette.secondary] as [string, string],
            glow: palette.glow,
            tint: palette.tint,
            tintBorder: palette.tintBorder,
            softBg: palette.softBg,
            softBorder: palette.softBorder,
        },
        status: STATUS,
        text: {
            primary: '#172554',
            secondary: '#475569',
            muted: '#64748b',
            inverse: '#ffffff',
        },
        ...SEMANTIC,
        os: OS,
        isDark: false as const,
        accent,
    };
}

// Light theme default
export const lightColors = buildLightColors('teal');

export function buildDarkColors(accent: AccentColor = 'teal') {
    const palette = ACCENT_PALETTES[accent];
    return {
        bg: {
            primary: '#0b0f14',
            secondary: '#111820',
            tertiary: '#1a222c',
            card: '#131a22',
            cardRaised: '#1a222c',
            overlay: '#1e2732',
            glass: palette.glass,
            glassBorder: '#26303c',
            gradient: ['#0b0f14', '#111820'] as [string, string],
        },
        brand: {
            primary: palette.primary,
            secondary: palette.secondary,
            gradient: [palette.primary, palette.secondary] as [string, string],
            glow: palette.glow,
            tint: palette.tint,
            tintBorder: palette.tintBorder,
            softBg: palette.softBg,
            softBorder: palette.softBorder,
        },
        status: STATUS,
        text: {
            primary: '#f1f5f9',
            secondary: '#cbd5e1',
            muted: '#94a3b8',
            inverse: '#ffffff',
        },
        ...SEMANTIC,
        os: OS,
        isDark: true as const,
        accent,
    };
}

export const darkColors = buildDarkColors('teal');

export type ThemeColors = ReturnType<typeof buildLightColors>;

// Backward-compatible static export — used by screens that reference COLORS directly.
// ThemeProvider calls setActiveTheme() to keep it in sync with the active accent.
export let COLORS: ThemeColors = lightColors;

export function setActiveTheme(colors: ThemeColors) {
    COLORS = colors;
}

export const FONTS = {
    sizes: {
        xs: 11,
        sm: 13,
        base: 15,
        md: 17,
        lg: 20,
        xl: 24,
        '2xl': 28,
        '3xl': 34,
        '4xl': 40,
    },
    weights: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
        black: '900' as const,
    },
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    tabBar: 110,
};

export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
};

export const SHADOWS = {
    sm: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    md: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    lg: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
    },
};
