const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://bumxgscngzjadyozdpce.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bXhnc2NuZ3pqYWR5b3pkcGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNzQ4MzUsImV4cCI6MjA4Njk1MDgzNX0.jpnG_wEjzLDz5mMOgCCQsnuWe9uwzZq58LrKotRuXu8"
);

async function check() {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, message, created_at, sender_name, status')
    .like('message', '%[object Object]%')
    .limit(50);
  
  if (error) console.error("Error:", error);
  else console.log(JSON.stringify(data, null, 2));
}
check();
