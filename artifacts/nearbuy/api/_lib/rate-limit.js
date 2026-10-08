import { supabaseAdmin } from "./supabase-admin.js";

// Uses the same check_rate_limit() database function that image-search already
// relies on, so limits survive across serverless instances.
// If the check itself fails we let the request through (and log it) rather
// than taking the feature down.
export async function checkRateLimit(key, limit, windowSeconds) {
  const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_limit: limit,
  });

  if (error) {
    console.error("rate limit check failed", error.code);
    return { limited: false };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row?.is_limited
    ? { limited: true, retryAfter: Number(row.retry_after_seconds) || windowSeconds }
    : { limited: false };
}
