import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  order: any | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
};

function formatNaira(n: number) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

export default function OrderDetailsDialog({
  open,
  order,
  onClose,
  onUpdateStatus,
}: Props) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>
            Order #{order.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          <div className="rounded-2xl bg-muted p-4">
            <p className="text-xs text-muted-foreground">Buyer</p>
            <p className="font-bold">{order.buyer_name}</p>

            <div className="grid grid-cols-2 gap-3">

  <div className="rounded-2xl bg-muted p-4">
    <p className="text-xs text-muted-foreground">
      Delivery Area
    </p>

    <p className="font-bold">
      {order.delivery_area || "Not assigned"}
    </p>
  </div>


  <div className="rounded-2xl bg-muted p-4">
    <p className="text-xs text-muted-foreground">
      Delivery Fee
    </p>

    <p className="font-bold text-primary">
      {formatNaira(order.delivery_fee)}
    </p>
  </div>

</div>

            <a
              href={`tel:${order.buyer_phone}`}
              className="text-primary text-sm"
            >
              {order.buyer_phone}
            </a>
          </div>

          <div className="rounded-2xl bg-muted p-4">
            <p className="text-xs text-muted-foreground">
              Delivery Address
            </p>

            <p>{order.buyer_address}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">

            <div className="rounded-2xl bg-muted p-4">
              <p className="text-xs text-muted-foreground">
                Quantity
              </p>

              <p className="font-bold">
                {order.quantity}
              </p>
            </div>

            <div className="rounded-2xl bg-muted p-4">
              <p className="text-xs text-muted-foreground">
                Total
              </p>

              <p className="font-bold text-primary">
                {formatNaira(order.total)}
              </p>
            </div>

          </div>

          <div className="rounded-2xl bg-muted p-4">
            <p className="text-xs text-muted-foreground">
              Payment Reference
            </p>

            <p className="font-mono text-sm break-all">
              {order.payment_ref}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">

            <Button
              onClick={() => onUpdateStatus(order.id, "accepted")}
            >
              Accept
            </Button>

            <Button
              variant="outline"
              onClick={() => onUpdateStatus(order.id, "preparing")}
            >
              Preparing
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                onUpdateStatus(order.id, "ready_for_pickup")
              }
            >
              Ready
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                onUpdateStatus(order.id, "out_for_delivery")
              }
            >
              Delivering
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                onUpdateStatus(order.id, "delivered")
              }
            >
              Delivered
            </Button>

            <Button
              onClick={() =>
                onUpdateStatus(order.id, "completed")
              }
            >
              Complete
            </Button>

            <Button
              variant="destructive"
              className="col-span-2"
              onClick={() =>
                onUpdateStatus(order.id, "cancelled")
              }
            >
              Cancel Order
            </Button>

          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
              }
