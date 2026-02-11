-- ============================================
-- GREENLIGHT FITNESS — DSGVO COMPLIANCE EXTENSION
-- Legal Versioning, Purchase Ledger, Anonymization
-- ============================================
-- Run in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. LEGAL DOCUMENT VERSIONS
-- Tracks every version of every legal document
-- for audit trail and consent association.
-- ============================================
CREATE TABLE IF NOT EXISTS public.legal_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK (document_type IN ('PRIVACY', 'TERMS', 'TRANSPARENCY', 'IMPRINT')),
  version TEXT NOT NULL,                     -- e.g. '2.0'
  title TEXT NOT NULL,                       -- e.g. 'Datenschutzerklärung'
  summary_of_changes TEXT,                   -- What changed from previous version
  effective_date DATE NOT NULL,              -- When this version becomes active
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content_hash TEXT,                         -- SHA-256 hash of rendered content for integrity
  is_current BOOLEAN DEFAULT FALSE,          -- Only one per document_type should be true
  
  UNIQUE(document_type, version)
);

-- Seed initial versions (matching current Legal.tsx)
INSERT INTO public.legal_versions (document_type, version, title, summary_of_changes, effective_date, is_current)
VALUES
  ('PRIVACY', '2.0', 'Datenschutzerklärung', 'Vollständige Neufassung: 17 Abschnitte, Art. 9 Gesundheitsdaten, Auftragsverarbeiter, EU AI Act Referenz', '2026-02-01', true),
  ('TERMS', '2.0', 'Allgemeine Geschäftsbedingungen', 'Vollständige Neufassung: 21 Paragraphen, Widerrufsbelehrung, Stripe-Bedingungen, Coach/Admin-spezifisch', '2026-02-01', true),
  ('TRANSPARENCY', '1.0', 'Transparenzerklärung', 'Erstfassung: EU AI Act Compliance, KI-Systeme, automatisierte Verarbeitung', '2026-02-01', true),
  ('IMPRINT', '2.0', 'Impressum', 'Aktualisierung: DDG-konform, MStV, vollständige Angaben', '2026-02-01', true)
ON CONFLICT (document_type, version) DO NOTHING;

-- ============================================
-- 2. CONSENT LOG — Upgrade to reference legal versions
-- Add version tracking to existing consent_logs
-- ============================================
DO $$
BEGIN
  -- Add legal_version_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consent_logs' AND column_name = 'legal_version_id'
  ) THEN
    ALTER TABLE public.consent_logs ADD COLUMN legal_version_id UUID REFERENCES public.legal_versions(id);
  END IF;

  -- Add document_hash column for integrity verification
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consent_logs' AND column_name = 'document_hash'
  ) THEN
    ALTER TABLE public.consent_logs ADD COLUMN document_hash TEXT;
  END IF;
END $$;

