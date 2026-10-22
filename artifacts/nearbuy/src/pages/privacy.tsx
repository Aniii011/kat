import LegalPage from "@/components/legal-page";
import content from "@/content/legal/privacy.json";


export default function Privacy() {
  return (
    <LegalPage
      title={content.title}
      updated={content.updated}
      intro={content.intro}
      sections={content.sections}
    />
  );
}
