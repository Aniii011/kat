import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import ThemeSwitcher from "@/components/theme-switcher";
import { useTheme } from "@/context/theme-context";
import { useAuth } from "@/context/auth-context";
import AuthModal from "@/components/auth-modal";
import { supabase } from "@/lib/supabase";
import {
  Package,
  MapPin,
  RotateCcw,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit3,
  Check,
  AlertTriangle,
  UserCircle2,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Me() {
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const [, navigate] = useLocation();

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const [displayName, setDisplayName] = useState(
    () => user?.name || localStorage.getItem("kat_name") || ""
  );

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);

  const [address, setAddress] = useState(
    () => localStorage.getItem("kat_address") ?? ""
  );

  const [editingAddress, setEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState(address);

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [showHelp, setShowHelp] = useState(false);

  const openLogin = () => {
    setAuthMode("login");
    setShowAuth(true);
  };

  const openSignup = () => {
    setAuthMode("signup");
    setShowAuth(true);
  };

  const saveName = async () => {
    if (!nameInput.trim()) return;

    localStorage.setItem("kat_name", nameInput);

    if (user?.id) {
      await supabase
        .from("profiles")
        .update({ full_name: nameInput })
        .eq("id", user.id);
    }

    setDisplayName(nameInput);
    setEditingName(false);
  };

  const saveAddress = () => {
    setAddress(addressInput);
    localStorage.setItem("kat_address", addressInput);
    setEditingAddress(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setShowSignOutConfirm(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-40 bg-background border-b">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <h1 className="font-black">My Account</h1>
            <ThemeSwitcher />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <UserCircle2 className="w-14 h-14 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-black mb-2">Welcome to KAT</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Sign in to view orders and manage your account.
            </p>

            <Button onClick={openLogin} className="w-full mb-2">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>

            <Button variant="outline" onClick={openSignup} className="w-full">
              Create Account
            </Button>
          </motion.div>
        </main>

        <AuthModal
          open={showAuth}
          onClose={() => setShowAuth(false)}
          defaultMode={authMode}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* SIGN OUT MODAL */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card p-6 rounded-2xl w-full max-w-xs"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <AlertTriangle className="mx-auto mb-3 text-red-500" />
              <h3 className="text-center font-bold mb-2">Sign Out?</h3>
              <p className="text-sm text-center text-muted-foreground mb-4">
                Are you sure you want to sign out?
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSignOutConfirm(false)}
                >
                  Cancel
                </Button>

                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? "Signing out..." : "Sign Out"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HELP MODAL (FIXED - was your broken section) */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card p-6 rounded-2xl w-full max-w-sm"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <HelpCircle className="mx-auto mb-3 text-primary" />
              <h3 className="text-center font-bold mb-2">
                Help & Support
              </h3>

              <p className="text-sm text-center text-muted-foreground mb-4">
                Need help? Contact support at support@kat.com or check FAQs.
              </p>

              <Button
                className="w-full"
                onClick={() => setShowHelp(false)}
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAGE CONTENT (you can extend this later) */}
      <div className="p-6">
        <h1 className="text-lg font-bold">Account Page</h1>

        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setShowHelp(true)}
        >
          Open Help
        </Button>

        <Button
          variant="destructive"
          className="mt-4 ml-2"
          onClick={() => setShowSignOutConfirm(true)}
        >
          Sign Out
        </Button>
      </div>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        defaultMode={authMode}
      />
    </div>
  );
}
