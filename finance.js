/* ===== การเงินแพลตฟอร์ม =====
   - ยอดขายรายร้าน + ยอดรวม (ไม่รวมออเดอร์ยกเลิก)
   - รายได้ไรเดอร์ = ค่าจัดส่งของงานที่ส่งเสร็จ / เบิกแล้ว / คงเหลือ
   - ประวัติการเบิกถอนทั้งหมด
   - สลับช่วงเวลา วันนี้ / ทั้งหมด + อัปเดตสด (storage + poll 3 วิ) */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// 🔒 เฉพาะแอดมินเท่านั้น — ลูกค้า/ร้านค้าเปิดดูการเงินรวมแพลตฟอร์มไม่ได้
const financeAllowed = isAdminLoggedIn();
if (!financeAllowed) location.replace("admin.html");

let range = "all"; // today | all
let feeRate = getPlatformFeeRate();

const toastEl = $("#toast");
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function fmt(n) { return "฿" + n.toLocaleString("th-TH"); }
function isToday(ts) {
  const d = new Date(ts);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ออเดอร์ที่นับเป็นยอดขาย (ไม่รวมยกเลิก) + ตามช่วงเวลา
function salesOrders() {
  const orders = getOrders().filter((o) => o.status !== "ยกเลิก");
  return range === "today" ? orders.filter((o) => isToday(o.createdAt)) : orders;
}

// ป้ายอัตราในตารางร้าน: ร้านใหม่ → ฟรี 🎉 ; ตั้งเฉพาะร้าน/ใช้อัตรารวม → %
function restRateLabel(id) {
  const rate = getRestaurantFeeRate(id);
  return isNewRestaurant(id) ? "ฟรี 🎉" : rate + "%";
}

/* ===== เรนเดอร์ ===== */
function render() {
  const orders = salesOrders();

  // ===== ยอดขายรายร้าน =====
  const byRest = new Map();
  orders.forEach((o) => {
    if (!byRest.has(o.restaurantId)) {
      byRest.set(o.restaurantId, { id: o.restaurantId, orders: 0, subtotal: 0, delivery: 0, discount: 0, total: 0, fee: 0 });
    }
    const r = byRest.get(o.restaurantId);
    r.orders += 1;
    r.subtotal += Number(o.subtotal) || 0;
    r.delivery += Number(o.delivery) || 0;
    r.discount += Number(o.discount) || 0;
    r.total += (Number(o.total) || 0) - (Number(o.platformFee) || 0); // ยอดขายร้าน ไม่รวมค่าแพลตฟอร์มที่ลูกค้าจ่าย
    r.fee += orderPlatformFee(o, getRestaurantFeeRate(o.restaurantId)); // ค่าธรรมเนียมต่อใบ คิดจากอัตราของร้านนั้น (คิดจากยอดอาหารหลังส่วนลด)
  });
  const restRows = [...byRest.values()].sort((a, b) => b.total - a.total);
  const salesTotal = restRows.reduce((s, r) => s + r.total, 0);
  const platformProfit = restRows.reduce((s, r) => s + r.fee, 0);
  const orderCount = orders.length;

  const restBody = $("#finance-rest-body");
  restBody.innerHTML = restRows.length
    ? restRows
        .map(
          (r) => `
      <tr>
        <td><b>${getRestaurant(r.id).coverEmoji} ${escapeHtml(getRestaurant(r.id).name)}</b></td>
        <td class="num">${restRateLabel(r.id)}</td>
        <td class="num">${r.orders}</td>
        <td class="num">${fmt(r.subtotal)}</td>
        <td class="num">${fmt(r.delivery)}</td>
        <td class="num">${r.discount > 0 ? "−" + fmt(r.discount) : "—"}</td>
        <td class="num total">${fmt(r.total)}</td>
        <td class="num fee">${fmt(r.fee)}</td>
        <td class="num net">${fmt(Math.max(0, r.subtotal - r.discount - r.fee))}</td>
      </tr>`
        )
        .join("") +
      `<tr class="total-row">
        <td>รวมทั้งหมด</td>
        <td class="num">—</td>
        <td class="num">${orderCount}</td>
        <td class="num">${fmt(restRows.reduce((s, r) => s + r.subtotal, 0))}</td>
        <td class="num">${fmt(restRows.reduce((s, r) => s + r.delivery, 0))}</td>
        <td class="num">${fmt(restRows.reduce((s, r) => s + r.discount, 0))}</td>
        <td class="num total">${fmt(salesTotal)}</td>
        <td class="num fee">${fmt(platformProfit)}</td>
        <td class="num net">${fmt(restRows.reduce((s, r) => s + Math.max(0, r.subtotal - r.discount - r.fee), 0))}</td>
      </tr>`
    : "";
  $("#finance-rest-empty").hidden = restRows.length > 0;
  $("#finance-rest-summary").textContent = `${orderCount} ออเดอร์ · ${fmt(salesTotal)} · ค่าธรรมเนียม ${fmt(platformProfit)}`;

  // ===== รายได้ไรเดอร์ =====
  const riders = getRiders();
  const allRiderIds = new Set(riders.map((r) => r.id));
  getOrders()
    .filter((o) => o.riderId)
    .forEach((o) => allRiderIds.add(o.riderId));
  const riderRows = [...allRiderIds]
    .map((id) => {
      const reg = getRiderById(id);
      const done = getOrders().filter((o) => {
        if (o.riderId !== id || o.status !== "เสร็จสิ้น") return false;
        return range === "all" || isToday(o.deliveredAt || o.createdAt);
      });
      const earn = done.reduce((s, o) => s + (Number(o.delivery) || 0), 0);
      const withdrawals = getRiderWithdrawals(id).filter((w) => range === "all" || isToday(w.requestedAt));
      const withdrawn = withdrawals.reduce((s, w) => s + w.amount, 0);
      return { id, name: (reg && reg.name) || getOrders().find((o) => o.riderId === id)?.riderName || "ไรเดอร์", phone: reg ? reg.phone : "", done: done.length, earn, withdrawn, available: earn - withdrawn };
    })
    .sort((a, b) => b.earn - a.earn);

  const riderBody = $("#finance-rider-body");
  riderBody.innerHTML = riderRows.length
    ? riderRows
        .map(
          (r) => `
      <tr>
        <td><span class="finance-rider-name">🛵 ${escapeHtml(r.name)}</span>${r.phone && r.phone !== "-" ? ` <small style="color:var(--muted)">${escapeHtml(r.phone)}</small>` : ""}</td>
        <td class="num">${r.done}</td>
        <td class="num">${fmt(r.earn)}</td>
        <td class="num">${r.withdrawn > 0 ? fmt(r.withdrawn) : "—"}</td>
        <td class="num total">${fmt(Math.max(0, r.available))}</td>
      </tr>`
        )
        .join("") +
      `<tr class="total-row"><td>รวมไรเดอร์</td><td class="num">${riderRows.reduce((s, r) => s + r.done, 0)}</td><td class="num">${fmt(riderRows.reduce((s, r) => s + r.earn, 0))}</td><td class="num">${fmt(riderRows.reduce((s, r) => s + r.withdrawn, 0))}</td><td class="num total">${fmt(Math.max(0, riderRows.reduce((s, r) => s + r.available, 0)))}</td></tr>`
    : "";
  $("#finance-rider-empty").hidden = riderRows.length > 0;
  $("#finance-rider-summary").textContent = riderRows.length ? `${riderRows.length} คน · รายได้รวม ${fmt(riderRows.reduce((s, r) => s + r.earn, 0))}` : "";

  // ===== ประวัติการเบิกถอน =====
  const allWithdrawals = getRiderWithdrawalsList();
  const inRange = allWithdrawals.filter((w) => range === "all" || isToday(w.requestedAt)).sort((a, b) => b.requestedAt - a.requestedAt);
  const withdrawTotal = inRange.reduce((s, w) => s + w.amount, 0);

  $("#finance-withdraw-list").innerHTML = inRange.length
    ? inRange
        .slice(0, 12)
        .map((w) => {
          const reg = getRiderById(w.riderId);
          const name = (reg && reg.name) || w.riderName || "ไรเดอร์";
          return `
      <div class="finance-withdraw-item">
        <span>💸 <b>${fmt(w.amount)}</b> — ${escapeHtml(name)}</span>
        <small>${new Date(w.requestedAt).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small>
      </div>`;
        })
        .join("")
    : "";
  $("#finance-withdraw-empty").hidden = inRange.length > 0;

  // ===== สถิติรวม =====
  const riderEarnTotal = riderRows.reduce((s, r) => s + r.earn, 0);
  $("#stat-sales").textContent = fmt(salesTotal);
  $("#stat-orders").textContent = orderCount;
  $("#stat-platform-profit").textContent = fmt(platformProfit);
  $("#stat-rider-earn").textContent = fmt(riderEarnTotal);
  $("#stat-withdraw").textContent = fmt(withdrawTotal);
  $("#finance-subtitle").textContent =
    (range === "today" ? "วันนี้ · " : "ภาพรวมทั้งหมด · ") +
    `ยอดขาย ${fmt(salesTotal)} · กำไรแพลตฟอร์ม ${fmt(platformProfit)} (ค่าเริ่มต้น ${feeRate}% — ตามร้าน) · รายได้ไรเดอร์ ${fmt(riderEarnTotal)}`;
}

// รายการเบิกถอนทั้งหมด (ข้าม riderId — ดึงจาก localStorage ตรง ๆ)
function getRiderWithdrawalsList() {
  try {
    const raw = localStorage.getItem(WITHDRAWALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return [];
}

/* ===== สลับช่วงเวลา ===== */
$$(".finance-toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    range = btn.dataset.range;
    $$(".finance-toggle-btn").forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", b === btn);
    });
    render();
  });
});

/* ===== ตั้งค่าธรรมเนียมแพลตฟอร์ม ===== */
const feeInput = $("#fee-rate");
feeInput.value = feeRate;
$("#fee-save").addEventListener("click", () => {
  feeRate = setPlatformFeeRate(feeInput.value);
  feeInput.value = feeRate;
  render();
  showToast(`💸 ตั้งค่าธรรมเนียมแพลตฟอร์ม ${feeRate}% แล้ว — กำไรแพลตฟอร์มและยอดสุทธิร้านคำนวณใหม่`);
});
feeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("#fee-save").click();
});

/* ===== อัปเดตสด ===== */
window.addEventListener("storage", (e) => {
  if ([ORDERS_KEY, WITHDRAWALS_KEY, RIDERS_KEY].includes(e.key)) render();
});
if (financeAllowed) setInterval(render, 3000);

/* ===== เริ่มต้น ===== */
if (financeAllowed) render();
