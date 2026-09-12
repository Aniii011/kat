import { normalizeStatus, isTerminal, type OrderStatus } from "./order-status";

// Checkout inserts one `orders` row per line item, all sharing one
// `payment_ref`. To the customer this was ONE purchase — possibly from
// several sellers — so we group rows back into a "purchase" for display.
// Rows without a payment_ref (older data) are treated as their own group.

export interface OrderLine {
  id: string;
  created_at: string;
  updated_at?: string | null;
  admin_status: string | null;
  admin_note?: string | null;
  total?: number | null;
  amount?: number | null;
  delivery_fee?: number | null;
  discount_amount?: number | null;
  product_id?: string | null;
  // Snapshot of the product as it was at checkout — see supabase-setup.sql.
  // Only present on orders placed after this column existed; older rows
  // will have these as null and rely purely on the live product join.
  product_title?: string | null;
  product_image?: string | null;
  product_seller_name?: string | null;
  // Real, populated at checkout from `products.seller_id` — safe to group by.
  seller_id?: string | null;
  buyer_address?: string | null;
  quantity?: number | null;
  variant?: { color?: string | null; size?: string | null } | null;
  delivery_area?: string | null;
  delivery_state?: string | null;
  payment_ref?: string | null;
}

export interface ResolvedProduct {
  title: string;
  imageUrl: string | null;
  sellerName: string | null;
}

/**
 * Live product data wins when it exists (it's fresher — a seller may have
 * updated the photo or fixed a typo in the title since purchase). When the
 * product has been edited out of existence, fall back to what was actually
 * true at checkout, captured in the order-time snapshot columns. Only when
 * BOTH are missing (a pre-snapshot order whose product was later deleted —
 * exactly the `#cb7c6012` case) do we fall back to an honest placeholder.
 */
export function resolveProduct(
  line: OrderLine,
  productsById: Record<string, { title: string; image_url?: string | null; sellerName?: string | null }>
): ResolvedProduct {
  const live = line.product_id ? productsById[line.product_id] : undefined;
  if (live) {
    return { title: live.title, imageUrl: live.image_url || null, sellerName: live.sellerName || null };
  }
  if (line.product_title || line.product_image || line.product_seller_name) {
    return {
      title: line.product_title || "Product",
      imageUrl: line.product_image || null,
      sellerName: line.product_seller_name || null,
    };
  }
  return { title: "Product no longer available", imageUrl: null, sellerName: null };
}

export interface PurchaseGroup {
  groupKey: string;
  paymentRef: string | null;
  createdAt: string;
  lines: OrderLine[];
  /** Sum of each line's item total — excludes delivery fee. */
  subtotal: number;
  /** Delivery fee for the whole purchase (checkout writes the same value
   *  onto every line in a batch, so we take one representative value
   *  rather than summing it once per line). */
  deliveryFee: number;
  /** Discount applied, same one-value-per-purchase logic as deliveryFee. */
  discount: number;
  /** What was actually charged: subtotal + delivery − discount. */
  total: number;
  /** Distinct seller count among the lines, when known. */
  sellerCount: number;
  /** The most "urgent"/least-progressed status across all lines — this is
   *  what the purchase-level headline shows, since a customer isn't fully
   *  served until every line has arrived. */
  headlineStatus: OrderStatus;
  allDelivered: boolean;
  anyCancelled: boolean;
  /** When headlineStatus is "cancelled": the most recent updated_at among
   *  the cancelled lines — the actual cancellation date, not the placed
   *  date. Null if unavailable (e.g. status changed outside the app's own
   *  update path, which is the only place that writes updated_at). */
  cancelledAt: string | null;
  /** Real reason, only if an admin actually wrote one via admin_note.
   *  Never a fabricated or generic default. */
  cancelReason: string | null;
}

const STATUS_URGENCY: Record<OrderStatus, number> = {
  pending: 0,
  accepted: 1,
  preparing: 2,
  ready_for_pickup: 2,
  out_for_delivery: 3,
  delivered: 5,
  completed: 5,
  cancelled: 4, // shown, but doesn't mask other lines still moving
};

export function groupOrdersByPurchase(lines: OrderLine[]): PurchaseGroup[] {
  const map = new Map<string, OrderLine[]>();

  for (const line of lines) {
    const key = line.payment_ref || `single:${line.id}`;
    const bucket = map.get(key);
    if (bucket) bucket.push(line);
    else map.set(key, [line]);
  }

  const groups: PurchaseGroup[] = [];
  for (const [groupKey, groupLines] of map) {
    const statuses = groupLines.map((l) => normalizeStatus(l.admin_status));
    const nonCancelled = statuses.filter((s) => s !== "cancelled");
    const allDelivered = nonCancelled.length > 0 && nonCancelled.every((s) => s === "delivered" || s === "completed");
    const anyCancelled = statuses.some((s) => s === "cancelled");
    const allCancelled = statuses.every((s) => s === "cancelled");

    // Headline = least-progressed non-cancelled status, unless everything
    // is cancelled, in which case the headline is "cancelled".
    let headlineStatus: OrderStatus;
    if (allCancelled) {
      headlineStatus = "cancelled";
    } else {
      const relevant = nonCancelled.length ? nonCancelled : statuses;
      headlineStatus = relevant.reduce((least, s) =>
        STATUS_URGENCY[s] < STATUS_URGENCY[least] ? s : least
      , relevant[0]);
    }

    const sellerIds = new Set(groupLines.map((l) => l.seller_id).filter(Boolean));
    const subtotal = groupLines.reduce((sum, l) => sum + Number(l.total ?? l.amount ?? 0), 0);
    const deliveryFee = Number(groupLines[0].delivery_fee ?? 0);
    const discount = Number(groupLines[0].discount_amount ?? 0);

    const cancelledLines = groupLines.filter((l) => normalizeStatus(l.admin_status) === "cancelled");
    const cancelledAt = cancelledLines.length
      ? cancelledLines.reduce((latest, l) => {
          const t = l.updated_at || null;
          return t && (!latest || new Date(t) > new Date(latest)) ? t : latest;
        }, null as string | null)
      : null;
    const cancelReason = cancelledLines.find((l) => l.admin_note)?.admin_note || null;

    groups.push({
      groupKey,
      paymentRef: groupLines[0].payment_ref || null,
      createdAt: groupLines[0].created_at,
      lines: groupLines,
      subtotal,
      deliveryFee,
      discount,
      total: subtotal + deliveryFee - discount,
      sellerCount: sellerIds.size || 1,
      headlineStatus,
      allDelivered,
      anyCancelled,
      cancelledAt,
      cancelReason,
    });
  }

  return groups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function isGroupActive(group: PurchaseGroup) {
  return !group.allDelivered && group.headlineStatus !== "cancelled";
}

// Buckets the real statuses into the coarser stages the Orders list filters
// by. No new statuses invented — just grouping the existing 8 into stages
// a buyer actually thinks in. KAT has no separate "shipped" status, so
// "out_for_delivery" is its own real stage, not a renamed generic one.
export type OrderStage = "processing" | "out_for_delivery" | "delivered" | "cancelled";

export function orderStage(status: OrderStatus): OrderStage {
  switch (status) {
    case "pending":
    case "accepted":
    case "preparing":
    case "ready_for_pickup":
      return "processing";
    case "out_for_delivery":
      return "out_for_delivery";
    case "delivered":
    case "completed":
      return "delivered";
    case "cancelled":
      return "cancelled";
  }
}

export { isTerminal };
