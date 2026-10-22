import LegalPage from "@/components/legal-page";
import content from "@/content/legal/terms.json";


export default function Terms() {
  return (
    <LegalPage
      title={content.title}
      updated={content.updated}
      intro={content.intro}
      sections={content.sections}
    />
  );
}
