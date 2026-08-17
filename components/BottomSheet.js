/* ============================================================
   Component: BottomSheet (components/BottomSheet.js)
   ------------------------------------------------------------
   แผ่นเมนูเด้งจากด้านล่าง (action sheet): รายการ + ไอคอน
   ใช้ผ่าน: UI.BottomSheet({ items: [...] }) — คืน HTML string
   ตัวอย่าง: UI.BottomSheet({ id: "menu-sheet", items: [
     { label: "➕ เพิ่มเมนู", onclick: "..." },
     { label: "🗑 ลบ", danger: true },
   ]})
   ============================================================ */
(function () {
  "use strict";
  if (!window.UI) {
    if (console && console.warn) console.warn("UI: โหลด components/ui.js ก่อน BottomSheet.js");
    return;
  }
  window.UI.BottomSheet = window.UI.BottomSheet;
})();
