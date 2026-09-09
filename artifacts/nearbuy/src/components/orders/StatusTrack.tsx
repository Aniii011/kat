import { motion } from "framer-motion";
import { currentStepIndex, STATUS_SEQUENCE, type OrderStatus } from "@/lib/order-status";

interface StatusTrackProps {
  status: OrderStatus;
}

// A single hairline. No steps, no icons, no labels — the status word next
// to it already says what's happening. This is the "receipt edge" motif
// used on the card: a quiet line that fills as the order moves, with a
// soft glint riding the leading edge while it's actively in transit.
export default function StatusTrack({ status }: StatusTrackProps) {
  if (status === "cancelled" || status === "delivered" || status === "completed") return null;

  const activeIndex = currentStepIndex(status);
  const pct = Math.max(6, (activeIndex / (STATUS_SEQUENCE.length - 1)) * 100);

  return (
    <div className="relative h-[3px] rounded-full bg-muted overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-primary"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute inset-y-0 w-6 bg-gradient-to-r from-transparent via-white/60 to-transparent"
        animate={{ left: ["0%", `${pct}%`] }}
        transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
      />
    </div>
  );
}
