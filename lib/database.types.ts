// ============================================================
//  lib/database.types.ts — Tipos TypeScript do schema Supabase
// ============================================================

export type FlightStatus = "scheduled" | "landed" | "completed";
export type ConfirmationStatus = "pending" | "confirmed_in_time" | "missed_deadline";

export interface DbOperator {
  id: string;
  name: string;
  badge_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbFlight {
  id: string;
  flight_code: string;
  gate: string;
  scheduled_at: string;
  landed_at: string | null;
  status: FlightStatus;
  created_at: string;
  updated_at: string;
}

export interface DbDailySchedule {
  id: string;
  operator_id: string;
  flight_id: string;
  operation_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbGateConfirmation {
  id: string;
  schedule_id: string;
  touchdown_at: string;
  confirmed_at: string | null;
  deadline_seconds: number;
  response_seconds: number | null;
  status: ConfirmationStatus;
  created_at: string;
  updated_at: string;
}

export interface DashboardRow {
  flightId: string;
  flightCode: string;
  gate: string;
  scheduledAt: string;
  landedAt: string | null;
  flightStatus: FlightStatus;
  scheduleId: string | null;
  operatorName: string | null;
  operatorBadge: string | null;
  confirmationId: string | null;
  touchdownAt: string | null;
  confirmedAt: string | null;
  deadlineSeconds: number;
  responseSeconds: number | null;
  confirmationStatus: ConfirmationStatus | null;
}

export interface FlightUpdate {
  gate?: string;
  status?: FlightStatus;
  landed_at?: string | null;
  updated_at?: string;
}

export interface GateConfirmationUpdate {
  confirmed_at?: string | null;
  status?: ConfirmationStatus;
  updated_at?: string;
}

export interface Database {
  public: {
    Tables: {
      flights: {
        Row: DbFlight;
        Insert: Partial<DbFlight>;
        Update: FlightUpdate;
      };
      operators: {
        Row: DbOperator;
        Insert: Partial<DbOperator>;
        Update: Partial<DbOperator>;
      };
      daily_schedules: {
        Row: DbDailySchedule;
        Insert: Partial<DbDailySchedule>;
        Update: Partial<DbDailySchedule>;
      };
      gate_confirmations: {
        Row: DbGateConfirmation;
        Insert: Partial<DbGateConfirmation>;
        Update: GateConfirmationUpdate;
      };
    };
  };
}
