/* ===== Rider Dashboard =====
   - ไรเดอร์รับงาน: ออเดอร์ พร้อมส่ง (ร้านเตรียมเสร็จ) → รับงาน → กำลังจัดส่ง (ระบุชื่อไรเดอร์)
   - ส่งถึงลูกค้า: กำลังจัดส่ง → เสร็จสิ้น (ลูกค้าที่หน้าร้านเห็นสถานะอัปเดตทันที)
   - อัปเดตสด: ฟังเหตุการณ์ storage + เช็คทุก 3 วิ + เสียง/toast/Notification เมื่อมีงานใหม่ */

const $ = (sel) => document.querySelector(sel);

// ถ้ายังไม่ล็อกอิน → กลับหน้าล็อกอิน
let profile = getRiderProfile();
if (!profile) {
  location.replace("rider-login.html");
}
let filter = "ready";
let doneMonth = "all"; // เดือนที่กรองในแท็บ ส่งแล้ว ("all" = ทุกเดือน)
let lastReadyIds = new Set(); // งานพร้อมส่งที่เห็นแล้ว (กันแจ้งเตือนซ้ำ)
let lastAssignedIds = new Set(); // งานที่ระบบจัดให้เราแล้ว (กันแจ้งซ้ำ)
let initialized = false;

/* ===== แจ้งเตือน ===== */
const toastEl = $("#toast");
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 2600);
}

let audioCtx = null;
function chime() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    [660, 880, 1320].forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const t = now + i * 0.13;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  } catch (_) { /* ไม่เป็นไร */ }
}

// ปลดล็อกเสียงเมื่อผู้ใช้แตะ/กดครั้งแรก (เบราว์เซอร์กันเสียงตอนแท็บพื้นหลัง)
["click", "touchstart", "keydown"].forEach((ev) =>
  window.addEventListener(
    ev,
    () => {
      try {
        if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
      } catch (_) { /* ไม่เป็นไร */ }
    },
    { passive: true }
  )
);

if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission().catch(() => {});
}
function notifyOrder(order) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const rest = getRestaurant(order.restaurantId);
    new Notification(`🛵 งานใหม่ #${order.id} — ${rest.name}`, {
      body: `${order.customer.name} · ${order.items.reduce((a, i) => a + i.qty, 0)} รายการ · ${fmt(order.total)}`,
    });
  } catch (_) { /* ไม่เป็นไร */ }
}

/* ===== ตัวช่วย ===== */
function fmt(n) { return "฿" + n.toLocaleString("th-TH"); }
function isToday(ts) {
  const d = new Date(ts);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}
