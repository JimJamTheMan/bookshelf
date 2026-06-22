import { createBrowserClient } from "@supabase/ssr";

// Supabase client for use in the browser (Client Components).
// Uses only the PUBLIC anon key — safe to ship to the browser. RLS protects the data.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
