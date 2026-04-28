"use client";

// ============================================================
//  components/HistoryPanel.tsx
//  Painel lateral de histórico de ocorrências do dia
// ============================================================

import type { DashboardRow } from "@/lib/database.types";

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

function fmtElapsed(iso: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `há ${mins}min`;
  return `há ${Math.floor(mins / 60)}h${mins % 60 > 0 ? String(mins % 60).padStart(2,"0") : ""}`;
}

function fmtSeconds(s: number | null) {
  if (s == null) return "—";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function HistoryPanel({ rows }: { rows: DashboardRow[] }) {
  const resolved = rows
    .filter(r => r.confirmationStatus === "confirmed_in_time" || r.confirmationStatus === "missed_deadline")
    .sort((a, b) => (b.confirmedAt ?? b.touchdownAt ?? "").localeCompare(a.confirmedAt ?? a.touchdownAt ?? ""));

  return (
    <aside style={{
      width: "260px",
      flexShrink: 0,
      background: "var(--bg-surface)",
      borderLeft: "1px solid var(--bg-border)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--bg-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".7px", fontWeight: 600 }}>
          Histórico de ocorrências
        </span>
        <span style={{
          fontSize: "10px",
          background: "var(--bg-card)",
          border: "1px solid var(--bg-border)",
          borderRadius: "10px",
          padding: "1px 7px",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-mono)",
        }}>{resolved.length}</span>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {resolved.length === 0 ? (
          <div style={{ padding: "24px 14px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", marginBottom: "8px", opacity: .3 }}>◈</div>
            <p style={{ fontSize: "11px", color: "var(--text-hint)" }}>Nenhuma ocorrência ainda</p>
          </div>
        ) : (
          resolved.map((row) => {
            const isOk = row.confirmationStatus === "confirmed_in_time";
            return (
              <div key={row.flightId} style={{
                padding: "10px 14px",
                borderBottom: "1px solid var(--bg-border)",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}>
                {/* Icon */}
                <div style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isOk ? "var(--green-bg)" : "var(--red-bg)",
                  border: `1px solid ${isOk ? "var(--green-border)" : "var(--red-border)"}`,
                }}>
                  {isOk
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green-light)" strokeWidth="2.5"><polyline points="4,12 9,17 20,6"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red-light)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  }
                </div>

                {/* Body */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                      {row.flightCode}
                    </span>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "var(--blue-light)",
                      background: "var(--blue-bg)",
                      border: "1px solid var(--blue-border)",
                      borderRadius: "4px",
                      padding: "0 5px",
                      fontFamily: "var(--font-mono)",
                    }}>{row.gate}</span>
                  </div>

                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px", lineHeight: 1.6 }}>
                    <div>{row.operatorName ?? "Sem operador"}</div>
                    <div>
                      Pouso {fmtTime(row.touchdownAt)} ·{" "}
                      <span style={{ color: isOk ? "var(--green-light)" : "var(--red-light)" }}>
                        {isOk ? `+${fmtSeconds(row.responseSeconds)}` : "Não confirmou"}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: "10px", color: "var(--text-hint)", marginTop: "3px" }}>
                    {fmtTime(row.confirmedAt ?? row.touchdownAt)} · {fmtElapsed(row.confirmedAt ?? row.touchdownAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
