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

// Pure typography — no dots, no connecting line, no icons. Weight and
// color alone communicate progress: done steps in full white, the current
// step bold and pink, everything ahead dim.
export default function Timeline({ status, events = [] }: TimelineProps) {
  const activeIndex = currentStepIndex(status);
  const isFinished = status === "delivered" || status === "completed";

  return (
    <div className="space-y-2.5">
      {STATUS_SEQUENCE.map((step, i) => {
        const done = i <= activeIndex;
        const isCurrent = i === activeIndex && !isFinished;
        const evt = events.find((e) => e.status === step);

        return (
          <div key={step} className="flex items-baseline justify-between gap-3">
            <p
              className={`text-[15px] ${
                isCurrent
                  ? "font-bold text-primary"
                  : done
                  ? "font-medium text-foreground"
                  : "text-muted-foreground/50"
              }`}
            >
              {STEP_LABELS[step]}
            </p>
            {evt && (
              <p className="text-[11px] text-muted-foreground shrink-0">
                {new Date(evt.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
