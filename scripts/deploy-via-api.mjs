#!/usr/bin/env node
/**
 * Deploy schema via Supabase Management API
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_REF = 'lfpcyhrccefeowsgojv';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function deploy() {
  console.log('\n🚀 Supabase Schema Deployment\n');

  const schemaPath = join(__dirname, '..', 'supabase-schema.sql');
  const sql = readFileSync(schemaPath, 'utf8');
  
  // Use the Supabase SQL API endpoint
  const url = `https://${PROJECT_REF}.supabase.co/pg`;
  
  console.log('📡 Verbinde zu Supabase...');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const text = await response.text();
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${text}`);
    } else {
      const data = await response.json();
      console.log('✅ Schema deployed!');
      console.log(data);
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  }
}

deploy();
