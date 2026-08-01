// Cross-platform dialogs.
//
// react-native-web ships `Alert.alert` as a no-op (it literally does nothing),
// so any confirm/notify built on Alert silently fails on web. These helpers use
// the browser's window.confirm/alert on web and fall back to Alert on native.
import { Alert, Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

/**
 * Ask the user to confirm a destructive/irreversible action.
 * Calls onConfirm when the user accepts.
 */
export function confirm(
    title: string,
    message: string,
    onConfirm: () => void,
    opts: { confirmText?: string; cancelText?: string; destructive?: boolean } = {}
) {
    const { confirmText = 'OK', cancelText = 'Cancel', destructive = false } = opts;

    if (isWeb) {
        const ok = typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`);
        if (ok) onConfirm();
        return;
    }

    Alert.alert(title, message, [
        { text: cancelText, style: 'cancel' },
        { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
    ]);
}

/** Simple informational dialog. */
export function notify(title: string, message?: string) {
    if (isWeb) {
        if (typeof window !== 'undefined') window.alert(message ? `${title}\n\n${message}` : title);
        return;
    }
    Alert.alert(title, message);
}
