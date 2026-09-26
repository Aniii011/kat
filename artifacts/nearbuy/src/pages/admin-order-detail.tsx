import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { ArrowLeft, Package, Printer, RotateCcw, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_META, type OrderStatus } from "@/lib/order-status";

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
  const [product, setProduct] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [events, setEvents] = useState<{ status: string; created_at: string }[]>([]);
  const [siblingOrders, setSiblingOrders] = useState<any[]>([]);
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

    if (o?.product_id) {
      const { data: p } = await supabase.from("products").select("*").eq("id", o.product_id).maybeSingle();
      setProduct(p);
    }
    if (o?.seller_id) {
      const { data: s } = await supabase.from("profiles").select("*").eq("id", o.seller_id).maybeSingle();
      setSeller(s);
    }
    if (o?.payment_ref) {
      // Other orders that share this same payment — a single checkout can
      // split into several orders when the buyer bought from multiple
      // sellers at once. This is why payment reference and order ID
      // legitimately differ.
      const { data: siblings } = await supabase
        .from("orders")
        .select("id, total, seller_id")
        .eq("payment_ref", o.payment_ref)
        .neq("id", o.id);
      setSiblingOrders(siblings || []);
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

  const status = (order?.admin_status || "pending") as OrderStatus;
  const color = order?.variant?.color;
  const size = order?.variant?.size;

  const applyStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    const { error } = await supabase.from("orders").update({ admin_status: newStatus, updated_at: new Date().toISOString() }).eq("id", order.id);
    if (!error) {
      await supabase.from("order_events").insert({ order_id: order.id, status: newStatus });
      setOrder((prev: any) => ({ ...prev, admin_status: newStatus }));
      setEvents((prev) => [...prev, { status: newStatus, created_at: new Date().toISOString() }]);
    } else {
      alert("Failed to update status: " + error.message);
    }
    setUpdating(false);
  };

  const handleCancel = async () => {
    const reason = window.prompt("This will cancel the order and notify the customer. Please give a reason (required):");
    if (!reason || !reason.trim()) return; // no reason, no cancellation
    setUpdating(true);
    const { error } = await supabase.from("orders").update({
      admin_status: "cancelled",
      admin_note: reason.trim(),
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);
    if (!error) {
      await supabase.from("order_events").insert({ order_id: order.id, status: "cancelled" });
      setOrder((prev: any) => ({ ...prev, admin_status: "cancelled", admin_note: reason.trim() }));
      setNoteDraft(reason.trim());
      setEvents((prev) => [...prev, { status: "cancelled", created_at: new Date().toISOString() }]);
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

  const handleSaveNote = async () => {
    setSavingNote(true);
    await supabase.from("orders").update({ admin_note: noteDraft.trim() }).eq("id", order.id);
    setOrder((prev: any) => ({ ...prev, admin_note: noteDraft.trim() }));
    setSavingNote(false);
  };

  const saveAddressEdit = async () => {
    setSavingAddress(true);
    const { error } = await supabase.from("orders").update({
      buyer_address: addressDraft.trim(),
      buyer_phone: phoneDraft.trim(),
    }).eq("id", order.id);
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
        <Button onClick={() => navigate("/admin")} className="rounded-full">Back to admin</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3 no-print">
        <button onClick={() => navigate("/admin")} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center shrink-0" aria-label="Back to admin">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Order details</p>
          <button onClick={copyRef} className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
            <span className="truncate max-w-[220px]">Order #{order.id.slice(0, 8)} · Payment {order.payment_ref}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-500 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
          </button>
        </div>
        <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs" onClick={() => window.print()}>
          <Printer className="w-3.5 h-3.5" /> Print
        </Button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5 pb-16">
        {siblingOrders.length > 0 && (
          <p className="text-xs text-muted-foreground bg-muted rounded-xl px-3 py-2">
            This payment ({order.payment_ref}) also covers {siblingOrders.length} other order{siblingOrders.length > 1 ? "s" : ""} — the buyer checked out from multiple sellers at once, so each seller's order has its own ID but shares this reference.
          </p>
        )}

        <section className="rounded-2xl bg-muted p-4 flex gap-4">
          {product?.image_url ? (
            <img src={product.image_url} alt={product?.title} className="w-20 h-20 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-background flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="space-y-1 min-w-0">
            <p className="font-bold truncate">{product?.title || "Product unavailable"}</p>
            {(color || size) && (
              <p className="text-sm text-muted-foreground">
                {color ? `Color: ${color}` : ""}{color && size ? " · " : ""}{size ? `Size: ${size}` : ""}
              </p>
            )}
            <p className="text-sm">Qty: {order.quantity}</p>
            <p className="font-bold text-primary">{formatNaira(order.total)}</p>
            {seller && (
              <p className="text-xs text-muted-foreground">Sold by {seller.store_name || seller.full_name}</p>
            )}
          </div>
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
                <p style={{ fontSize: "10px", color: "#666", margin: 0 }}>kat.ng · support@kat.ng</p>
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

            {/* Item row, with thumbnail like Temu/Shein/Jumia slips */}
            <div style={{ display: "flex", gap: "10px", border: "1px solid #ddd", borderRadius: "6px", padding: "10px", marginBottom: "12px" }}>
              {product?.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image_url} alt="" style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "4px", border: "1px solid #eee" }} />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: "13px", margin: "0 0 2px" }}>{product?.title || "Product"}</p>
                {(color || size) && (
                  <p style={{ fontSize: "11px", color: "#666", margin: "0 0 2px" }}>
                    {color ? `Color: ${color}` : ""}{color && size ? " · " : ""}{size ? `Size: ${size}` : ""}
                  </p>
                )}
                <p style={{ fontSize: "11px", color: "#666", margin: 0 }}>Sold by {seller?.store_name || seller?.full_name || "KAT seller"}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "11px", color: "#666", margin: 0 }}>Qty</p>
                <p style={{ fontWeight: 800, fontSize: "15px", margin: 0 }}>{order.quantity}</p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "14px", borderTop: "1.5px solid #111", paddingTop: "8px", marginBottom: "16px" }}>
              <span>TOTAL</span>
              <span>{formatNaira(order.total)}</span>
            </div>

            {/* QC / handling checklist, like fulfillment-center slips */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#444", borderTop: "1px dashed #ccc", paddingTop: "10px", marginBottom: "14px" }}>
              <span>Packed by: ________________</span>
              <span>Checked by: ________________</span>
            </div>

            <p style={{ fontSize: "10px", color: "#999", textAlign: "center", lineHeight: 1.5, margin: 0 }}>
              Please inspect your item(s) before signing for delivery.<br />
              Questions or issues? Reach us at support@kat.ng<br />
              <strong>Thank you for shopping with KAT 💜</strong>
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
