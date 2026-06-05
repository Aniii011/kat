import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import ThemeSwitcher from "@/components/theme-switcher";
import { useTheme } from "@/context/theme-context";
import { useAuth } from "@/context/auth-context";
import AuthModal from "@/components/auth-modal";
import {
  Package,
  MapPin,
  RotateCcw,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit3,
  Check,
  Shield,
  BadgeCheck,
  Truck,
  Clock,
  X,
  Store,
  LogIn,
  UserCircle2,
  ShieldCheck,
  AlertTriangle,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const STATUS_STYLES: Record<string, string> = {
  Delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  Shipped: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Delivered: <Check className="w-3 h-3" />,
  Shipped: <Truck className="w-3 h-3" />,
  Pending: <Clock className="w-3 h-3" />,
  Cancelled: <X className="w-3 h-3" />,
};

function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

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

export default function Me() {
  const { theme, setBase, setAccent } = useTheme();
  const { user, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [displayName, setDisplayName] = useState(
    () => user?.name || localStorage.getItem("kat_name") || "",
  );
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);
  const [address, setAddress] = useState(
    () => localStorage.getItem("kat_address") ?? "",
  );
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState(address);
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "returns">("orders");
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const openLogin = () => { setAuthMode("login"); setShowAuth(true); };
  const openSignup = () => { setAuthMode("signup"); setShowAuth(true); };

  const saveName = () => {
    setDisplayName(nameInput);
    localStorage.setItem("kat_name", nameInput);
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

  const effectiveName = user?.name || displayName;
  const initials = effectiveName ? effectiveName.slice(0, 2).toUpperCase() : "KAT";

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <div className="flex-1">
              <h1 className="text-base font-black">My Account</h1>
            </div>
            <ThemeSwitcher />
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xs w-full"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-5">
              <UserCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-black mb-2">Welcome to KAT</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Sign in to view your orders, save favourites, and access your full account.
            </p>
            <div className="flex flex-col gap-2">
              <Button className="w-full rounded-full h-11 font-bold gap-2" onClick={openLogin}>
                <LogIn className="w-4 h-4" /> Sign In
              </Button>
              <Button variant="outline" className="w-full rounded-full h-11 font-semibold" onClick={openSignup}>
                Create Account
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              Guest? You can still browse and shop — just sign in at checkout.
            </p>
          </motion.div>
        </main>
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} defaultMode={authMode} />
      </div>
    );
  }

  const menuItems = [
    { icon: <Package className="w-4 h-4" />, label: "Orders", tab: "orders" as const },
    { icon: <MapPin className="w-4 h-4" />, label: "Addresses", tab: "addresses" as const },
    { icon: <RotateCcw className="w-4 h-4" />, label: "Returns", tab: "returns" as const },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* Sign Out Confirmation */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-card-border rounded-3xl p-6 max-w-xs w-full shadow-xl"
            >
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-base font-black text-center mb-1">Sign Out?</h3>
              <p className="text-sm text-muted-foreground text-center mb-5">
                Are you sure you want to sign out of your KAT account?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={() => setShowSignOutConfirm(false)}
                  disabled={signingOut}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-full"
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

      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-base font-black">My Account</h1>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-24 space-y-4">

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-card-border rounded-3xl p-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-2xl font-black text-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex gap-2">
                  <Input
