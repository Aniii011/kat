import { Sun, Moon } from "lucide-react";
import { useTheme, DARK_MODE_ENABLED } from "@/context/theme-context";
import { Button } from "@/components/ui/button";

export default function ThemeSwitcher() {
  const { theme, setBase } = useTheme();
  const isDark = theme.base === "black";

  if (!DARK_MODE_ENABLED) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-9 h-9 rounded-full"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setBase(isDark ? "white" : "black")}
    >
      {isDark
        ? <Sun className="w-4 h-4 text-amber-400" />
        : <Moon className="w-4 h-4" />
      }
      <span className="sr-only">{isDark ? "Light mode" : "Dark mode"}</span>
    </Button>
  );
}