// คีย์เดือน "YYYY-MM" สำหรับกรองประวัติ (จาก timestamp)
function monthKey(ts) {
  const d = new Date(ts);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
// ป้ายชื่อเดือนไทย: "สิงหาคม 2569"
function monthLabel(key) {
  const [y, m] = String(key).split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("th-TH", { month: "long", year: "numeric" });
}
function timeAgo(ts) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "เมื่อสักครู่";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  return new Date(ts).toLocaleDateString("th-TH");
}
function clock(ts) {
  return new Date(ts).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ===== การ์ดงาน ===== */
function routeBlock(o) {
  const rest = getRestaurant(o.restaurantId);
  return `
    <div class="rider-route">
      <div class="rider-route-col">
        <small>🏪 รับอาหารที่ร้าน</small>
        <b>${rest.name}</b>
        <small>${rest.address || ""}${o.distanceKm || rest.distanceKm ? ` · ไกลจากลูกค้า ${o.distanceKm || rest.distanceKm} กม.` : ""}</small>
      </div>
      <div class="rider-route-mid"><span class="rider-route-line"></span>🛵</div>
      <div class="rider-route-col">
        <small>📍 ส่งให้ลูกค้า</small>
        <b>${escapeHtml(o.customer.name)}</b>
        <small>${escapeHtml(o.customer.address)}</small>
      </div>
    </div>`;
}

function itemsBlock(o) {
  return `
    <div class="order-items">
      ${o.items.map((it) => `
        <div class="order-item">
          <span class="order-item-name">${it.img ? "" : it.emoji} ${escapeHtml(it.name)} <span class="order-item-qty">× ${it.qty}</span></span>
          <span>${fmt(it.price * it.qty)}</span>
        </div>`).join("")}
    </div>`;
}

function totalsBlock(o) {
  return `
    <div class="order-totals">
      <div><span>รวมอาหาร</span><span>${fmt(o.subtotal)}</span></div>
      <div><span>ค่าจัดส่ง (รายได้ไรเดอร์)</span><span>${o.delivery === 0 ? "ฟรี" : fmt(o.delivery)}</span></div>
      ${o.platformFee > 0 ? `<div><span>💸 ค่าแพลตฟอร์ม</span><span>${fmt(o.platformFee)}</span></div>` : ""}
      ${o.discount > 0 ? `<div class="order-discount-row"><span>🎟️ ส่วนลดคูปอง${o.couponCode ? ` (${o.couponCode})` : ""}</span><span>−${fmt(o.discount)}</span></div>` : ""}
      <div class="order-total"><span>ยอดรวม</span><b>${fmt(o.total)}</b></div>
    </div>`;
}

function readyCard(o) {
  const rest = getRestaurant(o.restaurantId);
  const whitelisted = getRestaurantRiders(o.restaurantId).length > 0;
  return `
    <article class="order-card order-ready" data-id="${o.id}">
      <div class="order-head">
        <div>
          <span class="order-id">ออเดอร์ #${o.id}</span>
          <span class="order-time">${clock(o.createdAt)} · ${timeAgo(o.createdAt)} · ${rest.name}</span>
        </div>
        <span class="order-head-badges">
          ${whitelisted ? `<span class="rider-chip">🏠 ประจำร้าน</span>` : ""}
          <span class="status-pill status-พร้อมส่ง">พร้อมส่ง</span>
        </span>
      </div>
      ${routeBlock(o)}
      ${itemsBlock(o)}
      ${totalsBlock(o)}
      <div class="order-actions">
        <button class="btn-action btn-map" data-action="map" data-map-mode="pickup" type="button">🗺️ แผนที่ไปรับของ</button>
        <button class="btn-action btn-take" data-action="take" type="button">🛵 รับงานนี้</button>
      </div>
    </article>`;
}

// ขั้นตอนการส่ง (ไรเดอร์กดอัปเดต → ลูกค้าเห็นบนแผนที่)
const STAGE_META = {
  "ไปรับอาหาร": { idx: 1, label: "ไปรับอาหารที่ร้าน", btn: '<button class="btn-action btn-arrived" data-action="arrived" type="button">🏪 ถึงร้านแล้ว</button>' },
  "ถึงร้านแล้ว": { idx: 2, label: "ถึงร้านแล้ว — กำลังรับอาหาร", btn: '<button class="btn-action btn-depart" data-action="depart" type="button">🛵 เริ่มไปส่ง</button>' },
  "กำลังไปส่ง": { idx: 3, label: "กำลังไปส่งถึงลูกค้า", btn: "" },
};

function mineCard(o) {
  const stage = o.riderStage || "ไปรับอาหาร";
  const meta = STAGE_META[stage] || STAGE_META["ไปรับอาหาร"];
  const rest = getRestaurant(o.restaurantId);
  const restPhone = rest && rest.phone && rest.phone !== "-" ? String(rest.phone) : "";
  return `
    <article class="order-card order-delivering" data-id="${o.id}">
      <div class="order-head">
        <div>
          <span class="order-id">ออเดอร์ #${o.id}</span>
          <span class="order-time">${clock(o.createdAt)} · รับของเมื่อ ${clock(o.pickedUpAt || o.createdAt)}</span>
        </div>
        <span class="rider-chip">🛵 ${escapeHtml(o.riderName || "")}</span>
      </div>
      <div class="rider-stage-line">📍 ระยะ ${meta.idx}/3 · ${meta.label} · ⏱️ ${riderEtaLabel(o)}</div>
      ${routeBlock(o)}
      <div class="order-customer">
        👤 <b>${escapeHtml(o.customer.name)}</b> · 📞 ${escapeHtml(o.customer.phone)}
        <div class="order-address">📍 ${escapeHtml(o.customer.address)}</div>
        ${o.gps ? `<div class="order-note">📌 พิกัด GPS: ${o.gps.lat}, ${o.gps.lng}</div>` : ""}
        ${o.customer.note ? `<div class="order-note">📝 ${escapeHtml(o.customer.note)}</div>` : ""}
      </div>
      <div class="rider-contact">
        ${restPhone
          ? `<a href="tel:${escapeHtml(restPhone)}" title="โทรหาร้าน ${escapeHtml(rest.name)}">🏪 โทรหาร้าน${rest.name ? ` (${escapeHtml(rest.name)})` : ""}</a>`
          : ""}
        <a href="tel:${escapeHtml(o.customer.phone)}">📞 โทรหาลูกค้า</a>
        ${o.gps
          ? `<a href="https://maps.google.com/?q=${o.gps.lat},${o.gps.lng}" target="_blank" rel="noopener" title="นำทางไปพิกัด GPS ที่ลูกค้าปักหมุด">🗺️ เปิดแผนที่ (GPS)</a>`
          : `<a href="https://maps.google.com/?q=${encodeURIComponent(o.customer.address)}" target="_blank" rel="noopener" title="เปิดแผนที่จากที่อยู่ที่พิมพ์">🗺️ เปิดแผนที่</a>`}
      </div>
      ${itemsBlock(o)}
      ${totalsBlock(o)}
      <div class="order-actions">
        <button class="btn-action btn-map" data-action="map" data-map-mode="${stage === "กำลังไปส่ง" ? "drop" : "pickup"}" type="button">🗺️ แผนที่นำทาง</button>
        ${meta.btn}
        ${stage === "กำลังไปส่ง" ? '<button class="btn-action btn-deliver" data-action="deliver" type="button">✅ ส่งถึงแล้ว</button>' : ""}
        <button class="btn-action btn-release" data-action="release" type="button">↩️ คืนงาน</button>
      </div>
    </article>`;
}

function doneCard(o) {
  return `
    <article class="order-card" data-id="${o.id}">
      <div class="order-head">
        <div>
          <span class="order-id">ออเดอร์ #${o.id}</span>
          <span class="order-time">${clock(o.createdAt)} · ส่งแล้ว ${timeAgo(o.deliveredAt || o.createdAt)}</span>
        </div>
        <span class="rider-earn-chip">💸 ได้ ${o.delivery === 0 ? "฿0" : fmt(o.delivery)}</span>
      </div>
      ${routeBlock(o)}
      ${itemsBlock(o)}
      ${totalsBlock(o)}
      <div class="order-actions">
        <button class="btn-action btn-delete-order" data-action="delete" type="button">🗑️ ลบออก</button>
      </div>
    </article>`;
}

/* ===== เรนเดอร์ ===== */
function myOrders() {
  return getOrders().filter((o) => o.riderId && o.riderId === (profile && profile.id));
}

/* ===== กระเป๋าเงิน ===== */
const walletEl = $("#rider-wallet");
const walletAmount = $("#wallet-amount");
const walletWithdrawBtn = $("#wallet-withdraw");

function renderWallet() {
  if (!profile) {
    walletEl.hidden = true;
    return;
  }
  walletEl.hidden = false;
  const earned = getRiderEarnings(profile.id);
  const withdrawn = getRiderWithdrawals(profile.id).reduce((s, w) => s + w.amount, 0);
  const available = getRiderBalance(profile.id);
  $("#wallet-earned").textContent = fmt(earned);
  $("#wallet-withdrawn").textContent = fmt(withdrawn);
  $("#wallet-available").textContent = fmt(available);
  walletWithdrawBtn.disabled = available <= 0;

  const history = getRiderWithdrawals(profile.id);
  const histEl = $("#wallet-history");
  histEl.innerHTML = history.length
    ? history
        .map((w) => `
      <div class="wallet-history-item">
        <span>💸 เบิก <b>${fmt(w.amount)}</b></span>
        <span class="wallet-history-mid"><small>${new Date(w.requestedAt).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small></span>
        <button type="button" data-del="${w.id}" aria-label="ลบประวัติการเบิก">🗑️</button>
      </div>`).join("")
    : `<p class="wallet-history-empty">ยังไม่เคยเบิกถอน — ยอดสะสมจะเพิ่มทุกครั้งที่ส่งอาหารสำเร็จ</p>`;
}

$("#wallet-withdraw").addEventListener("click", () => {
  if (!profile) return;
  const amt = Number(walletAmount.value);
  if (!(amt > 0)) {
    showToast("⚠️ กรอกจำนวนเงินที่ต้องการเบิก");
    walletAmount.focus();
    return;
  }
  const available = getRiderBalance(profile.id);
  if (amt > available) {
    showToast(`⚠️ เบิกได้สูงสุด ${fmt(available)}`);
    return;
  }
  const record = addRiderWithdrawal(profile.id, amt);
  if (!record) {
    showToast("⚠️ เบิกไม่สำเร็จ — ตรวจสอบยอดอีกครั้ง");
    return;
  }
  walletAmount.value = "";
  renderWallet();
  showToast(`💸 เบิกถอน ${fmt(record.amount)} เรียบร้อย — คงเหลือ ${fmt(getRiderBalance(profile.id))}`);
});

$("#wallet-history").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-del]");
  if (!btn) return;
  deleteRiderWithdrawal(btn.dataset.del);
  renderWallet();
  showToast("🗑️ ลบประวัติการเบิกแล้ว");
});

/* ===== โปรไฟล์ไรเดอร์ (ของตัวเอง: ชื่อ/เบอร์/วันสมัคร/สถิติรวม) ===== */
const profileEl = $("#rider-profile");

