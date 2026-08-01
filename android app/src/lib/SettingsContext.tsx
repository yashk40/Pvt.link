import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type AppSettings } from './settings';

interface SettingsContextValue {
    settings: AppSettings;
    patchSettings: (patch: Partial<AppSettings>) => Promise<void>;
    ready: boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        loadSettings().then((next) => {
            setSettings(next);
            setReady(true);
        });
    }, []);

    const patchSettings = useCallback(async (patch: Partial<AppSettings>) => {
        setSettings((prev) => ({ ...prev, ...patch }));
        const next = await saveSettings(patch);
        setSettings(next);
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, patchSettings, ready }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
    return ctx;
}
