import { Check } from "lucide-react";
import type { PurchaseGroup } from "@/lib/order-groups";
import { STATUS_META, estimatedDeliveryShortLabel } from "@/lib/order-status";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

interface PurchaseCardProps {
  group: PurchaseGroup;
  productsById: Record<string, { title: string; image_url?: string | null }>;
  onOpen: (group: PurchaseGroup) => void;
}

// A journal entry, not a card. Full-bleed image, then a single confident
// line of status typography beneath it. No border, no rounded box, no
// thumbnail cluster — the photo and the status word carry everything.
export default function PurchaseCard({ group, productsById, onOpen }: PurchaseCardProps) {
  const meta = STATUS_META[group.headlineStatus];
  const eta = estimatedDeliveryShortLabel(group.createdAt, group.headlineStatus);
  const isCancelled = group.headlineStatus === "cancelled";
  const isDelivered = group.allDelivered;
  const hero = group.lines[0];
  const heroProduct = hero.product_id ? productsById[hero.product_id] : undefined;
  const extraCount = group.lines.length - 1;

  const captionLine =
    group.lines.length === 1
      ? heroProduct?.title || "Order"
      : `${heroProduct?.title ? heroProduct.title + " + " : ""}${extraCount} more`;

  return (
    <button onClick={() => onOpen(group)} className="group w-full text-left block">
      {/* full-bleed image — negative margin cancels the feed's side padding */}
      <div className={`relative -mx-4 aspect-[4/5] overflow-hidden bg-muted ${isCancelled ? "grayscale" : ""}`}>
        {heroProduct?.image_url ? (
          <img
            src={heroProduct.image_url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground/60 tracking-wide">No photo</span>
          </div>
        )}
        {isCancelled && <div className="absolute inset-0 bg-background/40" />}
        {group.lines.length > 1 && (
          <span className="absolute bottom-3 right-3 text-[11px] font-semibold text-white bg-black/45 backdrop-blur-sm rounded-full px-2.5 py-1">
            +{extraCount}
          </span>
        )}
      </div>

      {/* status, set as a sentence — the single largest element in the entry */}
      <div className="pt-4 pb-6">
        <p
          className={`flex items-center gap-2 text-[22px] leading-tight font-bold tracking-tight [font-family:'Outfit',sans-serif] ${
            isCancelled ? "text-muted-foreground" : isDelivered ? "text-foreground" : "text-primary"
          }`}
        >
          {isDelivered && <Check className="w-4 h-4 shrink-0" strokeWidth={3} />}
          {meta.label}
          {eta && !isCancelled && !isDelivered && (
            <span className="text-[13px] font-medium text-muted-foreground ml-auto shrink-0">{eta}</span>
          )}
        </p>
        <p className="text-[13px] text-muted-foreground mt-1 truncate">
          {captionLine}
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-2 tracking-wide">
          {new Date(group.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
          {group.sellerCount > 1 && <> · {group.sellerCount} sellers</>}
          {" · "}{formatNaira(group.total)}
        </p>
      </div>
    </button>
  );
}
