/* ===== Dashboard รับออเดอร์ของร้านค้า =====
   - แสดงออเดอร์ของร้านที่เลือก (จาก menu-data.js)
   - จัดการสถานะ: ใหม่ → กำลังเตรียม → กำลังจัดส่ง → เสร็จสิ้น (+ ยกเลิก / ลบ)
   - อัปเดตสด: ฟังเหตุการณ์ storage (ข้ามแท็บ) + เช็คซ้ำทุก 3 วิ
   - แจ้งเตือนออเดอร์ใหม่: เสียง + toast + Notification + จุดกะพริบที่สถิติ */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const fromUrl = Number(new URLSearchParams(location.search).get("restaurant"));
let restaurantId = fromUrl || Number(localStorage.getItem("sangkha-active-restaurant")) || 1;

// แยกร้าน: ถ้าร้านค้าล็อกอินอยู่ (จากหน้า admin) → บังคับเป็นร้านตัวเอง ซ่อน dropdown ร้านอื่น
const dashStoreProfile = getStoreProfile();
if (dashStoreProfile) {
  restaurantId = Number(dashStoreProfile.id);
  try { localStorage.setItem("sangkha-active-restaurant", String(restaurantId)); } catch (_) { /* ไม่เป็นไร */ }
}

// 🔒 กันลูกค้าเปิดดู dashboard (เห็นข้อมูลออเดอร์ลูกค้าทั้งหมด) — ต้องล็อกอินร้านค้า/แอดมินก่อน ไม่งั้นเด้งไปหน้าเข้าสู่ระบบ
const dashAuthorized = !!dashStoreProfile || isAdminLoggedIn();
if (!dashAuthorized) location.replace("login.html");

let filter = "ทั้งหมด";
let lastSeenIds = new Set(); // ออเดอร์ที่เห็นแล้ว (กันแจ้งเตือนซ้ำ)
let lastRestaurantId = null;

/* ===== แจ้งเตือน ===== */
const toastEl = $("#toast");
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 2600);
}

// เสียง "ติ๊ง" เมื่อมีออเดอร์ใหม่ (Web Audio — ไม่ต้องใช้ไฟล์เสียง)
let audioCtx = null;
function chime() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    [880, 1174.66].forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const t = now + i * 0.15;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch (_) { /* ไม่เป็นไร */ }
}

// ขอสิทธิ์แจ้งเตือนระบบ (ครั้งแรกที่เปิดหน้า)
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission().catch(() => {});
}
function notifyOrder(order) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const rest = getRestaurant(order.restaurantId);
    new Notification(`🔔 ออเดอร์ใหม่ #${order.id} — ${rest.name}`, {
      body: `${order.customer.name} · ${order.items.reduce((a, i) => a + i.qty, 0)} รายการ · ${fmt(order.total)}`,
    });
  } catch (_) { /* ไม่เป็นไร */ }
}

/* ===== ตัวช่วย ===== */
function fmt(n) { const v = Number(n); return "฿" + (Number.isFinite(v) ? v.toLocaleString("th-TH") : "0"); }

