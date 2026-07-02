const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/var/www/classgrid_platform/server/.env' });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await sb.from('chat_groups').select('*').limit(1);
  console.log(Object.keys(data[0] || {}));
})();
