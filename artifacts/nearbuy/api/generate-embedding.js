export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageUrl, imageBase64, mimeType } = req.body;

  if (!imageUrl && !imageBase64) {
    return res.status(400).json({ error: "Provide either imageUrl or imageBase64" });
  }

  // Jina's API expects the image under the "image" key — either a plain URL
  // or a base64 data URL (data:<mime>;base64,<data>), not raw base64 bytes.
  const imageInput = imageUrl
    ? { image: imageUrl }
    : { image: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` };

  console.log("Jina request debug:", {
    hasImageUrl: Boolean(imageUrl),
    hasBase64: Boolean(imageBase64),
    base64Length: imageBase64 ? imageBase64.length : 0,
    mimeType,
    imageInputPreview: imageUrl ? imageInput.image : imageInput.image.slice(0, 60) + "...",
  });
  
  try {
    const response = await fetch("https://api.jina.ai/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.JINA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "jina-clip-v2",
        dimensions: 768,
        input: [imageInput],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Jina embedding error:", data);
      return res.status(500).json({ error: data?.detail || data?.error?.message || "Embedding generation failed" });
    }

    const embedding = data?.data?.[0]?.embedding;

    if (!Array.isArray(embedding) || embedding.length !== 768) {
      console.error("Unexpected embedding shape from Jina:", embedding?.length);
      return res.status(500).json({ error: "Embedding generation returned an unexpected format" });
    }

    return res.status(200).json({ embedding });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Embedding generation failed" });
  }
}
