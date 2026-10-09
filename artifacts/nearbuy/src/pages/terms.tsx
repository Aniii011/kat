import LegalPage, { SUPPORT_EMAIL, type LegalSection } from "@/components/legal-page";

const SECTIONS: LegalSection[] = [
  {
    title: "Agreeing to these terms",
    body: [
      "By creating an account, browsing, buying or selling on KAT (kat.com.ng), you agree to these Terms of Service and to our Privacy Policy. If you do not agree, please do not use KAT.",
    ],
  },
  {
    title: "Who can use KAT",
    body: [
      "You must be at least 18 years old and able to enter into a binding agreement. You are responsible for keeping your sign-in details safe and for everything that happens under your account. Please give accurate information and tell us if you think someone else is using your account.",
    ],
  },
  {
    title: "What KAT is",
    body: [
      "KAT is a marketplace that connects buyers with independent sellers. Sellers are responsible for their products, listings, prices and stock. KAT provides the platform, checkout and order tools. A Verified Seller badge means a seller has been approved to sell on KAT; it is not a guarantee of any particular product.",
    ],
  },
  {
    title: "Orders and payment",
    bullets: [
      "All prices are in Nigerian Naira (₦) and orders are delivered within Nigeria only.",
      "Payments are processed securely by Paystack. KAT does not store your card details.",
      "The delivery fee depends on your state and delivery area and is shown at checkout before you pay.",
      "An order is placed once your payment is confirmed. We may cancel and refund an order if an item is unavailable, a price was shown in error, or we suspect fraud.",
    ],
  },
  {
    title: "Delivery",
    body: [
      "Estimated delivery dates shown on a product are estimates, not guarantees. You can follow your order from placed to delivered in My Orders. Please make sure your phone number and delivery address are correct, because we may not be able to deliver or refund an order sent to an address you entered incorrectly.",
    ],
  },
  {
    title: "Returns and refunds",
    body: ["Most items can be returned within 14 days of delivery, as long as:"],
    bullets: [
      "the item is unworn and in its original condition;",
      "it comes back with its original packaging and tags.",
    ],
  },
  {
    title: "Items that cannot be returned",
    body: ["The following cannot be returned or refunded:"],
    bullets: [
      "Thrift items are non-refundable once payment is complete.",
      "Beauty and health items cannot be returned once opened.",
    ],
  },
  {
    title: "How to return an item",
    body: [
      `Email ${SUPPORT_EMAIL} with your order number to start a return. Approved refunds are processed within 5 to 7 business days.`,
    ],
  },
  {
    title: "Thrift drops",
    body: [
      "Thrift items are pre-loved or vintage and are usually one of a kind. Some thrift items let you pay a deposit to hold the piece for 24 hours. The deposit amount is shown on the item. Please read the item description carefully before you pay, because thrift items are sold as described.",
    ],
  },
  {
    title: "Selling on KAT",
    body: ["If you apply to sell, you agree that you will:"],
    bullets: [
      "be approved by KAT before listing products, and keep your store information accurate;",
      "list only items you have the right to sell, with honest descriptions, photos, prices and stock;",
      "not sell counterfeit, stolen, illegal or unsafe goods;",
      "dispatch orders promptly and handle returns and refunds in line with these terms;",
      "keep buyers' information private and use it only to fulfil their orders.",
    ],
  },
  {
    title: "Seller accounts",
    body: [
      "KAT may remove listings, hold payments linked to a dispute, or suspend a seller who breaks these terms.",
    ],
  },
  {
    title: "Acceptable use",
    body: ["You agree not to:"],
    bullets: [
      "break the law or use KAT to commit fraud;",
      "post reviews or messages that are false, abusive, hateful or misleading;",
      "harass other users or try to take transactions or payments outside KAT to avoid fees or protections;",
      "interfere with the security or normal working of the site, or access accounts and data that are not yours;",
      "copy or scrape KAT in bulk without our written permission.",
    ],
  },
  {
    title: "Your content",
    body: [
      "You keep ownership of the photos, reviews and other content you post on KAT. By posting it, you give KAT a free, non-exclusive licence to display and use it on and for promoting KAT. You promise you have the right to post it and that it does not break anyone else's rights.",
    ],
  },
  {
    title: "Our content and brand",
    body: [
      "The KAT name, logo, design and software belong to KAT or its licensors. You may not copy or reuse them without our permission.",
    ],
  },
  {
    title: "Suspending or closing accounts",
    body: [
      "We may suspend or close an account that breaks these terms or puts other users or KAT at risk. You can ask us to close your account at any time by emailing us.",
    ],
  },
  {
    title: "Our responsibility",
    body: [
      "KAT works hard to keep the platform available and accurate, but it is provided as is. To the extent allowed by Nigerian law, KAT is not liable for the actions of sellers, for items that are not as described by a seller, or for indirect or consequential losses. Nothing in these terms limits any right you have under Nigerian consumer protection law.",
    ],
  },
  {
    title: "Changes to these terms",
    body: [
      "We may update these terms as KAT grows. When we do, we will change the date at the top of this page. If you keep using KAT after a change, you accept the updated terms.",
    ],
  },
  {
    title: "Governing law and contact",
    body: [
      `These terms are governed by the laws of the Federal Republic of Nigeria. Questions? Email ${SUPPORT_EMAIL}.`,
    ],
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="October 8, 2026"
      intro="These terms explain how KAT works for buyers and sellers. Please read them before you shop or sell."
      sections={SECTIONS}
    />
  );
}
