/* ============================================================
   Component: StatisticCard (components/StatisticCard.js)
   ------------------------------------------------------------
   การ์ดสถิติ: ตัวเลขใหญ่ + ป้าย (ยอดขาย/ออเดอร์/รายได้/งาน)
   ใช้ผ่าน: UI.StatisticCard({ value, label, tone, valueId })
   tone: accent | success | rider | info | danger
   ============================================================ */
(function () {
  "use strict";
  if (!window.UI) {
    if (console && console.warn) console.warn("UI: โหลด components/ui.js ก่อน StatisticCard.js");
    return;
  }
  window.UI.StatisticCard = window.UI.StatisticCard;
})();
