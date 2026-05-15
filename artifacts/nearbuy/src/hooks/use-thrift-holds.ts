import { useState, useEffect, useCallback } from "react";

export type HoldStatus = "available" | "held_by_me" | "sold";

export interface ThriftHold {
  listingId: number;
  expiryMs: number;
  depositPaid: number;
}

const STORAGE_KEY = "dripp_thrift_holds";
const HOLD_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadHolds(): ThriftHold[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ThriftHold[];
  } catch {}
  return [];
}

function saveHolds(holds: ThriftHold[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holds));
}

function pruneExpired(holds: ThriftHold[]): ThriftHold[] {
  const now = Date.now();
  return holds.filter((h) => h.expiryMs > now);
}

export function useThriftHolds() {
  const [holds, setHolds] = useState<ThriftHold[]>(() => pruneExpired(loadHolds()));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setHolds((prev) => {
        const pruned = pruneExpired(prev);
        if (pruned.length !== prev.length) saveHolds(pruned);
        return pruned;
      });
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const holdItem = useCallback((listingId: number, depositAmount: number) => {
    setHolds((prev) => {
      const next = [
        ...prev.filter((h) => h.listingId !== listingId),
        { listingId, expiryMs: Date.now() + HOLD_DURATION_MS, depositPaid: depositAmount },
      ];
      saveHolds(next);
      return next;
    });
  }, []);

  const releaseHold = useCallback((listingId: number) => {
    setHolds((prev) => {
      const next = prev.filter((h) => h.listingId !== listingId);
      saveHolds(next);
      return next;
    });
  }, []);

  const getHold = useCallback((listingId: number): ThriftHold | null =>
    holds.find((h) => h.listingId === listingId) ?? null, [holds]);

  const getStatus = useCallback((listingId: number): HoldStatus => {
    const hold = holds.find((h) => h.listingId === listingId);
    if (!hold) return "available";
    if (hold.expiryMs > Date.now()) return "held_by_me";
    return "available";
  }, [holds]);

  const getTimeRemaining = useCallback((listingId: number): string => {
    const hold = holds.find((h) => h.listingId === listingId);
    if (!hold) return "";
    const ms = hold.expiryMs - Date.now();
    if (ms <= 0) return "Expired";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [holds, tick]);

  return { holds, holdItem, releaseHold, getHold, getStatus, getTimeRemaining };
}
