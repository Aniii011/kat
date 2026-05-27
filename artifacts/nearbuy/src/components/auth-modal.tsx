import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultMode?: "login" | "signup";
}

export default function AuthModal({ open, onClose, defaultMode = "login" }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setEmail(""); setPassword(""); setName("");
    setError(null); setSuccess(false); setLoading(false); setShowPw(false);
  };

  const switchMode = (m: "login" | "signup") => {
    setMode(m);
    reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = mode === "login"
      ? await signIn(email, password)
      : await signUp(email, password, name);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => { onClose(); reset(); }, 800);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative bg-background rounded-3xl shadow-2xl w-full max-w-sm p-6 z-10 border border-border"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Logo */}
            <div className="text-center mb-5">
              <span className="text-3xl font-black text-primary tracking-tight">KAT</span>
              <p className="text-xs text-muted-foreground mt-1">
                {mode === "login" ? "Welcome back 👋" : "Join the community ✨"}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-muted rounded-2xl p-1 mb-5">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-all ${
                    mode === m ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <p className="font-bold text-base">
                  {mode === "signup" ? "Welcome to KAT! 🎉" : "Welcome back! 👋"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">You're in.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === "signup" && (
                  <Input
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl h-11"
                    required
                  />
                )}
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl h-11"
                  required
                />
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl h-11 pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}

                <Button type="submit" className="w-full rounded-full h-11 font-bold text-sm" disabled={loading}>
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : mode === "login" ? "Sign In" : "Create Account"}
                </Button>
              </form>
            )}

            {!success && (
              <p className="text-center text-[11px] text-muted-foreground mt-4">
                {mode === "login" ? "New to KAT? " : "Already have an account? "}
                <button
                  className="text-primary font-semibold hover:underline"
                  onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
