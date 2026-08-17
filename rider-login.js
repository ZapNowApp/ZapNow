/* ============================================================
   Sangkha Rider — หน้าล็อกอินไรเดอร์
   ใช้ระบบไรเดอร์เดิม (menu-data.js): registerRider / setRiderSession
   เพิ่มรหัสผ่านไรเดอร์แบบ local (sangkha-rider-pins) — ไม่แตะระบบเดิม
   ============================================================ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const phoneInput = $("#rider-phone");
const pinInput = $("#rider-pin");
const loginBtn = $("#rider-login-btn");

const RIDER_PINS_KEY = "sangkha-rider-pins";

function getRiderPins() {
  try { return JSON.parse(localStorage.getItem(RIDER_PINS_KEY)) || {}; } catch (_) { return {}; }
}
function setRiderPin(id, pin) {
  const pins = getRiderPins();
  pins[String(id)] = String(pin);
  try { localStorage.setItem(RIDER_PINS_KEY, JSON.stringify(pins)); } catch (_) { /* ไม่เป็นไร */ }
}

/* หาไรเดอร์ด้วยเบอร์โทร (ระบบเดิมหาแบบ ชื่อ+เบอร์ — ที่นี่ใช้เบอร์อย่างเดียว) */
function findRiderByPhone(phone) {
  const digits = String(phone || "").replace(/[^0-9]/g, "");
  if (digits.length < 9) return null;
  return getRiders().find((r) => {
    const p = String(r.phone || "").replace(/[^0-9]/g, "");
    return p && p === digits;
  }) || null;
}

/* ===== ล็อกอิน ===== */
function doLogin() {
  const phone = phoneInput.value.trim();
  const pin = pinInput.value.trim();
  if (!phone) { showToast("⚠️ กรอกเบอร์โทรก่อน"); phoneInput.focus(); return; }
  if (!pin) { showToast("⚠️ กรอกรหัสผ่านก่อน"); pinInput.focus(); return; }

  const rider = findRiderByPhone(phone);
  if (!rider) {
    showToast("⚠️ ไม่พบไรเดอร์เบอร์นี้ — ตรวจเบอร์ หรือสมัครไรเดอร์ใหม่");
    return;
  }
  const pins = getRiderPins();
  const stored = pins[String(rider.id)];
  if (!stored) {
    showToast("⚠️ ไรเดอร์นี้ยังไม่ได้ตั้งรหัสผ่าน — สมัครใหม่ด้วยรหัสผ่านของตัวเอง");
    return;
  }
  if (pin !== stored) {
    showToast("⚠️ รหัสผ่านไม่ถูกต้อง — ลองอีกครั้ง");
    pinInput.select();
    return;
  }

  // ✅ สำเร็จ
  setBtnLoading(loginBtn, true);
  setRiderSession(rider.id);
  setTimeout(() => {
    showToast(`🛵 ยินดีต้อนรับ ${rider.name} — เริ่มรับงานได้เลย!`);
    location.href = "rider.html";
  }, 550);
}

loginBtn.addEventListener("click", doLogin);
[phoneInput, pinInput].forEach((el) =>
  el.addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); })
);

/* ===== แสดง/ซ่อนรหัสผ่าน ===== */
$("#toggle-rider-pin").addEventListener("click", () => {
  const eye = $("#toggle-rider-pin");
  const show = pinInput.type === "password";
  pinInput.type = show ? "text" : "password";
  eye.textContent = show ? "🙈" : "👁️";
});

/* ============================================================
   ล็อกอินด้วย SMS OTP (จำลอง) — ทางเลือกแทนรหัสผ่าน
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

/* ===== สลับแท็บ รหัสผ่าน / OTP ===== */
$$(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const method = tab.dataset.method;
    $$(".auth-tab").forEach((t) => {
      t.classList.toggle("active", t === tab);
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });
    $("#method-pin").hidden = method !== "pin";
    $("#method-otp").hidden = method !== "otp";
    if (method === "pin") phoneInput.focus();
    else otpPhone.focus();
  });
});