-- ============================================
-- 3. PURCHASE LEDGER (Redundant to Stripe)
-- Immutable, append-only log of all financial
-- transactions. Never deleted, only anonymized.
-- ============================================
CREATE TABLE IF NOT EXISTS public.purchase_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference (SET NULL on delete, preserved via anonymized_*)
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  anonymized_user_hash TEXT,                 -- SHA-256 of original user_id (for post-deletion reference)
  
  -- Transaction details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'CHECKOUT_COMPLETED', 'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPDATED',
    'SUBSCRIPTION_CANCELED', 'INVOICE_PAID', 'INVOICE_FAILED',
    'REFUND_ISSUED', 'PRICE_CHANGE'
  )),
  
  -- Stripe references
  stripe_event_id TEXT,                      -- Stripe event ID for cross-reference
  stripe_session_id TEXT,
  stripe_subscription_id TEXT,
  stripe_invoice_id TEXT,
  stripe_customer_id TEXT,
  
  -- Financial data (§147 AO — 10 year retention)
  amount NUMERIC(10,2),
  currency TEXT DEFAULT 'eur',
  tax_amount NUMERIC(10,2),
  
  -- Product reference
  product_id UUID,
  product_name TEXT,                         -- Denormalized — survives product deletion
  product_type TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',               -- Additional context
  ip_address TEXT,
  
  -- Timestamps
  event_at TIMESTAMPTZ DEFAULT NOW(),        -- When the event occurred
  created_at TIMESTAMPTZ DEFAULT NOW(),      -- When this record was created
  
  -- Integrity
  record_hash TEXT                           -- SHA-256 of record for tamper detection
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_purchase_ledger_user ON public.purchase_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_ledger_stripe_event ON public.purchase_ledger(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_purchase_ledger_event_type ON public.purchase_ledger(event_type);
CREATE INDEX IF NOT EXISTS idx_purchase_ledger_event_at ON public.purchase_ledger(event_at);

-- ============================================
-- 4. ARCHIVED USERS (DSGVO Art. 17 — Anonymization)
-- When a user requests deletion, we anonymize
-- and archive instead of hard-deleting.
-- Financial records are preserved per §147 AO.
-- ============================================
CREATE TABLE IF NOT EXISTS public.archived_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Original references (anonymized)
  original_user_id TEXT NOT NULL,            -- The original UUID as text (user is deleted from auth)
  user_hash TEXT NOT NULL,                   -- SHA-256 of original user_id
  
  -- Preserved metadata (anonymized)
  role TEXT,                                 -- ATHLETE/COACH/ADMIN
  registration_date TIMESTAMPTZ,
  deletion_date TIMESTAMPTZ DEFAULT NOW(),
  deletion_reason TEXT,
  
  -- Preserved aggregates (no PII)
  total_workouts INTEGER DEFAULT 0,
  total_check_ins INTEGER DEFAULT 0,
  total_purchases NUMERIC(10,2) DEFAULT 0,
  subscription_months INTEGER DEFAULT 0,
  
  -- Compliance
  deletion_request_id UUID,                  -- Reference to original deletion request
  processed_by UUID,                         -- Admin who processed
  anonymization_log JSONB,                   -- What was anonymized/deleted
  
  -- Retention
  financial_retention_until DATE,            -- §147 AO: 10 years after last transaction
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. ANONYMIZATION FUNCTION
-- Called when processing a deletion request.
-- Anonymizes PII, archives aggregates, preserves
-- financial records per §147 AO / §257 HGB.
-- ============================================
CREATE OR REPLACE FUNCTION public.anonymize_user(
  p_user_id UUID,
  p_deletion_request_id UUID DEFAULT NULL,
  p_processed_by UUID DEFAULT NULL,
  p_reason TEXT DEFAULT 'User requested deletion'
)
RETURNS JSONB AS $$
DECLARE
  v_user_hash TEXT;
  v_profile RECORD;
  v_total_workouts INTEGER;
  v_total_checkins INTEGER;
  v_total_purchases NUMERIC;
  v_sub_months INTEGER;
  v_last_transaction TIMESTAMPTZ;
  v_log JSONB := '{}';
BEGIN
  -- Generate consistent hash for cross-referencing
  v_user_hash := encode(digest(p_user_id::text, 'sha256'), 'hex');
  
  -- Get profile data before anonymization
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;
  
  -- Count aggregates
  SELECT COUNT(*) INTO v_total_workouts FROM public.activities WHERE athlete_id = p_user_id;
  SELECT COUNT(*) INTO v_total_checkins FROM public.attentions WHERE athlete_id = p_user_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_total_purchases FROM public.purchases WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_sub_months FROM public.subscriptions WHERE user_id = p_user_id;
  
  -- Find last transaction date for retention calculation
  SELECT MAX(created_at) INTO v_last_transaction FROM public.purchase_ledger WHERE user_id = p_user_id;
  
  -- 1. Archive the user
  INSERT INTO public.archived_users (
    original_user_id, user_hash, role, registration_date,
    deletion_reason, total_workouts, total_check_ins,
    total_purchases, subscription_months,
    deletion_request_id, processed_by,
    financial_retention_until
  ) VALUES (
    p_user_id::text, v_user_hash, v_profile.role, v_profile.created_at,
    p_reason, v_total_workouts, v_total_checkins,
    v_total_purchases, v_sub_months,
    p_deletion_request_id, p_processed_by,
    CASE WHEN v_last_transaction IS NOT NULL
      THEN (v_last_transaction + INTERVAL '10 years')::date
      ELSE NULL
    END
  );
  v_log := v_log || jsonb_build_object('archived_user', true);
  
  -- 2. Anonymize purchase_ledger (preserve financial data, remove PII)
  UPDATE public.purchase_ledger
  SET user_id = NULL,
      anonymized_user_hash = v_user_hash,
      ip_address = NULL
  WHERE user_id = p_user_id;
  v_log := v_log || jsonb_build_object('purchase_ledger_anonymized', true);
  
  -- 3. Anonymize purchases table
  UPDATE public.purchases
  SET user_id = NULL
  WHERE user_id = p_user_id;
  v_log := v_log || jsonb_build_object('purchases_anonymized', true);
  
  -- 4. Anonymize invoices
  UPDATE public.invoices
  SET stripe_customer_id = 'ANONYMIZED_' || v_user_hash
  WHERE stripe_customer_id IN (
    SELECT stripe_customer_id FROM public.purchases WHERE user_id = p_user_id
    UNION
    SELECT stripe_customer_id FROM public.subscriptions WHERE user_id = p_user_id
  );
  v_log := v_log || jsonb_build_object('invoices_anonymized', true);
  
  -- 5. Anonymize audit_logs (preserve actions, remove PII)
  UPDATE public.audit_logs
  SET user_agent = NULL,
      ip_address = NULL,
      old_data = CASE WHEN old_data IS NOT NULL THEN '{"anonymized": true}'::jsonb ELSE NULL END,
      new_data = CASE WHEN new_data IS NOT NULL THEN '{"anonymized": true}'::jsonb ELSE NULL END
  WHERE user_id = p_user_id;
  v_log := v_log || jsonb_build_object('audit_logs_anonymized', true);
  
  -- 6. Delete personal content (non-financial)
  DELETE FROM public.activities WHERE athlete_id = p_user_id;
  v_log := v_log || jsonb_build_object('activities_deleted', true);
  
  DELETE FROM public.attentions WHERE athlete_id = p_user_id;
  v_log := v_log || jsonb_build_object('attentions_deleted', true);
  
  -- 7. Delete chat messages
  DELETE FROM public.chat_messages WHERE sender_id = p_user_id;
  v_log := v_log || jsonb_build_object('chat_messages_deleted', true);
  
  -- 8. Unassign coaching relationships
  DELETE FROM public.coaching_relationships WHERE athlete_id = p_user_id OR coach_id = p_user_id;
  v_log := v_log || jsonb_build_object('coaching_relationships_deleted', true);
  
  -- 9. Delete notification preferences
  DELETE FROM public.notification_preferences WHERE user_id = p_user_id;
  v_log := v_log || jsonb_build_object('notification_preferences_deleted', true);
  
  -- 10. Anonymize the profile (keep for FK references)
  UPDATE public.profiles
  SET email = 'deleted_' || v_user_hash || '@anonymized.local',
      display_name = 'Gelöschter Nutzer',
      first_name = NULL,
      last_name = NULL,
      nickname = NULL,
      gender = NULL,
      birth_date = NULL,
      height = NULL,
      weight = NULL,
      waist_circumference = NULL,
      body_fat = NULL,
      resting_heart_rate = NULL,
      max_heart_rate = NULL
  WHERE id = p_user_id;
  v_log := v_log || jsonb_build_object('profile_anonymized', true);
  
  -- 11. Update deletion request status
  IF p_deletion_request_id IS NOT NULL THEN
    UPDATE public.data_deletion_requests
    SET status = 'COMPLETED',
        processed_at = NOW(),
        processed_by = p_processed_by
    WHERE id = p_deletion_request_id;
  END IF;
  
  -- 12. Final audit log entry
  INSERT INTO public.audit_logs (user_id, action, table_name, new_data)
  VALUES (p_user_id, 'USER_ANONYMIZED', 'profiles', v_log);
  
  -- Update archived_users with the anonymization log
  UPDATE public.archived_users
  SET anonymization_log = v_log
  WHERE original_user_id = p_user_id::text;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_hash', v_user_hash,
    'log', v_log
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

ALTER TABLE public.legal_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_users ENABLE ROW LEVEL SECURITY;

-- Legal versions: Public read (everyone needs to see current versions)
CREATE POLICY "Legal versions are publicly readable"
  ON public.legal_versions FOR SELECT USING (true);

-- Legal versions: Only admins can insert/update
CREATE POLICY "Admins can manage legal versions"
  ON public.legal_versions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Purchase ledger: Users can see own, admins can see all
CREATE POLICY "Users can view own purchase ledger"
  ON public.purchase_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all purchase ledger"
  ON public.purchase_ledger FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );
CREATE POLICY "System can insert purchase ledger"
  ON public.purchase_ledger FOR INSERT WITH CHECK (true);

-- Archived users: Only admins
CREATE POLICY "Admins can view archived users"
  ON public.archived_users FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );
CREATE POLICY "System can insert archived users"
  ON public.archived_users FOR INSERT WITH CHECK (true);

-- ============================================
-- 7. HELPER: Get current legal version
-- ============================================
CREATE OR REPLACE FUNCTION public.get_current_legal_version(p_document_type TEXT)
RETURNS TABLE(version TEXT, effective_date DATE, id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT lv.version, lv.effective_date, lv.id
  FROM public.legal_versions lv
  WHERE lv.document_type = p_document_type AND lv.is_current = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;