function isToday(ts) {
  const d = new Date(ts);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function timeAgo(ts) {
  ts = Number(ts) || Date.now(); // กันออเดอร์จาก Firestore ที่ createdAt หาย
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "เมื่อสักครู่";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  return new Date(ts).toLocaleDateString("th-TH");
}

function clock(ts) {
  ts = Number(ts) || Date.now();
  return new Date(ts).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

const ACTION_BY_STATUS = {
  "ใหม่": '<button class="btn-action btn-accept" data-action="accept">✅ รับออเดอร์</button><button class="btn-action btn-cancel-order" data-action="cancel">ยกเลิก</button>',
  "กำลังเตรียม": '<button class="btn-action btn-ship" data-action="ready">🛵 พร้อมส่งแล้ว</button><button class="btn-action btn-cancel-order" data-action="cancel">ยกเลิก</button>',
  "พร้อมส่ง": '<button class="btn-action btn-ship" data-action="ship">🛵 เริ่มจัดส่งเอง</button><button class="btn-action btn-cancel-order" data-action="cancel">ยกเลิก</button>',
  "กำลังจัดส่ง": '<button class="btn-action btn-done" data-action="done">🎉 เสร็จสิ้น</button>',
  "เสร็จสิ้น": '<button class="btn-action btn-delete-order" data-action="delete">🗑️ ลบออก</button>',
  "ยกเลิก": '<button class="btn-action btn-delete-order" data-action="delete">🗑️ ลบออก</button>',
};

function orderCard(o) {
  o = o || {};
  const c = o.customer || {}; // กันออเดอร์จาก Firestore ข้อมูลไม่ครบ
  const items = Array.isArray(o.items) ? o.items : [];
  return `
    <article class="order-card ${o.status === "ใหม่" ? "order-new" : ""}" data-id="${o.id}">
      <div class="order-head">
        <div>
          <span class="order-id">ออเดอร์ #${o.id}</span>
          <span class="order-time">${clock(o.createdAt)} · ${timeAgo(o.createdAt)}</span>
        </div>
        <span class="status-pill status-${o.status}">${o.status}</span>
      </div>
      ${o.riderName && o.status === "กำลังจัดส่ง" ? `<div class="order-rider-line">🛵 ไรเดอร์ <b>${escapeHtml(o.riderName)}</b> กำลังนำส่งให้ลูกค้า</div>` : ""}
      ${o.status === "พร้อมส่ง" ? `<div class="order-rider-line">🤝 อาหารพร้อมแล้ว — ยังไม่มีไรเดอร์ว่าง ระบบจัดไรเดอร์ให้อัตโนมัติเมื่อมีคนว่าง (หรือไรเดอร์กดรับเองจาก Rider Dashboard)</div>` : ""}
      <div class="order-customer">
        👤 <b>${escapeHtml(c.name || "—")}</b> · 📞 ${escapeHtml(c.phone || "—")}
        <div class="order-address">📍 ${escapeHtml(c.address || "—")}</div>
        ${o.gps ? `<div class="order-note">📌 พิกัด GPS: ${o.gps.lat}, ${o.gps.lng}</div>` : ""}
        ${c.note ? `<div class="order-note">📝 ${escapeHtml(c.note)}</div>` : ""}
      </div>
      <div class="order-items">
        ${items.map((it) => `
          <div class="order-item">
            <span class="order-item-name">${it.img ? "" : it.emoji} ${escapeHtml(it.name)} <span class="order-item-qty">× ${it.qty}</span></span>
            <span>${fmt(Number(it.price || 0) * Number(it.qty || 0))}</span>
          </div>`).join("")}
      </div>
      <div class="order-totals">
        <div><span>รวมอาหาร</span><span>${fmt(o.subtotal)}</span></div>
        <div><span>ค่าจัดส่ง</span><span>${o.delivery === 0 ? "ฟรี" : fmt(o.delivery)}</span></div>
        ${o.platformFee > 0 ? `<div><span>💸 ค่าแพลตฟอร์ม</span><span>${fmt(o.platformFee)}</span></div>` : ""}
        ${o.discount > 0 ? `<div class="order-discount-row"><span>🎟️ ส่วนลดคูปอง${o.couponCode ? ` (${o.couponCode})` : ""}</span><span>−${fmt(o.discount)}</span></div>` : ""}
        <div class="order-total"><span>ยอดรวม</span><b>${fmt(o.total)}</b></div>
      </div>
      <div class="order-actions">${ACTION_BY_STATUS[o.status] || ""}</div>
    </article>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ===== เรนเดอร์ ===== */
function render() {
  const orders = getOrdersFor(restaurantId);
  const currentIds = new Set(orders.map((o) => o.id));

  // ออเดอร์ใหม่ (เฉพาะตอนที่หน้าโหลดมาแล้ว ไม่ใช่ตอนเปิดครั้งแรก / สลับร้าน)
  const fresh = lastRestaurantId === restaurantId && lastSeenIds.size > 0
    ? orders.filter((o) => !lastSeenIds.has(o.id) && o.status === "ใหม่")
    : [];
  const freshIds = new Set(fresh.map((o) => o.id));
  if (fresh.length) {
    fresh.forEach((o) => {
      showToast(`🔔 ออเดอร์ใหม่ #${o.id} จาก ${o.customer.name} — ${fmt(o.total)}`);
      notifyOrder(o);
    });
    chime();
  }
  lastSeenIds = currentIds;
  lastRestaurantId = restaurantId;

  // สถิติ
  const active = orders.filter((o) => ["ใหม่", "กำลังเตรียม", "พร้อมส่ง", "กำลังจัดส่ง"].includes(o.status));
  const today = orders.filter((o) => isToday(o.createdAt) && o.status !== "ยกเลิก");
  const revenue = today.reduce((s, o) => s + o.total, 0);
  const newCount = orders.filter((o) => o.status === "ใหม่").length;

  const statNew = $("#stat-new");
  statNew.textContent = newCount;
  statNew.parentElement.classList.toggle("has-new", newCount > 0);
  $("#stat-today").textContent = today.length;
  $("#stat-revenue").textContent = fmt(revenue);
  $("#stat-active").textContent = active.length;

  // ชื่อแท็บเบราว์เซอร์แสดงจำนวนออเดอร์ใหม่
  document.title = newCount > 0 ? `(${newCount} ใหม่) 📋 ${getRestaurant(restaurantId).name}` : `📋 ${getRestaurant(restaurantId).name}`;

  renderCloseBar();

  // รายการ
  const filtered = filter === "ทั้งหมด" ? orders : orders.filter((o) => o.status === filter);
  const listEl = $("#order-list");
  listEl.innerHTML = filtered.map(orderCard).join("");
  $("#order-empty").hidden = filtered.length > 0;
  // เด้งเฉพาะการ์ดออเดอร์ใหม่จริง ๆ ที่เพิ่งมา (ไม่เด้งซ้ำทุกครั้งที่เรนเดอร์)
  if (freshIds.size) {
    setTimeout(() => {
      freshIds.forEach((id) => {
        const card = listEl.querySelector(`.order-card[data-id="${id}"]`);
        if (card) card.classList.add("order-bounce");
      });
    }, 60);
  }
}

