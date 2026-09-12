import { useEffect, useState } from "react";
import { Truck, Package, Clock, ShoppingBag, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// admin_status is the buyer-facing source of truth (see lib/order-status.ts —
// it's the app's existing single source of truth for order status display).
// seller_status is a separate, internal signal for each seller's own handoff
// of goods to the hub; it's not shown to buyers directly since one purchase
// can combine items from multiple sellers.
//
// Labels mirror lib/order-status.ts's STATUS_META so this banner never says
// something different from the /orders detail page. Only non-terminal
// statuses need an entry here — delivered/completed/cancelled orders are
// already excluded by the active_orders view.
const STATUS_META: Record<string, { label: string; icon: typeof Truck; sub: string }> = {
  pending: { label: "Order placed", icon: Clock, sub: "We've let the seller know" },
  accepted: { label: "Order confirmed", icon: CheckCircle2, sub: "Being prepared for delivery" },
  preparing: { label: "Order is being prepared", icon: Package, sub: "Being packed for delivery" },
  ready_for_pickup: { label: "Ready for pickup", icon: ShoppingBag, sub: "Waiting for delivery pickup" },
  out_for_delivery: { label: "Your order is on its way", icon: Truck, sub: "Should reach you soon" },
  // 'assigned' is a real value your admin dashboard sets today (admin-orders.tsx)
  // that isn't in the buyer-facing OrderStatus type yet — map it to something
  // sensible rather than hiding the banner entirely.
  assigned: { label: "Order confirmed", icon: CheckCircle2, sub: "Assigned to a seller" },
};

// Full order shape — matches the real Orders detail page's data needs,
// since tapping this banner navigates straight to /orders?open=<ref>.
export interface ActiveOrder {
  id: string;
  admin_status: string | null;
  seller_status: string | null;
  payment_ref: string | null;
  quantity: number;
  total: number;
  variant: { color?: string | null; size?: string | null } | null;
  buyer_address: string | null;
  delivery_area: string | null;
  delivery_state: string | null;
  product_title: string | null;
  product_image: string | null;
  updated_at: string | null;
}

interface ActiveOrderBannerProps {
  userId: string;
  onSelect?: (order: ActiveOrder) => void;
}

const ORDER_COLUMNS =
  "id, admin_status, seller_status, payment_ref, quantity, total, variant, buyer_address, delivery_area, delivery_state, product_title, product_image, updated_at";

export default function ActiveOrderBanner({ userId, onSelect }: ActiveOrderBannerProps) {
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      // active_orders is the helper view from kat_schema.sql — excludes
      // admin_status in ('delivered', 'completed', 'cancelled'), sorted
      // most recent first.
      const { data, error } = await supabase
        .from("active_orders")
        .select(ORDER_COLUMNS)
        .eq("buyer_id", userId)
        .limit(1)
        .maybeSingle<ActiveOrder>();

      if (cancelled) return;
      if (!error && data) setOrder(data);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading || !order) return null;

  const status = order.admin_status || "pending";
  const meta = STATUS_META[status];
  if (!meta) return null; // unrecognized status — fail quiet rather than show something wrong

  const Icon = meta.icon;

  return (
    <button
      onClick={() => onSelect?.(order)}
      className="w-full text-left bg-card border border-card-border rounded-2xl p-3.5 flex items-center gap-3 hover:bg-muted/30 transition-colors"
    >
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-primary">{meta.label}</p>
        <p className="text-xs text-muted-foreground truncate">
          {order.product_title ? `${order.product_title} · ` : ""}{meta.sub}
        </p>
      </div>
    </button>
  );
}
