-- ============================================
-- PUSH SUBSCRIPTIONS TABLE
-- Speichert Web Push Subscriptions für Benachrichtigungen
-- ============================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Subscription Data
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT,
  auth TEXT,
  
  -- User Reference (optional - anonymous subscriptions allowed)
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Metadata
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users können ihre eigenen Subscriptions verwalten
CREATE POLICY "Users manage own subscriptions" ON public.push_subscriptions 
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Service kann alle Subscriptions lesen (für Broadcasts)
CREATE POLICY "Service can read all subscriptions" ON public.push_subscriptions 
  FOR SELECT USING (true);

COMMENT ON TABLE public.push_subscriptions IS 'Web Push Subscriptions für Browser-Benachrichtigungen';
