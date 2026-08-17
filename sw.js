/* Service Worker — แจ้งเตือนแบบ push-style (ข้อมูลอยู่ใน localStorage จึงต้องมีหน้าเปิดอยู่)
   - ไรเดอร์: งานใหม่ (ออเดอร์ "พร้อมส่ง") → เปิด Rider Dashboard
   - ร้านค้า: ออเดอร์ใหม่ / รีวิวใหม่ / โปรโมชันหมดเวลา → เปิด Dashboard/Admin
   - กันซ้ำด้วย tag (1 เหตุการณ์ = 1 แจ้งเตือน) */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

const NOTIF = {
  NEW_READY_ORDERS: (o) => ({
    title: `🛵 งานใหม่ #${o.id} — ${o.restaurant}`,
    body: `${o.customer} · ${o.total} · แตะเพื่อเปิด Rider Dashboard`,
    tag: `rider-ready-${o.id}`,
    url: "./rider.html",
  }),
  NEW_ORDER: (o) => ({
    title: `🔔 ออเดอร์ใหม่ #${o.id} — ${o.restaurant}`,
    body: `${o.customer} · ${o.total} · แตะเพื่อเปิด Dashboard รับออเดอร์`,
    tag: `store-order-${o.id}`,
    url: `./dashboard.html?restaurant=${o.restaurantId}`,
  }),
  NEW_REVIEW: (r) => ({
    title: `⭐ รีวิวใหม่ — ${r.restaurant}`,
    body: `${r.customer} ให้ ${r.rating} ดาว${r.review ? `: ${r.review}` : ""}`,
    tag: `store-review-${r.orderId}-${r.restaurantId}`,
    url: `./dashboard.html?restaurant=${r.restaurantId}`,
  }),
  PROMO_EXPIRED: (p) => ({
    title: `⏰ โปรโมชันสิ้นสุด — ${p.title}`,
    body: "หมดอายุแล้ว — หายจากสไลด์บนสุด/หน้าโปรโมชันอัตโนมัติ",
    tag: `promo-expired-${p.id}`,
    url: "./admin.html",
  }),
};

const ICON_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#7c3aed"/><text x="32" y="42" font-size="34" text-anchor="middle">🛵</text></svg>'
  );

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || !NOTIF[data.type]) return;
  const items = Array.isArray(data.items) ? data.items : [];

  // ตอบกลับไปที่หน้าเดิม (ใช้ตรวจว่าส่งถึง SW แล้ว)
  if (event.source && typeof event.source.postMessage === "function") {
    event.source.postMessage({ type: "NOTIFY_ACK", kind: data.type, count: items.length });
  }

  if (!("Notification" in self) || self.Notification.permission !== "granted") return;

  items.forEach((it) => {
    const n = NOTIF[data.type](it);
    self.registration.showNotification(n.title, {
      body: n.body,
      tag: n.tag,
      renotify: true,
      icon: ICON_SVG,
      data: { url: n.url },
    });
  });
});

// คลิกแจ้งเตือน → เปิด/โฟกัสหน้าที่เกี่ยวข้อง
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "./index.html";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ("focus" in client) return client.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});
