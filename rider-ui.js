/* ============================================================
   rider-ui.js — UI ใหม่ของ Rider Dashboard (รูปแบบเดียวกับ
   Restaurant Dashboard) — ใช้ฟังก์ชันเดิมจาก rider.js/menu-data.js
   ล้วน (profile, render, myOrders, getRiderEarnings, openRiderMap...)
   ไม่แตะระบบเดิม ไม่แตะ Firebase
   ============================================================ */
const RU = { $: (s) => document.querySelector(s), $$: (s) => [...document.querySelectorAll(s)] };

/* ===== สถานะออนไลน์/ออฟไลน์ (local — ไม่แตะระบบเดิม) ===== */
const ONLINE_KEY = "sangkha-rider-online";
function isRiderOnline() {
  try { return localStorage.getItem(ONLINE_KEY) === "1"; } catch (_) { return false; }
}
function setRiderOnline(on) {
  try { localStorage.setItem(ONLINE_KEY, on ? "1" : "0"); } catch (_) { /* ไม่เป็นไร */ }
}

/* ===== สลับแท็บ ===== */
function showPage(page) {
  RU.$$(".page").forEach((p) => p.classList.toggle("active", p.id === "page-" + page));
  RU.$$(".ds-bottom-nav-item").forEach((b) => {
    b.classList.toggle("active", b.dataset.page === page);
  });
  window.scrollTo({ top: 0 });
}

RU.$$(".ds-bottom-nav-item").forEach((btn) => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));
});

/* ===== ไปหน้างานพร้อมกรอง ===== */
function goOrders(filter) {
  showPage("orders");
  if (filter && typeof filter === "string") {
    const tab = RU.$(`#rider-tabs .status-tab[data-filter="${filter}"]`);
    if (tab) tab.click(); // ใช้ handler เดิมของ rider.js
  }
}

/* ===== ปุ่ม Action Card / ปุ่มลัด ===== */
RU.$$("[data-go]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const go = btn.dataset.go;
    if (go === "home") showPage("home");
    else if (go === "orders") goOrders(btn.dataset.filter || "");
    else if (go === "earnings") showPage("earnings");
    else if (go === "profile") showPage("profile");
    else if (go === "settings") showPage("settings");
  });
});

/* ===== ปุ่มแผนที่ (เปิดโมดัลแผนที่เดิม — เลือกงานกำลังส่งแรก) ===== */
RU.$("#rider-home-map").addEventListener("click", () => {
  const mine = myOrders().filter((o) => o.status === "กำลังจัดส่ง");
  if (!mine.length) {
    showToast("📍 ยังไม่มีงานกำลังส่ง — รับงานก่อนถึงเปิดแผนที่ได้");
    return;
  }
  openRiderMap(mine[0]);
});

/* ===== สถานะออนไลน์ ===== */
function riderOnlineText(on) {
  return on ? "🟢 ออนไลน์ — พร้อมรับงาน" : "⚪ ออฟไลน์";
}
function renderOnlineState() {
  const on = isRiderOnline();
  RU.$("#rider-home-status").textContent = riderOnlineText(on);
  RU.$("#prof-status").textContent = riderOnlineText(on);
  const sw = RU.$("#settings-online-toggle");
  sw.setAttribute("aria-checked", on ? "true" : "false");
  sw.classList.toggle("on", on);
  RU.$("#settings-online-label").textContent = on ? "สถานะออนไลน์" : "สถานะออฟไลน์";
  RU.$("#settings-online-desc").textContent = on ? "พร้อมรับงานใหม่ทันที" : "ไม่รับงานใหม่จนกว่าจะเปิด";
  RU.$("#rider-home-online").textContent = on ? "⚪ แตะเพื่อออฟไลน์" : "🟢 แตะเพื่อออนไลน์";
}
function toggleOnline() {
  const on = !isRiderOnline();
  setRiderOnline(on);
  renderOnlineState();
  showToast(on ? "🟢 ออนไลน์แล้ว — ระบบจะส่งงานใหม่ให้ทันที" : "⚪ ออฟไลน์แล้ว — หยุดรับงานใหม่");
}
RU.$("#rider-home-online").addEventListener("click", toggleOnline);
RU.$("#prof-online-toggle").addEventListener("click", toggleOnline);
RU.$("#settings-online-toggle").addEventListener("click", toggleOnline);

