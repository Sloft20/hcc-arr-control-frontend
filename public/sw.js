// ============================================================
//  public/sw.js — Service Worker para Web Push
//  Recebe notificações mesmo com o app em background
// ============================================================

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Receber notificação push
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "HCC Arr Control", body: event.data.text() };
  }

  const title   = data.title || "HCC Arr Control";
  const options = {
    body:              data.body || "Novo alerta de operação",
    icon:              "/icon-192.png",
    badge:             "/icon-192.png",
    vibrate:           [200, 100, 200, 100, 200],
    requireInteraction: true,
    tag:               "hcc-alert",
    renotify:          true,
    data:              data.data || {},
    actions: [
      { action: "open",    title: "✋ Confirmar agora" },
      { action: "dismiss", title: "Fechar"             },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clique na notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  // Abrir ou focar a tela do operador
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const operadorUrl = "/operador";

      // Se já tem uma aba aberta, focar
      for (const client of clientList) {
        if (client.url.includes("/operador") && "focus" in client) {
          return client.focus();
        }
      }

      // Senão, abrir nova aba
      if (clients.openWindow) {
        return clients.openWindow(operadorUrl);
      }
    })
  );
});
