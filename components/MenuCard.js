/* ============================================================
   Component: MenuCard (components/MenuCard.js)
   ------------------------------------------------------------
   การ์ดเมนูกะทัดรัด: รูปซ้าย + ชื่อ + ราคา + ปุ่ม ＋
   ใช้ผ่าน: UI.MenuCard({...}) — คืน HTML string
   ตัวอย่าง: UI.MenuCard({
     id: 1, name: "ข้าวผัดปู", price: 95,
     img: "https://...", emoji: "🦀", color: "#ffd8a8",
   })
   - img: URL รูปจริง (ว่าง = ภาพ AI/Pollinations อัตโนมัติ)
   - ไม่มีรูป/โหลดไม่ได้ → fallback images/no-food.png อัตโนมัติ
   ============================================================ */
(function () {
  "use strict";
  if (!window.UI) {
    if (console && console.warn) console.warn("UI: โหลด components/ui.js ก่อน MenuCard.js");
    return;
  }
  window.UI.MenuCard = window.UI.MenuCard;
})();
