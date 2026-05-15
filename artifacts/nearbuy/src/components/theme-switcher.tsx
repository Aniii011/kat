import { Palette } from "lucide-react";
import { useTheme, type AppTheme } from "@/context/theme-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEMES: { value: AppTheme; label: string; swatch: string; emoji: string }[] = [
  { value: "light", label: "Light", swatch: "#fdf2f8", emoji: "☀️" },
  { value: "dark", label: "Dark", swatch: "#0f0f0f", emoji: "🌙" },
  { value: "pink", label: "Pink", swatch: "#ec4899", emoji: "🩷" },
  { value: "blue", label: "Blue", swatch: "#3b82f6", emoji: "💙" },
  { value: "beige", label: "Beige", swatch: "#c2612e", emoji: "🤎" },
  { value: "black-luxury", label: "Luxury", swatch: "#d4af37", emoji: "🖤" },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const current = THEMES.find((t) => t.value === theme) ?? THEMES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-9 h-9 rounded-full"
          title="Change theme"
        >
          <span
            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
            style={{ background: current.swatch }}
          />
          <span className="sr-only">Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <span
              className="w-4 h-4 rounded-full border border-border shadow-sm shrink-0"
              style={{ background: t.swatch }}
            />
            <span className="flex-1 text-sm">{t.label}</span>
            {t.value === theme && <span className="text-primary text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
