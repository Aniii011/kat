import React from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/context/auth-context";
import { Home, Recycle, Search, ShoppingBag, User, ShieldCheck, Store } from "lucide-react";

const TABS = [
  { href: "/",             icon: Home,        label: "Home",   thrift: false },
  { href: "/thrift-drops", icon: Recycle,     label: "Thrift", thrift: true  },
  { href: "/search",       icon: Search,      label: "Search", thrift: false },
  { href: "/cart",         icon: ShoppingBag, label: "Cart",   thrift: false },
  { href: "/me",           icon: User,        label: "Me",     thrift: false },
] as const;

export default function BottomNav() {
  const [location] = useLocation();
  const { totalItems } = useCart();
  const { user } = useAuth();

  return (
    <>
      {/* ── Mobile bottom nav ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-background/98 backdrop-blur-xl border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex w-full h-[62px]">
          {TABS.map(({ href, icon: Icon, label, thrift }) => {
            const active =
              location === href ||
              (href !== "/" && location.startsWith(href));
            const isCart = href === "/cart";
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-[3px] relative select-none"
              >
                {thrift && (
                  <span
                    className={`absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full transition-all duration-300 ${
                      active ? "bg-primary opacity-20" : "bg-primary/8"
                    }`}
                  />
                )}
                <AnimatePresence>
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                </AnimatePresence>
                <motion.div
                  animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  className="relative flex items-center justify-center"
                >
                  <Icon
                    className={`transition-colors duration-200 ${
                      thrift && !active
                        ? "text-primary/70"
                        : active
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                    style={{ width: 22, height: 22 }}
                    strokeWidth={active ? 2.4 : 1.9}
                  />
                  {isCart && totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-[5px] -right-[5px] min-w-[16px] h-[16px] bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-[3px]"
                    >
                      {totalItems > 9 ? "9+" : totalItems}
                    </motion.span>
                  )}
                </motion.div>
                <span
                  className={`text-[10px] leading-none font-semibold tracking-tight transition-colors duration-200 ${
                    thrift && !active
                      ? "text-primary/80"
                      : active
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop left sidebar ── */}
      <aside className="hidden sm:flex fixed left-0 top-0 h-full w-56 z-40 bg-background/98 backdrop-blur-xl border-r border-border flex-col py-6 px-3">
        {/* Logo */}
        <Link href="/">
          <span className="text-2xl font-black text-primary px-3 mb-8 block cursor-pointer">
            KAT
          </span>
        </Link>

        {/* Main nav links */}
        <div className="flex flex-col gap-1 flex-1">
          {TABS.map(({ href, icon: Icon, label, thrift }) => {
            const active =
              location === href ||
              (href !== "/" && location.startsWith(href));
            const isCart = href === "/cart";
            return (
              <Link key={href} href={href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="relative">
                    <Icon
                      style={{ width: 20, height: 20 }}
                      strokeWidth={active ? 2.4 : 1.9}
                      className={thrift && !active ? "text-primary/70" : ""}
                    />
                    {isCart && totalItems > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-[3px]">
                        {totalItems > 9 ? "9+" : totalItems}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                  {thrift && (
                    <span className="ml-auto text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                      NEW
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Admin link */}
          {user?.isAdmin && (
            <Link href="/admin/sellers">
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer mt-1 ${
                  location.startsWith("/admin")
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <ShieldCheck style={{ width: 20, height: 20 }} strokeWidth={1.9} />
                <span className="text-sm font-medium">Admin</span>
              </div>
            </Link>
          )}

          {/* Seller link */}
          {user?.sellerVerified && (
            <Link href="/seller">
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  location === "/seller"
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Store style={{ width: 20, height: 20 }} strokeWidth={1.9} />
                <span className="text-sm font-medium">My Store</span>
              </div>
            </Link>
          )}
        </div>

        {/* User info at bottom */}
        {user && (
          <div className="mt-auto px-3 py-3 bg-muted rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-[11px] font-black text-primary-foreground">
                  {(user.name || user.email || "KA").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">
                  {user.name || user.email}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Desktop content offset ── */}
      <div className="hidden sm:block w-56 shrink-0" />
    </>
  );
}
