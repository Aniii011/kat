export default async function handler(req: any, res: any) {
  const { reference } = req.body;

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (data.status && data.data.status === "success") {
      return res.status(200).json({
        verified: true,
        payment: data.data,
      });
    }

    return res.status(400).json({
      verified: false,
    });

  } catch (error) {
    return res.status(500).json({
      verified: false,
      error: "Verification failed",
    });
  }
}
