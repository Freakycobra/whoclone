import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { registerPushToken } from '../api/notifications';
import { useAuthStore } from '../store/authStore';

/**
 * usePushNotifications
 * - Requests permission & registers token on mount
 * - Handles foreground messages → returns `notification` state for in-app banner
 * - Background/quit messages handled by FCM natively (system tray)
 */
export function usePushNotifications() {
  const { user } = useAuthStore();
  const [notification, setNotification] = useState(null); // { title, body }
  const bannerTimer = useRef(null);

  useEffect(() => {
    if (!user?.uid) return;

    // Register token
    registerPushToken(user.uid);

    // Handle token refresh
    const unsubRefresh = messaging().onTokenRefresh((token) => {
      fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://backend-production-61e9.up.railway.app'}/notifications/register-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, fcmToken: token }),
      }).catch(() => {});
    });

    // Foreground messages → show in-app banner
    const unsubForeground = messaging().onMessage(async (remoteMessage) => {
      const title = remoteMessage.notification?.title || remoteMessage.data?.title;
      const body  = remoteMessage.notification?.body  || remoteMessage.data?.body;
      if (!title) return;

      setNotification({ title, body });

      // Auto-dismiss after 4s
      clearTimeout(bannerTimer.current);
      bannerTimer.current = setTimeout(() => setNotification(null), 4000);
    });

    // App opened from background via notification tap
    const unsubOpenedApp = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[FCM] notification opened app:', remoteMessage.notification);
    });

    // App opened from quit state via notification tap
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('[FCM] app opened from quit via notification:', remoteMessage.notification);
        }
      });

    return () => {
      unsubRefresh();
      unsubForeground();
      unsubOpenedApp();
      clearTimeout(bannerTimer.current);
    };
  }, [user?.uid]);

  const dismissNotification = () => {
    clearTimeout(bannerTimer.current);
    setNotification(null);
  };

  return { notification, dismissNotification };
}
