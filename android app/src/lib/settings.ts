// Local persistence for user-facing app preferences (Settings screen).
// These are device-local prefs stored via AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@pvtlink/settings';

export type AccentColor = 'teal' | 'blue' | 'purple' | 'rose' | 'amber';

export interface AppSettings {
    accentColor: AccentColor;
}

export const ACCENT_LABELS: Record<AccentColor, string> = {
    teal: 'Teal',
    blue: 'Blue',
    purple: 'Purple',
    rose: 'Rose',
    amber: 'Amber',
};

export const DEFAULT_SETTINGS: AppSettings = {
    accentColor: 'teal',
};

export async function loadSettings(): Promise<AppSettings> {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!raw) return DEFAULT_SETTINGS;
        const parsed = JSON.parse(raw);
        // Merge so newly-added keys fall back to defaults.
        return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    const current = await loadSettings();
    const next = { ...current, ...patch };
    try {
        await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {
        // ignore write failures — in-memory state still reflects the change
    }
    return next;
}
