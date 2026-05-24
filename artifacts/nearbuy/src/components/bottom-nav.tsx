import React from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { Home, Recycle, Search, ShoppingBag, User } from "lucide-react";

const TABS = [
  { href: "/",            icon: Home,       label: "Home",   thrift: false },
  { href: "/thrift-drops",icon: Recycle,    label: "Thrift", thrift: true  },
  { href: "/search",      icon: Search,     label: "Search", thrift: false },
  { href: "/cart",        icon: ShoppingBag,label: "Cart",   thrift: false },
  { href: "/me",          icon: User,       label: "Me",     thrift: false },
] as const;

export default function BottomNav() {
  const [location] = useLocation();
  const { totalItems } = useCart();

  return (
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
            /* ── Key fix: the <a> itself is the flex child ── */
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-[3px] relative select-none"
            >
              {/* Thrift accent pill behind icon */}
              {thrift && (
                <span
                  className={`absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full transition-all duration-300 ${
                    active
                      ? "bg-primary opacity-20"
                      : "bg-primary/8"
                  }`}
                />
              )}

              {/* Top active indicator */}
              <AnimatePresence>
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </AnimatePresence>

              {/* Icon */}
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

                {/* Cart badge */}
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

              {/* Label */}
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
  );
}
