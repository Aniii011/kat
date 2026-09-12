import { useEffect, useState } from "react";
import { Truck, Package, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Buyer-facing journey uses SELLER_STATUS (confirmed in
// seller-orders.tsx): pending -> processing -> shipped -> delivered.
// admin_status is a separate internal field (pending/assigned/
// completed/cancelled) and never reaches "delivered" — it's not
// what tells us the buyer has the item.
const STATUS_META: Record<string, { label: string; icon: typeof Truck; sub: string }> = {
  pending: { label: "Order placed", icon: Clock, sub: "Waiting for seller to start processing" },
  processing: { label: "Order is being prepared", icon: Package, sub: "Your seller is packing it up" },
  shipped: { label: "Your order has shipped", icon: Truck, sub: "On its way to you" },
};

// Full order shape — matches what BuyerOrderDialog expects, since
// this banner opens that dialog directly on tap.
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
      // active_orders is the helper view from kat_schema.sql —
      // excludes admin_status = 'cancelled' and seller_status =
      // 'delivered', sorted most recent first.
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

  // seller_status is null until the seller touches the order —
  // treat that as "pending" for display purposes.
  const status = order.seller_status || "pending";
  const meta = STATUS_META[status];
  if (!meta) return null; // unrecognized status — fail quiet rather than show something wrong

  const Icon = meta.icon;

  return (
    <button
      onClick={() => onSelect?.(order)}
      className="w-full text-left bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-2xl p-3.5 flex items-center gap-3 hover:bg-orange-100/60 dark:hover:bg-orange-950/50 transition-colors"
    >
      <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-orange-700 dark:text-orange-400" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-orange-700 dark:text-orange-400">{meta.label}</p>
        <p className="text-xs text-orange-700/80 dark:text-orange-400/80 truncate">
          {order.product_title ? `${order.product_title} · ` : ""}{meta.sub}
        </p>
      </div>
    </button>
  );
}
