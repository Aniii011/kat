import { Truck } from "lucide-react";

export interface AttentionOrder {
  id: string;
  admin_status: string | null;
}

interface AttentionBannerProps {
  order: AttentionOrder | null;
  onSelect: (order: AttentionOrder) => void;
}

export default function AttentionBanner({ order, onSelect }: AttentionBannerProps) {
  if (!order || order.admin_status !== "out_for_delivery") return null;

  return (
    <button
      onClick={() => onSelect(order)}
      className="w-full text-left bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-2xl p-3.5 flex items-center gap-3 hover:bg-orange-100/60 dark:hover:bg-orange-950/50 transition-colors"
    >
      <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center shrink-0">
        <Truck className="w-4 h-4 text-orange-700 dark:text-orange-400" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-orange-700 dark:text-orange-400">Your order is on the way</p>
        <p className="text-xs text-orange-700/80 dark:text-orange-400/80">
          Order #{order.id.slice(0, 8)} &middot; Out for delivery
        </p>
      </div>
    </button>
  );
}
