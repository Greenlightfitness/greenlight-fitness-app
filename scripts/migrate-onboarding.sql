-- ============================================
-- ONBOARDING SYSTEM MIGRATION
-- Adds coach/admin-specific profile fields
-- ============================================

-- Coach-specific profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coach_bio TEXT,
  ADD COLUMN IF NOT EXISTS coach_title TEXT,
  ADD COLUMN IF NOT EXISTS coach_specializations TEXT[],
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS social_instagram TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT;
