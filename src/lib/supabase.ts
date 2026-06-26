import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseConfigMessage = isSupabaseConfigured
  ? "Supabase is configured"
  : "Missing Vite env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Add them to .env locally or Vercel Environment Variables, then rebuild.";

export const supabase = createClient(
  supabaseUrl || "https://example.supabase.co",
  supabaseAnonKey || "missing-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

export const SUPABASE_STORAGE_BUCKET = "sociapi-uploads";