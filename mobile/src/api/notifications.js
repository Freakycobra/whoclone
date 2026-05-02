import messaging from '@react-native-firebase/messaging';
import { API_BASE_URL } from '../constants';

/**
 * Request notification permission and register FCM token with backend.
 * @param {string} userId - authenticated user's UID
 * @returns {Promise<string|null>} - FCM token or null if denied
 */
export async function registerPushToken(userId) {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('[FCM] permission denied');
      return null;
    }

    const token = await messaging().getToken();
    if (!token) return null;

    await fetch(`${API_BASE_URL}/notifications/register-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, fcmToken: token }),
    });

    console.log('[FCM] token registered:', token.slice(0, 20) + '...');
    return token;
  } catch (err) {
    console.warn('[FCM] registerPushToken error:', err);
    return null;
  }
}

/**
 * Unregister FCM token on logout.
 */
export async function unregisterPushToken(userId) {
  try {
    await fetch(`${API_BASE_URL}/notifications/unregister-token`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    await messaging().deleteToken();
  } catch (_) {}
}
