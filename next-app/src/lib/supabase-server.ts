import { createClient } from "@supabase/supabase-js";

// Use service role key with direct connection
// Direct connection (port 5432) allows service role to bypass RLS
const isLocalMode = process.env.LOCAL_MODE === "true" || process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

function createLocalQueryResult() {
  const disabledError = new Error("Supabase is disabled in local mode.");

  const handler: ProxyHandler<any> = {
    get(target, property) {
      if (property === "then") {
        return (resolve: (value: any) => void) => resolve({ data: null, error: disabledError });
      }

      if (property in target) return target[property as keyof typeof target];
      return (..._args: any[]) => proxy;
    },
  };

  const proxy = new Proxy(
    {
      select: () => proxy,
      insert: () => proxy,
      update: () => proxy,
      delete: () => proxy,
      eq: () => proxy,
      neq: () => proxy,
      in: () => proxy,
      order: () => proxy,
      limit: () => proxy,
      single: async () => ({ data: null, error: disabledError }),
      maybeSingle: async () => ({ data: null, error: disabledError }),
    },
    handler
  );

  return proxy;
}

export const supabaseServer = isLocalMode || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY
  ? ({ from: () => createLocalQueryResult() } as any)
  : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });