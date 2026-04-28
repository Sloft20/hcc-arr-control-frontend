import type { FlightStatus, ConfirmationStatus } from "@/lib/database.types";

interface StatusBadgeProps {
  flightStatus: FlightStatus;
  confirmationStatus: ConfirmationStatus | null;
}

export type TrafficLight = {
  color: "gray" | "amber" | "green" | "red";
  label: string;
  pulse: boolean;
};

export function resolveTrafficLight(
  flightStatus: FlightStatus,
  confirmationStatus: ConfirmationStatus | null
): TrafficLight {
  if (confirmationStatus === "missed_deadline")
    return { color: "red",   label: "Prazo perdido", pulse: true  };
  if (confirmationStatus === "confirmed_in_time")
    return { color: "green", label: "Confirmado",    pulse: false };
  if (confirmationStatus === "pending" || flightStatus === "landed")
    return { color: "amber", label: "Aguardando",    pulse: true  };
  if (flightStatus === "completed")
    return { color: "green", label: "Concluído",     pulse: false };
  return { color: "gray", label: "Agendado", pulse: false };
}

const styles: Record<string, React.CSSProperties> = {
  gray:  { background: "var(--bg-hover)",   border: "1px solid var(--bg-border)",   color: "var(--text-muted)"   },
  amber: { background: "var(--amber-bg)",   border: "1px solid var(--amber-border)", color: "var(--amber-light)"  },
  green: { background: "var(--green-bg)",   border: "1px solid var(--green-border)", color: "var(--green-light)"  },
  red:   { background: "var(--red-bg)",     border: "1px solid var(--red-border)",   color: "var(--red-light)"    },
};

const dotStyles: Record<string, React.CSSProperties> = {
  gray:  { background: "var(--text-muted)"  },
  amber: { background: "var(--amber-light)" },
  green: { background: "var(--green-light)" },
  red:   { background: "var(--red-light)"   },
};

export function StatusBadge({ flightStatus, confirmationStatus }: StatusBadgeProps) {
  const light = resolveTrafficLight(flightStatus, confirmationStatus);

  return (
    <span style={{
      ...styles[light.color],
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "3px 8px",
      borderRadius: "5px",
      fontSize: "10px",
      fontWeight: 600,
      letterSpacing: ".4px",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}>
      <span style={{
        ...dotStyles[light.color],
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        flexShrink: 0,
        animation: light.pulse ? "pulse 2s infinite" : "none",
      }} />
      {light.label}
    </span>
  );
}
