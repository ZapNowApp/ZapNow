/* ============================================================
   Component: Input (components/Input.js)
   ------------------------------------------------------------
   ช่องกรอกข้อมูลทุกรูปแบบ: ไอคอน + focus animation + error
   ใช้ผ่าน: UI.Input({...}) — คืน HTML string
   ตัวอย่าง: UI.Input({ label: "เบอร์โทร", icon: "📱",
              id: "phone", type: "tel", placeholder: "08x-xxx-xxxx" })
   ============================================================ */
(function () {
  "use strict";
  if (!window.UI) {
    if (console && console.warn) console.warn("UI: โหลด components/ui.js ก่อน Input.js");
    return;
  }
  window.UI.Input = window.UI.Input;
})();
