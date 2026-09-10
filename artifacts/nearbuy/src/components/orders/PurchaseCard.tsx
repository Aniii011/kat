import { Package, ChevronRight, Check } from "lucide-react";
import type { PurchaseGroup } from "@/lib/order-groups";
import { STATUS_META } from "@/lib/order-status";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

interface PurchaseCardProps {
  group: PurchaseGroup;
  productsById: Record<string, { title: string; image_url?: string | null }>;
  onOpen: (group: PurchaseGroup) => void;
}

// Standard order row: thumbnail, title, status, price — the pattern every
// marketplace uses because it's the one people already know how to read.
export default function PurchaseCard({ group, productsById, onOpen }: PurchaseCardProps) {
  const meta = STATUS_META[group.headlineStatus];
  const isCancelled = group.headlineStatus === "cancelled";
  const isDelivered = group.allDelivered;
  const hero = group.lines[0];
  const heroProduct = hero.product_id ? productsById[hero.product_id] : undefined;
  const extraCount = group.lines.length - 1;
  const note = group.lines.find((l) => l.admin_note)?.admin_note;

  return (
    <button
      onClick={() => onOpen(group)}
      className="w-full flex items-center gap-3 py-4 border-b border-border text-left"
    >
      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
        {heroProduct?.image_url ? (
          <img src={heroProduct.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        {extraCount > 0 && (
          <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold text-white bg-black/60 rounded px-1">
            +{extraCount}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
          {new Date(group.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <p className="text-sm font-medium truncate mt-0.5">
          {group.lines.length === 1 ? heroProduct?.title || "Order" : `${group.lines.length} items`}
        </p>
        <p
          className={`text-xs font-semibold mt-1 flex items-center gap-1 ${
            isCancelled ? "text-red-500" : isDelivered ? "text-emerald-500" : "text-primary"
          }`}
        >
          {isDelivered && <Check className="w-3 h-3" strokeWidth={3} />}
          {meta.label}
        </p>
        {note && (
          <p className="text-[11px] text-amber-500 mt-0.5 truncate">{note}</p>
        )}
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-bold tabular-nums">{formatNaira(group.total)}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}
