import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/support";

export { SUPPORT_EMAIL };

export type LegalSection = {
  title: string;
  /** Paragraphs rendered in order. */
  body?: string[];
  /** Optional bullet list rendered after the paragraphs. */
  bullets?: string[];
};

type LegalPageProps = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

// Public, no-login page used for the Privacy Policy and Terms of Service.
// Google's OAuth brand verification and app stores both need these to be
// reachable by plain URL, so they live on their own routes (not in a modal).
export default function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-3 h-14 flex items-center gap-2">
          <Link href="/">
            <button
              className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center"
              aria-label="Back to KAT"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <Link href="/">
            <span className="text-lg font-black tracking-tight text-primary cursor-pointer select-none">KAT</span>
          </Link>
        </div>
      </header>

      <article className="max-w-2xl mx-auto px-4 pt-6 pb-10">
        <h1 className="text-[28px] font-bold tracking-tight [font-family:'Outfit',sans-serif]">{title}</h1>
        <p className="text-xs text-muted-foreground mt-1">Last updated: {updated}</p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-5">{intro}</p>

        <div className="mt-8 space-y-8">
          {sections.map((section, i) => (
            <section key={section.title}>
              <h2 className="text-base font-bold text-foreground">
                {i + 1}. {section.title}
              </h2>
              {section.body?.map((p) => (
                <p key={p} className="text-sm text-muted-foreground leading-relaxed mt-2">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-2 space-y-1.5 list-disc pl-5 text-sm text-muted-foreground leading-relaxed">
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground underline underline-offset-2">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground underline underline-offset-2">Terms of Service</Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-foreground underline underline-offset-2">
            {SUPPORT_EMAIL}
          </a>
        </div>
      </article>
    </div>
  );
}
