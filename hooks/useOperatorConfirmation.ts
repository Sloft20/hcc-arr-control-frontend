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

export interface UpcomingFlight {
  id: string;
  flightCode: string;
  gate: string;
  scheduledAt: string;
  status: string;
}

export type ConfirmResult = "confirmed_in_time" | "missed_deadline" | "already_done" | "error";

export function useOperatorConfirmation(operatorBadge: string | null) {
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [upcomingFlights, setUpcomingFlights] = useState<UpcomingFlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [lastResult, setLastResult] = useState<ConfirmResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    if (!operatorBadge) return;
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split("T")[0];

      // 1. Buscar operador pelo badge
      const { data: op } = await supabase
        .from("operators")
        .select("id, name, badge_id")
        .eq("badge_id", operatorBadge)
        .maybeSingle();

      if (!op) { setError(`Matrícula '${operatorBadge}' não encontrada.`); return; }

      // 2. Buscar TODA a escala de hoje (com voos e confirmações)
      const { data: schedules } = await supabase
        .from("daily_schedules")
        .select(`
          id,
          flight_id,
          flights ( id, flight_code, gate, scheduled_at, status ),
          gate_confirmations ( id, touchdown_at, deadline_seconds, status )
        `)
        // @ts-ignore
        .eq("operator_id", (op as any).id)
        .eq("operation_date", today);

      let activePending: PendingConfirmation | null = null;
      const upcoming: UpcomingFlight[] = [];

      for (const sched of (schedules || [])) {
        // @ts-ignore
        const flight = Array.isArray(sched.flights) ? sched.flights[0] : sched.flights;
        // @ts-ignore
        const confs = Array.isArray(sched.gate_confirmations) ? sched.gate_confirmations : (sched.gate_confirmations ? [sched.gate_confirmations] : []);
        const pendingConf = confs.find((c: any) => c.status === "pending");

        if (pendingConf) {
          activePending = {
            confirmationId: pendingConf.id,
            scheduleId: sched.id,
            flightCode: flight?.flight_code ?? "—",
            gate: flight?.gate ?? "—",
            touchdownAt: pendingConf.touchdown_at,
            deadlineSeconds: pendingConf.deadline_seconds,
            // @ts-ignore
            operatorName: op.name,
            // @ts-ignore
            operatorBadge: op.badge_id,
          };
        } else {
           // Verifica se o voo já foi finalizado
           const hasFinished = confs.some((c: any) => c.status === "confirmed_in_time" || c.status === "missed_deadline");
           if (!hasFinished && flight) {
              upcoming.push({
                 id: flight.id,
                 flightCode: flight.flight_code,
                 gate: flight.gate,
                 scheduledAt: flight.scheduled_at,
                 status: flight.status
              });
           }
        }
      }

      // Ordena a escala por horário de chegada
      upcoming.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

      setPending(activePending);
      setUpcomingFlights(upcoming);

    } catch (e: any) {
      setError(e?.message ?? "Erro ao buscar confirmação.");
    } finally {
      setLoading(false);
    }
  }, [operatorBadge]);

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
        // @ts-ignore
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

  const reset = useCallback(() => {
    setLastResult(null);
    setPending(null);
    setError(null);
    fetchPending();
  }, [fetchPending]);

  return { pending, upcomingFlights, loading, confirming, lastResult, error, confirm, refetch: fetchPending, reset };
}