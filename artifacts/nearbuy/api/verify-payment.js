export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { reference, expectedAmount } = req.body;

  if (!reference) {
    return res.status(400).json({
      verified: false,
      error: "Missing payment reference",
    });
  }

  // FIX: expectedAmount (in kobo — same unit Checkout sends to Paystack) is
  // now required. Without this, the endpoint could only confirm "a successful
  // Paystack transaction exists for this reference" — not that it was for the
  // amount KAT actually expected. Since Checkout computes and sends `amount`
  // to Paystack entirely client-side, a tampered client could complete a
  // legitimate low-value charge and still get `verified: true` back here,
  // after which full-price orders would be created. Requiring and checking
  // the expected amount server-side closes that gap.
  if (typeof expectedAmount !== "number" || expectedAmount <= 0) {
    return res.status(400).json({
      verified: false,
      error: "Missing or invalid expected amount",
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

    // FIX: previously logged the full Paystack response, which can include
    // card/authorization metadata. Log only what's needed to debug a failed
    // verification.
    console.log("Paystack verify:", {
      reference,
      status: data.data?.status,
      amount: data.data?.amount,
    });

    const paystackOk = Boolean(data.status);
    const statusSuccess = data.data?.status === "success";
    // FIX: cross-check the reference actually returned by Paystack against
    // the one requested, rather than assuming the API always scopes
    // correctly.
    const referenceMatches = data.data?.reference === reference;
    // FIX: the core missing check — the amount Paystack actually confirms
    // as paid must equal what Checkout expected to charge.
    const amountMatches = data.data?.amount === expectedAmount;

    if (paystackOk && statusSuccess && referenceMatches && amountMatches) {
      return res.status(200).json({
        verified: true,
        payment: data.data,
      });
    }

    // Distinguish *why* verification failed so Checkout can show something
    // more useful than a generic error, and so this is debuggable from logs
    // without needing to guess.
    let reason = "Payment verification failed";
    if (!statusSuccess) reason = "Payment was not successful";
    else if (!referenceMatches) reason = "Payment reference mismatch";
    else if (!amountMatches) reason = "Payment amount does not match expected order total";

    return res.status(200).json({
      verified: false,
      reason,
      payment: data.data,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      verified: false,
      error: error.message || "Verification failed",
    });
  }
        }
