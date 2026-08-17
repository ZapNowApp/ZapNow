/* ===== หน้าโปรโมชันเต็มของโฆษณาหนึ่งชิ้น (deal.html?id=N) ===== */

const adId = Number(new URLSearchParams(location.search).get("id"));
let ADS = getLiveAds(); // เฉพาะโฆษณาที่กำลังออกอากาศ (สำหรับดีลอื่น ๆ)
const ad = getAd(adId);

const toastEl = document.getElementById("toast");
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

/* ปุ่มย้อนกลับ */
document.getElementById("btn-back").addEventListener("click", () => {
  history.length > 1 ? history.back() : (location.href = "index.html");
});

if (!ad) {
  document.getElementById("deal-notfound").hidden = false;
} else if (!isAdLive(ad)) {
  // โฆษณาไม่อยู่ในช่วงออกอากาศ (ยังไม่เริ่ม / หมดเวลาแล้ว)
  const st = getAdStatus(ad);
  const msg = st === "scheduled"
    ? `⏳ โปรโมชันนี้ยังไม่เริ่ม — เริ่ม ${fmtDateTime(ad.startAt)}`
    : `🔚 โปรโมชันนี้สิ้นสุดแล้ว (หมดอายุ ${fmtDateTime(ad.endAt)})`;
  const el = document.getElementById("deal-notlive");
  el.hidden = false;
  el.innerHTML = `${msg} — <a href="deals.html">ดูดีลที่กำลังออกอากาศ →</a>`;
  document.getElementById("deal-content").hidden = true;
} else {
  recordAdClick(ad.id);
  document.title = `${ad.title} — ดีลเด็ด`;

  /* ===== คูปองของโฆษณานี้ ===== */
  const hasCoupon = ad.discountType === "delivery" || Number(ad.discountValue) > 0;
  const myCoupon = hasCoupon ? getUsableCoupons().find((c) => c.adId === ad.id) || null : null;

  /* ===== แบนเนอร์ + นับถอยหลัง ===== */
  const DURATION_MS = 2 * 60 * 60 * 1000;
  // โฆษณาที่ตั้งเวลาสิ้นสุด → นับถอยหลังถึงเวลานั้นจริง (ไม่ใช่ 2 ชม. เสมอไป)
  const endTime = ad.endAt ? Number(ad.endAt) : Date.now() + DURATION_MS;
  // สิ้นสุดไกลเกิน 24 ชม. → แสดงวันหมดอายุเต็มรูปแบบแทนการนับถอยหลัง HH:MM:SS
  const LONG_MS = 24 * 60 * 60 * 1000;
  const showEndDate = Boolean(ad.endAt) && endTime - Date.now() > LONG_MS;
  function fmtEndDate(ts) {
    return new Date(Number(ts)).toLocaleString("th-TH", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }
  const heroEl = document.getElementById("deal-hero");
  const isMotion = !!(ad.aiMotion && ad.aiImg); // โหมดเคลื่อนไหว (Ken Burns + แสงวิ่ง + ตัวหนังสือเข้าฉาก)
  heroEl.innerHTML = `
    <div class="deal-hero-content${isMotion ? " ad-motion" : ""}" style="background:${ad.bg}${ad.aiImg ? `;background-image:url('${ad.aiImg}')` : ""}">
      ${ad.video ? `<video class="deal-hero-video" autoplay muted loop playsinline preload="metadata" aria-hidden="true">
        <source src="${ad.video}.mp4" type="video/mp4" />
        <source src="${ad.video}.webm" type="video/webm" />
      </video>` : ""}
      ${isMotion ? `<div class="ad-kenburns" style="background-image:url('${ad.aiImg}')" aria-hidden="true"></div>
      <div class="ad-shine" aria-hidden="true"></div>` : ""}
      <div class="deal-hero-scrim" aria-hidden="true"></div>
      <span class="ad-badge">โฆษณา</span>
      <div class="deal-hero-content-inner">
        <p class="deal-hero-eyebrow">⚡ โปรเด็ดวันนี้ · ${ad.emoji}</p>
        <h1 class="deal-hero-title${ad.titleAnim && ad.titleAnim !== "none" ? ` ad-title-anim-${ad.titleAnim}` : ""}">${ad.title}</h1>
        <div class="deal-hero-timer">
          ${showEndDate
            ? `หมดเขต <b class="deal-end-date">${fmtEndDate(ad.endAt)}</b>`
            : `หมดเขตใน <b class="deal-countdown">--:--:--</b>`}
        </div>
        ${hasCoupon ? `<span class="deal-coupon-chip">🎟️ ${couponValueLabel(ad)} · ${couponMinLabel(ad)}</span>` : ""}
        <button class="deal-hero-cta" type="button" ${myCoupon ? "disabled" : ""}>${myCoupon ? `🎟️ มีคูปองแล้ว: ${myCoupon.code} ✓` : hasCoupon ? "🎟️ รับคูปองส่วนลด" : `${ad.cta || "ดูโปรโมชัน"} →`}</button>
      </div>
    </div>`;

  document.querySelector(".deal-hero-cta").addEventListener("click", () => {
    if (!hasCoupon) {
      showToast(`🔗 เปิดโฆษณา: ${ad.title}`);
      return;
    }
    if (myCoupon) {
      showToast(`คุณมีคูปอง ${myCoupon.code} แล้ว — ใช้ตอนสั่งซื้อได้เลย`);
      return;
    }
    const coupon = claimCoupon(ad);
    if (!coupon) {
      showToast("⚠️ โฆษณานี้ยังไม่มีคูปอง");
      return;
    }
    const btn = document.querySelector(".deal-hero-cta");
    btn.disabled = true;
    btn.textContent = `🎟️ มีคูปองแล้ว: ${coupon.code} ✓`;
    showToast(`🎟️ รับคูปองแล้ว! ${coupon.code} — ${couponValueLabel(coupon)} (${couponMinLabel(coupon)}) ใช้ตอนสั่งซื้อได้เลย`);
  });

  // แสดงวันหมดอายุเต็ม → ไม่ต้องนับถอยหลังทุกวินาที
  if (!showEndDate) {
    function tick() {
      const ms = Math.max(0, endTime - Date.now());
      const h = Math.floor(ms / 3.6e6);
      const m = Math.floor((ms % 3.6e6) / 6e4);
      const s = Math.floor((ms % 6e4) / 1000);
      document.querySelectorAll(".deal-countdown").forEach((el) => {
        el.textContent = [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
      });
    }
    setInterval(tick, 1000);
    tick();
  }

  /* ===== รายละเอียด ===== */
  document.getElementById("deal-desc").textContent = ad.desc || "ไม่มีรายละเอียดเพิ่มเติมในขณะนี้";

  /* ===== เงื่อนไข ===== */
  document.getElementById("deal-terms").innerHTML = getAdTerms(ad)
    .map((t) => `<li>${t}</li>`)
    .join("");

  /* ===== ดีลอื่น ๆ (เฉพาะที่กำลังออกอากาศ) ===== */
  const others = ADS.filter((a) => a.id !== ad.id);
  document.getElementById("deal-more").innerHTML = others.length
    ? others
        .map(
          (o) => `
      <button class="deal-more-card" data-id="${o.id}" type="button" style="background:${o.bg}">
        <span class="deal-more-emoji" aria-hidden="true">${o.emoji}</span>
        <span class="deal-more-body">
          <b>${o.title}</b>
          <small>${o.desc || ""}</small>
        </span>
        <span class="deal-more-go">ดู →</span>
      </button>`
        )
        .join("")
    : `<p class="deal-notfound" style="padding:20px 0">ยังไม่มีดีลอื่น</p>`;

  document.getElementById("deal-more").addEventListener("click", (e) => {
    const card = e.target.closest(".deal-more-card");
    if (!card) return;
    const other = ADS.find((a) => a.id === Number(card.dataset.id));
    if (!other) return;
    recordAdClick(other.id);
    location.href = `deal.html?id=${other.id}`;
  });
}
