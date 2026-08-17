/* ===== UI ใหม่: Bottom Nav + หน้าหลัก / รายงาน / โปรไฟล์ =====
   - ไม่แตะฟังก์ชัน dashboard.js เดิม (render/renderReviews/ปิดชั่วคราว/กรองสถานะ ยังทำงานเหมือนเดิม)
   - ใช้ข้อมูลชุดเดียวกับ dashboard: getOrdersFor / getRestaurant / setStoreClosed ... จาก menu-data.js
   - สลับหน้า = ซ่อน/แสดง .page + เปลี่ยน active ที่แถบล่าง */

const DASH_STATUSES = ["ใหม่", "กำลังเตรียม", "พร้อมส่ง", "กำลังจัดส่ง", "เสร็จสิ้น", "ยกเลิก"];

/* ===== สลับหน้า (Bottom Nav) ===== */
function switchPage(name) {
  $$(".page").forEach((p) => p.classList.toggle("active", p.id === "page-" + name));
  $$(".ds-bottom-nav-item").forEach((b) => b.classList.toggle("active", b.dataset.page === name));
  window.scrollTo(0, 0);
  if (name === "home") renderHome();
  else if (name === "reports") renderReports();
  else if (name === "profile") renderProfile();
}

$$(".ds-bottom-nav-item").forEach((b) =>
  b.addEventListener("click", () => switchPage(b.dataset.page))
);

// ปุ่มลัด/การ์ด action: orders/reports = สลับแท็บในหน้านี้, menu/riders = ไปหน้า admin (จัดการเมนู/ไรเดอร์)
document.addEventListener("click", (e) => {
  const go = e.target.closest("[data-go]");
  if (!go) return;
  const dest = go.dataset.go;
  if (dest === "orders" || dest === "reports") switchPage(dest);
  else if (dest === "menu" || dest === "riders") location.href = "admin.html";
});

/* ===== สถานะร้าน (ชุดเดียวกับ dashboard.js renderCloseBar) ===== */
function storeStatusInfo() {
  const r = getRestaurant(restaurantId);
  if (!r) return { cls: "closed", txt: "—" };
  const temp = getStoreClosed(r.id);
  const auto = isAutoClosed(r.id);
  if (temp) return { cls: "closed", txt: "🔴 ปิดชั่วคราว" };
  if (auto) return { cls: "closed", txt: `🔴 ปิดอัตโนมัติ (ค้าง ${getPendingOrderCount(r.id)} ใบ)` };
  const open = storeAcceptingOrders(r);
  return open === false
    ? { cls: "closed", txt: `🔴 ปิดอยู่ (${r.open}–${r.close})` }
    : { cls: "open", txt: `🟢 เปิดอยู่ (${r.open}–${r.close})` };
}

/* ===== หน้าหลัก ===== */
function renderHome() {
  const r = getRestaurant(restaurantId);
  if (!r) return;
  const logo = $("#home-logo");
  logo.innerHTML = UI.imgBlock({ img: r.imageUrl || UI.storeImgUrl(r.name, r.cuisine), emoji: r.coverEmoji, color: r.coverBg, alt: r.name, fallback: "images/no-store.png" });
  logo.style.background = r.coverBg || "linear-gradient(135deg,#f7971e,#ffd200)";
  $("#home-name").textContent = r.name;
  $("#home-cuisine").textContent = r.cuisine || "";
  const st = storeStatusInfo();
  const stEl = $("#home-status");
  stEl.textContent = st.txt;
  stEl.className = "ds-badge " + (st.cls === "open" ? "success" : "danger");

  const orders = getOrdersFor(restaurantId);
  const today = orders.filter((o) => isToday(o.createdAt) && o.status !== "ยกเลิก");
  const rev = today.reduce((s, o) => s + Number(o.total || 0), 0);
  $("#home-today-count").textContent = today.length;
  $("#home-today-rev").textContent = fmt(rev);

  // การ์ดออเดอร์ล่าสุด (แตะ → หน้างาน)
  const latestEl = $("#home-latest");
  const latest = orders
    .filter((o) => o.status !== "ยกเลิก")
    .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0))[0];
  if (!latest) {
    latestEl.innerHTML = `<div class="home-latest-empty">ยังไม่มีออเดอร์ — เมื่อลูกค้าสั่งซื้อจะขึ้นที่นี่ทันที 📣</div>`;
  } else {
    const c = latest.customer || {};
    const nItems = Array.isArray(latest.items)
      ? latest.items.reduce((a, i) => a + (Number(i.qty) || 0), 0)
      : 0;
    latestEl.innerHTML = `
      <button type="button" class="home-latest-card" data-go="orders">
        <span class="status-pill status-${latest.status}">${latest.status}</span>
        <div class="home-latest-main">
          <b>ออเดอร์ #${latest.id} · ${escapeHtml(c.name || "—")}</b>
          <small>${clock(latest.createdAt)} · ${timeAgo(latest.createdAt)} · ${nItems} รายการ</small>
        </div>
        <b class="home-latest-price">${fmt(latest.total)}</b>
      </button>`;
  }
}

