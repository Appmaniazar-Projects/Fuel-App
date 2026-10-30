import { Alert, Platform } from 'react-native';

/**
 * Ask the user to confirm a destructive action. Alert.alert's buttons don't
 * work on web, so web uses the browser's confirm dialog instead.
 */
export function confirmAction(title: string, message: string, confirmLabel = 'Delete'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

/** Show a simple error message on any platform. */
export function showError(message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message);
    return;
  }
  Alert.alert('Something went wrong', message);
}