function renderProfile() {
  if (!profile) {
    profileEl.hidden = true;
    return;
  }
  profileEl.hidden = false;
  $("#profile-name").textContent = profile.name;
  $("#profile-phone").textContent = profile.phone && profile.phone !== "-" ? profile.phone : "—";
  $("#profile-email").textContent = profile.email ? profile.email : "—";
  $("#profile-joined").textContent = profile.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const delivered = getOrders().filter((o) => o.riderId === profile.id && o.status === "เสร็จสิ้น");
  $("#profile-delivered").textContent = delivered.length + " งาน";
  $("#profile-earned").textContent = fmt(delivered.reduce((s, o) => s + (Number(o.delivery) || 0), 0));
}

// แก้ไขชื่อ (กันชื่อซ้ำกับไรเดอร์คนอื่น)
$("#profile-edit-name").addEventListener("click", () => {
  if (!profile) return;
  $("#profile-name-input").value = profile.name;
  $("#profile-name-edit").hidden = false;
  $("#profile-name-input").focus();
});
$("#profile-name-save").addEventListener("click", () => {
  if (!profile) return;
  const n = $("#profile-name-input").value.trim();
  if (!n) {
    showToast("⚠️ กรอกชื่อก่อน");
    $("#profile-name-input").focus();
    return;
  }
  const updated = updateRiderName(profile.id, n);
  if (!updated) {
    showToast("⚠️ ชื่อนี้มีไรเดอร์คนอื่นใช้แล้ว — ลองชื่อใหม่");
    return;
  }
  profile = getRiderProfile();
  $("#profile-name-edit").hidden = true;
  renderProfile();
  renderRiderBar();
  render();
  showToast(`✏️ อัปเดตชื่อเป็น ${updated.name} แล้ว`);
});
$("#profile-name-cancel").addEventListener("click", () => {
  $("#profile-name-edit").hidden = true;
});

// แก้ไขเบอร์โทร
$("#profile-edit-phone").addEventListener("click", () => {
  if (!profile) return;
  $("#profile-phone-input").value = profile.phone && profile.phone !== "-" ? profile.phone : "";
  $("#profile-phone-edit").hidden = false;
  $("#profile-phone-input").focus();
});
$("#profile-phone-save").addEventListener("click", () => {
  if (!profile) return;
  const p = $("#profile-phone-input").value.trim();
  if (!p) {
    showToast("⚠️ กรอกเบอร์โทรก่อน");
    $("#profile-phone-input").focus();
    return;
  }
  const updated = updateRiderPhone(profile.id, p);
  if (!updated) {
    showToast("⚠️ เบอร์นี้มีไรเดอร์คนอื่นใช้แล้ว — ลองเบอร์ใหม่");
    return;
  }
  profile = getRiderProfile();
  $("#profile-phone-edit").hidden = true;
  renderProfile();
  renderRiderBar();
  showToast(`📱 อัปเดตเบอร์เป็น ${updated.phone} แล้ว`);
});
$("#profile-phone-cancel").addEventListener("click", () => {
  $("#profile-phone-edit").hidden = true;
});

// แก้ไขอีเมล (ใช้รับสลิปรายเดือน)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
$("#profile-edit-email").addEventListener("click", () => {
  if (!profile) return;
  $("#profile-email-input").value = profile.email || "";
  $("#profile-email-edit").hidden = false;
  $("#profile-email-input").focus();
});
$("#profile-email-save").addEventListener("click", () => {
  if (!profile) return;
  const em = $("#profile-email-input").value.trim();
  if (!EMAIL_RE.test(em)) {
    showToast("⚠️ อีเมลไม่ถูกต้อง — เช่น rider@example.com");
    $("#profile-email-input").focus();
    return;
  }
  const updated = updateRiderEmail(profile.id, em);
  if (!updated) {
    showToast("⚠️ บันทึกอีเมลไม่สำเร็จ");
    return;
  }
  profile = getRiderProfile();
  $("#profile-email-edit").hidden = true;
  renderProfile();
  showToast(`📧 บันทึกอีเมล ${updated.email} แล้ว — ใช้รับสลิปรายเดือน`);
});
$("#profile-email-cancel").addEventListener("click", () => {
  $("#profile-email-edit").hidden = true;
});

