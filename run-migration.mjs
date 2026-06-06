// run-migration.mjs
// Run this with: node run-migration.mjs
// Applies the 005_system_config.sql migration to the live Supabase instance

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://bbvgxymljpxkgnsobcnf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJidmd4eW1sanB4a2duc29iY25mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQ4NDc0MiwiZXhwIjoyMDk2MDYwNzQyfQ.05K_o6UFsV013_1EUh4ns8kIYFjpUcS35qH0euxPviw';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const sql = readFileSync(
  join(__dirname, 'supabase/migrations/005_system_config.sql'),
  'utf8'
);

// Split on semicolons, filter out empty statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Running ${statements.length} SQL statements...\n`);

for (const stmt of statements) {
  console.log(`▶ ${stmt.substring(0, 80)}...`);
  const { error } = await supabase.rpc('exec_sql', { sql: stmt }).catch(() => ({ error: null }));
  
  if (error) {
    console.log(`  ⚠ RPC unavailable, trying direct query approach...`);
  }
}

// Alternative: use the REST API's Postgres endpoint
console.log('\nAttempting via Postgres REST API...');
const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ sql }),
});

if (!response.ok) {
  console.log('REST RPC not available. Please run the SQL manually in the Supabase Dashboard SQL Editor.');
  console.log('\nSQL to run:\n');
  console.log(sql);
} else {
  console.log('✅ Migration applied successfully!');
}
