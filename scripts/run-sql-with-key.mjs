// Execute SQL via Supabase Management API with Secret Key
const PROJECT_REF = 'lfpcyhrccefbeowsgojv';
const SECRET_KEY = 'sb_secret_n2Vg5AweXL810v2gfN9DBg_FyFFVMr3';

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

-- Also fix plan_id to be nullable
ALTER TABLE public.products ALTER COLUMN plan_id DROP NOT NULL;
`;

async function executeSQL() {
  console.log('🚀 Executing SQL via Supabase Management API...\n');

  // Try Management API
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SECRET_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const text = await response.text();
    console.log('❌ Management API response:', response.status, text);
    
    // Try alternative endpoint
    console.log('\n🔄 Trying alternative endpoint...');
    
    const altResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SECRET_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!altResponse.ok) {
      const altText = await altResponse.text();
      console.log('❌ Alternative endpoint:', altResponse.status, altText);
    } else {
      const data = await altResponse.json();
      console.log('✅ SQL executed successfully!', data);
    }
  } else {
    const data = await response.json();
    console.log('✅ SQL executed successfully!');
    console.log(data);
  }
}

executeSQL();
