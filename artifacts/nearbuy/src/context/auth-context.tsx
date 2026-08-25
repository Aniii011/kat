import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
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
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error: string | null }>;
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

// Role/permission flags now come from `profiles`, never from a
// client-side email list. This is the single source of truth
// already used by Admin.tsx's approve/reject flows.
const buildUser = async (u: any): Promise<KatUser | null> => {
  if (!u) return null;

  console.log("DEBUG raw auth user:", u.id, u.email, u.user_metadata);

  const email = u.email ?? "";
  const fallbackName =
    u.user_metadata?.name ?? u.user_metadata?.full_name ?? email.split("@")[0] ?? "User";

    const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, is_admin, is_seller, seller_verified")
    .eq("id", u.id)
    .single();

  console.log("DEBUG profile query for id:", u.id, "→", profile, error);

  if (error) {
    console.error("auth-context: failed to load profile for role check:", error.message);
  }
  return {
    id: u.id,
    email,
    name: profile?.full_name || fallbackName,
    isSeller: Boolean(profile?.is_seller),
    sellerVerified: Boolean(profile?.seller_verified),
    isAdmin: Boolean(profile?.is_admin),
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<KatUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Restore session on refresh
    supabase.auth.getSession().then(async ({ data }) => {
      const mapped = await buildUser(data.session?.user ?? null);
      if (active) {
        setUser(mapped);
        setLoading(false);
      }
    });

    // Listen for login/logout changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // Token refreshes don't change role/profile data — skip refetching
      // the profile so a routine refresh doesn't create a new `user`
      // object identity and cascade re-fetches in components that key
      // useEffect on [user] (e.g. Seller.tsx's fetchAll).
      if (event === "TOKEN_REFRESHED") return;

      // Deferred rather than awaited directly in this callback — making
      // the onAuthStateChange callback itself async is a known Supabase
      // gotcha that can deadlock the auth client.
      setTimeout(() => {
        buildUser(session?.user ?? null).then((mapped) => {
          if (active) {
            setUser(mapped);
            setLoading(false);
          }
        });
      }, 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message };
      return { error: null };
    } catch {
      return { error: "Failed to sign in. Please try again." };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, full_name: name },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();

        if (
          msg.includes("already registered") ||
          msg.includes("already exists")
        ) {
          return {
            error: "An account with this email already exists. Please sign in instead.",
          };
        }

        return { error: error.message };
      }

      return { error: null };
    } catch {
      return { error: "Failed to sign up. Please try again." };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export type { KatUser };
