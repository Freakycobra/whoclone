// API
export const API_BASE_URL = 'https://api.connectnow.app'; // replace with your deployed backend
export const AGORA_APP_ID = 'YOUR_AGORA_APP_ID'; // get from agora.io

// Coin packages with PPP pricing by country
export const COIN_PACKS = {
  default: [
    { id: 'coins_100', coins: 100, price: 0.99, label: 'Starter', badge: null },
    { id: 'coins_500', coins: 500, price: 3.99, label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200', coins: 1200, price: 7.99, label: 'Plus', badge: null },
    { id: 'coins_3000', coins: 3000, price: 17.99, label: 'Pro', badge: '🎉 +500 FREE' },
    { id: 'coins_6000', coins: 6000, price: 29.99, label: 'Elite', badge: '🔥 +1000 FREE' },
    { id: 'coins_12000', coins: 12000, price: 49.99, label: 'King', badge: '👑 +3000 FREE' },
  ],
  IN: [
    { id: 'coins_100_in', coins: 100, price: 49, currency: '₹', label: 'Starter', badge: null },
    { id: 'coins_500_in', coins: 500, price: 199, currency: '₹', label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200_in', coins: 1200, price: 399, currency: '₹', label: 'Plus', badge: null },
    { id: 'coins_3000_in', coins: 3000, price: 899, currency: '₹', label: 'Pro', badge: '🎉 +500 FREE' },
    { id: 'coins_6000_in', coins: 6000, price: 1499, currency: '₹', label: 'Elite', badge: '🔥 +1000 FREE' },
    { id: 'coins_12000_in', coins: 12000, price: 2499, currency: '₹', label: 'King', badge: '👑 +3000 FREE' },
  ],
  BD: [
    { id: 'coins_100_bd', coins: 100, price: 110, currency: '৳', label: 'Starter', badge: null },
    { id: 'coins_500_bd', coins: 500, price: 499, currency: '৳', label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200_bd', coins: 1200, price: 999, currency: '৳', label: 'Plus', badge: null },
    { id: 'coins_3000_bd', coins: 3000, price: 2199, currency: '৳', label: 'Pro', badge: '🎉 +500 FREE' },
    { id: 'coins_6000_bd', coins: 6000, price: 3699, currency: '৳', label: 'Elite', badge: '🔥 +1000 FREE' },
    { id: 'coins_12000_bd', coins: 12000, price: 5999, currency: '৳', label: 'King', badge: '👑 +3000 FREE' },
  ],
  ID: [
    { id: 'coins_100_id', coins: 100, price: 15000, currency: 'Rp', label: 'Starter', badge: null },
    { id: 'coins_500_id', coins: 500, price: 59000, currency: 'Rp', label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200_id', coins: 1200, price: 119000, currency: 'Rp', label: 'Plus', badge: null },
    { id: 'coins_3000_id', coins: 3000, price: 269000, currency: 'Rp', label: 'Pro', badge: '🎉 +500 FREE' },
    { id: 'coins_6000_id', coins: 6000, price: 449000, currency: 'Rp', label: 'Elite', badge: '🔥 +1000 FREE' },
    { id: 'coins_12000_id', coins: 12000, price: 749000, currency: 'Rp', label: 'King', badge: '👑 +3000 FREE' },
  ],
  PH: [
    { id: 'coins_100_ph', coins: 100, price: 59, currency: '₱', label: 'Starter', badge: null },
    { id: 'coins_500_ph', coins: 500, price: 249, currency: '₱', label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200_ph', coins: 1200, price: 499, currency: '₱', label: 'Plus', badge: null },
    { id: 'coins_3000_ph', coins: 3000, price: 1099, currency: '₱', label: 'Pro', badge: '🎉 +500 FREE' },
    { id: 'coins_6000_ph', coins: 6000, price: 1849, currency: '₱', label: 'Elite', badge: '🔥 +1000 FREE' },
    { id: 'coins_12000_ph', coins: 12000, price: 2999, currency: '₱', label: 'King', badge: '👑 +3000 FREE' },
  ],
};

// Gifts catalog
export const GIFTS = [
  { id: 'heart', name: 'Heart', emoji: '❤️', cost: 10, diamonds: 5 },
  { id: 'rose', name: 'Rose', emoji: '🌹', cost: 29, diamonds: 14 },
  { id: 'kiss', name: 'Kiss', emoji: '💋', cost: 49, diamonds: 24 },
  { id: 'crown', name: 'Crown', emoji: '👑', cost: 99, diamonds: 49 },
  { id: 'fire', name: 'Fire', emoji: '🔥', cost: 149, diamonds: 74 },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', cost: 199, diamonds: 99 },
  { id: 'diamond', name: 'Diamond', emoji: '💎', cost: 499, diamonds: 249 },
  { id: 'car', name: 'Sports Car', emoji: '🏎️', cost: 999, diamonds: 499 },
  { id: 'jet', name: 'Private Jet', emoji: '✈️', cost: 1999, diamonds: 999 },
  { id: 'castle', name: 'Castle', emoji: '🏰', cost: 4999, diamonds: 2499 },
];

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  default: {
    weekly: { id: 'vip_weekly', price: 3.99, label: 'Weekly VIP', period: 'week' },
    monthly: { id: 'vip_monthly', price: 9.99, label: 'Monthly VIP', period: 'month', badge: 'POPULAR' },
    annual: { id: 'vip_annual', price: 59.99, label: 'Annual VIP', period: 'year', badge: 'BEST DEAL' },
  },
  IN: {
    weekly: { id: 'vip_weekly_in', price: 39, currency: '₹', label: 'Weekly VIP', period: 'week' },
    monthly: { id: 'vip_monthly_in', price: 99, currency: '₹', label: 'Monthly VIP', period: 'month', badge: 'POPULAR' },
    annual: { id: 'vip_annual_in', price: 599, currency: '₹', label: 'Annual VIP', period: 'year', badge: 'BEST DEAL' },
  },
};

// VIP perks
export const VIP_PERKS = [
  { icon: '⚡', text: '3x faster matching' },
  { icon: '⚧', text: 'Gender filter — match only who you want' },
  { icon: '🌍', text: 'Country filter — choose your match region' },
  { icon: '🚫', text: 'Zero ads' },
  { icon: '👑', text: 'VIP badge on your profile' },
  { icon: '🚀', text: 'Profile boost — appear more in queue' },
  { icon: '🎁', text: 'Daily bonus coins' },
];

// Reactions
export const REACTIONS = ['❤️', '😂', '😮', '🔥', '👏', '😍', '💯', '🤣'];

// Match quality labels
export const MATCH_QUALITY = {
  1: { label: 'Poor', color: '#EF4444' },
  2: { label: 'Okay', color: '#F59E0B' },
  3: { label: 'Good', color: '#10B981' },
  4: { label: 'Great', color: '#3B82F6' },
  5: { label: 'Amazing', color: '#7C3AED' },
};
