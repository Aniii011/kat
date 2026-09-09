import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Package, MessageCircle, Copy, Check, ChevronDown } from "lucide-react";
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
  const eta = estimatedDeliveryLabel(group.createdAt, group.headlineStatus);
  const isCancelled = group.headlineStatus === "cancelled";
  const isDelivered = group.allDelivered;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center shrink-0" aria-label="Back to orders">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {group.paymentRef && (
          <button onClick={copyRef} className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono bg-muted rounded-full px-3 py-1.5 max-w-[55%]">
            <span className="truncate">#{group.paymentRef}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-500 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
          </button>
        )}
      </header>

      <main className="max-w-lg mx-auto px-5 pb-32">
        {/* ── Screen one: what / when / where, in that order of visual weight ── */}
        <section className="pt-3 pb-7 space-y-5">
          <div>
            <p className="text-xs text-muted-foreground">
              Placed {new Date(group.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1
              className={`mt-1 text-[32px] leading-[1.05] font-bold tracking-tight [font-family:'Outfit',sans-serif] ${
                isCancelled ? "text-red-500 dark:text-red-400" : "text-foreground"
              }`}
            >
              {STATUS_META[group.headlineStatus].label}
            </h1>
            <p className="text-[15px] text-muted-foreground mt-1.5 max-w-[30ch]">
              {STATUS_META[group.headlineStatus].message}
            </p>
            {isCancelled && (
              <a
                href="https://wa.me/2348000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-primary mt-3"
              >
                <MessageCircle className="w-4 h-4" /> Chat with us about this order
              </a>
            )}
          </div>

          {!isCancelled && !isDelivered && (
            <div className="relative h-[3px] rounded-full bg-muted overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(6, ((["pending","accepted","preparing","out_for_delivery","delivered"].indexOf(group.headlineStatus)) / 4) * 100)}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          )}

          {eta && !isCancelled && (
            <div className="flex items-center gap-3 py-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
                  {group.headlineStatus === "out_for_delivery" ? "Expected today" : "Estimated delivery"}
                </p>
                <p className="text-[15px] font-bold">{eta}</p>
              </div>
            </div>
          )}

          {firstLine.buyer_address && (
            <div className="flex items-center gap-3 py-1">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <MapPin className="w-4.5 h-4.5 text-foreground/70" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Delivering to</p>
                <p className="text-[15px] font-bold truncate">{firstLine.buyer_address}</p>
                {firstLine.delivery_area && (
                  <p className="text-xs text-muted-foreground truncate">{firstLine.delivery_area}, {firstLine.delivery_state}</p>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="h-px bg-border" />

        {/* ── Progressive reveal: timeline is collapsed for simple orders ── */}
        {!isCancelled && (
          <section className="py-6">
            <button
              onClick={() => setTimelineOpen((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <p className="text-sm font-bold">Order timeline</p>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${timelineOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {timelineOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="pt-5 space-y-6">
                    {group.lines.map((line) => (
                      <div key={line.id}>
                        {group.lines.length > 1 && (
                          <p className="text-xs font-semibold text-muted-foreground mb-3 truncate">
                            {(line.product_id && productsById[line.product_id]?.title) || "Item"}
                            {line.product_id && productsById[line.product_id]?.sellerName
                              ? ` · ${productsById[line.product_id]?.sellerName}`
                              : ""}
                          </p>
                        )}
                        <Timeline status={normalizeStatus(line.admin_status)} events={eventsByOrder[line.id]} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        <div className="h-px bg-border" />

        {/* ── Items ── */}
        <section className="py-6 space-y-4">
          <p className="text-sm font-bold">
            {group.lines.length} {group.lines.length === 1 ? "item" : "items"}
            {group.sellerCount > 1 ? ` · ${group.sellerCount} sellers` : ""}
          </p>

          <div className="space-y-3">
            {group.lines.map((line) => {
              const product = line.product_id ? productsById[line.product_id] : undefined;
              const color = line.variant?.color;
              const size = line.variant?.size;
              return (
                <div key={line.id} className="flex gap-3.5 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden shrink-0">
                    {product?.image_url ? (
                      <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {product?.sellerName && (
                      <p className="text-[11px] text-muted-foreground truncate">{product.sellerName}</p>
                    )}
                    <p className="text-sm font-semibold truncate">{product?.title || "Product"}</p>
                    <p className="text-xs text-muted-foreground">
                      {[color, size ? `Size ${size}` : null].filter(Boolean).join(" · ")}
                      {(color || size) ? " · " : ""}Qty {line.quantity ?? 1}
                    </p>
                  </div>
                  <p className="text-sm font-bold shrink-0 tabular-nums">{formatNaira(line.total ?? line.amount ?? 0)}</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-baseline pt-3">
            <span className="text-sm text-muted-foreground">Total paid</span>
            <span className="text-lg font-bold tabular-nums">{formatNaira(group.total)}</span>
          </div>
        </section>
      </main>

      {/* sticky help bar — thumb reach on mobile */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border px-5 py-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <a
          href="https://wa.me/2348000000000"
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-lg mx-auto flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 text-foreground/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">Need help with this order?</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Chat with us on WhatsApp</p>
          </div>
          <span className="text-xs font-bold text-primary shrink-0">Chat →</span>
        </a>
      </div>
    </motion.div>
  );
      }
