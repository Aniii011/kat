import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Package, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { groupOrdersByPurchase, isGroupActive, type OrderLine, type PurchaseGroup } from "@/lib/order-groups";
import PurchaseCard from "@/components/orders/PurchaseCard";
import PurchaseDetail from "@/components/orders/PurchaseDetail";

const ORDER_COLUMNS =
  "id, product_id, product_title, product_image, product_seller_name, seller_id, admin_status, admin_note, buyer_address, total, amount, delivery_fee, discount_amount, created_at, quantity, variant, delivery_area, delivery_state, payment_ref";

type Filter = "active" | "delivered" | "cancelled" | "all";

export default function Orders() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [productsById, setProductsById] = useState<Record<string, { title: string; image_url?: string | null; sellerName?: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [filter, setFilter] = useState<Filter>("active");
  const [selected, setSelected] = useState<PurchaseGroup | null>(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErrored(false);

      const { data, error } = await supabase
        .from("orders")
        .select(ORDER_COLUMNS)
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error || !data) {
        setErrored(true);
        setLoading(false);
        return;
      }

      setLines(data as OrderLine[]);

      const productIds = [...new Set(data.map((o) => o.product_id).filter(Boolean))] as string[];
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, title, image_url, seller_name")
          .in("id", productIds);
        if (!cancelled && products) {
          const map: Record<string, { title: string; image_url?: string | null; sellerName?: string | null }> = {};
          products.forEach((p: any) => { map[p.id] = { title: p.title, image_url: p.image_url, sellerName: p.seller_name }; });
          setProductsById(map);
        }
      }

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  const groups = groupOrdersByPurchase(lines);
  const activeGroups = groups.filter(isGroupActive);
  const deliveredGroups = groups.filter((g) => g.allDelivered);
  const cancelledGroups = groups.filter((g) => g.headlineStatus === "cancelled");
  const visible =
    filter === "active" ? activeGroups :
    filter === "delivered" ? deliveredGroups :
    filter === "cancelled" ? cancelledGroups :
    groups;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl px-3 py-2.5 flex items-center gap-1">
        <Link href="/me">
          <button className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="Back to account">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-5 space-y-5">
        <div className="px-0.5">
          <h1 className="text-[26px] font-bold tracking-tight [font-family:'Outfit',sans-serif]">Your Orders</h1>
          {!loading && !errored && groups.length > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {groups.length} {groups.length === 1 ? "order" : "orders"}
            </p>
          )}
        </div>

        {!user?.id ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-bold">Sign in to see your orders</p>
            <p className="text-sm text-muted-foreground mt-1">Your order history lives here once you're signed in.</p>
            <Button className="rounded-full mt-4" onClick={() => navigate("/me")}>Sign in</Button>
          </div>
        ) : loading ? (
          <div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-4 py-5 border-b border-border">
                <Skeleton className="w-24 h-24 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                  <div className="flex justify-between pt-3">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : errored ? (
          <div className="text-center py-16">
            <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-bold">Couldn't load your orders</p>
            <p className="text-sm text-muted-foreground mt-1">Check your connection and try again.</p>
            <Button variant="outline" className="rounded-full mt-4" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-bold">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[220px] mx-auto">
              When you make a purchase, you'll be able to track it here from placed to delivered.
            </p>
            <Link href="/">
              <Button className="rounded-full mt-4">Start shopping</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-5 border-b border-border px-0.5">
              {([
                ["active", `Active${activeGroups.length ? ` (${activeGroups.length})` : ""}`],
                ...(deliveredGroups.length ? [["delivered", "Delivered"] as const] : []),
                ...(cancelledGroups.length ? [["cancelled", "Cancelled"] as const] : []),
                ["all", "All"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as Filter)}
                  className={`relative pb-2.5 text-sm transition-colors ${
                    filter === key ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                  }`}
                >
                  {label}
                  {filter === key && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-primary rounded-full" />}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nothing here right now.</p>
            ) : (
              <div>
                {visible.map((group) => (
                  <PurchaseCard key={group.groupKey} group={group} productsById={productsById} onOpen={setSelected} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <AnimatePresence>
        {selected && (
          <PurchaseDetail group={selected} productsById={productsById} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