/* ===== ปิดรับออเดอร์ชั่วคราว (ร้านตั้งเอง — ไม่กระทบเวลาเปิด-ปิด) ===== */
function renderCloseBar() {
  const r = getRestaurant(restaurantId);
  const rec = getStoreClosed(r.id);
  const label = $("#dash-close-label");
  const btn = $("#dash-close-toggle");
  const reasonEl = $("#dash-close-reason");
  if (reasonEl) { reasonEl.hidden = true; reasonEl.value = ""; }
  // ตัวควบคุมปิดอัตโนมัติ
  const auto = getAutoCloseSetting(r.id);
  const autoActive = isAutoClosed(r.id);
  const pend = getPendingOrderCount(r.id);
  const autoChk = $("#dash-close-auto");
  const autoN = $("#dash-close-auto-n");
  if (autoChk) autoChk.checked = !!auto;
  if (autoN) autoN.value = auto ? auto.threshold : 5;

  if (rec) {
    const since = new Date(rec.closedAt).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    label.textContent = `🔴 ${r.name} ปิดชั่วคราวตั้งแต่ ${since}${rec.reason ? ` — เหตุผล: "${rec.reason}"` : ""} — หน้าร้านลูกค้าบล็อกการสั่งซื้อทันที`;
    label.className = "dash-close-label closed";
    btn.textContent = "🟢 เปิดรับออเดอร์";
  } else if (autoActive) {
    label.textContent = `🔴 ${r.name} ปิดอัตโนมัติ — ออเดอร์ค้าง ${pend} ใบ (ตั้งเกณฑ์ ≥ ${auto.threshold} ใบ) — เปิดรับเองเมื่อเคลียร์ต่ำกว่า ${auto.threshold} ใบ`;
    label.className = "dash-close-label closed";
    btn.textContent = "🔴 ปิดชั่วคราว";
  } else {
    const st = storeAcceptingOrders(r);
    label.textContent =
      st === false
        ? `🕐 ${r.name} อยู่นอกเวลาเปิด-ปิด (${r.open} – ${r.close}) — ลูกค้ายังสั่งไม่ได้อัตโนมัติ (กดปิดชั่วคราวเพื่อหยุดรับเพิ่มก็ได้)`
        : `🟢 ${r.name} เปิดรับออเดอร์ตามปกติ (เวลา ${r.open} – ${r.close})`;
    label.className = "dash-close-label" + (st === false ? " hours" : " open");
    btn.textContent = "🔴 ปิดชั่วคราว";
  }
}

