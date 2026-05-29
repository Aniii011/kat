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
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_EMAILS = ["admin@kat.com"];
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
  let isSeller = Boolean(u.user_metadata?.is_seller);
  let sellerVerified = Boolean(u.user_metadata?.seller_verified);
  let isAdmin = ADMIN_EMAILS.includes(u.email ?? "");

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
    }
  } catch {
    // profiles table may not exist yet — fall back to email check + metadata
  }

  return {
    id: u.id,
    email: u.email ?? "",
    name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "User",
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

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const katUser = await fetchKatUser(session.user);
        setUser(katUser);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const katUser = await fetchKatUser(session.user);
        setUser(katUser);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      if (!email || !password) return { error: "Email and password required" };
      const demo: KatUser = {
        id: "demo-" + email,
        email,
        name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        isSeller: email.toLowerCase().includes("seller"),
        sellerVerified: email.toLowerCase().includes("seller"),
        isAdmin: ADMIN_EMAILS.includes(email.toLowerCase()),
      };
      saveDemoUser(demo);
      setUser(demo);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    if (!isSupabaseConfigured) {
      if (!email || !password || !name) return { error: "All fields are required" };
      if (password.length < 6) return { error: "Password must be at least 6 characters" };
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

  const signOut = useCallback(() => {
    if (!isSupabaseConfigured) {
      saveDemoUser(null);
      setUser(null);
      return;
    }
    supabase.auth.signOut();
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
