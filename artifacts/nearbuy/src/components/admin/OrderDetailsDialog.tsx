import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, Printer } from "lucide-react";

type Props = {
  open: boolean;
  order: any | null;
  product?: any | null;
  seller?: any | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
};

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-sky-100 text-sky-700",
  preparing: "bg-blue-100 text-blue-700",
  ready_for_pickup: "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-emerald-100 text-emerald-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrderDetailsDialog({
  open,
  order,
  product,
  seller,
  onClose,
  onUpdateStatus,
}: Props) {
  const [updating, setUpdating] = useState(false);

  if (!order) return null;

  const status = order.admin_status || "pending";
  const color = order.variant?.color;
  const size = order.variant?.size;

  const handleClick = async (newStatus: string) => {
    setUpdating(true);
    await onUpdateStatus(order.id, newStatus);
    setUpdating(false);
  };

  const statusButton = (key: string, label: string) => {
    const isCurrent = status === key;
    return (
      <Button
        key={key}
        variant={isCurrent ? "default" : "outline"}
        disabled={updating || isCurrent}
        onClick={() => handleClick(key)}
        className={isCurrent ? "ring-2 ring-primary ring-offset-1" : ""}
      >
        {isCurrent ? `✓ ${label}` : label}
      </Button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            Order #{order.payment_ref || order.id.slice(0, 8)}
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
              {STATUS_LABELS[status] || status}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto rounded-full gap-1.5 text-xs no-print"
              onClick={() => window.print()}
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          {/* Product / variant */}
          <div className="rounded-2xl bg-muted p-4 flex gap-4">
            {product?.image_url ? (
              <img
                src={product.image_url}
                alt={product?.title}
                className="w-20 h-20 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-background flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-muted-foreground" />
              </div>
            )}

            <div className="space-y-1 min-w-0">
              <p className="font-bold truncate">
                {product?.title || "Product unavailable"}
              </p>

              {(color || size) && (
                <p className="text-sm text-muted-foreground">
                  {color ? `Color: ${color}` : ""}{color && size ? " · " : ""}{size ? `Size: ${size}` : ""}
                </p>
              )}

              <p className="text-sm">
                Qty: {order.quantity}
              </p>

              <p className="font-bold text-primary">
                {formatNaira(order.total)}
              </p>

              {seller?.full_name && (
                <p className="text-xs text-muted-foreground">
                  Sold by {seller.full_name}
                </p>
              )}
            </div>
          </div>

          {/* Buyer */}
          <div className="rounded-2xl bg-muted p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Buyer</p>
            <p className="font-bold">{order.buyer_name}</p>
            <a
              href={`tel:${order.buyer_phone}`}
              className="text-primary text-sm block"
            >
              {order.buyer_phone}
            </a>
          </div>

          {/* Delivery */}
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

          {/* Payment Reference */}
          <div className="rounded-2xl bg-muted p-4 no-print">
            <p className="text-xs text-muted-foreground">Payment Reference</p>
            <p className="font-mono text-sm break-all">{order.payment_ref}</p>
          </div>

          {/* Status actions */}
          <div className="no-print">
            <p className="text-xs text-muted-foreground mb-2">Tap to update status — the checkmark shows the current one</p>
            <div className="grid grid-cols-2 gap-2">
              {statusButton("accepted", "Accept")}
              {statusButton("preparing", "Preparing")}
              {statusButton("ready_for_pickup", "Ready")}
              {statusButton("out_for_delivery", "Delivering")}
              {statusButton("delivered", "Delivered")}
              {statusButton("completed", "Complete")}
              <Button
                variant="destructive"
                className="col-span-2"
                disabled={updating || status === "cancelled"}
                onClick={() => handleClick("cancelled")}
              >
                {status === "cancelled" ? "✓ Cancelled" : "Cancel Order"}
              </Button>
            </div>
          </div>

          {/* Printable packing slip — hidden on screen, only shown when printing */}
          <div id="packing-slip" className="hidden print-only">
            <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
              <h1 style={{ fontSize: "20px", fontWeight: 900, marginBottom: "4px" }}>KAT Marketplace</h1>
              <p style={{ fontSize: "12px", color: "#666", marginBottom: "16px" }}>Packing Slip</p>

              <table style={{ width: "100%", marginBottom: "16px" }}>
                <tbody>
                  <tr><td style={{ padding: "2px 0", fontWeight: 700 }}>Order ID:</td><td>#{order.id.slice(0, 8)}</td></tr>
                  <tr><td style={{ padding: "2px 0", fontWeight: 700 }}>Date:</td><td>{new Date(order.created_at).toLocaleDateString()}</td></tr>
                  {/* Only addition in this pass: status wasn't visible on the printed
                      slip before, since it lived in the dialog header which the
                      print stylesheet hides. Nothing else in this block changed. */}
                  <tr><td style={{ padding: "2px 0", fontWeight: 700 }}>Status:</td><td>{STATUS_LABELS[status] || status}</td></tr>
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
              {(color || size) && (
                <p>{color ? `Color: ${color}` : ""}{color && size ? " · " : ""}{size ? `Size: ${size}` : ""}</p>
              )}
              <p>Qty: {order.quantity}</p>
              <p style={{ fontWeight: 700, marginTop: "8px" }}>Total: {formatNaira(order.total)}</p>

              <p style={{ marginTop: "24px", fontSize: "11px", color: "#999", textAlign: "center" }}>
                Thank you for shopping with KAT
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

        </div>
      </DialogContent>
    </Dialog>
  );
}
