require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('chat_messages').select('*').ilike('message', '%vsdvdvfvbfb%').then(console.log);
