export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { roughName, category, audience, fit, length, material, occasion, colors, aesthetics } = req.body;

  if (!roughName || !roughName.trim()) {
    return res.status(400).json({
      error: "Missing product name",
    });
  }

  const attributeLines = [
    audience && `Audience: ${audience}`,
    category && `Category: ${category}`,
    fit && `Fit: ${fit}`,
    length && `Length: ${length}`,
    material && `Material: ${material}`,
    occasion && `Occasion: ${occasion}`,
    colors && colors.length > 0 && `Colors: ${colors.join(", ")}`,
    aesthetics && aesthetics.length > 0 && `Style: ${aesthetics.join(", ")}`,
  ].filter(Boolean).join("\n");

  const prompt = `You are a product listing copywriter for a Nigerian fashion marketplace called KAT, in the style of Shein/Temu listings.

Seller's rough product name: "${roughName}"

Known attributes:
${attributeLines || "(none provided)"}

Write:
1. A TITLE (max 20 words) following this structure: Audience + Main Product + Key Features + Material + Occasion + Style. Keep it descriptive and keyword-rich like a Shein listing title, but not spammy or absurd.
2. A DESCRIPTION (2-3 short sentences, max 60 words) that is warm, sales-friendly, and highlights how/where to wear it. Do not repeat the title verbatim.

Respond ONLY in this exact JSON format, no markdown, no code fences, no extra text:
{"title": "...", "description": "..."}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);
      return res.status(500).json({ error: data?.error?.message || "AI generation failed" });
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Gemini raw response:", rawText);

    let cleaned = rawText.replace(/```json|```/g, "").trim();

    // Gemini sometimes adds a sentence before/after the JSON despite instructions —
    // pull out just the {...} block instead of assuming the whole string is JSON.
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini response:", rawText);
      return res.status(500).json({ error: "Couldn't parse AI response, please try again" });
    }

    if (!parsed.title || !parsed.description) {
      return res.status(500).json({ error: "AI response was incomplete, please try again" });
    }

    return res.status(200).json({
      title: parsed.title.trim(),
      description: parsed.description.trim(),
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "AI generation failed" });
  }
}
