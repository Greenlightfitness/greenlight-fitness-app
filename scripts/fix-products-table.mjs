// Fix products table - add missing columns
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lfpcyhrccefbeowsgojv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcGN5aHJjY2VmYmVvd3Nnb2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTg1NTksImV4cCI6MjA4NTE3NDU1OX0.099PgzM5nxL0dot6dCX1VsUepqaJ7Y_pPgv0GvH9DBc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProductsTable() {
  console.log('🔍 Checking products table structure...');
  
  // Try to select from products to see what columns exist
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Error accessing products table:', error.message);
    return;
  }

  console.log('✅ Products table exists');
  
  if (data && data.length > 0) {
    console.log('📋 Existing columns:', Object.keys(data[0]));
  } else {
    console.log('📋 Table is empty, trying to insert a test product...');
    
    // Try inserting with minimal fields first
    const { data: testData, error: testError } = await supabase
      .from('products')
      .insert({
        coach_id: '2848f51d-50d6-429c-924b-9a39bfadbd32', // Admin user
        title: 'Test Product',
        price: 99
      })
      .select();

    if (testError) {
      console.log('❌ Insert failed:', testError.message);
      console.log('');
      console.log('📝 The products table needs these columns added in Supabase SQL Editor:');
      console.log('');
      console.log(`
-- Run this in Supabase Dashboard > SQL Editor:

-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS long_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS interval TEXT DEFAULT 'onetime';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add constraints
ALTER TABLE public.products ADD CONSTRAINT products_category_check 
  CHECK (category IN ('POLICE', 'FIRE', 'MILITARY', 'GENERAL', 'RECOVERY'));
ALTER TABLE public.products ADD CONSTRAINT products_type_check 
  CHECK (type IN ('PLAN', 'COACHING_1ON1', 'ADDON'));
ALTER TABLE public.products ADD CONSTRAINT products_interval_check 
  CHECK (interval IN ('onetime', 'month', 'year'));
      `);
    } else {
      console.log('✅ Test product created:', testData);
      
      // Clean up test product
      if (testData && testData[0]) {
        await supabase.from('products').delete().eq('id', testData[0].id);
        console.log('🧹 Test product cleaned up');
      }
    }
  }
}

checkProductsTable();
