const { createClient } = require('@supabase/supabase-js');

// Retry connection failures instead of failing the request
async function retryFetch(url, options, attempt = 1) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (attempt >= 5) throw err;
    await new Promise((r) => setTimeout(r, 1000 * attempt));
    return retryFetch(url, options, attempt + 1);
  }
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
}

// Service-role client: backend only, bypasses RLS. Never expose it to the frontend.
module.exports = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: retryFetch },
  }
);
