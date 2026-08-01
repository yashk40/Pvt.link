import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// getReactNativePersistence is only exported from @firebase/auth's React Native
// build. Metro selects that build via the "react-native" export condition, but
// tsc resolves the `firebase/auth` top-level export to the default build, which
// omits it — so the symbol exists at runtime even though tsc can't see it here.
// The @ts-expect-error below suppresses that false positive only.
// @ts-expect-error - not in `firebase/auth` types for tsc; resolves under Metro.
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase client config is read from EXPO_PUBLIC_* env vars (see `.env` /
// `.env.example`), so project identifiers stay out of the repo. Expo inlines
// these at bundle time; they are not secrets, but they are machine-specific.
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = (() => {
    try {
        return initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
        });
    } catch {
        return getAuth(app);
    }
})();
export const db = getFirestore(app);
export default app;
