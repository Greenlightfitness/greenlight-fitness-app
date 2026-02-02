#!/usr/bin/env node
/**
 * Supabase Schema Deployment Script
 * Führt das SQL-Schema direkt in Supabase aus
 * 
 * Usage: 
 *   SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/deploy-schema.mjs
 * 
 * Oder mit .env Datei:
 *   node scripts/deploy-schema.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase Config
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lfpcyhrccefeowsgojv.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('\n❌ SUPABASE_SERVICE_ROLE_KEY ist nicht gesetzt!\n');
  console.log('Usage:');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/deploy-schema.mjs\n');
  console.log('Oder exportiere die Variable:');
  console.log('  export SUPABASE_SERVICE_ROLE_KEY=your_key');
  console.log('  node scripts/deploy-schema.mjs\n');
  process.exit(1);
}

// Supabase Client mit Service Role Key (Full Access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deploySchema() {
  console.log('\n🚀 Greenlight Fitness - Supabase Schema Deployment\n');
  console.log(`📡 Verbinde zu: ${SUPABASE_URL}`);
  
  // SQL-Schema lesen
  const schemaPath = join(__dirname, '..', 'supabase-schema.sql');
  let sql;
  
  try {
    sql = readFileSync(schemaPath, 'utf8');
    console.log(`📄 Schema geladen: ${schemaPath}`);
  } catch (err) {
    console.error(`❌ Konnte Schema nicht lesen: ${err.message}`);
    process.exit(1);
  }

  // SQL in einzelne Statements aufteilen (für bessere Fehlerbehandlung)
  // Wir führen das gesamte Schema als ein Statement aus
  console.log('\n⏳ Führe SQL-Schema aus...\n');
  
  try {
    // Verwende die Supabase SQL-Funktion über RPC
    // Wir müssen eine SQL-Funktion erstellen, die beliebiges SQL ausführt
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Wenn die Funktion nicht existiert, versuche direkten Zugriff
      if (error.message.includes('exec_sql')) {
        console.log('ℹ️  exec_sql Funktion nicht gefunden, verwende alternativen Ansatz...\n');
        await deployViaStatements(sql);
      } else {
        throw error;
      }
    } else {
      console.log('✅ Schema erfolgreich deployed!\n');
    }
  } catch (err) {
    console.error(`❌ Fehler beim Deployment: ${err.message}\n`);
    console.log('💡 Tipp: Führe das Schema manuell im Supabase SQL Editor aus:');
    console.log('   1. Öffne https://supabase.com/dashboard');
    console.log('   2. Gehe zu SQL Editor → New Query');
    console.log('   3. Füge den Inhalt von supabase-schema.sql ein');
    console.log('   4. Klicke auf "Run"\n');
    process.exit(1);
  }
}

async function deployViaStatements(sql) {
  // Teile SQL in einzelne Statements
  const statements = sql
    .split(/;[\s]*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`📊 ${statements.length} SQL-Statements gefunden\n`);
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ') + '...';
    
    try {
      // Versuche über die REST API mit raw SQL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ sql_query: stmt + ';' })
      });
      
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }
      
      console.log(`  ✓ [${i + 1}/${statements.length}] ${preview}`);
      success++;
    } catch (err) {
      console.log(`  ✗ [${i + 1}/${statements.length}] ${preview}`);
      console.log(`    → ${err.message.substring(0, 100)}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Ergebnis: ${success} erfolgreich, ${failed} fehlgeschlagen\n`);
  
  if (failed > 0) {
    console.log('💡 Einige Statements sind fehlgeschlagen. Das kann normal sein,');
    console.log('   wenn Tabellen bereits existieren oder RLS bereits aktiviert ist.\n');
  }
}

// Führe das Script aus
deploySchema().catch(console.error);
