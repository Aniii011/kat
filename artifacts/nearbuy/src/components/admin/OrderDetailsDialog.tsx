import React from "react";
import { X, Phone, MapPin, Store, Package, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatNaira(n: number) { return "₦" + Number(n || 0).toLocaleString("en-NG"); }

export default function OrderDetailsDialog({
  open,
  order,
  onClose,
  onUpdateStatus,
}: {
  open: boolean;
  order: any | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}) {
  if (!open || !order) return null;

  const status = order.admin_status || "pending";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:w-[440px] h-full bg-card overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8)}</p>
            <p className="font-black text-lg">{formatNaira(order.total || order.amount)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <section className="bg-muted rounded-2xl p-4 space-y-1.5">
            <p className="text-xs font-bold text-muted-foreground">Buyer</p>
            <p className="font-bold text-sm">{order.buyer_name || "Unknown"}</p>
            {order.buyer_phone && (
              <a href={`tel:${order.buyer_phone}`} className="flex items-center gap-1.5 text-sm text-primary font-semibold">
                <Phone className="w-3.5 h-3.5" /> {order.buyer_phone}
              </a>
            )}
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {order.buyer_address || "No address on file"}
            </p>
          </section>

          <section className="bg-muted rounded-2xl p-4 space-y-1.5">
            <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Order Info</p>
            <p className="text-sm">Placed: {new Date(order.created_at).toLocaleString()}</p>
            <p className="text-sm">Status: <span className="font-bold capitalize">{status}</span></p>
          </section>

          <section className="flex flex-wrap gap-2 pb-4">
            {status !== "completed" && (
              <Button size="sm" className="rounded-full text-xs" onClick={() => onUpdateStatus(order.id, "completed")}>
                Mark Completed
              </Button>
            )}
            {status !== "cancelled" && (
              <Button size="sm" variant="outline" className="rounded-full text-xs border-destructive/40 text-destructive" onClick={() => onUpdateStatus(order.id, "cancelled")}>
                Cancel Order
              </Button>
            )}
            {status === "cancelled" && (
              <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => onUpdateStatus(order.id, "pending")}>
                Reopen
              </Button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
