"use client";

// ============================================================
//  hooks/usePushNotification.ts
//  Registra Service Worker e gerencia subscription de push
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// Chave pública VAPID — coloque aqui a sua VAPID_PUBLIC_KEY
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export type PushStatus = "unsupported" | "denied" | "granted" | "pending" | "error";

export function usePushNotification(operatorId: string | null) {
  const [status, setStatus] = useState<PushStatus>("pending");

  const register = useCallback(async () => {
    if (!operatorId) return;

    // Verificar suporte
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    try {
      // Registrar Service Worker
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      // Pedir permissão
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      // Criar subscription
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
      });

      const subJson = subscription.toJSON();

      // Salvar no Supabase
      await supabase.from("push_subscriptions").upsert({
        operator_id:  operatorId,
        endpoint:     subJson.endpoint,
        subscription: subJson,
      } as any, { onConflict: "endpoint" });

      setStatus("granted");
      console.log("✅ Push notification registrado com sucesso");

    } catch (err) {
      console.error("❌ Erro ao registrar push:", err);
      setStatus("error");
    }
  }, [operatorId]);

  // Registrar automaticamente quando operador logar
  useEffect(() => {
    if (operatorId) register();
  }, [operatorId, register]);

  return { status, register };
}
