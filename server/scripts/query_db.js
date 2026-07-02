import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_CHAT_URL;
const supabaseKey = process.env.SUPABASE_CHAT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_CHAT_URL or SUPABASE_CHAT_KEY in server/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data: groups, error: gErr } = await supabase.from('chat_groups').select('*').limit(1);
  console.log("chat_groups columns:", groups ? Object.keys(groups[0] || {}) : gErr?.message);

  const { data: msgs, error: mErr } = await supabase.from('chat_messages').select('*').limit(1);
  console.log("chat_messages columns:", msgs ? Object.keys(msgs[0] || {}) : mErr?.message);

  const { data: jr, error: jrErr } = await supabase.from('chat_group_join_requests').select('*').limit(1);
  console.log("chat_group_join_requests table exists?", jr ? true : jrErr?.message);
}

checkSchema();
