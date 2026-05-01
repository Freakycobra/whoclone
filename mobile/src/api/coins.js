import client from './client';

export const coinsAPI = {
  // Get coin balance
  getBalance: () => client.get('/coins/balance'),

  // Initiate coin purchase (Stripe)
  initiatePurchase: (packId, country) =>
    client.post('/coins/purchase', { packId, country }),

  // Verify IAP receipt (Google Play)
  verifyIAP: (receipt, packId) =>
    client.post('/coins/iap/verify', { receipt, packId }),

  // Get transaction history
  getHistory: () => client.get('/coins/history'),

  // Get daily bonus (if available)
  claimDailyBonus: () => client.post('/coins/daily-bonus'),

  // Get loyalty progress
  getLoyalty: () => client.get('/coins/loyalty'),
};
