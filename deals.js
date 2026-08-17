/* ===== หน้า ดีลเด็ด: รวมโฆษณา/โปรโมชันทั้งหมด (ใช้ข้อมูลเดียวกับสไลด์บนสุดจาก menu-data.js) ===== */

let ADS = getLiveAds(); // เฉพาะโฆษณาที่กำลังออกอากาศ (ตามเวลาที่ตั้งใน admin)
const listEl = document.getElementById("deal-list");
const emptyEl = document.getElementById("deal-empty");

// รีเฟรชเมื่อตั้งเวลา/แก้โฆษณาในหน้า admin (แท็บอื่น)
window.addEventListener("storage", (e) => {
  if (e.key === "sangkha-ads") {
    ADS = getLiveAds();
    render();
  }
});

function render() {
  if (!ADS.length) {
    emptyEl.hidden = false;
    return;
  }
  listEl.innerHTML = ADS.map((ad) => {
    const isMotion = !!(ad.aiMotion && ad.aiImg); // โหมดเคลื่อนไหว (Ken Burns + แสงวิ่ง)
    return `
    <article class="deal-card${isMotion ? " ad-motion" : ""}" data-id="${ad.id}" style="background:${ad.bg}${ad.aiImg ? `;background-image:url('${ad.aiImg}')` : ""}" role="note" aria-label="โฆษณา: ${ad.title}">
      ${ad.video ? `<video class="deal-video" autoplay muted loop playsinline preload="metadata" aria-hidden="true">
        <source src="${ad.video}.mp4" type="video/mp4" />
        <source src="${ad.video}.webm" type="video/webm" />
      </video>` : ""}
      ${isMotion ? `<div class="ad-kenburns" style="background-image:url('${ad.aiImg}')" aria-hidden="true"></div>
      <div class="ad-shine" aria-hidden="true"></div>` : ""}
      <div class="deal-scrim" aria-hidden="true"></div>
      <span class="ad-badge">โฆษณา</span>
      ${ad.iconImg
        ? `<img class="deal-emoji deal-emoji-img" src="${ad.iconImg}" alt="" aria-hidden="true" />`
        : `<div class="deal-emoji" aria-hidden="true">${ad.emoji}</div>`}
      <div class="deal-body">
        <p class="deal-eyebrow">🔥 ดีลเด็ด</p>
        <h2${ad.titleAnim && ad.titleAnim !== "none" ? ` class="ad-title-anim-${ad.titleAnim}"` : ""}>${ad.title}</h2>
        <p class="deal-desc">${ad.desc || ""}</p>
        <button class="deal-cta" type="button">${ad.cta || "ดูโปรโมชัน"} →</button>
      </div>
    </article>`;
  }).join("");
}

// คลิกการ์ดดีล → นับคลิก + เปิดหน้าโปรโมชันเต็ม
listEl.addEventListener("click", (e) => {
  const card = e.target.closest(".deal-card");
  if (!card) return;
  const ad = ADS.find((a) => a.id === Number(card.dataset.id));
  if (!ad) return;
  recordAdClick(ad.id);
  location.href = `deal.html?id=${ad.id}`;
});

/* ===== แจ้งเตือน ===== */
const toastEl = document.getElementById("toast");
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

render();