// ปิดชั่วคราว 2 ขั้น: แตะครั้งแรก → เปิดช่องเหตุผล (ไม่บังคับ) → แตะ "ยืนยัน" อีกครั้ง = ปิดจริง
const dashReasonInput = $("#dash-close-reason");
$("#dash-close-toggle").addEventListener("click", () => {
  const rec = getStoreClosed(restaurantId);
  const r = getRestaurant(restaurantId);
  if (rec) {
    dashReasonInput.hidden = true;
    dashReasonInput.value = "";
    setStoreClosed(restaurantId, false);
    renderCloseBar();
    showToast(`🟢 ${r.name} เปิดรับออเดอร์แล้ว`);
  } else if (!dashReasonInput.hidden) {
    const reason = dashReasonInput.value.trim();
    dashReasonInput.hidden = true;
    dashReasonInput.value = "";
    setStoreClosed(restaurantId, true, reason);
    renderCloseBar();
    showToast(`🔴 ${r.name} ปิดรับออเดอร์ชั่วคราวแล้ว — หน้าร้านลูกค้าบล็อกการสั่งซื้อทันที`);
  } else {
    dashReasonInput.hidden = false;
    dashReasonInput.focus();
    $("#dash-close-toggle").textContent = "✅ ยืนยันปิดชั่วคราว";
  }
});
dashReasonInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("#dash-close-toggle").click();
});

// ตั้งค่า/ปิดการปิดอัตโนมัติตามออเดอร์ค้าง
$("#dash-close-auto").addEventListener("change", () => {
  const on = $("#dash-close-auto").checked;
  setAutoCloseSetting(restaurantId, on, $("#dash-close-auto-n").value);
  renderCloseBar();
  const s = getAutoCloseSetting(restaurantId);
  showToast(on ? `🤖 เปิดปิดอัตโนมัติแล้ว — ร้านจะปิดเองเมื่อออเดอร์ค้างถึง ${s ? s.threshold : 5} ใบ` : "🤖 ปิดการทำงานอัตโนมัติแล้ว — กลับไปปิด/เปิดด้วยมือ");
});
$("#dash-close-auto-n").addEventListener("change", () => {
  const auto = getAutoCloseSetting(restaurantId);
  if (auto) {
    setAutoCloseSetting(restaurantId, true, $("#dash-close-auto-n").value);
    renderCloseBar();
    const s = getAutoCloseSetting(restaurantId);
    showToast(`🤖 ตั้งเกณฑ์ปิดอัตโนมัติเป็น ${s.threshold} ใบแล้ว`);
  } else {
    $("#dash-close-auto-n").value = 5;
  }
});

/* ===== เลือกร้าน ===== */
function buildRestaurantSelect() {
  const sel = $("#restaurant-select");
  // ร้านที่ล็อกอินอยู่ → ซ่อน dropdown (เห็นเฉพาะร้านตัวเอง)
  if (dashStoreProfile) {
    const bar = document.querySelector(".dash-restaurant-bar");
    if (bar) bar.hidden = true;
  }
  sel.innerHTML = getRestaurants()
    .map((r) => `<option value="${r.id}">${r.name} · ${r.cuisine}</option>`)
    .join("");
  sel.value = restaurantId;
  $("#dash-subtitle").textContent = `${getRestaurant(restaurantId).name} · ออเดอร์จากลูกค้า จะแจ้งเตือนทันทีเมื่อมีคำสั่งซื้อใหม่`;

  sel.addEventListener("change", () => {
    restaurantId = Number(sel.value);
    try { localStorage.setItem("sangkha-active-restaurant", String(restaurantId)); } catch (_) { /* ไม่เป็นไร */ }
    render(); // สลับร้าน → กันออเดอร์เก่าแจ้งเตือน (lastRestaurantId เปลี่ยน)
    renderReviews();
    showToast(`สลับไปร้าน \"${getRestaurant(restaurantId).name}\"`);
  });
}

