import { AnimatePresence, motion } from "framer-motion";
import { Settings, X, Check, Palette, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE_OPTIONS = [
  { value: "white" as const, label: "White", bg: "#ffffff" },
  { value: "black" as const, label: "Black", bg: "#0d0d0d" },
];

const ACCENT_OPTIONS = [
  { value: "pink" as const, label: "Pink", color: "#e0508a" },
  { value: "beige" as const, label: "Beige", color: "#b8966a" },
  { value: "purple" as const, label: "Purple", color: "#9b59d6" },
  { value: "sage" as const, label: "Sage", color: "#4a9e6e" },
  { value: "blue" as const, label: "Blue", color: "#3b82f6" },
];

interface Theme {
  base: "white" | "black";
  accent: "pink" | "beige" | "purple" | "sage" | "blue";
}

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  setBase: (base: Theme["base"]) => void;
  setAccent: (accent: Theme["accent"]) => void;
  onOpenPrivacy: () => void;
  onSignOut: () => void;
}

// Everything that used to live loose on the Me page — theme, privacy
// policy link, sign out — now lives behind the gear icon in the header.
export default function SettingsSheet({
  open,
  onClose,
  theme,
  setBase,
  setAccent,
  onOpenPrivacy,
  onSignOut,
}: SettingsSheetProps) {
  const currentAccent = ACCENT_OPTIONS.find((a) => a.value === theme.accent);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-card border border-card-border rounded-3xl p-6 max-w-sm w-full shadow-xl max-h-[85vh] overflow-y-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base flex items-center gap-2">
                <Settings className="w-4 h-4" /> Settings
              </h3>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onOpenPrivacy}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-muted hover:bg-accent transition-colors text-sm font-medium"
            >
              Privacy Policy
            </button>

            <div className="space-y-3 border-t border-border pt-4">
              <p className="font-bold text-sm flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" /> App Theme
              </p>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Background</p>
                <div className="grid grid-cols-2 gap-2">
                  {BASE_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setBase(t.value)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        theme.base === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full border border-border shadow-sm shrink-0" style={{ background: t.bg }} />
                      <span className="text-xs font-medium">{t.label}</span>
                      {theme.base === t.value && <Check className="w-3 h-3 text-primary ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Accent Color</p>
                <div className="grid grid-cols-5 gap-2">
                  {ACCENT_OPTIONS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setAccent(a.value)}
                      title={a.label}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                        theme.accent === a.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full shadow-sm" style={{ background: a.color }} />
                      <span className="text-[9px] font-medium text-muted-foreground">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Current:</span>
                <span className="w-4 h-4 rounded-full border border-border shrink-0" style={{ background: theme.base === "white" ? "#ffffff" : "#0d0d0d" }} />
                <span className="text-xs font-medium capitalize">{theme.base}</span>
                <span className="text-muted-foreground text-xs mx-1">+</span>
                <span className="w-4 h-4 rounded-full shrink-0" style={{ background: currentAccent?.color }} />
                <span className="text-xs font-medium capitalize">{theme.accent}</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-2xl h-12 border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold gap-2"
              onClick={onSignOut}
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