function render() {
  const all = getOrders();
  // งานจากร้านที่ตั้งไรเดอร์ประจำร้านไว้ → เห็นเฉพาะไรเดอร์ในกลุ่ม
  const ready = all
    .filter((o) => o.status === "พร้อมส่ง" && riderCanSeeRestaurant(o.restaurantId, profile && profile.id))
    .sort((a, b) => b.createdAt - a.createdAt);
  const mine = myOrders().filter((o) => o.status === "กำลังจัดส่ง").sort((a, b) => b.createdAt - a.createdAt);
  const doneToday = myOrders().filter((o) => o.status === "เสร็จสิ้น" && isToday(o.deliveredAt || o.createdAt));
  const earnToday = doneToday.reduce((s, o) => s + (Number(o.delivery) || 0), 0);

  // แจ้งเตือนงานใหม่ (เฉพาะ พร้อมส่ง ที่เพิ่งมา หลังหน้าโหลดครั้งแรก)
  if (initialized) {
    const fresh = ready.filter((o) => !lastReadyIds.has(o.id));
    if (fresh.length) {
      fresh.forEach((o) => {
        showToast(`🛵 งานใหม่ #${o.id} — ${getRestaurant(o.restaurantId).name} · ${fmt(o.total)}`);
        notifyOrder(o);
      });
      chime();
    }
  }
  // แจ้งเตือนงานที่ระบบจัดให้อัตโนมัติ (ไรเดอร์ว่าง/ใกล้สุด — ยังไม่ได้กดรับเอง)
  if (initialized && profile) {
    const assignedFresh = mine.filter(
      (o) => !lastAssignedIds.has(o.id) && Date.now() - (o.pickedUpAt || o.createdAt) < 120 * 1000
    );
    if (assignedFresh.length) {
      assignedFresh.forEach((o) => {
        showToast(`🤖 ระบบจัดงาน #${o.id} ให้คุณ — ${getRestaurant(o.restaurantId).name} · ${fmt(o.total)} (ว่างสุด)`);
      });
      chime();
    }
  }
  lastAssignedIds = new Set(mine.map((o) => o.id));
  initialized = true;
  lastReadyIds = new Set(ready.map((o) => o.id));

  // สถิติ
  $("#rider-stat-ready").textContent = ready.length;
  $("#rider-stat-ready").parentElement.classList.toggle("has-new", ready.length > 0);
  $("#rider-stat-delivering").textContent = mine.length;
  $("#rider-stat-done").textContent = doneToday.length;
  $("#rider-stat-earn").textContent = fmt(earnToday);

  // กระเป๋าเงิน (ยอดสะสม + เบิกได้ + ประวัติ)
  renderWallet();

  // โปรไฟล์ของฉัน (ชื่อ/เบอร์/สถิติรวม — อัปเดตสด)
  renderProfile();

  // badge จำนวนงานใหม่บนไอคอนแอป (ถ้าเบราว์เซอร์รองรับ — เช่น Chromium)
  try {
    if (navigator.setAppBadge) {
      ready.length ? navigator.setAppBadge(ready.length) : navigator.clearAppBadge();
    }
  } catch (_) { /* ไม่เป็นไร */ }

  const name = profile ? profile.name : "";
  const phone = profile && profile.phone && profile.phone !== "-" ? profile.phone : "";
  document.title = ready.length > 0 ? `(${ready.length} งาน) 🛵 ${name}` : `🛵 ${name}`;
  $("#rider-subtitle").textContent = name
    ? `${name}${phone ? ` · ${phone}` : ""} · รับอาหารจากร้านแล้วส่งถึงลูกค้า — งานพร้อมส่ง ${ready.length} งาน`
    : "ลงทะเบียนไรเดอร์ (ชื่อ + เบอร์) แล้วรอรับงานจากร้านที่เตรียมอาหารเสร็จ";

  // รายการตามแท็บ
  let cards = [];
  let emptyMsg = "";
  if (filter === "ready") {
    cards = ready.map(readyCard);
    emptyMsg = "ยังไม่มีงานรอรับ — เมื่อร้านกด \"พร้อมส่งแล้ว\" งานจะโผล่ที่นี่ทันที 🛵";
  } else if (filter === "mine") {
    cards = mine.map(mineCard);
    emptyMsg = "ยังไม่มีงานที่กำลังส่ง — รับงานจากแท็บ \"รอรับงาน\" ก่อน";
  } else {
    // ประวัติที่ส่งสำเร็จทั้งหมด (ไม่ใช่แค่วันนี้) — กรองตามเดือนได้
    const done = myOrders()
      .filter((o) => o.status === "เสร็จสิ้น")
      .sort((a, b) => (b.deliveredAt || b.createdAt) - (a.deliveredAt || a.createdAt));
    const monthSel = $("#done-month");
    if (monthSel) {
      // เดือนทั้งหมดที่มีงาน (เรียงใหม่สุดก่อน) + ตัวเลือกบอกจำนวนงาน/รายได้ของเดือนนั้น
      const months = [...new Set(done.map((o) => monthKey(o.deliveredAt || o.createdAt)))].sort().reverse();
      if (!months.includes(doneMonth)) doneMonth = "all";
      monthSel.innerHTML =
        `<option value="all">🗓️ ทุกเดือน (${done.length} งาน)</option>` +
        months
          .map((k) => {
            const ms = done.filter((o) => monthKey(o.deliveredAt || o.createdAt) === k);
            const sum = ms.reduce((s, o) => s + (Number(o.delivery) || 0), 0);
            return `<option value="${k}">${monthLabel(k)} (${ms.length} งาน · ${fmt(sum)})</option>`;
          })
          .join("");
      monthSel.value = months.includes(doneMonth) ? doneMonth : "all";
      const list = doneMonth === "all" ? done : done.filter((o) => monthKey(o.deliveredAt || o.createdAt) === doneMonth);
      const sum = list.reduce((s, o) => s + (Number(o.delivery) || 0), 0);
      $("#done-summary").textContent =
        doneMonth === "all"
          ? `📊 ทั้งหมด ${list.length} งาน · รายได้รวม ${fmt(sum)}`
          : `📊 ${monthLabel(doneMonth)}: ${list.length} งาน · รายได้รวม ${fmt(sum)}`;
      $("#done-filter-bar").hidden = false;
      $("#done-slip-btn").disabled = list.length === 0;
      cards = list.map(doneCard);
      emptyMsg = "ยังไม่มีงานที่ส่งเสร็จ" + (doneMonth === "all" ? "" : "ในเดือนนี้");
    } else {
      cards = done.map(doneCard);
      emptyMsg = "ยังไม่มีงานที่ส่งเสร็จ";
    }
  }

  const listEl = $("#rider-list");
  listEl.innerHTML = cards.join("");
  const emptyEl = $("#rider-empty");
  emptyEl.hidden = cards.length > 0;
  emptyEl.textContent = emptyMsg;
}

/* ===== เข้าสู่ระบบ / ลงทะเบียน / ออกจากระบบ — ไรเดอร์เห็นเฉพาะหน้าของตัวเอง ===== */
const nameInput = $("#rider-name");
const phoneInput = $("#rider-phone");
const loginPanel = $("#rider-login");
const activePanel = $("#rider-active");

function renderRiderBar() {
  loginPanel.hidden = !!profile;
  activePanel.hidden = !profile;
  if (profile) {
    $("#rider-active-name").textContent =
      `${profile.name}${profile.phone && profile.phone !== "-" ? ` · ${profile.phone}` : ""}`;
  }
}

$("#rider-login-btn").addEventListener("click", () => {
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  if (!name) {
    showToast("⚠️ กรอกชื่อไรเดอร์ก่อน");
    nameInput.focus();
    return;
  }
  const rider = findRiderByNamePhone(name, phone);
  if (!rider) {
    showToast("⚠️ ไม่พบไรเดอร์นี้ — ตรวจชื่อ/เบอร์ หรือกด ＋ ลงทะเบียน");
    return;
  }
  setRiderSession(rider.id);
  profile = getRiderProfile();
  nameInput.value = "";
  phoneInput.value = "";
  renderRiderBar();
  render();
  showToast(`🚪 เข้าสู่ระบบ ${rider.name} — เห็นเฉพาะงานของคุณ`);
});

$("#rider-register").addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (!name) {
    showToast("⚠️ กรอกชื่อไรเดอร์ก่อน");
    nameInput.focus();
    return;
  }
  const rider = registerRider(name, phoneInput.value.trim());
  profile = getRiderProfile();
  nameInput.value = "";
  phoneInput.value = "";
  renderRiderBar();
  render();
  showToast(`🛵 ลงทะเบียน ${rider.name} เรียบร้อย — กำลังทำงานเป็น ${rider.name}`);
});

$("#rider-logout").addEventListener("click", () => {
  clearRiderSession();
  profile = null;
  renderRiderBar();
  render();
  showToast("🚪 ออกจากระบบแล้ว");
  setTimeout(() => location.href = "rider-login.html", 600);
});

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("#rider-login-btn").click();
});
phoneInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("#rider-login-btn").click();
});

/* ===== แท็บ ===== */
$("#rider-tabs").addEventListener("click", (e) => {
  const tab = e.target.closest(".status-tab");
  if (!tab) return;
  filter = tab.dataset.filter;
  [...document.querySelectorAll("#rider-tabs .status-tab")].forEach((t) => {
    t.classList.toggle("active", t === tab);
    t.setAttribute("aria-selected", t === tab);
  });
  render();
});

