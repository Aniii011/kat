import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageCircle, Copy, Check, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { PurchaseGroup } from "@/lib/order-groups";
import { STATUS_META, normalizeStatus, estimatedDeliveryLabel } from "@/lib/order-status";
import Timeline from "./Timeline";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

interface PurchaseDetailProps {
  group: PurchaseGroup;
  productsById: Record<string, { title: string; image_url?: string | null; sellerName?: string | null }>;
  onClose: () => void;
}

export default function PurchaseDetail({ group, productsById, onClose }: PurchaseDetailProps) {
  const [eventsByOrder, setEventsByOrder] = useState<Record<string, { status: string; created_at: string }[]>>({});
  const [copied, setCopied] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(group.sellerCount <= 1 && group.lines.length === 1);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("order_events")
      .select("order_id, status, created_at")
      .in("order_id", group.lines.map((l) => l.id))
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (cancelled || !data) return;
        const map: Record<string, { status: string; created_at: string }[]> = {};
        data.forEach((e: any) => {
          if (!map[e.order_id]) map[e.order_id] = [];
          map[e.order_id].push(e);
        });
        setEventsByOrder(map);
      });
    return () => { cancelled = true; };
  }, [group.groupKey]);

  const copyRef = () => {
    if (!group.paymentRef) return;
    navigator.clipboard.writeText(group.paymentRef).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const firstLine = group.lines[0];
  const heroProduct = firstLine.product_id ? productsById[firstLine.product_id] : undefined;
  const eta = estimatedDeliveryLabel(group.createdAt, group.headlineStatus);
  const isCancelled = group.headlineStatus === "cancelled";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      {/* ── The cover: photo IS the first screen. Status is set into it. ── */}
      <div className={`relative w-full aspect-[4/5] bg-muted ${isCancelled ? "grayscale" : ""}`}>
        {heroProduct?.image_url ? (
          <img src={heroProduct.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground/60">No photo</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/50" />

        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center"
          aria-label="Back to orders"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {group.paymentRef && (
          <button
            onClick={copyRef}
            className="absolute top-4 right-4 max-w-[45%] flex items-center gap-1.5 text-[10px] text-white/80 font-mono bg-black/35 backdrop-blur-sm rounded-full px-2.5 py-1.5"
          >
            <span className="truncate">#{group.paymentRef}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
          </button>
        )}

        <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
          <h1 className="text-white text-[34px] leading-[1.05] font-bold tracking-tight [font-family:'Outfit',sans-serif]">
            {STATUS_META[group.headlineStatus].label}
          </h1>
          <p className="text-white/80 text-[14px] mt-1.5 max-w-[85%]">
            {eta
              ? `${group.headlineStatus === "out_for_delivery" ? "Arriving" : "Estimated"} ${eta}`
              : STATUS_META[group.headlineStatus].message}
          </p>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-5">
        {isCancelled && (
          <a
            href="https://wa.me/2348000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary mt-5"
          >
            <MessageCircle className="w-4 h-4" /> Chat with us about this order
          </a>
        )}

        {/* delivering to — quiet, single line */}
        {firstLine.buyer_address && (
          <div className="pt-6 pb-5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Delivering to</p>
            <p className="text-[15px] font-semibold mt-1">{firstLine.buyer_address}</p>
            {firstLine.delivery_area && (
              <p className="text-[13px] text-muted-foreground">{firstLine.delivery_area}, {firstLine.delivery_state}</p>
            )}
          </div>
        )}

        <div className="h-px bg-border" />

        {/* timeline — collapsed by default for simple orders */}
        {!isCancelled && (
          <div className="py-5">
            <button onClick={() => setTimelineOpen((v) => !v)} className="w-full flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Timeline</p>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${timelineOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {timelineOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 space-y-5">
                    {group.lines.map((line) => (
                      <div key={line.id}>
                        {group.lines.length > 1 && (
                          <p className="text-[13px] font-semibold text-foreground mb-2 truncate">
                            {(line.product_id && productsById[line.product_id]?.title) || "Item"}
                          </p>
                        )}
                        <Timeline status={normalizeStatus(line.admin_status)} events={eventsByOrder[line.id]} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="h-px bg-border" />

        {/* items — set as a quiet manifest, not repeated product cards */}
        <div className="py-5 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.lines.length} {group.lines.length === 1 ? "item" : "items"}
            {group.sellerCount > 1 ? ` · ${group.sellerCount} sellers` : ""}
          </p>
          <div className="space-y-3.5">
            {group.lines.map((line) => {
              const product = line.product_id ? productsById[line.product_id] : undefined;
              const color = line.variant?.color;
              const size = line.variant?.size;
              return (
                <div key={line.id} className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium truncate">{product?.title || "Product"}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {product?.sellerName ? `${product.sellerName} · ` : ""}
                      {[color, size ? `Size ${size}` : null].filter(Boolean).join(" · ")}
                      {(color || size) ? " · " : ""}Qty {line.quantity ?? 1}
                    </p>
                  </div>
                  <p className="text-[14px] font-semibold shrink-0 tabular-nums">{formatNaira(line.total ?? line.amount ?? 0)}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="py-5 flex justify-between items-baseline">
          <span className="text-[13px] text-muted-foreground">Total paid</span>
          <span className="text-[18px] font-bold tabular-nums">{formatNaira(group.total)}</span>
        </div>

        <a
          href="https://wa.me/2348000000000"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-[13px] text-muted-foreground pb-10 pt-2"
        >
          Need help with this order? <span className="text-primary font-semibold">Chat with us</span>
        </a>
      </main>
    </motion.div>
  );
              }
