/* ===== หน้าสมัครร้านค้า ===== */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const form = $("#signup-form");
let selectedEmoji = "🍔";
let selectedBg = BG_PRESETS[0];

/* ===== ตัวเลือกโลโก้ (อีโมจิ) ===== */
const emojiPicker = $("#s-emoji-picker");
emojiPicker.innerHTML = EMOJIS.map(
  (e) =>
    `<button type="button" class="emoji-option${e === selectedEmoji ? " selected" : ""}" data-emoji="${e}" role="option" aria-selected="${e === selectedEmoji}" aria-label="โลโก้ ${e}">${e}</button>`
).join("");

emojiPicker.addEventListener("click", (ev) => {
  const btn = ev.target.closest(".emoji-option");
  if (!btn) return;
  selectedEmoji = btn.dataset.emoji;
  $$(".emoji-option").forEach((b) => {
    b.classList.toggle("selected", b === btn);
    b.setAttribute("aria-selected", b === btn);
  });
});

/* ===== สีพื้นหลัง ===== */
const bgPicker = $("#s-bg-picker");
bgPicker.innerHTML = BG_PRESETS.map(
  (bg) =>
    `<button type="button" class="bg-option${bg === selectedBg ? " selected" : ""}" data-bg="${bg}" role="radio" aria-checked="${bg === selectedBg}" aria-label="สีพื้นหลัง"></button>`
).join("");
$$(".bg-option").forEach((b) => (b.style.background = b.dataset.bg));

bgPicker.addEventListener("click", (ev) => {
  const btn = ev.target.closest(".bg-option");
  if (!btn) return;
  selectedBg = btn.dataset.bg;
  $$(".bg-option").forEach((b) => {
    b.classList.toggle("selected", b === btn);
    b.setAttribute("aria-checked", b === btn);
  });
});

/* ===== ปักหมุดพิกัดร้านด้วย GPS ===== */
$("#s-gps").addEventListener("click", () => {
  const btn = $("#s-gps");
  if (!navigator.geolocation) {
    showToast("⚠️ เบราว์เซอร์นี้ไม่รองรับ GPS");
    return;
  }
  btn.disabled = true;
  btn.textContent = "📍 กำลังหาตำแหน่ง...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      $("#s-lat").value = pos.coords.latitude.toFixed(6);
      $("#s-lng").value = pos.coords.longitude.toFixed(6);
      btn.disabled = false;
      btn.textContent = "📍 ใช้ตำแหน่งปัจจุบันของร้าน (GPS)";
      showToast(`📍 ปักหมุดตำแหน่งร้านแล้ว (${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)})`);
    },
    (err) => {
      btn.disabled = false;
      btn.textContent = "📍 ใช้ตำแหน่งปัจจุบันของร้าน (GPS)";
      showToast(err && err.code === 1 ? "⚠️ ไม่อนุญาตให้ใช้ตำแหน่ง — เปิด GPS แล้วลองอีกครั้ง" : "⚠️ หาตำแหน่งไม่สำเร็จ — ลองใหม่อีกครั้ง");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
});

/* ===== สมัคร ===== */
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = $("#s-name").value.trim();
  const cuisine = $("#s-cuisine").value.trim();
  const pin = $("#s-pin").value.trim();
  if (!name) { showToast("⚠️ กรุณากรอกชื่อร้าน"); $("#s-name").focus(); return; }
  if (!cuisine) { showToast("⚠️ กรุณากรอกประเภทอาหาร"); $("#s-cuisine").focus(); return; }
  if (pin.length < 4) { showToast("⚠️ ตั้ง PIN อย่างน้อย 4 ตัวอักษร — ใช้เข้าสู่ระบบหลังร้าน"); $("#s-pin").focus(); return; }

  const lat = Number($("#s-lat").value);
  const lng = Number($("#s-lng").value);
  const store = {
    name,
    phone: $("#s-phone").value.trim().replace(/[^0-9]/g, ""),
    cuisine,
    pin,
    coverEmoji: selectedEmoji,
    coverBg: selectedBg,
    imageUrl: $("#s-img").value.trim(),
    open: $("#s-open").value || "09:00",
    close: $("#s-close").value || "21:00",
    distanceKm: Number($("#s-distance").value) || 1.0,
    deliveryFee: Number($("#s-fee").value) || 0,
    freeDeliveryMin: Number($("#s-free").value) || 0,
    deliveryTime: $("#s-time").value.trim() || "20–30 นาที",
    // พิกัดร้านจริง (ใส่เองหรือกดปุ่ม GPS) — ใช้วางตำแหน่งร้านบนแผนที่ติดตาม/นำทาง
    ...(Number.isFinite(lat) && lat !== 0 ? { lat } : {}),
    ...(Number.isFinite(lng) && lng !== 0 ? { lng } : {}),
  };


  const newStore = addRegisteredStore(store);
  try { localStorage.setItem("sangkha-active-restaurant", String(newStore.id)); } catch (_) { /* ไม่เป็นไร */ }

  // แสดงหน้าสำเร็จ
  form.hidden = true;
  $("#success-emoji").textContent = newStore.coverEmoji;
  $("#success-name").textContent = newStore.name;
  $("#btn-to-admin").href = `admin.html?restaurant=${newStore.id}`;
  $("#signup-success").hidden = false;
  showToast(`🎉 สมัครร้าน \"${newStore.name}\" สำเร็จ!`);
});

/* ===== แจ้งเตือน ===== */
const toastEl = $("#toast");
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 2200);
}
