import LegalPage from "@/components/legal-page";
import content from "@/content/pages/contact.json";

export default function Contact() {
  return <LegalPage title={content.title} intro={content.intro} sections={content.sections} />;
}
