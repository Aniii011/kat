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

const ADMIN_EMAILS = ["tiamiyukabirat0@gmail.com"];
const SELLER_EMAILS = ["katonly001@gmail.com"];

const mapUser = (u: any): KatUser | null => {
  if (!u) return null;

  const email = u.email ?? "";

  return {
    id: u.id,
    email,
    name:
      u.user_metadata?.name ??
      u.user_metadata?.full_name ??
      email.split("@")[0] ??
      "User",
    isSeller: SELLER_EMAILS.includes(email),
    sellerVerified: SELLER_EMAILS.includes(email),
    isAdmin: ADMIN_EMAILS.includes(email),
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<KatUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on refresh
    supabase.auth.getSession().then(({ data }) => {
      setUser(mapUser(data.session?.user ?? null));
      setLoading(false);
    });

    // Listen for login/logout changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(mapUser(session?.user ?? null));
        setLoading(false);
      }
    );

    return () => listener.subscription.unsubscribe();
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
        // ✅ FIXED: must use callback route
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
