// Single place for KAT's support contact. When you move to a custom address
// (e.g. support@kat.com.ng), change SUPPORT_EMAIL here and everything follows.
export const SUPPORT_EMAIL = "supportkat00@gmail.com";

/** Builds a mailto: link with the subject (and optional body) safely encoded. */
export function supportMailto(subject: string, body?: string): string {
  const params = [`subject=${encodeURIComponent(subject)}`];
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${SUPPORT_EMAIL}?${params.join("&")}`;
}
