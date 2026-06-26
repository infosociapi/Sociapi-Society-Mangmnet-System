import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || "https://peswoagwacbewbahpbgq.supabase.co",
  supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc3dvYWd3YWNiZXdiYWhwYmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NTEzODAsImV4cCI6MjA5ODAyNzM4MH0.YeJu8DNnHYA8HIjmi94lFjvbK9ErYPJiqSNfTbz4LAs",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const SUPABASE_STORAGE_BUCKET = "sociapi-uploads";