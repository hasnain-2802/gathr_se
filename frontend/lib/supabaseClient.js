/*create the Supabase client once in supabaseClient.js, then import and reuse it wherever your application needs to communicate with Supabase*/
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
); 