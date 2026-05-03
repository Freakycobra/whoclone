import { useEffect, useState, useCallback } from 'react';
import {
  initConnection,
  endConnection,
  getProducts,
  getSubscriptions,
  requestPurchase,
  requestSubscription,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  clearTransactionIOS,
} from 'expo-iap';
import { Platform, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../constants';

// All product IDs must match exactly what's registered in Google Play Console
export const COIN_PRODUCT_IDS = [
  'coins_100',
  'coins_500',
  'coins_1200',
  'coins_3000',
  'coins_6000',
];

export const SUB_PRODUCT_IDS = [
  'vip_w',
  'vip_m',
  'vip_y',
];

// Coins map: productId -> coin amount
const COINS_MAP = {
  coins_100:  100,
  coins_500:  500,
  coins_1200: 1200,
  coins_3000: 3000,
  coins_6000: 6000,
};

// Sub duration map: productId -> days
const SUB_DAYS_MAP = {
  vip_w: 7,
  vip_m: 30,
  vip_y: 365,
};

export function useIAP() {
  const { user, addCoins, updateUser } = useAuthStore();
  const [connected, setConnected] = useState(false);
  const [products, setProducts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    let purchaseUpdateSub;
    let purchaseErrorSub;

    async function setup() {
      try {
        await initConnection();
        setConnected(true);

        // Load products
        const prods = await getProducts({ skus: COIN_PRODUCT_IDS }).catch(() => []);
        const subs  = await getSubscriptions({ skus: SUB_PRODUCT_IDS }).catch(() => []);
        setProducts(prods || []);
        setSubscriptions(subs || []);

        // Listen for successful purchases
        purchaseUpdateSub = purchaseUpdatedListener(async (purchase) => {
          const { productId, transactionReceipt } = purchase;
          if (!transactionReceipt) return;

          try {
            // Verify with backend (MVP: trust client, server logs for audit)
            await verifyPurchase(user?.uid, productId, transactionReceipt);

            if (COINS_MAP[productId]) {
              // Coin purchase
              await addCoins(COINS_MAP[productId], `iap_${productId}`);
              Alert.alert('✅ Purchase Successful!', `${COINS_MAP[productId]} coins added!`);
            } else if (SUB_DAYS_MAP[productId]) {
              // VIP subscription
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + SUB_DAYS_MAP[productId]);
              updateUser({ isVip: true, vipExpiry: expiryDate.toISOString(), vipProductId: productId });
              await persistVip(user?.uid, productId, expiryDate.toISOString());
              Alert.alert('👑 Welcome to VIP!', 'All premium features are now unlocked.');
            }

            // Finish transaction (required on both platforms)
            await finishTransaction({ purchase, isConsumable: !!COINS_MAP[productId] });
          } catch (err) {
            console.warn('[IAP] purchase processing error:', err);
          }
          setPurchasing(false);
        });

        // Listen for errors
        purchaseErrorSub = purchaseErrorListener((error) => {
          console.warn('[IAP] purchase error:', error);
          if (error?.code !== 'E_USER_CANCELLED') {
            Alert.alert('Purchase Failed', error?.message || 'Something went wrong. Please try again.');
          }
          setPurchasing(false);
        });
      } catch (err) {
        console.warn('[IAP] init failed:', err);
        setConnected(false);
      }
    }

    setup();

    return () => {
      purchaseUpdateSub?.remove();
      purchaseErrorSub?.remove();
      endConnection().catch(() => {});
    };
  }, []);

  const buyCoins = useCallback(async (productId) => {
    if (!connected) {
      Alert.alert('Store Unavailable', 'Google Play is not available right now.');
      return;
    }
    try {
      setPurchasing(true);
      await requestPurchase({ sku: productId });
    } catch (err) {
      if (err?.code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase Failed', err?.message || 'Could not start purchase.');
      }
      setPurchasing(false);
    }
  }, [connected]);

  const buyVIP = useCallback(async (productId) => {
    if (!connected) {
      Alert.alert('Store Unavailable', 'Google Play is not available right now.');
      return;
    }
    try {
      setPurchasing(true);
      await requestSubscription({ sku: productId });
    } catch (err) {
      if (err?.code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase Failed', err?.message || 'Could not start subscription.');
      }
      setPurchasing(false);
    }
  }, [connected]);

  return { connected, products, subscriptions, purchasing, buyCoins, buyVIP };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function verifyPurchase(userId, productId, receipt) {
  try {
    await fetch(`${API_BASE_URL}/purchases/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId, receipt }),
    });
  } catch (_) {}
}

async function persistVip(userId, productId, expiry) {
  try {
    await fetch(`${API_BASE_URL}/subscriptions/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId, expiry }),
    });
  } catch (_) {}
}
