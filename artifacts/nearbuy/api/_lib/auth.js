import { supabaseAdmin } from "./supabase-admin.js";

// Returns the signed-in Supabase user for this request, or null.
// The browser sends its session token as "Authorization: Bearer <token>".
// The token is verified by Supabase, so the user id can be trusted.
//
// Banned accounts (profiles.is_banned) are treated as signed out, so every API
// endpoint that calls this refuses them. verify-payment passes { allowBanned: true }
// so someone who already paid before being banned is never left with a payment
// and no order.
export async function getAuthedUser(req, { allowBanned = false } = {}) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;

  const user = data.user;
  if (allowBanned) return user;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    // If the check itself fails, don't take every feature down; log it and carry on.
    console.error("ban check failed", profileError.code);
    return user;
  }

  return profile?.is_banned ? null : user;
}
