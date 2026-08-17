/* ============================================================
   auth.js — Helper ร่วมสำหรับหน้าล็อกอิน (Sangkha Partner / Rider / Food)
   - ripple effect บนปุ่ม
   - loading spinner บนปุ่ม
   - toast แจ้งเตือน (เหมือน signup)
   ============================================================ */

function showToast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove("show"), 3000);
}

/* Ripple effect: เรียกบนปุ่มใดก็ได้ — กดแล้วเกิดวงน้ำกระจาย */
function attachRipple(btn) {
  btn.addEventListener("pointerdown", (e) => {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = e.clientX - rect.left - size / 2 + "px";
    ripple.style.top = e.clientY - rect.top - size / 2 + "px";
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });
}

/* ปุ่ม loading: แสดง spinner + ปิดการกด */
function setBtnLoading(btn, on) {
  btn.classList.toggle("loading", on);
  btn.disabled = on;
}
