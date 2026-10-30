import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { getAuthedUser } from "./_lib/auth.js";
import { sellerNet, platformFee } from "./_lib/commission.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAYABLE = ["delivered", "completed"];

// Admin only. Records that KAT has paid a store for ALL of its delivered orders that are not
// yet paid. The browser only names the store (and an optional note). Which orders are owed,
// and the amounts, are worked out here from the database, then re-checked inside the
// database function record_payout(), which marks the orders paid in the same step.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ ok: false, error: "Please sign in to continue." });

  const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) return res.status(403).json({ ok: false, error: "Admins only." });

  const storeId = req.body?.storeId;
  if (!UUID.test(String(storeId || ""))) return res.status(400).json({ ok: false, error: "Choose a store to pay." });
  const note = String(req.body?.note ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 300);

  try {
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id, total, amount")
      .eq("store_id", storeId)
      .is("payout_id", null)
      .in("admin_status", PAYABLE);
    if (ordersError) throw ordersError;

    if (!orders || orders.length === 0) {
      return res.status(400).json({ ok: false, error: "Nothing is owed to this store right now." });
    }

    const gross = orders.reduce((sum, o) => sum + Number(o.total ?? o.amount ?? 0), 0);
    if (!(gross > 0)) return res.status(400).json({ ok: false, error: "Nothing is owed to this store right now." });

    const amount = sellerNet(gross);
    const commission = platformFee(gross);
    if (!(amount > 0)) return res.status(400).json({ ok: false, error: "Nothing is owed to this store right now." });

    const { data: payoutId, error: rpcError } = await supabaseAdmin.rpc("record_payout", {
      p_store_id: storeId,
      p_order_ids: orders.map((o) => o.id),
      p_gross: gross,
      p_commission: commission,
      p_amount: amount,
      p_note: note,
      p_paid_by: user.id,
    });

    if (rpcError) {
      const changed = /changed or were already paid/i.test(rpcError.message || "");
      console.error("record-payout failed", { storeId, message: rpcError.message });
      return res.status(changed ? 409 : 500).json({
        ok: false,
        error: changed
          ? "These orders changed or were already paid. Please refresh and try again."
          : "We couldn't record this payout. Nothing was saved. Please try again.",
      });
    }

    return res.status(200).json({ ok: true, payoutId, amount, commission, gross, orderCount: orders.length });
  } catch (err) {
    console.error("record-payout error", err?.message);
    return res.status(500).json({ ok: false, error: "We couldn't record this payout. Nothing was saved. Please try again." });
  }
      }
