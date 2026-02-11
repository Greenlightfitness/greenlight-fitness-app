-- ============================================
-- GREENLIGHT FITNESS - SUPABASE SCHEMA
-- ============================================
-- Führe dieses SQL im Supabase Dashboard aus:
-- SQL Editor > New Query > Paste > Run
-- ============================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT CHECK (role IN ('ATHLETE', 'COACH', 'ADMIN')) DEFAULT 'ATHLETE',
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  nickname TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  birth_date DATE,
  height NUMERIC,
  weight NUMERIC,
  waist_circumference NUMERIC,
  body_fat NUMERIC,
  resting_heart_rate INTEGER,
  max_heart_rate INTEGER,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EXERCISES
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')) DEFAULT 'Beginner',
  video_url TEXT,
  thumbnail_url TEXT,
  sequence_url TEXT,
  default_sets JSONB,
  default_visible_metrics TEXT[],
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PLANS
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WEEKS
CREATE TABLE IF NOT EXISTS public.weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  "order" INTEGER NOT NULL,
  focus TEXT
);

-- 5. SESSIONS
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID REFERENCES public.weeks(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER,
  workout_data JSONB
);

-- 6. ASSIGNED PLANS
CREATE TABLE IF NOT EXISTS public.assigned_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) NOT NULL,
  coach_id UUID REFERENCES public.profiles(id) NOT NULL,
  original_plan_id UUID REFERENCES public.plans(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  start_date DATE,
  plan_name TEXT,
  description TEXT,
  assignment_type TEXT CHECK (assignment_type IN ('ONE_TO_ONE', 'GROUP_FLEX')) DEFAULT 'ONE_TO_ONE',
  schedule_status TEXT CHECK (schedule_status IN ('PENDING', 'ACTIVE', 'COMPLETED')) DEFAULT 'PENDING',
  schedule JSONB DEFAULT '{}',
  structure JSONB
);

-- 7. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.profiles(id) NOT NULL,
  plan_id UUID REFERENCES public.plans(id),
  title TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  features TEXT[],
  category TEXT CHECK (category IN ('POLICE', 'FIRE', 'MILITARY', 'GENERAL', 'RECOVERY')),
  type TEXT CHECK (type IN ('PLAN', 'COACHING_1ON1', 'ADDON')),
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  interval TEXT CHECK (interval IN ('onetime', 'month', 'year')) DEFAULT 'onetime',
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ATTENTIONS
CREATE TABLE IF NOT EXISTS public.attentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) NOT NULL,
  athlete_name TEXT,
  coach_id UUID REFERENCES public.profiles(id),
  type TEXT CHECK (type IN ('INJURY', 'MISSED_SESSION', 'FEEDBACK', 'OTHER')),
  severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')) DEFAULT 'MEDIUM',
  message TEXT,
  status TEXT CHECK (status IN ('OPEN', 'RESOLVED', 'ARCHIVED')) DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ACTIVITIES
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) NOT NULL,
  athlete_name TEXT,
  type TEXT CHECK (type IN ('WORKOUT_COMPLETE', 'PR_HIT', 'CHECK_IN', 'NOTE')),
  title TEXT,
  subtitle TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) NOT NULL,
  athlete_name TEXT,
  coach_id UUID REFERENCES public.profiles(id) NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  status TEXT CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED')) DEFAULT 'PENDING',
  type TEXT CHECK (type IN ('CONSULTATION', 'CHECKIN')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- EXERCISES: Everyone can read, authors can modify
CREATE POLICY "Exercises are viewable by everyone" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Coaches can create exercises" ON public.exercises FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update exercises" ON public.exercises FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete exercises" ON public.exercises FOR DELETE USING (auth.uid() = author_id);

-- PLANS: Coach owns, everyone can read for now
CREATE POLICY "Plans are viewable by everyone" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Coaches can create plans" ON public.plans FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coaches can update own plans" ON public.plans FOR UPDATE USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can delete own plans" ON public.plans FOR DELETE USING (auth.uid() = coach_id);

-- WEEKS: Based on plan ownership
CREATE POLICY "Weeks are viewable by everyone" ON public.weeks FOR SELECT USING (true);
CREATE POLICY "Coaches can manage weeks" ON public.weeks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.plans WHERE plans.id = weeks.plan_id AND plans.coach_id = auth.uid())
);

