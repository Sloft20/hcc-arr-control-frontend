"use client";

// ============================================================
//  components/ControllerLoginScreen.tsx
//  Tela de login do controlador com PIN de 4 dígitos
// ============================================================

import { useState, useRef } from "react";
import { useControllerAuth } from "@/context/ControllerAuth";
import { ThemeToggle } from "./ThemeToggle";

export function ControllerLoginScreen() {
  const { login } = useControllerAuth();
  const [name, setName] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [step, setStep] = useState<"name" | "pin">("name");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleNameSubmit = () => {
    if (!name.trim()) return;
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
    if (newPin.every(d => d !== "") && i === 3) handleSubmit(newPin.join(""));
  };

  const handlePinKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[i] && i > 0) pinRefs[i - 1].current?.focus();
  };

  const handleSubmit = async (pinStr: string) => {
    setLoading(true);
    setError("");
    const ok = await login(name, pinStr);
    if (!ok) {
      setError("PIN incorreto. Tente novamente.");
      setPin(["", "", "", ""]);
      setTimeout(() => pinRefs[0].current?.focus(), 100);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 24px",
      gap: "32px",
    }}>
      {/* Logo */}
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "64px", height: "64px", background: "var(--blue-primary)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 0 32px rgba(29,78,216,.3)" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L4 6v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V6L12 2z"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>HCC Arr Control</h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Centro de Controle · Aeroporto BSB</p>
      </div>

      {/* Card de login */}
      <div style={{
        width: "100%",
        maxWidth: "380px",
        background: "var(--bg-surface)",
        border: "1px solid var(--bg-border)",
        borderRadius: "16px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Acesso ao Dashboard</h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Identificação do controlador de tráfego</p>
        </div>

        {/* Step 1: Nome */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: step === "name" ? "var(--blue-primary)" : "var(--green-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "white", flexShrink: 0 }}>
              {step === "pin" ? "✓" : "1"}
            </div>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600 }}>Identificação</span>
          </div>

          {step === "name" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleNameSubmit()}
                placeholder="Seu nome completo"
                autoFocus
                style={{
                  width: "100%", padding: "12px 14px", fontSize: "15px",
                  background: "var(--bg-input)", border: "1.5px solid var(--blue-primary)",
                  borderRadius: "10px", color: "var(--text-primary)", outline: "none",
                }}
              />
              <button
                onClick={handleNameSubmit}
                disabled={!name.trim()}
                style={{
                  width: "100%", padding: "12px",
                  background: name.trim() ? "var(--blue-primary)" : "var(--bg-card)",
                  border: "none", borderRadius: "10px",
                  fontSize: "14px", fontWeight: 700,
                  color: name.trim() ? "white" : "var(--text-hint)",
                  cursor: name.trim() ? "pointer" : "not-allowed",
                }}
              >
                Continuar →
              </button>
            </div>
          ) : (
            <div style={{ padding: "10px 14px", background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{name}</span>
              <button onClick={() => { setStep("name"); setPin(["","","",""]); setError(""); }}
                style={{ fontSize: "11px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>Trocar</button>
            </div>
          )}
        </div>

        {/* Step 2: PIN */}
        {step === "pin" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--blue-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "white", flexShrink: 0 }}>2</div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600 }}>PIN de acesso</span>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              {pin.map((digit, i) => (
                <input
                  key={i} ref={pinRefs[i]}
                  type="password" inputMode="numeric" maxLength={1} value={digit}
                  onChange={e => handlePinChange(i, e.target.value)}
                  onKeyDown={e => handlePinKeyDown(i, e)}
                  style={{
                    width: "64px", height: "68px",
                    fontSize: "26px", fontWeight: 800, textAlign: "center",
                    fontFamily: "var(--font-mono)",
                    background: "var(--bg-input)",
                    border: `2px solid ${digit ? "var(--blue-primary)" : "var(--bg-border)"}`,
                    borderRadius: "12px", color: "var(--text-primary)", outline: "none",
                    transition: "border-color .15s",
                  }}
                />
              ))}
            </div>

            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
                <div style={{ width: "16px", height: "16px", border: "2px solid var(--bg-border)", borderTopColor: "var(--blue-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Verificando acesso...</span>
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

        <p style={{ fontSize: "10px", color: "var(--text-hint)", textAlign: "center" }}>
          PIN de acesso fornecido pelo supervisor de operações
        </p>
      </div>

      <div style={{ position: "absolute", top: "16px", right: "16px" }}>
        <ThemeToggle />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
