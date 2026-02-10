-- ============================================
-- BOOKING SYSTEM MIGRATION
-- Adds booking_slug to profiles, is_public to coach_calendars,
-- and duration_minutes to appointments
-- ============================================

-- 1. Add booking_slug to profiles (unique, URL-safe identifier for coaches)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS booking_slug TEXT UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_profiles_booking_slug ON public.profiles(booking_slug) WHERE booking_slug IS NOT NULL;

-- 2. Add is_public + color to coach_calendars
ALTER TABLE public.coach_calendars
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#00FF00';

-- 3. Add duration_minutes to appointments (if not exists)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS calendar_id UUID REFERENCES public.coach_calendars(id),
  ADD COLUMN IF NOT EXISTS booker_name TEXT,
  ADD COLUMN IF NOT EXISTS booker_email TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- 4. RLS: Allow public read of profiles by booking_slug (for public booking page)
CREATE POLICY IF NOT EXISTS "Public can read coach profiles by slug"
  ON public.profiles FOR SELECT
  USING (booking_slug IS NOT NULL AND role IN ('COACH', 'ADMIN'));

-- 5. RLS: Allow public read of coach_calendars that are public
CREATE POLICY IF NOT EXISTS "Public can read public calendars"
  ON public.coach_calendars FOR SELECT
  USING (is_public = TRUE);

-- 6. RLS: Allow public read of coach_availability for public calendars
CREATE POLICY IF NOT EXISTS "Public can read availability for public calendars"
  ON public.coach_availability FOR SELECT
  USING (
    calendar_id IN (SELECT id FROM public.coach_calendars WHERE is_public = TRUE)
  );

-- 7. RLS: Allow public insert of appointments (for unauthenticated booking)
CREATE POLICY IF NOT EXISTS "Public can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (TRUE);

-- 8. RLS: Allow public read of appointments for slot conflict checking
CREATE POLICY IF NOT EXISTS "Public can read appointment times for conflict check"
  ON public.appointments FOR SELECT
  USING (TRUE);