/* ===== กรองประวัติตามเดือน (แท็บ ส่งแล้ว) ===== */
$("#done-month").addEventListener("change", (e) => {
  doneMonth = e.target.value;
  render();
});

/* ===== สลิปรายเดือน — สรุปงาน + รายได้ + ภาษีหัก ณ ที่จ่าย (ส่งทางอีเมล) =====
   อัตราหัก ณ ที่จ่าย ตั้งได้ในหน้า admin (ค่าเริ่มต้น 3% — กฎเฉพาะร้าน/ช่วงเวลา)
   → คำนวณต่อใบตามร้าน + เวลาที่ส่งเสร็จของงานนั้น */
let currentSlip = null; // สลิปที่กำลังดูในโมดัล

function slipForPeriod(key) {
  const all = myOrders()
    .filter((o) => o.status === "เสร็จสิ้น")
    .sort((a, b) => (b.deliveredAt || b.createdAt) - (a.deliveredAt || a.createdAt));
  const orders = key === "all" ? all : all.filter((o) => monthKey(o.deliveredAt || o.createdAt) === key);
  // หัก ณ ที่จ่ายต่อใบ = ค่าส่ง × อัตรา (ตามร้าน + เวลาส่งเสร็จของงานนั้น)
  const perOrder = orders.map((o) => {
    const rate = getWhtRate(o.restaurantId, o.deliveredAt || o.createdAt); // เป็น % เช่น 3
    const tax = Math.round((Number(o.delivery) || 0) * rate) / 100; // ค่าส่ง × rate/100 (ปัด 2 ตำแหน่ง)
    return { order: o, rate, tax };
  });
  const gross = perOrder.reduce((s, x) => s + (Number(x.order.delivery) || 0), 0);
  const tax = Math.round(perOrder.reduce((s, x) => s + x.tax, 0) * 100) / 100;
  const net = Math.round((gross - tax) * 100) / 100;
  const rates = [...new Set(perOrder.map((x) => x.rate))];
  // กลุ่มสรุปภาษีรายร้าน (จำนวนงาน / รายได้ / อัตราที่ใช้ / ยอดหักรวมของร้านนั้น)
  const byRestaurant = [];
  {
    const map = new Map();
    for (const x of perOrder) {
      const id = x.order.restaurantId;
      if (!map.has(id)) map.set(id, { restaurantId: id, count: 0, gross: 0, tax: 0, rates: new Set() });
      const g = map.get(id);
      g.count++;
      g.gross += Number(x.order.delivery) || 0;
      g.tax += x.tax;
      g.rates.add(x.rate);
    }
    for (const g of map.values()) {
      const rest = getRestaurant(g.restaurantId);
      const rateList = [...g.rates].sort((a, b) => a - b);
      byRestaurant.push({
        restaurantId: g.restaurantId,
        name: rest ? rest.name : "ร้าน #" + g.restaurantId,
        count: g.count,
        gross: Math.round(g.gross * 100) / 100,
        tax: Math.round(g.tax * 100) / 100,
        rateLabel: rateList.length === 1 ? rateList[0] + "%" : rateList.join("/") + "%",
      });
    }
  }
  return { key, orders, perOrder, byRestaurant, gross, tax, net, rateLabel: rates.length === 1 ? rates[0] + "%" : "อัตราแปรผัน" };
}

function slipTitle(s) {
  return s.key === "all" ? "บันทึกยอดรวมทุกช่วงเวลา" : `สลิปรายเดือน ${monthLabel(s.key)}`;
}

// ข้อความสลิปแบบธรรมดา (ใช้เป็นเนื้อหาอีเมล / คัดลอก)
function slipText(s, email) {
  const p = profile;
  const now = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  const L = [];
  L.push(`🧾 ${slipTitle(s)} — Sangkha Platform`);
  L.push(`ไรเดอร์: ${p.name}`);
  L.push(`เบอร์โทร: ${p.phone && p.phone !== "-" ? p.phone : "-"}`);
  if (email) L.push(`อีเมล: ${email}`);
  L.push(`ออกสลิปเมื่อ: ${now}`);
  L.push("");
  L.push(`📋 สรุปยอด`);
  L.push(`จำนวนงานที่ส่งสำเร็จ: ${s.orders.length} งาน`);
  L.push(`รายได้รวม (ค่าจัดส่ง): ${fmt(s.gross)}`);
  L.push(`ภาษีหัก ณ ที่จ่าย (${s.rateLabel}): ${fmt(s.tax)}`);
  L.push(`ยอดสุทธิรับ: ${fmt(s.net)}`);
  L.push("");
  if (s.byRestaurant.length) {
    L.push(`🏪 สรุปภาษีรายร้าน`);
    s.byRestaurant.forEach((g) => {
      L.push(`${g.name}: ${g.count} งาน · รายได้ ${fmt(g.gross)} · หัก ${fmt(g.tax)} (${g.rateLabel})`);
    });
    L.push("");
  }
  if (s.perOrder.length) {
    L.push(`📦 รายการงาน`);
    s.perOrder.forEach((x) => {
      const o = x.order;
      const d = new Date(o.deliveredAt || o.createdAt);
      L.push(
        `${d.toLocaleDateString("th-TH", { day: "numeric", month: "short" })} ${d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} | #${o.id} | ${getRestaurant(o.restaurantId).name} | ${fmt(o.delivery || 0)} | หัก ${fmt(x.tax)} (${x.rate}%)`
      );
    });
  }
  L.push("");
  L.push("ขอบคุณที่ร่วมส่งมอบความอร่อย 🛵 — Sangkha Platform");
  return L.join("\n");
}

