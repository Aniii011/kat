import { supabaseAdmin } from "./supabase-admin.js";

// Returns the signed-in Supabase user for this request, or null.
// The browser sends its session token as "Authorization: Bearer <token>".
// The token is verified by Supabase, so the user id can be trusted.
export async function getAuthedUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}
