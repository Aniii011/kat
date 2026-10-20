// Stock control for orders that have just been created and paid.
//
// reserve_stock() (see step8-stock.sql) takes stock in one row-locked database step, so two
// buyers can never both get the last unit. A PAID order is never refused or undone here: if
// the unit really was taken by someone else a moment earlier, the order is kept and flagged
// (stock_issue) so the team can contact the buyer or refund. Every failure is swallowed:
// stock bookkeeping must never fail an order that is already paid.
export async function reserveStockForOrders(sb, created) {
  for (const o of created || []) {
    try {
      const { data, error } = await sb.rpc("reserve_stock", {
        p_product: o.product_id,
        p_color: o.variant?.color ?? null,
        p_size: o.variant?.size ?? null,
        p_qty: o.quantity,
      });
      if (error) {
        // Most likely step8-stock.sql has not been run yet. Orders still work exactly as before.
        console.error("reserve_stock unavailable", { orderId: o.id, message: error.message });
        continue;
      }
      if (data && data.ok === false) {
        const left = Number(data.left ?? 0);
        await sb
          .from("orders")
          .update({
            stock_issue: `Sold out at checkout: ${left > 0 ? `only ${left} left` : "none left"} when this paid order was processed. Contact the buyer or refund.`,
          })
          .eq("id", o.id);
      } else if (data && data.tracked) {
        await sb.from("orders").update({ stock_reserved: true }).eq("id", o.id);
      }
    } catch (e) {
      console.error("stock step failed", { orderId: o.id, message: String(e?.message || e) });
    }
  }
}
