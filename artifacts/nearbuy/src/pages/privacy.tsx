import LegalPage, { SUPPORT_EMAIL, type LegalSection } from "@/components/legal-page";

const SECTIONS: LegalSection[] = [
  {
    title: "Who we are",
    body: [
      "KAT (kat.com.ng) is an online marketplace where people in Nigeria can browse and buy fashion, beauty and lifestyle products from independent sellers, including thrift and pre-loved items. This policy explains what personal information KAT collects, why we collect it, and the choices you have.",
      `If you have any question about this policy or your information, contact us at ${SUPPORT_EMAIL}.`,
    ],
  },
  {
    title: "Information we collect",
    body: ["Depending on how you use KAT, we collect:"],
    bullets: [
      "Account details: your name, email address and profile picture. If you sign in with Google, Google shares your name, email address and profile picture with us. We never receive your Google password.",
      "Order and delivery details: your full name, phone number, delivery address, state and delivery area, the items you order, and the amounts paid.",
      "Payment confirmation: payments are handled by Paystack. We receive a payment reference and the payment status, but we never see or store your full card details.",
      "Seller details: if you apply to sell, your store name, store description and category, and the product listings and photos you upload.",
      "Content you create: reviews, saved items, wishlists and boards, followed stores, and messages you send through KAT.",
      "Photos you upload for image search: when you search with a picture, the image is processed so we can find similar products.",
      "Basic device data: KAT stores your sign-in session and your theme choice in your browser's local storage so you stay signed in and your settings are remembered.",
    ],
  },
  {
    title: "How we use your information",
    bullets: [
      "To create and secure your account and sign you in.",
      "To process orders and payments, arrange delivery, and show you your order status.",
      "To let buyers and sellers complete a transaction, and to let sellers manage their products and orders.",
      "To provide search, including image search, and to help sellers write product listings.",
      "To contact you about your orders, respond to support requests, and handle returns, refunds and disputes.",
      "To keep KAT safe, prevent fraud and abuse, and meet our legal obligations.",
    ],
  },
  {
    title: "Information from Google sign-in",
    body: [
      "If you choose Continue with Google, we use only your name, email address and profile picture, and only to create your account, sign you in and display your profile. We do not use this information for advertising, and we do not share it with anyone except the service providers described below that help us run KAT.",
    ],
  },
  {
    title: "Who we share information with",
    body: ["We do not sell your personal information. We share it only as needed to run KAT:"],
    bullets: [
      "Sellers: when you buy from a seller, they receive the details needed to fulfil your order, such as your name, phone number, delivery address and the items ordered.",
      "Paystack: processes your payment.",
      "Supabase: provides our database, sign-in and file storage, where your account, order and listing data is held.",
      "Vercel: hosts the KAT website and our server functions.",
      "Google (Gemini) and Jina AI: when you use image search, the image you upload is sent to these services to generate descriptive tags and to match similar products. When a seller uses the listing helper, the product details they type are sent to generate a description.",
      "Delivery partners: where needed, the people who deliver your order receive your name, phone number and address.",
      "Authorities and advisers: where the law requires it, or to protect the rights, safety and property of KAT, our users or others.",
    ],
  },
  {
    title: "How we protect and keep your information",
    body: [
      "KAT uses HTTPS so data is encrypted in transit, and our database applies access rules so users can only reach data they are allowed to see. No online service can promise perfect security, but we work to protect your information.",
      "We keep your information for as long as your account is active and as long as we need it for orders, returns, disputes, fraud prevention and legal or accounting requirements. After that we delete it or make it anonymous.",
    ],
  },
  {
    title: "Your choices and rights",
    body: [
      "We aim to handle personal data in line with the Nigeria Data Protection Act 2023. You can ask us to:",
    ],
    bullets: [
      "give you a copy of the personal information we hold about you;",
      "correct information that is wrong or out of date;",
      "delete your account and personal information, subject to records we must keep for orders and legal reasons;",
      "stop using your information for a particular purpose where you object to it.",
    ],
  },
  {
    title: "Contacting us about your rights",
    body: [
      `Email ${SUPPORT_EMAIL} from the address linked to your account and tell us what you would like us to do. We will respond as soon as we reasonably can. If you are unhappy with our response, you can also complain to the Nigeria Data Protection Commission.`,
    ],
  },
  {
    title: "Age requirement",
    body: [
      "KAT is intended for people aged 18 and over. We do not knowingly collect personal information from children. If you believe a child has given us information, contact us and we will delete it.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "We may update this policy as KAT changes. When we do, we will change the date at the top of this page. If a change is significant, we will tell you in the app or by email.",
    ],
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 8, 2026"
      intro="Your privacy matters to us. This policy is written in plain language so you can see exactly what happens to your information when you use KAT."
      sections={SECTIONS}
    />
  );
}
