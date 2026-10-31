import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Gift, Clock, Truck, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type GiftState = "waiting" | "on_the_way" | "delivered" | "cancelled";

interface MyGift {
  id: string;
  wishlistId: string;
  wishlistName: string;
  wishlistEmoji: string;
  title: string;
  image: string | null;
  from: string | null;
  state: GiftState;
  createdAt: string;
}

const STATE_LABEL: Record<GiftState, string> = {
  waiting: "Waiting at KAT",
  on_the_way: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function MyGifts() {
  const { user, loading: authLoading } = useAuth();
  const [gifts, setGifts] = useState<MyGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [sendingFor, setSendingFor] = useState<string | null>(null);
  const [sendError, setSendError] = useState("");
  const [sendDone, setSendDone] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("no session");
        const res = await fetch("/api/gifts?action=list", { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok) throw new Error(json?.error || "failed");
        if (!cancelled) setGifts(json.gifts || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message === "no session" ? "Please sign in again." : "We couldn't load your gifts. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading, reloadKey]);

  // The owner pays delivery for the gifts waiting on one list. The server works out the fee.
  const sendMyGifts = async (wishlistId: string) => {
    setSendError("");
    setSendDone("");
    setSendingFor(wishlistId);
    try {
      const PaystackPop = (window as any).PaystackPop;
      if (!PaystackPop) throw new Error("Payment couldn't load. Please refresh the page and try again.");

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Please sign in again.");

      const quoteRes = await fetch("/api/gifts?action=send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ wishlistId }),
      });
      const quote = await quoteRes.json().catch(() => null);
      if (!quoteRes.ok || !quote?.ok) throw new Error(quote?.error || "We couldn't prepare your delivery. Please try again.");

      const popup = new PaystackPop();
      popup.newTransaction({
        key:
          (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY ||
          "pk_test_f4a152b1348a3c6f5c4b415f3341691ea02b2e2c",
        email: user?.email || "support@kat.ng",
        amount: quote.amountKobo,
        currency: "NGN",
        reference: quote.reference,
        metadata: {
          sendGifts: { wishlistId, buyerId: user?.id },
          buyerSig: quote.buyerSig,
        },
        onSuccess: async (response: any) => {
          try {
            const { data: fresh } = await supabase.auth.getSession();
            const verify = await fetch("/api/gifts?action=verify", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${fresh.session?.access_token || token}` },
              body: JSON.stringify({ reference: response.reference }),
            });
            const result = await verify.json().catch(() => null);
            if (verify.ok && result?.verified) {
              setSendDone("Done! Your gifts will go out together in one delivery.");
              setReloadKey((k) => k + 1);
            } else {
              setSendError(result?.error || "We received your payment but couldn't update your gifts yet. Please contact KAT support.");
            }
          } catch {
            setSendError(`We received your payment but couldn't update your gifts yet. Please contact KAT support and quote: ${response.reference}`);
          } finally {
            setSendingFor(null);
          }
        },
        onCancel: () => {
          setSendError("Payment cancelled. Your gifts are still waiting at KAT.");
          setSendingFor(null);
        },
      });
    } catch (e: any) {
      setSendError(e?.message || "Something went wrong. Please try again.");
      setSendingFor(null);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4 p-6 text-center">
        <Gift className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-black">My gifts</h1>
        <p className="text-sm text-muted-foreground">Sign in to see gifts from your friends</p>
        <Link href="/me"><Button className="rounded-full">Sign In</Button></Link>
      </div>
    );
  }

  const waiting = gifts.filter((g) => g.state === "waiting");
  const waitingLists = Array.from(
    waiting.reduce((map, g) => {
      const entry = map.get(g.wishlistId) || { id: g.wishlistId, name: g.wishlistName, emoji: g.wishlistEmoji, count: 0 };
      entry.count += 1;
      map.set(g.wishlistId, entry);
      return map;
    }, new Map<string, { id: string; name: string; emoji: string; count: number }>()).values(),
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/wishlists">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="text-base font-black flex-1">My gifts</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading && <p className="text-sm text-muted-foreground text-center py-10">Loading your gifts…</p>}

        {!loading && error && <p className="text-sm text-red-600 text-center py-10">{error}</p>}

        {!loading && !error && gifts.length === 0 && (
          <div className="text-center py-16">
            <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-bold">No gifts yet</p>
            <p className="text-sm text-muted-foreground mt-1">When a friend buys from your wishlist, it will show up here.</p>
          </div>
        )}

        {sendDone && (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-3 text-xs font-semibold text-green-800">{sendDone}</div>
        )}
        {sendError && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">{sendError}</div>
        )}

        {!loading && !error && waitingLists.map((l) => (
          <div key={l.id} className="rounded-2xl bg-amber-50 border border-amber-200 p-3 space-y-2">
            <p className="text-xs font-semibold text-amber-800">
              {l.count} {l.count === 1 ? "gift is" : "gifts are"} waiting at KAT from {l.emoji} {l.name}. They go out together in one delivery.
            </p>
            <Button
              size="sm"
              className="rounded-full text-xs"
              disabled={sendingFor !== null}
              onClick={() => sendMyGifts(l.id)}
            >
              {sendingFor === l.id ? "Opening payment…" : "Send my gifts"}
            </Button>
            <p className="text-[11px] text-amber-700">You only pay delivery. Your gifts are already paid for.</p>
          </div>
        ))}

        {!loading && !error && gifts.map((g) => (
          <div key={g.id} className="flex gap-3 rounded-2xl border border-border p-3">
            {g.image ? (
              <img src={g.image} alt="" className="w-16 h-16 rounded-xl object-cover bg-muted flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{g.title}</p>
              <p className="text-xs text-muted-foreground">
                {g.from ? `From ${g.from}` : "From a friend"} · {g.wishlistEmoji} {g.wishlistName}
              </p>
              <span
                className={
                  "inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full " +
                  (g.state === "waiting" ? "bg-amber-100 text-amber-800"
                    : g.state === "on_the_way" ? "bg-blue-100 text-blue-800"
                    : g.state === "delivered" ? "bg-green-100 text-green-800"
                    : "bg-muted text-muted-foreground")
                }
              >
                {g.state === "waiting" && <Clock className="w-3 h-3" />}
                {g.state === "on_the_way" && <Truck className="w-3 h-3" />}
                {g.state === "delivered" && <CheckCircle2 className="w-3 h-3" />}
                {STATE_LABEL[g.state]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
        }
