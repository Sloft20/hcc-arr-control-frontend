"use client";

// ============================================================
//  components/AssignOperatorModal.tsx — v2
//  + Campo de portão obrigatório
//  + Atualiza o portão no voo ao confirmar
// ============================================================

import { useState, useEffect } from "react";
import { createClient } from "@db/db-js";

// Cliente sem tipagem genérica para operações de update neste modal
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [gateValue, setGateValue] = useState(gate === "—" ? "" : gate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    db
      .from("operators")
      .select("id, name, badge_id")
      .eq("active", true)
      .order("name")
      .then(({ data }) => {
        setOperators(data ?? []);
        setLoading(false);
      });
  }, []);

  const handleAssign = async () => {
    if (!selected) { setError("Selecione um operador."); return; }
    if (!gateValue.trim()) { setError("Informe o portão de chegada."); return; }

    setSaving(true);
    setError("");

    try {
      // 1. Atualizar portão no voo
      const { error: gateErr } = await db
        .from("flights")
        .update({ gate: gateValue.trim().toUpperCase() })
        .eq("id", flightId);
      if (gateErr) throw gateErr;

      // 2. Upsert daily_schedule
      const { data: scheduleData, error: schedErr } = await db
        .from("daily_schedules")
        .upsert({
          operator_id:    selected,
          flight_id:      flightId,
          operation_date: today,
          notes: "Atribuído manualmente pelo controlador",
        }, { onConflict: "operator_id,flight_id,operation_date" })
        .select("id")
        .single();
      if (schedErr) throw schedErr;

      // 3. Se o voo já está landed, criar gate_confirmation
      const { data: flightData } = await db
        .from("flights")
        .select("status, landed_at")
        .eq("id", flightId)
        .single();

      if (flightData?.status === "landed" && flightData?.landed_at) {
        const { data: existing } = await db
          .from("gate_confirmations")
          .select("id")
          .eq("schedule_id", scheduleData.id)
          .limit(1);

        if (!existing?.length) {
          const { error: confErr } = await db
            .from("gate_confirmations")
            .insert({
              schedule_id:      scheduleData.id,
              touchdown_at:     flightData.landed_at,
              status:           "pending",
              deadline_seconds: 180,
            });
          if (confErr) throw confErr;
        }
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
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "440px", background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-md)" }}
      >
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--bg-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Atribuir Operador</h3>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Voo <strong>{flightCode}</strong> sem operador escalado</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "20px", lineHeight: 1 }}>✕</button>
        </div>

        {/* Campo de portão */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--bg-border)", background: "var(--bg-card)" }}>
          <label style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: "8px", fontWeight: 600 }}>
            Portão de chegada <span style={{ color: "var(--red-light)" }}>*</span>
          </label>
          <input
            type="text"
            value={gateValue}
            onChange={e => setGateValue(e.target.value.toUpperCase())}
            placeholder="Ex: P50, A12, B07"
            maxLength={6}
            style={{
              width: "100%", padding: "10px 14px",
              fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-mono)",
              letterSpacing: "2px", textAlign: "center",
              background: "var(--bg-input)",
              border: `2px solid ${gateValue ? "var(--blue-primary)" : "var(--bg-border)"}`,
              borderRadius: "10px", color: "var(--text-primary)", outline: "none",
              transition: "border-color .15s",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--blue-primary)")}
            onBlur={e => (e.target.style.borderColor = gateValue ? "var(--blue-primary)" : "var(--bg-border)")}
          />
        </div>

        {/* Lista de operadores */}
        <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "260px", overflowY: "auto" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "6px", fontWeight: 600 }}>
            Selecione o operador
          </p>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
              <div style={{ width: "24px", height: "24px", border: "2px solid var(--bg-border)", borderTopColor: "var(--blue-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            </div>
          ) : operators.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>Nenhum operador ativo</p>
          ) : (
            operators.map(op => (
              <div
                key={op.id}
                onClick={() => setSelected(op.id)}
                style={{
                  padding: "10px 14px", borderRadius: "10px",
                  border: `1.5px solid ${selected === op.id ? "var(--blue-primary)" : "var(--bg-border)"}`,
                  background: selected === op.id ? "var(--blue-bg)" : "var(--bg-card)",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "12px",
                  transition: "all .15s",
                }}
              >
                <div style={{
                  width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                  background: selected === op.id ? "var(--blue-primary)" : "var(--bg-hover)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: 700,
                  color: selected === op.id ? "white" : "var(--text-secondary)",
                }}>
                  {op.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{op.name}</div>
                  <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--blue-light)", marginTop: "1px" }}>{op.badge_id}</div>
                </div>
                {selected === op.id && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue-light)" strokeWidth="2.5"><polyline points="4,12 9,17 20,6"/></svg>
                )}
              </div>
            ))
          )}
        </div>

        {/* Erro */}
        {error && (
          <div style={{ margin: "12px 20px 0", padding: "10px 14px", background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--red-light)" }}>⚠ {error}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--bg-border)", marginTop: "14px", display: "flex", gap: "10px" }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: "11px", border: "1px solid var(--bg-border)", background: "var(--bg-card)", color: "var(--text-secondary)", borderRadius: "10px", fontSize: "13px", cursor: "pointer" }}>
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            disabled={!selected || !gateValue.trim() || saving}
            style={{
              flex: 2, padding: "11px",
              background: selected && gateValue.trim() ? "var(--blue-primary)" : "var(--bg-card)",
              border: "none", borderRadius: "10px",
              fontSize: "13px", fontWeight: 700,
              color: selected && gateValue.trim() ? "white" : "var(--text-hint)",
              cursor: selected && gateValue.trim() && !saving ? "pointer" : "not-allowed",
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
