// Google Analytics 4 for a single-page app.
// Does nothing unless VITE_GA_MEASUREMENT_ID (e.g. "G-XXXXXXXXXX") is set,
// so local dev and preview builds stay out of your real data.

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

// Pages that are staff-only or carry auth tokens: never report these.
const SKIP_PREFIXES = ["/admin", "/seller", "/auth/callback", "/reset-password"];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let started = false;

export function initAnalytics() {
  if (started || !GA_ID || typeof window === "undefined") return;
  started = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js requires the real `arguments` object, not a rest array
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  // We send page views ourselves on every route change (see trackPageView).
  window.gtag("config", GA_ID, { send_page_view: false });

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}

export function trackPageView(path: string) {
  if (!GA_ID || !window.gtag) return;
  if (SKIP_PREFIXES.some((p) => path.startsWith(p))) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.origin + path + window.location.search,
    page_title: document.title,
  });
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!GA_ID || !window.gtag) return;
  window.gtag("event", name, params);
}
