import { createClient } from "@supabase/supabase-js";

// server-side only client. uses the service role key, so this file must never
// be imported into a client component.
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}
