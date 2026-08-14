export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, mimeType } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Missing image data" });
  }

  const prompt = `Analyze this fashion/product image for a Nigerian fashion marketplace called KAT. Extract search tags: category (Women/Men/Kids/Shoes/Jewelry & Accessories/Beauty & Health/Gym & Outdoor/Home), colors, item type, aesthetics (Y2K/Streetwear/Afrocentric/Minimalist/Baddie/Cottagecore/Boho/Preppy/Luxe/Casual), and key descriptive words.

Respond ONLY in this exact JSON format, no markdown, no code fences, no extra text:
{"tags": ["Women", "Pink", "Dress", "Bodycon", "Baddie", "Casual"]}`;

  try {
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

    if (!response.ok) {
      console.error("Gemini image search error:", data);
      return res.status(500).json({ error: data?.error?.message || "Image search failed" });
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let cleaned = rawText.replace(/```json|```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse image search response:", rawText);
      return res.status(500).json({ error: "Couldn't understand the image, please try again" });
    }

    if (!Array.isArray(parsed.tags)) {
      return res.status(500).json({ error: "No tags found in image" });
    }

    return res.status(200).json({ tags: parsed.tags });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Image search failed" });
  }
  }