/* ===== กรองสถานะ ===== */
$("#status-tabs").addEventListener("click", (e) => {
  const tab = e.target.closest(".status-tab");
  if (!tab) return;
  filter = tab.dataset.status;
  $$(".status-tab").forEach((t) => {
    t.classList.toggle("active", t === tab);
    t.setAttribute("aria-selected", t === tab);
  });
  render();
});

/* ===== จัดการสถานะออเดอร์ ===== */
const ORDER_ACTION_NEXT = {
  accept: "กำลังเตรียม",
  ready: "พร้อมส่ง",
  ship: "กำลังจัดส่ง",
  done: "เสร็จสิ้น",
};

$("#order-list").addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-action");
  if (!btn) return;
  const card = e.target.closest(".order-card");
  const id = Number(card.dataset.id);
  const order = getOrders().find((o) => o.id === id);
  if (!order) return;

  const action = btn.dataset.action;
  if (action === "cancel") {
    if (!confirm(`ยกเลิกออเดอร์ #${id} ของ ${order.customer.name}?`)) return;
    updateOrderStatus(id, "ยกเลิก", restaurantId);
    showToast(`✖️ ยกเลิกออเดอร์ #${id} แล้ว`);
  } else if (action === "delete") {
    deleteOrder(id);
    showToast(`🗑️ ลบออเดอร์ #${id} แล้ว`);
  } else {
    const next = ORDER_ACTION_NEXT[action];
    updateOrderStatus(id, next, restaurantId);
    let msg = { accept: "✅ รับออเดอร์", ship: "🛵 เริ่มจัดส่งแล้ว", done: "🎉 ออเดอร์เสร็จสิ้น" }[action] || "";
    if (action === "ready") {
      // พร้อมส่งแล้ว → ระบบจัดไรเดอร์ว่าง/ใกล้สุดให้อัตโนมัติ (ถ้าไม่มีว่าง คงเป็น พร้อมส่ง ใน pool)
      const auto = assignNearestRider(id);
      msg = auto
        ? `🛵 พร้อมส่งแล้ว — ระบบจัดให้ไรเดอร์ ${auto.rider.name} (ว่างสุด)`
        : "🛵 พร้อมส่งแล้ว — ยังไม่มีไรเดอร์ว่าง ลงรายการรอรับ";
    }
    showToast(`${msg} #${id}`);
  }
  render();
});

