import { useEffect } from "react";
import { Link } from "wouter";
import { motion, useAnimationControls } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { CART_ADDED_EVENT } from "@/lib/cart-feedback";

// Top-right cart icon with a live count. It is the preferred landing spot for the
// fly-to-cart animation (data-cart-target="primary"), and it bounces on arrival.
export default function HeaderCartButton() {
  const { totalItems } = useCart();
  const controls = useAnimationControls();

  useEffect(() => {
    const onAdded = () => {
      controls.start({
        scale: [1, 1.45, 0.9, 1.1, 1],
        rotate: [0, -14, 10, -4, 0],
        transition: { duration: 0.55 },
      });
    };
    window.addEventListener(CART_ADDED_EVENT, onAdded);
    return () => window.removeEventListener(CART_ADDED_EVENT, onAdded);
  }, [controls]);

  return (
    <Link href="/cart">
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-full relative"
        aria-label="Cart"
        data-cart-target="primary"
      >
        <motion.span animate={controls} className="flex">
          <ShoppingBag className="w-4 h-4" />
        </motion.span>
        {totalItems > 0 && (
          <motion.span
            key={totalItems}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-[3px]"
          >
            {totalItems > 9 ? "9+" : totalItems}
          </motion.span>
        )}
      </Button>
    </Link>
  );
}
