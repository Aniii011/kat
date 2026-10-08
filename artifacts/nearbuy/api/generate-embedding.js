import { getAuthedUser } from "./_lib/auth.js";
import { checkRateLimit } from "./_lib/rate-limit.js";
import { embedImage, isHttpsUrl, MAX_IMAGE_BASE64_CHARS } from "./_lib/embedding.js";

// Used when a seller publishes a product, to index its first photo for visual
// search. Requires a signed-in user and is rate limited, because every call
// costs money on the Jina account.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getAuthedUser(req);
  if (!user) return res.status(401).json({ error: "Please sign in." });

  const limit = await checkRateLimit(`generate-embedding:${user.id}`, 60, 3600);
  if (limit.limited) {
    res.setHeader("Retry-After", String(limit.retryAfter));
    return res.status(429).json({ error: "Too many requests. Please try again shortly." });
  }

  const { imageUrl, imageBase64, mimeType } = req.body || {};

  if (imageUrl) {
    if (!isHttpsUrl(imageUrl)) return res.status(400).json({ error: "imageUrl must be an https link." });
  } else if (typeof imageBase64 !== "string" || !imageBase64 || imageBase64.length > MAX_IMAGE_BASE64_CHARS) {
    return res.status(400).json({ error: "Provide a valid imageUrl or imageBase64." });
  }

  try {
    const embedding = await embedImage({ imageUrl, imageBase64, mimeType });
    return res.status(200).json({ embedding });
  } catch (error) {
    console.error("generate-embedding failed", error?.message);
    return res.status(500).json({ error: "Embedding generation failed" });
  }
}
