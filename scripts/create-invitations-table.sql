-- ============================================
-- INVITATIONS TABLE
-- Für Coach/Admin Einladungen an neue Athleten
-- ============================================

-- 1. INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Wer lädt ein?
  invited_by UUID REFERENCES public.profiles(id) NOT NULL,
  
  -- Einladungsdetails
  email TEXT NOT NULL,
  invitation_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
  personal_message TEXT,
  
  -- Rolle des eingeladenen Users
  role TEXT CHECK (role IN ('ATHLETE', 'COACH')) DEFAULT 'ATHLETE',
  
  -- Automatische Aktionen nach Annahme
  auto_approve_coaching BOOLEAN DEFAULT TRUE,
  auto_assign_product_id TEXT,
  auto_assign_plan_id UUID REFERENCES public.plans(id),
  
  -- Bonus-Grant (ohne Zahlung)
  is_bonus_grant BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')) DEFAULT 'PENDING',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by_user_id UUID REFERENCES public.profiles(id),
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 2. INDEX für schnelle Lookups
CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON public.invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- 3. RLS POLICIES
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Coaches/Admins können ihre eigenen Einladungen sehen
CREATE POLICY "Users can view own invitations" ON public.invitations
  FOR SELECT USING (
    auth.uid() = invited_by 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Coaches/Admins können Einladungen erstellen
CREATE POLICY "Coaches and Admins can create invitations" ON public.invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('COACH', 'ADMIN')
    )
  );

-- Ersteller können ihre Einladungen aktualisieren (z.B. revoken)
CREATE POLICY "Creators can update own invitations" ON public.invitations
  FOR UPDATE USING (auth.uid() = invited_by);

-- Jeder kann Einladungen per Code lesen (für Accept-Flow)
CREATE POLICY "Anyone can read invitation by code" ON public.invitations
  FOR SELECT USING (true);

-- 4. FUNCTION: Einladung annehmen
CREATE OR REPLACE FUNCTION accept_invitation(
  p_invitation_code TEXT,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_invitation RECORD;
  v_result JSONB;
BEGIN
  -- Einladung finden
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE invitation_code = p_invitation_code
    AND status = 'PENDING'
    AND (expires_at IS NULL OR expires_at > NOW());
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found or expired');
  END IF;
  
  -- Status aktualisieren
  UPDATE public.invitations
  SET status = 'ACCEPTED',
      accepted_at = NOW(),
      accepted_by_user_id = p_user_id
  WHERE id = v_invitation.id;
  
  -- Auto-Approve Coaching wenn aktiviert
  IF v_invitation.auto_approve_coaching THEN
    INSERT INTO public.coaching_relationships (
      athlete_id, 
      coach_id, 
      status, 
      started_at, 
      is_manual_grant, 
      grant_reason
    ) VALUES (
      p_user_id,
      v_invitation.invited_by,
      'ACTIVE',
      NOW(),
      TRUE,
      'Einladung akzeptiert'
    )
    ON CONFLICT (athlete_id, coach_id) DO NOTHING;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'invitation_id', v_invitation.id,
    'auto_coaching', v_invitation.auto_approve_coaching
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNCTION: Abgelaufene Einladungen markieren (für Cron Job)
CREATE OR REPLACE FUNCTION expire_old_invitations() RETURNS void AS $$
BEGIN
  UPDATE public.invitations
  SET status = 'EXPIRED'
  WHERE status = 'PENDING'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 6. VIEW für einfachen Zugriff mit Inviter-Details
CREATE OR REPLACE VIEW invitations_with_details AS
SELECT 
  i.*,
  p.nickname AS inviter_nickname,
  p.first_name AS inviter_first_name,
  p.email AS inviter_email
FROM public.invitations i
LEFT JOIN public.profiles p ON i.invited_by = p.id;

COMMENT ON TABLE public.invitations IS 'Einladungen von Coaches/Admins an neue Athleten';
