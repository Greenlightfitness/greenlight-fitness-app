// Execute SQL directly in Supabase with Service Role Key
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lfpcyhrccefbeowsgojv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcGN5aHJjY2VmYmVvd3Nnb2p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5ODU1OSwiZXhwIjoyMDg1MTc0NTU5fQ.KwIv_GU4-U7J-jTKDDrfFS-lrWEQMKK5QoZX1uNjZ9c';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL() {
  console.log('🚀 Executing SQL to fix products table...\n');

  // SQL statements to execute
  const sqlStatements = [
    // Add missing columns
    `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT`,
    `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS type TEXT`,
    `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS long_description TEXT`,
    `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features TEXT[]`,
    `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR'`,
    `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS interval TEXT DEFAULT 'onetime'`,
    `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS thumbnail_url TEXT`,
    `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`,
  ];

  for (const sql of sqlStatements) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      // Try alternative approach - direct query
      console.log(`⚠️  RPC not available, trying direct approach...`);
      break;
    }
    console.log(`✅ ${sql.substring(0, 60)}...`);
  }

  // Alternative: Try to insert a test product to verify columns exist
  console.log('\n🔍 Testing product creation...');
  
  const testProduct = {
    coach_id: '2848f51d-50d6-429c-924b-9a39bfadbd32',
    title: 'Test Product',
    description: 'Test description',
    category: 'GENERAL',
    type: 'PLAN',
    price: 99,
    currency: 'EUR',
    interval: 'onetime',
    is_active: true
  };

  const { data, error } = await supabase
    .from('products')
    .insert(testProduct)
    .select();

  if (error) {
    console.log('❌ Error:', error.message);
    console.log('\n📋 Error details:', error);
    
    if (error.message.includes('column')) {
      console.log('\n⚠️  Missing columns detected. Please run this SQL in Supabase Dashboard:');
      console.log(`
-- Run in Supabase SQL Editor:
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS long_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS interval TEXT DEFAULT 'onetime';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
      `);
    }
  } else {
    console.log('✅ Test product created successfully!');
    console.log('📦 Product:', data);
    
    // Clean up test product
    if (data && data[0]) {
      await supabase.from('products').delete().eq('id', data[0].id);
      console.log('🧹 Test product cleaned up');
    }
    
    console.log('\n🎉 Products table is ready! You can now create products in the app.');
  }
}

executeSQL();
