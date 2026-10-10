import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { getAuthedUser } from "./_lib/auth.js";
import { checkRateLimit } from "./_lib/rate-limit.js";

// Checks a coupon code for the checkout "Apply" button.
//
// Coupons used to be readable by everyone from the browser, which meant anyone
// could list every active code. Now the browser can only ask "is THIS code
// valid?", and the answer is rate limited so codes can't be guessed in bulk.
// (The real discount is re-checked again in pricing.js when the order is paid.)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ ok: false, error: "Please sign in to use a coupon." });

  const limit = await checkRateLimit(`coupon:${user.id}`, 15, 600);
  if (limit.limited) {
    res.setHeader("Retry-After", String(limit.retryAfter));
    return res.status(429).json({ ok: false, error: "Too many attempts. Please wait a few minutes and try again." });
  }

  const code = String(req.body?.code || "").trim().toUpperCase().slice(0, 40);
  const subtotal = Number(req.body?.subtotal) || 0;
  if (!code) return res.status(400).json({ ok: false, error: "Enter a coupon code." });

  const { data, error } = await supabaseAdmin
    .from("coupons")
    .select("id, code, discount_type, discount_value, expires_at, usage_limit, times_used, min_order_amount")
    .eq("code", code)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return res.status(200).json({ ok: false, error: "Invalid or expired coupon code." });
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return res.status(200).json({ ok: false, error: "This coupon has expired." });
  }
  if (data.usage_limit && (data.times_used || 0) >= data.usage_limit) {
    return res.status(200).json({ ok: false, error: "This coupon has reached its usage limit." });
  }
  if (data.min_order_amount && subtotal < data.min_order_amount) {
    return res.status(200).json({
      ok: false,
      error: `This code requires a minimum order of ₦${Number(data.min_order_amount).toLocaleString("en-NG")}.`,
    });
  }

  return res.status(200).json({
    ok: true,
    coupon: {
      id: data.id,
      code: data.code,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
    },
  });
}
