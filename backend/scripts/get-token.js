require('dns').setDefaultResultOrder('ipv4first');
require('net').setDefaultAutoSelectFamily(false);
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const [email, password = 'Password123!'] = process.argv.slice(2);
if (!email) {
  console.error('Usage: node scripts/get-token.js <email> [password]');
  process.exit(1);
}

const anonKey = process.env.SUPABASE_ANON_KEY;
if (!anonKey) {
  console.error('Missing SUPABASE_ANON_KEY in backend/.env');
  process.exit(1);
}

const client = createClient(process.env.SUPABASE_URL, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

client.auth.signInWithPassword({ email, password }).then(({ data, error }) => {
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log(data.session.access_token);
});
