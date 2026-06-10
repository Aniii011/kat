import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface KatUser {
  id: string;
  email: string;
  name: string;
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
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: "Not initialized" }),
  signUp: async () => ({ error: "Not initialized" }),
  signOut: async () => {},
  signInWithGoogle: async () => {},
});

const ADMIN_EMAILS = ["tiamiyukabirat0@gmail.com"];

async function mapUser(u: any): Promise<KatUser | null> {
  if (!u) return null;

  let isSeller = false;
  let sellerVerified = false;
  let isAdmin = ADMIN_EMAILS.includes(u.email ?? "");
  let name = u.user_metadata?.name ?? u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "User";

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<KatUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const mapped = await mapUser(data.session?.user ?? null);
      setUser(mapped);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const mapped = await mapUser(session?.user ?? null);
      setUser(mapped);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch {
      return { error: "Failed to sign in. Please try again." };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, full_name: name } },
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes("already registered") ||
          msg.includes("already exists") ||
          msg.includes("user already")
        ) {
          return { error: "An account with this email already exists. Please sign in instead." };
        }
        return { error: error.message };
      }
      return { error: null };
    } catch {
      return { error: "Failed to sign up. Please try again." };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem("kat-auth-token");
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
    } catch {
      console.error("Google sign in failed");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export type { KatUser };
