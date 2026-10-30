import crypto from "crypto";

// Binds a payment reference to the signed-in buyer, using a server-side secret.
// /api/quote signs { reference, buyerId } for the verified login. The browser puts the
// signature into the payment metadata, and the webhook checks it before creating an
// order. Nobody can sign a different buyer's id without the secret.
function secret() {
  return `kat-buyer-binding:${process.env.PAYSTACK_SECRET_KEY || ""}`;
}

export function signBuyer(reference, buyerId) {
  return crypto.createHmac("sha256", secret()).update(`${reference}:${buyerId}`).digest("hex");
}

export function buyerSigMatches(reference, buyerId, signature) {
  if (typeof reference !== "string" || typeof buyerId !== "string") return false;
  if (typeof signature !== "string" || !/^[0-9a-f]{64}$/.test(signature)) return false;
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(signBuyer(reference, buyerId), "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
    }
