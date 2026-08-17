/* ============================================================
   Component: Modal (components/Modal.js)
   ------------------------------------------------------------
   กล่องโต้ตอบกลางจอ: overlay + head (title + ปิด) + body
   ใช้ผ่าน: UI.Modal({...}) + UI.openModal(id) / UI.closeModal(id)
   ============================================================ */
(function () {
  "use strict";
  if (!window.UI) {
    if (console && console.warn) console.warn("UI: โหลด components/ui.js ก่อน Modal.js");
    return;
  }
  window.UI.Modal = window.UI.Modal;
})();
