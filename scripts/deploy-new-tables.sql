-- ============================================
-- GREENLIGHT FITNESS - Neue Tabellen
-- Goals, Coaching Approvals, Invitations
-- ============================================
-- Kopiere diesen Inhalt in den Supabase SQL Editor
-- und führe ihn aus.
-- ============================================

-- 21. COACHING APPROVALS (Freischaltung für 1:1 Coaching)
CREATE TABLE IF NOT EXISTS public.coaching_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  consultation_completed BOOLEAN DEFAULT false,
  consultation_appointment_id UUID REFERENCES public.appointments(id),
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  is_manual_grant BOOLEAN DEFAULT false,
  grant_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, product_id)
);

ALTER TABLE public.coaching_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own approvals" ON public.coaching_approvals
  FOR SELECT USING (auth.uid() = athlete_id OR auth.uid() = approved_by);

CREATE POLICY "Coaches can manage approvals" ON public.coaching_approvals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('COACH', 'ADMIN'))
  );

CREATE POLICY "Athletes can create own approvals" ON public.coaching_approvals
  FOR INSERT WITH CHECK (auth.uid() = athlete_id);

-- 22. COACHING RELATIONSHIPS (Aktive Coaching-Beziehungen)
CREATE TABLE IF NOT EXISTS public.coaching_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES public.profiles(id) NOT NULL,
  product_id UUID REFERENCES public.products(id),
  status TEXT CHECK (status IN ('ACTIVE', 'PAUSED', 'ENDED')) DEFAULT 'ACTIVE',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  is_manual_grant BOOLEAN DEFAULT false,
  grant_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, coach_id)
);

ALTER TABLE public.coaching_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own relationships" ON public.coaching_relationships
  FOR SELECT USING (auth.uid() = athlete_id OR auth.uid() = coach_id);

CREATE POLICY "System can create relationships" ON public.coaching_relationships
  FOR INSERT WITH CHECK (auth.uid() = athlete_id OR auth.uid() = coach_id);

CREATE POLICY "Coaches can update their relationships" ON public.coaching_relationships
  FOR UPDATE USING (auth.uid() = coach_id);

-- 23. INVITATIONS (Einladungssystem)
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) NOT NULL,
  invitation_code TEXT UNIQUE NOT NULL,
  personal_message TEXT,
  role TEXT DEFAULT 'ATHLETE',
  auto_approve_coaching BOOLEAN DEFAULT false,
  auto_assign_product_id UUID REFERENCES public.products(id),
  auto_assign_plan_id UUID,
  is_bonus_grant BOOLEAN DEFAULT false,
  bonus_product_id UUID REFERENCES public.products(id),
  bonus_reason TEXT,
  status TEXT CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')) DEFAULT 'PENDING',
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  accepted_by_user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage invitations" ON public.invitations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('COACH', 'ADMIN'))
  );

CREATE POLICY "Anyone can view invitation by code" ON public.invitations
  FOR SELECT USING (true);

-- 24. GOALS (Zielvorhaben)
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT CHECK (goal_type IN ('STRENGTH', 'BODY_COMP', 'ENDURANCE', 'CONSISTENCY', 'CUSTOM')) NOT NULL,
  target_value NUMERIC NOT NULL,
  target_unit TEXT NOT NULL,
  start_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id),
  metric_key TEXT,
  status TEXT CHECK (status IN ('ACTIVE', 'ACHIEVED', 'FAILED', 'CANCELLED')) DEFAULT 'ACTIVE',
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT USING (auth.uid() = athlete_id OR auth.uid() = coach_id);

CREATE POLICY "Users can create own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = athlete_id OR auth.uid() = coach_id);

CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = athlete_id OR auth.uid() = coach_id);

CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = athlete_id);

-- 25. GOAL CHECKPOINTS (Fortschritts-Checkpoints)
CREATE TABLE IF NOT EXISTS public.goal_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  recorded_at DATE NOT NULL,
  value NUMERIC NOT NULL,
  notes TEXT,
  source TEXT CHECK (source IN ('WORKOUT', 'MANUAL', 'PROFILE_UPDATE', 'AUTO')) DEFAULT 'MANUAL',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.goal_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own checkpoints" ON public.goal_checkpoints
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND (athlete_id = auth.uid() OR coach_id = auth.uid()))
  );

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_coaching_approvals_athlete ON public.coaching_approvals(athlete_id);
CREATE INDEX IF NOT EXISTS idx_coaching_approvals_product ON public.coaching_approvals(product_id);
CREATE INDEX IF NOT EXISTS idx_coaching_relationships_athlete ON public.coaching_relationships(athlete_id);
CREATE INDEX IF NOT EXISTS idx_coaching_relationships_coach ON public.coaching_relationships(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_relationships_status ON public.coaching_relationships(status);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_goals_athlete ON public.goals(athlete_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goal_checkpoints_goal ON public.goal_checkpoints(goal_id);

-- Done!
SELECT 'Neue Tabellen erfolgreich erstellt!' as status;
