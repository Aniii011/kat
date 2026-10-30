// KAT's commission maths for the server. This MUST stay identical to src/lib/commission.ts
// (the browser copy used by the admin and seller screens), so both always agree.
//
// The buyer pays the seller's price PLUS 9.5%. Working back from what the BUYER paid:
//   seller keeps   = buyerAmount / 1.095
//   KAT commission = buyerAmount - seller keeps

export const PLATFORM_MARKUP = 1.095;

export function sellerNet(buyerAmount) {
  const amount = Math.round(Number(buyerAmount) || 0);
  return Math.round(amount / PLATFORM_MARKUP);
}

export function platformFee(buyerAmount) {
  const amount = Math.round(Number(buyerAmount) || 0);
  return amount - sellerNet(amount);
}
