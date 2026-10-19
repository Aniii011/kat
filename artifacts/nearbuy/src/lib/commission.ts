// ONE place for KAT's commission maths, used by the admin Finance screens AND the
// seller Earnings screens, so both always show the same numbers.
//
// How KAT earns: the buyer pays the seller's price PLUS 9.5% (listing price =
// Math.round(sellerPrice * 1.095)). The seller keeps exactly the price they typed;
// KAT keeps the difference. So, working back from what the BUYER paid:
//
//   seller keeps  = buyerAmount / 1.095          (NOT buyerAmount * 0.905)
//   KAT commission = buyerAmount - seller keeps   (about 8.68% of the buyer's amount)
//
// Using "buyerAmount * 9.5%" instead would over-count KAT's commission and under-pay
// sellers by about 0.82% (₦82 on every ₦10,000).

export const PLATFORM_MARKUP = 1.095;

/** What the seller keeps from an amount the buyer paid (whole naira). */
export function sellerNet(buyerAmount: number): number {
  const amount = Math.round(Number(buyerAmount) || 0);
  return Math.round(amount / PLATFORM_MARKUP);
}

/** What KAT keeps from an amount the buyer paid (whole naira). */
export function platformFee(buyerAmount: number): number {
  const amount = Math.round(Number(buyerAmount) || 0);
  return amount - sellerNet(amount);
}
