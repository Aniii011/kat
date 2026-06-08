import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface KatUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isSeller: boolean;
  sellerVerified: boolean;
  isAdmin: boolean;
}

interface AuthContextType {
  user: KatUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_EMAILS = ["youremail@gmail.com"];
const DEMO_KEY = "kat_demo_user";

function loadDemoUser(): KatUser | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as KatUser) : null;
  } catch { return null; }
}

function saveDemoUser(u: KatUser | null) {
  if (u) localStorage.setItem(DEMO_KEY, JSON.stringify(u));
  else localStorage.removeItem(DEMO_KEY);
}

async function fetchKatUser(u: User): Promise<KatUser> {
  let isSeller = false;
  let sellerVerified = false;
  let isAdmin = ADMIN_EMAILS.includes(u.email ?? "");
  let name = u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "User";

  try {
    const { data } = await supabase
      .from("profiles")
      .select("is_admin, is_seller, seller_verified, full_name")
      .eq("id", u.id)
      .single();
    if (data) {
      isAdmin = Boolean(data.is_admin);
      isSeller = Boolean(data.is_seller);
      sellerVerified = Boolean(data.seller_verified);
      if (data.full_name) name = data.full_name;
    }
  } catch {
    // profiles table may not exist yet
  }

  return {
    id: u.id,
    email: u.email ?? "",
    name,
    isSeller,
    sellerVerified,
    isAdmin,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<KatUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setUser(loadDemoUser());
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const katUser = await fetchKatUser(session.user);
        if (mounted) setUser(katUser);
      } else {
        if (mounted) setUser(null);
      }
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          setUser(null);
          setLoading(false);
          return;
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session?.user) {
            const katUser = await fetchKatUser(session.user);
            if (mounted) {
              setUser(katUser);
              setLoading(false);
            }
          }
          return;
        }

        if (session?.user) {
          const katUser = await fetchKatUser(session.user);
          if (mounted) setUser(katUser);
        } else {
          if (mounted) setUser(null);
        }
        if (mounted) setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      if (!email || !password) return { error: "Email and password required" };
      const demo: KatUser = {
        id: "demo-" + email,
        email,
        name: email.split("@")[0],
        isSeller: false,
        sellerVerified: false,
        isAdmin: ADMIN_EMAILS.includes(email.toLowerCase()),
      };
      saveDemoUser(demo);
      setUser(demo);
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    if (!isSupabaseConfigured) {
      if (!email || !password || !name) return { error: "All fields are required" };
      const demo: KatUser = {
        id: "demo-" + email,
        email,
        name,
        isSeller: false,
        sellerVerified: false,
        isAdmin: ADMIN_EMAILS.includes(email.toLowerCase()),
      };
      saveDemoUser(demo);
      setUser(demo);
      return { error: null };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      saveDemoUser(null);
      setUser(null);
      return;
    }
    setUser(null);
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
