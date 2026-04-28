"use client";

import { useCountdown } from "@/hooks/useCountdown";

interface CountdownBarProps {
  touchdownAt: string | null;
  deadlineSeconds: number;
  confirmedAt: string | null;
  responseSeconds: number | null;
  confirmationStatus: string | null;
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function CountdownBar({ touchdownAt, deadlineSeconds, confirmedAt, responseSeconds, confirmationStatus }: CountdownBarProps) {
  const isPending = confirmationStatus === "pending";
  const { remaining, percentUsed, isUrgent, isExpired } = useCountdown(touchdownAt, deadlineSeconds, isPending);

  if (!touchdownAt) return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "3px", background: "var(--bg-border)", borderRadius: "2px" }} />
      <span style={{ fontSize: "10px", color: "var(--text-hint)", width: "36px", textAlign: "right" }}>—</span>
    </div>
  );

  if (confirmationStatus === "confirmed_in_time" && responseSeconds != null) {
    const w = Math.min(100, (responseSeconds / deadlineSeconds) * 100);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ flex: 1, height: "3px", background: "var(--green-bg)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${w}%`, background: "var(--green-primary)", borderRadius: "2px" }} />
        </div>
        <span style={{ fontSize: "10px", color: "var(--green-light)", width: "36px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>+{fmt(responseSeconds)}</span>
      </div>
    );
  }

  if (confirmationStatus === "missed_deadline") return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "3px", background: "var(--red-bg)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: "100%", background: "var(--red-primary)", borderRadius: "2px" }} />
      </div>
      <span style={{ fontSize: "10px", color: "var(--red-light)", width: "48px", textAlign: "right" }}>EXPIROU</span>
    </div>
  );

  const barColor = isExpired ? "var(--red-primary)" : isUrgent ? "#f97316" : percentUsed > 60 ? "var(--amber-primary)" : "var(--green-primary)";
  const textColor = isExpired ? "var(--red-light)" : isUrgent ? "#fb923c" : "var(--amber-light)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "3px", background: "var(--bg-border)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${percentUsed}%`, background: barColor, borderRadius: "2px", transition: "width 1s linear" }} />
      </div>
      <span style={{ fontSize: "10px", color: textColor, width: "36px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {isExpired ? "0:00" : fmt(remaining)}
      </span>
    </div>
  );
}
