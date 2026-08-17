/* ============================================================
   Component: Button (components/Button.js)
   ------------------------------------------------------------
   ปุ่มมาตรฐาน primary / secondary / ghost / danger
   รองรับ loading + disabled + ripple
   ใช้ผ่าน: UI.Button({...}) — คืน HTML string
   ตัวอย่าง: UI.Button({ label: "เข้าสู่ระบบ", variant: "primary",
              block: true, loading: false })
   ============================================================ */
(function () {
  "use strict";
  if (!window.UI) {
    if (console && console.warn) console.warn("UI: โหลด components/ui.js ก่อน Button.js");
    return;
  }
  window.UI.Button = window.UI.Button;
})();
