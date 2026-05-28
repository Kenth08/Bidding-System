import { createClient } from "@supabase/supabase-js";

const isLocalMode = process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

function createLocalSupabaseClient() {
  const disabledError = new Error("Supabase is disabled in local mode.");

  return {
    auth: {
      signInWithOAuth: async () => ({ data: null, error: disabledError }),
      exchangeCodeForSession: async () => ({ data: null, error: disabledError }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  } as any;
}

export const supabase = isLocalMode || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createLocalSupabaseClient()
  : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
