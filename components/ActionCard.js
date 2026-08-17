/* ============================================================
   Component: ActionCard (components/ActionCard.js)
   ------------------------------------------------------------
   การ์ดปุ่มเมนูหลัก: ไอคอน + ชื่อ + คำอธิบาย + ripple
   ใช้ผ่าน: UI.ActionCard({...}) — คืน HTML string
   ตัวอย่าง: UI.ActionCard({ icon: "🍜", iconKey: "menu",
              title: "จัดการเมนู", desc: "เพิ่ม · แก้ไข · ลบเมนู",
              data: [{ k: "go", v: "menu" }] })
   ============================================================ */
(function () {
  "use strict";
  if (!window.UI) {
    if (console && console.warn) console.warn("UI: โหลด components/ui.js ก่อน ActionCard.js");
    return;
  }
  window.UI.ActionCard = window.UI.ActionCard;
})();
