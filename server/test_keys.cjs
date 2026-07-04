const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const sb = createClient(
  process.env.SUPABASE_CHAT_URL,
  process.env.SUPABASE_CHAT_KEY
);

async function test() {
  const { data, error } = await sb.from('chat_groups').select('*').limit(1);
  console.log(Object.keys(data[0]));
}

test();
