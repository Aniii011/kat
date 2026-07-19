export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { reference } = req.body;

  if (!reference) {
    return res.status(400).json({
      verified: false,
      error: "Missing payment reference",
    });
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    console.log("Paystack verify:", data);

    if (data.status && data.data?.status === "success") {
      return res.status(200).json({
        verified: true,
        payment: data.data,
      });
    }

    return res.status(200).json({
      verified: false,
      payment: data.data,
    });

  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      verified: false,
      error: error.message || "Verification failed",
    });
  }
}
