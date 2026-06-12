import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/context/auth-context";
import {
  Home, Recycle, Search, ShoppingBag, User,
  ShieldCheck, Store, Menu, X,
} from "lucide-react";

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
  const [expanded, setExpanded] = useState(false);

  const allTabs = [
    ...TABS,
    ...(user?.isAdmin ? [{ href: "/admin/sellers", icon: ShieldCheck, label: "Admin", thrift: false }] : []),
    ...(user?.sellerVerified ? [{ href: "/seller", icon: Store, label: "My Store", thrift: false }] : []),
  ];

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
                  <span className={`absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full transition-all duration-300 ${active ? "bg-primary opacity-20" : "bg-primary/8"}`} />
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
                    className={`transition-colors duration-200 ${thrift && !active ? "text-primary/70" : active ? "text-primary" : "text-muted-foreground"}`}
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
                <span className={`text-[10px] leading-none font-semibold tracking-tight transition-colors duration-200 ${thrift && !active ? "text-primary/80" : active ? "text-primary" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop left icon rail ── */}
      <nav className="hidden sm:flex fixed left-0 top-0 h-full z-40 flex-col items-center py-4 gap-1 bg-background/98 backdrop-blur-xl border-r border-border w-16">

        {/* Hamburger menu button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors mb-2 text-muted-foreground hover:text-foreground"
        >
          <AnimatePresence mode="wait">
            {expanded ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X style={{ width: 20, height: 20 }} />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Menu style={{ width: 20, height: 20 }} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Nav items */}
        {allTabs.map(({ href, icon: Icon, label, thrift }) => {
          const active =
            location === href ||
            (href !== "/" && location.startsWith(href));
          const isCart = href === "/cart";

          return (
            <Link key={href} href={href} className="w-full px-2">
              <motion.div
                className={`group relative flex items-center rounded-xl px-2.5 py-2.5 cursor-pointer transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                whileHover="hovered"
              >
                {/* Icon */}
                <div className="relative shrink-0">
                  <Icon
                    style={{ width: 22, height: 22 }}
                    strokeWidth={active ? 2.4 : 1.9}
                    className={thrift && !active ? "text-primary/70" : ""}
                  />
                  {isCart && totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-[3px]">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </div>

                {/* Label — shows on hover OR when expanded */}
                <AnimatePresence>
                  {expanded ? (
                    <motion.span
                      key="expanded"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="ml-3 text-sm font-semibold whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  ) : (
                    <motion.div
                      key="tooltip"
                      variants={{
                        hovered: { opacity: 1, x: 0, display: "flex" },
                      }}
                      initial={{ opacity: 0, x: -5, display: "none" }}
                      className="absolute left-14 bg-background border border-border shadow-lg rounded-xl px-3 py-1.5 whitespace-nowrap z-50"
                    >
                      <span className="text-sm font-semibold text-foreground">
                        {label}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}

        {/* User avatar at bottom */}
        {user && (
          <div className="mt-auto w-full px-2">
            <Link href="/me">
              <motion.div
                className="group relative flex items-center rounded-xl px-2.5 py-2 cursor-pointer hover:bg-muted transition-colors"
                whileHover="hovered"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-black text-primary-foreground">
                    {(user.name || user.email || "KA").slice(0, 2).toUpperCase()}
                  </span>
                </div>

                <AnimatePresence>
                  {expanded ? (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="ml-3 flex flex-col min-w-0"
                    >
                      <span className="text-xs font-semibold truncate">{user.name || "User"}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="tooltip"
                      variants={{
                        hovered: { opacity: 1, x: 0, display: "flex" },
                      }}
                      initial={{ opacity: 0, x: -5, display: "none" }}
                      className="absolute left-14 bg-background border border-border shadow-lg rounded-xl px-3 py-2 whitespace-nowrap z-50 flex-col"
                    >
                      <span className="text-xs font-semibold">{user.name || "User"}</span>
                      <span className="text-[10px] text-muted-foreground">{user.email}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}