/* ===== เรนเดอร์หน้าหลัก (hero + อัปเดตล่าสุด) ===== */
function renderHome() {
  const p = profile;
  RU.$("#rider-home-name").textContent = p ? p.name : "—";
  RU.$("#rider-home-phone").textContent = p ? (p.phone || "—") : "ยังไม่ได้ล็อกอิน";
  renderOnlineState();

  // รายได้/งานวันนี้ (ใช้ฟังก์ชันเดิม)
  const my = p ? myOrders() : [];
  const doneToday = my.filter((o) => o.status === "เสร็จสิ้น" && isToday(o.deliveredAt || o.createdAt));
  const earnToday = doneToday.reduce((s, o) => s + (Number(o.delivery) || 0), 0);
  RU.$("#rider-home-earn").textContent = fmt(earnToday);
  RU.$("#rider-home-jobs").textContent = doneToday.length;

  // อัปเดตล่าสุด (งานล่าสุด 3 ใบ — ใช้ readyCard/mineCard/doneCard เดิม)
  const box = RU.$("#rider-home-latest");
  const ready = getOrders()
    .filter((o) => o.status === "พร้อมส่ง" && riderCanSeeRestaurant(o.restaurantId, p && p.id))
    .sort((a, b) => b.createdAt - a.createdAt);
  const mine = my.filter((o) => o.status === "กำลังจัดส่ง").sort((a, b) => b.createdAt - a.createdAt);
  const recent = [...mine, ...ready].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  if (!recent.length) {
    box.innerHTML = `<p class="home-empty">ยังไม่มีงาน — เมื่อร้านกด "พร้อมส่งแล้ว" งานจะโผล่ที่นี่ทันที 🛵</p>`;
    return;
  }
  box.innerHTML = recent
    .map((o) => {
      const card = o.status === "กำลังจัดส่ง" ? mineCard(o) : readyCard(o);
      return `<div class="home-latest-item">${card}</div>`;
    })
    .join("");
}

/* ===== เรนเดอร์หน้ารายได้ (สรุปตามเดือน) ===== */
function renderEarnings() {
  const box = RU.$("#rider-earnings-history");
  const p = profile;
  if (!p) {
    box.innerHTML = `<p class="empty-state">เข้าสู่ระบบไรเดอร์ก่อนถึงดูรายได้</p>`;
    return;
  }
  const my = myOrders().filter((o) => o.status === "เสร็จสิ้น");
  if (!my.length) {
    box.innerHTML = `<p class="empty-state">ยังไม่มีงานเสร็จสิ้น — รายได้สะสมจะขึ้นที่นี่</p>`;
    return;
  }
  // จัดกลุ่มตามเดือน
  const byMonth = {};
  my.forEach((o) => {
    const mk = monthKey(o.deliveredAt || o.createdAt);
    if (!byMonth[mk]) byMonth[mk] = [];
    byMonth[mk].push(o);
  });
  const months = Object.keys(byMonth).sort().reverse();
  box.innerHTML = months
    .map((mk) => {
      const list = byMonth[mk];
      const total = list.reduce((s, o) => s + (Number(o.delivery) || 0), 0);
      return `
        <div class="earn-month">
          <div class="earn-month-head">
            <b>${monthLabel(mk)}</b>
            <span>${list.length} งาน · ${fmt(total)}</span>
          </div>
          <div class="earn-month-rows">
            ${list
              .map((o) => {
                const r = getRestaurant(o.restaurantId);
                return `<div class="earn-row">
                  <span>#${o.id} · ${r ? escapeHtml(r.name) : "ร้าน"}</span>
                  <b>${fmt(o.delivery)}</b>
                </div>`;
              })
              .join("")}
          </div>
        </div>`;
    })
    .join("");
}