/* ===== รีวิวจากลูกค้า (ดู + ตอบกลับ) ===== */
const dashReviewListEl = $("#dash-review-list");

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function reviewCard(r) {
  const order = getOrders().find((o) => o.id === r.orderId);
  const customer = order?.customer?.name || "ลูกค้า";
  const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
  const date = new Date(r.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  return `
    <article class="rev-card" data-order="${r.orderId}">
      <div class="rev-head">
        <span class="rev-stars" aria-label="${r.rating} จาก 5 ดาว">${stars}</span>
        <span class="rev-meta">ออเดอร์ #${r.orderId} · ${escapeHtml(customer)} · ${date}</span>
      </div>
      <p class="rev-text">${escapeHtml(r.review || "—")}</p>
      ${r.reply
        ? `
        <div class="rev-reply-box">
          <b>💬 คำตอบของร้าน</b>
          <p>${escapeHtml(r.reply)}</p>
          <div class="rev-reply-actions">
            <button class="rev-reply-mini-btn" data-action="edit" data-order="${r.orderId}" type="button">✏️ แก้ไข</button>
            <button class="rev-reply-mini-btn danger" data-action="delete" data-order="${r.orderId}" type="button">🗑️ ลบคำตอบ</button>
          </div>
        </div>`
        : `<button class="rev-reply-btn" data-action="reply" data-order="${r.orderId}" type="button">💬 ตอบกลับรีวิวนี้</button>`}
      <div class="rev-reply-form" data-order="${r.orderId}" hidden>
        <textarea class="rev-reply-input" rows="2" maxlength="300" placeholder="ขอบคุณลูกค้าที่อุดหนุน และเราจะนำไปปรับปรุงเสมอ...">${r.reply ? escapeHtml(r.reply) : ""}</textarea>
        <div class="rev-reply-form-actions">
          <button class="rev-reply-cancel" data-action="cancel" type="button">ยกเลิก</button>
          <button class="rev-reply-save" data-action="save" type="button">ส่งคำตอบ</button>
        </div>
      </div>
    </article>`;
}

// รีวิวที่เพิ่งแจ้งเตือนในหน้านี้ไปแล้ว (กันซ้ำตอนเรนเดอร์ซ้ำ)
let reviewToastSeen = new Set();

function renderReviews() {
  const reviews = getReviews()
    .filter((r) => r.restaurantId === restaurantId)
    .sort((a, b) => b.createdAt - a.createdAt);

  // แจ้งเตือนรีวิวใหม่ที่เพิ่งส่ง (ภายใน 1 นาที — กันเตือนผิดตอนสลับร้าน/โหลดครั้งแรก)
  const fresh = reviews.filter(
    (r) => !reviewToastSeen.has(r.orderId) && Date.now() - r.createdAt < 60 * 1000
  );
  fresh.forEach((r) => {
    reviewToastSeen.add(r.orderId);
    showToast(`⭐ รีวิวใหม่ ${r.rating} ดาว${r.review ? `: "${r.review.slice(0, 40)}"` : ""}`);
  });

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  $("#dash-rev-summary").textContent = reviews.length ? `⭐ เฉลี่ย ${avg.toFixed(1)} · ${reviews.length} รีวิว` : "";
  dashReviewListEl.innerHTML = reviews.map(reviewCard).join("");
  $("#dash-review-empty").hidden = reviews.length > 0;
}

// หมายเหตุ: renderReviews ไม่ถูกเรียกใน setInterval (กันฟอร์มตอบกลับที่พิมพ์อยู่หาย)
dashReviewListEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const card = e.target.closest(".rev-card");
  if (!card) return;
  const orderId = Number(card.dataset.order);
  const action = btn.dataset.action;
  const form = card.querySelector(".rev-reply-form");

  if (action === "reply") {
    btn.remove();
    form.hidden = false;
    form.querySelector(".rev-reply-input").focus();
  } else if (action === "edit") {
    btn.closest(".rev-reply-actions")?.remove();
    form.hidden = false;
    form.querySelector(".rev-reply-input").focus();
  } else if (action === "cancel") {
    renderReviews();
  } else if (action === "save") {
    const text = form.querySelector(".rev-reply-input").value.trim();
    if (!text) { showToast("⚠️ กรอกคำตอบก่อนส่ง"); return; }
    addReviewReply(orderId, restaurantId, text);
    renderReviews();
    showToast("💬 ส่งคำตอบแล้ว");
  } else if (action === "delete") {
    if (!confirm("ลบคำตอบของร้านออก?")) return;
    addReviewReply(orderId, restaurantId, "");
    renderReviews();
    showToast("🗑️ ลบคำตอบแล้ว");
  }
});

/* ===== อัปเดตสด ===== */
// แท็บอื่นเขียน localStorage → เหตุการณ์ storage เกิดที่แท็บนี้
window.addEventListener("storage", (e) => {
  if (e.key === ORDERS_KEY || e.key === STORE_CLOSED_KEY) render();
  if (e.key === REVIEWS_KEY) renderReviews();
});
// สำรอง: เช็คซ้ำทุก 3 วิ (เผื่อเหตุการณ์ storage ไม่เกิด เช่น หน้าเปิดแท็บเดียวกัน)
if (dashAuthorized) setInterval(render, 3000);

