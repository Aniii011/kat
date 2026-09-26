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

  const isAdmin = user?.isAdmin;

  const load = async () => {
    if (!orderId) return;
    setLoading(true);
    const { data: o } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    setOrder(o);
    setNoteDraft(o?.admin_note || "");

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
          <p className="text-xs text-muted-foreground">Delivery Address</p>
          <p>{order.buyer_address}</p>
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

        {/* Printable packing slip */}
        <div id="packing-slip" className="hidden print-only">
          <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
            <h1 style={{ fontSize: "20px", fontWeight: 900, marginBottom: "4px" }}>KAT Marketplace</h1>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "16px" }}>Packing Slip</p>
            <table style={{ width: "100%", marginBottom: "16px" }}>
              <tbody>
                <tr><td style={{ padding: "2px 0", fontWeight: 700 }}>Order ID:</td><td>#{order.id.slice(0, 8)}</td></tr>
                <tr><td style={{ padding: "2px 0", fontWeight: 700 }}>Date:</td><td>{new Date(order.created_at).toLocaleDateString()}</td></tr>
                <tr><td style={{ padding: "2px 0", fontWeight: 700 }}>Status:</td><td>{STATUS_META[status]?.label || status}</td></tr>
              </tbody>
            </table>
            <div style={{ borderTop: "1px solid #ccc", borderBottom: "1px solid #ccc", padding: "12px 0", marginBottom: "16px" }}>
              <p style={{ fontWeight: 700, marginBottom: "4px" }}>DELIVER TO:</p>
              <p style={{ fontWeight: 700, fontSize: "16px" }}>{order.buyer_name}</p>
              <p>{order.buyer_phone}</p>
              <p>{order.buyer_address}</p>
              <p>{order.delivery_area}{order.delivery_state ? `, ${order.delivery_state}` : ""}</p>
            </div>
            <p style={{ fontWeight: 700, marginBottom: "4px" }}>ITEM:</p>
            <p>{product?.title || "Product"}</p>
            {(color || size) && <p>{color ? `Color: ${color}` : ""}{color && size ? " · " : ""}{size ? `Size: ${size}` : ""}</p>}
            <p>Qty: {order.quantity}</p>
            <p style={{ fontWeight: 700, marginTop: "8px" }}>Total: {formatNaira(order.total)}</p>
            <p style={{ marginTop: "24px", fontSize: "11px", color: "#999", textAlign: "center" }}>Thank you for shopping with KAT</p>
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
