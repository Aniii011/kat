// Image -> 768-number embedding via Jina. Shared by /api/generate-embedding
// (seller uploads) and /api/image-search (shopper photo search), so image
// search no longer makes an HTTP call back to its own site.

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const MAX_IMAGE_BASE64_CHARS = 6_000_000; // about 4.5 MB of image data

export function cleanMimeType(mimeType) {
  return ALLOWED_MIME.has(mimeType) ? mimeType : "image/jpeg";
}

export function isHttpsUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && value.length <= 2000;
  } catch {
    return false;
  }
}

export async function embedImage({ imageUrl, imageBase64, mimeType }) {
  const image = imageUrl
    ? imageUrl
    : `data:${cleanMimeType(mimeType)};base64,${imageBase64}`;

  const response = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.JINA_API_KEY}`,
    },
    body: JSON.stringify({ model: "jina-clip-v2", dimensions: 768, input: [{ image }] }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Jina embedding error", response.status);
    throw new Error("Embedding generation failed");
  }

  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length !== 768) {
    throw new Error("Embedding generation returned an unexpected format");
  }
  return embedding;
}
