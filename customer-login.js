/* ============================================================
   Sangkha Food — หน้าล็อกอินสมาชิก (ลูกค้า)
   บัญชีลูกค้าแบบ local (sangkha-customer-accounts) — ไม่แตะ
   ระบบร้าน/ไรเดอร์/Firebase เดิม — หลังล็อกอินไปหน้าร้าน (index)
   ============================================================ */
const $ = (sel) => document.querySelector(sel);

const phoneInput = $("#cust-phone");
const pinInput = $("#cust-pin");
const loginBtn = $("#cust-login-btn");

const ACCOUNTS_KEY = "sangkha-customer-accounts";
const SESSION_KEY = "sangkha-customer-session";

function getAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || {}; } catch (_) { return {}; }
}
function saveAccount(acc) {
  const all = getAccounts();
  all[acc.phone] = acc;
  try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(all)); } catch (_) { /* ไม่เป็นไร */ }
}
function setCustomerSession(phone) {
  try { localStorage.setItem(SESSION_KEY, phone); } catch (_) { /* ไม่เป็นไร */ }
}

/* ===== ล็อกอิน ===== */
function doLogin() {
  const phone = phoneInput.value.trim().replace(/[^0-9]/g, "");
  const pin = pinInput.value.trim();
  if (phone.length < 9) { showToast("⚠️ กรอกเบอร์โทรให้ครบ 10 หลัก"); phoneInput.focus(); return; }
  if (!pin) { showToast("⚠️ กรอกรหัสผ่านก่อน"); pinInput.focus(); return; }

  const acc = getAccounts()[phone];
  if (!acc) {
    showToast("⚠️ ยังไม่มีบัญชีเบอร์นี้ — สมัครสมาชิกก่อน");
    return;
  }
  if (pin !== acc.pin) {
    showToast("⚠️ รหัสผ่านไม่ถูกต้อง — ลองอีกครั้ง");
    pinInput.select();
    return;
  }

  setBtnLoading(loginBtn, true);
  setCustomerSession(phone);
  setTimeout(() => {
    showToast(`😋 ยินดีต้อนรับกลับ ${acc.name}!`);
    location.href = "index.html";
  }, 550);
}

loginBtn.addEventListener("click", doLogin);
[phoneInput, pinInput].forEach((el) =>
  el.addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); })
);

/* ===== แสดง/ซ่อนรหัสผ่าน ===== */
$("#toggle-cust-pin").addEventListener("click", () => {
  const eye = $("#toggle-cust-pin");
  const show = pinInput.type === "password";
  pinInput.type = show ? "text" : "password";
  eye.textContent = show ? "🙈" : "👁️";
});

/* ============================================================
   ล็อกอินด้วย SMS OTP (จำลอง) — ทางเลือกแทนรหัสผ่าน
   - สร้างรหัส 6 หลักแบบสุ่ม + แสดงเป็น "SMS" จำลอง (toast)
   - นับถอยหลัง 60 วิ ก่อนส่งใหม่ได้ / รหัสหมดอายุหลัง 2 นาที
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
[...document.querySelectorAll(".auth-tab")].forEach((tab) => {
  tab.addEventListener("click", () => {
    const method = tab.dataset.method;
    [...document.querySelectorAll(".auth-tab")].forEach((t) => {
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
  if (!getAccounts()[phone]) {
    showToast(`⚠️ ยังไม่มีบัญชีเบอร์ ${phone} — สมัครสมาชิกก่อน`);
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

  const acc = getAccounts()[phone];
  if (!acc) {
    showToast("⚠️ ยังไม่มีบัญชีตามเบอร์นี้");
    return;
  }

  // ✅ สำเร็จ — ล็อกอินเหมือนรหัสผ่าน
  setBtnLoading(otpLoginBtn, true);
  clearInterval(otpTimer);
  otpCode = null;
  setCustomerSession(phone);

  setTimeout(() => {
    showToast(`😋 ยินดีต้อนรับกลับ ${acc.name} (OTP)!`);
    location.href = "index.html";
  }, 550);
});

// กด Enter ในช่อง OTP = ยืนยัน
otpCodeEl.addEventListener("keydown", (e) => { if (e.key === "Enter") otpLoginBtn.click(); });

/* ===== สมัครสมาชิก ===== */
$("#cust-signup-open").addEventListener("click", () => {
  $("#cust-signup-modal").hidden = false;
  $("#cs-name").focus();
});
$("#cs-cancel").addEventListener("click", () => { $("#cust-signup-modal").hidden = true; });
$("#cust-signup-modal").addEventListener("click", (e) => {
  if (e.target.id === "cust-signup-modal") $("#cust-signup-modal").hidden = true;
});

$("#cs-submit").addEventListener("click", () => {
  const name = $("#cs-name").value.trim();
  const phone = $("#cs-phone").value.trim().replace(/[^0-9]/g, "");
  const pin = $("#cs-pin").value.trim();
  if (!name) { showToast("⚠️ กรอกชื่อ-นามสกุล"); return; }
  if (phone.length < 9) { showToast("⚠️ กรอกเบอร์โทรให้ครบ 10 หลัก"); return; }
  if (pin.length < 4) { showToast("⚠️ ตั้งรหัสผ่านอย่างน้อย 4 ตัว"); return; }
  if (getAccounts()[phone]) {
    showToast("⚠️ เบอร์นี้สมัครสมาชิกแล้ว — เข้าสู่ระบบได้เลย");
    return;
  }

  saveAccount({ name, phone, pin, createdAt: Date.now() });
  setBtnLoading($("#cs-submit"), true);
  setTimeout(() => {
    $("#cust-signup-modal").hidden = true;
    setCustomerSession(phone);
    showToast(`🎉 สมัครสมาชิก ${name} สำเร็จ — เข้าสู่ระบบแล้ว!`);
    location.href = "index.html";
  }, 500);
});

/* ===== ลืมรหัส ===== */
$("#cust-forgot").addEventListener("click", () => { $("#cust-forgot-modal").hidden = false; });
$("#cf-close").addEventListener("click", () => { $("#cust-forgot-modal").hidden = true; });
$("#cust-forgot-modal").addEventListener("click", (e) => {
  if (e.target.id === "cust-forgot-modal") $("#cust-forgot-modal").hidden = true;
});

/* ===== ripple ===== */
[loginBtn, otpSendBtn, otpLoginBtn, $("#cs-submit"), $("#cs-cancel"), $("#cf-close")].forEach((b) => b && attachRipple(b));

/* ===== กันเปิดหน้าเมื่อล็อกอินแล้ว ===== */
try {
  if (localStorage.getItem(SESSION_KEY)) location.replace("index.html");
} catch (_) { /* ไม่เป็นไร */ }
