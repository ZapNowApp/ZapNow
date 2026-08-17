/* ============================================================
   Component: UserCard (components/UserCard.js)
   ------------------------------------------------------------
   การ์ดสรุปผู้ใช้/ร้าน/ไรเดอร์ (hero): รูป + ชื่อ + สถานะ + สถิติ
   ใช้ผ่าน: UI.UserCard({...}) — คืน HTML string
   ============================================================ */
(function () {
  "use strict";
  if (!window.UI) {
    if (console && console.warn) console.warn("UI: โหลด components/ui.js ก่อน UserCard.js");
    return;
  }
  window.UI.UserCard = window.UI.UserCard;
})();
