// Execute SQL via Supabase Management API
const PROJECT_REF = 'lfpcyhrccefbeowsgojv';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcGN5aHJjY2VmYmVvd3Nnb2p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5ODU1OSwiZXhwIjoyMDg1MTc0NTU5fQ.KwIv_GU4-U7J-jTKDDrfFS-lrWEQMKK5QoZX1uNjZ9c';

const sql = `
-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS long_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS interval TEXT DEFAULT 'onetime';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
`;

async function executeSQLViaREST() {
  console.log('🚀 Executing SQL via Supabase REST...\n');
  
  // Try using the sql endpoint (requires pg_graphql or similar)
  const response = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const text = await response.text();
    console.log('❌ RPC method failed:', text);
    console.log('\n📝 Alternative: Creating a database function...');
    
    // Create an RPC function that we can call
    await createExecFunction();
  } else {
    const data = await response.json();
    console.log('✅ SQL executed:', data);
  }
}

async function createExecFunction() {
  // Let's try a different approach - use the Supabase client to work with existing tables
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    `https://${PROJECT_REF}.supabase.co`,
    SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('\n🔍 Checking current products table structure...');
  
  // Get current table info
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .limit(0);

  if (error) {
    console.log('❌ Cannot access products table:', error.message);
  }

  // Since we can't alter tables via REST API, let me check what columns exist
  // by trying to insert with different column sets
  
  console.log('\n🧪 Testing which columns exist...');
  
  const testColumns = async (columns) => {
    const { error } = await supabase.from('products').insert(columns).select();
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true };
  };

  // Test minimal insert
  const minimalTest = await testColumns({
    coach_id: '2848f51d-50d6-429c-924b-9a39bfadbd32',
    title: 'Test',
    price: 1
  });

  if (minimalTest.success) {
    console.log('✅ Basic columns exist (coach_id, title, price)');
    // Clean up
    await supabase.from('products').delete().eq('title', 'Test');
  } else {
    console.log('❌ Basic insert failed:', minimalTest.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 MANUAL STEP REQUIRED');
  console.log('='.repeat(60));
  console.log('\nThe Supabase REST API cannot execute ALTER TABLE statements.');
  console.log('Please run this SQL in Supabase Dashboard > SQL Editor:\n');
  console.log(sql);
  console.log('\n🔗 Direct link: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new');
}

executeSQLViaREST();
