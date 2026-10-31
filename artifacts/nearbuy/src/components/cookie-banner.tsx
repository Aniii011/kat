import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ANALYTICS_ENABLED, getConsent, setConsent } from "@/lib/analytics";

// Asks once whether KAT may use Google Analytics cookies. Accept and Decline are
// equally easy to click. Shows nothing if analytics isn't configured.
export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;
    if (getConsent() === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener("kat:cookie-settings", reopen);
    return () => window.removeEventListener("kat:cookie-settings", reopen);
  }, []);

  if (!open) return null;

  const choose = (value: "granted" | "denied") => {
    setConsent(value);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      // On phones, sit above the bottom nav
      className="fixed z-[60] left-3 right-3 bottom-[84px] sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm rounded-2xl border border-border bg-background shadow-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Cookie className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold">Cookies on KAT</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            We'd like to use Google Analytics cookies to see which pages are popular, so we can improve KAT. Nothing is
            tracked unless you accept.{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button variant="outline" className="flex-1 rounded-full h-10 text-xs font-bold" onClick={() => choose("denied")}>
          Decline
        </Button>
        <Button className="flex-1 rounded-full h-10 text-xs font-bold" onClick={() => choose("granted")}>
          Accept
        </Button>
      </div>
    </div>
  );
}
