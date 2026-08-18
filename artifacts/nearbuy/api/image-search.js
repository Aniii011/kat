import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function getGeminiTags(imageBase64, mimeType) {
  const prompt = `Analyze this fashion/product image for a Nigerian fashion marketplace called KAT. Extract search tags: category (Women/Men/Kids/Shoes/Jewelry & Accessories/Beauty & Health/Gym & Outdoor/Home), colors, item type, aesthetics (Y2K/Streetwear/Afrocentric/Minimalist/Baddie/Cottagecore/Boho/Preppy/Luxe/Casual), and key descriptive words.

Respond ONLY in this exact JSON format, no markdown, no code fences, no extra text:
{"tags": ["Women", "Pink", "Dress", "Bodycon", "Baddie", "Casual"]}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } },
          ],
        }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Tag extraction failed");

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  let cleaned = rawText.replace(/```json|```/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed.tags)) throw new Error("No tags found in image");
  return parsed.tags;
}

async function getVisualMatches(imageBase64, mimeType, req) {
  const origin = `https://${req.headers.host}`;
  const embedRes = await fetch(`${origin}/api/generate-embedding`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType }),
  });
  const embedData = await embedRes.json();
  if (!embedRes.ok || !Array.isArray(embedData.embedding)) {
    throw new Error(embedData.error || "Embedding generation failed");
  }

  const { data, error } = await supabase.rpc("match_products_by_image", {
    query_embedding: embedData.embedding,
    match_count: 20,
  });
  if (error) throw new Error(error.message);
  return data || [];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
    const limit = parseInt(process.env.IMAGE_SEARCH_RATE_LIMIT || "5", 10);
  const windowSeconds = parseInt(process.env.IMAGE_SEARCH_RATE_WINDOW_SECONDS || "60", 10);

  const { data: rateData, error: rateError } = await supabase.rpc("check_rate_limit", {
    p_key: `image-search:${ip}`,
    p_window_seconds: windowSeconds,
    p_limit: limit,
  });

  if (rateError) {
    // Fail open: if the rate limiter itself is broken, don't block real users —
    // log it and continue, rather than turning a rate-limit bug into an outage.
    console.error("Rate limit check failed:", rateError);
  } else if (rateData?.[0]?.is_limited) {
    res.setHeader("Retry-After", String(rateData[0].retry_after_seconds));
    return res.status(429).json({ error: "Too many image searches, please try again shortly." });
  }

  const { imageBase64, mimeType } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Missing image data" });
  }

  const [tagsResult, productsResult] = await Promise.allSettled([
    getGeminiTags(imageBase64, mimeType),
    getVisualMatches(imageBase64, mimeType, req),
  ]);

  if (productsResult.status === "rejected") {
    console.error("Visual search failed:", productsResult.reason);
    return res.status(500).json({ error: productsResult.reason.message || "Image search failed" });
  }
  return res.status(200).json({
    tags: tagsResult.status === "fulfilled" ? tagsResult.value : [],
    products: productsResult.value,
  });
    }