// ตัวอย่างสลิป (HTML) ในโมดัล
function slipHtml(s, email) {
  const p = profile;
  const rows = s.perOrder
    .map((x) => {
      const o = x.order;
      const d = new Date(o.deliveredAt || o.createdAt);
      return `<tr>
        <td>${d.toLocaleDateString("th-TH", { day: "numeric", month: "short" })} ${d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</td>
        <td>#${o.id}</td>
        <td>${escapeHtml(getRestaurant(o.restaurantId).name)}</td>
        <td>${fmt(o.delivery || 0)}</td>
        <td>${fmt(x.tax)} (${x.rate}%)</td>
      </tr>`;
    })
    .join("");
  const last = getLastSlipSent(p.id, s.key);
  return `
    <div class="slip-paper">
      <div class="slip-head">
        <b>🧾 ${slipTitle(s)}</b>
        <span>🛵 Sangkha Platform</span>
      </div>
      <div class="slip-meta">
        <div><span>ไรเดอร์</span><b>${escapeHtml(p.name)}</b></div>
        <div><span>เบอร์โทร</span><b>${p.phone && p.phone !== "-" ? escapeHtml(p.phone) : "-"}</b></div>
        ${email ? `<div><span>อีเมล</span><b>${escapeHtml(email)}</b></div>` : ""}
        <div><span>ออกสลิปเมื่อ</span><b>${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</b></div>
      </div>
      <div class="slip-totals">
        <div><span>จำนวนงาน</span><b>${s.orders.length} งาน</b></div>
        <div><span>รายได้รวม</span><b>${fmt(s.gross)}</b></div>
        <div class="slip-tax"><span>ภาษีหัก ณ ที่จ่าย (${s.rateLabel})</span><b>−${fmt(s.tax)}</b></div>
        <div class="slip-net"><span>ยอดสุทธิรับ</span><b>${fmt(s.net)}</b></div>
      </div>
      <div class="slip-groups">
        <div class="slip-groups-head">🏪 สรุปภาษีรายร้าน</div>
        ${s.byRestaurant
          .map(
            (g) => `
          <div class="slip-group">
            <span class="slip-group-name">${escapeHtml(g.name)}</span>
            <span class="slip-group-meta">${g.count} งาน · รายได้ ${fmt(g.gross)} · อัตรา ${g.rateLabel}</span>
            <b>−${fmt(g.tax)}</b>
          </div>`
          )
          .join("")}
      </div>
      <div class="slip-table-wrap">
        <table class="slip-table">
          <thead><tr><th>วัน-เวลา</th><th>ออเดอร์</th><th>ร้าน</th><th>ค่าส่ง</th><th>หัก ณ ที่จ่าย</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="5" class="slip-empty">ยังไม่มีงานในงวดนี้</td></tr>`}</tbody>
        </table>
      </div>
      ${last ? `<p class="slip-sent">📨 ส่งล่าสุด ${new Date(last.sentAt).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} ไปยัง ${escapeHtml(last.email || "-")}</p>` : ""}
    </div>`;
}

function openSlip() {
  if (!profile) return;
  const key = doneMonth && doneMonth !== "all" ? doneMonth : "all";
  const s = slipForPeriod(key);
  if (!s.orders.length) {
    showToast("⚠️ ยังไม่มีงานที่ส่งเสร็จในงวดนี้");
    return;
  }
  currentSlip = s;
  const email = (profile.email || "").trim();
  $("#slip-title").textContent = `🧾 ${slipTitle(s)}`;
  $("#slip-email").value = email;
  $("#slip-body").innerHTML = slipHtml(s, email);
  $("#slip-overlay").hidden = false;
  $("#slip-modal").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeSlip() {
  $("#slip-overlay").hidden = true;
  $("#slip-modal").hidden = true;
  document.body.style.overflow = "";
  currentSlip = null;
}

$("#done-slip-btn").addEventListener("click", openSlip);
$("#slip-close").addEventListener("click", closeSlip);
$("#slip-overlay").addEventListener("click", closeSlip);

// 📧 ส่งอีเมล — บันทึกอีเมลลงโปรไฟล์ + เปิดโปรแกรมอีเมลพร้อมเนื้อหาสลิป (mailto)
$("#slip-send-btn").addEventListener("click", () => {
  if (!currentSlip) return;
  const email = $("#slip-email").value.trim();
  if (!EMAIL_RE.test(email)) {
    showToast("⚠️ กรอกอีเมลให้ถูกต้อง — เช่น rider@example.com");
    $("#slip-email").focus();
    return;
  }
  updateRiderEmail(profile.id, email); // จำไว้ให้ครั้งถัดไป
  profile = getRiderProfile();
  logSlipSent(profile.id, currentSlip.key, email);
  const subject = encodeURIComponent(`${slipTitle(currentSlip)} — ${profile.name}`);
  const body = encodeURIComponent(slipText(currentSlip, email));
  window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
  $("#slip-body").innerHTML = slipHtml(currentSlip, email); // อัปเดต "ส่งล่าสุด"
  showToast(`📧 เปิดโปรแกรมอีเมลพร้อมสลิปแล้ว — กดส่งจากโปรแกรมอีเมลเพื่อส่งถึง ${email}`);
});

// 📋 คัดลอกข้อความสลิป (ใช้ได้แม้ไม่มีโปรแกรมอีเมล)
$("#slip-copy-btn").addEventListener("click", () => {
  if (!currentSlip) return;
  const email = $("#slip-email").value.trim();
  const text = slipText(currentSlip, email || profile.email || "");
  const done = () => showToast("📋 คัดลอกสลิปแล้ว — วางลงอีเมล/แชทได้เลย");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
});

function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    done();
  } catch (_) {
    showToast("⚠️ คัดลอกไม่สำเร็จ — เลือกข้อความเองได้");
  }
  document.body.removeChild(ta);
}

/* ===== จัดการงาน ===== */
$("#rider-list").addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-action");
  if (!btn) return;
  const card = e.target.closest(".order-card");
  const id = Number(card.dataset.id);
  const order = getOrders().find((o) => o.id === id);
  if (!order) return;
  const action = btn.dataset.action;

  if (action === "take") {
    if (!profile) {
      showToast("⚠️ ลงทะเบียนไรเดอร์ก่อนรับงาน");
      nameInput.focus();
      return;
    }
    const taken = claimDeliveryOrder(id, profile.id);
    if (!taken) {
      // งานถูกไรเดอร์คนอื่นรับไปก่อน (รับพร้อมกัน) → บอกว่าใครรับไปแล้ว
      const now = getOrders().find((o) => o.id === id);
      showToast(now && now.riderName ? `⏱️ งานนี้ ${now.riderName} รับไปก่อนแล้ว` : "⚠️ งานนี้มีไรเดอร์รับไปแล้ว");
      render();
      return;
    }
    showToast(`🛵 รับงาน #${id} แล้ว — ไปรับอาหารที่ ${getRestaurant(taken.restaurantId).name}`);
  } else if (action === "arrived") {
    setRiderStage(id, "ถึงร้านแล้ว", profile && profile.id);
    showToast(`🏪 ถึงร้านแล้ว — รับอาหารออเดอร์ #${id}`);
  } else if (action === "depart") {
    setRiderStage(id, "กำลังไปส่ง", profile && profile.id);
    showToast(`🛵 เริ่มไปส่งออเดอร์ #${id} — ลูกค้าเห็นตำแหน่งบนแผนที่แล้ว`);
  } else if (action === "map") {
    openRiderMap(order, btn.dataset.mapMode);
  } else if (action === "deliver") {
    if (!confirm(`ยืนยันว่าส่งออเดอร์ #${id} ถึงลูกค้าแล้ว?`)) return;
    completeDelivery(id, profile && profile.id);
    showToast(`✅ ส่งออเดอร์ #${id} ถึงลูกค้าแล้ว — ได้ ${fmt(order.delivery)}`);
  } else if (action === "release") {
    if (!confirm(`คืนงาน #${id} กลับไปที่รายการรอรับ?`)) return;
    releaseOrder(id);
    showToast(`↩️ คืนงาน #${id} แล้ว`);
  } else if (action === "delete") {
    if (!confirm(`ลบออเดอร์ #${id} ออกจากประวัติ?`)) return;
    deleteOrder(id);
    showToast(`🗑️ ลบออเดอร์ #${id} แล้ว`);
  }
  render();
});

