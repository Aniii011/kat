import React, { createContext, useContext, useEffect, useState } from "react";

export type AppTheme = "light" | "dark" | "pink" | "blue" | "beige" | "black-luxury";

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
});

const STORAGE_KEY = "kat-theme";
const THEME_CLASSES: AppTheme[] = ["light", "dark", "pink", "blue", "beige", "black-luxury"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
      if (saved && THEME_CLASSES.includes(saved)) return saved;
    } catch {}
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    THEME_CLASSES.forEach((t) => root.classList.remove(t, `theme-${t}`));
    if (theme === "dark") root.classList.add("dark");
    else if (theme !== "light") root.classList.add(`theme-${theme}`);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
