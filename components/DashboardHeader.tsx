"use client";

import { useState, useEffect } from "react";
import type { DashboardRow } from "@/lib/database.types";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
  rows: DashboardRow[];
  lastUpdate: Date;
  loading: boolean;
  onRefetch: () => void;
  controllerName?: string;
  onLogout?: () => void;
}

export function DashboardHeader({ rows, lastUpdate, loading, onRefetch, controllerName, onLogout }: Props) {
  const total     = rows.length;
  const pending   = rows.filter(r => r.confirmationStatus === "pending").length;
  const confirmed = rows.filter(r => r.confirmationStatus === "confirmed_in_time").length;
  const missed    = rows.filter(r => r.confirmationStatus === "missed_deadline").length;
  const scheduled = rows.filter(r => r.flightStatus === "scheduled").length;

  const avgResponse = (() => {
    const times = rows.filter(r => r.responseSeconds != null).map(r => r.responseSeconds!);
    if (!times.length) return null;
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    return `${Math.floor(avg / 60)}:${String(avg % 60).padStart(2, "0")}`;
  })();

  const pctOnTime = total > 0
    ? Math.round((confirmed / Math.max(1, confirmed + missed)) * 100)
    : null;

  const [clock, setClock] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const tick = () => {
      setClock(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDateStr(new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header style={{ flexShrink: 0, background: "var(--bg-surface)", borderBottom: "1px solid var(--bg-border)" }}>

      {/* ── Top bar ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid var(--bg-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Logo */}
          <div style={{ width: "32px", height: "32px", background: "var(--blue-primary)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L4 6v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V6L12 2z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: ".3px" }}>HCC Arr Control</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Aeroporto BSB — Chegadas</div>
          </div>
          {/* Realtime */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginLeft: "8px", padding: "3px 8px", background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: "6px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green-primary)", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "10px", color: "var(--green-light)", textTransform: "uppercase", letterSpacing: ".5px" }}>Realtime</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {controllerName && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px", background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: "8px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{controllerName}</span>
              {onLogout && <button onClick={onLogout} style={{ fontSize: "10px", color: "var(--text-hint)", background: "none", border: "none", cursor: "pointer", marginLeft: "4px" }}>Sair</button>}
            </div>
          )}
          <ThemeToggle />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{clock}</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>{dateStr} · BRT</div>
          </div>
        </div>
      </div>

      {/* ── Metrics bar ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", borderBottom: "1px solid var(--bg-border)" }}>
        {[
          { label: "Total de voos", value: String(total).padStart(2,"0"), color: "var(--blue-light)", sub: "hoje em BSB" },
          { label: "Agendados",     value: String(scheduled).padStart(2,"0"), color: "var(--text-secondary)", sub: "aguardando pouso" },
          { label: "Aguardando",    value: String(pending).padStart(2,"0"),   color: "var(--amber-light)", sub: "em campo agora", pulse: pending > 0 },
          { label: "Confirmados",   value: String(confirmed).padStart(2,"0"), color: "var(--green-light)", sub: pctOnTime != null ? `${pctOnTime}% no prazo` : "—" },
          { label: "Prazo perdido", value: String(missed).padStart(2,"0"),    color: "var(--red-light)",   sub: "requer atenção", pulse: missed > 0 },
          { label: "Tempo médio",   value: avgResponse ?? "—",               color: "var(--text-secondary)", sub: "resposta operador" },
        ].map((m, i) => (
          <div key={i} style={{
            padding: "12px 16px",
            borderRight: i < 5 ? "1px solid var(--bg-border)" : "none",
            background: "var(--bg-surface)",
          }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: "5px" }}>{m.label}</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: m.color, fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", lineHeight: 1, animation: m.pulse ? "pulse 2s infinite" : "none" }}>{m.value}</div>
            <div style={{ fontSize: "10px", color: m.color === "var(--green-light)" ? "var(--green-light)" : "var(--text-hint)", marginTop: "3px", opacity: .8 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 16px" }}>
        <div style={{ display: "flex", gap: "16px" }}>
          {[
            { keys: "↑ / NUM8", action: "Anterior" },
            { keys: "↓ / NUM2", action: "Próximo"  },
            { keys: "HOME",     action: "Topo"      },
            { keys: "F5",       action: "Atualizar" },
          ].map(({ keys, action }) => (
            <div key={keys} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <kbd style={{ padding: "1px 5px", borderRadius: "4px", background: "var(--bg-card)", border: "1px solid var(--bg-border)", fontSize: "9px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{keys}</kbd>
              <span style={{ fontSize: "9px", color: "var(--text-hint)" }}>{action}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "10px", color: "var(--text-hint)", fontFamily: "var(--font-mono)" }}>
            Atualizado: {lastUpdate.toLocaleTimeString("pt-BR")}
          </span>
          <button onClick={onRefetch} disabled={loading} style={{
            padding: "4px 10px", borderRadius: "6px",
            border: "1px solid var(--bg-border)", background: "var(--bg-card)",
            color: "var(--text-secondary)", fontSize: "10px", fontFamily: "var(--font-mono)",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .5 : 1,
          }}>
            {loading ? "..." : "↺ F5"}
          </button>
        </div>
      </div>
    </header>
  );
}
