/* ============================================================
   Component: BottomNav (components/BottomNav.js)
   ------------------------------------------------------------
   แถบเมนูล่าง 4 รายการ (customer/restaurant/rider/admin เปลี่ยน
   เฉพาะ items แต่ UI เดียวกัน) + badge งานใหม่
   ใช้ผ่าน: UI.BottomNav({ items: [...] }) — คืน HTML string
   ตัวอย่าง: UI.BottomNav({ items: [
     { page: "home", label: "หน้าหลัก", iconKey: "home", active: true },
     { page: "orders", label: "งาน", iconKey: "orders", badge: "0", badgeId: "nav-badge" },
   ]})
   ============================================================ */
(function () {
  "use strict";
  if (!window.UI) {
    if (console && console.warn) console.warn("UI: โหลด components/ui.js ก่อน BottomNav.js");
    return;
  }
  window.UI.BottomNav = window.UI.BottomNav;
})();
