const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  'https://bumxgscngzjadyozdpce.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bXhnc2NuZ3pqYWR5b3pkcGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNzQ4MzUsImV4cCI6MjA4Njk1MDgzNX0.jpnG_wEjzLDz5mMOgCCQsnuWe9uwzZq58LrKotRuXu8'
);

async function test() {
  console.log('Inserting group...');
  const res = await sb.from('chat_groups').insert([{
    name: 'Test Group',
    created_by: '66a1a794b15da07c2957b42a',
    message_ttl: 777600
  }]).select().single();
  console.log('Res:', res);
}
test();