/* ===== ส่งรหัส OTP ===== */
otpSendBtn.addEventListener("click", () => {
  const phone = otpPhone.value.trim().replace(/[^0-9]/g, "");
  if (phone.length < 9) {
    showToast("⚠️ กรอกเบอร์โทรที่สมัครไว้ก่อน (10 หลัก)");
    otpPhone.focus();
    return;
  }
  const rider = findRiderByPhone(phone);
  if (!rider) {
    showToast(`⚠️ ไม่พบไรเดอร์เบอร์ ${phone} — ใช้ล็อกอินด้วยรหัสผ่าน หรือสมัครไรเดอร์ใหม่`);
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

  const rider = findRiderByPhone(phone);
  if (!rider) {
    showToast("⚠️ ไม่พบไรเดอร์ตามเบอร์นี้");
    return;
  }

  // ✅ สำเร็จ — ล็อกอินเหมือนรหัสผ่าน
  setBtnLoading(otpLoginBtn, true);
  clearInterval(otpTimer);
  otpCode = null;
  setRiderSession(rider.id);

  setTimeout(() => {
    showToast(`🛵 ยินดีต้อนรับ ${rider.name} — เข้าสู่ระบบด้วย OTP สำเร็จ!`);
    location.href = "rider.html";
  }, 550);
});

// กด Enter ในช่อง OTP = ยืนยัน
otpCodeEl.addEventListener("keydown", (e) => { if (e.key === "Enter") otpLoginBtn.click(); });

/* ===== สมัครไรเดอร์ ===== */
$("#rider-signup-open").addEventListener("click", () => {
  $("#rider-signup-modal").hidden = false;
  $("#rs-name").focus();
});
$("#rs-cancel").addEventListener("click", () => { $("#rider-signup-modal").hidden = true; });
$("#rider-signup-modal").addEventListener("click", (e) => {
  if (e.target.id === "rider-signup-modal") $("#rider-signup-modal").hidden = true;
});

$("#rs-submit").addEventListener("click", () => {
  const name = $("#rs-name").value.trim();
  const phone = $("#rs-phone").value.trim();
  const pin = $("#rs-pin").value.trim();
  if (!name) { showToast("⚠️ กรอกชื่อไรเดอร์"); return; }
  if (phone.replace(/[^0-9]/g, "").length < 9) { showToast("⚠️ กรอกเบอร์โทรให้ครบ 10 หลัก"); return; }
  if (pin.length < 4) { showToast("⚠️ ตั้งรหัสผ่านอย่างน้อย 4 ตัว"); return; }
  if (findRiderByPhone(phone)) {
    showToast("⚠️ เบอร์นี้เป็นไรเดอร์อยู่แล้ว — เข้าสู่ระบบได้เลย");
    return;
  }

  const rider = registerRider(name, phone); // ใช้ฟังก์ชันเดิม (เก็บ name+phone)
  setRiderPin(rider.id, pin);               // เก็บรหัสผ่านแยก (ไม่แตะระบบเดิม)
  setBtnLoading($("#rs-submit"), true);
  setTimeout(() => {
    $("#rider-signup-modal").hidden = true;
    setRiderSession(rider.id);
    showToast(`🛵 สมัคร ${rider.name} สำเร็จ — เข้าสู่ระบบแล้ว!`);
    location.href = "rider.html";
  }, 500);
});

/* ===== ลืมรหัส ===== */
$("#rider-forgot").addEventListener("click", () => { $("#rider-forgot-modal").hidden = false; });
$("#rf-close").addEventListener("click", () => { $("#rider-forgot-modal").hidden = true; });
$("#rider-forgot-modal").addEventListener("click", (e) => {
  if (e.target.id === "rider-forgot-modal") $("#rider-forgot-modal").hidden = true;
});

/* ===== ripple ===== */
[loginBtn, $("#rs-submit"), $("#rs-cancel"), $("#rf-close")].forEach((b) => b && attachRipple(b));

/* ===== กันเปิดหน้าเมื่อล็อกอินแล้ว ===== */
try {
  if (localStorage.getItem("sangkha-rider")) location.replace("rider.html");
} catch (_) { /* ไม่เป็นไร */ }
