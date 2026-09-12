import { useEffect, useState } from "react";
import { Truck, Package, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Human-readable label + icon per admin_status value.
// Adjust the keys here if your actual status strings differ.
const STATUS_META: Record<string, { label: string; icon: typeof Truck; sub: string }> = {
  pending: { label: "Order received", icon: Clock, sub: "We're getting it ready" },
  processing: { label: "Order is being prepared", icon: Package, sub: "Your seller is packing it up" },
  shipped: { label: "Order has shipped", icon: Truck, sub: "On its way to you" },
  out_for_delivery: { label: "Your order is on the way", icon: Truck, sub: "Out for delivery" },
};

interface ActiveOrder {
  id: string;
  admin_status: string | null;
  product_title: string | null;
  updated_at: string | null;
}

interface ActiveOrderBannerProps {
  userId: string;
  onSelect?: (orderId: string) => void;
}

export default function ActiveOrderBanner({ userId, onSelect }: ActiveOrderBannerProps) {
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      // active_orders is the helper view created in kat_schema.sql —
      // it excludes delivered/cancelled orders and sorts by most recent.
      const { data, error } = await supabase
        .from("active_orders")
        .select("id, admin_status, product_title, updated_at")
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

  if (loading || !order || !order.admin_status) return null;

  const meta = STATUS_META[order.admin_status];
  if (!meta) return null; // unrecognized status — fail quiet rather than show something wrong

  const Icon = meta.icon;

  return (
    <button
      onClick={() => onSelect?.(order.id)}
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
