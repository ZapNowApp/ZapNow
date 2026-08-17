/* ===== Sangkha Partner — หน้าล็อกอินร้านค้า =====
   ใช้ระบบล็อกอินเดิมของแพลตฟอร์มทั้งหมด (menu-data.js):
   - ค้นหาร้านด้วย เบอร์โทร (ถ้าร้านมีเบอร์) หรือ ชื่อร้าน
   - ตรวจ PIN ด้วย verifyStorePin()
   - ตั้ง session ด้วย setStoreSession() → dashboard รับออเดอร์ได้ทันที
   ไม่แตะ Firebase / Auth เดิม */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const phoneInput = $("#login-phone");
const pinInput = $("#login-pin");
const loginBtn = $("#login-btn");

// ripple effect จาก auth.js
[loginBtn, $("#otp-send"), $("#otp-login-btn"), $("#forgot-close")].forEach((b) => b && attachRipple(b));

/* ===== หาร้านจากเบอร์โทร หรือชื่อร้าน ===== */
function findStoreByPhoneOrName(q) {
  const text = String(q || "").trim();
  if (!text) return null;
  const digits = text.replace(/[^0-9]/g, "");
  const stores = getRestaurants();
  // 1) เบอร์โทรตรงเป๊ะ (ถ้าร้านมีเบอร์เก็บไว้)
  if (digits.length >= 9) {
    const byPhone = stores.find((r) => {
      const p = String(r.phone || "").replace(/[^0-9]/g, "");
      return p && p === digits;
    });
    if (byPhone) return byPhone;
  }
  // 2) ชื่อร้าน (ระบบเดิม)
  return findStoreByName(text);
}

/* ===== ล็อกอิน ===== */
function doLogin() {
  const q = phoneInput.value.trim();
  const pin = pinInput.value.trim();
  if (!q) {
    showToast("⚠️ กรุณากรอกเบอร์โทรหรือชื่อร้าน");
    phoneInput.focus();
    return;
  }
  if (!pin) {
    showToast("⚠️ กรุณากรอก PIN / รหัสผ่าน");
    pinInput.focus();
    return;
  }

  const store = findStoreByPhoneOrName(q);
  if (!store) {
    showToast(`⚠️ ไม่พบร้าน "${q}" — ลองพิมพ์ชื่อร้านให้ตรงกับหน้าร้าน หรือสมัครร้านใหม่`);
    return;
  }
  if (!verifyStorePin(store.id, pin)) {
    showToast("⚠️ PIN ไม่ถูกต้อง — ตรวจ PIN ของร้าน (ร้านพื้นฐานเริ่มต้น 1234)");
    pinInput.select();
    return;
  }

  // ✅ สำเร็จ — ตั้ง session เหมือนระบบเดิม แล้วไป dashboard ร้านค้า
  setBtnLoading(loginBtn, true);
  try { localStorage.setItem("sangkha-last-store-login", store.name); } catch (_) { /* ไม่เป็นไร */ }
  setStoreSession(store.id);
  setAdminSession(false);
  try { localStorage.setItem("sangkha-active-restaurant", String(store.id)); } catch (_) { /* ไม่เป็นไร */ }

  setTimeout(() => {
    showToast(`🏪 เข้าสู่ระบบ ${store.name} สำเร็จ!`);
    location.href = "dashboard.html";
  }, 550);
}

loginBtn.addEventListener("click", doLogin);
[phoneInput, pinInput].forEach((el) =>
  el.addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); })
);

/* ===== แสดง/ซ่อน PIN ===== */
$("#toggle-pin").addEventListener("click", () => {
  const eye = $("#toggle-pin");
  const show = pinInput.type === "password";
  pinInput.type = show ? "text" : "password";
  eye.textContent = show ? "🙈" : "👁️";
  eye.setAttribute("aria-label", show ? "ซ่อน PIN" : "แสดง PIN");
});

/* ============================================================
   ล็อกอินด้วย SMS OTP (จำลอง) — ทางเลือกแทน PIN
   - สร้างรหัส 6 หลักแบบสุ่ม + แสดงเป็น "SMS" จำลอง (toast)
   - นับถอยหลัง 60 วิ ก่อนส่งใหม่ได้
   - รหัสหมดอายุหลัง 2 นาที
   ============================================================ */
let otpCode = null;
let otpExpiry = 0;
let otpTimer = null;

const otpPhone = $("#otp-phone");
const otpCodeEl = $("#otp-code");
const otpSendBtn = $("#otp-send");
const otpStatus = $("#otp-status");
const otpLoginBtn = $("#otp-login-btn");

/* ===== สลับแท็บ PIN / OTP ===== */
$$(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const method = tab.dataset.method;
    $$(".auth-tab").forEach((t) => {
      t.classList.toggle("active", t === tab);
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });
    $("#method-pin").hidden = method !== "pin";
    $("#method-otp").hidden = method !== "otp";
    if (method === "pin") $("#login-phone").focus();
    else otpPhone.focus();
  });
});

