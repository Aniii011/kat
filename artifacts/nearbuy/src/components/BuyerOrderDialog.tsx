import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Package, MapPin, CheckCircle2 } from "lucide-react";

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

const WORKFLOW = [
  { key: "pending",          label: "Order Placed" },
  { key: "accepted",         label: "Accepted by Seller" },
  { key: "preparing",        label: "Preparing" },
  { key: "ready_for_pickup", label: "Ready for Pickup" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered",        label: "Delivered" },
  { key: "completed",        label: "Completed" },
];

type Props = {
  open: boolean;
  order: any | null;
  product?: any | null;
  onClose: () => void;
};

export default function BuyerOrderDialog({ open, order, product, onClose }: Props) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!order) return;
    supabase
      .from("order_events")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setEvents(data || []));
  }, [order?.id]);

  if (!order) return null;

  const status = order.admin_status || "pending";
  const isCancelled = status === "cancelled";
  const currentStepIndex = WORKFLOW.findIndex((w) => w.key === status);
  const color = order.variant?.color;
  const size = order.variant?.size;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
              <p className="font-bold truncate">{product?.title || "Product"}</p>
              {(color || size) && (
                <p className="text-sm text-muted-foreground">
                  {color ? `Color: ${color}` : ""}{color && size ? " · " : ""}{size ? `Size: ${size}` : ""}
                </p>
              )}
              <p className="text-sm">Qty: {order.quantity}</p>
              <p className="font-bold text-primary">{formatNaira(order.total)}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-muted p-4 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Delivering to</p>
              <p className="text-sm font-semibold">{order.buyer_address}</p>
              {order.delivery_area && (
                <p className="text-xs text-muted-foreground">{order.delivery_area}, {order.delivery_state}</p>
              )}
            </div>
          </div>

          {isCancelled ? (
            <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">This order was cancelled.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground">Order Status</p>
              {WORKFLOW.map((step, i) => {
                const done = i <= currentStepIndex;
                const evt = events.find((e) => e.status === step.key);
                return (
                  <div key={step.key} className="flex items-center gap-2.5">
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
                    )}
                    <p className={`text-sm flex-1 ${done ? "font-semibold" : "text-muted-foreground"}`}>{step.label}</p>
                    {evt && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(evt.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
                }
