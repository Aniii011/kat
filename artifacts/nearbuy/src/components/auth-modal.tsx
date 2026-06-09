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

  if (score <= 1)
    return { score, label: "Too weak", color: "text-red-500", barColor: "bg-red-500" };
  if (score === 2)
    return { score, label: "Weak", color: "text-orange-500", barColor: "bg-orange-500" };
  if (score === 3)
    return { score, label: "Medium", color: "text-amber-500", barColor: "bg-amber-500" };

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
          {req.met ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <span
            className={`text-[11px] ${
              req.met
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
            }`}
          >
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AuthModal({
  open,
  onClose,
  defaultMode = "login",
}: AuthModalProps) {
  const { signIn, signUp, user } = useAuth();

  const [mode, setMode] = useState<"login" | "signup" | "forgot">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  const strength = getPasswordStrength(password);
  const isPasswordValid = strength.score === 4;

  // Reset when mode changes externally
  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  // 🔥 CRITICAL FIX: close modal ONLY when real auth user exists
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
  };

  const switchMode = (m: "login" | "signup" | "forgot") => {
    setMode(m);
    reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    if (mode === "signup" && !isPasswordValid) {
      setError("Please choose a stronger password.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);

    try {
      const result =
        mode === "login"
          ? await signIn(email, password)
          : await signUp(email, password, name);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setLoading(false);

      // ❌ DO NOT close modal for login here
      // AuthContext will trigger user update

      if (mode === "signup") {
        // optional UI feedback only
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
      <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
      <p className="font-bold">Check your email</p>
      <p className="text-xs text-muted-foreground mt-2">
        Reset link sent to <b>{email}</b>
      </p>
      <button
        className="text-primary text-xs mt-4"
        onClick={() => switchMode("login")}
      >
        Back to Sign In
      </button>
    </motion.div>
  );

  const renderForgotForm = () => (
    <form onSubmit={handleForgotPassword} className="space-y-3">
      <Input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Send Reset Link"}
      </Button>

      <button
        type="button"
        className="text-xs text-muted-foreground w-full"
        onClick={() => switchMode("login")}
      >
        Back to login
      </button>
    </form>
  );

  const renderMainForm = () => (
    <form onSubmit={handleSubmit} className="space-y-3">
      {mode === "signup" && (
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      )}

      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <div className="relative">
        <Input
          type={showPw ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="button"
          onClick={() => setShowPw(!showPw)}
          className="absolute right-3 top-2.5 text-muted-foreground"
        >
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {mode === "signup" && password && (
        <PasswordRequirements password={password} />
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button disabled={loading} className="w-full">
        {loading ? (
          <Loader2 className="animate-spin w-4 h-4" />
        ) : mode === "login" ? (
          "Sign In"
        ) : (
          "Create Account"
        )}
      </Button>

      {mode === "login" && (
        <button
          type="button"
          className="text-xs text-primary w-full"
          onClick={() => switchMode("forgot")}
        >
          Forgot password?
        </button>
      )}
    </form>
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          <motion.div className="relative bg-white dark:bg-zinc-900 p-6 rounded-2xl w-full max-w-sm z-10">
            <button onClick={onClose} className="absolute top-3 right-3">
              <X size={18} />
            </button>

            <h2 className="text-center font-bold text-xl mb-4">KAT</h2>

            {mode === "forgot"
              ? forgotSent
                ? renderForgotSent()
                : renderForgotForm()
              : renderMainForm()}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
