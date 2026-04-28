"use client";

// ============================================================
//  components/AssignOperatorModal.tsx
//  Modal para o controlador atribuir um operador a um voo
//  que não tem ninguém escalado
// ============================================================

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Operator {
  id: string;
  name: string;
  badge_id: string;
}

interface Props {
  flightId: string;
  flightCode: string;
  gate: string;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignOperatorModal({ flightId, flightCode, gate, onClose, onAssigned }: Props) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchOperators = async () => {
      const { data } = await supabase
        .from("operators")
        .select("id, name, badge_id")
        .eq("active", true)
        .order("name");
      setOperators(data ?? []);
      setLoading(false);
    };
    fetchOperators();
  }, []);

  const handleAssign = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");

    try {
      // Upsert na daily_schedules
      const { data: scheduleData, error: schedErr } = await supabase
        .from("daily_schedules")
        .upsert({
          operator_id: selected,
          flight_id: flightId,
          operation_date: today,
          notes: "Atribuído manualmente pelo controlador",
        }, { onConflict: "operator_id,flight_id,operation_date" })
        .select("id")
        .single();

      if (schedErr) throw schedErr;

      // Se o voo já está landed, criar gate_confirmation imediatamente
      const { data: flightData } = await supabase
        .from("flights")
        .select("status, landed_at")
        .eq("id", flightId)
        .single();

      if (flightData?.status === "landed" && flightData?.landed_at) {
        await supabase.from("gate_confirmations").insert({
          schedule_id: scheduleData.id,
          touchdown_at: flightData.landed_at,
          status: "pending",
          deadline_seconds: 180,
        });
      }

      onAssigned();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Erro ao atribuir operador.");
    } finally {
      setSaving(false);
    }
  };

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.6)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "16px",
      }}
    >
      {/* Modal */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "420px",
          background: "var(--bg-surface)",
          border: "1px solid var(--bg-border)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--bg-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Atribuir Operador</h3>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Voo sem operador escalado</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "18px" }}>✕</button>
        </div>

        {/* Flight info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "14px 20px", gap: "12px", background: "var(--bg-card)", borderBottom: "1px solid var(--bg-border)" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "3px" }}>Voo</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{flightCode}</div>
          </div>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "3px" }}>Portão</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--blue-light)", fontFamily: "var(--font-mono)" }}>{gate}</div>
          </div>
        </div>

        {/* Operator list */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "4px" }}>
            Selecione o operador
          </p>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
              <div style={{ width: "24px", height: "24px", border: "2px solid var(--bg-border)", borderTopColor: "var(--blue-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            </div>
          ) : operators.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>Nenhum operador ativo encontrado</p>
          ) : (
            operators.map(op => (
              <div
                key={op.id}
                onClick={() => setSelected(op.id)}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: `1.5px solid ${selected === op.id ? "var(--blue-primary)" : "var(--bg-border)"}`,
                  background: selected === op.id ? "var(--blue-bg)" : "var(--bg-card)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  transition: "all .15s",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: "36px", height: "36px",
                  background: selected === op.id ? "var(--blue-primary)" : "var(--bg-hover)",
                  borderRadius: "10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: 700,
                  color: selected === op.id ? "white" : "var(--text-secondary)",
                  flexShrink: 0,
                }}>
                  {op.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{op.name}</div>
                  <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--blue-light)", marginTop: "1px" }}>{op.badge_id}</div>
                </div>
                {selected === op.id && (
                  <div style={{ marginLeft: "auto" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue-light)" strokeWidth="2.5"><polyline points="4,12 9,17 20,6"/></svg>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin: "0 20px", padding: "10px 14px", background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--red-light)" }}>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--bg-border)", display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", border: "1px solid var(--bg-border)", background: "var(--bg-card)", color: "var(--text-secondary)", borderRadius: "10px", fontSize: "13px", cursor: "pointer" }}>
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            disabled={!selected || saving}
            style={{
              flex: 2, padding: "11px",
              background: selected ? "var(--blue-primary)" : "var(--bg-card)",
              border: "none", borderRadius: "10px",
              fontSize: "13px", fontWeight: 700,
              color: selected ? "white" : "var(--text-hint)",
              cursor: selected && !saving ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            {saving
              ? <><div style={{ width: "14px", height: "14px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Atribuindo...</>
              : "✓ Confirmar Atribuição"
            }
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
