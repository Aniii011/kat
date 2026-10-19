// Customer order emails: Order confirmed, On its way, Delivered, Cancelled.
//
// Safety rules:
//  * Each email goes out ONCE per purchase. The order_emails table has a unique
//    (payment_ref, kind) pair, so a retry, a double click or the webhook racing the
//    browser can never send a duplicate.
//  * Sending never breaks anything else. Every failure is caught and recorded.
//  * Gift orders email the person who PAID. The recipient's address and phone are
//    never put in an email.
//  * Everything that came from a user (names, product titles, notes) is HTML-escaped.
//
// Needs these environment variables in Vercel:
//   RESEND_API_KEY   your Resend API key
//   EMAIL_FROM       optional, default  KAT <orders@kat.com.ng>
//   SITE_URL         optional, default  https://www.kat.com.ng

const SITE_URL = () => (process.env.SITE_URL || "https://www.kat.com.ng").replace(/\/$/, "");
const SUPPORT_EMAIL = "support@kat.com.ng";
const FROM = () => process.env.EMAIL_FROM || "KAT <orders@kat.com.ng>";

export const EMAIL_KINDS = ["placed", "out_for_delivery", "delivered", "cancelled"];

// Same ordering the admin screens use: the purchase headline is its least-progressed live item.
const URGENCY = { pending: 0, accepted: 1, preparing: 2, ready_for_pickup: 2, out_for_delivery: 3, delivered: 5, completed: 5 };

export function purchaseStatus(rows) {
  const statuses = rows.map((r) => r.admin_status || "pending");
  if (statuses.every((s) => s === "cancelled")) return "cancelled";
  const live = statuses.filter((s) => s !== "cancelled");
  return live.reduce((least, s) => ((URGENCY[s] ?? 0) < (URGENCY[least] ?? 0) ? s : least), live[0]);
}

// Which email (if any) does this purchase status call for right now?
export function kindForStatus(status) {
  if (status === "out_for_delivery") return "out_for_delivery";
  if (status === "delivered" || status === "completed") return "delivered";
  if (status === "cancelled") return "cancelled";
  return null;
}

// Emails that have genuinely been "earned" by this status (used to validate a retry).
export function reachedKinds(status) {
  const kinds = ["placed"];
  if (["out_for_delivery", "delivered", "completed"].includes(status)) kinds.push("out_for_delivery");
  if (["delivered", "completed"].includes(status)) kinds.push("delivered");
  if (status === "cancelled") kinds.push("cancelled");
  return kinds;
}

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const naira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG");
const firstWord = (s) => String(s || "").trim().split(/\s+/)[0] || "";

function summarise(rows) {
  const first = rows[0];
  const subtotal = rows.reduce((s, r) => s + Number(r.total ?? r.amount ?? 0), 0);
  const deliveryFee = Number(first.delivery_fee ?? 0);
  const discount = Number(first.discount_amount ?? 0);
  return {
    subtotal,
    deliveryFee,
    discount,
    total: subtotal + deliveryFee - discount,
    isGift: rows.some((r) => !!r.variant?.gift),
  };
}

const COPY = {
  placed: {
    subject: (ref) => `Order confirmed — ${ref}`,
    heading: "Thank you! Your order is confirmed",
    lead: "We've received your payment and your order is being processed. We'll email you again when it's on its way.",
  },
  out_for_delivery: {
    subject: (ref) => `Your order is on its way — ${ref}`,
    heading: "Your order is on its way",
    lead: "It's out for delivery and should reach you soon. Please keep your phone close so our rider can reach you.",
  },
  delivered: {
    subject: (ref) => `Your order has arrived — ${ref}`,
    heading: "Your order has arrived",
    lead: "We hope you love it. If anything isn't right, just reply to this email and we'll help.",
  },
  cancelled: {
    subject: (ref) => `Your order was cancelled — ${ref}`,
    heading: "Your order was cancelled",
    lead: "This order will not be delivered. If you were charged, reply to this email with your order number and we'll sort it out.",
  },
};

