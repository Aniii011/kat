import LegalPage from "@/components/legal-page";
import content from "@/content/pages/about.json";

export default function About() {
  return <LegalPage title={content.title} intro={content.intro} sections={content.sections} />;
}
