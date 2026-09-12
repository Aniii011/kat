import { Package, Check } from "lucide-react";
import type { PurchaseGroup } from "@/lib/order-groups";
import { resolveProduct } from "@/lib/order-groups";
import { STATUS_META } from "@/lib/order-status";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

interface PurchaseCardProps {
  group: PurchaseGroup;
  productsById: Record<string, { title: string; image_url?: string | null; sellerName?: string | null }>;
  onOpen: (group: PurchaseGroup) => void;
}

const MAX_THUMBS = 4;

// A purchase, recognizable at a glance: a strip of the real product photos
// it contains (not one hero image), then an identity/status/price footer.
export default function PurchaseCard({ group, productsById, onOpen }: PurchaseCardProps) {
  const meta = STATUS_META[group.headlineStatus];
  const isCancelled = group.headlineStatus === "cancelled";
  const isDelivered = group.allDelivered;

  const resolved = group.lines.map((line) => resolveProduct(line, productsById));
  const shown = resolved.slice(0, MAX_THUMBS);
  const overflow = resolved.length - shown.length;

  const sellerLabel =
    group.sellerCount > 1 ? `${group.sellerCount} sellers` : resolved[0]?.sellerName || null;

  const title =
    group.lines.length === 1
      ? resolved[0].title
      : `${group.lines.length} items`;

  return (
    <button
      onClick={() => onOpen(group)}
      className="w-full text-left flex flex-col gap-3 py-5 border-b border-border"
    >
      {/* thumbnail strip — the purchase, recognizable without reading text */}
      <div className="flex gap-2">
        {shown.map((product, i) => {
          const isLast = i === shown.length - 1 && overflow > 0;
          return (
            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              {isLast && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-white">+{overflow}</span>
                </div>
              )}
              {isCancelled && <div className="absolute inset-0 bg-background/50" />}
            </div>
          );
        })}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {sellerLabel && (
            <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
              {sellerLabel}
            </p>
          )}
          <p className="text-[15px] font-semibold leading-snug mt-0.5 truncate">{title}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {isCancelled && group.cancelledAt
              ? `Cancelled ${new Date(group.cancelledAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`
              : new Date(group.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          {isCancelled && (
            <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">
              {group.cancelReason || "No reason given"}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-[15px] font-bold tabular-nums">{formatNaira(group.total)}</p>
          <p
            className={`text-[13px] font-semibold flex items-center justify-end gap-1 mt-1 ${
              isCancelled ? "text-red-500" : isDelivered ? "text-emerald-500" : "text-primary"
            }`}
          >
            {isDelivered && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            {meta.label}
          </p>
        </div>
      </div>
    </button>
  );
}
