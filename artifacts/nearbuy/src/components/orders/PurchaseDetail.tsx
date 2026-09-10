import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Package, MessageCircle, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { PurchaseGroup } from "@/lib/order-groups";
import { STATUS_META, normalizeStatus } from "@/lib/order-status";
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
        {/* ── Status: its own clear section, straight from admin_status ── */}
        <section className="rounded-xl border border-border p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {group.lines.length > 1 ? "Order status" : "Status"}
          </p>

          {isCancelled ? (
            <div className="space-y-3">
              <p className="text-base font-bold text-red-500">{STATUS_META.cancelled.label}</p>
              <p className="text-sm text-muted-foreground">{STATUS_META.cancelled.message}</p>
              <a
                href="https://wa.me/2348000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-primary"
              >
                <MessageCircle className="w-4 h-4" /> Chat with us about this order
              </a>
            </div>
          ) : (
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
                    <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 mt-2">
                      {line.admin_note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Delivering to ── */}
        {firstLine.buyer_address && (
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Delivering to</p>
            <p className="text-sm font-semibold">{firstLine.buyer_address}</p>
            {firstLine.delivery_area && (
              <p className="text-xs text-muted-foreground">{firstLine.delivery_area}, {firstLine.delivery_state}</p>
            )}
          </section>
        )}

        {/* ── Items — image, title, variant, price, exactly what was ordered ── */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {group.lines.length} {group.lines.length === 1 ? "item" : "items"}
            {group.sellerCount > 1 ? ` · ${group.sellerCount} sellers` : ""}
          </p>
          <div className="space-y-4">
            {group.lines.map((line) => {
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
                    {product?.sellerName && (
                      <p className="text-[11px] text-muted-foreground truncate">{product.sellerName}</p>
                    )}
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
        </section>

        <div className="border-t border-border pt-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total paid</span>
          <span className="text-base font-black text-primary">{formatNaira(group.total)}</span>
        </div>

        {!isCancelled && (
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
        )}
      </main>
    </motion.div>
  );
}
