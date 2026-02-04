-- Migration: Add User Tiers for FightingBooks
-- Created: 2026-02-04
-- Description: Adds tier columns to users table and creates purchases table
-- NOTE: FightingBooks uses 'users' table, not 'profiles'

-- 1. Add tier column to users table
-- Values: 'free', 'tier2', 'tier3'
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';

-- 2. Add tier purchase timestamp
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_purchased_at TIMESTAMPTZ;

-- 3. Add Stripe payment reference
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;

-- 4. Create purchases table to track all tier purchases
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('tier2', 'tier3')),
  amount_cents INTEGER NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create index for faster user purchase lookups
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);

-- 6. Ensure existing users have tier='free' (idempotent)
UPDATE users SET tier = 'free' WHERE tier IS NULL;

-- Verification query (run manually to check):
-- SELECT id, email, tier, tier_purchased_at FROM users LIMIT 10;
-- SELECT COUNT(*) as total_users, tier FROM users GROUP BY tier;