-- SESSIONS: Based on plan ownership
CREATE POLICY "Sessions are viewable by everyone" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Coaches can manage sessions" ON public.sessions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.weeks 
    JOIN public.plans ON plans.id = weeks.plan_id 
    WHERE weeks.id = sessions.week_id AND plans.coach_id = auth.uid()
  )
);

-- ASSIGNED PLANS: Athlete or Coach can view
CREATE POLICY "Users can view own assigned plans" ON public.assigned_plans FOR SELECT USING (
  auth.uid() = athlete_id OR auth.uid() = coach_id
);
CREATE POLICY "Coaches can create assignments" ON public.assigned_plans FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coaches can update assignments" ON public.assigned_plans FOR UPDATE USING (auth.uid() = coach_id);
CREATE POLICY "Athletes can update own schedule" ON public.assigned_plans FOR UPDATE USING (auth.uid() = athlete_id);

-- PRODUCTS: Public read, coach modify
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Coaches can manage products" ON public.products FOR ALL USING (auth.uid() = coach_id);

-- ATTENTIONS: Athletes and Coaches
CREATE POLICY "Users can view relevant attentions" ON public.attentions FOR SELECT USING (
  auth.uid() = athlete_id OR auth.uid() = coach_id OR coach_id IS NULL
);
CREATE POLICY "Athletes can create attentions" ON public.attentions FOR INSERT WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "Coaches can update attentions" ON public.attentions FOR UPDATE USING (auth.uid() = coach_id);

-- ACTIVITIES: Athletes and Coaches
CREATE POLICY "Users can view activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Athletes can create activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = athlete_id);

-- APPOINTMENTS: Athletes and Coaches
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (
  auth.uid() = athlete_id OR auth.uid() = coach_id
);
CREATE POLICY "Coaches can manage appointments" ON public.appointments FOR ALL USING (auth.uid() = coach_id);

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'ATHLETE');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 11. CONSENT LOGS (DSGVO Art. 7 - Nachweis)
-- ============================================
CREATE TABLE IF NOT EXISTS public.consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  consent_type TEXT CHECK (consent_type IN ('TERMS', 'PRIVACY', 'MARKETING', 'ANALYTICS')) NOT NULL,
  consent_given BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  consent_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AUDIT LOGS (DSGVO Art. 30 - Verarbeitungsverzeichnis)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. DATA DELETION REQUESTS (DSGVO Art. 17 - Recht auf Löschung)
CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  user_email TEXT NOT NULL,
  reason TEXT,
  status TEXT CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED')) DEFAULT 'PENDING',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.profiles(id)
);

-- 14. DATA EXPORT REQUESTS (DSGVO Art. 20 - Datenportabilität)
CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT CHECK (status IN ('PENDING', 'PROCESSING', 'READY', 'DOWNLOADED', 'EXPIRED')) DEFAULT 'PENDING',
  export_url TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- RLS for GDPR tables
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents" ON public.consent_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consents" ON public.consent_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own deletion requests" ON public.data_deletion_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create deletion requests" ON public.data_deletion_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own export requests" ON public.data_export_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create export requests" ON public.data_export_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 15. ATHLETE SCHEDULE (Tagesplanung)
-- ============================================
CREATE TABLE IF NOT EXISTS public.athlete_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  plan_id UUID REFERENCES public.plans(id),
  plan_name TEXT,
  week_number INTEGER,
  day_number INTEGER,
  session_title TEXT,
  workout_data JSONB,
  completed BOOLEAN DEFAULT FALSE,
  duration_seconds INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 16. WORKOUT LOGS (Training-Protokolle)
-- ============================================
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id),
  exercise_name TEXT NOT NULL,
  workout_date DATE DEFAULT CURRENT_DATE,
  sets JSONB NOT NULL,
  total_volume NUMERIC,
  duration_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 17. EXERCISE PERSONAL BESTS (PRs)
