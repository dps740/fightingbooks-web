-- Promo codes for influencer outreach
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jezhpdzptxgncvksdrzz/sql

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT, -- e.g. "For @momlife_sarah on TikTok"
  active BOOLEAN DEFAULT true,
  max_uses INTEGER, -- NULL = unlimited
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  promo_code_id UUID REFERENCES promo_codes(id) NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create some initial promo codes for outreach
INSERT INTO promo_codes (code, description, max_uses) VALUES
  ('CREATOR2026', 'General creator outreach code', 50),
  ('FREEACCESS', 'Direct outreach code', 20),
  ('TRYITFREE', 'Social media promo code', 100);

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_redemptions(user_id);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write promo_codes (admin only)
CREATE POLICY "Service role full access to promo_codes" ON promo_codes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to promo_redemptions" ON promo_redemptions
  FOR ALL USING (true) WITH CHECK (true);
