import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

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

export default function OrderDetailsDialog({
  open,
  order,
  product,
  seller,
  onClose,
  onUpdateStatus,
}: Props) {
  if (!order) return null;

  const color = order.variant?.color;
  const size = order.variant?.size;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Order #{order.id.slice(0, 8)}
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

          <div className="rounded-2xl bg-muted p-4">
            <p className="text-xs text-muted-foreground">Payment Reference</p>
            <p className="font-mono text-sm break-all">{order.payment_ref}</p>
          </div>

          {/* Status actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => onUpdateStatus(order.id, "accepted")}>Accept</Button>
            <Button variant="outline" onClick={() => onUpdateStatus(order.id, "preparing")}>Preparing</Button>
            <Button variant="outline" onClick={() => onUpdateStatus(order.id, "ready_for_pickup")}>Ready</Button>
            <Button variant="outline" onClick={() => onUpdateStatus(order.id, "out_for_delivery")}>Delivering</Button>
            <Button variant="outline" onClick={() => onUpdateStatus(order.id, "delivered")}>Delivered</Button>
            <Button onClick={() => onUpdateStatus(order.id, "completed")}>Complete</Button>
            <Button
              variant="destructive"
              className="col-span-2"
              onClick={() => onUpdateStatus(order.id, "cancelled")}
            >
              Cancel Order
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
