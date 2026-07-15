"use client";

// ============================================================
//  hooks/useDashboard.ts — v3 (Produção)
//  Fix: Ordena voos sem operador para o fim da lista e
//  atualiza tela automaticamente ao importar planilha
// ============================================================

import { useEffect, useState, useCallback } from "react";
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
        .lte("scheduled_at", `${TODAY}T23:59:59Z`);

      if (fetchError) throw fetchError;

      const mapped: DashboardRow[] = (data ?? []).map((flight: any) => {
        const schedule = flight.daily_schedules?.[0] ?? null;
        const operator = schedule?.operators ?? null;
        
        const confirmations = Array.isArray(schedule?.gate_confirmations) 
           ? schedule.gate_confirmations 
           : schedule?.gate_confirmations ? [schedule.gate_confirmations] : [];
        
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

      // ── MÁGICA DA ORDENAÇÃO AQUI ──
      mapped.sort((a, b) => {
        // 1 = Tem operador, 0 = Não tem
        const aAssigned = a.operatorBadge ? 1 : 0;
        const bAssigned = b.operatorBadge ? 1 : 0;

        // Se um tem operador e o outro não, joga quem tem pra cima
        if (aAssigned !== bAssigned) {
          return bAssigned - aAssigned;
        }

        // Se ambos têm (ou ambos não têm), ordena pelo horário do voo
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
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

    // ── NOVO CANAL: Escuta a planilha (daily_schedules) ──
    // Se a API da planilha inserir ou atualizar uma escala, o dashboard refaz a busca
    const schedulesChannel = supabase
      .channel("dashboard:schedules")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "daily_schedules" }, () => fetchInitialData())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "daily_schedules" }, () => fetchInitialData())
      .subscribe();

    return () => {
      supabase.removeChannel(confirmationsChannel);
      supabase.removeChannel(flightsChannel);
      supabase.removeChannel(schedulesChannel);
    };
  }, [fetchInitialData, patchConfirmation, patchFlight]);

  return { rows, loading, error, lastUpdate, refetch: fetchInitialData };
}