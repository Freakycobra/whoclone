-- ConnectNow Database Schema (PostgreSQL / Supabase)
-- Run this on your Supabase dashboard → SQL Editor

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE,
  google_id VARCHAR(100) UNIQUE,
  display_name VARCHAR(50),
  gender VARCHAR(20),
  age INTEGER,
  bio TEXT,
  avatar_url TEXT,
  country_code VARCHAR(10),
  coins INTEGER DEFAULT 100,
  diamonds INTEGER DEFAULT 0,
  is_vip BOOLEAN DEFAULT FALSE,
  vip_expires_at TIMESTAMP,
  total_coins_purchased INTEGER DEFAULT 0,
  consecutive_purchases INTEGER DEFAULT 0,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  report_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW()
);

-- Sessions (chat history)
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES users(id),
  user2_id UUID REFERENCES users(id),
  channel_name VARCHAR(100),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  user1_rating INTEGER,
  user2_rating INTEGER,
  skip_by UUID REFERENCES users(id)
);

-- Gifts
CREATE TABLE gifts_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id),
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  gift_type VARCHAR(50),
  coins_spent INTEGER,
  diamonds_earned INTEGER,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Coin transactions
CREATE TABLE coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50), -- 'purchase', 'gift_sent', 'gift_received', 'daily_bonus', 'streak_bonus'
  amount INTEGER,   -- positive = credit, negative = debit
  pack_id VARCHAR(100),
  payment_method VARCHAR(50), -- 'google_play', 'stripe'
  receipt_id VARCHAR(200) UNIQUE,
  country_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  plan VARCHAR(50), -- 'weekly', 'monthly', 'annual'
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  payment_method VARCHAR(50),
  receipt_id VARCHAR(200)
);

-- Friends
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  friend_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Reports
CREATE TABLE user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id),
  reported_id UUID REFERENCES users(id),
  session_id UUID REFERENCES chat_sessions(id),
  reason VARCHAR(100),
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Blocks
CREATE TABLE user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES users(id),
  blocked_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Live streams
CREATE TABLE live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES users(id),
  title VARCHAR(100),
  topic VARCHAR(50),
  channel_name VARCHAR(100),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  peak_viewers INTEGER DEFAULT 0,
  total_diamonds_received INTEGER DEFAULT 0
);

-- Diamond withdrawals
CREATE TABLE diamond_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  diamonds INTEGER,
  usd_equivalent DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'rejected'
  payment_method VARCHAR(50),
  payment_details TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_country ON users(country_code);
CREATE INDEX idx_chat_sessions_user1 ON chat_sessions(user1_id);
CREATE INDEX idx_chat_sessions_user2 ON chat_sessions(user2_id);
CREATE INDEX idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX idx_gifts_session ON gifts_sent(session_id);
CREATE INDEX idx_reports_reported ON user_reports(reported_id, reviewed);
