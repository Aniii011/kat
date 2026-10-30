import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { getAuthedUser } from "./_lib/auth.js";
import { OPEN_STATUSES } from "./_lib/gift.js";

// Lists the gifts friends have bought from the signed-in person's own wishlists.
// The gift orders belong to the friends' accounts, so the owner can't read them
// directly. This reads them with the server key, but only for wishlists the
// signed-in user owns, and returns just what the owner needs to see:
// what it is, who it is from, and where it is. No friend email, phone or payment info.
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ ok: false, error: "Please sign in to continue." });

  try {
    const { data: lists, error: listsError } = await supabaseAdmin
      .from("wishlists")
      .select("id, name, emoji")
      .eq("user_id", user.id);
    if (listsError) throw listsError;
    if (!lists || lists.length === 0) return res.status(200).json({ ok: true, gifts: [] });

    const names = Object.fromEntries(lists.map((l) => [l.id, l]));

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id, wishlist_id, product_title, product_image, variant, delivery_cleared, admin_status, created_at")
      .in("wishlist_id", lists.map((l) => l.id))
      .order("created_at", { ascending: false });
    if (ordersError) throw ordersError;

    const gifts = (orders || []).map((o) => {
      const status = o.admin_status || "pending";
      let state;
      if (status === "cancelled") state = "cancelled";
      else if (status === "delivered") state = "delivered";
      else if (status === "out_for_delivery") state = "on_the_way";
      else if (OPEN_STATUSES.includes(status)) state = o.delivery_cleared ? "on_the_way" : "waiting";
      else state = o.delivery_cleared ? "on_the_way" : "waiting";

      return {
        id: o.id,
        wishlistId: o.wishlist_id,
        wishlistName: names[o.wishlist_id]?.name || "Wishlist",
        wishlistEmoji: names[o.wishlist_id]?.emoji || "🎁",
        title: o.product_title || "Gift",
        image: o.product_image || null,
        from: o.variant?.gift?.from || null,
        state,
        createdAt: o.created_at,
      };
    });

    return res.status(200).json({ ok: true, gifts });
  } catch (err) {
    console.error("my-gifts failed", err?.code || err?.message);
    return res.status(500).json({ ok: false, error: "We couldn't load your gifts. Please try again." });
  }
        }
