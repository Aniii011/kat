import { useState } from "react";
import { Package, Truck, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PackingGroupOrder {
  id: string;
  buyer_name: string | null;
  quantity: number;
  created_at: string;
}

export interface PackingGroup {
  groupKey: string;
  productId: string | null;
  title: string;
  imageUrl: string | null;
  variantLabel: string | null; // e.g. "Color: Red / Size: M", or null if no variant
  totalQty: number;
  orders: PackingGroupOrder[];
}

interface PackingListCardProps {
  group: PackingGroup;
  updating: boolean;
  onMarkProcessing: (orderIds: string[]) => void;
}

// One card per distinct product+variant combination across all of this
// seller's still-pending orders. Shows the total the seller needs to pack
// (summed across every buyer who ordered that exact item), and which
// individual orders make up that number.
export default function PackingListCard({ group, updating, onMarkProcessing }: PackingListCardProps) {
  const [expanded, setExpanded] = useState(false);
  const orderIds = group.orders.map((o) => o.id);

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        {group.imageUrl ? (
          <img src={group.imageUrl} alt={group.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{group.title}</p>
          {group.variantLabel && (
            <p className="text-xs text-muted-foreground mt-0.5">{group.variantLabel}</p>
          )}
          <p className="text-xs text-primary font-bold mt-0.5">
            Pack {group.totalQty} {group.totalQty === 1 ? "unit" : "units"}
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 shrink-0">
          {group.orders.length} {group.orders.length === 1 ? "order" : "orders"}
        </span>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>{expanded ? "Hide" : "Show"} individual orders</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="space-y-1.5 bg-muted rounded-xl p-2.5">
          {group.orders.map((o) => (
            <div key={o.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{o.buyer_name || "Buyer"}</span>
              <span className="font-medium">Qty: {o.quantity}</span>
            </div>
          ))}
        </div>
      )}

      <Button
        size="sm"
        className="w-full rounded-full gap-1.5"
        disabled={updating}
        onClick={() => onMarkProcessing(orderIds)}
      >
        <Truck className="w-3.5 h-3.5" />
        {updating ? "Updating..." : `Mark all ${group.orders.length} as Processing`}
      </Button>
    </div>
  );
}
