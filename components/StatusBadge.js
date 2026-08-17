/* ============================================================
   Component: StatusBadge (components/StatusBadge.js)
   ------------------------------------------------------------
   ป้ายสถานะ เปิด/ปิด/ออนไลน์/ออฟไลน์/ใหม่/เสร็จสิ้น ฯลฯ
   ใช้ผ่าน: UI.StatusBadge({ text, tone, dot }) — คืน HTML string
   tone: success | danger | info | rider | warn | muted
   ============================================================ */
(function () {
  "use strict";
  if (!window.UI) {
    if (console && console.warn) console.warn("UI: โหลด components/ui.js ก่อน StatusBadge.js");
    return;
  }
  window.UI.StatusBadge = window.UI.StatusBadge;
})();