/* ===== ส่งรหัส OTP ===== */
otpSendBtn.addEventListener("click", () => {
  const phone = otpPhone.value.trim().replace(/[^0-9]/g, "");
  if (phone.length < 9) {
    showToast("⚠️ กรอกเบอร์โทรร้านที่สมัครไว้ก่อน (10 หลัก)");
    otpPhone.focus();
    return;
  }
  const store = findStoreByPhoneOrName(phone);
  if (!store) {
    showToast(`⚠️ ไม่พบร้านเบอร์ ${phone} — ใช้ล็อกอินด้วย PIN/ชื่อร้าน หรือสมัครร้านใหม่`);
    return;
  }

  // สร้างรหัส 6 หลัก
  otpCode = String(Math.floor(100000 + Math.random() * 900000));
  otpExpiry = Date.now() + 2 * 60 * 1000; // หมดอายุใน 2 นาที

  // 📲 SMS จำลอง — แสดง toast เหมือนข้อความเข้า
  otpStatus.textContent = `📲 SMS ถึง ${phone}: รหัสยืนยัน Sangkha ของคุณคือ ${otpCode} (ใช้ได้ 2 นาที)`;
  otpStatus.classList.add("visible");
  otpCodeEl.disabled = false;
  otpLoginBtn.disabled = false;
  otpCodeEl.value = "";
  otpCodeEl.focus();
  startOtpCountdown();
  showToast(`📲 ส่งรหัส OTP ไปที่เบอร์ ${phone} แล้ว (รหัส: ${otpCode})`);
});

function startOtpCountdown() {
  clearInterval(otpTimer);
  let sec = 60;
  otpSendBtn.disabled = true;
  otpSendBtn.textContent = `ส่งอีกครั้ง (${sec}s)`;
  otpTimer = setInterval(() => {
    sec--;
    if (sec <= 0) {
      clearInterval(otpTimer);
      otpSendBtn.disabled = false;
      otpSendBtn.textContent = "ส่งรหัสอีกครั้ง";
    } else {
      otpSendBtn.textContent = `ส่งอีกครั้ง (${sec}s)`;
    }
  }, 1000);
}

/* ===== ยืนยัน OTP ===== */
otpLoginBtn.addEventListener("click", () => {
  const phone = otpPhone.value.trim().replace(/[^0-9]/g, "");
  const code = otpCodeEl.value.trim();
  if (!otpCode || Date.now() > otpExpiry) {
    showToast("⚠️ รหัสหมดอายุแล้ว — กดส่งรหัสใหม่");
    otpCode = null;
    otpLoginBtn.disabled = true;
    return;
  }
  if (code.length !== 6 || code !== otpCode) {
    showToast("⚠️ รหัสไม่ถูกต้อง — ตรวจ SMS อีกครั้ง");
    otpCodeEl.select();
    return;
  }

  const store = findStoreByPhoneOrName(phone);
  if (!store) {
    showToast("⚠️ ไม่พบร้านตามเบอร์นี้");
    return;
  }

  // ✅ สำเร็จ — ล็อกอินเหมือน PIN
  setBtnLoading(otpLoginBtn, true);
  clearInterval(otpTimer);
  otpCode = null;
  try { localStorage.setItem("sangkha-last-store-login", store.name); } catch (_) { /* ไม่เป็นไร */ }
  setStoreSession(store.id);
  setAdminSession(false);
  try { localStorage.setItem("sangkha-active-restaurant", String(store.id)); } catch (_) { /* ไม่เป็นไร */ }

  setTimeout(() => {
    showToast(`🏪 เข้าสู่ระบบ ${store.name} สำเร็จ (OTP)`);
    location.href = "dashboard.html";
  }, 550);
});

// กด Enter ในช่อง OTP = ยืนยัน
[otpCodeEl].forEach((el) =>
  el.addEventListener("keydown", (e) => { if (e.key === "Enter") otpLoginBtn.click(); })
);

/* ===== ลืมรหัสผ่าน ===== */
$("#forgot-btn").addEventListener("click", () => {
  $("#forgot-modal").hidden = false;
});
$("#forgot-close").addEventListener("click", () => {
  $("#forgot-modal").hidden = true;
});
$("#forgot-modal").addEventListener("click", (e) => {
  if (e.target.id === "forgot-modal") $("#forgot-modal").hidden = true;
});

/* ===== เติมชื่อร้านล่าสุด (ช่วยกรอก) ===== */
try {
  const last = localStorage.getItem("sangkha-last-store-login");
  if (last) phoneInput.value = last;
} catch (_) { /* ไม่เป็นไร */ }

/* ===== กันเปิดหน้าเมื่อล็อกอินแล้ว ===== */
if (getStoreSession() || isAdminLoggedIn()) {
  // เปิดหน้า login ทั้งที่ล็อกอินอยู่ → ไป dashboard ตรง ๆ (มีปุ่มออกจากระบบอยู่แล้ว)
  location.replace("dashboard.html");
}
