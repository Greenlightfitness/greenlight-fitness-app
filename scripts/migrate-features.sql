-- ============================================
-- GREENLIGHT FITNESS - Feature Expansion Migration
-- Run in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. BODY MEASUREMENTS (Körperdaten über Zeit)
-- ============================================
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight NUMERIC,              -- kg
  body_fat NUMERIC,            -- %
  waist_circumference NUMERIC, -- cm
  chest NUMERIC,               -- cm
  arm_left NUMERIC,            -- cm
  arm_right NUMERIC,           -- cm
  thigh_left NUMERIC,          -- cm
  thigh_right NUMERIC,         -- cm
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, date)
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes manage own measurements" ON public.body_measurements
  FOR ALL USING (auth.uid() = athlete_id);

CREATE POLICY "Coaches view athlete measurements" ON public.body_measurements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.coaching_relationships
      WHERE athlete_id = body_measurements.athlete_id
        AND coach_id = auth.uid()
        AND status = 'ACTIVE'
    )
  );

CREATE INDEX IF NOT EXISTS idx_body_measurements_athlete_date
  ON public.body_measurements(athlete_id, date DESC);

-- ============================================
-- 2. COACH NOTES (Notizen pro Athlet)
-- ============================================
CREATE TABLE IF NOT EXISTS public.coach_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own notes" ON public.coach_notes
  FOR ALL USING (auth.uid() = coach_id);

CREATE INDEX IF NOT EXISTS idx_coach_notes_coach_athlete
  ON public.coach_notes(coach_id, athlete_id);
CREATE INDEX IF NOT EXISTS idx_coach_notes_pinned
  ON public.coach_notes(coach_id, is_pinned) WHERE is_pinned = TRUE;

-- ============================================
-- 3. WORKOUT FEEDBACK (Coach-Kommentare auf Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS public.workout_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own feedback" ON public.workout_feedback
  FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Athletes view own feedback" ON public.workout_feedback
  FOR SELECT USING (auth.uid() = athlete_id);

CREATE INDEX IF NOT EXISTS idx_workout_feedback_log
  ON public.workout_feedback(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_workout_feedback_athlete
  ON public.workout_feedback(athlete_id);

-- ============================================
-- 4. CHECK-INS (Wöchentliche Athleten Check-Ins)
-- ============================================
CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES public.profiles(id),
  week_start DATE NOT NULL,
  weight NUMERIC,
  body_fat NUMERIC,
  nutrition_rating INTEGER CHECK (nutrition_rating >= 1 AND nutrition_rating <= 5),
  sleep_rating INTEGER CHECK (sleep_rating >= 1 AND sleep_rating <= 5),
  stress_rating INTEGER CHECK (stress_rating >= 1 AND stress_rating <= 5),
  energy_rating INTEGER CHECK (energy_rating >= 1 AND energy_rating <= 5),
  notes TEXT,
  coach_response TEXT,
  photo_urls TEXT[],
  status TEXT CHECK (status IN ('SUBMITTED', 'REVIEWED')) DEFAULT 'SUBMITTED',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, week_start)
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes manage own check-ins" ON public.check_ins
  FOR ALL USING (auth.uid() = athlete_id);

CREATE POLICY "Coaches view and respond to check-ins" ON public.check_ins
  FOR ALL USING (auth.uid() = coach_id);

CREATE INDEX IF NOT EXISTS idx_check_ins_athlete_week
  ON public.check_ins(athlete_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_coach_status
  ON public.check_ins(coach_id, status);

-- ============================================
-- DONE! Feature tables ready.
-- ============================================
