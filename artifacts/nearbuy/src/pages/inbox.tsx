import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Inbox as InboxIcon, Package } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { STATUS_META, normalizeStatus } from "@/lib/order-status";

// Notifications-only inbox — no buyer/seller chat. Order updates are
// real today (pulled from order_events). Offers and coupons are a
// separate feature to build later; when that exists, it'll add another
// item "type" to this same feed rather than a new page.
interface OrderUpdateItem {
  type: "order";
  id: string;
  timestamp: string;
  orderId: string;
  paymentRef: string | null;
  productTitle: string | null;
  headline: string;
}

export default function Inbox() {
  const { user } = useAuth();
  const [items, setItems] = useState<OrderUpdateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const { data: orders } = await supabase
        .from("orders")
        .select("id, payment_ref, product_title")
        .eq("buyer_id", user.id);

      const orderMap = new Map((orders || []).map((o) => [o.id, o]));
      const orderIds = Array.from(orderMap.keys());

      let orderItems: OrderUpdateItem[] = [];
      if (orderIds.length > 0) {
        const { data: events } = await supabase
          .from("order_events")
          .select("id, order_id, status, created_at")
          .in("order_id", orderIds)
          .order("created_at", { ascending: false })
          .limit(50);

        orderItems = (events || []).map((e) => {
          const order = orderMap.get(e.order_id);
          const status = normalizeStatus(e.status);
          return {
            type: "order" as const,
            id: e.id,
            timestamp: e.created_at,
            orderId: e.order_id,
            paymentRef: order?.payment_ref || null,
            productTitle: order?.product_title || null,
            headline: STATUS_META[status]?.headline || "Order update",
          };
        });
      }

      if (!cancelled) {
        setItems(orderItems);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3 p-6">
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
            <InboxIcon className="w-4 h-4 text-primary" /> Inbox
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-2">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-card border border-card-border rounded-2xl">
            <InboxIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-bold text-sm">Nothing here yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Order updates, offers, and coupons will show up here.
            </p>
          </div>
        ) : (
          items.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link href={`/orders${item.paymentRef ? `?open=${item.paymentRef}` : ""}`}>
                <button className="w-full bg-card border border-card-border rounded-2xl p-3.5 flex items-center gap-3 hover:bg-muted transition-colors text-left">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.headline}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.productTitle || "Your order"}</p>
                  </div>
                </button>
              </Link>
            </motion.div>
          ))
        )}
      </main>
    </div>
  );
}
