// Run with: npx tsx src/lib/commission.test.ts
// No test framework dependency — plain assertions so this runs anywhere.

import assert from "node:assert";
import { PLATFORM_MARKUP, sellerNet, platformFee } from "./commission";

// The seller always gets back exactly the price they typed (single item), for every price.
for (let sellerPrice = 1; sellerPrice <= 300000; sellerPrice++) {
  const buyerPays = Math.round(sellerPrice * PLATFORM_MARKUP); // how listings are priced
  assert.equal(sellerNet(buyerPays), sellerPrice, `seller price ${sellerPrice}`);
}

// Seller share + KAT share always add up to exactly what the buyer paid: no naira lost or invented.
for (const amount of [0, 1, 99, 1000, 5475, 9308, 10000, 36574, 56049, 123457, 999999]) {
  assert.equal(sellerNet(amount) + platformFee(amount), amount, `split of ${amount}`);
}

// Known values (these are the numbers both screens must show).
assert.equal(sellerNet(10000), 9132);
assert.equal(platformFee(10000), 868);
assert.equal(sellerNet(42049), 38401);       // the ₦5,475 + ₦36,574 test checkout (items only, no delivery)
assert.equal(platformFee(42049), 3648);

// The OLD admin formula was wrong: it said KAT earns 9.5% of what the buyer paid.
assert.notEqual(platformFee(10000), Math.round(10000 * 0.095));
assert.ok(Math.round(10000 * 0.095) - platformFee(10000) === 82);

// Safe on bad input
assert.equal(sellerNet(NaN as any), 0);
assert.equal(platformFee(undefined as any), 0);
assert.equal(platformFee(-0), 0);

console.log("commission.test.ts: all assertions passed");
