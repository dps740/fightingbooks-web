-- Promo code system for FightingBooks v2
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jezhpdzptxgncvksdrzz/sql

-- Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT true,
  max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
  times_used INTEGER DEFAULT 0,
  created_by TEXT, -- influencer name or source
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT NULL -- NULL = never expires
);

-- Promo redemptions table (tracks who used what)
CREATE TABLE IF NOT EXISTS promo_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id),
  code TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_code ON promo_redemptions(promo_code_id);

-- RLS policies
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Promo codes: anyone can read (to validate), only service role can write
CREATE POLICY "Anyone can read active promo codes" ON promo_codes
  FOR SELECT USING (active = true);

-- Redemptions: users can see their own, service role handles inserts
CREATE POLICY "Users can view own redemptions" ON promo_redemptions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role bypasses RLS, so insert/update from API routes works automatically

-- Insert a few starter promo codes for testing
INSERT INTO promo_codes (code, description, created_by, max_uses) VALUES
  ('TESTCODE', 'Internal testing code', 'Scout', 10),
  ('FIGHTFREE', 'General influencer code', 'Outreach', NULL)
ON CONFLICT (code) DO NOTHING;
