import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { getAuthedUser } from "./_lib/auth.js";
import { sendOrderEmail, purchaseStatus, kindForStatus, reachedKinds, EMAIL_KINDS } from "./_lib/order-email.js";

// Called by the admin order screen right after a status change. The email that
// goes out is decided HERE from the order's real status in the database, never
// from anything the browser claims, so it cannot be used to send a false email.
// Each email type is sent once per purchase (see order-email.js).
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ result: "failed", reason: "Method not allowed" });

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ result: "failed", reason: "Please sign in." });

  const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) return res.status(403).json({ result: "failed", reason: "Admins only." });

  const { orderId, kind: requestedKind } = req.body || {};
  if (typeof orderId !== "string" || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return res.status(400).json({ result: "failed", reason: "Order id is invalid." });
  }

  const { data: one } = await supabaseAdmin.from("orders").select("payment_ref").eq("id", orderId).maybeSingle();
  if (!one) return res.status(404).json({ result: "failed", reason: "Order not found." });
  if (!one.payment_ref) return res.status(200).json({ result: "skipped", reason: "This older order has no payment reference." });

  const { data: rows } = await supabaseAdmin.from("orders").select("admin_status").eq("payment_ref", one.payment_ref);
  if (!rows || rows.length === 0) return res.status(404).json({ result: "failed", reason: "Order not found." });

  const status = purchaseStatus(rows);
  let kind = kindForStatus(status);

  // A retry of one specific email: only allowed for emails this order has actually earned.
  if (requestedKind !== undefined) {
    if (!EMAIL_KINDS.includes(requestedKind) || !reachedKinds(status).includes(requestedKind)) {
      return res.status(400).json({ result: "failed", reason: "That email does not apply to this order's status." });
    }
    kind = requestedKind;
  }
  if (!kind) return res.status(200).json({ result: "skipped", reason: "No email is sent for this status." });

  const outcome = await sendOrderEmail(supabaseAdmin, { paymentRef: one.payment_ref, kind, timeoutMs: 8000 });
  return res.status(200).json(outcome);
    }
