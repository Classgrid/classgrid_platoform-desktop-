const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const sb = createClient(
  process.env.SUPABASE_CHAT_URL,
  process.env.SUPABASE_CHAT_KEY
);

async function test() {
  const { data: groups } = await sb.from('chat_groups').select('id, name').ilike('name', '%Mummy%');
  console.log("Groups:", groups);
  
  if (groups.length > 0) {
    const { data: threads } = await sb.from('chat_threads').select('*').in('group_id', groups.map(g => g.id));
    console.log("Threads:", threads);
  }
}

test();
