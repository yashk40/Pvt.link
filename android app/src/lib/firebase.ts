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

const firebaseConfig = {
    apiKey: 'AIzaSyCxORB1JVlFgqZlDn23oi6ROXeBfm9pIlQ',
    authDomain: 'chat-da8e2.firebaseapp.com',
    projectId: 'chat-da8e2',
    storageBucket: 'chat-da8e2.firebasestorage.app',
    messagingSenderId: '823514013067',
    appId: '1:823514013067:web:1f2ba8698c643b6b63a38e',
    measurementId: 'G-J7DY9XJ5L6',
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
