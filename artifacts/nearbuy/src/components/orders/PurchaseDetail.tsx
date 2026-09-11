import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Package, MessageCircle, Copy, Check, RotateCcw } from "lucide-react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import type { PurchaseGroup } from "@/lib/order-groups";
import { STATUS_META, normalizeStatus, deliveryExpectationCopy } from "@/lib/order-status";
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
  const isCancelled = group.headlineStatus === "cancelled";
  const isDelivered = group.allDelivered;
  const deliveryCopy = deliveryExpectationCopy(group.headlineStatus);
  const cancelNote = group.lines.find((l) => l.admin_note)?.admin_note;

  // Group items by seller for the manifest — a multi-seller purchase should
  // read as "3 items from 2 sellers", not one undifferentiated list.
  const bySeller = new Map<string, typeof group.lines>();
  for (const line of group.lines) {
    const key = line.seller_id || "unknown";
    const arr = bySeller.get(key);
    if (arr) arr.push(line);
    else bySeller.set(key, [line]);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center shrink-0" aria-label="Back to orders">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-bold">Order details</p>
          {group.paymentRef && (
            <button onClick={copyRef} className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
              <span className="truncate max-w-[200px]">#{group.paymentRef}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-500 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-6 pb-16">
        {/* ── What I bought — real imagery, real title, real seller ── */}
        <section className="flex items-center gap-3">
          <div className="flex -space-x-3 shrink-0">
            {group.lines.slice(0, 3).map((line, i) => {
              const p = line.product_id ? productsById[line.product_id] : undefined;
              return (
                <div
                  key={line.id}
                  className="w-20 h-20 rounded-xl overflow-hidden bg-muted border-2 border-background"
                  style={{ zIndex: 3 - i }}
                >
                  {p?.image_url ? (
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {group.lines.length === 1
                ? (firstLine.product_id && productsById[firstLine.product_id]?.title) || "Order"
                : `${group.lines.length} items`}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {group.sellerCount > 1
                ? `From ${group.sellerCount} sellers`
                : (firstLine.product_id && productsById[firstLine.product_id]?.sellerName) || null}
            </p>
          </div>
        </section>

        {/* ── What is happening ── */}
        <section>
          <h1
            className={`text-[26px] leading-tight font-bold tracking-tight [font-family:'Outfit',sans-serif] ${
              isCancelled ? "text-red-500" : "text-foreground"
            }`}
          >
            {STATUS_META[group.headlineStatus].headline}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {isCancelled
              ? (cancelNote || "No further details were provided.")
              : STATUS_META[group.headlineStatus].message}
          </p>

          {deliveryCopy && (
            <p className="text-sm text-primary font-medium mt-3">{deliveryCopy}</p>
          )}

          {isCancelled && (
            <a
              href="https://wa.me/2348000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-primary mt-3"
            >
              <MessageCircle className="w-4 h-4" /> Chat with us — including about a refund
            </a>
          )}
        </section>

        {/* ── Where it's going ── */}
        {firstLine.buyer_address && (
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Delivering to</p>
            <p className="text-sm font-semibold">{firstLine.buyer_address}</p>
            {firstLine.delivery_area && (
              <p className="text-xs text-muted-foreground">{firstLine.delivery_area}, {firstLine.delivery_state}</p>
            )}
          </section>
        )}

        {/* ── Status progress, per line (per seller when it differs) ── */}
        {!isCancelled && (
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Progress</p>
            <div className="space-y-5">
              {group.lines.map((line) => (
                <div key={line.id}>
                  {group.lines.length > 1 && (
                    <p className="text-xs font-semibold text-foreground mb-2 truncate">
                      {(line.product_id && productsById[line.product_id]?.title) || "Item"}
                    </p>
                  )}
                  <Timeline status={normalizeStatus(line.admin_status)} events={eventsByOrder[line.id]} />
                  {line.admin_note && (
                    <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 mt-2">{line.admin_note}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── What was ordered, grouped by seller ── */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {group.lines.length} {group.lines.length === 1 ? "item" : "items"}
            {group.sellerCount > 1 ? ` · ${group.sellerCount} sellers` : ""}
          </p>
          <div className="space-y-5">
            {Array.from(bySeller.entries()).map(([sellerId, lines]) => (
              <div key={sellerId} className="space-y-3">
                {group.sellerCount > 1 && (
                  <p className="text-xs font-semibold text-muted-foreground">
                    {(lines[0].product_id && productsById[lines[0].product_id]?.sellerName) || "Seller"}
                  </p>
                )}
                {lines.map((line) => {
                  const product = line.product_id ? productsById[line.product_id] : undefined;
                  const color = line.variant?.color;
                  const size = line.variant?.size;
                  return (
                    <div key={line.id} className="flex gap-3">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                        {product?.image_url ? (
                          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{product?.title || "Product"}</p>
                        <p className="text-xs text-muted-foreground">
                          {[color, size ? `Size ${size}` : null].filter(Boolean).join(" · ")}
                          {(color || size) ? " · " : ""}Qty {line.quantity ?? 1}
                        </p>
                        <p className="text-sm font-bold mt-1">{formatNaira(line.total ?? line.amount ?? 0)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        {/* ── Payment breakdown — real fields only ── */}
        <section className="border-t border-border pt-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatNaira(group.subtotal)}</span>
          </div>
          {group.deliveryFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery fee</span>
              <span className="tabular-nums">{formatNaira(group.deliveryFee)}</span>
            </div>
          )}
          {group.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="tabular-nums text-emerald-500">−{formatNaira(group.discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1.5">
            <span className="text-sm font-semibold">Total paid</span>
            <span className="text-base font-black text-primary tabular-nums">{formatNaira(group.total)}</span>
          </div>
        </section>

        {/* ── What can I do — one primary action, not a dump of options ── */}
        {isDelivered ? (
          firstLine.product_id && (
            <Link href={`/listing/${firstLine.product_id}`}>
              <Button variant="outline" className="rounded-full gap-1.5 w-full">
                <RotateCcw className="w-4 h-4" /> Buy again
              </Button>
            </Link>
          )
        ) : !isCancelled ? (
          <a
            href="https://wa.me/2348000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-muted rounded-xl p-4"
          >
            <MessageCircle className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold">Need help with this order?</p>
              <p className="text-xs text-muted-foreground">Chat with us on WhatsApp</p>
            </div>
          </a>
        ) : null}
      </main>
    </motion.div>
  );
        }
