import React, { createContext, useContext, useLayoutEffect, useMemo } from 'react';
import { useSettings } from '../lib/SettingsContext';
import { buildLightColors, setActiveTheme, ThemeColors } from './index';
import type { AccentColor } from '../lib/settings';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
    colors: ThemeColors;
    mode: ThemeMode;
    isDark: boolean;
    accentColor: AccentColor;
    toggleTheme: () => void;
    setMode: (mode: ThemeMode) => void;
    ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const noop = () => {};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { settings, ready } = useSettings();
    const colors = useMemo(() => buildLightColors(settings.accentColor), [settings.accentColor]);

    // Keep the legacy COLORS export in sync with the current theme.
    // useLayoutEffect runs synchronously after DOM mutations but before paint,
    // so screens that read COLORS will get the updated value before they render.
    useLayoutEffect(() => {
        setActiveTheme(colors);
    }, [colors]);

    return (
        <ThemeContext.Provider
            value={{
                colors,
                mode: 'light',
                isDark: false,
                accentColor: settings.accentColor,
                toggleTheme: noop,
                setMode: noop,
                ready,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return ctx;
}