/* ===== อัปเดต badge งานใหม่ที่แถบ "งาน" ===== */
function updateNavBadge() {
  const n = getOrders().filter(
    (o) => o.status === "พร้อมส่ง" && riderCanSeeRestaurant(o.restaurantId, profile && profile.id)
  ).length;
  RU.$("#rider-nav-badge").hidden = n === 0;
  RU.$("#rider-nav-badge").textContent = n;
}

/* ===== ล็อกเอาต์ (ปุ่มโปรไฟล์/ตั้งค่า — ใช้ handler เดิมของ #rider-logout) ===== */
[RU.$("#rider-logout2"), RU.$("#settings-logout")].forEach((btn) => {
  btn.addEventListener("click", () => {
    const orig = RU.$("#rider-logout");
    if (orig) orig.click();
  });
});

/* ===== init ===== */
renderHome();
renderEarnings();
updateNavBadge();

// อัปเดตซ้ำทุก 3 วิ (สถานะ/รายได้/งานสด)
setInterval(() => {
  renderHome();
  renderEarnings();
  updateNavBadge();
}, 3000);

// แสดงชื่อไรเดอร์ในแถบบน
if (profile) {
  RU.$("#app-bar-name").textContent = `🛵 ${profile.name}`;
}

// ripple effect บนปุ่มแอ็กชัน (ใช้ class .ripple จาก dashboard.css)
RU.$$(".ds-action-card, .ds-btn, .ds-bottom-nav-item, .prof-action").forEach((btn) => {
  btn.addEventListener("pointerdown", (e) => {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const rip = document.createElement("span");
    rip.className = "ripple";
    rip.style.width = rip.style.height = size + "px";
    rip.style.left = e.clientX - rect.left - size / 2 + "px";
    rip.style.top = e.clientY - rect.top - size / 2 + "px";
    btn.appendChild(rip);
    setTimeout(() => rip.remove(), 650);
  });
});

/* ============================================================
   ป๊อปอัปลอยงานใหม่ + เสียงเตือน (แสดงแม้ไม่ได้อยู่แท็บงาน)
   - ตรวจจับงาน "พร้อมส่ง" ที่ยังไม่เห็น (กันแจ้งซ้ำข้ามหน้าโหลด)
   - กด "🛵 รับงานนี้" ในป๊อปอัป = assignRider() ฟังก์ชันเดิม
   ============================================================ */
const RUI_SEEN_KEY = "sangkha-rider-ui-seen-jobs";
let ruiSeen = new Set();
try {
  const raw = localStorage.getItem(RUI_SEEN_KEY);
  if (raw) {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) ruiSeen = new Set(arr.map(String));
  }
} catch (_) { /* ไม่เป็นไร */ }
function saveRuiSeen() {
  try { localStorage.setItem(RUI_SEEN_KEY, JSON.stringify([...ruiSeen].slice(-60))); } catch (_) { /* ไม่เป็นไร */ }
}

const riderPopups = document.createElement("div");
if (!document.querySelector(".new-order-popups")) {
  riderPopups.className = "new-order-popups";
  riderPopups.setAttribute("aria-live", "polite");
  document.body.appendChild(riderPopups);
}

function dismissRiderPopup(el) {
  if (!el || el.classList.contains("leaving")) return;
  el.classList.add("leaving");
  setTimeout(() => el.remove(), 220);
}