/* ===== อัปเดตสด ===== */
window.addEventListener("storage", (e) => {
  if (e.key === ORDERS_KEY) render();
});
setInterval(render, 3000);

// กลับมาที่หน้าไรเดอร์ → ล้าง badge
window.addEventListener("focus", () => {
  try {
    if (navigator.clearAppBadge) navigator.clearAppBadge();
  } catch (_) { /* ไม่เป็นไร */ }
  render();
});

/* ===== แผนที่นำทางไรเดอร์ (Leaflet + OpenStreetMap — แผนที่จริง ไม่ต้องใช้คีย์) ===== */

let mapOrder = null;
let mapMode = "pickup"; // pickup = ไปรับของที่ร้าน / drop = ไปส่งลูกค้า

function seedRand(seed) {
  let s = Math.abs(seed) % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// hash สตริง → เลข (ใช้ทำให้ตำแหน่งเริ่มไรเดอร์ต่างกันต่อคน)
function strHash(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) >>> 0;
  return h;
}

// ข้อมูลเส้นทาง: 🏪 ร้าน / 🏠 บ้านลูกค้าจากพิกัดจริง (ถ้ามี) — ไรเดอร์เริ่มคนละจุด (pickup) แล้วขยับตามขั้นที่กด
function riderMapLegData(order, mode) {
  const rest = getRestaurant(order.restaurantId);
  const stage = order.riderStage || "ไปรับอาหาร";
  let start, end, path;
  if (mode === "pickup") {
    // ไรเดอร์เริ่มคนละจุด (สุ่มจาก id ไรเดอร์ — ห่างจากร้านเล็กน้อย) → ไปรับของที่ร้าน
    end = restaurantGps(rest);
    const rnd = seedRand(order.id * 31 + order.restaurantId * 17 + strHash(order.riderId || ""));
    start = { lat: end.lat + (rnd() - 0.5) * 0.03, lng: end.lng + (rnd() - 0.5) * 0.03 };
    path = routeGpsPoints(start, end, 2);
  } else {
    // 🏪 ร้าน → 🏠 บ้านลูกค้า (พิกัด GPS ที่ปักหมุดถ้ามี)
    start = restaurantGps(rest);
    end = orderHomeGps(order);
    path = routeGpsPoints(start, end, 4);
  }
  const totalKm = Math.max(pathKm(path), 0.15);
  // ระยะเวลาขานี้ = ระยะทาง (กม.) ÷ ความเร็ว (กม./นาที) — เส้นทางยาวใช้เวลามาก ไรเดอร์ขยับความเร็วคงที่
  const legMs = (totalKm / (RIDER_SPEED_KMH / 60)) * 60000;
  let elapsed;
  if (mode === "pickup") {
    elapsed = stage === "ไปรับอาหาร" ? (Date.now() - (order.pickedUpAt || order.createdAt)) / legMs : 1;
  } else {
    elapsed = stage === "กำลังไปส่ง" ? (Date.now() - (order.departedAt || order.pickedUpAt || order.createdAt)) / legMs : 0;
  }
  elapsed = Math.min(1, Math.max(0, elapsed));
  return { start, end, path, elapsed, legMs, totalKm, rest, stage, mode };
}

// ระยะทางเป็นกิโลเมตรแบบอ่านง่าย: 2.58 → "~2.6 กม." / 3 → "~3 กม."
function kmFmt(km) {
  const v = Math.round(km * 10) / 10;
  return "~" + (v % 1 === 0 ? String(v) : v.toFixed(1)) + " กม.";
}

// ETA ที่เหลือของขานั้น (นาที) — คำนวณจากระยะทางจริง (กม.) ÷ ความเร็ว: 0 = ขานั้นเสร็จแล้ว
function riderLegEta(order, mode) {
  const d = riderMapLegData(order, mode);
  return Math.max(0, Math.round((d.legMs * (1 - d.elapsed)) / 60000));
}

// ป้าย ETA แยกสองขาบนการ์ด: ไปรับ ~X นาที (~Y กม.) · ไปส่ง ~Z นาที (~W กม.) · รวม ~V นาที
// ใช้ระยะทางถนนจริง (OSRM) ถ้าโหลดเสร็จแล้ว ไม่ก็เส้นตรง
function riderEtaLabel(o) {
  const dPick = riderMapLegData(o, "pickup");
  const dDrop = riderMapLegData(o, "drop");
  const roadPick = getCachedRoadRoute(dPick.start, dPick.end);
  const roadDrop = getCachedRoadRoute(dDrop.start, dDrop.end);
  const kmPick = roadPick && roadPick.pts ? Math.max(roadPick.km, 0.15) : dPick.totalKm;
  const kmDrop = roadDrop && roadDrop.pts ? Math.max(roadDrop.km, 0.15) : dDrop.totalKm;
  const legPick = (kmPick / (RIDER_SPEED_KMH / 60)) * 60000;
  const legDrop = (kmDrop / (RIDER_SPEED_KMH / 60)) * 60000;
  const pick = Math.max(0, Math.round((legPick * (1 - dPick.elapsed)) / 60000));
  const drop = Math.max(0, Math.round((legDrop * (1 - dDrop.elapsed)) / 60000));
  const pickTxt = pick <= 0 ? `ไปรับ เสร็จ (${kmFmt(kmPick)})` : `ไปรับ ~${pick} นาที (${kmFmt(kmPick)})`;
  return `${pickTxt} · ไปส่ง ~${drop} นาที (${kmFmt(kmDrop)}) · รวม ~${Math.max(1, pick + drop)} นาที`;
}
// marker อีโมจิบนแผนที่จริง (coord = พิกัด GPS ย่อยใต้ป้าย)
function riderEmojiIcon(emoji, label, coord) {
  return L.divIcon({
    className: "map-emoji-icon",
    html: `<div class="map-pin">${emoji}${label ? `<span class="map-pin-label">${escapeHtml(label)}</span>` : ""}${coord ? `<span class="map-pin-coord">${escapeHtml(coord)}</span>` : ""}</div>`,
    iconSize: [34, 64],
    iconAnchor: [17, 58],
    popupAnchor: [0, -56],
  });
}

let riderLeaflet = null;
let riderRouteLayer = null, riderStartMarker = null, riderEndMarker = null, riderRiderMarker = null;

