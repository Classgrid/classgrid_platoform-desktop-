import { primarySupabaseClient } from './src/config/supabaseClient.js';

async function test() {
  const { data, error } = await primarySupabaseClient.rpc('exec_sql', { sql: 'ALTER TABLE chat_groups ADD COLUMN banner_url text;' });
  console.log("Result:", data, error);
}

test();
