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

// Role/permission flags now come from `profiles`, never from a
// client-side email list. This is the single source of truth
// used everywhere else in the app (Admin.tsx approve/reject flows).
const buildUser = async (u: any): Promise<KatUser | null> => {
  if (!u) return null;

  const email = u.email ?? "";
  const fallbackName =
    u.user_metadata?.name ?? u.user_metadata?.full_name ?? email.split("@")[0] ?? "User";

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, is_admin, is_seller, seller_verified")
    .eq("id", u.id)
    .single();

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

    supabase.auth.getSession().then(async ({ data }) => {
      const mapped = await buildUser(data.session?.user ?? null);
      if (active) {
        setUser(mapped);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // Token refreshes don't change role/profile data — skip refetching
      // the profile so a routine hourly refresh doesn't trigger a new
      // `user` object identity and cascade re-fetches in components that
      // key useEffect on [user] (e.g. Seller.tsx's fetchAll).
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

  // signIn, signUp, signOut, signInWithGoogle — unchanged, not reproduced here.

  export const useAuth = () => useContext(AuthContext);
  export type { KatUser };
