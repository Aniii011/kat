import { Clock, Package, Truck, CheckCircle2, XCircle } from "lucide-react";
import type { ReactNode } from "react";

export const ORDER_STATUS: Record<string, { label: string; className: string; icon: ReactNode }> = {
  pending:          { label: "Pending",          className: "bg-amber-100 text-amber-700",    icon: <Clock className="w-3 h-3" /> },
  accepted:         { label: "Accepted",         className: "bg-sky-100 text-sky-700",         icon: <Package className="w-3 h-3" /> },
  preparing:        { label: "Preparing",        className: "bg-blue-100 text-blue-700",       icon: <Package className="w-3 h-3" /> },
  ready_for_pickup: { label: "Ready for Pickup", className: "bg-purple-100 text-purple-700",    icon: <Package className="w-3 h-3" /> },
  out_for_delivery: { label: "Out for Delivery", className: "bg-orange-100 text-orange-700",    icon: <Truck className="w-3 h-3" /> },
  delivered:        { label: "Delivered",        className: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  completed:        { label: "Completed",        className: "bg-green-100 text-green-700",     icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled:        { label: "Cancelled",        className: "bg-red-100 text-red-700",         icon: <XCircle className="w-3 h-3" /> },
};

export interface OrderRowOrder {
  id: string;
  created_at: string;
  admin_status: string | null;
  total?: number | null;
  amount?: number | null;
  product_id?: string | null;
  buyer_address?: string | null;
  quantity?: number | null;
  variant?: { color?: string | null; size?: string | null } | null;
  delivery_area?: string | null;
  delivery_state?: string | null;
}

export interface OrderRowProduct {
  title: string;
  image_url?: string | null;
}

interface OrderRowProps {
  order: OrderRowOrder;
  product?: OrderRowProduct;
  onSelect: (order: OrderRowOrder) => void;
}

export default function OrderRow({ order, product, onSelect }: OrderRowProps) {
  const status = order.admin_status || "pending";
  const cfg = ORDER_STATUS[status] || ORDER_STATUS.pending;

  return (
    <button
      onClick={() => onSelect(order)}
      aria-label={`Order ${order.id.slice(0, 8)}, ${cfg.label}${product?.title ? `, ${product.title}` : ""}`}
      className="w-full text-left bg-card border border-card-border rounded-2xl p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
    >
      <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center">
        {product?.image_url ? (
          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <Package className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold line-clamp-1">{product?.title || `Order #${order.id.slice(0, 8)}`}</p>
        <p className="text-[11px] text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${cfg.className}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      <p className="text-sm font-black text-primary shrink-0">
        ₦{Number(order.total ?? order.amount ?? 0).toLocaleString("en-NG")}
      </p>
    </button>
  );
}