export function buildEmail({ kind, rows, greetingName }) {
  const copy = COPY[kind];
  const first = rows[0];
  const sum = summarise(rows);
  const ref = first.payment_ref ? String(first.payment_ref).replace(/^KAT-/, "#") : `#${String(first.id).slice(0, 8)}`;
  const hello = greetingName ? `Hi ${esc(greetingName)},` : "Hi there,";

  const itemRows = rows
    .map((r) => {
      const img = typeof r.product_image === "string" && /^https:\/\//.test(r.product_image) ? r.product_image : null;
      const opts = [r.variant?.color ? `Color: ${r.variant.color}` : "", r.variant?.size ? `Size: ${r.variant.size}` : ""].filter(Boolean).join(" · ");
      return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;width:64px;vertical-align:top">${
          img
            ? `<img src="${esc(img)}" width="56" height="56" alt="" style="border-radius:8px;object-fit:cover;display:block">`
            : `<div style="width:56px;height:56px;border-radius:8px;background:#f1ede7"></div>`
        }</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;vertical-align:top;font-size:14px;color:#222">
          <strong>${esc(r.product_title || "Item")}</strong>
          ${opts ? `<br><span style="color:#777;font-size:12px">${esc(opts)}</span>` : ""}
          <br><span style="color:#777;font-size:12px">Qty ${esc(r.quantity ?? 1)}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;vertical-align:top;text-align:right;font-size:14px;color:#222;white-space:nowrap">${naira(r.total ?? r.amount)}</td>
      </tr>`;
    })
    .join("");

  const deliveryBlock = sum.isGift
    ? `<p style="margin:0;font-size:14px;color:#222"><strong>Gift for ${esc(firstWord(first.buyer_name) || "your friend")}</strong><br><span style="color:#777;font-size:12px">Delivered to their saved address, which stays private.</span></p>`
    : `<p style="margin:0;font-size:14px;color:#222"><strong>${esc(first.buyer_name || "")}</strong><br>${esc(first.buyer_address || "")}${
        first.delivery_area ? `<br><span style="color:#777;font-size:12px">${esc([first.delivery_area, first.delivery_state].filter(Boolean).join(", "))}</span>` : ""
      }</p>`;

  const cancelReason =
    kind === "cancelled" && first.admin_note
      ? `<p style="margin:16px 0 0;padding:12px 14px;background:#fafafa;border-radius:8px;font-size:14px;color:#222"><strong>Reason:</strong> ${esc(first.admin_note)}</p>`
      : "";

  const html = `<!doctype html>
<html><body style="margin:0;background:#f4f1ec;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
        <tr><td style="background:#111;padding:18px 24px;color:#c9a97c;font-size:20px;font-weight:800;letter-spacing:2px">KAT</td></tr>
        <tr><td style="padding:28px 24px 8px">
          <h1 style="margin:0 0 8px;font-size:22px;color:#111">${esc(copy.heading)}</h1>
          <p style="margin:0 0 4px;font-size:14px;color:#555">${hello}</p>
          <p style="margin:0;font-size:14px;color:#555;line-height:1.5">${esc(copy.lead)}</p>
          ${cancelReason}
          <p style="margin:18px 0 0;font-size:12px;color:#888">Order <strong style="color:#222;font-family:monospace">${esc(ref)}</strong></p>
        </td></tr>
        <tr><td style="padding:8px 24px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;font-size:14px;color:#444">
            <tr><td style="padding:3px 0">Subtotal</td><td style="text-align:right">${naira(sum.subtotal)}</td></tr>
            <tr><td style="padding:3px 0">Delivery</td><td style="text-align:right">${naira(sum.deliveryFee)}</td></tr>
            ${sum.discount > 0 ? `<tr><td style="padding:3px 0">Discount</td><td style="text-align:right">-${naira(sum.discount)}</td></tr>` : ""}
            <tr><td style="padding:8px 0 0;font-weight:800;color:#111;font-size:15px">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:800;color:#111;font-size:15px">${naira(sum.total)}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 24px 4px">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#888">Delivering to</p>
          ${deliveryBlock}
        </td></tr>
        <tr><td style="padding:22px 24px 8px" align="left">
          <a href="${esc(SITE_URL())}/orders" style="display:inline-block;background:#c9a97c;color:#111;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px">View my order</a>
        </td></tr>
        <tr><td style="padding:18px 24px 26px;font-size:12px;color:#999;line-height:1.5">
          Questions? Reply to this email or write to ${esc(SUPPORT_EMAIL)}.<br>KAT, Nigeria's fashion and lifestyle marketplace.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    copy.heading,
    "",
    hello.replace(/&[a-z#0-9]+;/g, ""),
    copy.lead,
    kind === "cancelled" && first.admin_note ? `Reason: ${first.admin_note}` : "",
    "",
    `Order ${ref}`,
    ...rows.map((r) => `- ${r.product_title || "Item"} x${r.quantity ?? 1}: ${naira(r.total ?? r.amount)}`),
    `Subtotal: ${naira(sum.subtotal)}`,
    `Delivery: ${naira(sum.deliveryFee)}`,
    sum.discount > 0 ? `Discount: -${naira(sum.discount)}` : "",
    `Total: ${naira(sum.total)}`,
    "",
    sum.isGift ? `Gift for ${firstWord(first.buyer_name) || "your friend"} (their address stays private)` : `Delivering to: ${first.buyer_name || ""}, ${first.buyer_address || ""}`,
    "",
    `View your order: ${SITE_URL()}/orders`,
    `Questions? ${SUPPORT_EMAIL}`,
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");

  return { subject: copy.subject(ref), html, text };
}

// Take the right to send this email. Returns true only for the ONE caller that wins.
async function claim(sb, paymentRef, kind) {
  const { error } = await sb.from("order_emails").insert({ payment_ref: paymentRef, kind, status: "sending" });
  if (!error) return { ok: true };
  if (error.code !== "23505") return { ok: false, reason: "email log unavailable (run step6-order-emails.sql)" };

  const { data: row } = await sb
    .from("order_emails")
    .select("status, created_at")
    .eq("payment_ref", paymentRef)
    .eq("kind", kind)
    .maybeSingle();

  // A previous attempt failed: one caller may retry it.
  if (row?.status === "failed") {
    const { data: won } = await sb
      .from("order_emails")
      .update({ status: "sending", error: null })
      .eq("payment_ref", paymentRef).eq("kind", kind).eq("status", "failed")
      .select("payment_ref");
    return won && won.length ? { ok: true } : { ok: false, reason: "already handled" };
  }
  // Stuck in "sending" for over 2 minutes (the function died): allow one retry.
  if (row?.status === "sending" && Date.now() - new Date(row.created_at).getTime() > 120000) {
    const { data: won } = await sb
      .from("order_emails")
      .update({ created_at: new Date().toISOString() })
      .eq("payment_ref", paymentRef).eq("kind", kind).eq("status", "sending").eq("created_at", row.created_at)
      .select("payment_ref");
    return won && won.length ? { ok: true } : { ok: false, reason: "already handled" };
  }
  return { ok: false, reason: "already sent" };
}

async function deliver({ to, subject, html, text, idempotencyKey, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({ from: FROM(), to: [to], reply_to: SUPPORT_EMAIL, subject, html, text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.name === "AbortError" ? "Timed out sending" : String(e?.message || e).slice(0, 200) };
  } finally {
    clearTimeout(timer);
  }
}

// Returns { result: "sent" | "skipped" | "failed", reason? } and never throws.
export async function sendOrderEmail(sb, { paymentRef, kind, timeoutMs = 6000 }) {
  try {
    if (!EMAIL_KINDS.includes(kind)) return { result: "skipped", reason: "unknown email type" };
    if (!process.env.RESEND_API_KEY) return { result: "skipped", reason: "email is not configured yet (RESEND_API_KEY missing)" };

    const { data: rows, error } = await sb.from("orders").select("*").eq("payment_ref", paymentRef).order("created_at", { ascending: true });
    if (error || !rows || rows.length === 0) return { result: "skipped", reason: "order not found" };

    const buyerId = rows[0].buyer_id;
    if (!buyerId) return { result: "skipped", reason: "order has no buyer account" };
    const { data: userData } = await sb.auth.admin.getUserById(buyerId);
    const to = userData?.user?.email;
    if (!to) return { result: "skipped", reason: "buyer has no email address" };

    const claimed = await claim(sb, paymentRef, kind);
    if (!claimed.ok) return { result: "skipped", reason: claimed.reason };

    const meta = userData.user.user_metadata || {};
    const greetingName = firstWord(meta.full_name || meta.name) || (rows.some((r) => r.variant?.gift) ? "" : firstWord(rows[0].buyer_name));
    const { subject, html, text } = buildEmail({ kind, rows, greetingName });

    const sent = await deliver({ to, subject, html, text, idempotencyKey: `${paymentRef}:${kind}`, timeoutMs });
    if (sent.ok) {
      await sb.from("order_emails").update({ status: "sent", to_email: to, sent_at: new Date().toISOString(), error: null })
        .eq("payment_ref", paymentRef).eq("kind", kind);
      return { result: "sent" };
    }
    console.error("order email failed", { paymentRef, kind, error: sent.error });
    await sb.from("order_emails").update({ status: "failed", to_email: to, error: sent.error })
      .eq("payment_ref", paymentRef).eq("kind", kind);
    return { result: "failed", reason: sent.error };
  } catch (e) {
    console.error("order email crashed", { paymentRef, kind, message: String(e?.message || e) });
    return { result: "failed", reason: "unexpected error" };
  }
             }
