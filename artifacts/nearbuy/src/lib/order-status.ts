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
  /** Short word/phrase for tight spaces — the list row. */
  label: string;
  /** A full human sentence for the detail page headline. */
  headline: string;
  /** One calm sentence of reassurance/context underneath the headline. */
  message: string;
}

// A single accent is used for "in motion" states to avoid a rainbow of
// status pills. Only two semantic exceptions exist: success (emerald) and
// cancelled (muted red). Everything else reads as "in progress, on track."
export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending: {
    label: "Order placed",
    headline: "Your order has been placed",
    message: "We've let the seller know. They'll confirm it shortly.",
  },
  accepted: {
    label: "Confirmed",
    headline: "Your order has been confirmed",
    message: "The seller has accepted your order and will begin preparing it.",
  },
  preparing: {
    label: "Being prepared",
    headline: "Your order is being prepared",
    message: "The seller is packing your item for delivery.",
  },
  ready_for_pickup: {
    label: "Ready for pickup",
    headline: "Your order is ready for pickup",
    message: "It's packed and waiting for our delivery partner to collect it.",
  },
  out_for_delivery: {
    label: "Out for delivery",
    headline: "Your order is on its way",
    message: "It's out for delivery and should reach you soon.",
  },
  delivered: {
    label: "Delivered",
    headline: "Your order has arrived",
    message: "We hope you love it.",
  },
  completed: {
    label: "Completed",
    headline: "Your order is complete",
    message: "This order has been fulfilled.",
  },
  cancelled: {
    label: "Cancelled",
    headline: "This order was cancelled",
    message: "It will not be delivered.",
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

// Honest delivery-expectation copy. There is no ETA field in the database,
// so this never invents a date or range — it explains what's true right
// now and when a firmer answer will exist.
export function deliveryExpectationCopy(status: OrderStatus): string | null {
  switch (status) {
    case "pending":
      return "Delivery timing will appear here once the seller confirms your order.";
    case "accepted":
    case "preparing":
      return "Your seller is preparing your order. Delivery timing will appear here once it's on its way.";
    case "ready_for_pickup":
      return "Awaiting pickup by our delivery partner.";
    case "out_for_delivery":
      return "On its way to you now.";
    default:
      return null;
  }
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
