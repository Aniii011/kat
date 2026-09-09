import { Package, Check } from "lucide-react";
import type { PurchaseGroup } from "@/lib/order-groups";
import { STATUS_META, estimatedDeliveryShortLabel } from "@/lib/order-status";
import StatusTrack from "./StatusTrack";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

interface PurchaseCardProps {
  group: PurchaseGroup;
  productsById: Record<string, { title: string; image_url?: string | null }>;
  onOpen: (group: PurchaseGroup) => void;
}

export default function PurchaseCard({ group, productsById, onOpen }: PurchaseCardProps) {
  const meta = STATUS_META[group.headlineStatus];
  const eta = estimatedDeliveryShortLabel(group.createdAt, group.headlineStatus);
  const isCancelled = group.headlineStatus === "cancelled";
  const isDelivered = group.allDelivered;
  const hero = group.lines[0];
  const heroProduct = hero.product_id ? productsById[hero.product_id] : undefined;

  // Full remaining set (not capped) so the overflow count is always correct,
  // however many items are in the purchase.
  const rest = group.lines.slice(1);
  const shownCompanions = rest.slice(0, 2);
  const overflow = rest.length - shownCompanions.length;

  const titleLine =
    group.lines.length === 1
      ? heroProduct?.title || "Order"
      : `${group.lines.length} items`;

  return (
    <button
      onClick={() => onOpen(group)}
      className="group w-full text-left bg-card border border-card-border/70 rounded-[20px] overflow-hidden transition-shadow hover:shadow-md"
    >
      {/* image stage — the purchase, presented like a look, not a record */}
      <div className="relative flex gap-2 p-2.5 pb-0">
        <div
          className={`relative flex-1 aspect-[4/3] rounded-2xl overflow-hidden bg-muted ${
            isCancelled ? "grayscale opacity-60" : ""
          }`}
        >
          {heroProduct?.image_url ? (
            <img
              src={heroProduct.image_url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
              <Package className="w-7 h-7 text-muted-foreground/70" />
              <span className="text-[10px] text-muted-foreground/70">No photo</span>
            </div>
          )}
        </div>

        {shownCompanions.length > 0 && (
          <div className="flex flex-col gap-2 w-[30%] shrink-0">
            {shownCompanions.map((line, i) => {
              const p = line.product_id ? productsById[line.product_id] : undefined;
              const isLast = i === shownCompanions.length - 1 && overflow > 0;
              return (
                <div
                  key={line.id}
                  className={`relative flex-1 rounded-xl overflow-hidden bg-muted ${isCancelled ? "grayscale opacity-60" : ""}`}
                >
                  {p?.image_url ? (
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-3.5 h-3.5 text-muted-foreground/70" />
                    </div>
                  )}
                  {isLast && (
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                      <span className="text-[11px] font-bold text-white">+{overflow}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* content */}
      <div className="px-4 pt-3 pb-4 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              {new Date(group.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
              {group.sellerCount > 1 && <> &nbsp;·&nbsp; {group.sellerCount} sellers</>}
            </p>
            <p className="text-sm font-semibold text-foreground/90 truncate mt-0.5">{titleLine}</p>
          </div>
          <p className="text-sm font-bold text-foreground shrink-0 tabular-nums">{formatNaira(group.total)}</p>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <p
            className={`flex items-center gap-1.5 text-[17px] leading-none font-bold tracking-tight [font-family:'Outfit',sans-serif] ${
              isCancelled
                ? "text-red-500/90 dark:text-red-400/90"
                : isDelivered
                ? "text-muted-foreground"
                : "text-primary"
            }`}
          >
            {isDelivered && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            {meta.label}
          </p>
          {eta && !isCancelled && !isDelivered && (
            <p className="text-[11px] text-muted-foreground shrink-0">Est. {eta}</p>
          )}
        </div>

        {!isCancelled && !isDelivered && <StatusTrack status={group.headlineStatus} />}
      </div>
    </button>
  );
                        }
