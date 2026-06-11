// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// Read environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

// Only create the client if both URL and anon key exist
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          // Persist sessions in localStorage so refresh doesn't log out
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          // Safe storage check for SSR (Vite / Next.js compatibility)
          storage: typeof window !== "undefined" ? window.localStorage : undefined,
          // Custom storage key (optional, but must match your app)
          storageKey: "kat-auth-token",
        },
      })
    : createClient("https://placeholder.supabase.co", "placeholder-key");

// Boolean flag to check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
