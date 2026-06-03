"use client";

import { useState, useEffect, useRef } from "react";
import { useOperatorConfirmation } from "@/hooks/useOperatorConfirmation";
import { usePushNotification } from "@/hooks/usePushNotification";
import { useCountdown } from "@/hooks/useCountdown";
import { ThemeToggle } from "@/components/ThemeToggle";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

function fmt(s: number) {
  const abs = Math.abs(s);
  return `${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, "0")}`;
}
function initials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

// ── Tela de Login com PIN ─────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (badge: string, name: string, id: string) => void }) {
  const [badge, setBadge] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [step, setStep] = useState<"badge" | "pin">("badge");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleBadgeSubmit = () => {
    if (!badge.trim()) return;
    setError("");
    setStep("pin");
    setTimeout(() => pinRefs[0].current?.focus(), 100);
  };

  const handlePinChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newPin = [...pin];
    newPin[i] = val.slice(-1);
    setPin(newPin);
    if (val && i < 3) pinRefs[i + 1].current?.focus();
    if (newPin.every(d => d !== "") && i === 3) {
      handleLogin(newPin.join(""));
    }
  };

  const handlePinKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[i] && i > 0) {
      pinRefs[i - 1].current?.focus();
    }
  };

  const handleLogin = async (pinStr: string) => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`${BACKEND_URL}/api/auth/operator-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badge_id: badge.trim(), pin: pinStr }),
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.detail ?? "Erro ao autenticar");
      }
      const data = await resp.json();
      // Extraindo o operator_id retornado na resposta da API
      onLogin(data.badge_id, data.name, data.operator_id);
    } catch (e: any) {
      setError(e.message ?? "Matrícula ou PIN incorretos");
      setPin(["", "", "", ""]);
      setTimeout(() => pinRefs[0].current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: "32px" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "60px", height: "60px", background: "var(--blue-primary)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M12 2L4 6v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V6L12 2z"/></svg>
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>HCC Arr Control</h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Aeroporto BSB — Operações de Pista</p>
      </div>

      <div style={{ width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Step 1: Matrícula */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: step === "badge" ? "var(--blue-primary)" : "var(--green-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "white", flexShrink: 0 }}>
              {step === "pin" ? "✓" : "1"}
            </div>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px" }}>Matrícula</span>
          </div>

          {step === "badge" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="text" value={badge}
                onChange={e => setBadge(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleBadgeSubmit()}
                placeholder="OP-0042" autoFocus
                style={{ width: "100%", padding: "14px 16px", fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-mono)", textAlign: "center", letterSpacing: "2px", background: "var(--bg-card)", border: "2px solid var(--blue-primary)", borderRadius: "12px", color: "var(--text-primary)", outline: "none" }}
              />
              <button onClick={handleBadgeSubmit} disabled={!badge.trim()}
                style={{ width: "100%", padding: "14px", background: badge.trim() ? "var(--blue-primary)" : "var(--bg-card)", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, color: badge.trim() ? "white" : "var(--text-hint)", cursor: badge.trim() ? "pointer" : "not-allowed" }}>
                Continuar →
              </button>
            </div>
          ) : (
            <div style={{ padding: "12px 16px", background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--blue-light)", fontSize: "16px", letterSpacing: "1px" }}>{badge}</span>
              <button onClick={() => { setStep("badge"); setPin(["","","",""]); setError(""); }}
                style={{ fontSize: "11px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>Trocar</button>
            </div>
          )}
        </div>

        {/* Step 2: PIN */}
        {step === "pin" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--blue-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "white", flexShrink: 0 }}>2</div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px" }}>PIN de 4 dígitos</span>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "12px" }}>
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handlePinChange(i, e.target.value)}
                  onKeyDown={e => handlePinKeyDown(i, e)}
                  style={{
                    width: "60px", height: "64px",
                    fontSize: "24px", fontWeight: 800,
                    textAlign: "center", fontFamily: "var(--font-mono)",
                    background: "var(--bg-card)",
                    border: `2px solid ${digit ? "var(--blue-primary)" : "var(--bg-border)"}`,
                    borderRadius: "12px",
                    color: "var(--text-primary)",
                    outline: "none",
                    transition: "border-color .15s",
                  }}
                />
              ))}
            </div>

            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "8px" }}>
                <div style={{ width: "16px", height: "16px", border: "2px solid var(--bg-border)", borderTopColor: "var(--blue-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Verificando...</span>
              </div>
            )}
          </div>
        )}

        {/* Erro */}
        {error && (
          <div style={{ padding: "10px 14px", background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px" }}>⚠</span>
            <span style={{ fontSize: "12px", color: "var(--red-light)" }}>{error}</span>
          </div>
        )}
      </div>

      <div style={{ position: "absolute", top: "16px", right: "16px" }}><ThemeToggle /></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Countdown Ring ────────────────────────────────────────────
function CountdownRing({ touchdownAt, deadlineSeconds }: { touchdownAt: string; deadlineSeconds: number }) {
  const { remaining, overflow, percentUsed, isUrgent, isExpired } = useCountdown(touchdownAt, deadlineSeconds, true);
  const color = isExpired ? "var(--red-primary)" : isUrgent ? "#f97316" : percentUsed > 60 ? "var(--amber-primary)" : "var(--green-primary)";
  const r = 70; const circ = 2 * Math.PI * r;
  const offset = isExpired ? 0 : circ * (percentUsed / 100);
  return (
    <div style={{ position: "relative", width: "180px", height: "180px" }}>
      <svg width="180" height="180" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--bg-border)" strokeWidth="10"/>
        <circle cx="90" cy="90" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke .3s", animation: isExpired ? "pulse 1.5s infinite" : "none" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {isExpired ? (
          <><span style={{ fontSize: "13px", fontWeight: 700, color: "var(--red-light)", fontFamily: "var(--font-mono)", marginBottom: "2px" }}>+{fmt(overflow)}</span>
          <span style={{ fontSize: "11px", color: "var(--red-light)", textTransform: "uppercase", letterSpacing: ".5px" }}>atrasado</span></>
        ) : (
          <><span style={{ fontSize: "38px", fontWeight: 800, color, fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{fmt(remaining)}</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginTop: "4px" }}>restante</span></>
        )}
      </div>
    </div>
  );
}

// ── Tela principal do Operador ────────────────────────────────
function OperatorScreen({ badge, name, operatorId, onLogout }: { badge: string; name: string; operatorId: string; onLogout: () => void }) {
  const { pending, loading, confirming, lastResult, error, confirm, refetch, reset } = useOperatorConfirmation(badge);
  const { status: pushStatus } = usePushNotification(operatorId ?? null);

  useEffect(() => {
    if (pending && "vibrate" in navigator) navigator.vibrate([200, 100, 200]);
  }, [pending?.confirmationId]);

  const isExpiredNow = pending
    ? (Date.now() - new Date(pending.touchdownAt).getTime()) / 1000 > pending.deadlineSeconds
    : false;

  if (lastResult === "confirmed_in_time") return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", padding: "32px" }}>
      <div style={{ width: "80px", height: "80px", background: "var(--green-bg)", border: "2px solid var(--green-border)", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--green-light)" strokeWidth="2.5"><polyline points="4,12 9,17 20,6"/></svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "24px", fontWeight: 800, color: "var(--green-light)", textTransform: "uppercase" }}>Confirmado!</p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" }}>Presença registrada no prazo</p>
      </div>
      <button onClick={reset} style={{ marginTop: "8px", padding: "14px 32px", background: "var(--blue-primary)", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, color: "white", cursor: "pointer" }}>
        ↺ Próximo voo
      </button>
    </div>
  );

  if (lastResult === "missed_deadline") return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", padding: "32px" }}>
      <div style={{ width: "80px", height: "80px", background: "var(--red-bg)", border: "2px solid var(--red-border)", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--red-light)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "24px", fontWeight: 800, color: "var(--red-light)", textTransform: "uppercase" }}>Prazo Perdido</p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" }}>Confirmação registrada fora do prazo</p>
      </div>
      <button onClick={reset} style={{ marginTop: "8px", padding: "14px 32px", background: "var(--blue-primary)", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, color: "white", cursor: "pointer" }}>
        ↺ Voltar para Aguardando
      </button>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
      <div style={{ width: "32px", height: "32px", border: "3px solid var(--bg-border)", borderTopColor: "var(--blue-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <p style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px" }}>Buscando escala...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--bg-border)", padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green-primary)", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "10px", color: "var(--green-light)", textTransform: "uppercase", letterSpacing: ".5px" }}>Online</span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <ThemeToggle />
            <button onClick={onLogout} style={{ fontSize: "11px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>Sair</button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "56px", height: "56px", background: "var(--blue-primary)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 800, color: "white", flexShrink: 0 }}>
            {initials(name)}
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>{name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "1px", color: "var(--blue-light)", background: "var(--blue-bg)", border: "1px solid var(--blue-border)", borderRadius: "6px", padding: "2px 10px" }}>{badge}</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Operador de Pista · BSB</span>
            </div>
          </div>
        </div>
      </div>

      {!pending ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "32px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: "2px solid var(--bg-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--bg-border)", animation: "pulse 2s infinite" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "17px", fontWeight: 600, color: "var(--text-primary)" }}>Aguardando pouso</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px", maxWidth: "260px" }}>Você será notificado assim que uma aeronave tocar o solo</p>
          </div>
          {error && <p style={{ fontSize: "12px", color: "var(--red-light)", textAlign: "center" }}>{error}</p>}
          <button onClick={refetch} style={{ marginTop: "8px", padding: "10px 20px", border: "1px solid var(--bg-border)", background: "var(--bg-card)", color: "var(--text-secondary)", borderRadius: "10px", fontSize: "12px", cursor: "pointer" }}>↺ Atualizar</button>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--bg-border)" }}>
            <div style={{ padding: "16px 20px", borderRight: "1px solid var(--bg-border)" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: "4px" }}>Voo</div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{pending.flightCode}</div>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: "4px" }}>Portão</div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--blue-light)", fontFamily: "var(--font-mono)" }}>{pending.gate}</div>
            </div>
          </div>

          <div style={{ padding: "10px 20px", background: isExpiredNow ? "var(--red-bg)" : "var(--amber-bg)", borderBottom: `2px solid ${isExpiredNow ? "var(--red-primary)" : "var(--amber-primary)"}` }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: isExpiredNow ? "var(--red-light)" : "var(--amber-light)", textTransform: "uppercase", letterSpacing: ".5px" }}>
              {isExpiredNow ? "⚠ Prazo expirado — confirme assim que possível" : "⚡ Aeronave no solo — confirme sua presença"}
            </span>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", gap: "24px" }}>
            <CountdownRing touchdownAt={pending.touchdownAt} deadlineSeconds={pending.deadlineSeconds} />
            <button onClick={confirm} disabled={confirming}
              style={{ width: "100%", maxWidth: "360px", padding: "28px 0", background: isExpiredNow ? "var(--red-primary)" : "var(--amber-primary)", border: "none", borderRadius: "16px", fontSize: "20px", fontWeight: 800, color: "#0a0f1e", textTransform: "uppercase", letterSpacing: ".5px", cursor: confirming ? "not-allowed" : "pointer", opacity: confirming ? .7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", animation: isExpiredNow ? "pulse 1.5s infinite" : "none" }}>
              {confirming
                ? <><div style={{ width: "20px", height: "20px", border: "3px solid #0a0f1e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Confirmando...</>
                : <><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0f1e" strokeWidth="2.5"><polyline points="4,12 9,17 20,6"/></svg> Estou no Portão {pending.gate}</>
              }
            </button>
            <p style={{ fontSize: "11px", color: "var(--text-hint)", textAlign: "center" }}>
              {isExpiredNow ? "Confirmação fora do prazo será registrada como atraso" : `Aperte apenas quando estiver no portão ${pending.gate}`}
            </p>
          </div>
        </>
      )}

      <div style={{ padding: "10px 20px", borderTop: "1px solid var(--bg-border)", background: "var(--bg-surface)", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "10px", color: "var(--text-hint)", fontFamily: "var(--font-mono)" }}>HCC Arr Control v2.0</span>
        <span style={{ fontSize: "10px", color: "var(--text-hint)" }}>Aeroporto BSB</span>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────
export default function OperadorPage() {
  const [auth, setAuth] = useState<{ badge: string; name: string; id: string } | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("operator_auth");
    if (saved) { try { setAuth(JSON.parse(saved)); } catch {} }
  }, []);

  const handleLogin = (badge: string, name: string, id: string) => {
    sessionStorage.setItem("operator_auth", JSON.stringify({ badge, name, id }));
    setAuth({ badge, name, id });
  };

  const handleLogout = () => {
    sessionStorage.removeItem("operator_auth");
    setAuth(null);
  };

  if (!auth) return <LoginScreen onLogin={handleLogin} />;
  return <OperatorScreen badge={auth.badge} name={auth.name} operatorId={auth.id} onLogout={handleLogout} />;
}