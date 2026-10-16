import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { ArrowLeft, Package, Printer, RotateCcw, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_META, type OrderStatus } from "@/lib/order-status";
import { groupOrdersByPurchase } from "@/lib/order-groups";
import { SUPPORT_EMAIL } from "@/lib/support";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

const STATUS_FLOW: { key: OrderStatus; label: string }[] = [
  { key: "accepted", label: "Accept" },
  { key: "preparing", label: "Preparing" },
  { key: "ready_for_pickup", label: "Ready" },
  { key: "out_for_delivery", label: "Delivering" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Complete" },
];

export default function AdminOrderDetail() {
  const { user } = useAuth();
  const [, params] = useRoute("/admin/orders/:id");
  const [, navigate] = useLocation();
  const orderId = params?.id;

  const [order, setOrder] = useState<any>(null);
  // Every order row in this purchase. Checkout stores one row per item, all
  // sharing one payment_ref — to admin that whole set is ONE order.
  const [lines, setLines] = useState<any[]>([]);
  const [productsById, setProductsById] = useState<Record<string, any>>({});
  const [sellersById, setSellersById] = useState<Record<string, any>>({});
  const [events, setEvents] = useState<{ status: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  const isAdmin = user?.isAdmin;

  const load = async () => {
    if (!orderId) return;
    setLoading(true);
    const { data: o } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    setOrder(o);
    setNoteDraft(o?.admin_note || "");
    setAddressDraft(o?.buyer_address || "");
    setPhoneDraft(o?.buyer_phone || "");

    let purchaseLines: any[] = o ? [o] : [];
    if (o?.payment_ref) {
      const { data: all } = await supabase
        .from("orders")
        .select("*")
        .eq("payment_ref", o.payment_ref)
        .order("created_at", { ascending: true });
      if (all && all.length > 0) purchaseLines = all;
    }
    setLines(purchaseLines);

    const productIds = Array.from(new Set(purchaseLines.map((l) => l.product_id).filter(Boolean)));
    if (productIds.length > 0) {
      const { data: ps } = await supabase.from("products").select("*").in("id", productIds);
      const map: Record<string, any> = {};
      (ps || []).forEach((p: any) => { map[p.id] = p; });
      setProductsById(map);
    }
    const sellerIds = Array.from(new Set(purchaseLines.map((l) => l.seller_id).filter(Boolean)));
    if (sellerIds.length > 0) {
      const { data: ss } = await supabase.from("profiles").select("*").in("id", sellerIds);
      const map: Record<string, any> = {};
      (ss || []).forEach((s: any) => { map[s.id] = s; });
      setSellersById(map);
    }
    const { data: ev } = await supabase
      .from("order_events")
      .select("status, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    setEvents(ev || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orderId]);

  const purchase = groupOrdersByPurchase(lines.length ? lines : order ? [order] : [])[0];
  const status = (purchase?.headlineStatus || order?.admin_status || "pending") as OrderStatus;
  // Rows still live. A line cancelled on its own earlier stays cancelled when the
  // rest of the purchase moves forward. If everything is cancelled, act on all rows.
  const liveIds: string[] = lines.filter((l) => l.admin_status !== "cancelled").map((l) => l.id);
  const targetIds: string[] = liveIds.length ? liveIds : lines.map((l) => l.id);

  const applyStatus = async (newStatus: string) => {
    if (!order || targetIds.length === 0) return;
    setUpdating(true);
    const now = new Date().toISOString();
    // One purchase = one status: every row in the purchase moves together.
    const { error } = await supabase.from("orders").update({ admin_status: newStatus, updated_at: now }).in("id", targetIds);
    if (!error) {
      await supabase.from("order_events").insert(targetIds.map((id) => ({ order_id: id, status: newStatus })));
      setLines((prev) => prev.map((l) => targetIds.includes(l.id) ? { ...l, admin_status: newStatus } : l));
      setOrder((prev: any) => ({ ...prev, admin_status: newStatus }));
      setEvents((prev) => [...prev, { status: newStatus, created_at: now }]);
    } else {
      alert("Failed to update status: " + error.message);
    }
    setUpdating(false);
  };

  const handleCancel = async () => {
    if (!order || targetIds.length === 0) return;
    const reason = window.prompt("This will cancel the order and notify the customer. Please give a reason (required):");
    if (!reason || !reason.trim()) return; // no reason, no cancellation
    setUpdating(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("orders").update({
      admin_status: "cancelled",
      admin_note: reason.trim(),
      updated_at: now,
    }).in("id", targetIds);
    if (!error) {
      await supabase.from("order_events").insert(targetIds.map((id) => ({ order_id: id, status: "cancelled" })));
      setLines((prev) => prev.map((l) => targetIds.includes(l.id) ? { ...l, admin_status: "cancelled", admin_note: reason.trim() } : l));
      setOrder((prev: any) => ({ ...prev, admin_status: "cancelled", admin_note: reason.trim() }));
      setNoteDraft(reason.trim());
      setEvents((prev) => [...prev, { status: "cancelled", created_at: now }]);
    } else {
      alert("Failed to cancel: " + error.message);
    }
    setUpdating(false);
  };

  const handleUndo = async () => {
    // The status before the current one, from the real event log —
    // not a guess, an actual prior recorded state.
    if (events.length < 2) return;
    const previous = events[events.length - 2].status;
    if (!window.confirm(`Revert this order's status back to "${STATUS_META[previous as OrderStatus]?.label || previous}"?`)) return;
    await applyStatus(previous);
  };

  const allIds: string[] = lines.map((l) => l.id);

  const handleSaveNote = async () => {
    setSavingNote(true);
    await supabase.from("orders").update({ admin_note: noteDraft.trim() }).in("id", allIds.length ? allIds : [order.id]);
    setOrder((prev: any) => ({ ...prev, admin_note: noteDraft.trim() }));
    setSavingNote(false);
  };

  const saveAddressEdit = async () => {
    setSavingAddress(true);
    // The delivery details belong to the whole purchase — update every row.
    const { error } = await supabase.from("orders").update({
      buyer_address: addressDraft.trim(),
      buyer_phone: phoneDraft.trim(),
    }).in("id", allIds.length ? allIds : [order.id]);
    setSavingAddress(false);
    if (!error) {
      setOrder((prev: any) => ({ ...prev, buyer_address: addressDraft.trim(), buyer_phone: phoneDraft.trim() }));
      setEditingAddress(false);
    } else {
      alert("Failed to update delivery info: " + error.message);
    }
  };

  const copyRef = () => {
    if (!order?.payment_ref) return;
    navigator.clipboard.writeText(order.payment_ref).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <p className="font-bold">Admin access only.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-sm text-muted-foreground">Loading order…</p></div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-bold">Order not found.</p>
        <Button onClick={() => navigate("/admin?section=orders")} className="rounded-full">Back to admin</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3 no-print">
        <button onClick={() => navigate("/admin?section=orders")} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center shrink-0" aria-label="Back to admin">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Order details</p>
          <button onClick={copyRef} className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
            <span className="truncate max-w-[220px]">{order.payment_ref ? `Payment ${order.payment_ref}` : `Order #${order.id.slice(0, 8)}`} · {lines.length || 1} item{(lines.length || 1) > 1 ? "s" : ""}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-500 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
          </button>
        </div>
        <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs" onClick={() => window.print()}>
          <Printer className="w-3.5 h-3.5" /> Print
        </Button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5 pb-16">
        <section className="rounded-2xl bg-muted p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            {lines.length || 1} item{(lines.length || 1) > 1 ? "s" : ""}
            {purchase && purchase.sellerCount > 1 ? ` · from ${purchase.sellerCount} sellers` : ""}
          </p>
          {(lines.length ? lines : [order]).map((l) => {
            const prod = productsById[l.product_id];
            const sel = sellersById[l.seller_id];
            const title = prod?.title || l.product_title || "Product unavailable";
            const img = prod?.image_url || l.product_image;
            const sellerName = sel?.store_name || sel?.full_name || l.product_seller_name;
            const c = l.variant?.color;
            const sz = l.variant?.size;
            return (
              <div key={l.id} className="flex gap-4">
                {img ? (
                  <img src={img} alt={title} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-background flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="space-y-1 min-w-0">
                  <p className="font-bold truncate">{title}</p>
                  {(c || sz) && (
                    <p className="text-sm text-muted-foreground">
                      {c ? `Color: ${c}` : ""}{c && sz ? " · " : ""}{sz ? `Size: ${sz}` : ""}
                    </p>
                  )}
                  <p className="text-sm">Qty: {l.quantity}</p>
                  <p className="font-bold text-primary">{formatNaira(l.total)}</p>
                  {sellerName && (
                    <p className="text-xs text-muted-foreground">Sold by {sellerName}</p>
                  )}
                </div>
              </div>
            );
          })}
          {purchase && (
            <div className="border-t border-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNaira(purchase.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatNaira(purchase.deliveryFee)}</span></div>
              {purchase.discount > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatNaira(purchase.discount)}</span></div>
              )}
              <div className="flex justify-between font-bold pt-1"><span>Total paid</span><span className="text-primary">{formatNaira(purchase.total)}</span></div>
            </div>
          )}
        </section>

        <section>
          <h1 className={`text-[22px] leading-tight font-bold tracking-tight ${status === "cancelled" ? "text-red-500" : "text-foreground"}`}>
            {STATUS_META[status]?.headline || status}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {status === "cancelled" ? (order.admin_note || "No reason was recorded.") : STATUS_META[status]?.message}
          </p>
        </section>

        <div className="rounded-2xl bg-muted p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Buyer</p>
          <p className="font-bold">{order.buyer_name}</p>
          <a href={`tel:${order.buyer_phone}`} className="text-primary text-sm block">{order.buyer_phone}</a>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted p-4">
            <p className="text-xs text-muted-foreground">Delivery Area</p>
            <p className="font-bold">{order.delivery_area || "Not assigned"}</p>
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <p className="text-xs text-muted-foreground">Delivery Fee</p>
            <p className="font-bold text-primary">{formatNaira(order.delivery_fee)}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-muted p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Delivery Address</p>
            {status !== "out_for_delivery" && status !== "delivered" && status !== "completed" && status !== "cancelled" && !editingAddress && (
              <button onClick={() => setEditingAddress(true)} className="text-[11px] font-bold text-primary">Edit</button>
            )}
          </div>
          {editingAddress ? (
            <div className="space-y-2 no-print">
              <Textarea value={addressDraft} onChange={(e) => setAddressDraft(e.target.value)} className="rounded-xl min-h-[60px]" />
              <input value={phoneDraft} onChange={(e) => setPhoneDraft(e.target.value)} placeholder="Phone" className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm" />
              <div className="flex gap-2">
                <Button size="sm" className="rounded-full" disabled={savingAddress} onClick={saveAddressEdit}>{savingAddress ? "Saving..." : "Save"}</Button>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditingAddress(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <p>{order.buyer_address}</p>
          )}
        </div>

        {/* Status actions */}
        <div className="no-print">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Tap to update status — the checkmark shows the current one</p>
            {events.length >= 2 && (
              <button onClick={handleUndo} disabled={updating} className="flex items-center gap-1 text-xs font-bold text-muted-foreground shrink-0">
                <RotateCcw className="w-3.5 h-3.5" /> Undo
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_FLOW.map(({ key, label }) => {
              const isCurrent = status === key;
              return (
                <Button
                  key={key}
                  variant={isCurrent ? "default" : "outline"}
                  disabled={updating || isCurrent}
                  onClick={() => applyStatus(key)}
                  className={isCurrent ? "ring-2 ring-primary ring-offset-1" : ""}
                >
                  {isCurrent ? `✓ ${label}` : label}
                </Button>
              );
            })}
            <Button
              variant="destructive"
              className="col-span-2"
              disabled={updating || status === "cancelled"}
              onClick={handleCancel}
            >
              {status === "cancelled" ? "✓ Cancelled" : "Cancel Order"}
            </Button>
          </div>
        </div>

        {/* Note to customer */}
        <div className="no-print">
          <p className="text-xs text-muted-foreground mb-2">
            Note to customer <span className="text-muted-foreground/70">(optional — shown on their order page, e.g. a delay or logistics update)</span>
          </p>
          <Textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="e.g. Delayed due to road closure on the Lagos–Ibadan expressway — expect an extra 1–2 days."
            className="rounded-2xl min-h-[80px]"
          />
          <div className="flex justify-end mt-2">
            <Button size="sm" className="rounded-full" disabled={noteDraft === (order.admin_note || "") || savingNote} onClick={handleSaveNote}>
              {savingNote ? "Saving..." : "Save note"}
            </Button>
          </div>
        </div>

        {/* Printable packing slip — Temu/Shein/Jumia-style layout */}
        <div id="packing-slip" className="hidden print-only">
          <div style={{ padding: "20px", fontFamily: "sans-serif", color: "#111", maxWidth: "480px" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #111", paddingBottom: "10px", marginBottom: "12px" }}>
              <div>
                <h1 style={{ fontSize: "22px", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>KAT</h1>
                <p style={{ fontSize: "10px", color: "#666", margin: 0 }}>kat.com.ng · {SUPPORT_EMAIL}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "9px", color: "#666", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>Packing Slip</p>
                <p style={{ fontSize: "10px", color: "#666", margin: "2px 0 0" }}>{new Date(order.created_at).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</p>
              </div>
            </div>

            {/* Fake barcode strip + order number, like Temu/Shein slips */}
            <div style={{ textAlign: "center", marginBottom: "14px" }}>
              <div style={{
                height: "36px",
                backgroundImage: "repeating-linear-gradient(90deg, #111 0px, #111 2px, transparent 2px, transparent 5px)",
                margin: "0 auto 4px",
                maxWidth: "260px",
              }} />
              <p style={{ fontSize: "14px", fontWeight: 900, letterSpacing: "2px", margin: 0, fontFamily: "monospace" }}>
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <p style={{ fontSize: "9px", color: "#999", margin: "2px 0 0" }}>Payment ref: {order.payment_ref}</p>
            </div>

            {/* Ship to */}
            <div style={{ border: "1.5px solid #111", borderRadius: "6px", padding: "10px 12px", marginBottom: "12px" }}>
              <p style={{ fontSize: "9px", fontWeight: 700, color: "#666", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "1px" }}>Ship To</p>
              <p style={{ fontWeight: 800, fontSize: "15px", margin: "0 0 2px" }}>{order.buyer_name}</p>
              <p style={{ margin: "0 0 2px", fontSize: "13px" }}>{order.buyer_phone}</p>
              <p style={{ margin: "0 0 2px", fontSize: "13px" }}>{order.buyer_address}</p>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>{order.delivery_area}{order.delivery_state ? `, ${order.delivery_state}` : ""}</p>
            </div>

            {/* Item rows, with thumbnails like Temu/Shein/Jumia slips */}
            {(lines.length ? lines : [order]).map((l) => {
              const prod = productsById[l.product_id];
              const sel = sellersById[l.seller_id];
              const img = prod?.image_url || l.product_image;
              const c = l.variant?.color;
              const sz = l.variant?.size;
              return (
                <div key={l.id} style={{ display: "flex", gap: "10px", border: "1px solid #ddd", borderRadius: "6px", padding: "10px", marginBottom: "8px" }}>
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "4px", border: "1px solid #eee" }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: "13px", margin: "0 0 2px" }}>{prod?.title || l.product_title || "Product"}</p>
                    {(c || sz) && (
                      <p style={{ fontSize: "11px", color: "#666", margin: "0 0 2px" }}>
                        {c ? `Color: ${c}` : ""}{c && sz ? " · " : ""}{sz ? `Size: ${sz}` : ""}
                      </p>
                    )}
                    <p style={{ fontSize: "11px", color: "#666", margin: 0 }}>Sold by {sel?.store_name || sel?.full_name || l.product_seller_name || "KAT seller"}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "11px", color: "#666", margin: 0 }}>Qty</p>
                    <p style={{ fontWeight: 800, fontSize: "15px", margin: 0 }}>{l.quantity}</p>
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "14px", borderTop: "1.5px solid #111", paddingTop: "8px", marginBottom: "16px", marginTop: "4px" }}>
              <span>TOTAL</span>
              <span>{formatNaira(purchase ? purchase.total : order.total)}</span>
            </div>

            {/* QC / handling checklist, like fulfillment-center slips */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#444", borderTop: "1px dashed #ccc", paddingTop: "10px", marginBottom: "14px" }}>
              <span>Packed by: ________________</span>
              <span>Checked by: ________________</span>
            </div>

            <p style={{ fontSize: "10px", color: "#999", textAlign: "center", lineHeight: 1.5, margin: 0 }}>
              Please inspect your item(s) before signing for delivery.<br />
              Questions or issues? Reach us at {SUPPORT_EMAIL}<br />
              <strong>Thank you for shopping with KAT</strong>
            </p>
          </div>
        </div>

        <style>{`
          @media print {
            body * { visibility: hidden; }
            #packing-slip, #packing-slip * { visibility: visible; }
            #packing-slip { display: block !important; position: absolute; top: 0; left: 0; width: 100%; }
            .no-print { display: none !important; }
          }
        `}</style>
      </main>
    </div>
  );
    }
