"use client";

// ============================================================
//  hooks/useDashboard.ts — v2
//  Fix: busca TODAS as confirmações do dia (não só pending)
//  para o histórico aparecer mesmo após F5
// ============================================================

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { DashboardRow, DbGateConfirmation, DbFlight } from "@/lib/database.types";

const TODAY = new Date().toISOString().split("T")[0];

export function useDashboard() {
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Busca todos os voos do dia com JOINs completos
      // gate_confirmations sem filtro de status — traz todas (pending, confirmed, missed)
      const { data, error: fetchError } = await supabase
        .from("flights")
        .select(`
          id,
          flight_code,
          gate,
          scheduled_at,
          landed_at,
          status,
          daily_schedules!left (
            id,
            operation_date,
            operators (
              name,
              badge_id
            ),
            gate_confirmations (
              id,
              touchdown_at,
              confirmed_at,
              deadline_seconds,
              response_seconds,
              status
            )
          )
        `)
        .gte("scheduled_at", `${TODAY}T00:00:00Z`)
        .lte("scheduled_at", `${TODAY}T23:59:59Z`)
        .order("scheduled_at", { ascending: true });

      if (fetchError) throw fetchError;

      const mapped: DashboardRow[] = (data ?? []).map((flight: any) => {
        const schedule = flight.daily_schedules?.[0] ?? null;
        const operator = schedule?.operators ?? null;
        // Pega a confirmação mais recente (pode haver mais de uma se houve reset)
        const confirmations = Array.isArray(schedule?.gate_confirmations) ? schedule.gate_confirmations : schedule?.gate_confirmations ? [schedule.gate_confirmations] : [];
        const confirmation = confirmations.sort((a: any, b: any) =>
          (b.touchdown_at ?? "").localeCompare(a.touchdown_at ?? "")
        )[0] ?? null;

        return {
          flightId: flight.id,
          flightCode: flight.flight_code,
          gate: flight.gate,
          scheduledAt: flight.scheduled_at,
          landedAt: flight.landed_at,
          flightStatus: flight.status,
          scheduleId: schedule?.id ?? null,
          operatorName: operator?.name ?? null,
          operatorBadge: operator?.badge_id ?? null,
          confirmationId: confirmation?.id ?? null,
          touchdownAt: confirmation?.touchdown_at ?? null,
          confirmedAt: confirmation?.confirmed_at ?? null,
          deadlineSeconds: confirmation?.deadline_seconds ?? 180,
          responseSeconds: confirmation?.response_seconds ?? null,
          confirmationStatus: confirmation?.status ?? null,
        };
      });

      setRows(mapped);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err?.message ?? "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  const patchConfirmation = useCallback((record: DbGateConfirmation) => {
    setRows(prev =>
      prev.map(row => {
        if (row.scheduleId !== record.schedule_id) return row;
        return {
          ...row,
          confirmationId: record.id,
          touchdownAt: record.touchdown_at,
          confirmedAt: record.confirmed_at,
          deadlineSeconds: record.deadline_seconds,
          responseSeconds: record.response_seconds,
          confirmationStatus: record.status,
        };
      })
    );
    setLastUpdate(new Date());
  }, []);

  const patchFlight = useCallback((record: DbFlight) => {
    setRows(prev =>
      prev.map(row => {
        if (row.flightId !== record.id) return row;
        return { ...row, flightStatus: record.status, landedAt: record.landed_at };
      })
    );
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    fetchInitialData();

    const confirmationsChannel = supabase
      .channel("dashboard:gate_confirmations")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gate_confirmations" },
        (payload) => patchConfirmation(payload.new as DbGateConfirmation))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "gate_confirmations" },
        (payload) => patchConfirmation(payload.new as DbGateConfirmation))
      .subscribe();

    const flightsChannel = supabase
      .channel("dashboard:flights")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "flights" },
        (payload) => patchFlight(payload.new as DbFlight))
      .subscribe();

    return () => {
      supabase.removeChannel(confirmationsChannel);
      supabase.removeChannel(flightsChannel);
    };
  }, [fetchInitialData, patchConfirmation, patchFlight]);

  return { rows, loading, error, lastUpdate, refetch: fetchInitialData };
}