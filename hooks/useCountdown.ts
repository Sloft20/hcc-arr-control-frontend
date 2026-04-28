"use client";

// ============================================================
//  hooks/useCountdown.ts — v2
//  Suporta tempo negativo (continua contando após expirar)
// ============================================================

import { useState, useEffect } from "react";

interface CountdownResult {
  elapsed: number;
  remaining: number;
  overflow: number;      // Segundos além do prazo
  percentUsed: number;
  isExpired: boolean;
  isUrgent: boolean;
}

export function useCountdown(
  touchdownAt: string | null,
  deadlineSeconds: number,
  active: boolean
): CountdownResult {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || !touchdownAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, touchdownAt]);

  if (!touchdownAt || !active) {
    return { elapsed: 0, remaining: deadlineSeconds, overflow: 0, percentUsed: 0, isExpired: false, isUrgent: false };
  }

  const elapsed = Math.floor((now - new Date(touchdownAt).getTime()) / 1000);
  const remaining = Math.max(0, deadlineSeconds - elapsed);
  const overflow = Math.max(0, elapsed - deadlineSeconds);
  const percentUsed = Math.min(100, (elapsed / deadlineSeconds) * 100);

  return {
    elapsed,
    remaining,
    overflow,
    percentUsed,
    isExpired: elapsed > deadlineSeconds,
    isUrgent: remaining > 0 && remaining <= 30,
  };
}