function renderRiderMap() {
  if (!mapOrder || $("#rider-map-modal").hidden) return;
  if (!window.L) return; // Leaflet โหลดไม่ทัน/ไม่มีอินเทอร์เน็ต
  const data = riderMapLegData(mapOrder, mapMode);
  const el = $("#rider-map-leaflet");
  if (!el) return;
  if (!riderLeaflet) {
    riderLeaflet = L.map(el, { zoomControl: false }).setView([data.start.lat, data.start.lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(riderLeaflet);
  }
  // เส้นทางถนนจริง (OSRM) ถ้าโหลดเสร็จแล้ว — ไม่ก็เส้นตรง แล้วโหลดต่อเพื่อวาดใหม่
  const eff = effectiveRoute(data.start, data.end, data.path, data.totalKm);
  const path = eff.path, totalKm = eff.km, legMs = eff.legMs;
  if (!eff.road) {
    loadRoadRoute(data.start, data.end).then((val) => {
      if (val && val.pts && !$("#rider-map-modal").hidden) renderRiderMap();
    });
  }
  // ตำแหน่งไรเดอร์ตามขั้นที่กด (ใช้เวลาจริงของเส้นทางที่ใช้)
  const stage = data.stage;
  let elapsed = data.elapsed;
  if (data.mode === "pickup") {
    elapsed = stage === "ไปรับอาหาร" ? (Date.now() - (mapOrder.pickedUpAt || mapOrder.createdAt)) / legMs : 1;
  } else {
    elapsed = stage === "กำลังไปส่ง" ? (Date.now() - (mapOrder.departedAt || mapOrder.pickedUpAt || mapOrder.createdAt)) / legMs : 0;
  }
  elapsed = Math.min(1, Math.max(0, elapsed));
  // เคลียร์เลเยอร์เดิม
  if (riderRouteLayer) riderLeaflet.removeLayer(riderRouteLayer);
  if (riderStartMarker) riderLeaflet.removeLayer(riderStartMarker);
  if (riderEndMarker) riderLeaflet.removeLayer(riderEndMarker);
  if (riderRiderMarker) riderLeaflet.removeLayer(riderRiderMarker);
  riderRouteLayer = riderStartMarker = riderEndMarker = riderRiderMarker = null;
  // เส้นทาง (เส้นประส้ม)
  riderRouteLayer = L.polyline(path.map((p) => [p.lat, p.lng]), { color: "#ff5c1a", weight: 4, dashArray: "8 6" }).addTo(riderLeaflet);
  // จุดเริ่ม + ปลายทาง
  if (data.mode === "pickup") {
    riderStartMarker = L.marker([data.start.lat, data.start.lng], { icon: riderEmojiIcon("📍", "คุณ (ไรเดอร์)") }).addTo(riderLeaflet);
    riderEndMarker = L.marker([data.end.lat, data.end.lng], { icon: riderEmojiIcon("🏪", (data.rest.name || "ร้าน").slice(0, 14)) }).addTo(riderLeaflet);
  } else {
    riderStartMarker = L.marker([data.start.lat, data.start.lng], { icon: riderEmojiIcon("🏪", (data.rest.name || "ร้าน").slice(0, 14)) }).addTo(riderLeaflet);
    const custName = ((mapOrder.customer && mapOrder.customer.name) || "").slice(0, 10);
    // แสดงพิกัด GPS ที่ปักหมุดใต้ป้ายบ้านลูกค้า (ถ้ามี)
    riderEndMarker = L.marker([data.end.lat, data.end.lng], {
      icon: riderEmojiIcon("🏠", custName ? `ลูกค้า: ${custName}` : "บ้านลูกค้า", mapOrder.gps ? `${mapOrder.gps.lat}, ${mapOrder.gps.lng}` : ""),
    }).addTo(riderLeaflet);
  }
  // ไรเดอร์ (ขยับตามขั้น)
  const pos = pointAtGps(path, elapsed);
  riderRiderMarker = L.marker([pos.lat, pos.lng], { icon: riderEmojiIcon("🛵") }).addTo(riderLeaflet);
  // ซูมให้เห็นทั้งเส้นทาง
  riderLeaflet.fitBounds(L.latLngBounds(path.map((p) => [p.lat, p.lng])), { padding: [26, 26], maxZoom: 16 });
  riderLeaflet.invalidateSize();
  // ETA (ระยะทางถนนจริง กม. ÷ ความเร็ว 45 กม./ชม.)
  const etaEl = $("#rider-map-eta");
  const remainMin = Math.max(1, Math.round((legMs * (1 - elapsed)) / 60000));
  if (data.mode === "pickup") {
    etaEl.textContent = elapsed >= 1 ? `🏪 ถึงร้านแล้ว — กด "ถึงร้านแล้ว" เพื่อรับอาหาร (เส้นทาง ${kmFmt(totalKm)})` : `🛵 ถึงร้านในอีกประมาณ ${remainMin} นาที · เส้นทาง ${kmFmt(totalKm)}`;
  } else {
    etaEl.textContent = elapsed >= 1 ? `🏠 ถึงลูกค้าแล้ว — กด "✅ ส่งถึงแล้ว" (เส้นทาง ${kmFmt(totalKm)})` : `🛵 ถึงลูกค้าในอีกประมาณ ${remainMin} นาที · เส้นทาง ${kmFmt(totalKm)}`;
  }
}
setInterval(renderRiderMap, 2000); // อัปเดตตำแหน่งไรเดอร์ทุก 2 วิ

function setMapTabs() {
  $("#map-tab-pickup").classList.toggle("active", mapMode === "pickup");
  $("#map-tab-drop").classList.toggle("active", mapMode === "drop");
  $("#map-tab-pickup").setAttribute("aria-selected", String(mapMode === "pickup"));
  $("#map-tab-drop").setAttribute("aria-selected", String(mapMode === "drop"));
}

function openRiderMap(order, mode) {
  mapOrder = order;
  mapMode = mode || (order.riderStage === "กำลังไปส่ง" ? "drop" : "pickup");
  setMapTabs();
  $("#rider-map-title").textContent = `🗺️ แผนที่นำทาง — ออเดอร์ #${order.id}`;
  $("#rider-map-overlay").hidden = false;
  $("#rider-map-modal").hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => { if (riderLeaflet) riderLeaflet.invalidateSize(); renderRiderMap(); }, 60);
}

function closeRiderMap() {
  $("#rider-map-overlay").hidden = true;
  $("#rider-map-modal").hidden = true;
  document.body.style.overflow = "";
  mapOrder = null;
}

$("#rider-map-close").addEventListener("click", closeRiderMap);
$("#rider-map-overlay").addEventListener("click", closeRiderMap);
$("#map-tab-pickup").addEventListener("click", () => { mapMode = "pickup"; setMapTabs(); renderRiderMap(); });
$("#map-tab-drop").addEventListener("click", () => { mapMode = "drop"; setMapTabs(); renderRiderMap(); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#rider-map-modal").hidden) closeRiderMap();
  if (e.key === "Escape" && !$("#slip-modal").hidden) closeSlip();
});

/* ===== เริ่มต้น ===== */
renderRiderBar();
render();

// 🔥 Firebase: เชื่อม Firestore (ถ้าตั้งค่า config แล้ว) — seed ข้อมูล + ฟังไรเดอร์ใหม่จากเครื่องอื่น
initFirebaseCollections();
document.addEventListener("sangkha:firebase-riders", () => renderRiderBar());
