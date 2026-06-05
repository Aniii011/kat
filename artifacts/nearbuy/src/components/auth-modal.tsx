import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Loader2, Sparkles, CheckCircle2, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultMode?: "login" | "signup";
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  barColor: string;
}

function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  if (score === 0 || score === 1) return { score, label: "Too weak", color: "text-red-500", barColor: "bg-red-500" };
  if (score === 2) return { score, label: "Weak", color: "text-orange-500", barColor: "bg-orange-500" };
  if (score === 3) return { score, label: "Medium", color: "text-amber-500", barColor: "bg-amber-500" };
  return { score, label: "Strong", color: "text-emerald-500", barColor: "bg-emerald-500" };
}

function PasswordRequirements({ password }: { password: string }) {
  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character (!@#$...)", met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="space-y-1.5 px-1">
      {requirements.map((req) => (
        <div key={req.label} className="flex items-center gap-2">
          {req.met
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            : <XCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
          <span className={`text-[11px] ${req.met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AuthModal({ open, onClose, defaultMode = "login" }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const strength = getPasswordStrength(password);
  const isPasswordValid = strength.score === 4;

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const reset = () => {
    setEmail(""); setPassword(""); setName("");
    setError(null); setSuccess(false); setLoading(false);
    setShowPw(false); setForgotSent(false);
  };

  const switchMode = (m: "login" | "signup" | "forgot") => {
    setMode(m);
    reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password strength on signup
    if (mode === "signup" && !isPasswordValid) {
      setError("Please choose a stronger password that meets all requirements.");
      return;
    }

    setLoading(true);
    const result = mode === "login"
      ? await signIn(email, password)
      : await signUp(email, password, name);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      if (mode === "login") {
        setTimeout(() => { onClose(); reset(); }, 800);
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setForgotSent(true);
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
                {mode === "login" ? "Welcome back 👋" : mode === "signup" ? "Join the community ✨" : "Reset your password"}
              </p>
            </div>

            {/* Tabs — only show for login/signup */}
            {mode !== "forgot" && (
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
            )}

            {/* Forgot Password Sent */}
            {mode === "forgot" && forgotSent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <p className="font-bold text-base">Check your email</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  We sent a password reset link to <span className="font-semibold text-foreground">{email}</span>
                </p>
                <button
                  className="text-primary font-semibold text-xs mt-4 hover:underline"
                  onClick={() => switchMode("login")}
                >
                  Back to Sign In
                </button>
              </motion.div>

            /* Forgot Password Form */
            ) : mode === "forgot" ? (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <p className="text-xs text-muted-foreground text-center mb-4">
                  Enter your email and we'll send you a reset link.
                </p>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl h-11"
                  required
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}
                <Button type="submit" className="w-full rounded-full h-11 font-bold text-sm" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                  onClick={() => switchMode("login")}
                >
                  ← Back to Sign In
                </button>
              </form>

            /* Success */
            ) : success ? (
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
                {mode === "signup" && (
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Please check your email to confirm your account before signing in.
                  </p>
                )}
              </motion.div>

            /* Login / Signup Form */
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

                {/* Password strength — only on signup */}
                {mode === "signup" && password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity
