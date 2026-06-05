import React, { createContext, useContext, useEffect, useState } from "react";

export type BaseTheme = "white" | "black";
export type AccentColor = "pink" | "beige" | "purple" | "sage" | "blue";

export interface AppTheme {
  base: BaseTheme;
  accent: AccentColor;
}

interface ThemeContextValue {
  theme: AppTheme;
  setBase: (b: BaseTheme) => void;
  setAccent: (a: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: { base: "white", accent: "pink" },
  setBase: () => {},
  setAccent: () => {},
});

const STORAGE_KEY = "kat-theme-v2";

const ACCENT_CLASSES: Record<AccentColor, string> = {
  pink: "",
  beige: "accent-beige",
  purple: "accent-purple",
  sage: "accent-sage",
  blue: "accent-blue",
};

function loadTheme(): AppTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.base && parsed.accent) return parsed as AppTheme;
    }
  } catch {}
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return { base: prefersDark ? "black" : "white", accent: "pink" };
}

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.classList.remove("dark");
  root.classList.remove("accent-beige", "accent-purple", "accent-sage", "accent-blue");
  if (theme.base === "black") root.classList.add("dark");
  const accentClass = ACCENT_CLASSES[theme.accent];
  if (accentClass) root.classList.add(accentClass);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(loadTheme);

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(theme)); } catch {}
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setThemeState((prev) => ({ ...prev, base: e.matches ? "black" : "white" }));
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setBase = (base: BaseTheme) => setThemeState((prev) => ({ ...prev, base }));
  const setAccent = (accent: AccentColor) => setThemeState((prev) => ({ ...prev, accent }));

  return (
    <ThemeContext.Provider value={{ theme, setBase, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
