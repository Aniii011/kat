import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import AuthModal from "@/components/auth-modal";

// Captured when this module loads, before supabase-js has a chance to strip
// the token (or the error) out of the address bar.
const INITIAL_URL =
  typeof window !== "undefined"
    ? { search: window.location.search, hash: window.location.hash }
    : { search: "", hash: "" };

type LinkState = "checking" | "ready" | "expired" | "invalid";

function getInitialLinkState(): LinkState {
  const query = new URLSearchParams(INITIAL_URL.search);
  const hash = new URLSearchParams(INITIAL_URL.hash.replace(/^#/, ""));

  // Supabase sends the user back with an error when the link is expired or already used.
  const errorCode = hash.get("error_code") ?? query.get("error_code");
  const error = hash.get("error") ?? query.get("error");
  if (errorCode === "otp_expired") return "expired";
  if (errorCode || error) return "invalid";

  // A genuine reset link always arrives carrying a token or a code.
  const hasRecoveryParams =
    hash.get("type") === "recovery" ||
    hash.has("access_token") ||
    query.has("code") ||
    query.has("token_hash");
  return hasRecoveryParams ? "checking" : "invalid";
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

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [linkState, setLinkState] = useState<LinkState>(getInitialLinkState);
  const [showRequestLink, setShowRequestLink] = useState(false);

  // Wait for supabase-js to turn the link's token into a session.
  useEffect(() => {
    if (linkState !== "checking") return;
    let settled = false;
    const markReady = () => {
      settled = true;
      setLinkState("ready");
    };
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")
      ) {
        markReady();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady();
    });
    const timer = window.setTimeout(() => {
      if (!settled) setLinkState("invalid");
    }, 6000);
    return () => {
      listener.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, [linkState]);

  const strength = getPasswordStrength(password);
  const isValid = strength.score === 4;

  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError("Please choose a stronger password.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("session")) {
        setLinkState("expired");
      } else {
        setError(error.message);
      }
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/me"), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-card border border-card-border rounded-3xl p-6 shadow-xl"
      >
        <div className="text-center mb-6">
          <span className="text-3xl font-black text-primary">KAT</span>
          <p className="text-xs text-muted-foreground mt-1">Set a new password</p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="font-bold text-base">Password updated!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Redirecting you to your account...
            </p>
          </motion.div>
        ) : linkState === "checking" ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            <p className="text-xs text-muted-foreground mt-3">Checking your link...</p>
          </div>
        ) : linkState !== "ready" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-7 h-7 text-destructive" />
            </div>
            <p className="font-bold text-base">
              {linkState === "expired" ? "This reset link has expired" : "This reset link isn't valid"}
            </p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {linkState === "expired"
                ? "For your security, reset links only work for a short time and can only be used once. Request a new one to continue."
                : "It may have already been used, or it wasn't opened from the email we sent. Request a new one to continue."}
            </p>
            <Button className="w-full rounded-full h-11 font-bold mt-5" onClick={() => setShowRequestLink(true)}>
              Request a new link
            </Button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xs text-muted-foreground hover:text-foreground mt-3 underline underline-offset-2"
            >
              Back to KAT
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl h-11 pr-11"
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

            {password.length > 0 && (
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
                <div className="space-y-1.5 px-1">
                  {requirements.map((req) => (
                    <div key={req.label} className="flex items-center gap-2">
                      {req.met
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      <span className={`text-[11px] ${req.met ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full rounded-full h-11 font-bold"
              disabled={loading || !isValid}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
            </Button>
          </form>
        )}
      </motion.div>
      <AuthModal open={showRequestLink} onClose={() => setShowRequestLink(false)} defaultMode="forgot" />
    </div>
  );
    }
