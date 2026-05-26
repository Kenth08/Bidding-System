import { createClient } from "@supabase/supabase-js";

// Use service role key with direct connection
// Direct connection (port 5432) allows service role to bypass RLS
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);