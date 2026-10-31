// Google Analytics 4 for a single-page app, behind a cookie-consent choice.
// - Does nothing unless VITE_GA_MEASUREMENT_ID (e.g. "G-XXXXXXXXXX") is set.
// - Google's script is NOT loaded, and no analytics cookies are set, until the
//   visitor clicks Accept in the cookie banner. The choice is remembered.

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

export const ANALYTICS_ENABLED = Boolean(GA_ID);

const CONSENT_KEY = "kat_cookie_consent";
export type Consent = "granted" | "denied" | null;

// Pages that are staff-only or carry auth tokens: never report these.
const SKIP_PREFIXES = ["/admin", "/seller", "/auth/callback", "/reset-password"];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let started = false;

export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

// Loads Google Analytics, but only if the visitor has accepted.
export function initAnalytics() {
  if (started || !GA_ID || typeof window === "undefined") return;
  if (getConsent() !== "granted") return;
  started = true;

  (window as any)[`ga-disable-${GA_ID}`] = false;
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

function clearGaCookies() {
  const names = document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((n) => n === "_ga" || n === "_gid" || n.startsWith("_ga_"));
  const host = window.location.hostname;
  for (const n of names) {
    for (const domain of [host, `.${host}`, ""]) {
      document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

// Called by the cookie banner. Remembers the choice and applies it straight away.
export function setConsent(value: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* private mode: choice just won't be remembered */
  }
  if (!GA_ID) return;
  if (value === "granted") {
    initAnalytics();
    trackPageView(window.location.pathname); // count the page they're on right now
  } else {
    (window as any)[`ga-disable-${GA_ID}`] = true; // stops sending if GA was already running
    clearGaCookies();
  }
}

// Lets a "Cookie settings" link re-open the banner so people can change their mind.
export function openCookieSettings() {
  window.dispatchEvent(new Event("kat:cookie-settings"));
}

export function trackPageView(path: string) {
  if (!GA_ID || !window.gtag || getConsent() !== "granted") return;
  if (SKIP_PREFIXES.some((p) => path.startsWith(p))) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.origin + path + window.location.search,
    page_title: document.title,
  });
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!GA_ID || !window.gtag || getConsent() !== "granted") return;
  window.gtag("event", name, params);
}