/* ===== เริ่มต้น ===== */
if (dashAuthorized) {
  buildRestaurantSelect();
  render();
  renderReviews();

  /* 🔥 Firebase ตัวอย่าง: ฟังออเดอร์สดจาก Firestore (ข้ามเครื่อง/ข้ามเบราว์เซอร์) ด้วย onSnapshot
     — ถ้าไม่ได้ตั้งค่าใน firebase-config.js = โหมดท้องถิ่น (localStorage) เหมือนเดิม */
  const fbBadge = $("#firebase-badge");
  if (fbBadge && window.FirebaseOrders && window.FirebaseOrders.isConfigured) {
    fbBadge.hidden = false;
    fbBadge.textContent = "⏳ กำลังเชื่อม Firebase...";
  }
  window.FirebaseOrders.init().then((ok) => {
    if (!ok) {
      if (fbBadge) fbBadge.hidden = true;
      return;
    }
    if (fbBadge) { fbBadge.hidden = false; fbBadge.textContent = "⏳ กำลังเชื่อม Firebase..."; }
    let synced = false;
    // ทุกครั้งที่ออเดอร์ใน Firestore เปลี่ยน (เครื่องไหนสั่ง/อัปเดตก็ได้) → เขียนแคช + วาดใหม่ทันที
    window.FirebaseOrders.subscribeOrders(
      (remote) => {
        if (!synced && fbBadge) { synced = true; fbBadge.textContent = "🔥 Firebase ซิงก์"; }
        mergeRemoteOrders(remote);
        if (window.OrderAlertController && Array.isArray(remote)) {
          remote.forEach((order) => window.OrderAlertController.detectNewOrder(order));
        }
        render();
        renderCloseBar();
      },
      (err) => { if (fbBadge) { fbBadge.hidden = false; fbBadge.textContent = "⚠️ Firebase error"; } }
    );
    // 🔥 ซิงก์ครบทุกคอลเลกชัน (seed + ฟังร้าน/ไรเดอร์) — ร้านที่สมัครจากเครื่องอื่นจะโผล่ใน dropdown
    initFirebaseCollections();
    document.addEventListener("sangkha:firebase-restaurants", () => buildRestaurantSelect());
  });
}

/* ===== หมวดโฆษณาร้าน — ร้านเลือกเอง (สไลด์หน้าแรกโชว์โฆษณาตรงหมวดนี้ ไม่ต้องรอแอดมิน) ===== */
const adcatOverlay = $("#adcat-overlay");
const adcatOptionsEl = $("#adcat-options");
let pendingAdCat = "";

function openAdCatModal() {
  pendingAdCat = getRestaurantAdCategory(restaurantId) || "";
  adcatOptionsEl.innerHTML = AD_CATEGORIES.map(
    (c) =>
      `<button type="button" class="adcat-option${c.value === pendingAdCat ? " selected" : ""}" data-value="${c.value}">${c.emoji} ${c.label}</button>`
  ).join("");
  adcatOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

$("#prof-ad-category").addEventListener("click", openAdCatModal);
$("#adcat-close").addEventListener("click", () => {
  adcatOverlay.hidden = true;
  document.body.style.overflow = "";
});
$("#adcat-clear").addEventListener("click", () => {
  pendingAdCat = "";
  adcatOptionsEl.querySelectorAll(".adcat-option").forEach((b) => b.classList.toggle("selected", b.dataset.value === ""));
});
adcatOptionsEl.addEventListener("click", (e) => {
  const b = e.target.closest(".adcat-option");
  if (!b) return;
  pendingAdCat = b.dataset.value;
  adcatOptionsEl.querySelectorAll(".adcat-option").forEach((x) => x.classList.toggle("selected", x === b));
});
$("#adcat-save").addEventListener("click", () => {
  setRestaurantAdCategory(restaurantId, pendingAdCat);
  adcatOverlay.hidden = true;
  document.body.style.overflow = "";
  const r = getRestaurant(restaurantId);
  showToast(
    pendingAdCat
      ? `🏷️ ตั้งหมวดโฆษณา "${pendingAdCat}" ให้ ${r.name} แล้ว — ลูกค้าจะเห็นโฆษณาตรงหมวดนี้ที่หน้าแรก`
      : `🌐 ${r.name} ไม่ระบุหมวด — เห็นโฆษณาทุกหมวดที่หน้าแรก`
  );
});

