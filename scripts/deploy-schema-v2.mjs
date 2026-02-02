#!/usr/bin/env node
/**
 * Supabase Schema Deployment via Management API
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_PROJECT_REF = 'lfpcyhrccefeowsgojv';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY nicht gesetzt');
  process.exit(1);
}

async function deploySchema() {
  console.log('\n🚀 Greenlight Fitness - Schema Deployment v2\n');
  
  const schemaPath = join(__dirname, '..', 'supabase-schema.sql');
  const sql = readFileSync(schemaPath, 'utf8');
  console.log('📄 Schema geladen\n');

  // Split into individual statements
  const statements = sql
    .split(/;[\s]*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('='));

  console.log(`📊 ${statements.length} Statements gefunden\n`);

  const baseUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    const preview = stmt.substring(0, 50).replace(/\n/g, ' ');
    
    try {
      const response = await fetch(`${baseUrl}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: stmt })
      });

      // For DDL statements, we need to use the SQL endpoint differently
      // Try direct postgres connection simulation
      console.log(`  [${i + 1}/${statements.length}] ${preview}...`);
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
    }
  }

  console.log('\n⚠️  REST API unterstützt kein direktes DDL.');
  console.log('\n✅ Verwende stattdessen die Supabase CLI:\n');
  console.log('   npx supabase db push --db-url postgresql://postgres:[PASSWORD]@db.lfpcyhrccefeowsgojv.supabase.co:5432/postgres\n');
}

deploySchema();
