"use client";

import { useRef, useEffect, useState } from "react";
import type { DashboardRow } from "@/lib/database.types";
import { StatusBadge, resolveTrafficLight } from "./StatusBadge";
import { CountdownBar } from "./CountdownBar";
import { AssignOperatorModal } from "./AssignOperatorModal";

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

const borderColors: Record<string, string> = {
  red:   "var(--red-primary)",
  amber: "var(--amber-primary)",
  green: "var(--green-primary)",
  gray:  "var(--bg-border)",
};

const rowBg: Record<string, string> = {
  red:   "var(--red-bg)",
  amber: "var(--amber-bg)",
  green: "var(--green-bg)",
  gray:  "transparent",
};

interface Props {
  row: DashboardRow;
  isSelected: boolean;
  index: number;
  onRefetch: () => void;
}

export function FlightRow({ row, isSelected, index, onRefetch }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [showAssign, setShowAssign] = useState(false);
  const light = resolveTrafficLight(row.flightStatus, row.confirmationStatus);

  useEffect(() => {
    if (isSelected) ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [isSelected]);

  const hasOperator = !!row.operatorName;

  return (
    <>
      <div
        ref={ref}
        style={{
          display: "grid",
          gridTemplateColumns: "84px 56px 1fr 108px 100px 110px",
          gap: "8px", alignItems: "center",
          padding: "10px 16px",
          borderBottom: "1px solid var(--bg-border)",
          background: rowBg[light.color],
          outline: isSelected ? "1px solid rgba(96,165,250,0.4)" : "none",
          outlineOffset: "-1px",
          borderLeft: isSelected ? "3px solid #60a5fa" : `3px solid ${borderColors[light.color]}`,
          transition: "background .15s",
          cursor: "default",
        }}
      >
        {/* Voo */}
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)", letterSpacing: ".5px" }}>{row.flightCode}</div>
          <div style={{ fontSize: "10px", color: "var(--text-hint)", marginTop: "2px", fontFamily: "var(--font-mono)" }}>{fmtTime(row.scheduledAt)}</div>
        </div>

        {/* Portão */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--blue-light)", fontFamily: "var(--font-mono)" }}>{row.gate}</div>
          <div style={{ fontSize: "9px", color: "var(--text-hint)", textTransform: "uppercase", letterSpacing: ".5px" }}>portão</div>
        </div>

        {/* Operador */}
        <div>
          {!hasOperator ? (
            /* Sem operador — botão atribuir */
            <button
              onClick={() => setShowAssign(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "4px 10px", borderRadius: "6px",
                border: "1px dashed var(--amber-border)",
                background: "var(--amber-bg)", color: "var(--amber-light)",
                fontSize: "11px", fontWeight: 600, cursor: "pointer",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Atribuir operador
            </button>
          ) : (
            /* Com operador — nome + badge + botão trocar */
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.operatorName}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                  {row.operatorBadge}
                </div>
              </div>
              <button
                onClick={() => setShowAssign(true)}
                title="Trocar operador"
                style={{
                  flexShrink: 0,
                  display: "inline-flex", alignItems: "center", gap: "3px",
                  padding: "3px 7px", borderRadius: "5px",
                  border: "1px solid var(--bg-border)",
                  background: "var(--bg-card)", color: "var(--text-muted)",
                  fontSize: "10px", cursor: "pointer",
                  transition: "all .15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--blue-border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--blue-light)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bg-border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Trocar
              </button>
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div style={{ fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.7 }}>
          <div>Pouso <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{fmtTime(row.landedAt)}</span></div>
          <div>Confirm. <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{fmtTime(row.confirmedAt)}</span></div>
        </div>

        {/* SLA */}
        <CountdownBar
          touchdownAt={row.touchdownAt} deadlineSeconds={row.deadlineSeconds}
          confirmedAt={row.confirmedAt} responseSeconds={row.responseSeconds}
          confirmationStatus={row.confirmationStatus}
        />

        {/* Status */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <StatusBadge flightStatus={row.flightStatus} confirmationStatus={row.confirmationStatus} />
        </div>
      </div>

      {showAssign && (
        <AssignOperatorModal
          flightId={row.flightId}
          flightCode={row.flightCode}
          gate={row.gate}
          currentOperatorId={row.scheduleId ?? undefined}
          onClose={() => setShowAssign(false)}
          onAssigned={onRefetch}
        />
      )}
    </>
  );
}
