import React from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { Home, Recycle, Search, ShoppingBag, User } from "lucide-react";

const TABS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/thrift-drops", icon: Recycle, label: "Thrift" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/cart", icon: ShoppingBag, label: "Cart" },
  { href: "/me", icon: User, label: "Me" },
] as const;

export default function BottomNav() {
  const [location] = useLocation();
  const { totalItems } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-background/95 backdrop-blur-md border-t border-border safe-area-pb">
      <div className="flex h-16">
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = location === href || (href !== "/" && location.startsWith(href));
          const isCart = href === "/cart";

          return (
            <Link key={href} href={href}>
              <button className="flex-1 w-full h-full flex flex-col items-center justify-center gap-0.5 relative">
                <motion.div
                  animate={{ scale: active ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="relative"
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {isCart && totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center"
                    >
                      {totalItems > 9 ? "9+" : totalItems}
                    </motion.span>
                  )}
                </motion.div>
                <span className={`text-[10px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                  {label}
                </span>
                {active && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
