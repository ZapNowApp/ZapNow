/* ============================================================
   Component: Loading (components/Loading.js)
   ------------------------------------------------------------
   Spinner + ข้อความ (เต็มจอ / แทรกในหน้า) — ใช้กับ login,
   โหลด Firebase, บันทึกข้อมูล
   ใช้ผ่าน: UI.Loading({ text: "...", full: true }) — คืน HTML string
   ============================================================ */
(function () {
  "use strict";
  if (!window.UI) {
    if (console && console.warn) console.warn("UI: โหลด components/ui.js ก่อน Loading.js");
    return;
  }
  window.UI.Loading = window.UI.Loading;
})();
