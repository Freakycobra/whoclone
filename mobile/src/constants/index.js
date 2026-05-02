// ─── API & SERVICES ───────────────────────────────────────────────────────────
export const API_BASE_URL = 'https://backend-production-61e9.up.railway.app';
export const AGORA_APP_ID = '69107017812e4c81bfa122c70d2b0750';

// ─── REGIONAL PRICING ─────────────────────────────────────────────────────────
// Coin packs priced per purchasing-power parity (PPP)
// GPS-detected country → correct tier. Users cannot self-select to get cheaper prices.
export const COIN_PACKS = {
  // High-income: US, UK, CA, AU, DE, FR, etc.
  default: [
    { id: 'coins_100',   coins: 100,   price: 0.99,  currency: '$', label: 'Starter', badge: null },
    { id: 'coins_500',   coins: 500,   price: 3.99,  currency: '$', label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200',  coins: 1200,  price: 7.99,  currency: '$', label: 'Plus',    badge: null },
    { id: 'coins_3000',  coins: 3000,  price: 14.99, currency: '$', label: 'Pro',     badge: '🎉 +500 FREE' },
    { id: 'coins_6000',  coins: 6000,  price: 24.99, currency: '$', label: 'Elite',   badge: '🔥 +1000 FREE' },
    { id: 'coins_12000', coins: 12000, price: 44.99, currency: '$', label: 'King',    badge: '👑 +3000 FREE' },
  ],
  // India
  IN: [
    { id: 'coins_100_in',   coins: 100,   price: 49,   currency: '₹', label: 'Starter', badge: null },
    { id: 'coins_500_in',   coins: 500,   price: 169,  currency: '₹', label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200_in',  coins: 1200,  price: 349,  currency: '₹', label: 'Plus',    badge: null },
    { id: 'coins_3000_in',  coins: 3000,  price: 799,  currency: '₹', label: 'Pro',     badge: '🎉 +500 FREE' },
    { id: 'coins_6000_in',  coins: 6000,  price: 1299, currency: '₹', label: 'Elite',   badge: '🔥 +1000 FREE' },
    { id: 'coins_12000_in', coins: 12000, price: 2099, currency: '₹', label: 'King',    badge: '👑 +3000 FREE' },
  ],
  // Bangladesh
  BD: [
    { id: 'coins_100_bd',   coins: 100,   price: 110,  currency: '৳', label: 'Starter', badge: null },
    { id: 'coins_500_bd',   coins: 500,   price: 449,  currency: '৳', label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200_bd',  coins: 1200,  price: 899,  currency: '৳', label: 'Plus',    badge: null },
    { id: 'coins_3000_bd',  coins: 3000,  price: 1999, currency: '৳', label: 'Pro',     badge: '🎉 +500 FREE' },
    { id: 'coins_6000_bd',  coins: 6000,  price: 3299, currency: '৳', label: 'Elite',   badge: '🔥 +1000 FREE' },
    { id: 'coins_12000_bd', coins: 12000, price: 5499, currency: '৳', label: 'King',    badge: '👑 +3000 FREE' },
  ],
  // Indonesia
  ID: [
    { id: 'coins_100_id',   coins: 100,   price: 15000,  currency: 'Rp', label: 'Starter', badge: null },
    { id: 'coins_500_id',   coins: 500,   price: 55000,  currency: 'Rp', label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200_id',  coins: 1200,  price: 109000, currency: 'Rp', label: 'Plus',    badge: null },
    { id: 'coins_3000_id',  coins: 3000,  price: 249000, currency: 'Rp', label: 'Pro',     badge: '🎉 +500 FREE' },
    { id: 'coins_6000_id',  coins: 6000,  price: 399000, currency: 'Rp', label: 'Elite',   badge: '🔥 +1000 FREE' },
    { id: 'coins_12000_id', coins: 12000, price: 649000, currency: 'Rp', label: 'King',    badge: '👑 +3000 FREE' },
  ],
  // Philippines
  PH: [
    { id: 'coins_100_ph',   coins: 100,   price: 59,   currency: '₱', label: 'Starter', badge: null },
    { id: 'coins_500_ph',   coins: 500,   price: 219,  currency: '₱', label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200_ph',  coins: 1200,  price: 429,  currency: '₱', label: 'Plus',    badge: null },
    { id: 'coins_3000_ph',  coins: 3000,  price: 979,  currency: '₱', label: 'Pro',     badge: '🎉 +500 FREE' },
    { id: 'coins_6000_ph',  coins: 6000,  price: 1649, currency: '₱', label: 'Elite',   badge: '🔥 +1000 FREE' },
    { id: 'coins_12000_ph', coins: 12000, price: 2699, currency: '₱', label: 'King',    badge: '👑 +3000 FREE' },
  ],
  // Brazil
  BR: [
    { id: 'coins_100_br',   coins: 100,   price: 4.90,  currency: 'R$', label: 'Starter', badge: null },
    { id: 'coins_500_br',   coins: 500,   price: 19.90, currency: 'R$', label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200_br',  coins: 1200,  price: 39.90, currency: 'R$', label: 'Plus',    badge: null },
    { id: 'coins_3000_br',  coins: 3000,  price: 89.90, currency: 'R$', label: 'Pro',     badge: '🎉 +500 FREE' },
    { id: 'coins_6000_br',  coins: 6000,  price: 149.9, currency: 'R$', label: 'Elite',   badge: '🔥 +1000 FREE' },
    { id: 'coins_12000_br', coins: 12000, price: 249.9, currency: 'R$', label: 'King',    badge: '👑 +3000 FREE' },
  ],
  // Mexico
  MX: [
    { id: 'coins_100_mx',   coins: 100,   price: 19,  currency: 'MX$', label: 'Starter', badge: null },
    { id: 'coins_500_mx',   coins: 500,   price: 69,  currency: 'MX$', label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200_mx',  coins: 1200,  price: 139, currency: 'MX$', label: 'Plus',    badge: null },
    { id: 'coins_3000_mx',  coins: 3000,  price: 319, currency: 'MX$', label: 'Pro',     badge: '🎉 +500 FREE' },
    { id: 'coins_6000_mx',  coins: 6000,  price: 529, currency: 'MX$', label: 'Elite',   badge: '🔥 +1000 FREE' },
    { id: 'coins_12000_mx', coins: 12000, price: 879, currency: 'MX$', label: 'King',    badge: '👑 +3000 FREE' },
  ],
  // Turkey
  TR: [
    { id: 'coins_100_tr',   coins: 100,   price: 29,  currency: '₺', label: 'Starter', badge: null },
    { id: 'coins_500_tr',   coins: 500,   price: 99,  currency: '₺', label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200_tr',  coins: 1200,  price: 199, currency: '₺', label: 'Plus',    badge: null },
    { id: 'coins_3000_tr',  coins: 3000,  price: 449, currency: '₺', label: 'Pro',     badge: '🎉 +500 FREE' },
    { id: 'coins_6000_tr',  coins: 6000,  price: 749, currency: '₺', label: 'Elite',   badge: '🔥 +1000 FREE' },
    { id: 'coins_12000_tr', coins: 12000, price: 1249,currency: '₺', label: 'King',    badge: '👑 +3000 FREE' },
  ],
  // Pakistan
  PK: [
    { id: 'coins_100_pk',   coins: 100,   price: 280,  currency: 'Rs', label: 'Starter', badge: null },
    { id: 'coins_500_pk',   coins: 500,   price: 999,  currency: 'Rs', label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200_pk',  coins: 1200,  price: 1999, currency: 'Rs', label: 'Plus',    badge: null },
    { id: 'coins_3000_pk',  coins: 3000,  price: 4499, currency: 'Rs', label: 'Pro',     badge: '🎉 +500 FREE' },
    { id: 'coins_6000_pk',  coins: 6000,  price: 7499, currency: 'Rs', label: 'Elite',   badge: '🔥 +1000 FREE' },
    { id: 'coins_12000_pk', coins: 12000, price: 12499,currency: 'Rs', label: 'King',    badge: '👑 +3000 FREE' },
  ],
  // Nigeria
  NG: [
    { id: 'coins_100_ng',   coins: 100,   price: 1500, currency: '₦', label: 'Starter', badge: null },
    { id: 'coins_500_ng',   coins: 500,   price: 5500, currency: '₦', label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200_ng',  coins: 1200,  price: 10999,currency: '₦', label: 'Plus',    badge: null },
    { id: 'coins_3000_ng',  coins: 3000,  price: 24999,currency: '₦', label: 'Pro',     badge: '🎉 +500 FREE' },
    { id: 'coins_6000_ng',  coins: 6000,  price: 41999,currency: '₦', label: 'Elite',   badge: '🔥 +1000 FREE' },
    { id: 'coins_12000_ng', coins: 12000, price: 68999,currency: '₦', label: 'King',    badge: '👑 +3000 FREE' },
  ],
  // Egypt
  EG: [
    { id: 'coins_100_eg',   coins: 100,   price: 49,  currency: 'E£', label: 'Starter', badge: null },
    { id: 'coins_500_eg',   coins: 500,   price: 179, currency: 'E£', label: 'Popular', badge: 'BEST VALUE' },
    { id: 'coins_1200_eg',  coins: 1200,  price: 349, currency: 'E£', label: 'Plus',    badge: null },
    { id: 'coins_3000_eg',  coins: 3000,  price: 799, currency: 'E£', label: 'Pro',     badge: '🎉 +500 FREE' },
    { id: 'coins_6000_eg',  coins: 6000,  price: 1299,currency: 'E£', label: 'Elite',   badge: '🔥 +1000 FREE' },
    { id: 'coins_12000_eg', coins: 12000, price: 2149,currency: 'E£', label: 'King',    badge: '👑 +3000 FREE' },
  ],
};

// ─── VIP SUBSCRIPTION PLANS ───────────────────────────────────────────────────
export const SUBSCRIPTION_PLANS = {
  default: {
    weekly:  { id: 'vip_w',  price: 2.99,  currency: '$',  label: 'Weekly',  period: 'week',  perWeek: '2.99' },
    monthly: { id: 'vip_m',  price: 7.99,  currency: '$',  label: 'Monthly', period: 'month', badge: 'POPULAR', perWeek: '2.00' },
    annual:  { id: 'vip_y',  price: 49.99, currency: '$',  label: 'Annual',  period: 'year',  badge: 'BEST DEAL', perWeek: '0.96', saving: '50% off' },
  },
  IN: {
    weekly:  { id: 'vip_w_in', price: 79,   currency: '₹', label: 'Weekly',  period: 'week' },
    monthly: { id: 'vip_m_in', price: 249,  currency: '₹', label: 'Monthly', period: 'month', badge: 'POPULAR' },
    annual:  { id: 'vip_y_in', price: 1499, currency: '₹', label: 'Annual',  period: 'year',  badge: 'BEST DEAL', saving: '50% off' },
  },
  BD: {
    weekly:  { id: 'vip_w_bd', price: 199,  currency: '৳', label: 'Weekly',  period: 'week' },
    monthly: { id: 'vip_m_bd', price: 599,  currency: '৳', label: 'Monthly', period: 'month', badge: 'POPULAR' },
    annual:  { id: 'vip_y_bd', price: 3499, currency: '৳', label: 'Annual',  period: 'year',  badge: 'BEST DEAL', saving: '50% off' },
  },
  BR: {
    weekly:  { id: 'vip_w_br', price: 9.90,  currency: 'R$', label: 'Weekly',  period: 'week' },
    monthly: { id: 'vip_m_br', price: 34.90, currency: 'R$', label: 'Monthly', period: 'month', badge: 'POPULAR' },
    annual:  { id: 'vip_y_br', price: 199.9, currency: 'R$', label: 'Annual',  period: 'year',  badge: 'BEST DEAL', saving: '50% off' },
  },
  MX: {
    weekly:  { id: 'vip_w_mx', price: 39,  currency: 'MX$', label: 'Weekly',  period: 'week' },
    monthly: { id: 'vip_m_mx', price: 129, currency: 'MX$', label: 'Monthly', period: 'month', badge: 'POPULAR' },
    annual:  { id: 'vip_y_mx', price: 749, currency: 'MX$', label: 'Annual',  period: 'year',  badge: 'BEST DEAL', saving: '50% off' },
  },
  TR: {
    weekly:  { id: 'vip_w_tr', price: 59,  currency: '₺', label: 'Weekly',  period: 'week' },
    monthly: { id: 'vip_m_tr', price: 199, currency: '₺', label: 'Monthly', period: 'month', badge: 'POPULAR' },
    annual:  { id: 'vip_y_tr', price: 1149,currency: '₺', label: 'Annual',  period: 'year',  badge: 'BEST DEAL', saving: '50% off' },
  },
  PK: {
    weekly:  { id: 'vip_w_pk', price: 599,  currency: 'Rs', label: 'Weekly',  period: 'week' },
    monthly: { id: 'vip_m_pk', price: 1999, currency: 'Rs', label: 'Monthly', period: 'month', badge: 'POPULAR' },
    annual:  { id: 'vip_y_pk', price: 11999,currency: 'Rs', label: 'Annual',  period: 'year',  badge: 'BEST DEAL', saving: '50% off' },
  },
  ID: {
    weekly:  { id: 'vip_w_id', price: 29000,  currency: 'Rp', label: 'Weekly',  period: 'week' },
    monthly: { id: 'vip_m_id', price: 99000,  currency: 'Rp', label: 'Monthly', period: 'month', badge: 'POPULAR' },
    annual:  { id: 'vip_y_id', price: 579000, currency: 'Rp', label: 'Annual',  period: 'year',  badge: 'BEST DEAL', saving: '50% off' },
  },
  PH: {
    weekly:  { id: 'vip_w_ph', price: 119, currency: '₱', label: 'Weekly',  period: 'week' },
    monthly: { id: 'vip_m_ph', price: 399, currency: '₱', label: 'Monthly', period: 'month', badge: 'POPULAR' },
    annual:  { id: 'vip_y_ph', price: 2299,currency: '₱', label: 'Annual',  period: 'year',  badge: 'BEST DEAL', saving: '50% off' },
  },
  NG: {
    weekly:  { id: 'vip_w_ng', price: 2999,  currency: '₦', label: 'Weekly',  period: 'week' },
    monthly: { id: 'vip_m_ng', price: 9999,  currency: '₦', label: 'Monthly', period: 'month', badge: 'POPULAR' },
    annual:  { id: 'vip_y_ng', price: 57999, currency: '₦', label: 'Annual',  period: 'year',  badge: 'BEST DEAL', saving: '50% off' },
  },
  EG: {
    weekly:  { id: 'vip_w_eg', price: 99,  currency: 'E£', label: 'Weekly',  period: 'week' },
    monthly: { id: 'vip_m_eg', price: 329, currency: 'E£', label: 'Monthly', period: 'month', badge: 'POPULAR' },
    annual:  { id: 'vip_y_eg', price: 1899,currency: 'E£', label: 'Annual',  period: 'year',  badge: 'BEST DEAL', saving: '50% off' },
  },
};

// ─── GIFTS ────────────────────────────────────────────────────────────────────
export const GIFTS = [
  { id: 'heart',   name: 'Heart',       emoji: '❤️',  cost: 10,   diamonds: 5    },
  { id: 'rose',    name: 'Rose',        emoji: '🌹',  cost: 29,   diamonds: 14   },
  { id: 'kiss',    name: 'Kiss',        emoji: '💋',  cost: 49,   diamonds: 24   },
  { id: 'crown',   name: 'Crown',       emoji: '👑',  cost: 99,   diamonds: 49   },
  { id: 'fire',    name: 'Fire',        emoji: '🔥',  cost: 149,  diamonds: 74   },
  { id: 'rocket',  name: 'Rocket',      emoji: '🚀',  cost: 199,  diamonds: 99   },
  { id: 'diamond', name: 'Diamond',     emoji: '💎',  cost: 499,  diamonds: 249  },
  { id: 'car',     name: 'Sports Car',  emoji: '🏎️', cost: 999,  diamonds: 499  },
  { id: 'jet',     name: 'Private Jet', emoji: '✈️',  cost: 1999, diamonds: 999  },
  { id: 'castle',  name: 'Castle',      emoji: '🏰',  cost: 4999, diamonds: 2499 },
];

// ─── INTEREST TAGS ────────────────────────────────────────────────────────────
export const INTERESTS = [
  { id: 'gaming',    label: 'Gaming',    emoji: '🎮' },
  { id: 'music',     label: 'Music',     emoji: '🎵' },
  { id: 'movies',    label: 'Movies',    emoji: '🎬' },
  { id: 'travel',    label: 'Travel',    emoji: '✈️' },
  { id: 'fitness',   label: 'Fitness',   emoji: '💪' },
  { id: 'cooking',   label: 'Cooking',   emoji: '👨‍🍳' },
  { id: 'art',       label: 'Art',       emoji: '🎨' },
  { id: 'sports',    label: 'Sports',    emoji: '⚽' },
  { id: 'tech',      label: 'Tech',      emoji: '💻' },
  { id: 'fashion',   label: 'Fashion',   emoji: '👗' },
  { id: 'reading',   label: 'Reading',   emoji: '📚' },
  { id: 'dance',     label: 'Dance',     emoji: '💃' },
  { id: 'animals',   label: 'Animals',   emoji: '🐾' },
  { id: 'memes',     label: 'Memes',     emoji: '😂' },
  { id: 'nature',    label: 'Nature',    emoji: '🌿' },
  { id: 'business',  label: 'Business',  emoji: '💼' },
  { id: 'astrology', label: 'Astrology', emoji: '⭐' },
  { id: 'cars',      label: 'Cars',      emoji: '🚗' },
  { id: 'anime',     label: 'Anime',     emoji: '🗾' },
  { id: 'photography',label:'Photography',emoji:'📸' },
];

// ─── VIP PERKS ────────────────────────────────────────────────────────────────
export const VIP_PERKS = [
  { icon: '⚡', text: '3x faster matching' },
  { icon: '⚧', text: 'Gender filter — match who you want' },
  { icon: '🌍', text: 'Country filter — choose your region' },
  { icon: '🚫', text: 'Zero ads' },
  { icon: '👑', text: 'VIP badge on your profile' },
  { icon: '🚀', text: 'Profile boost — appear first' },
  { icon: '🎁', text: 'Daily 50 bonus coins' },
  { icon: '💬', text: 'Free text chat after session' },
];

// ─── REACTIONS ────────────────────────────────────────────────────────────────
export const REACTIONS = ['❤️', '😂', '😮', '🔥', '👏', '😍', '💯', '🤣'];

// ─── COUNTRY → PRICING REGION MAP ────────────────────────────────────────────
// Maps ISO country codes to COIN_PACKS / SUBSCRIPTION_PLANS keys
export const COUNTRY_PRICING_MAP = {
  IN: 'IN', BD: 'BD', ID: 'ID', PH: 'PH',
  BR: 'BR', MX: 'MX', TR: 'TR', PK: 'PK',
  NG: 'NG', EG: 'EG',
  // High income → default USD pricing
  US: 'default', GB: 'default', CA: 'default', AU: 'default',
  DE: 'default', FR: 'default', AE: 'default', SA: 'default',
  JP: 'default', KR: 'default', SG: 'default',
};

// ─── MATCH QUALITY ────────────────────────────────────────────────────────────
export const MATCH_QUALITY = {
  1: { label: 'Poor',    color: '#EF4444' },
  2: { label: 'Okay',    color: '#F59E0B' },
  3: { label: 'Good',    color: '#10B981' },
  4: { label: 'Great',   color: '#3B82F6' },
  5: { label: 'Amazing', color: '#7C3AED' },
};

// ─── COUNTRIES (for matching filter display) ──────────────────────────────────
export const COUNTRIES = [
  { code: null, label: 'Any Country',  flag: '🌍' },
  { code: 'IN', label: 'India',        flag: '🇮🇳' },
  { code: 'BD', label: 'Bangladesh',   flag: '🇧🇩' },
  { code: 'ID', label: 'Indonesia',    flag: '🇮🇩' },
  { code: 'PH', label: 'Philippines',  flag: '🇵🇭' },
  { code: 'TR', label: 'Turkey',       flag: '🇹🇷' },
  { code: 'PK', label: 'Pakistan',     flag: '🇵🇰' },
  { code: 'AE', label: 'UAE',          flag: '🇦🇪' },
  { code: 'SA', label: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'US', label: 'USA',          flag: '🇺🇸' },
  { code: 'GB', label: 'UK',           flag: '🇬🇧' },
  { code: 'EG', label: 'Egypt',        flag: '🇪🇬' },
  { code: 'NG', label: 'Nigeria',      flag: '🇳🇬' },
  { code: 'BR', label: 'Brazil',       flag: '🇧🇷' },
  { code: 'MX', label: 'Mexico',       flag: '🇲🇽' },
  { code: 'DE', label: 'Germany',      flag: '🇩🇪' },
  { code: 'FR', label: 'France',       flag: '🇫🇷' },
  { code: 'CA', label: 'Canada',       flag: '🇨🇦' },
  { code: 'AU', label: 'Australia',    flag: '🇦🇺' },
];
