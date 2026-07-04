const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const sb = createClient(
  process.env.SUPABASE_CHAT_URL,
  process.env.SUPABASE_CHAT_KEY
);

async function test() {
  const { data, error } = await sb.from('chat_groups').select('id, name, avatar_url').eq('name', 'Mummy').limit(1);
  console.log(data);
}

test();
