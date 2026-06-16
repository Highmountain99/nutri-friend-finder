// Gut Feeling — Push notification service worker
// Push-only worker: no app-shell caching, no offline behavior.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = { title: "Gut Feeling", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Gut Feeling";
  const options = {
    body: data.body || "Du har en ny notis",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/favicon.png",
    data: data.data || {},
    tag: data.tag || "gutfeeling",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/messages";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        try {
          const url = new URL(client.url);
          if (url.origin === self.location.origin && "focus" in client) {
            client.navigate(targetUrl).catch(() => {});
            return client.focus();
          }
        } catch (_e) {}
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