-- ============================================
CREATE TABLE IF NOT EXISTS public.exercise_pbs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  pb_type TEXT CHECK (pb_type IN ('1RM', 'MAX_WEIGHT', 'MAX_REPS', 'MAX_VOLUME')) NOT NULL,
  value NUMERIC NOT NULL,
  reps INTEGER,
  weight NUMERIC,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  workout_log_id UUID REFERENCES public.workout_logs(id),
  UNIQUE(athlete_id, exercise_id, pb_type)
);

-- ============================================
-- 18. DAILY WELLNESS (Tägliches Wohlbefinden)
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_wellness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  sleep_hours NUMERIC,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  muscle_soreness INTEGER CHECK (muscle_soreness >= 1 AND muscle_soreness <= 5),
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, date)
);

-- ============================================
-- 19. DAILY STATS (Tagesstatistiken)
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_volume NUMERIC DEFAULT 0,
  total_reps INTEGER DEFAULT 0,
  total_sets INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  training_duration_seconds INTEGER DEFAULT 0,
  push_volume NUMERIC DEFAULT 0,
  pull_volume NUMERIC DEFAULT 0,
  legs_volume NUMERIC DEFAULT 0,
  muscle_groups JSONB,
  prs_hit INTEGER DEFAULT 0,
  UNIQUE(athlete_id, date)
);

-- ============================================
-- 20. WEEKLY STATS (Wochenstatistiken)
-- ============================================
CREATE TABLE IF NOT EXISTS public.weekly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  sessions_completed INTEGER DEFAULT 0,
  sessions_planned INTEGER DEFAULT 0,
  total_volume NUMERIC DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  push_pull_ratio NUMERIC,
  prs_hit INTEGER DEFAULT 0,
  consistency_score NUMERIC,
  UNIQUE(athlete_id, week_start)
);

-- ============================================
-- 21. BLOCK TEMPLATES (Wiederverwendbare Blöcke)
-- ============================================
CREATE TABLE IF NOT EXISTS public.block_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  block_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Analytics tables
ALTER TABLE public.athlete_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_pbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_wellness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes manage own schedule" ON public.athlete_schedule FOR ALL USING (auth.uid() = athlete_id);
CREATE POLICY "Coaches view athlete schedule" ON public.athlete_schedule FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assigned_plans WHERE athlete_id = athlete_schedule.athlete_id AND coach_id = auth.uid())
);

CREATE POLICY "Athletes manage own workout logs" ON public.workout_logs FOR ALL USING (auth.uid() = athlete_id);
CREATE POLICY "Coaches view athlete logs" ON public.workout_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assigned_plans WHERE athlete_id = workout_logs.athlete_id AND coach_id = auth.uid())
);

CREATE POLICY "Athletes manage own pbs" ON public.exercise_pbs FOR ALL USING (auth.uid() = athlete_id);
CREATE POLICY "Coaches view athlete pbs" ON public.exercise_pbs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assigned_plans WHERE athlete_id = exercise_pbs.athlete_id AND coach_id = auth.uid())
);

CREATE POLICY "Athletes manage own wellness" ON public.daily_wellness FOR ALL USING (auth.uid() = athlete_id);
CREATE POLICY "Coaches view athlete wellness" ON public.daily_wellness FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assigned_plans WHERE athlete_id = daily_wellness.athlete_id AND coach_id = auth.uid())
);

CREATE POLICY "Athletes view own daily stats" ON public.daily_stats FOR ALL USING (auth.uid() = athlete_id);
CREATE POLICY "Coaches view athlete daily stats" ON public.daily_stats FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assigned_plans WHERE athlete_id = daily_stats.athlete_id AND coach_id = auth.uid())
);

CREATE POLICY "Athletes view own weekly stats" ON public.weekly_stats FOR ALL USING (auth.uid() = athlete_id);
CREATE POLICY "Coaches view athlete weekly stats" ON public.weekly_stats FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assigned_plans WHERE athlete_id = weekly_stats.athlete_id AND coach_id = auth.uid())
);

