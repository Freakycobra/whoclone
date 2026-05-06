/**
 * useIAP — stub implementation for local dev builds.
 * Real Google Play IAP requires products registered in Play Console
 * and a signed release build — not available in local debug builds.
 * 
 * TODO: Replace with react-native-iap when submitting to Play Store.
 */
import { Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../constants';

export const COIN_PRODUCT_IDS = ['coins_100','coins_500','coins_1200','coins_3000','coins_6000'];
export const SUB_PRODUCT_IDS  = ['vip_w','vip_m','vip_y'];

const COINS_MAP = {
  coins_100: 100, coins_500: 500, coins_1200: 1200, coins_3000: 3000, coins_6000: 6000,
};
const SUB_DAYS_MAP = { vip_w: 7, vip_m: 30, vip_y: 365 };

export function useIAP() {
  const { user, addCoins, updateUser } = useAuthStore();

  // DEV: simulate coin purchase instantly
  const buyCoins = async (productId) => {
    const amount = COINS_MAP[productId];
    if (!amount) return;
    Alert.alert(
      '🪙 Dev Mode Purchase',
      `Adding ${amount} coins (Play Store billing not available in debug builds)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Coins',
          onPress: async () => {
            await addCoins(amount, `dev_${productId}`);
            Alert.alert('✅ Done', `${amount} coins added!`);
          },
        },
      ]
    );
  };

  // DEV: simulate VIP activation instantly
  const buyVIP = async (productId) => {
    const days = SUB_DAYS_MAP[productId] || 30;
    Alert.alert(
      '👑 Dev Mode VIP',
      `Activating VIP for ${days} days (Play Store billing not available in debug builds)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate VIP',
          onPress: async () => {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + days);
            updateUser({ isVip: true, vipExpiry: expiry.toISOString(), vipProductId: productId });
            try {
              await fetch(`${API_BASE_URL}/subscriptions/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.uid, productId, expiry: expiry.toISOString() }),
              });
            } catch (_) {}
            Alert.alert('👑 VIP Active!', `Your VIP is active for ${days} days.`);
          },
        },
      ]
    );
  };

  return {
    connected: true,
    products: [],
    subscriptions: [],
    purchasing: false,
    buyCoins,
    buyVIP,
  };
}
