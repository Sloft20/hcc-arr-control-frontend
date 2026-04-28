"use client";

import { useState, useMemo } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { useControllerAuth } from "@/context/ControllerAuth";
import { ControllerLoginScreen } from "@/components/ControllerLoginScreen";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FlightRow } from "@/components/FlightRow";
import { HistoryPanel } from "@/components/HistoryPanel";
import type { DashboardRow } from "@/lib/database.types";

function priority(row: DashboardRow) {
  if (row.confirmationStatus === "missed_deadline")  return 0;
  if (row.confirmationStatus === "pending")           return 1;
  if (row.flightStatus === "landed")                  return 2;
  if (row.confirmationStatus === "confirmed_in_time") return 3;
  return 4;
}

export default function DashboardPage() {
  const { isAuthenticated, controllerName, logout } = useControllerAuth();
  const { rows, loading, error, lastUpdate, refetch } = useDashboard();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => priority(a) - priority(b) || a.scheduledAt.localeCompare(b.scheduledAt)),
    [rows]
  );

  useKeyboardNav({ totalItems: sortedRows.length, selectedIndex, onSelectIndex: setSelectedIndex, onRefetch: refetch });

  // Não autenticado → tela de login
  if (!isAuthenticated) return <ControllerLoginScreen />;

  if (error) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
      <div style={{ textAlign: "center", maxWidth: "360px" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠</div>
        <p style={{ color: "var(--red-light)", fontFamily: "var(--font-mono)", fontSize: "13px", marginBottom: "8px" }}>Erro de conexão</p>
        <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "16px" }}>{error}</p>
        <button onClick={refetch} style={{ padding: "8px 16px", border: "1px solid var(--red-border)", background: "var(--red-bg)", color: "var(--red-light)", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>
          Tentar novamente
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-base)", overflow: "hidden" }}>
      <DashboardHeader
        rows={rows} lastUpdate={lastUpdate} loading={loading}
        onRefetch={refetch} controllerName={controllerName} onLogout={logout}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Tabela principal */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Cabeçalho da tabela */}
          <div style={{ display: "grid", gridTemplateColumns: "84px 56px 1fr 108px 100px 110px", gap: "8px", padding: "7px 16px", background: "var(--bg-surface)", borderBottom: "1px solid var(--bg-border)", flexShrink: 0 }}>
            {["VOO", "PORTÃO", "OPERADOR", "TIMESTAMPS", "SLA", "STATUS"].map(col => (
              <div key={col} style={{ fontSize: "9px", color: "var(--text-hint)", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600 }}>{col}</div>
            ))}
          </div>

          {/* Linhas */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading && sortedRows.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid var(--bg-border)", display: "grid", gridTemplateColumns: "84px 56px 1fr 108px 100px 110px", gap: "8px", alignItems: "center" }}>
                    {[80, 40, 120, 90, 80, 70].map((w, j) => (
                      <div key={j} style={{ height: "12px", width: `${w}px`, borderRadius: "4px", background: "var(--bg-card)", animation: "pulse 2s infinite" }} />
                    ))}
                  </div>
                ))
              : sortedRows.length === 0
              ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", gap: "8px" }}>
                  <div style={{ fontSize: "24px", opacity: .3 }}>◈</div>
                  <p style={{ fontSize: "12px", color: "var(--text-hint)", textTransform: "uppercase", letterSpacing: ".5px" }}>Nenhum voo para hoje</p>
                </div>
              )
              : sortedRows.map((row, i) => (
                  <FlightRow
                    key={row.flightId} row={row}
                    isSelected={i === selectedIndex} index={i}
                    onRefetch={refetch}
                  />
                ))
            }
          </div>
        </div>

        {/* Histórico */}
        <HistoryPanel rows={rows} />
      </div>

      <footer style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 16px", borderTop: "1px solid var(--bg-border)", background: "var(--bg-surface)" }}>
        <span style={{ fontSize: "10px", color: "var(--text-hint)", fontFamily: "var(--font-mono)" }}>HCC Arr Control v2.0</span>
        <span style={{ fontSize: "10px", color: "var(--text-hint)", fontFamily: "var(--font-mono)" }}>
          {sortedRows.length} voo(s) · {sortedRows[selectedIndex] ? `Selecionado: ${sortedRows[selectedIndex].flightCode}` : ""}
        </span>
      </footer>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  );
}
