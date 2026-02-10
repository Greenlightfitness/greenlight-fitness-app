-- =============================================================================
-- Notification Log Table
-- Tracks all sent emails and push notifications to prevent duplicates
-- and enable analytics on engagement campaigns.
-- =============================================================================

CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL CHECK (user_role IN ('ATHLETE', 'COACH', 'ADMIN')),
  email TEXT,
  
  -- Notification details
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'in_app')),
  template_type TEXT NOT NULL,
  subject TEXT,
  
  -- Dedup key: prevents sending same notification type to same user in a window
  dedup_key TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'failed', 'skipped')),
  error_message TEXT,
  
  -- Resend / provider metadata
  provider_message_id TEXT,
  
  -- Context data (JSON) — e.g., which athlete triggered a churn alert
  context JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_template_type ON notification_log(template_type);
CREATE INDEX IF NOT EXISTS idx_notification_log_created_at ON notification_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_dedup ON notification_log(user_id, template_type, dedup_key);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);

-- RLS
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own notification history
CREATE POLICY "Users can view own notifications"
  ON notification_log FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for API/cron)
CREATE POLICY "Service role full access"
  ON notification_log FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- Notification Preferences Table
-- Users can opt out of specific notification types
-- =============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Global toggles
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Per-type opt-outs (athlete)
  training_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  checkin_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_progress BOOLEAN NOT NULL DEFAULT TRUE,
  inactivity_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Per-type opt-outs (coach)
  athlete_summary BOOLEAN NOT NULL DEFAULT TRUE,
  churn_risk_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Per-type opt-outs (admin)
  business_reports BOOLEAN NOT NULL DEFAULT TRUE,
  churn_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Timing preferences
  preferred_send_hour INTEGER DEFAULT 8 CHECK (preferred_send_hour >= 0 AND preferred_send_hour <= 23),
  timezone TEXT DEFAULT 'Europe/Berlin',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_prefs UNIQUE (user_id)
);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on preferences"
  ON notification_preferences FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-create preferences when a user is created (via trigger)
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to profiles table (runs when user profile is created)
DROP TRIGGER IF EXISTS trg_create_notification_prefs ON profiles;
CREATE TRIGGER trg_create_notification_prefs
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();
