/* ============================================================
   Component: RestaurantCard (components/RestaurantCard.js)
   ------------------------------------------------------------
   การ์ดร้านค้า (แบบแอป Food Delivery): รูปหน้าร้าน + ชื่อ +
   ★ คะแนน + เวลาเตรียม + ระยะทาง + ปุ่มดูร้าน
   ใช้ผ่าน: UI.RestaurantCard({...}) — คืน HTML string
   ตัวอย่าง: UI.RestaurantCard({
     id: 1, name: "ครัวสังขา", cuisine: "อาหารไทย",
     rating: 4.8, time: "20–30 นาที", distance: "1.2 กม.",
     img: "https://...", isNew: true,
   })
   - img: URL รูปจริง (ว่าง = ภาพ AI/Pollinations อัตโนมัติ)
   - ไม่มีรูป/โหลดไม่ได้ → fallback images/no-store.png อัตโนมัติ
   ============================================================ */
(function () {
  "use strict";
  if (!window.UI) {
    if (console && console.warn) console.warn("UI: โหลด components/ui.js ก่อน RestaurantCard.js");
    return;
  }
  window.UI.RestaurantCard = window.UI.RestaurantCard;
})();
