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

function getPasswordStrength(password: string) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  if (score <= 1) return { score, label: "Too weak", color: "text-red-500", barColor: "bg-red-500" };
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
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const strength = getPasswordStrength(password);
  const isPasswordValid = strength.score === 4;

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    if (user && open) {
      onClose();
      reset();
    }
  }, [user, open]);

  const reset = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError(null);
    setLoading(false);
    setShowPw(false);
    setForgotSent(false);
    setSignupSuccess(false);
    setGoogleLoading(false);
  };

  const switchMode = (m: "login" | "signup" | "forgot") => {
    setMode(m);
    reset();
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    await signInWithGoogle();
    setGoogleLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (mode === "signup" && !isPasswordValid) {
      setError("Please choose a stronger password that meets all requirements.");
      return;
    }

    setLoading(true);
    try {
      const result = mode === "login"
        ? await signIn(email, password)
        : await signUp(email, password, name);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setLoading(false);
      if (mode === "signup") {
        setSignupSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setForgotSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (!open) return null;

  const renderForgotSent = () => (
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
        Reset link sent to{" "}
        <span className="font-semibold text-foreground">{email}</span>
      </p>
      <button
        className="text-primary font-semibold text-xs mt-4 hover:underline"
        onClick={() => switchMode("login")}
      >
        Back to Sign In
      </button>
    </motion.div>
  );

  const renderForgotForm = () => (
    <form onSubmit={handleForgotPassword} className="space-y-3">
      <p className="text-xs text-muted-foreground text-center mb-2">
        Enter your email and we'll send you a reset link.
      </p>
      <Input
        id="forgot-email"
        name="email"
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-xl h-11"
        autoComplete="email"
        required
      />
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
      <Button
        type="submit"
        className="w-full rounded-full h-11 font-bold"
        disabled={loading}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
      </Button>
      <button
        type="button"
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
        onClick={() => switchMode("login")}
      >
        ← Back to Sign In
      </button>
    </form>
  );

  const renderSignupSuccess = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-6"
    >
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <Sparkles className="w-7 h-7 text-primary" />
      </div>
      <p className="font-bold text-base">Welcome to KAT! 🎉</p>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
        Your account has been created. You can now sign in.
      </p>
      <Button
        className="w-full rounded-full h-11 font-bold mt-4"
        onClick={() => switchMode("login")}
      >
        Sign In Now
      </Button>
    </motion.div>
  );

  const renderMainForm = () => (
    <form onSubmit={handleSubmit} className="space-y-3" autoComplete="on">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 h-11 rounded-full border-2 border-border hover:border-primary/40 transition-all text-sm font-semibold disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </>
        )}
      </button>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {mode === "signup" && (
        <Input
          id="signup-name"
          name="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl h-11"
          autoComplete="name"
          required
        />
      )}

      <Input
        id="auth-email"
        name="email"
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-xl h-11"
        autoComplete="email"
        required
      />

      <div className="relative">
        <Input
          id="auth-password"
          name="password"
          type={showPw ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl h-11 pr-11"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
        <button
          type="button"
          onClick={() => setShowPw(!showPw)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {mode === "signup" && password.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    i <= strength.score ? strength.barColor : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <span className={`text-[11px] font-semibold ${strength.color}`}>
              {strength.label}
            </span>
          </div>
          <PasswordRequirements password={password} />
        </motion.div>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2"
        >
          {error}
        </motion.p>
      )}

      <Button
        type="submit"
        className="w-full rounded-full h-11 font-bold text-sm"
        disabled={loading || (mode === "signup" && password.length > 0 && !isPasswordValid)}
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : mode === "login" ? "Sign In" : "Create Account"}
      </Button>

      {mode === "login" && (
        <button
          type="button"
          className="w-full text-center text-[11px] text-primary font-semibold hover:underline"
          onClick={()