/* ===== หน้ารายงาน ===== */
function renderReports() {
  const orders = getOrdersFor(restaurantId);
  const today = orders.filter((o) => isToday(o.createdAt) && o.status !== "ยกเลิก");
  const done = orders.filter((o) => o.status === "เสร็จสิ้น");
  const total = orders.filter((o) => o.status !== "ยกเลิก");
  const todayRev = today.reduce((s, o) => s + Number(o.total || 0), 0);
  const totalRev = total.reduce((s, o) => s + Number(o.total || 0), 0);
  $("#rep-today-rev").textContent = fmt(todayRev);
  $("#rep-today-count").textContent = today.length;
  $("#rep-total-rev").textContent = fmt(totalRev);
  $("#rep-done-count").textContent = done.length;

  // แยกตามสถานะ
  const counts = {};
  DASH_STATUSES.forEach((s) => (counts[s] = orders.filter((o) => o.status === s).length));
  const maxC = Math.max(1, ...DASH_STATUSES.map((s) => counts[s]));
  $("#rep-status").innerHTML = DASH_STATUSES.map((s) => {
    const c = counts[s];
    const pct = Math.round((c / maxC) * 100);
    return `<div class="rep-status-row">
      <span class="status-pill status-${s}">${s}</span>
      <div class="rep-status-bar"><i style="width:${pct}%"></i></div>
      <b>${c}</b>
    </div>`;
  }).join("");

  // ยอดขาย 7 วันล่าสุด
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const sum = orders
      .filter((o) => o.status !== "ยกเลิก" && new Date(o.createdAt).toDateString() === key)
      .reduce((s, o) => s + Number(o.total || 0), 0);
    days.push({
      label: d.toLocaleDateString("th-TH", { weekday: "short" }),
      sum,
    });
  }
  const maxDay = Math.max(1, ...days.map((d) => d.sum));
  $("#rep-week").innerHTML = days
    .map((d) => {
      const h = d.sum ? Math.max(6, Math.round((d.sum / maxDay) * 100)) : 4;
      return `<div class="rep-week-col"><i style="height:${h}%"></i><span>${d.label}</span><b>${d.sum ? fmt(d.sum) : ""}</b></div>`;
    })
    .join("");

  // ออเดอร์วันนี้ (เรียงใหม่สุดก่อน)
  const todaySorted = [...today].sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
  $("#rep-today-list").innerHTML = todaySorted.length
    ? todaySorted
        .map((o) => {
          const c = o.customer || {};
          const nItems = Array.isArray(o.items)
            ? o.items.reduce((a, i) => a + (Number(i.qty) || 0), 0)
            : 0;
          return `<div class="rep-order-row">
            <span class="status-pill status-${o.status}">${o.status}</span>
            <div class="rep-order-main"><b>#${o.id} · ${escapeHtml(c.name || "—")}</b><small>${clock(o.createdAt)} · ${nItems} รายการ</small></div>
            <b>${fmt(o.total)}</b>
          </div>`;
        })
        .join("")
    : `<div class="home-latest-empty">ยังไม่มีออเดอร์วันนี้</div>`;
}

