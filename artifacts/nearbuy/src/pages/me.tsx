import React, { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import ThemeSwitcher from "@/components/theme-switcher";
import { useTheme } from "@/context/theme-context";
import { useAuth } from "@/context/auth-context";
import AuthModal from "@/components/auth-modal";
import { supabase } from "@/lib/supabase";
import RecentOrdersCard from "@/components/me/RecentOrdersCard";
import WishlistsSummaryCard from "@/components/me/WishlistsSummaryCard";
import StyleProfileCard from "@/components/me/StyleProfileCard";
import {
  MapPin, RotateCcw, HelpCircle, LogOut,
  ChevronRight, Edit3, Check, Shield, BadgeCheck,
  Store, LogIn, UserCircle2, ShieldCheck, AlertTriangle,
  Palette, X, MessageCircle, Camera, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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

interface ProfileRow {
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  preferred_aesthetics: string[] | null;
}

export default function Me() {
  const { theme, setBase, setAccent } = useTheme();
  const { user, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState(false);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("kat_name") || "");
  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem("kat_phone") || "");
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem("kat_avatar") || "");
  const [preferredAesthetics, setPreferredAesthetics] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setProfileLoading(false);
      return;
    }
    let cancelled = false;

    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileLoadError(false);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, phone, preferred_aesthetics")
        .eq("id", user.id)
        .single<ProfileRow>();

      if (cancelled) return;

      if (error || !data) {
        setProfileLoadError(true);
        setProfileLoading(false);
        return;
      }

      if (data.full_name) {
        setDisplayName(data.full_name);
        localStorage.setItem("kat_name", data.full_name);
      }
      if (data.avatar_url) {
        setAvatarUrl(data.avatar_url);
        localStorage.setItem("kat_avatar", data.avatar_url);
      }
      if (data.phone) {
        setPhoneNumber(data.phone);
        localStorage.setItem("kat_phone", data.phone);
      }
      setPreferredAesthetics(data.preferred_aesthetics ?? []);
      setProfileLoading(false);
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const [editingProfile, setEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);
  const [phoneInput, setPhoneInput] = useState(phoneNumber);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(avatarUrl);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState(false);

  const [address, setAddress] = useState(() => localStorage.getItem("kat_address") ?? "");
  const [showAddresses, setShowAddresses] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState(address);

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showReturns, setShowReturns] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openLogin = () => { setAuthMode("login"); setShowAuth(true); };
  const openSignup = () => { setAuthMode("signup"); setShowAuth(true); };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    if (!nameInput.trim()) return;
    setSavingProfile(true);
    setProfileSaveError(false);

    let newAvatarUrl = avatarUrl;
    if (avatarFile && user?.id) {
      const fileName = `avatars/${user.id}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, avatarFile, { upsert: true });
      if (!uploadError) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
        newAvatarUrl = data.publicUrl;
      }
    }

    if (user?.id) {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: nameInput.trim(),
          phone: phoneInput.trim(),
          avatar_url: newAvatarUrl || null,
        })
        .eq("id", user.id);

      if (error) {
        setProfileSaveError(true);
        setSavingProfile(false);
        return;
      }
    }

    localStorage.setItem("kat_name", nameInput.trim());
    localStorage.setItem("kat_phone", phoneInput.trim());
    if (newAvatarUrl) localStorage.setItem("kat_avatar", newAvatarUrl);

    setDisplayName(nameInput.trim());
    setPhoneNumber(phoneInput.trim());
    setAvatarUrl(newAvatarUrl);
    setSavingProfile(false);
    setEditingProfile(false);
    setAvatarFile(null);
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

  const effectiveName = displayName || user?.email?.split("@")[0] || "KAT Member";
  const initials = effectiveName.slice(0, 2).toUpperCase();
  const currentAccent = ACCENT_OPTIONS.find((a) => a.value === theme.accent);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <div className="flex-1"><h1 className="text-base font-black">My Account</h1></div>
            <ThemeSwitcher />
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-28 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-xs w-full">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-5">
              <UserCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-black mb-2">Welcome to KAT</h2>
            <p className="text-sm text-muted-foreground mb-6">Sign in to view your orders, save favourites, and access your full account.</p>
            <div className="flex flex-col gap-2">
              <Button className="w-full rounded-full h-11 font-bold gap-2" onClick={openLogin}>
                <LogIn className="w-4 h-4" /> Sign In
              </Button>
              <Button variant="outline" className="w-full rounded-full h-11 font-semibold" onClick={openSignup}>
                Create Account
              </Button>
            </div>
          </motion.div>
        </main>
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} defaultMode={authMode} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      <AnimatePresence>
        {showSignOutConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-card-border rounded-3xl p-6 max-w-xs w-full shadow-xl">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-base font-black text-center mb-1">Sign Out?</h3>
              <p className="text-sm text-muted-foreground text-center mb-5">Are you sure you want to sign out of your KAT account?</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setShowSignOutConfirm(false)} disabled={signingOut}>Cancel</Button>
                <Button variant="destructive" className="flex-1 rounded-full" onClick={handleSignOut} disabled={signingOut}>
                  {signingOut ? "Signing out..." : "Sign Out"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-card border border-card-border rounded-3xl p-6 max-w-sm w-full shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-base">Help & Support</h3>
                <button onClick={() => setShowHelp(false)} aria-label="Close" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Need help? We're here for you!</p>
                <a href="mailto:support@kat.ng" className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-accent transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Email Support</p>
                    <p className="text-xs text-muted-foreground">support@kat.ng</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrivacy && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-card border border-card-border rounded-3xl p-6 max-w-sm w-full shadow-xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-base">Privacy Policy</h3>
                <button onClick={() => setShowPrivacy(false)} aria-label="Close" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p className="text-xs">Last updated: June 2025</p>
                {[
                  { title: "Information We Collect", content: "We collect information you provide when creating an account, making purchases, or contacting support." },
                  { title: "How We Use Your Information", content: "We use your information to process orders, send updates, and improve our services." },
                  { title: "Data Security", content: "We use industry-standard security measures. Payment details are encrypted and never stored on our servers." },
                  { title: "Your Rights", content: "You can access, update, or delete your personal information at any time by contacting us on WhatsApp." },
                ].map(({ title, content }) => (
                  <div key={title}>
                    <p className="font-semibold text-foreground mb-1">{title}</p>
                    <p>{content}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReturns && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-card border border-card-border rounded-3xl p-6 max-w-sm w-full shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base">Return & Refund Policy</h3>
                <button onClick={() => setShowReturns(false)} aria-label="Close" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">14-day return window</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Items must be unworn and in original condition</p>
                <p>✓ Include original packaging and tags</p>
                <p>✓ Refunds processed within 5-7 business days</p>
                <p>✗ Thrift items are non-refundable once payment is complete</p>
                <p>✗ Beauty and health items cannot be returned once opened</p>
              </div>
              <a href="https://wa.me/2348103925304?text=I want to start a return request" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="rounded-full w-full">Start a Return Request</Button>
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex-1"><h1 className="text-base font-black">My Account</h1></div>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-24 space-y-4">

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-card-border rounded-3xl p-5">
          {editingProfile ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 overflow-hidden flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-primary">{initials}</span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Change profile photo"
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md"
                  >
                    <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                </div>
                <p className="text-xs text-muted-foreground">Tap camera to change photo</p>
              </div>
              <Input placeholder="Your name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="rounded-xl h-11" aria-label="Your name" />
              <Input placeholder="Phone number (e.g. 08012345678)" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="rounded-xl h-11" type="tel" aria-label="Phone number" />
              {profileSaveError && (
                <p className="text-xs text-destructive">Couldn't save your profile — please try again.</p>
              )}
              <div className="flex gap-2">
                <Button className="flex-1 rounded-full" onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save Profile"}
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileSaveError(false);
                    setAvatarPreview(avatarUrl);
                    setAvatarFile(null);
                    setNameInput(displayName);
                    setPhoneInput(phoneNumber);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-primary">{initials}</span>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-base truncate">{effectiveName}</p>
                  <button
                    onClick={() => { setNameInput(displayName); setPhoneInput(phoneNumber); setAvatarPreview(avatarUrl); setEditingProfile(true); }}
                    aria-label="Edit profile"
                    className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                {profileLoading && (
                  <p className="text-xs text-muted-foreground mt-0.5">Loading profile...</p>
                )}
                {!profileLoading && profileLoadError && (
                  <p className="text-xs text-muted-foreground mt-0.5">Showing your last saved info.</p>
                )}
                {phoneNumber && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {phoneNumber}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {user?.sellerVerified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="w-3 h-3" /> Verified Seller
                    </span>
                  )}
                  {user?.isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <RecentOrdersCard userId={user.id} />

        <WishlistsSummaryCard userId={user.id} />

        {!profileLoading && (
          <StyleProfileCard userId={user.id} initialSelected={preferredAesthetics} />
        )}

        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowAddresses((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors text-sm"
          >
            <span className="text-muted-foreground"><MapPin className="w-4 h-4" /></span>
            <span className="flex-1 text-left font-medium">Addresses</span>
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showAddresses ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {showAddresses && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Separator />
                <div className="p-4 space-y-3">
                  {editingAddress ? (
                    <div className="space-y-2">
                      <textarea
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        placeholder="Enter your full delivery address..."
                        className="w-full text-sm bg-muted rounded-xl p-3 resize-none h-24 outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveAddress} className="rounded-full">Save Address</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingAddress(false)} className="rounded-full">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {address ? (
                        <div className="bg-muted rounded-xl p-3 text-sm">{address}</div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No address saved yet</p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 rounded-full"
                        onClick={() => { setAddressInput(address); setEditingAddress(true); }}
                      >
                        {address ? "Edit Address" : "Add Address"}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Separator />
          <button onClick={() => setShowReturns(true)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors text-sm">
            <span className="text-muted-foreground"><RotateCcw className="w-4 h-4" /></span>
            <span className="flex-1 text-left font-medium">Returns</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <Separator />
          <button onClick={() => setShowHelp(true)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors text-sm">
            <span className="text-muted-foreground"><HelpCircle className="w-4 h-4" /></span>
            <span className="flex-1 text-left font-medium">Help & Support</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <Separator />
          <button onClick={() => setShowPrivacy(true)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors text-sm">
            <span className="text-muted-foreground"><Shield className="w-4 h-4" /></span>
            <span className="flex-1 text-left font-medium">Privacy Policy</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {(user?.isAdmin || user?.sellerVerified) && (
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            {user?.isAdmin && (
              <Link href="/admin">
                <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors text-sm">
                  <span className="text-primary"><ShieldCheck className="w-4 h-4" /></span>
                  <span className="flex-1 text-left font-medium">Admin Panel</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </Link>
            )}
            {user?.sellerVerified && (
              <Link href="/seller">
                <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors text-sm border-t border-border first:border-0">
                  <span className="text-primary"><Store className="w-4 h-4" /></span>
                  <span className="flex-1 text-left font-medium">My Seller Dashboard</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </Link>
            )}
          </div>
        )}

        <div className="bg-card border border-card-border rounded-2xl p-4 space-y-4">
          <p className="font-bold text-sm flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> App Theme</p>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Background</p>
            <div className="grid grid-cols-2 gap-2">
              {BASE_OPTIONS.map((t) => (
                <button key={t.value} onClick={() => setBase(t.value)} className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${theme.base === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
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
                <button key={a.value} onClick={() => setAccent(a.value)} title={a.label} className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${theme.accent === a.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
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

        <Button variant="outline" className="w-full rounded-2xl h-12 border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold gap-2" onClick={() => setShowSignOutConfirm(true)}>
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>

      </main>
    </div>
  );
      }