CREATE POLICY "Users manage own block templates" ON public.block_templates FOR ALL USING (auth.uid() = athlete_id OR auth.uid() = coach_id);
CREATE POLICY "View public block templates" ON public.block_templates FOR SELECT USING (is_public = true);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_athlete_schedule_athlete_date ON public.athlete_schedule(athlete_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_athlete ON public.workout_logs(athlete_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_exercise ON public.workout_logs(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON public.workout_logs(workout_date);
CREATE INDEX IF NOT EXISTS idx_daily_wellness_athlete_date ON public.daily_wellness(athlete_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_athlete_date ON public.daily_stats(athlete_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_athlete ON public.weekly_stats(athlete_id, week_start);
CREATE INDEX IF NOT EXISTS idx_exercise_pbs_athlete ON public.exercise_pbs(athlete_id);

CREATE INDEX IF NOT EXISTS idx_exercises_author ON public.exercises(author_id);
CREATE INDEX IF NOT EXISTS idx_plans_coach ON public.plans(coach_id);
CREATE INDEX IF NOT EXISTS idx_weeks_plan ON public.weeks(plan_id);
CREATE INDEX IF NOT EXISTS idx_sessions_week ON public.sessions(week_id);
CREATE INDEX IF NOT EXISTS idx_assigned_plans_athlete ON public.assigned_plans(athlete_id);
CREATE INDEX IF NOT EXISTS idx_assigned_plans_coach ON public.assigned_plans(coach_id);
CREATE INDEX IF NOT EXISTS idx_products_coach ON public.products(coach_id);
CREATE INDEX IF NOT EXISTS idx_attentions_athlete ON public.attentions(athlete_id);
CREATE INDEX IF NOT EXISTS idx_activities_athlete ON public.activities(athlete_id);

-- ============================================
-- 22. COACHING APPROVALS (Vorabgespräch + Freischaltung)
-- ============================================
CREATE TABLE IF NOT EXISTS public.coaching_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  
  -- Consultation Status
  consultation_completed BOOLEAN DEFAULT FALSE,
  consultation_appointment_id UUID REFERENCES public.appointments(id),
  
  -- Approval Status
  approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Manual Override (Bonus/Gratis)
  is_manual_grant BOOLEAN DEFAULT FALSE,
  grant_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, product_id)
);

-- ============================================
-- 23. COACHING RELATIONSHIPS (Aktive 1:1 Beziehungen)
-- ============================================
CREATE TABLE IF NOT EXISTS public.coaching_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  
  -- Status
  status TEXT CHECK (status IN ('ACTIVE', 'PAUSED', 'ENDED')) DEFAULT 'ACTIVE',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Subscription Tracking
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  
  -- Manual grant info
  is_manual_grant BOOLEAN DEFAULT FALSE,
  grant_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, coach_id)
);

-- ============================================
-- 24. GOALS (Zielvorhaben)
-- ============================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES public.profiles(id),
  
  -- Goal Definition
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT CHECK (goal_type IN ('STRENGTH', 'ENDURANCE', 'BODY_COMP', 'CONSISTENCY', 'CUSTOM')) NOT NULL,
  
  -- Target & Progress
  target_value NUMERIC NOT NULL,
  target_unit TEXT NOT NULL,
  start_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  
  -- Timing
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  
  -- Tracking Reference
  exercise_id UUID REFERENCES public.exercises(id),
  metric_key TEXT,
  
  -- Status
  status TEXT CHECK (status IN ('ACTIVE', 'ACHIEVED', 'FAILED', 'PAUSED')) DEFAULT 'ACTIVE',
  achieved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 25. GOAL CHECKPOINTS (Progress-Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.goal_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  recorded_at DATE NOT NULL,
  value NUMERIC NOT NULL,
  notes TEXT,
  source TEXT CHECK (source IN ('WORKOUT', 'MANUAL', 'PROFILE_UPDATE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 26. INVITATIONS (E-Mail Einladungen)
-- ============================================
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Invitation Details
  email TEXT NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) NOT NULL,
  invitation_code TEXT UNIQUE NOT NULL,
  personal_message TEXT,
  
  -- Pre-configured Status
  role TEXT CHECK (role IN ('ATHLETE', 'COACH')) DEFAULT 'ATHLETE',
  auto_approve_coaching BOOLEAN DEFAULT FALSE,
  auto_assign_product_id UUID REFERENCES public.products(id),
  auto_assign_plan_id UUID REFERENCES public.plans(id),
  
  -- Bonus/Gratis
  is_bonus_grant BOOLEAN DEFAULT FALSE,
  bonus_product_id UUID REFERENCES public.products(id),
  bonus_reason TEXT,
  
  -- Status
  status TEXT CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')) DEFAULT 'PENDING',
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  accepted_by_user_id UUID REFERENCES public.profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for new tables
ALTER TABLE public.coaching_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- COACHING APPROVALS: Athletes can view own, Coaches can manage
CREATE POLICY "Athletes view own approvals" ON public.coaching_approvals FOR SELECT USING (auth.uid() = athlete_id);
CREATE POLICY "Coaches manage approvals" ON public.coaching_approvals FOR ALL USING (
  EXISTS (SELECT 1 FROM public.products WHERE products.id = coaching_approvals.product_id AND products.coach_id = auth.uid())
);
CREATE POLICY "System can insert approvals" ON public.coaching_approvals FOR INSERT WITH CHECK (true);

-- COACHING RELATIONSHIPS: Athletes and Coaches can view
CREATE POLICY "Users view own relationships" ON public.coaching_relationships FOR SELECT USING (
  auth.uid() = athlete_id OR auth.uid() = coach_id
);
CREATE POLICY "Coaches can manage relationships" ON public.coaching_relationships FOR ALL USING (auth.uid() = coach_id);
CREATE POLICY "System can insert relationships" ON public.coaching_relationships FOR INSERT WITH CHECK (true);

-- GOALS: Athletes own, Coaches can view/create for their athletes
CREATE POLICY "Athletes manage own goals" ON public.goals FOR ALL USING (auth.uid() = athlete_id);
CREATE POLICY "Coaches manage athlete goals" ON public.goals FOR ALL USING (auth.uid() = coach_id);
CREATE POLICY "Coaches view athlete goals" ON public.goals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.coaching_relationships WHERE athlete_id = goals.athlete_id AND coach_id = auth.uid() AND status = 'ACTIVE')
);

-- GOAL CHECKPOINTS: Based on goal ownership
CREATE POLICY "Users manage goal checkpoints" ON public.goal_checkpoints FOR ALL USING (
  EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_checkpoints.goal_id AND (goals.athlete_id = auth.uid() OR goals.coach_id = auth.uid()))
);

