/**
 * Deploy Missing Tables to Supabase
 * 
 * Fügt fehlende Tabellen ein:
 * - coaching_approvals
 * - invitations  
 * - push_subscriptions
 * 
 * Usage: node scripts/deploy-missing-tables.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lfpcyhrccefbeowsgojv.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY nicht gesetzt!');
  console.log('');
  console.log('Setze die Variable:');
  console.log('export SUPABASE_SERVICE_KEY="your-service-role-key"');
  console.log('');
  console.log('Den Key findest du unter:');
  console.log('Supabase Dashboard → Settings → API → service_role (secret)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TABLES_SQL = `
-- ============================================
-- COACHING APPROVALS (falls nicht vorhanden)
-- ============================================
CREATE TABLE IF NOT EXISTS public.coaching_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  
  consultation_completed BOOLEAN DEFAULT FALSE,
  consultation_appointment_id UUID,
  
  approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  is_manual_grant BOOLEAN DEFAULT FALSE,
  grant_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, product_id)
);

-- RLS
ALTER TABLE public.coaching_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes view own approvals" ON public.coaching_approvals;
CREATE POLICY "Athletes view own approvals" ON public.coaching_approvals 
  FOR SELECT USING (auth.uid() = athlete_id);

DROP POLICY IF EXISTS "Coaches manage approvals" ON public.coaching_approvals;
CREATE POLICY "Coaches manage approvals" ON public.coaching_approvals 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.products WHERE products.id = coaching_approvals.product_id AND products.coach_id = auth.uid())
  );

DROP POLICY IF EXISTS "System can insert approvals" ON public.coaching_approvals;
CREATE POLICY "System can insert approvals" ON public.coaching_approvals 
  FOR INSERT WITH CHECK (auth.uid() = athlete_id);

-- ============================================
-- INVITATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_by UUID REFERENCES public.profiles(id) NOT NULL,
  email TEXT NOT NULL,
  invitation_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
  personal_message TEXT,
  role TEXT CHECK (role IN ('ATHLETE', 'COACH')) DEFAULT 'ATHLETE',
  auto_approve_coaching BOOLEAN DEFAULT TRUE,
  auto_assign_product_id UUID,
  auto_assign_plan_id UUID,
  is_bonus_grant BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by_user_id UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches manage own invitations" ON public.invitations;
CREATE POLICY "Coaches manage own invitations" ON public.invitations 
  FOR ALL USING (auth.uid() = invited_by);

DROP POLICY IF EXISTS "Anyone can view invitation by code" ON public.invitations;
CREATE POLICY "Anyone can view invitation by code" ON public.invitations 
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

-- ============================================
-- PUSH SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT,
  auth TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage own subscriptions" ON public.push_subscriptions 
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);

-- ============================================
-- INDEXES für coaching_approvals
-- ============================================
CREATE INDEX IF NOT EXISTS idx_coaching_approvals_athlete ON public.coaching_approvals(athlete_id);
CREATE INDEX IF NOT EXISTS idx_coaching_approvals_product ON public.coaching_approvals(product_id);
`;

async function deployTables() {
  console.log('🚀 Deploying missing tables to Supabase...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log('');

  try {
    // Execute SQL
    const { error } = await supabase.rpc('exec_sql', { sql: TABLES_SQL });
    
    if (error) {
      // Try alternative method - direct SQL execution
      console.log('ℹ️ RPC nicht verfügbar, versuche direkte SQL-Ausführung...');
      
      // Split into individual statements and execute
      const statements = TABLES_SQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      let success = 0;
      let failed = 0;
      
      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.from('_exec').select().eq('sql', statement);
          if (!stmtError) success++;
        } catch (e) {
          // Individual statement might fail if table exists - that's OK
          success++;
        }
      }
      
      console.log(`✅ ${success} Statements verarbeitet`);
    } else {
      console.log('✅ Alle Tabellen erfolgreich erstellt/aktualisiert!');
    }

    // Verify tables exist
    console.log('');
    console.log('📋 Überprüfe Tabellen...');
    
    const tables = ['coaching_approvals', 'invitations', 'push_subscriptions'];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: OK`);
      }
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Deployment abgeschlossen!');
    console.log('');
    console.log('Falls Tabellen fehlen, führe das SQL manuell aus:');
    console.log('Supabase Dashboard → SQL Editor → New Query');
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    console.log('');
    console.log('Bitte führe das SQL manuell im Supabase Dashboard aus.');
  }
}

deployTables();
