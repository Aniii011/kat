import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Store, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

interface FollowedSeller {
  seller_id: string;
  full_name: string | null;
  store_name: string | null;
  avatar_url: string | null;
}

export default function Following() {
  const { user } = useAuth();
  const [sellers, setSellers] = useState<FollowedSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowing, setUnfollowing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data: follows } = await supabase
        .from("seller_follows")
        .select("seller_id")
        .eq("follower_id", user.id);

      if (cancelled) return;

      const sellerIds = (follows || []).map((f) => f.seller_id);
      if (sellerIds.length === 0) {
        setSellers([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, store_name, avatar_url")
        .in("id", sellerIds);

      if (!cancelled) {
        setSellers(
          (profiles || []).map((p) => ({
            seller_id: p.id,
            full_name: p.full_name,
            store_name: p.store_name,
            avatar_url: p.avatar_url,
          }))
        );
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  const unfollow = async (sellerId: string) => {
    if (!user) return;
    setUnfollowing(sellerId);
    await supabase
      .from("seller_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("seller_id", sellerId);
    setSellers((prev) => prev.filter((s) => s.seller_id !== sellerId));
    setUnfollowing(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3 p-6">
        <LogIn className="w-10 h-10 text-muted-foreground" />
        <p className="font-semibold">Sign in required</p>
        <Link href="/"><Button className="rounded-full">Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/me">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="text-base font-black flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Following
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>
        ) : sellers.length === 0 ? (
          <div className="text-center py-16 bg-card border border-card-border rounded-2xl">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-bold text-sm">Not following anyone yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Follow sellers from their store page to see them here.
            </p>
          </div>
        ) : (
          sellers.map((s, i) => (
            <motion.div
              key={s.seller_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-card-border rounded-2xl p-3.5 flex items-center gap-3"
            >
              <Link href={`/store/${s.seller_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center shrink-0">
                  {s.avatar_url ? (
                    <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{s.store_name || s.full_name || "Seller"}</p>
                  <p className="text-xs text-muted-foreground">View store</p>
                </div>
              </Link>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full shrink-0"
                disabled={unfollowing === s.seller_id}
                onClick={() => unfollow(s.seller_id)}
              >
                {unfollowing === s.seller_id ? "..." : "Unfollow"}
              </Button>
            </motion.div>
          ))
        )}
      </main>
    </div>
  );
}
