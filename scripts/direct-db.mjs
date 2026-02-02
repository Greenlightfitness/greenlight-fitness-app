// Direct PostgreSQL connection
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'db.lfpcyhrccefbeowsgojv.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'GreenlightFitnessSupaBase1!',
  ssl: { rejectUnauthorized: false }
});

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
ALTER TABLE public.products ALTER COLUMN plan_id DROP NOT NULL;
`;

async function run() {
  console.log('🔌 Connecting to PostgreSQL...');
  
  try {
    await client.connect();
    console.log('✅ Connected!\n');
    
    console.log('🚀 Executing SQL...\n');
    const result = await client.query(sql);
    console.log('✅ SQL executed successfully!');
    console.log(result);
    
    // Verify columns
    const check = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    console.log('\n📋 Products table columns:');
    check.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
