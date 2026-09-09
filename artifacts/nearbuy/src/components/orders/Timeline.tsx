import { motion } from "framer-motion";
import { STATUS_SEQUENCE, currentStepIndex, type OrderStatus } from "@/lib/order-status";

const STEP_LABELS: Record<string, string> = {
  pending: "Order placed",
  accepted: "Confirmed by seller",
  preparing: "Prepared for delivery",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

interface TimelineProps {
  status: OrderStatus;
  events?: { status: string; created_at: string }[];
}

export default function Timeline({ status, events = [] }: TimelineProps) {
  const activeIndex = currentStepIndex(status);

  return (
    <div className="relative pl-1">
      {/* connecting line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
      <motion.div
        className="absolute left-[7px] top-2 w-px bg-primary"
        initial={{ height: 0 }}
        animate={{ height: `${(activeIndex / (STATUS_SEQUENCE.length - 1)) * 100}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="space-y-5">
        {STATUS_SEQUENCE.map((step, i) => {
          const done = i <= activeIndex;
          const isCurrent = i === activeIndex && status !== "delivered" && status !== "completed";
          const evt = events.find((e) => e.status === step);

          return (
            <div key={step} className="relative flex items-start gap-3.5 pl-0">
              <span
                className={`relative z-10 mt-1 shrink-0 rounded-full transition-colors ${
                  isCurrent
                    ? "w-3.5 h-3.5 bg-primary ring-4 ring-primary/15"
                    : done
                    ? "w-3.5 h-3.5 bg-primary"
                    : "w-3.5 h-3.5 bg-background border-2 border-border"
                }`}
              />
              <div className="flex-1 min-w-0 flex items-baseline justify-between gap-3">
                <p
                  className={`text-sm ${
                    isCurrent ? "font-bold text-foreground" : done ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {STEP_LABELS[step]}
                </p>
                {evt && (
                  <p className="text-[11px] text-muted-foreground font-mono shrink-0">
                    {new Date(evt.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
