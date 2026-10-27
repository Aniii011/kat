import { useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Check, Gift, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthModal from "@/components/auth-modal";
import { useAuth } from "@/context/auth-context";
import { useWishlist } from "@/hooks/use-wishlist";
import { useListings } from "@/hooks/use-listings";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

const PAGE = 40;

// Browse and search products and add them straight to ONE wishlist. This is where the
// "Browse products" button on a wishlist takes you. No delivery address is needed to add items.
export default function WishlistAdd() {
  const [, params] = useRoute("/wishlists/:id/add");
  const id = params?.id;
  const { user } = useAuth();
  const { wishlists, loading, addToWishlist, removeFromWishlist } = useWishlist(user?.id || null);
  const { listings, loading: listingsLoading } = useListings();
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showAuth, setShowAuth] = useState(false);

  const list = wishlists.find((w: any) => w.id === id);
  const inList = new Map<string, any>((list?.items || []).map((i: any) => [i.product_id, i]));

  const q = query.trim().toLowerCase();
  const results = listings.filter((l) => !q || `${l.title} ${l.category} ${l.brand || ""}`.toLowerCase().includes(q));
  const shown = results.slice(0, visible);

  const toggle = async (l: any) => {
    if (!list || busy) return;
    const existing = inList.get(l.id);
    if (existing?.is_purchased) { setError("A friend has already gifted this one."); return; }
    setBusy(l.id);
    setError("");
    const res = existing
      ? await removeFromWishlist(list.id, l.id)
      : await addToWishlist(list.id, { id: l.id, title: l.title, price: l.price, imageUrl: l.imageUrl });
    if (!res.ok) setError(res.error || "Something went wrong. Please try again.");
    setBusy(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
        <Gift className="w-10 h-10 text-muted-foreground" />
        <p className="font-bold">Sign in to build your wishlist</p>
        <Button className="rounded-full" onClick={() => setShowAuth(true)}>Sign in</Button>
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} defaultMode="login" />
      </div>
    );
  }

  if (!loading && !list) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-bold">We couldn't find that wishlist.</p>
        <Link href="/wishlists"><Button className="rounded-full">Back to my wishlists</Button></Link>
      </div>
    );
  }

  const count = (list?.items || []).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/wishlists">
            <button aria-label="Back to my wishlists" className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center shrink-0"><ArrowLeft className="w-5 h-5" /></button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-black truncate">Add to {list?.emoji} {list?.name}</h1>
            <p className="text-[11px] text-muted-foreground">{count} item{count === 1 ? "" : "s"} on this list</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setVisible(PAGE); }} placeholder="Search products" className="rounded-full pl-9 h-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        <p className="text-xs text-muted-foreground bg-muted rounded-xl px-3 py-2">
          You can add products before or after adding your delivery address. The address is only needed when you share the list.
        </p>
        {error && <p role="alert" className="text-xs bg-destructive/10 text-destructive rounded-xl px-3 py-2">{error}</p>}

        {listingsLoading && listings.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Loading products…</p>}
        {!listingsLoading && results.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No products match "{query}".</p>
        )}

        {shown.map((l) => {
          const added = inList.has(l.id);
          const soldOut = l.inStock === false;
          return (
            <div key={l.id} className="bg-card border border-card-border rounded-2xl p-3 flex gap-3 items-center">
              <Link href={`/listing/${l.id}`}>
                <img src={l.imageUrl} alt={l.title} className="w-16 h-16 rounded-xl object-contain bg-muted shrink-0 cursor-pointer" />
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold line-clamp-2 leading-tight">{l.title}</p>
                <p className="text-sm font-black text-primary mt-0.5">{formatNaira(l.price)}</p>
                {soldOut && <p className="text-xs font-semibold text-muted-foreground">Sold out</p>}
              </div>
              <Button
                size="sm"
                variant={added ? "default" : "outline"}
                className="rounded-full text-xs shrink-0 gap-1"
                disabled={(soldOut && !added) || busy !== null}
                aria-pressed={added}
                onClick={() => toggle(l)}
              >
                {added ? <><Check className="w-3.5 h-3.5" /> Added</> : <><Plus className="w-3.5 h-3.5" /> Add</>}
              </Button>
            </div>
          );
        })}

        {results.length > shown.length && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" className="rounded-full text-xs" onClick={() => setVisible((v) => v + PAGE)}>
              Show more ({results.length - shown.length} left)
            </Button>
          </div>
        )}
      </main>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-md">
        <Link href="/wishlists">
          <Button className="w-full rounded-full font-bold h-12 shadow-xl">Done{count > 0 ? ` · ${count} item${count === 1 ? "" : "s"}` : ""}</Button>
        </Link>
      </div>
    </div>
  );
                                 }