function showRiderJobPopup(o) {
  const el = document.createElement("div");
  el.className = "new-order-popup rider-job-popup";
  const rest = getRestaurant(o.restaurantId);
  const items = Array.isArray(o.items) ? o.items : [];
  const nItems = items.reduce((a, i) => a + (Number(i.qty) || 0), 0);
  const MAX_SHOW = 3;
  const itemRows = items
    .slice(0, MAX_SHOW)
    .map((it) => {
      const qty = Number(it.qty) || 0;
      return `<span class="nop-item">${it.img ? "" : it.emoji ? it.emoji + " " : ""}${escapeHtml(it.name || "—")}${qty > 1 ? ` <b class="nop-qty">×${qty}</b>` : ""}</span>`;
    })
    .join("");
  const more = items.length > MAX_SHOW ? `<span class="nop-more">+${items.length - MAX_SHOW} รายการ</span>` : "";
  el.innerHTML = `
    <div class="nop-head">
      <span class="nop-badge">🛵 งานใหม่ #${o.id}</span>
      <button type="button" class="nop-close" aria-label="ปิด">✕</button>
    </div>
    <div class="nop-body">
      <b>${escapeHtml(rest ? rest.name : "ร้าน")}</b>
      <small>${nItems} รายการ · ${fmt(o.total)} · 💸 ได้ ${fmt(o.delivery)}</small>
    </div>
    ${itemRows ? `<div class="nop-items">${itemRows}${more}</div>` : ""}
    <div class="nop-actions">
      <button type="button" class="nop-map">🗺️ เปิดแผนที่</button>
      <button type="button" class="nop-accept">🛵 รับงานนี้</button>
    </div>`;
  el.querySelector(".nop-close").addEventListener("click", () => dismissRiderPopup(el));
  el.querySelector(".nop-map").addEventListener("click", () => {
    openRiderMap(o); // เปิดโมดัลแผนที่นำทางเดิม (ไม่รับงาน — ดูเส้นทาง/ระยะ/ETA ก่อนตัดสินใจ)
  });
  el.querySelector(".nop-accept").addEventListener("click", () => {
    if (!profile) {
      showToast("⚠️ ลงทะเบียนไรเดอร์ก่อนรับงาน");
      dismissRiderPopup(el);
      showPage("orders");
      return;
    }
    const taken = assignRider(o.id, profile); // ฟังก์ชันเดิม — กันรับซ้ำ
    dismissRiderPopup(el);
    if (!taken) {
      const now = getOrders().find((x) => x.id === o.id);
      showToast(now && now.riderName ? `⏱️ งาน #${o.id} ${now.riderName} รับไปก่อนแล้ว` : `⚠️ งาน #${o.id} มีไรเดอร์รับไปแล้ว`);
    } else {
      showToast(`🛵 รับงาน #${o.id} แล้ว — ไปรับอาหารที่ ${getRestaurant(taken.restaurantId).name}`);
    }
    render();
    renderHome();
    updateNavBadge();
  });
  // แตะการ์ด (ไม่ใช่ปุ่ม) → ไปแท็บงาน
  el.addEventListener("click", (e) => {
    if (e.target.closest(".nop-close") || e.target.closest(".nop-accept") || e.target.closest(".nop-map")) return;
    dismissRiderPopup(el);
    showPage("orders");
  });
  while (riderPopups.children.length >= 3) dismissRiderPopup(riderPopups.firstChild);
  riderPopups.appendChild(el);
  setTimeout(() => dismissRiderPopup(el), 15000);
}

let ruiFirstScanDone = false;
function detectRiderJobs() {
  // อยู่หน้าแท็บงาน (แท็บ รอรับงาน) → การ์ดเด้งอยู่แล้ว ไม่ต้องป๊อปอัป
  const ordersPage = RU.$("#page-orders");
  if (ordersPage && ordersPage.classList.contains("active")) return;
  const unseen = getOrders().filter(
    (o) =>
      o.status === "พร้อมส่ง" &&
      riderCanSeeRestaurant(o.restaurantId, profile && profile.id) &&
      !ruiSeen.has(String(o.id))
  );
  if (!unseen.length) return;
  if (!ruiFirstScanDone) chime(); // ครั้งแรกมีงานค้าง → ตีเสียงรอบเดียว
  unseen.forEach((o, i) => {
    ruiSeen.add(String(o.id));
    setTimeout(() => showRiderJobPopup(o), i * 450);
  });
  saveRuiSeen();
}

// ตรวจจับงานใหม่ทุก 3 วิ (คู่กับ interval เดิม)
setInterval(detectRiderJobs, 3000);