-- INVITATIONS: Coaches can manage their invitations
CREATE POLICY "Coaches manage own invitations" ON public.invitations FOR ALL USING (auth.uid() = invited_by);
CREATE POLICY "Anyone can view invitation by code" ON public.invitations FOR SELECT USING (true);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_coaching_approvals_athlete ON public.coaching_approvals(athlete_id);
CREATE INDEX IF NOT EXISTS idx_coaching_approvals_product ON public.coaching_approvals(product_id);
CREATE INDEX IF NOT EXISTS idx_coaching_relationships_athlete ON public.coaching_relationships(athlete_id);
CREATE INDEX IF NOT EXISTS idx_coaching_relationships_coach ON public.coaching_relationships(coach_id);
CREATE INDEX IF NOT EXISTS idx_goals_athlete ON public.goals(athlete_id);
CREATE INDEX IF NOT EXISTS idx_goals_coach ON public.goals(coach_id);
CREATE INDEX IF NOT EXISTS idx_goal_checkpoints_goal ON public.goal_checkpoints(goal_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

-- ============================================
-- COMPLIANCE EXTENSION (DSGVO / §147 AO)
-- See: scripts/create-compliance-tables.sql
-- ============================================
-- legal_versions        → Versionierung aller Rechtstexte
-- purchase_ledger       → Immutables Finanz-Logbuch (redundant zu Stripe)
-- archived_users        → Anonymisierte Nutzer-Archive nach Löschung
-- anonymize_user()      → DSGVO Art. 17 Anonymisierungsfunktion
-- get_current_legal_version() → Aktuelle Version eines Rechtstexts

-- ============================================
-- DONE! Schema ready for Greenlight Fitness
-- ============================================
