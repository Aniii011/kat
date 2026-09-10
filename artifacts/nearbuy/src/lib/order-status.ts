// Single source of truth for order status across the buyer experience.
// Statuses come from `orders.admin_status`, set by sellers/admin.

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled";

export interface StatusMeta {
  /** What the customer sees as the current headline state. */
  label: string;
  /** One calm sentence — what this status means for them right now. */
  message: string;
}

// A single accent is used for "in motion" states to avoid a rainbow of
// status pills. Only two semantic exceptions exist: success (emerald) and
// cancelled (muted red). Everything else reads as "in progress, on track."
export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending: {
    label: "Order placed",
    message: "We've received your order and it's waiting on the seller to confirm.",
  },
  accepted: {
    label: "Confirmed",
    message: "The seller has confirmed your order.",
  },
  preparing: {
    label: "Being prepared",
    message: "Your item is being packed for delivery.",
  },
  ready_for_pickup: {
    label: "Ready for pickup",
    message: "Your item is packed and waiting to be picked up.",
  },
  out_for_delivery: {
    label: "Out for delivery",
    message: "Your order is on its way to you.",
  },
  delivered: {
    label: "Delivered",
    message: "Delivered. We hope you love it.",
  },
  completed: {
    label: "Completed",
    message: "This order is complete.",
  },
  cancelled: {
    label: "Cancelled",
    message: "This order was cancelled and will not be delivered.",
  },
};

// Ordered path used to draw the progress line. "ready_for_pickup" sits
// alongside "preparing" (pickup orders skip delivery, not preparation).
export const STATUS_SEQUENCE: OrderStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export function normalizeStatus(raw: string | null | undefined): OrderStatus {
  return (raw as OrderStatus) || "pending";
}

export function isTerminal(status: OrderStatus) {
  return status === "delivered" || status === "completed" || status === "cancelled";
}

export function currentStepIndex(status: OrderStatus): number {
  const idx = STATUS_SEQUENCE.indexOf(status);
  if (idx !== -1) return idx;
  if (status === "completed") return STATUS_SEQUENCE.length - 1;
  if (status === "ready_for_pickup") return STATUS_SEQUENCE.indexOf("preparing");
  return 0;
}
