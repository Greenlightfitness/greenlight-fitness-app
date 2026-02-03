-- =============================================
-- GOALS & GOAL_CHECKPOINTS TABLES
-- =============================================

-- Goals Table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES profiles(id) NOT NULL,
  coach_id UUID REFERENCES profiles(id),
  
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('STRENGTH', 'ENDURANCE', 'BODY_COMP', 'CONSISTENCY', 'CUSTOM')),
  
  target_value NUMERIC NOT NULL,
  target_unit TEXT NOT NULL,
  start_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  
  exercise_id UUID REFERENCES exercises(id),
  metric_key TEXT,
  
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACHIEVED', 'FAILED', 'PAUSED')),
  achieved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Goal Checkpoints Table (Progress tracking)
CREATE TABLE IF NOT EXISTS goal_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  recorded_at DATE NOT NULL,
  value NUMERIC NOT NULL,
  notes TEXT,
  source TEXT CHECK (source IN ('WORKOUT', 'MANUAL', 'PROFILE_UPDATE')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goals_athlete ON goals(athlete_id);
CREATE INDEX IF NOT EXISTS idx_goals_coach ON goals(coach_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goal_checkpoints_goal ON goal_checkpoints(goal_id);

-- RLS Policies
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_checkpoints ENABLE ROW LEVEL SECURITY;

-- Goals: Athletes can see/manage their own, Coaches can see/manage for their athletes
DROP POLICY IF EXISTS "Athletes can view own goals" ON goals;
CREATE POLICY "Athletes can view own goals" ON goals
  FOR SELECT USING (athlete_id = auth.uid());

DROP POLICY IF EXISTS "Athletes can insert own goals" ON goals;
CREATE POLICY "Athletes can insert own goals" ON goals
  FOR INSERT WITH CHECK (athlete_id = auth.uid());

DROP POLICY IF EXISTS "Athletes can update own goals" ON goals;
CREATE POLICY "Athletes can update own goals" ON goals
  FOR UPDATE USING (athlete_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can view athlete goals" ON goals;
CREATE POLICY "Coaches can view athlete goals" ON goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coaching_relationships cr
      WHERE cr.athlete_id = goals.athlete_id
      AND cr.coach_id = auth.uid()
      AND cr.status = 'ACTIVE'
    )
  );

DROP POLICY IF EXISTS "Coaches can manage athlete goals" ON goals;
CREATE POLICY "Coaches can manage athlete goals" ON goals
  FOR ALL USING (
    coach_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM coaching_relationships cr
      WHERE cr.athlete_id = goals.athlete_id
      AND cr.coach_id = auth.uid()
      AND cr.status = 'ACTIVE'
    )
  );

DROP POLICY IF EXISTS "Admins full access goals" ON goals;
CREATE POLICY "Admins full access goals" ON goals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Goal Checkpoints: Same pattern
DROP POLICY IF EXISTS "Users can view own goal checkpoints" ON goal_checkpoints;
CREATE POLICY "Users can view own goal checkpoints" ON goal_checkpoints
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_id AND goals.athlete_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own goal checkpoints" ON goal_checkpoints;
CREATE POLICY "Users can insert own goal checkpoints" ON goal_checkpoints
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_id AND goals.athlete_id = auth.uid())
  );

DROP POLICY IF EXISTS "Coaches can manage goal checkpoints" ON goal_checkpoints;
CREATE POLICY "Coaches can manage goal checkpoints" ON goal_checkpoints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM goals g
      JOIN coaching_relationships cr ON cr.athlete_id = g.athlete_id
      WHERE g.id = goal_id
      AND cr.coach_id = auth.uid()
      AND cr.status = 'ACTIVE'
    )
  );

DROP POLICY IF EXISTS "Admins full access checkpoints" ON goal_checkpoints;
CREATE POLICY "Admins full access checkpoints" ON goal_checkpoints
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );
