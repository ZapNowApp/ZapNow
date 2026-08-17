/* ============================================================
   Component: FoodCard (components/FoodCard.js)
   ------------------------------------------------------------
   การ์ดอาหาร (แบบแอป Food Delivery): รูปด้านบน + ชื่อ +
   รายละเอียด + ราคา + ปุ่มเพิ่มลงตะกร้า
   ใช้ผ่าน: UI.FoodCard({...}) — คืน HTML string
   ตัวอย่าง: UI.FoodCard({
     id: 1, name: "ข้าวผัดปู", desc: "...", price: 95,
     img: "https://...", emoji: "🦀", color: "#ffd8a8",
   })
   - img: URL รูปจริง (ว่าง = ภาพ AI/Pollinations อัตโนมัติ)
   - ไม่มีรูป/โหลดไม่ได้ → fallback images/no-food.png อัตโนมัติ
   ============================================================ */
(function () {
  "use strict";
  if (!window.UI) {
    if (console && console.warn) console.warn("UI: โหลด components/ui.js ก่อน FoodCard.js");
    return;
  }
  window.UI.FoodCard = window.UI.FoodCard;
})();
