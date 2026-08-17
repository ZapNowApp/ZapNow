/* ============================================================
   Component: AppHeader (components/AppHeader.js)
   ------------------------------------------------------------
   แถบหัวหน้าบนสุดของทุกหน้า — โลโก้ / ชื่อระบบ / subtitle /
   ป้ายสถานะสด / รูปโปรไฟล์
   ใช้ผ่าน: UI.AppHeader({...}) — คืน HTML string
   (โหลด components/ui.js ก่อน — ไฟล์นี้เป็น re-export ให้
    โหลดแยกหรือ import ได้โดยไม่ต้องพึ่งตัวรวม)
   ============================================================ */
(function () {
  "use strict";
  if (!window.UI) {
    if (console && console.warn) console.warn("UI: โหลด components/ui.js ก่อน AppHeader.js");
    return;
  }
  window.UI.AppHeader = window.UI.AppHeader; // ตัวชี้ไปยัง implementation ใน ui.js
})();
