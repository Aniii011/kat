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

  const { imageBase64, mimeType } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Missing image data" });
  }

  // Tags (for UI display) and visual search (for actual results) run
  // independently — tags never affect which products are returned.
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
