const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  'https://bumxgscngzjadyozdpce.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bXhnc2NuZ3pqYWR5b3pkcGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNzQ4MzUsImV4cCI6MjA4Njk1MDgzNX0.jpnG_wEjzLDz5mMOgCCQsnuWe9uwzZq58LrKotRuXu8'
);

async function test() {
  const { data } = await sb.from('chat_messages').select('id, thread_id').limit(1);
  if (!data || data.length === 0) return;
  const msg = data[0];
  console.log('Testing delete on', msg.id);

  const res = await sb.from('chat_messages').update({ is_deleted: true, message: 'This message was deleted' }).eq('id', msg.id);
  console.log('Update res:', res);
}
test();
