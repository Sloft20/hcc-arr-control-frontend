"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface PendingConfirmation {
  confirmationId: string;
  flightCode: string;
  gate: string;
  touchdownAt: string;
  deadlineSeconds: number;
  operatorName: string;
  operatorBadge: string;
  scheduleId: string;
}

export type ConfirmResult = "confirmed_in_time" | "missed_deadline" | "already_done" | "error";

export function useOperatorConfirmation(operatorBadge: string | null) {
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [lastResult, setLastResult] = useState<ConfirmResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const fetchPending = useCallback(async () => {
    if (!operatorBadge) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Buscar operador pelo badge
      const { data: op } = await supabase
        .from("operators")
        .select("id, name, badge_id")
        .eq("badge_id", operatorBadge)
        .maybeSingle();

      if (!op) { setError(`Matrícula '${operatorBadge}' não encontrada.`); return; }

      // 2. Buscar escala de hoje
      const { data: schedule } = await supabase
        .from("daily_schedules")
        .select("id, flight_id")
        // @ts-ignore
        .eq("operator_id", (op as any).id)
        .eq("operation_date", today)
        .maybeSingle();

      if (!schedule) { setPending(null); return; }

      // 3. Buscar gate_confirmation pendente
      const { data: conf } = await supabase
        .from("gate_confirmations")
        .select("id, touchdown_at, deadline_seconds, confirmed_at, status")
        .eq("schedule_id", schedule.id)
        .eq("status", "pending")
        .maybeSingle();

      if (!conf) { setPending(null); return; }

      // 4. Buscar dados do voo
      const { data: flight } = await supabase
        .from("flights")
        .select("flight_code, gate")
        .eq("id", schedule.flight_id)
        .maybeSingle();

      setPending({
        confirmationId: conf.id,
        scheduleId: schedule.id,
        flightCode: flight?.flight_code ?? "—",
        gate: flight?.gate ?? "—",
        touchdownAt: conf.touchdown_at,
        deadlineSeconds: conf.deadline_seconds,
        operatorName: op.name,
        operatorBadge: op.badge_id,
      });

    } catch (e: any) {
      setError(e?.message ?? "Erro ao buscar confirmação.");
    } finally {
      setLoading(false);
    }
  }, [operatorBadge, today]);

  useEffect(() => {
    if (!operatorBadge) return;
    fetchPending();

    const channel = supabase
      .channel(`operator:${operatorBadge}:${Date.now()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gate_confirmations" },
        () => fetchPending())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "gate_confirmations" },
        (payload) => {
          if (payload.new.status !== "pending") {
            setLastResult(payload.new.status as ConfirmResult);
            setPending(null);
          } else {
            fetchPending();
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [operatorBadge, fetchPending]);

  const confirm = useCallback(async () => {
    if (!pending) return;
    setConfirming(true);
    try {
      const now = new Date().toISOString();
      const elapsed = (Date.now() - new Date(pending.touchdownAt).getTime()) / 1000;
      const newStatus = elapsed <= pending.deadlineSeconds ? "confirmed_in_time" : "missed_deadline";

      const { error: updateError } = await supabase
        .from("gate_confirmations")
        .update({ confirmed_at: now, status: newStatus })
        .eq("id", pending.confirmationId);

      if (updateError) throw updateError;
      setLastResult(newStatus);
      setPending(null);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao confirmar.");
    } finally {
      setConfirming(false);
    }
  }, [pending]);

  // Reset completo — limpa resultado e volta para aguardando
  const reset = useCallback(() => {
    setLastResult(null);
    setPending(null);
    setError(null);
    fetchPending();
  }, [fetchPending]);

  return { pending, loading, confirming, lastResult, error, confirm, refetch: fetchPending, reset };
}
