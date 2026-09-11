import { Package, Check } from "lucide-react";
import type { PurchaseGroup } from "@/lib/order-groups";
import { STATUS_META } from "@/lib/order-status";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

interface PurchaseCardProps {
  group: PurchaseGroup;
  productsById: Record<string, { title: string; image_url?: string | null; sellerName?: string | null }>;
  onOpen: (group: PurchaseGroup) => void;
}

// A purchase, not a table row: a real product photo with enough presence
// to anchor the block, an identity line, and a status/price footer that
// carries equal weight — every question answered without a tap, using the
// full width instead of squeezing everything into a side column.
export default function PurchaseCard({ group, productsById, onOpen }: PurchaseCardProps) {
  const meta = STATUS_META[group.headlineStatus];
  const isCancelled = group.headlineStatus === "cancelled";
  const isDelivered = group.allDelivered;
  const hero = group.lines[0];
  const heroProduct = hero.product_id ? productsById[hero.product_id] : undefined;
  const extraCount = group.lines.length - 1;
  const sellerLabel =
    group.sellerCount > 1 ? `${group.sellerCount} sellers` : heroProduct?.sellerName || null;

  const title =
    extraCount === 0
      ? heroProduct?.title || "Order"
      : `${heroProduct?.title ? heroProduct.title + " " : ""}+ ${extraCount} more`;

  return (
    <button
      onClick={() => onOpen(group)}
      className="w-full text-left flex gap-4 py-5 border-b border-border"
    >
      <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-muted shrink-0">
        {heroProduct?.image_url ? (
          <img src={heroProduct.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-7 h-7 text-muted-foreground" />
          </div>
        )}
        {extraCount > 0 && (
          <span className="absolute bottom-1.5 right-1.5 text-[10px] font-bold text-white bg-black/65 rounded px-1.5 py-0.5">
            +{extraCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        {sellerLabel && (
          <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
            {sellerLabel}
          </p>
        )}
        <p className="text-[15px] font-semibold leading-snug mt-0.5 line-clamp-2">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {new Date(group.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
        </p>

        <div className="flex items-center justify-between mt-auto pt-2.5">
          <p
            className={`text-[13px] font-semibold flex items-center gap-1 ${
              isCancelled ? "text-red-500" : isDelivered ? "text-emerald-500" : "text-primary"
            }`}
          >
            {isDelivered && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            {meta.label}
          </p>
          <p className="text-[15px] font-bold tabular-nums">{formatNaira(group.total)}</p>
        </div>
      </div>
    </button>
  );
}
