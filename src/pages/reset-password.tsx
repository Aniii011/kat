import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

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
      setError(error.message);
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
    </div>
  );
}
