import React, { createContext, useContext, useEffect, useState } from "react";

export type BaseTheme = "white" | "black";
export type AccentColor = "mulberry" | "pink" | "beige" | "purple" | "sage" | "blue";

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
  theme: { base: "white", accent: "mulberry" },
  setBase: () => {},
  setAccent: () => {},
});

const STORAGE_KEY = "kat-theme-v3";

const ACCENT_CLASSES: Record<AccentColor, string> = {
  mulberry: "",
  pink: "accent-pink",
  beige: "accent-beige",
  purple: "accent-purple",
  sage: "accent-sage",
  blue: "accent-blue",
};

// Switch for the dark (black) base. New visitors always start on the cream base;
// they can choose Black in Settings or with the sun/moon button.
// Set to false to hide dark mode again.
export const DARK_MODE_ENABLED = true;

function loadTheme(): AppTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.base && parsed.accent) {
        return {
          base: DARK_MODE_ENABLED ? parsed.base : "white",
          accent: parsed.accent,
        } as AppTheme;
      }
    }
  } catch {}
  return { base: "white", accent: "mulberry" };
}

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.classList.remove("dark");
  root.classList.remove("accent-pink", "accent-beige", "accent-purple", "accent-sage", "accent-blue");
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