/* ===== หน้าโปรไฟล์ ===== */
function renderProfile() {
  const r = getRestaurant(restaurantId);
  if (!r) return;
  const logo = $("#prof-logo");
  logo.innerHTML = UI.imgBlock({ img: r.imageUrl || UI.storeImgUrl(r.name, r.cuisine), emoji: r.coverEmoji, color: r.coverBg, alt: r.name, fallback: "images/no-store.png" });
  logo.style.background = r.coverBg || "linear-gradient(135deg,#f7971e,#ffd200)";
  $("#prof-name").textContent = r.name;
  $("#prof-cuisine").textContent = r.cuisine || "";
  const st = storeStatusInfo();
  const stEl = $("#prof-status");
  stEl.textContent = st.txt;
  stEl.className = "ds-badge " + (st.cls === "open" ? "success" : "danger");

  const eff = getEffectiveRating(r.id);
  const ds = getDeliverySettings(r.id);
  const delBase = ds ? ds.base : r.deliveryFee;
  const delPerKm = ds ? ds.perKm : (r.deliveryPerKm !== undefined ? r.deliveryPerKm : DEFAULT_DELIVERY_PER_KM);
  const hasGps = typeof r.lat === "number" && typeof r.lng === "number";

  const rows = [
    { icon: "⭐", label: "คะแนน", value: `${eff.rating} (${eff.reviews.toLocaleString("th-TH")} รีวิว)` },
    { icon: "📞", label: "เบอร์โทร", value: r.phone || "—" },
    { icon: "📍", label: "ที่อยู่", value: r.address || "—" },
    { icon: "🕐", label: "เวลาเปิด-ปิด", value: `${r.open} – ${r.close} น.` },
    { icon: "🛵", label: "ค่าจัดส่ง", value: `ค่าเริ่มต้น ${delBase}฿ + ${delPerKm}฿/กม. · ส่งฟรีขั้นต่ำ ฿${r.freeDeliveryMin}` },
    { icon: "🧭", label: "พิกัด GPS", value: hasGps ? `${r.lat}, ${r.lng}` : "—" },
  ];
  $("#prof-info").innerHTML = rows
    .map(
      (row) => `
      <div class="prof-row">
        <span class="prof-row-icon">${row.icon}</span>
        <div><b>${row.label}</b><p>${escapeHtml(String(row.value))}</p></div>
      </div>`
    )
    .join("");

  // ปุ่มปิด/เปิดรับออเดอร์ (ใช้ setStoreClosed เดิม — หน้างานอัปเดตเองผ่าน render() ทุก 3 วิ)
  const btn = $("#prof-close-toggle");
  const rec = getStoreClosed(r.id);
  btn.innerHTML = rec ? `🟢 เปิดรับออเดอร์ <span>→</span>` : `🔴 ปิดรับออเดอร์ชั่วคราว <span>→</span>`;
}

$("#prof-close-toggle").addEventListener("click", () => {
  const r = getRestaurant(restaurantId);
  if (!r) return;
  const rec = getStoreClosed(r.id);
  if (rec) {
    setStoreClosed(r.id, false);
    showToast(`🟢 ${r.name} เปิดรับออเดอร์แล้ว`);
  } else {
    setStoreClosed(r.id, true);
    showToast(`🔴 ${r.name} ปิดรับออเดอร์ชั่วคราวแล้ว — หน้าร้านลูกค้าบล็อกการสั่งซื้อทันที`);
  }
  renderProfile();
  renderHome();
});

$("#prof-logout").addEventListener("click", () => {
  if (!confirm("ออกจากระบบ?")) return;
  setStoreSession(null);
  setAdminSession(false);
  location.href = "login.html";
});

/* ===== ป้ายจำนวนออเดอร์ใหม่ที่แถบ "งาน" ===== */
function updateNavBadge() {
  const n = getOrdersFor(restaurantId).filter((o) => o.status === "ใหม่").length;
  const badge = $("#nav-orders-badge");
  badge.hidden = n === 0;
  badge.textContent = n > 99 ? "99+" : String(n);
}

/* ===== ป๊อปอัปลอยออเดอร์ใหม่ (แสดงแม้ไม่ได้อยู่แท็บงาน — กดรับได้ทันที) ===== */
const UI_SEEN_KEY = "sangkha-dash-ui-seen-orders"; // ID ออเดอร์ที่ UI ใหม่เห็นแล้ว (กันแจ้งซ้ำข้ามหน้าโหลด)
let uiSeenOrders = new Set();
try {
  const raw = localStorage.getItem(UI_SEEN_KEY);
  if (raw) {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) uiSeenOrders = new Set(arr.map(String));
  }
} catch (_) { /* ไม่เป็นไร */ }

function saveUiSeen() {
  try {
    localStorage.setItem(UI_SEEN_KEY, JSON.stringify([...uiSeenOrders].slice(-60)));
  } catch (_) { /* ไม่เป็นไร */ }
}

