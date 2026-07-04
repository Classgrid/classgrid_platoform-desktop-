require('dotenv').config({path: '.env'});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_CHAT_URL, process.env.SUPABASE_CHAT_KEY);

async function check() {
  const msg = await sb.from('chat_messages').select('*').limit(1);
  console.log("chat_messages columns:", msg.data ? Object.keys(msg.data[0]) : msg.error);
  
  const threadMember = await sb.from('chat_thread_members').select('*').limit(1);
  console.log("chat_thread_members columns:", threadMember.data ? Object.keys(threadMember.data[0]) : threadMember.error);
}
check();