const newOrderPopups = document.createElement("div");
newOrderPopups.className = "new-order-popups";
newOrderPopups.setAttribute("aria-live", "polite");
document.body.appendChild(newOrderPopups);

function dismissNewOrderPopup(el) {
  if (!el || el.classList.contains("leaving")) return;
  el.classList.add("leaving");
  setTimeout(() => el.remove(), 220);
}

function showNewOrderPopup(o) {
  const el = document.createElement("div");
  el.className = "new-order-popup";
  const c = o.customer || {};
  const items = Array.isArray(o.items) ? o.items : [];
  const nItems = items.reduce((a, i) => a + (Number(i.qty) || 0), 0);
  // รายการอาหารย่อ ๆ (2-3 รายการแรก — ร้านเห็นว่าสั่งอะไรก่อนกดรับ)
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
      <span class="nop-badge">🔔 ออเดอร์ใหม่ #${o.id}</span>
      <button type="button" class="nop-close" aria-label="ปิด">✕</button>
    </div>
    <div class="nop-body">
      <b>${escapeHtml(c.name || "—")}</b>
      <small>${nItems} รายการ · ${fmt(o.total)} · ${timeAgo(o.createdAt)}</small>
    </div>
    ${itemRows ? `<div class="nop-items">${itemRows}${more}</div>` : ""}
    <button type="button" class="nop-accept">✅ รับออเดอร์</button>`;
  el.querySelector(".nop-close").addEventListener("click", () => dismissNewOrderPopup(el));
  el.querySelector(".nop-accept").addEventListener("click", () => {
    updateOrderStatus(o.id, "กำลังเตรียม"); // เดียวกับปุ่ม "✅ รับออเดอร์" ในหน้างาน
    showToast(`✅ รับออเดอร์ #${o.id} แล้ว`);
    dismissNewOrderPopup(el);
    refreshUI();
  });
  // แตะที่ตัวการ์ด (ไม่ใช่ปุ่ม) → ไปหน้างานดูออเดอร์
  el.addEventListener("click", (e) => {
    if (e.target.closest(".nop-close") || e.target.closest(".nop-accept")) return;
    dismissNewOrderPopup(el);
    switchPage("orders");
  });
  // ซ้อนได้สูงสุด 3 ใบ — เกิน = ปิดใบเก่าสุด
  while (newOrderPopups.children.length >= 3) dismissNewOrderPopup(newOrderPopups.firstChild);
  newOrderPopups.appendChild(el);
  // ปิดอัตโนมัติหลัง 15 วิ
  setTimeout(() => dismissNewOrderPopup(el), 15000);
}

// ตรวจออเดอร์ใหม่ที่ยังไม่เห็น (เฉพาะตอนไม่อยู่แท็บงาน — อยู่หน้างานการ์ดเด้งอยู่แล้ว)
let uiFirstScanDone = false;
function detectNewOrders() {
  if (!$("#page-orders") || $("#page-orders").classList.contains("active")) return;
  const unseen = getOrdersFor(restaurantId).filter(
    (o) => o.status === "ใหม่" && !uiSeenOrders.has(String(o.id))
  );
  if (!unseen.length) return;
  // ครั้งแรกหลังโหลด (มีออเดอร์ค้างอยู่แล้ว) → dashboard.js ยังไม่ตีเสียงให้ (lastSeenIds ว่าง) — ตีเองรอบเดียว
  if (!uiFirstScanDone) chime();
  unseen.forEach((o, i) => {
    uiSeenOrders.add(String(o.id));
    setTimeout(() => showNewOrderPopup(o), i * 450); // กันโผล่พร้อมกันหลายใบ
  });
  saveUiSeen();
}

/* ===== รีเฟรช UI ใหม่ (เรียกซ้ำทุก 3 วิ + ตอน storage เปลี่ยน — ทำงานคู่กับ render() เดิม) ===== */
function refreshUI() {
  const r = getRestaurant(restaurantId);
  if (r) $("#app-bar-name").textContent = r.name;
  updateNavBadge();
  detectNewOrders();
  if ($("#page-home").classList.contains("active")) renderHome();
  if ($("#page-reports").classList.contains("active")) renderReports();
  if ($("#page-profile").classList.contains("active")) renderProfile();
  uiFirstScanDone = true;
}

if (dashAuthorized) {
  refreshUI();
  setInterval(refreshUI, 3000);
  window.addEventListener("storage", refreshUI);
}
