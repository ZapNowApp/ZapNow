/* ===== ร้านค้าปัจจุบัน + เมนู (จากชั้นข้อมูลร่วม menu-data.js) ===== */
let currentRestaurantId = Number(localStorage.getItem("sangkha-active-restaurant")) || 1;
let current = getRestaurant(currentRestaurantId);
let MENU = current.menu;
let activeCategory = "แนะนำ";

/* ===== โฆษณา (จากชั้นข้อมูลร่วม menu-data.js — จัดการได้ที่หน้า admin) ===== */
// เฉพาะโฆษณาที่กำลังออกอากาศ (ตามเวลาที่ตั้งใน admin — หมดเวลาแล้วหายจากสไลด์อัตโนมัติ)
let ADS = getLiveAds();
// สไลด์หน้าแรก: เฉพาะหมวดที่ตรงร้านที่ลูกค้าสนใจ (ติดตาม + ใกล้ตัว) — แท็บร้านอาหารยังเห็นโฆษณาทั้งหมด
let HOME_ADS = getHomeAds();
const homeAdRoot = document.getElementById("top-ad-home");

let adTick = 0; // หมุนโฆษณาใหม่ทุกครั้งที่เรนเดอร์

function adCard(n) {
  if (!ADS.length) return ""; // ไม่มีโฆษณาออกอากาศ → ไม่สอดโฆษณาในเมนู
  // ทำให้ดัชนีเป็นบวกเสมอ (กันเมนู 1 รายการคำนวณเป็น -1)
  const ad = ADS[(((adTick + n) % ADS.length) + ADS.length) % ADS.length];
  const isMotion = !!(ad.aiMotion && ad.aiImg); // โหมดเคลื่อนไหว (Ken Burns + แสงวิ่ง)
  return `
    <article class="ad-card${isMotion ? " ad-motion" : ""}" data-ad-id="${ad.id}" style="background:${ad.bg}${ad.aiImg ? `;background-image:url('${ad.aiImg}')` : ""}" role="note" aria-label="โฆษณา">
      ${isMotion ? `<div class="ad-kenburns" style="background-image:url('${ad.aiImg}')" aria-hidden="true"></div>
      <div class="ad-shine" aria-hidden="true"></div>` : ""}
      <span class="ad-badge">โฆษณา</span>
      ${ad.iconImg
        ? `<img class="ad-emoji ad-emoji-img" src="${ad.iconImg}" alt="" aria-hidden="true" />`
        : `<div class="ad-emoji" aria-hidden="true">${ad.emoji}</div>`}
      <div class="ad-body">
        <h3 class="ad-title${ad.titleAnim && ad.titleAnim !== "none" ? ` ad-title-anim-${ad.titleAnim}` : ""}">${ad.title}</h3>
        <p class="ad-desc">${ad.desc}</p>
        <button class="ad-cta" data-ad="${ad.title}">${ad.cta} →</button>
      </div>
    </article>`;
}

/* ===== โฆษณาบนสุด: สไลด์หมุนหลายชิ้น + นับถอยหลัง + คลิก ===== */
// ทุกสไลด์โฆษณาบนสุดของหน้า (หน้าแรก + แท็บร้านอาหาร) — หมุนพร้อมกันจากชุด ADS เดียวกัน
const topAdRoots = [...document.querySelectorAll(".top-ad")];

// ซ่อนคลิปวิดีโอที่โหลดไม่ได้ (ไฟล์ขาด/ลิงก์เสีย) → ใช้พื้นหลังไล่สีแทนทันที กัน "สไลด์ขาว/ดำ"
// readyState === 0 = ยังไม่มีข้อมูลคลิปเลย (โหลด 404) — networkState อย่างเดียวไม่พอ (มือถือบางรุ่นค้างที่ 2)
function hideBrokenVideos() {
  topAdRoots.forEach((root) => {
    root.querySelectorAll(".top-ad-slide").forEach((slide) => {
      const v = slide.querySelector(".top-ad-video");
      if (!v || v.style.display === "none") return;
      if (v.readyState === 0) {
        v.style.display = "none"; // ไฟล์คลิปไม่มี → ซ่อนวิดีโอ
        const controls = slide.querySelector("[data-video-controls]");
        if (controls) controls.hidden = true; // และซ่อนป้าย "คลิป" + ปุ่มเสียงด้วย
      }
    });
  });
}
const AD_DURATION_MS = 2 * 60 * 60 * 1000; // หมดใน 2 ชม.
const adEndTime = Date.now() + AD_DURATION_MS;
const prefersReducedMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
const SLIDE_SPEEDS = [3000, 5000, 8000, 10000]; // ความเร็วหมุนสไลด์ (ms)
let slideInterval = Number(localStorage.getItem("sangkha-ad-speed")) || 5000;
if (!SLIDE_SPEEDS.includes(slideInterval)) slideInterval = 5000;
let adIndex = 0;
let adAutoTimer = null;

function renderTopAdSlides() {
  topAdRoots.forEach((root) => {
  const list = root === homeAdRoot ? HOME_ADS : ADS;
  const slidesEl = root.querySelector(".top-ad-slides");
  const dotsEl = root.querySelector(".top-ad-dots");
  slidesEl.innerHTML = list.map((ad, i) => {
    // วิดีโอ: วางลิงก์เต็ม (https://...mp4/webm) ได้โดยตรง หรือใส่ชื่อไฟล์ในโฟลเดอร์ (ไม่ต้องเติม .mp4/.webm)
    const vid = String(ad.video || "").trim();
    const isUrl = /^https?:\/\//i.test(vid);
    const videoHtml = vid
      ? `<video class="top-ad-video" autoplay muted loop playsinline preload="auto" aria-hidden="true">
        ${isUrl ? `<source src="${vid}" />` : `<source src="${vid}.mp4" type="video/mp4" />
        <source src="${vid}.webm" type="video/webm" />`}
      </video>
      <div class="top-ad-video-controls" data-video-controls>
        <span class="top-ad-clip-badge">🎬 คลิป</span>
        <button type="button" class="top-ad-mute" aria-label="เปิดเสียง" aria-pressed="true">🔇</button>
      </div>`
      : "";
    const isMotion = !!(ad.aiMotion && ad.aiImg); // "เจนเป็นภาพเคลื่อนไหว" — ซูม/พาโนรามา + ตัวหนังสือเข้าฉาก + แสงวิ่ง
    return `
    <div class="top-ad-slide${i === 0 ? " active" : ""}${isMotion ? " ad-motion" : ""}" data-index="${i}" data-start="${ad.startAt || adEndTime}" data-end="${ad.endAt || adEndTime}" style="background:${ad.bg}${ad.aiImg ? `;background-image:url('${ad.aiImg}')` : ""}">
      ${videoHtml}
      ${isMotion ? `<div class="ad-kenburns" style="background-image:url('${ad.aiImg}')" aria-hidden="true"></div>
      <div class="ad-shine" aria-hidden="true"></div>` : ""}
      <div class="top-ad-scrim" aria-hidden="true"></div>
      ${ad.iconImg
        ? `<img class="top-ad-emoji top-ad-emoji-img" src="${ad.iconImg}" alt="" aria-hidden="true" />`
        : `<span class="top-ad-emoji" aria-hidden="true">${ad.emoji}</span>`}
      <div class="top-ad-content">
        <p class="top-ad-eyebrow">⚡ โปรเด็ดวันนี้</p>
        <h2 class="top-ad-title${ad.titleAnim && ad.titleAnim !== "none" ? ` ad-title-anim-${ad.titleAnim}` : ""}">${ad.title}</h2>
        <div class="top-ad-timer">
          หมดเขตใน <b class="ad-countdown">--:--:--</b>
          <span class="timer-bar"><span class="timer-bar-fill"></span></span>
        </div>
        <button class="top-ad-cta" type="button">${ad.cta} <span aria-hidden="true">→</span></button>
      </div>
      <span class="slide-progress" aria-hidden="true"><span class="slide-progress-fill"></span></span>
    </div>`;
  }).join("");

  dotsEl.innerHTML = list.map(
    (ad, i) =>
      `<button type="button" class="ad-dot${i === 0 ? " active" : ""}" data-index="${i}" role="tab" aria-label="สไลด์ ${i + 1}" aria-selected="${i === 0}"></button>`
  ).join("");

  root.querySelectorAll(".top-ad-video").forEach((v) => {
    const hide = () => {
      v.style.display = "none";
      const slide = v.closest(".top-ad-slide");
      const controls = slide && slide.querySelector("[data-video-controls]");
      if (controls) controls.hidden = true;
    };
    v.addEventListener("error", hide);
  });

  // ปุ่มปิดเสียงของสไลด์วิดีโอ — แตะเพื่อเปิด/ปิดเสียง (คลิปเริ่มต้นเป็นแบบปิดเสียงเพื่อให้ autoplay ได้)
  root.querySelectorAll(".top-ad-slide").forEach((slide) => {
    const video = slide.querySelector(".top-ad-video");
    const btn = slide.querySelector(".top-ad-mute");
    if (!video || !btn) return;
    const sync = () => {
      const muted = video.muted;
      btn.textContent = muted ? "🔇" : "🔊";
      btn.setAttribute("aria-label", muted ? "เปิดเสียง" : "ปิดเสียง");
      btn.setAttribute("aria-pressed", String(muted));
    };
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // กันไปเปิดหน้าโปรโมชันเมื่อกดปุ่มเสียง
      video.muted = !video.muted;
      if (!video.muted && video.paused) video.play().catch(() => {});
      sync();
    });
    sync();
  });
  });
  // เช็คซ้ำหลายรอบ: บางเบราว์เซอร์ไม่ยิง error event ให้ + มือถือบางรุ่น networkState ค้างที่ 2 ทั้งที่ไฟล์ 404
  // → ดูที่ readyState (ยังไม่มีข้อมูลคลิปจริง) แทน — กันสไลด์ขาว/ดำค้าง
  setTimeout(hideBrokenVideos, 2500);
  setTimeout(hideBrokenVideos, 5000);
}

function goToAdSlide(i) {
  const n = ADS.length;
  if (!n) return;
  const prevIndex = adIndex;
  adIndex = ((i % n) + n) % n; // วนรอบ + กันติดลบ

  topAdRoots.forEach((root) => {
    const list = root === homeAdRoot ? HOME_ADS : ADS;
    const nn = list.length;
    if (!nn) return;
    const idx = ((adIndex % nn) + nn) % nn; // สไลด์แต่ละจุดมีจำนวนไม่เท่ากัน → คิด index ตามชุดของตัวเอง
    const prev = ((prevIndex % nn) + nn) % nn;
    const slidesEl = root.querySelector(".top-ad-slides");
    const slides = [...root.querySelectorAll(".top-ad-slide")];
    slides.forEach((s) => s.classList.remove("active", "leaving", "from-left", "to-right"));
    void slidesEl.offsetWidth; // รีสตาร์ทแอนิเมชันให้เล่นใหม่ทุกครั้ง

    if (!prefersReducedMotion && prev !== idx) {
      const delta = (idx - prev + nn) % nn;
      const forward = delta <= nn / 2; // กด "ถัดไป" = เข้าจากซ้าย / กด "ก่อนหน้า" = เข้าจากขวา (สลับทิศ: หลัง→หน้า)
      slides[prev]?.classList.add("leaving", forward ? "to-right" : "");
      slides[idx]?.classList.add("active", forward ? "from-left" : "");
      slides[prev]?.addEventListener(
        "animationend",
        () => slides[prev]?.classList.remove("leaving", "from-left", "to-right"),
        { once: true }
      );
    } else {
      slides[idx]?.classList.add("active");
    }

    root.querySelectorAll(".ad-dot").forEach((d, di) => {
      d.classList.toggle("active", di === idx);
      d.setAttribute("aria-selected", di === idx);
    });
    // เล่นเฉพาะวิดีโอของสไลด์ที่แสดงอยู่ หยุดวิดีโออื่นทั้งหมด (วิดีโอที่โหลดไม่ได้ถูกซ่อนไว้แล้ว)
    root.querySelectorAll(".top-ad-video").forEach((v) => v.pause());
    const video = slides[idx]?.querySelector(".top-ad-video");
    if (video && video.style.display !== "none") video.play().catch(() => {});

    // เริ่มแถบความคืบหน้าของสไลด์ใหม่ (เต็มภายในเวลา slideInterval)
    root.querySelectorAll(".slide-progress-fill").forEach((f) => (f.style.animation = "none"));
    void slidesEl.offsetWidth;
    const progress = slides[idx]?.querySelector(".slide-progress-fill");
    if (progress && !prefersReducedMotion) {
      progress.style.animation = `slideProgress ${slideInterval}ms linear forwards`;
    }
  });
}

/* ===== หัวหดอัตโนมัติเมื่อเลื่อนลงไกล =====
   - เลื่อนลง > 140px → สไลด์ใหญ่ย่อเป็นแถบสไลด์บาง (ยังเห็นโฆษณาหมุนอยู่) เหลือช่องค้นหาเต็ม
   - เลื่อนขึ้นใกล้บนสุด → ขยายกลับเป็นสไลด์ใหญ่ */
const stickyHeads = [...document.querySelectorAll(".sticky-head")];

function onScrollCollapse() {
  stickyHeads.forEach((sh) => sh.classList.toggle("scrolled", window.scrollY > 140));
}

if (stickyHeads.length) {
  let collapseTicking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (collapseTicking) return;
      collapseTicking = true;
      requestAnimationFrame(() => {
        onScrollCollapse();
        collapseTicking = false;
      });
    },
    { passive: true }
  );
  onScrollCollapse();
}

function startAdAuto() {
  stopAdAuto();
  // หมุนวนตลอดเวลา (แม้เปิด reduced-motion — แค่นั้นจะไม่เล่นแอนิเมชันเลื่อน ไม่ใช่หยุดหมุน)
  adAutoTimer = setInterval(() => goToAdSlide(adIndex + 1), slideInterval);
}
function stopAdAuto() {
  clearInterval(adAutoTimer);
  adAutoTimer = null;
}

/* ===== ความเร็วหมุนสไลด์ (ปรับได้ + จำค่าไว้) ===== */
document.querySelectorAll(".top-ad-speed select").forEach((sel) => {
  sel.value = String(slideInterval);
  sel.addEventListener("change", () => {
    slideInterval = Number(sel.value);
    try { localStorage.setItem("sangkha-ad-speed", String(slideInterval)); } catch (_) { /* ไม่เป็นไร */ }
    goToAdSlide(adIndex); // รีสตาร์ทแถบความคืบหน้าด้วยความเร็วใหม่
    startAdAuto();
  });
});

/* นับถอยหลัง — แต่ละสไลด์นับตามเวลาสิ้นสุดของตัวเอง (โฆษณาที่ตั้งเวลา endAt จะนับถึงเวลานั้น) */
function tickAdTimers() {
  topAdRoots.forEach((root) => {
    root.querySelectorAll(".top-ad-slide").forEach((slide) => {
      const end = Number(slide.dataset.end) || adEndTime;
      const start = Number(slide.dataset.start) || end;
      const total = Math.max(1, end - start);
      const ms = Math.max(0, end - Date.now());
      const h = Math.floor(ms / 3.6e6);
      const m = Math.floor((ms % 3.6e6) / 6e4);
      const s = Math.floor((ms % 6e4) / 1000);
      const el = slide.querySelector(".ad-countdown");
      if (el) el.textContent = [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
      const bar = slide.querySelector(".timer-bar-fill");
      if (bar) bar.style.transform = `scaleX(${(ms / total).toFixed(4)})`;
    });
  });
}
setInterval(tickAdTimers, 1000);
tickAdTimers();

/* ลูกศร + จุด + คลิก + เมาส์ + ปัด — ผูกกับทุกสไลด์ (หน้าแรก + แท็บร้านอาหาร) */
let lastAdSwipeAt = 0; // เวลาปัดครั้งล่าสุด — กันเบราว์เซอร์มือถือยิง click จำลองตามหลังปัด
const AD_SWIPE_CLICK_GUARD_MS = 400;
topAdRoots.forEach((root) => {
  root.querySelector(".top-ad-arrow.prev").addEventListener("click", () => { goToAdSlide(adIndex - 1); startAdAuto(); });
  root.querySelector(".top-ad-arrow.next").addEventListener("click", () => { goToAdSlide(adIndex + 1); startAdAuto(); });
  root.querySelector(".top-ad-dots").addEventListener("click", (e) => {
    const dot = e.target.closest(".ad-dot");
    if (!dot) return;
    goToAdSlide(Number(dot.dataset.index));
    startAdAuto();
  });

  /* คลิกที่สไลด์ → เปิดหน้าโปรโมชันเต็มของโฆษณานั้น (มือถือ: ข้าม click จำลองที่ยิงตามหลังปัด 400ms) */
  root.addEventListener("click", (e) => {
    if (Date.now() - lastAdSwipeAt < AD_SWIPE_CLICK_GUARD_MS) return;
    const slide = e.target.closest(".top-ad-slide");
    if (!slide) return;
    const list = root === homeAdRoot ? HOME_ADS : ADS;
    const ad = list[Number(slide.dataset.index)];
    if (!ad) return;
    recordAdClick(ad.id);
    location.href = `deal.html?id=${ad.id}`;
  });

  /* หยุดหมุนอัตโนมัติเมื่อเมาส์ชี้ (จอใหญ่) */
  root.addEventListener("mouseenter", stopAdAuto);
  root.addEventListener("mouseleave", startAdAuto);

  /* ปัดนิ้วซ้าย/ขวาบนมือถือ */
  let adTouchX = null;
  root.addEventListener("touchstart", (e) => { adTouchX = e.touches[0].clientX; }, { passive: true });
  root.addEventListener("touchend", (e) => {
    if (adTouchX === null) return;
    const dx = e.changedTouches[0].clientX - adTouchX;
    if (Math.abs(dx) > 40) {
      lastAdSwipeAt = Date.now();
      dx < 0 ? goToAdSlide(adIndex + 1) : goToAdSlide(adIndex - 1);
      startAdAuto();
    }
    adTouchX = null;
  }, { passive: true });
});

renderTopAdSlides();
topAdRoots.forEach((root) => { root.hidden = (root === homeAdRoot ? HOME_ADS : ADS).length === 0; }); // ซ่อนแบนเนอร์เมื่อไม่มีโฆษณาออกอากาศ
if (ADS.length) { goToAdSlide(0); startAdAuto(); }

/* ===== รีเฟรชตามเวลาออกอากาศ: โฆษณาหมดเวลา / ถึงเวลาเริ่ม → อัปเดตสไลด์อัตโนมัติ (ทุก 30 วิ) ===== */
let lastLiveIds = ADS.map((a) => a.id).join(",");
let lastHomeIds = HOME_ADS.map((a) => a.id).join(",");

// คำนวณชุดสไลด์หน้าแรกใหม่ (ตามร้านที่ติดตาม/ใกล้ตัวที่เปลี่ยนไป) — คืน true ถ้าเปลี่ยน
function refreshHomeAds() {
  const next = getHomeAds();
  const ids = next.map((a) => a.id).join(",");
  if (ids === lastHomeIds) return false;
  lastHomeIds = ids;
  HOME_ADS = next;
  return true;
}

function refreshAdsBySchedule() {
  const live = getLiveAds();
  const ids = live.map((a) => a.id).join(",");
  const homeChanged = refreshHomeAds();
  if (ids !== lastLiveIds) {
    lastLiveIds = ids;
    ADS = live;
    adIndex = 0;
    renderTopAdSlides();
    topAdRoots.forEach((root) => { root.hidden = (root === homeAdRoot ? HOME_ADS : ADS).length === 0; });
    if (ADS.length) { goToAdSlide(0); startAdAuto(); }
    renderDealsRail();
  } else if (homeChanged) {
    renderTopAdSlides(); // ชุดรวมไม่เปลี่ยน แต่สไลด์หน้าแรกเปลี่ยน (ติดตาม/GPS) → วาดใหม่
    if (HOME_ADS.length) goToAdSlide(adIndex);
  }
}
setInterval(refreshAdsBySchedule, 30000);

/* ===== สถานะ ===== */
const cart = new Map(); // itemId -> qty

const $ = (sel) => document.querySelector(sel);

/* ===== เรนเดอร์เมนู ===== */
const menuList = $("#menu-list");

// กันหน้าเมนูว่าง: แท็บที่เลือกอยู่ไม่มีเมนู แต่ร้านมีเมนูหมวดอื่น → สลับแท็บให้อัตโนมัติ (เปิดร้านแล้วเห็นเมนูทันที)
function ensureActiveCategoryHasItems() {
  if (!MENU || !MENU.length) return;
  if (MENU.some((m) => m.category === activeCategory)) return;
  const first = CATEGORIES.find((c) => MENU.some((m) => m.category === c));
  if (!first) return;
  activeCategory = first;
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.category === first));
}

/* ===== แสดงเฉพาะแท็บหมวดที่ร้านนี้มีเมนูจริง (ร้านไหนไม่มีหมวดนั้น → ซ่อนปุ่ม) ===== */
function renderCategoryTabs() {
  const nav = document.querySelector(".category-tabs");
  if (!nav) return;
  let visible = 0;
  nav.querySelectorAll(".tab").forEach((tab) => {
    const has = MENU.some((m) => m.category === tab.dataset.category);
    tab.hidden = !has;
    if (has) visible++;
  });
  if (visible === 0) nav.hidden = true; // ร้านนี้ไม่มีหมวดในแท็บเลย → ซ่อนทั้งแถว
}

function renderMenu(category) {
  const items = MENU.filter((m) => m.category === category);
  const out = [];
  items.forEach((m, i) => {
    out.push(
      UI.FoodCard({
        id: m.id,
        img: m.img || m.imageUrl || "",
        emoji: m.emoji,
        color: m.color,
        name: m.name,
        desc: m.desc,
        price: m.price,
      })
    );
    // สอดโฆษณา: หลังครบทุก 2 เมนู (หรือหลังเมนูสุดท้าย ถ้ามีเมนูเดียว)
    if (items.length >= 2 ? (i + 1) % 2 === 0 : i === items.length - 1) {
      out.push(adCard(Math.floor((i + 1) / 2) - 1));
    }
  });
  menuList.innerHTML = out.join("");
  adTick++; // สลับไปโฆษณาชิ้นถัดไปในการเรนเดอร์ครั้งหน้า
}

/* แท็บหมวด */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    activeCategory = tab.dataset.category;
    renderMenu(activeCategory);
  });
});

/* ===== เลือกร้านค้า ===== */
const storeList = $("#store-list");

// ระยะทางที่แสดงในหน้าร้าน: มีพิกัดลูกค้า + พิกัดร้าน → คำนวณจริง (Haversine) / ไม่มี → ระยะทางที่ร้านกรอก
function customerDistanceKm(r) {
  return getRealDistanceKm(r, getCustomerGps());
}

/* ===== การเรียงชิปร้าน (ใกล้สุด / คะแนนสูงสุด — ลูกค้าเลือกเองได้) ===== */
const STORE_SORT_KEY = "sangkha-store-sort";

// คืนค่าการเรียงที่เลือก: "near" | "top" | null (ยังไม่เลือก)
function getStoreSort() {
  const v = localStorage.getItem(STORE_SORT_KEY);
  return v === "near" || v === "top" ? v : null;
}

function setStoreSort(mode) {
  try {
    if (mode === "near" || mode === "top") localStorage.setItem(STORE_SORT_KEY, mode);
    else localStorage.removeItem(STORE_SORT_KEY);
  } catch (_) { /* ไม่เป็นไร */ }
  renderStoreSwitcher();
}

// รีเฟรชระยะทางทุกจุดเมื่อตำแหน่งลูกค้าเปลี่ยน
function refreshDistances() {
  renderStoreSwitcher();
  renderRestaurant(getRestaurant(currentRestaurantId)); // ดึงร้านสดเสมอ (พิกัด/ระยะทางถนนอาจเพิ่งโหลด)
  if (searchInput && searchInput.value.trim() && !searchResultsEl.hidden) renderSearchResults(searchInput.value.trim());
}

function renderStoreSwitcher() {
  const sort = getStoreSort();
  const hasLoc = !!getCustomerGps();
  // ไม่เคยเลือก: มีตำแหน่ง → เรียงใกล้สุด (พฤติกรรมเดิม) / ไม่มี → ลำดับเดิม
  const active = sort || (hasLoc ? "near" : null);
  const rests = getRestaurants();
  if (active === "near") {
    rests.sort((a, b) => customerDistanceKm(a) - customerDistanceKm(b));
  } else if (active === "top") {
    rests.sort((a, b) => getEffectiveRating(b.id).rating - getEffectiveRating(a.id).rating || a.name.localeCompare(b.name, "th"));
  }
  const nearBtn = $("#sort-near");
  const topBtn = $("#sort-top");
  if (nearBtn) {
    nearBtn.classList.toggle("active", active === "near");
    nearBtn.setAttribute("aria-pressed", active === "near");
  }
  if (topBtn) {
    topBtn.classList.toggle("active", active === "top");
    topBtn.setAttribute("aria-pressed", active === "top");
  }
  storeList.innerHTML =
    rests
      .map(
        (r) => {
          const closed = storeAcceptingOrders(r) === false;
          const temp = getStoreClosed(r.id);
          const autoC = isAutoClosed(r.id);
          return `
      <button class="store-chip${r.id === currentRestaurantId ? " active" : ""}${closed ? " closed" : ""}" data-id="${r.id}" aria-pressed="${r.id === currentRestaurantId}">
        ${isRegisteredStore(r.id) ? `<span class="store-chip-new">ใหม่</span>` : ""}
        ${isFollowed(r.id) ? `<span class="store-chip-followed" aria-label="ติดตามแล้ว">🔖</span>` : ""}
        ${UI.imgBlock({ img: r.imageUrl || UI.storeImgUrl(r.name, r.cuisine), emoji: r.coverEmoji, color: r.coverBg, alt: r.name, fallback: "images/no-store.png", className: "store-emoji" })}
        <span class="store-info">
          <b>${r.name}</b>
          <small>★ ${getEffectiveRating(r.id).rating} · ${customerDistanceKm(r)} กม.</small>
          ${closed ? `<small class="store-chip-closed">🔴 ${temp ? "ปิดชั่วคราว" : autoC ? `ปิดอัตโนมัติ (ค้าง ${getPendingOrderCount(r.id)} ใบ)` : "ปิดอยู่"}</small>` : ""}
        </span>
      </button>`;
        }
      )
      .join("") +
    `
    <a class="store-chip store-chip-link" href="signup.html">
      <span class="store-emoji store-emoji-link" aria-hidden="true">＋</span>
      <span class="store-info">
        <b>สมัครร้านค้า</b>
        <small>เปิดร้านใหม่บน SangKha</small>
      </span>
    </a>`;
}

const btnFollow = $("#btn-follow");

function renderRestaurant(r) {
  const eff = getEffectiveRating(r.id);
  const coverEl = $("#restaurant-cover");
  if (coverEl) {
    // แทรกภาพลงบนแบนเนอร์ (ไม่ใช้ innerHTML = ล้างปุ่มใช้ตำแหน่งที่อยู่ใน cover)
    const prev = coverEl.querySelector(".restaurant-cover-img");
    if (prev) prev.remove();
    coverEl.insertAdjacentHTML("afterbegin", UI.imgBlock({ img: r.imageUrl || UI.storeImgUrl(r.name, r.cuisine), emoji: r.coverEmoji, color: r.coverBg, alt: r.name, fallback: "images/no-store.png", className: "restaurant-cover-img" }));
  }
  $("#restaurant-name").childNodes[0].textContent = r.name;
  $("#restaurant-new-tag").hidden = !isRegisteredStore(r.id);
  $("#restaurant-cuisine").textContent = r.cuisine;
  $("#restaurant-rating").textContent = eff.rating;
  $("#restaurant-reviews").textContent = `(${eff.reviews.toLocaleString("th-TH")} รีวิว)`;
  $("#restaurant-hours").textContent = `🕐 ${r.open} – ${r.close} น.`;
  renderStoreStatus(r);
  const useRealKm = restaurantHasGps(r) && getCustomerGps();
  $("#restaurant-distance").textContent = `📍 ${customerDistanceKm(r)} กม.${useRealKm ? " (GPS)" : ""}`;
  const delBase = getDeliverySettings(r.id) ? getDeliverySettings(r.id).base : (r.deliveryBase !== undefined ? r.deliveryBase : r.deliveryFee);
  const delPerKm = getDeliverySettings(r.id) ? getDeliverySettings(r.id).perKm : (r.deliveryPerKm !== undefined ? r.deliveryPerKm : DEFAULT_DELIVERY_PER_KM);
  $("#restaurant-tag-delivery").textContent = `🛵 ค่าส่ง ${delBase}฿ + ${delPerKm}฿/กม. · ส่งฟรีขั้นต่ำ ฿${r.freeDeliveryMin}`;
  $("#restaurant-tag-time").textContent = `จัดส่ง ${r.deliveryTime}`;
  document.title = `${r.name} — ร้านอาหาร`;
  renderFollowBtn(r.id);
}

function renderFollowBtn(id) {
  const followed = isFollowed(id);
  btnFollow.classList.toggle("active", followed);
  btnFollow.setAttribute("aria-pressed", followed);
  btnFollow.title = followed ? "เลิกติดตาม" : "ติดตามร้าน";
}

// ป้ายสถานะเปิด/ปิดตามเวลาจริง + ปิดชั่วคราว (อัปเดตทุก 30 วิ + ทุกครั้งที่สลับร้าน/วาดหน้า)
function isStoreOpen(r) {
  return r ? storeAcceptingOrders(r) : null;
}
function storeClosedLabel(r) {
  if (getStoreClosed(r.id)) return "ปิดชั่วคราว";
  if (isAutoClosed(r.id)) return "ปิดอัตโนมัติ";
  return "ปิดอยู่";
}
function renderStoreStatus(r) {
  const el = $("#restaurant-status");
  if (!el) return;
  const st = isStoreOpen(r);
  const temp = getStoreClosed(r.id);
  const auto = isAutoClosed(r.id);
  const autoS = getAutoCloseSetting(r.id);
  el.textContent = st === null ? "" : temp ? "🔴 ปิดชั่วคราว" : auto ? `🔴 ปิดอัตโนมัติ (ค้าง ${getPendingOrderCount(r.id)} ใบ)` : st ? "🟢 เปิดอยู่" : "🔴 ปิดอยู่";
  el.classList.toggle("open", st === true);
  el.classList.toggle("closed", st === false);
  if (temp) el.title = temp.reason ? `ปิดชั่วคราว — ${temp.reason}` : "ปิดชั่วคราวโดยร้าน";
  else if (auto) el.title = `ร้านปิดอัตโนมัติเพราะออเดอร์ค้างถึง ${autoS.threshold} ใบ — เปิดรับเองเมื่อเคลียร์แล้ว`;
  else el.title = "";
}

btnFollow.addEventListener("click", () => {
  const followed = toggleFollow(currentRestaurantId);
  renderFollowBtn(currentRestaurantId);
  renderStoreSwitcher();
  refreshHomeAds(); // ร้านที่ติดตามเปลี่ยน → สไลด์หน้าแรกกรองหมวดใหม่ทันที
  showToast(followed ? `🔖 ติดตามร้าน "${current.name}" แล้ว` : `เลิกติดตาม "${current.name}" แล้ว`);
});

// เปิดให้หน้า (customer-tabs.js) เรียกได้เมื่อเข้าแท็บหน้าแรก — สไลด์หน้าแรกกรองตามหมวดล่าสุด
window.refreshHomeAds = refreshHomeAds;

function switchRestaurant(id) {
  if (id === currentRestaurantId) return;
  selectedCoupon = null; // คูปองที่เลือกไว้รีเซ็ตเมื่อสลับร้าน
  saveCart();
  currentRestaurantId = id;
  try { localStorage.setItem("sangkha-active-restaurant", id); } catch (_) { /* ไม่เป็นไร */ }
  current = getRestaurant(id);
  MENU = current.menu;
  cart.clear();
  loadCart();
  renderRestaurant(current);
  renderStoreSwitcher();
  ensureActiveCategoryHasItems();
  renderCategoryTabs();
  renderMenu(activeCategory);
  renderCart();
  renderOrderTracker();
  renderPublicReviews();
  if (isStoreOpen(current) === false) showToast(`🔴 ${current.name} ${storeClosedLabel(current)}ตอนนี้ — ดูเมนูได้ แต่ยังสั่งซื้อไม่ได้`);
  else showToast(`สลับไปร้าน "${current.name}" แล้ว`);
}

storeList.addEventListener("click", (e) => {
  const chip = e.target.closest(".store-chip");
  if (chip) switchRestaurant(Number(chip.dataset.id));
});

/* ===== ตะกร้า ===== */
const cartItemsEl = $("#cart-items");
const cartCountEl = $("#cart-count");
const subtotalEl = $("#cart-subtotal");
const deliveryEl = $("#cart-delivery");
const checkoutBtn = $("#checkout-btn");
const cartPanel = $("#cart-panel");
const cartFab = $("#cart-fab");
const fabBadge = $("#fab-badge");
const cartOverlay = $("#cart-overlay");
const toastEl = $("#toast");

function fmt(n) {
  return "฿" + n.toLocaleString("th-TH");
}

let selectedCoupon = null; // คูปองที่ลูกค้าเลือกใช้ (เลือกในฟอร์มสั่งซื้อ)
let pendingGps = null; // พิกัด GPS ที่ปักหมุดจากปุ่ม "📍 ใช้ตำแหน่งปัจจุบัน" (บันทึกติดออเดอร์)

function cartSummary() {
  let subtotal = 0;
  for (const [id, qty] of cart) subtotal += MENU.find((m) => m.id === id).price * qty;
  // ระยะทางจริง (Haversine จากพิกัดร้าน ↔ พิกัด GPS ที่ปักหมุด) — ไม่มีพิกัดใช้ distanceKm ของร้าน
  const distanceKm = subtotal === 0 ? 0 : getRealDistanceKm(current, pendingGps);
  const delivery = subtotal === 0 ? 0 : getDeliveryFee(current, subtotal, distanceKm);
  let discount = 0;
  if (selectedCoupon && subtotal > 0 && subtotal >= selectedCoupon.minOrder) {
    if (selectedCoupon.discountType === "percent") discount = Math.round((subtotal * selectedCoupon.discountValue) / 100);
    else if (selectedCoupon.discountType === "baht") discount = Math.min(selectedCoupon.discountValue, subtotal);
    else if (selectedCoupon.discountType === "delivery") discount = delivery;
  }
  // 💸 ค่าแพลตฟอร์ม = อัตราค่าธรรมเนียมของร้านนี้ % ของ (ยอดอาหาร − ส่วนลด) — ลูกค้าเห็นเป็นรายการแยก
  const platformFee = subtotal === 0 ? 0 : Math.round(((subtotal - discount) * getRestaurantFeeRate(currentRestaurantId)) / 100);
  return { subtotal, delivery, discount, platformFee, distanceKm, total: Math.max(0, subtotal + delivery - discount + platformFee) };
}

// โหลดระยะทางถนนจริง (OSRM) สำหรับค่าส่งของร้านนี้ — โหลดเสร็จแล้ววาดค่าส่ง/ระยะทางใหม่ให้ตรงกับแผนที่
function warmRoadDistance() {
  if (!current || !pendingGps || typeof pendingGps.lat !== "number" || !restaurantHasGps(current)) return;
  const from = restaurantGps(current);
  const to = { lat: pendingGps.lat, lng: pendingGps.lng };
  if (getCachedRoadRoute(from, to)) return; // มีแล้ว
  loadRoadRoute(from, to).then((val) => {
    if (val && val.pts) {
      renderCart();
      if (!checkoutModal.hidden) renderCheckoutSummary();
      refreshDistances();
      renderStoreSwitcher();
    }
  });
}

// โหลดระยะทางถนนจริง (OSRM) ของทุกร้านเป็นพื้นหลังเมื่อลูกค้าใช้ตำแหน่ง — โหลดเสร็จวาดชิปร้าน/หัวร้าน/ผลค้นหาใหม่ (ให้ตรงกับค่าส่งและแผนที่)
function warmAllRoadDistances() {
  const cgps = getCustomerGps();
  if (!cgps) return;
  const to = { lat: cgps.lat, lng: cgps.lng };
  getRestaurants().forEach((r) => {
    if (!restaurantHasGps(r)) return; // ร้านไม่มีพิกัดจริง → ใช้ distanceKm ที่กรอก
    const from = restaurantGps(r);
    if (getCachedRoadRoute(from, to)) return; // โหลดเสร็จแล้ว
    loadRoadRoute(from, to).then((val) => {
      if (!val || !val.pts) return;
      // ระยะทางของชิปร้าน/หัวร้าน/ผลค้นหาเปลี่ยน → วาดใหม่ (เรียงใกล้สุดตามระยะถนนจริงด้วย)
      renderStoreSwitcher();
      renderRestaurant(getRestaurant(currentRestaurantId));
      renderCart();
      if (!checkoutModal.hidden) renderCheckoutSummary();
      if (searchInput && searchInput.value.trim() && !searchResultsEl.hidden) renderSearchResults(searchInput.value.trim());
    });
  });
}

function renderCart() {
  const hasItems = cart.size > 0;
  warmRoadDistance(); // ค่าส่งตามระยะทางถนนจริง (อัปเดตเมื่อโหลดเสร็จ)

  cartItemsEl.innerHTML = hasItems
    ? [...cart.entries()]
        .map(([id, qty]) => {
          const m = MENU.find((x) => x.id === id);
          return `
          <div class="cart-row">
            <div class="cart-row-info">
              <div class="cart-row-name">${m.name}</div>
              <div class="cart-row-price">฿${m.price} × ${qty} = <b>฿${m.price * qty}</b></div>
            </div>
            <div class="qty-control">
              <button data-action="dec" data-id="${m.id}" aria-label="ลด${m.name}">−</button>
              <span class="qty">${qty}</span>
              <button data-action="inc" data-id="${m.id}" aria-label="เพิ่ม${m.name}">+</button>
            </div>
          </div>`;
        })
        .join("")
    : `<div class="cart-empty"><span class="cart-empty-icon">🧺</span><p>ตะกร้ายังว่างอยู่<br />เลือกเมนูอร่อย ๆ ได้เลย</p></div>`;

  const { subtotal, delivery, discount, platformFee, total, distanceKm } = cartSummary();
  const count = [...cart.values()].reduce((a, b) => a + b, 0);

  cartCountEl.textContent = count === 0 ? "0 รายการ" : `${count} รายการ`;
  subtotalEl.textContent = fmt(subtotal);
  deliveryEl.textContent = subtotal === 0 ? "—" : delivery === 0 ? "ฟรี" : fmt(delivery);
  const delLabel = $("#cart-delivery-label");
  if (delLabel) delLabel.textContent = subtotal === 0 ? "ค่าจัดส่ง (ตามระยะทาง)" : `ค่าจัดส่ง (${distanceKm} กม.)`;
  const pfRow = $("#cart-platform-fee");
  pfRow.hidden = subtotal === 0;
  if (subtotal > 0) {
    $("#cart-platform-fee-rate").textContent = `💸 ค่าแพลตฟอร์ม (${getRestaurantFeeRate(currentRestaurantId)}%)`;
    $("#cart-platform-fee-value").textContent = fmt(platformFee);
  }
  const discountRow = $("#cart-discount");
  discountRow.hidden = discount <= 0;
  if (discount > 0) $("#cart-discount-value").textContent = `−${fmt(discount)}`;
  const closed = !isStoreOpen(current);
  checkoutBtn.disabled = !hasItems || closed;
  checkoutBtn.textContent = closed ? `🔴 ร้าน${storeClosedLabel(current)}` : `สั่งซื้อ ${fmt(total)}`;

  fabBadge.textContent = count;
  cartFab.classList.toggle("hidden", count === 0);
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

function cartKey() {
  return `sangkha-cart-${currentRestaurantId}`;
}

function saveCart() {
  try {
    localStorage.setItem(cartKey(), JSON.stringify([...cart.entries()]));
  } catch (_) { /* ไม่เป็นไร */ }
}

function loadCart() {
  cart.clear();
  try {
    const raw = localStorage.getItem(cartKey());
    if (!raw) return;
    for (const [id, qty] of JSON.parse(raw)) {
      if (MENU.some((m) => m.id === id)) cart.set(id, qty);
    }
  } catch (_) { /* ไม่เป็นไร */ }
}

/* ===== เหตุการณ์ ===== */
menuList.addEventListener("click", (e) => {
  const adEl = e.target.closest(".ad-card");
  if (adEl) {
    const ad = ADS.find((a) => a.id === Number(adEl.dataset.adId));
    if (!ad) return;
    recordAdClick(ad.id);
    openDealModal(ad); // ป๊อปอัปกลางจอ — แถบเมนูล่างไม่หาย
    return;
  }
  const btn = e.target.closest(".btn-add");
  if (!btn) return;
  if (!isStoreOpen(current)) {
    showToast(`🔴 ${current.name} ${storeClosedLabel(current)}ตอนนี้ — กลับมาใหม่ช่วงเวลาเปิด`);
    return;
  }
  const id = Number(btn.dataset.id);
  cart.set(id, (cart.get(id) || 0) + 1);
  saveCart();
  renderCart();
  const item = MENU.find((m) => m.id === id);
  showToast(`✓ เพิ่ม "${item.name}" ลงตะกร้าแล้ว`);
});

cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const qty = cart.get(id) || 0;
  if (btn.dataset.action === "inc") cart.set(id, qty + 1);
  else if (qty <= 1) cart.delete(id);
  else cart.set(id, qty - 1);
  saveCart();
  renderCart();
});

function openCart() {
  cartPanel.classList.add("open");
  cartOverlay.hidden = false;
}
function closeCart() {
  cartPanel.classList.remove("open");
  cartOverlay.hidden = true;
}

cartFab.addEventListener("click", openCart);
cartOverlay.addEventListener("click", closeCart);
const cartCloseBtn = $("#cart-close");
if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCart);

/* ===== ฟอร์มสั่งซื้อ (checkout) — บันทึกออเดอร์เข้าระบบ ===== */
const checkoutModal = $("#checkout-modal");
const checkoutOverlay = $("#checkout-overlay");

function renderCouponSelect() {
  const sel = $("#co-coupon");
  const { subtotal } = cartSummary();
  const usable = getUsableCoupons().filter((c) => subtotal >= c.minOrder);
  sel.innerHTML =
    `<option value="">— ไม่ใช้คูปอง —</option>` +
    usable
      .map((c) => `<option value="${c.code}">${c.emoji} ${c.code} · ${couponValueLabel(c)}${c.minOrder ? ` (ขั้นต่ำ ${c.minOrder} บาท)` : ""}</option>`)
      .join("");
  sel.disabled = usable.length === 0;
  if (selectedCoupon) {
    const still = usable.find((c) => c.code === selectedCoupon.code);
    if (still) sel.value = selectedCoupon.code;
    else selectedCoupon = null;
  }
}

function openCheckout() {
  renderCouponSelect();
  renderCheckoutSummary();
  checkoutModal.hidden = false;
  checkoutOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => $("#co-name").focus(), 50);
}

function closeCheckout() {
  checkoutModal.hidden = true;
  checkoutOverlay.hidden = true;
  document.body.style.overflow = "";
}

function renderCheckoutSummary() {
  const { subtotal, delivery, discount, platformFee, total, distanceKm } = cartSummary();
  const rate = getRestaurantFeeRate(currentRestaurantId);
  $("#co-summary").innerHTML = `
    <div class="co-summary-row"><span>รวมอาหาร</span><b>${fmt(subtotal)}</b></div>
    <div class="co-summary-row"><span>ค่าจัดส่ง (${distanceKm || 0} กม.)</span><b>${delivery === 0 ? "ฟรี" : fmt(delivery)}</b></div>
    <div class="co-summary-row"><span>💸 ค่าแพลตฟอร์ม (${rate}%)</span><b>${fmt(platformFee)}</b></div>
    ${discount > 0 ? `<div class="co-summary-row co-summary-discount"><span>🎟️ ส่วนลดคูปอง</span><b>−${fmt(discount)}</b></div>` : ""}
    <div class="co-summary-row co-summary-total"><span>ยอดรวมทั้งสิ้น</span><b>${fmt(total)}</b></div>`;
}

$("#co-coupon").addEventListener("change", () => {
  const code = $("#co-coupon").value;
  selectedCoupon = code ? getUsableCoupons().find((c) => c.code === code) || null : null;
  renderCheckoutSummary();
  renderCart();
});

checkoutBtn.addEventListener("click", () => {
  if (cart.size === 0) return;
  if (!isStoreOpen(current)) {
    showToast(`🔴 ${current.name} ${storeClosedLabel(current)}ตอนนี้ — ยังสั่งซื้อไม่ได้`);
    return;
  }
  closeCart();
  openCheckout();
});

$("#co-cancel").addEventListener("click", closeCheckout);
$("#checkout-close").addEventListener("click", closeCheckout);
checkoutOverlay.addEventListener("click", closeCheckout);

/* ===== ปุ่มสลับการเรียงชิปร้าน (📍 ใกล้สุด / ⭐ คะแนนสูงสุด) ===== */
$("#sort-near").addEventListener("click", () => setStoreSort("near"));
$("#sort-top").addEventListener("click", () => setStoreSort("top"));

/* ===== ปุ่ม "📍 ใช้ตำแหน่งของฉัน" — แสดงระยะทางร้านจริงทุกที่ ===== */
$("#btn-locate-me").addEventListener("click", () => {
  const btn = $("#btn-locate-me");
  if (!navigator.geolocation) {
    showToast("⚠️ เบราว์เซอร์นี้ไม่รองรับ GPS");
    return;
  }
  btn.disabled = true;
  btn.textContent = "📍 กำลังหาตำแหน่ง...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setCustomerGps({ lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) });
      btn.disabled = false;
      btn.textContent = "📍 ใช้ตำแหน่งของฉัน";
      refreshDistances();
      showToast(`📍 ใช้ตำแหน่งของคุณแล้ว — ระยะทางร้านทั้งหมดคำนวณจากพิกัดจริง`);
    },
    (err) => {
      btn.disabled = false;
      btn.textContent = "📍 ใช้ตำแหน่งของฉัน";
      showToast(err && err.code === 1 ? "⚠️ ไม่อนุญาตให้ใช้ตำแหน่ง — เปิด GPS แล้วลองอีกครั้ง" : "⚠️ หาตำแหน่งไม่สำเร็จ — ลองใหม่อีกครั้ง");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
});

/* ===== ปักหมุด GPS อัตโนมัติ (ใช้ตำแหน่งปัจจุบันของลูกค้า → เติมที่อยู่ + เก็บพิกัด) ===== */
$("#co-gps").addEventListener("click", () => {
  const btn = $("#co-gps");
  if (!navigator.geolocation) {
    showToast("⚠️ เบราว์เซอร์นี้ไม่รองรับ GPS");
    return;
  }
  btn.disabled = true;
  btn.textContent = "📍 กำลังหาตำแหน่ง...";
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      pendingGps = { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) };
      // ลองแปลงพิกัดเป็นที่อยู่จริง (OpenStreetMap Nominatim — ไม่ต้องใช้คีย์) ถ้าไม่ได้ใช้พิกัดแทน
      let addr = `📍 GPS: ${pendingGps.lat}, ${pendingGps.lng}`;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pendingGps.lat}&lon=${pendingGps.lng}&accept-language=th`);
        if (res.ok) {
          const j = await res.json();
          if (j.display_name) addr = j.display_name;
        }
      } catch (_) { /* ไม่เป็นไร ใช้พิกัดแทน */ }
      $("#co-address").value = addr;
      btn.disabled = false;
      btn.textContent = "📍 ใช้ตำแหน่งปัจจุบันของฉัน (GPS)";
      // ปักหมุดแล้วระยะทางจริงเปลี่ยน → คำนวณค่าส่ง/คูปองใหม่ + จำตำแหน่งไว้ใช้แสดงระยะทางร้านจริง
      setCustomerGps(pendingGps);
      warmRoadDistance();
      warmAllRoadDistances();
      renderCart();
      if (!checkoutModal.hidden) renderCheckoutSummary();
      refreshDistances();
      showToast(`📍 ปักหมุดตำแหน่งแล้ว (${pendingGps.lat}, ${pendingGps.lng}) — ค่าส่งคำนวณตามระยะทางจริง ${getRealDistanceKm(current, pendingGps)} กม.`);
    },
    (err) => {
      btn.disabled = false;
      btn.textContent = "📍 ใช้ตำแหน่งปัจจุบันของฉัน (GPS)";
      showToast(err && err.code === 1 ? "⚠️ ไม่อนุญาตให้ใช้ตำแหน่ง — เปิด GPS แล้วลองอีกครั้ง" : "⚠️ หาตำแหน่งไม่สำเร็จ — ลองใหม่อีกครั้ง");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!historyModal.hidden) closeHistory();
  else if (!checkoutModal.hidden) closeCheckout();
  else if (searchInput.value) clearSearch();
});

$("#co-submit").addEventListener("click", () => {
  if (!isStoreOpen(current)) {
    showToast(`🔴 ${current.name} ${storeClosedLabel(current)}ตอนนี้ — สั่งซื้อไม่สำเร็จ กลับมาใหม่ช่วงเวลาเปิด`);
    return;
  }
  const name = $("#co-name").value.trim();
  const phone = $("#co-phone").value.trim();
  const address = $("#co-address").value.trim();
  if (!name) { showToast("⚠️ กรุณากรอกชื่อผู้รับ"); $("#co-name").focus(); return; }
  if (!phone) { showToast("⚠️ กรุณากรอกเบอร์โทร"); $("#co-phone").focus(); return; }
  if (!address) { showToast("⚠️ กรุณากรอกที่อยู่จัดส่ง"); $("#co-address").focus(); return; }

  const { subtotal, delivery, discount, platformFee, total, distanceKm } = cartSummary();
  const items = [...cart.entries()].map(([id, qty]) => {
    const m = MENU.find((x) => x.id === id);
    return { id: m.id, name: m.name, price: m.price, qty, emoji: m.emoji, img: m.img || "" };
  });

  const order = addOrder({
    restaurantId: currentRestaurantId,
    customer: {
      name,
      phone,
      address,
      note: $("#co-note").value.trim(),
    },
    gps: pendingGps || null,
    distanceKm,
    items,
    subtotal,
    delivery,
    discount,
    platformFee,
    couponCode: discount > 0 && selectedCoupon ? selectedCoupon.code : "",
    total,
  });
  if (discount > 0 && selectedCoupon) markCouponUsed(selectedCoupon.code);
  selectedCoupon = null;

  showToast(`🎉 สั่งซื้อสำเร็จ! ออเดอร์ #${order.id} รวม ${fmt(total)} — ร้านกำลังเตรียมของ`);
  setActiveOrder(order);
  renderOrderTracker();
  cart.clear();
  saveCart();
  renderCart();
  closeCheckout();
  $("#co-name").value = "";
  $("#co-phone").value = "";
  $("#co-address").value = "";
  $("#co-note").value = "";
  pendingGps = null;
});

/* ===== สถานะออเดอร์สด (ติดตามหลังสั่งซื้อ — อัปเดตเมื่อร้านขยับสถานะที่ dashboard) ===== */
const orderTrackerEl = $("#order-tracker");
let trackerSignature = ""; // กันเรนเดอร์ซ้ำเมื่อสถานะไม่เปลี่ยน

const STATUS_STEPS = [
  { key: "ใหม่", icon: "📥", label: "ได้รับออเดอร์" },
  { key: "กำลังเตรียม", icon: "👨‍🍳", label: "กำลังเตรียม" },
  { key: "กำลังจัดส่ง", icon: "🛵", label: "กำลังจัดส่ง" },
  { key: "เสร็จสิ้น", icon: "✅", label: "ถึงมือแล้ว" },
];

function activeOrderKey() {
  return `sangkha-active-order-${currentRestaurantId}`;
}

// ออเดอร์ที่ติดตามอยู่ของร้านนี้ (ถ้ามี)
function getActiveOrder() {
  try {
    const raw = localStorage.getItem(activeOrderKey());
    if (!raw) return null;
    const orderId = Number(JSON.parse(raw));
    const order = getOrders().find((o) => o.id === orderId && o.restaurantId === currentRestaurantId);
    return order || null;
  } catch (_) {
    return null;
  }
}

function setActiveOrder(order) {
  try {
    localStorage.setItem(activeOrderKey(), JSON.stringify(order.id));
  } catch (_) { /* ไม่เป็นไร */ }
}

function clearActiveOrder() {
  try {
    localStorage.removeItem(activeOrderKey());
  } catch (_) { /* ไม่เป็นไร */ }
  trackerSignature = "__cleared__"; // บังคับให้ renderOrderTracker ทำงาน (กันค่าเท่าเดิมถูกข้าม)
  renderOrderTracker();
}

function renderOrderTracker() {
  const order = getActiveOrder();
  // signature รวมสถานะ + ขั้นไรเดอร์ + มีรีวิวแล้วหรือยัง (กันวาดซ้ำเมื่อไม่มีอะไรเปลี่ยน)
  const sig = order ? `${order.id}|${order.status}|${order.riderStage || ""}|${getReviewForOrder(order.id, order.restaurantId) ? "r" : "n"}` : "";
  if (sig === trackerSignature) return;
  trackerSignature = sig;

  if (!order) {
    orderTrackerEl.hidden = true;
    orderTrackerEl.innerHTML = "";
    return;
  }

  const rest = getRestaurant(order.restaurantId);
  // สถานะ พร้อมส่ง = อาหารเสร็จแล้ว รอไรเดอร์ → อยู่ในขั้นเดียวกับ กำลังเตรียม
  const STEP_INDEX = { "ใหม่": 0, "กำลังเตรียม": 1, "พร้อมส่ง": 1, "กำลังจัดส่ง": 2, "เสร็จสิ้น": 3 };
  const stepIndex = STEP_INDEX[order.status] ?? -1;
  const done = order.status === "เสร็จสิ้น";
  const cancelled = order.status === "ยกเลิก";
  const active = ["ใหม่", "กำลังเตรียม", "พร้อมส่ง", "กำลังจัดส่ง"].includes(order.status);

  orderTrackerEl.className = "order-tracker" + (done ? " tracker-done" : "") + (cancelled ? " tracker-cancelled" : "");
  orderTrackerEl.hidden = false;
  orderTrackerEl.innerHTML = `
    <div class="tracker-head">
      <div>
        <b>📦 ออเดอร์ #${order.id} · ${rest.name}</b>
        <span class="tracker-sub">${
          done ? "ได้รับอาหารแล้ว ขอบคุณที่ใช้บริการ 🎉" :
          cancelled ? "ออเดอร์นี้ถูกยกเลิกโดยร้านค้า" :
          order.status === "พร้อมส่ง" ? "อาหารพร้อมแล้ว รอไรเดอร์มารับ 🛵" :
          (order.riderName && order.status === "กำลังจัดส่ง")
            ? riderStageSub(order)
            : `กำลังติดตามแบบสด · รวม ${fmt(order.total)} · จัดส่ง ${rest.deliveryTime}`
        }</span>
      </div>
      <button class="tracker-close" type="button" aria-label="ปิดการติดตามออเดอร์">✕</button>
    </div>
    ${cancelled ? "" : `
    <div class="tracker-steps" role="list" aria-label="ขั้นตอนสถานะออเดอร์">
      ${STATUS_STEPS.map((s, i) => `
        <div class="tracker-step${i <= stepIndex ? " active" : ""}${i === stepIndex ? " current" : ""}" role="listitem">
          <div class="tracker-step-dot" aria-hidden="true">${i <= stepIndex ? s.icon : "○"}</div>
          <span class="tracker-step-label">${s.label}</span>
        </div>`).join("")}
    </div>`}
    ${order.status === "กำลังจัดส่ง" && order.riderName ? `
    <div class="tracker-map" id="tracker-map">
      <div class="tracker-map-head">📍 ${escapeHtml(order.riderName)} ${riderMapStageText(order)} — แผนที่จริงอัปเดตสด</div>
      <div id="tracker-map-leaflet" class="tracker-map-leaflet" aria-label="แผนที่จริงตำแหน่งไรเดอร์ (OpenStreetMap)"></div>
      <div class="tracker-map-eta" id="tracker-map-eta"></div>
    </div>` : ""}
    ${done ? ratingBlock(order) : ""}
    ${done || cancelled ? `
    <div class="tracker-foot">
      <span>${done ? "✅ ออเดอร์เสร็จสิ้น" : "⚠️ ออเดอร์ถูกยกเลิก"}</span>
      <button class="tracker-action" type="button" data-action="dismiss">${done ? "เรียบร้อย ✓" : "ปิดการติดตาม"}</button>
    </div>` : `
    <div class="tracker-foot">
      <span>${active ? "อัปเดตอัตโนมัติแบบสด" : ""}</span>
    </div>`}
  `;
}

orderTrackerEl.addEventListener("click", (e) => {
  if (e.target.closest(".tracker-close") || e.target.closest('[data-action="dismiss"]')) {
    clearActiveOrder();
  }
});

// อัปเดตสด: แท็บ dashboard เปลี่ยนสถานะ → เหตุการณ์ storage เกิดที่แท็บนี้
window.addEventListener("storage", (e) => {
  if (e.key === ORDERS_KEY || (e.key && e.key.startsWith("sangkha-active-order-"))) {
    renderOrderTracker();
  }
  if (e.key === ORDERS_KEY && !historyModal.hidden) renderHistory();
  if (e.key === REVIEWS_KEY) renderPublicReviews();
  if (e.key === STORE_EDITS_KEY || e.key === STORE_CLOSED_KEY || e.key === AUTO_CLOSE_KEY || e.key === ORDERS_KEY) {
    // แอดมิน/ร้านแก้ข้อมูลร้าน, ปิดชั่วคราว, หรือออเดอร์ค้างเปลี่ยน (แท็บอื่น) → วาดใหม่ทันที
    current = getRestaurant(currentRestaurantId);
    MENU = current.menu;
    renderRestaurant(current);
    renderStoreSwitcher();
    ensureActiveCategoryHasItems();
    renderCategoryTabs();
    renderMenu(activeCategory);
    renderCart();
  }
});
// สำรอง: เช็คซ้ำทุก 3 วิ
setInterval(renderOrderTracker, 3000);
// สถานะเปิด/ปิดร้านอัปเดตตามเวลาจริง (ทุก 30 วิ — badge, ชิปร้าน, ปุ่มสั่งซื้อ) — ดึงข้อมูลล่าสุดเสมอ (แอดมินแก้วลาเปิด-ปิดก็สะท้อน)
setInterval(() => {
  const fresh = getRestaurant(currentRestaurantId);
  renderStoreStatus(fresh);
  renderStoreSwitcher();
  renderCart();
}, 30000);

/* ===== แผนที่จริงตำแหน่งไรเดอร์ (Leaflet + OpenStreetMap — ไม่ต้องใช้คีย์) ===== */

// ข้อมูลเส้นทาง: 🏪 ร้าน (พิกัดจริงถ้ามี) → 🏠 บ้านคุณ (พิกัด GPS ที่ปักหมุดถ้ามี) — ไรเดอร์ขยับตามขั้นที่กด
function trackerMapData(order) {
  const rest = getRestaurant(order.restaurantId);
  const start = restaurantGps(rest);
  const end = orderHomeGps(order);
  const path = routeGpsPoints(start, end, 4);
  const totalKm = Math.max(pathKm(path), 0.15);
  const legMs = (totalKm / (RIDER_SPEED_KMH / 60)) * 60000;
  // ตำแหน่งตามขั้นที่ไรเดอร์กด: ยังไม่เริ่มไปส่ง = อยู่ที่ร้าน / กำลังไปส่ง = วิ่งตามเวลาจริง
  const stage = order.riderStage || "ไปรับอาหาร";
  let elapsed = 0;
  if (stage === "กำลังไปส่ง") {
    elapsed = Math.min(1, Math.max(0, (Date.now() - (order.departedAt || order.pickedUpAt || order.createdAt)) / legMs));
  }
  return { start, end, path, elapsed, legMs, totalKm, rest, stage };
}

// ข้อความขั้นตอนที่ไรเดอร์กดอัปเดต (ลูกค้าเห็นสด ๆ)
function riderStageSub(order) {
  const stage = order.riderStage || "ไปรับอาหาร";
  if (stage === "ไปรับอาหาร") return `🛵 ${order.riderName} กำลังไปรับอาหารที่ร้าน`;
  if (stage === "ถึงร้านแล้ว") return `🛵 ${order.riderName} ถึงร้านแล้ว กำลังรับอาหาร`;
  return `🛵 ${order.riderName} กำลังนำส่งถึงคุณ · รวม ${fmt(order.total)}`;
}

function riderMapStageText(order) {
  const stage = order.riderStage || "ไปรับอาหาร";
  if (stage === "ไปรับอาหาร") return "กำลังไปรับอาหารที่ร้าน";
  if (stage === "ถึงร้านแล้ว") return "ถึงร้านแล้ว กำลังรับอาหาร";
  return "กำลังนำส่ง";
}

// marker อีโมจิบนแผนที่จริง
function trackerEmojiIcon(emoji, label) {
  return L.divIcon({
    className: "map-emoji-icon",
    html: `<div class="map-pin">${emoji}${label ? `<span class="map-pin-label">${escapeHtml(label)}</span>` : ""}</div>`,
    iconSize: [34, 52],
    iconAnchor: [17, 48],
    popupAnchor: [0, -46],
  });
}

let trackerLeaflet = null;
let trackerMapEl = null;
let trackerRouteLayer = null, trackerRestMarker = null, trackerHomeMarker = null, trackerRiderMarker = null;

function destroyTrackerMap() {
  if (trackerLeaflet) {
    trackerLeaflet.remove();
    trackerLeaflet = null;
  }
  trackerMapEl = null;
  trackerRouteLayer = null;
  trackerRestMarker = null;
  trackerHomeMarker = null;
  trackerRiderMarker = null;
}

function renderTrackerMap() {
  const order = getActiveOrder();
  const wrap = document.getElementById("tracker-map");
  if (!order || !wrap || order.status !== "กำลังจัดส่ง" || !order.riderName) {
    destroyTrackerMap();
    return;
  }
  if (!window.L) return; // Leaflet ยังโหลดไม่ทัน/ไม่มีอินเทอร์เน็ต — ข้ามรอบนี้
  // renderOrderTracker เขียน innerHTML ใหม่ → ตัว div ถูกสร้างใหม่ → สร้างแผนที่ใหม่
  if (trackerMapEl !== wrap) destroyTrackerMap();
  const data = trackerMapData(order);
  const el = document.getElementById("tracker-map-leaflet");
  if (!el) return;
  if (!trackerLeaflet) {
    trackerLeaflet = L.map(el, { zoomControl: false }).setView([data.start.lat, data.start.lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(trackerLeaflet);
  }
  // หัวข้อสด (ไรเดอร์ + ขั้นที่กด)
  const head = wrap.querySelector(".tracker-map-head");
  if (head) head.innerHTML = `📍 <b>${escapeHtml(order.riderName)}</b> ${riderMapStageText(order)} — แผนที่จริงอัปเดตสด`;
  // เส้นทางถนนจริง (OSRM) ถ้าโหลดเสร็จแล้ว — ไม่ก็เส้นตรง แล้วโหลดต่อเพื่อวาดใหม่
  const eff = effectiveRoute(data.start, data.end, data.path, data.totalKm);
  const path = eff.path, totalKm = eff.km, legMs = eff.legMs;
  if (!eff.road) {
    loadRoadRoute(data.start, data.end).then((val) => {
      if (val && val.pts && document.getElementById("tracker-map")) renderTrackerMap();
    });
  }
  // ตำแหน่งไรเดอร์ตามขั้นที่กด (ใช้เวลาจริงของเส้นทางที่ใช้)
  let elapsed = data.elapsed;
  if (data.stage === "กำลังไปส่ง") {
    elapsed = Math.min(1, Math.max(0, (Date.now() - (order.departedAt || order.pickedUpAt || order.createdAt)) / legMs));
  }
  // เคลียร์เลเยอร์เดิม
  if (trackerRouteLayer) trackerLeaflet.removeLayer(trackerRouteLayer);
  if (trackerRestMarker) trackerLeaflet.removeLayer(trackerRestMarker);
  if (trackerHomeMarker) trackerLeaflet.removeLayer(trackerHomeMarker);
  if (trackerRiderMarker) trackerLeaflet.removeLayer(trackerRiderMarker);
  // เส้นทาง + ร้าน + บ้าน
  trackerRouteLayer = L.polyline(path.map((p) => [p.lat, p.lng]), { color: "#ff5c1a", weight: 4, dashArray: "8 6" }).addTo(trackerLeaflet);
  trackerRestMarker = L.marker([data.start.lat, data.start.lng], { icon: trackerEmojiIcon("🏪", (data.rest.name || "ร้าน").slice(0, 14)) }).addTo(trackerLeaflet);
  trackerHomeMarker = L.marker([data.end.lat, data.end.lng], { icon: trackerEmojiIcon("🏠", "บ้านคุณ") }).addTo(trackerLeaflet);
  // ไรเดอร์ (ขยับตามเวลาจริง)
  const pos = pointAtGps(path, elapsed);
  trackerRiderMarker = L.marker([pos.lat, pos.lng], { icon: trackerEmojiIcon("🛵") }).addTo(trackerLeaflet);
  // ซูมให้เห็นทั้งเส้นทาง
  trackerLeaflet.fitBounds(L.latLngBounds(path.map((p) => [p.lat, p.lng])), { padding: [26, 26], maxZoom: 16 });
  trackerLeaflet.invalidateSize();
  // ETA ตามขั้นที่ไรเดอร์กด (ระยะทางถนนจริงถ้าโหลดได้)
  const etaEl = document.getElementById("tracker-map-eta");
  if (etaEl) {
    if (data.stage === "ไปรับอาหาร") {
      etaEl.textContent = "🛵 ไรเดอร์กำลังไปที่ร้าน…";
    } else if (data.stage === "ถึงร้านแล้ว") {
      etaEl.textContent = "🏪 ถึงร้านแล้ว — กำลังรับอาหาร…";
    } else if (elapsed >= 1) {
      etaEl.textContent = "🛵 ใกล้ถึงบ้านแล้ว…";
    } else {
      const km = Math.round(totalKm * 10) / 10;
      etaEl.textContent = `🛵 ถึงบ้านในอีกประมาณ ${Math.max(1, Math.ceil((legMs * (1 - elapsed)) / 60000))} นาที · เส้นทาง ~${km} กม.`;
    }
  }
}
setInterval(renderTrackerMap, 2000); // อัปเดตตำแหน่งไรเดอร์ทุก 2 วิ

/* ===== ให้คะแนน + รีวิว (หลังออเดอร์เสร็จสิ้น) ===== */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// บล็อกให้คะแนน: เคยให้แล้ว → แสดงสรุป / ยังไม่เคย → ฟอร์มดาว + รีวิว
function ratingBlock(order) {
  const review = getReviewForOrder(order.id, order.restaurantId);
  if (review) {
    const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
    return `
      <div class="rate-summary" data-order="${order.id}">
        <span class="rate-stars-shown" aria-hidden="true">${stars}</span>
        <span class="rate-summary-text">${review.rating}/5 · ขอบคุณสำหรับรีวิว${review.review ? ` — "${escapeHtml(review.review)}"` : ""} 🎉</span>
      </div>`;
  }
  return `
    <div class="rate-form" data-order="${order.id}">
      <p class="rate-prompt">✨ ให้คะแนนความอร่อยของออเดอร์นี้</p>
      <div class="rate-stars">
        ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="rate-star" data-star="${n}" aria-label="${n} ดาว">☆</button>`).join("")}
      </div>
      <textarea class="rate-review" rows="2" maxlength="200" placeholder="รีวิวสั้น ๆ (ไม่บังคับ) เช่น อร่อยมาก ใส่เครื่องเยอะ"></textarea>
      <button type="button" class="rate-submit">ส่งรีวิว</button>
    </div>`;
}

// ฟังคลิกดาว + ส่งรีวิว (ใช้ได้ทั้งแถบติดตามและประวัติ — delegation ที่ document)
document.addEventListener("click", (e) => {
  const star = e.target.closest(".rate-star");
  if (star) {
    const form = star.closest(".rate-form");
    if (!form) return;
    const n = Number(star.dataset.star);
    form.dataset.rating = n;
    form.querySelectorAll(".rate-star").forEach((s, i) => {
      const on = i < n;
      s.textContent = on ? "★" : "☆";
      s.classList.toggle("active", on);
    });
    return;
  }
  const submit = e.target.closest(".rate-submit");
  if (!submit) return;
  const form = submit.closest(".rate-form");
  const orderId = Number(form.dataset.order);
  const rating = Number(form.dataset.rating || 0);
  if (!rating) { showToast("⚠️ กรุณาเลือกดาวก่อนส่งรีวิว"); return; }
  const order = getOrders().find((o) => o.id === orderId);
  if (!order) return;
  const review = form.querySelector(".rate-review")?.value.trim() || "";
  addReview({ orderId, restaurantId: order.restaurantId, rating, review });
  renderOrderTracker();
  renderHistory();
  renderRestaurant(current);
  renderStoreSwitcher();
  renderPublicReviews();
  showToast(`⭐ ขอบคุณสำหรับรีวิว ${rating}/5 — คะแนนร้านอัปเดตแล้ว`);
});

/* ===== รีวิวจากลูกค้า (สาธารณะ — ลูกค้าทุกคนเห็นได้) ===== */
function renderPublicReviews() {
  const reviews = getReviews()
    .filter((r) => r.restaurantId === currentRestaurantId)
    .sort((a, b) => b.createdAt - a.createdAt);
  if (!reviews.length) {
    publicReviewsEl.hidden = true;
    return;
  }
  publicReviewsEl.hidden = false;

  const eff = getEffectiveRating(currentRestaurantId);
  $("#public-rev-summary").textContent = `⭐ เฉลี่ย ${eff.rating} จาก ${eff.reviews.toLocaleString("th-TH")} รีวิว`;

  $("#public-review-list").innerHTML = reviews
    .map((r) => {
      const order = getOrders().find((o) => o.id === r.orderId);
      const customer = order?.customer?.name || "ลูกค้า";
      const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
      const date = new Date(r.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
      return `
      <article class="pub-review" data-order="${r.orderId}">
        <div class="pub-review-head">
          <span class="pub-review-stars" aria-label="${r.rating} จาก 5 ดาว">${stars}</span>
          <span class="pub-review-meta">${escapeHtml(customer)} · ${date}</span>
        </div>
        <p class="pub-review-text">${escapeHtml(r.review || "—")}</p>
        ${r.reply
          ? `<div class="pub-review-reply"><b>💬 คำตอบของร้าน</b><p>${escapeHtml(r.reply)}</p></div>`
          : ""}
      </article>`;
    })
    .join("");
}

/* ===== ประวัติออเดอร์ของฉัน (ดู + สั่งซ้ำ 1 คลิก) ===== */
const historyModal = $("#history-modal");
const historyOverlay = $("#history-overlay");

function openHistory() {
  renderHistory();
  historyModal.hidden = false;
  historyOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeHistory() {
  historyModal.hidden = true;
  historyOverlay.hidden = true;
  document.body.style.overflow = "";
}

function fmtDateTime(ts) {
  const d = new Date(ts);
  const date = d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

function renderHistory() {
  const orders = getOrders();
  $("#history-list").innerHTML = orders
    .map((o) => {
      const rest = getRestaurant(o.restaurantId);
      return `
      <article class="h-order" data-id="${o.id}">
        <div class="h-order-head">
          <div>
            <b>ออเดอร์ #${o.id} · ${rest.name}</b>
            <span class="h-order-time">${fmtDateTime(o.createdAt)}</span>
          </div>
          <span class="h-order-status status-${o.status}">${o.status}</span>
        </div>
        <div class="h-order-items">
          ${o.items.map((it) => `<span class="h-order-item">${it.emoji || ""} ${it.name} × ${it.qty}</span>`).join("")}
        </div>
        ${o.status === "เสร็จสิ้น" ? `<div class="h-rate">${ratingBlock(o)}</div>` : ""}
        <div class="h-order-foot">
          <span class="h-order-total">${fmt(o.total)}</span>
          <button class="h-order-reorder" data-id="${o.id}" type="button">🔄 สั่งซ้ำ</button>
        </div>
      </article>`;
    })
    .join("");
  $("#history-empty").hidden = orders.length > 0;
}

// สั่งซ้ำ 1 คลิก: สลับไปร้านนั้น (ถ้ายังไม่ใช่) + เติมสินค้าเดิมลงตะกร้า (เทียบกับเมนูปัจจุบัน)
function reorder(orderId) {
  const order = getOrders().find((o) => o.id === orderId);
  if (!order) return;
  if (order.restaurantId !== currentRestaurantId) switchRestaurant(order.restaurantId);

  let added = 0;
  let missing = 0;
  for (const it of order.items) {
    const m = it.id ? MENU.find((x) => x.id === it.id) : MENU.find((x) => x.name === it.name);
    if (!m) { missing++; continue; }
    cart.set(m.id, (cart.get(m.id) || 0) + it.qty);
    added += it.qty;
  }
  saveCart();
  renderCart();
  renderHistory();

  if (added > 0) {
    showToast(`🔄 สั่งซ้ำ ${added} รายการลงตะกร้าแล้ว${missing ? ` · ${missing} รายการหมด` : ""}`);
    openCart();
  } else {
    showToast("⚠️ เมนูในออเดอร์นี้ถูกลบออกจากร้านแล้ว ไม่สามารถสั่งซ้ำได้");
  }
}

// ปุ่ม "ประวัติออเดอร์/เข้าสู่ระบบ" ในหัวร้านถูกลบออกแล้ว (มีในแถบเมนูล่าง) — กัน null ถ้าไฟล์เก่ายังมีปุ่มอยู่
const historyBtn = $("#btn-history");
if (historyBtn) historyBtn.addEventListener("click", openHistory);
$("#history-close").addEventListener("click", closeHistory);
historyOverlay.addEventListener("click", closeHistory);

$("#history-list").addEventListener("click", (e) => {
  const btn = e.target.closest(".h-order-reorder");
  if (btn) reorder(Number(btn.dataset.id));
});

/* ===== ดีลเด็ด (แถวการ์ดในส่วนเมนู) ===== */
const dealsRailEl = $("#deals-rail");

function renderDealsRail() {
  dealsRailEl.hidden = ADS.length === 0;
  $("#deals-rail-list").innerHTML = ADS.map((ad) => `
    <button class="deal-chip" data-id="${ad.id}" type="button" style="background:${ad.bg}${ad.aiImg ? `;background-image:url('${ad.aiImg}')` : ""}">
      <span class="deal-chip-emoji" aria-hidden="true">${ad.emoji}</span>
      <span class="deal-chip-body">
        <b${ad.titleAnim && ad.titleAnim !== "none" ? ` class="ad-title-anim-${ad.titleAnim}"` : ""}>${ad.title}</b>
        <small>${ad.cta || "ดูโปรโมชัน"} →</small>
      </span>
    </button>`).join("");
}

$("#deals-rail-list").addEventListener("click", (e) => {
  const chip = e.target.closest(".deal-chip");
  if (!chip) return;
  const ad = ADS.find((a) => a.id === Number(chip.dataset.id));
  if (!ad) return;
  recordAdClick(ad.id);
  openDealModal(ad); // ป๊อปอัปกลางจอ — แถบเมนูล่างไม่หาย
});

/* ===== ป๊อปอัปดีลเด็ด (กดดีล/โฆษณาในเมนู → เด้งขึ้นมากลางจอ ไม่ต้องออกจากหน้า) ===== */
const dealModalEl = $("#deal-modal");
const dealOverlayEl = $("#deal-overlay");
const dealModalHeroEl = $("#deal-modal-hero");
const dealModalDescEl = $("#deal-modal-desc");
const dealModalTermsEl = $("#deal-modal-terms");
const dealModalCtaEl = $("#deal-modal-cta");
const dealModalFullEl = $("#deal-modal-full");
let dealModalTimer = null;
let dealModalAd = null;

function openDealModal(ad) {
  dealModalAd = ad;
  // ระยะเวลาที่เหลือ: โฆษณาที่ตั้ง endAt → นับถอยหลังถึงเวลานั้นจริง / ไม่ตั้ง → 2 ชม. (เหมือนหน้า deal)
  const DURATION_MS = 2 * 60 * 60 * 1000;
  const endTime = ad.endAt ? Number(ad.endAt) : Date.now() + DURATION_MS;
  const LONG_MS = 24 * 60 * 60 * 1000;
  const showEndDate = Boolean(ad.endAt) && endTime - Date.now() > LONG_MS;
  // ใช้กฎเดียวกับหน้า deal.html: มีคูปองเมื่อตั้ง discountType/discountValue
  const hasCoupon = ad.discountType === "delivery" || Number(ad.discountValue) > 0;
  const myCoupon = hasCoupon && typeof getUsableCoupons === "function"
    ? (getUsableCoupons().find((c) => Number(c.adId) === Number(ad.id)) || null)
    : null;
  const isMotion = !!(ad.aiMotion && ad.aiImg);
  const imgSrc = ad.imageUrl || ad.bgImage || "";

  dealModalHeroEl.innerHTML = `
    <div class="deal-modal-hero-content${isMotion ? " ad-motion" : ""}" style="background:${ad.bg}${ad.aiImg ? `;background-image:url('${ad.aiImg}')` : ""}">
      ${ad.video ? `<video class="deal-modal-video" autoplay muted loop playsinline preload="metadata" aria-hidden="true">
        <source src="${ad.video}.mp4" type="video/mp4" />
        <source src="${ad.video}.webm" type="video/webm" />
      </video>` : ""}
      ${isMotion ? `<div class="ad-kenburns" style="background-image:url('${ad.aiImg}')" aria-hidden="true"></div>
      <div class="ad-shine" aria-hidden="true"></div>` : ""}
      ${imgSrc ? UI.imgBlock({ img: imgSrc, emoji: ad.emoji, color: ad.bg, alt: ad.title, fallback: "images/no-food.png" }) : `<div class="deal-modal-emoji" aria-hidden="true">${ad.emoji || "🎁"}</div>`}
      <div class="deal-hero-scrim" aria-hidden="true"></div>
      <span class="ad-badge">โฆษณา</span>
      <div class="deal-modal-hero-inner">
        <p class="deal-hero-eyebrow">⚡ โปรเด็ดวันนี้ · ${ad.emoji}</p>
        <h3 class="deal-modal-hero-title${ad.titleAnim && ad.titleAnim !== "none" ? ` ad-title-anim-${ad.titleAnim}` : ""}">${ad.title}</h3>
        <div class="deal-modal-timer">
          ${showEndDate
            ? `หมดเขต <b>${new Date(Number(ad.endAt)).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</b>`
            : `หมดเขตใน <b class="deal-modal-countdown">--:--:--</b>`}
        </div>
        ${hasCoupon ? `<span class="deal-coupon-chip">🎟️ ${couponValueLabel(ad)} · ${couponMinLabel(ad)}</span>` : ""}
      </div>
    </div>`;
  dealModalDescEl.textContent = ad.desc || "ไม่มีรายละเอียดเพิ่มเติมในขณะนี้";
  dealModalTermsEl.innerHTML = (typeof getAdTerms === "function" ? getAdTerms(ad) : []).map((t) => `<li>${t}</li>`).join("");
  dealModalFullEl.href = `deal.html?id=${ad.id}`;

  // ปุ่ม CTA: รับคูปองได้ → รับในป๊อปอัปเลย / มีแล้ว → บอกโค้ด / ไม่มีคูปอง → เปิดหน้าเต็ม
  if (myCoupon) {
    dealModalCtaEl.disabled = true;
    dealModalCtaEl.textContent = `🎟️ มีคูปองแล้ว: ${myCoupon.code} ✓`;
  } else if (hasCoupon) {
    dealModalCtaEl.disabled = false;
    dealModalCtaEl.textContent = "🎟️ รับคูปองส่วนลด";
  } else {
    dealModalCtaEl.disabled = false;
    dealModalCtaEl.textContent = `${ad.cta || "ดูโปรโมชัน"} →`;
  }

  dealModalEl.classList.remove("closing");
  dealModalEl.hidden = false;
  dealOverlayEl.hidden = false;
  document.body.style.overflow = "hidden"; // ล็อก scroll หลังป๊อปอัป

  // นับถอยหลังสด (เฉพาะแบบ HH:MM:SS)
  clearInterval(dealModalTimer);
  if (!showEndDate) {
    dealModalTimer = setInterval(() => {
      const ms = Math.max(0, endTime - Date.now());
      const h = Math.floor(ms / 3.6e6);
      const m = Math.floor((ms % 3.6e6) / 6e4);
      const s = Math.floor((ms % 6e4) / 1000);
      dealModalEl.querySelectorAll(".deal-modal-countdown").forEach((el) => {
        el.textContent = [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
      });
    }, 1000);
  }
}

function closeDealModal() {
  clearInterval(dealModalTimer);
  dealModalEl.classList.add("closing");
  setTimeout(() => {
    dealModalEl.hidden = true;
    dealModalEl.classList.remove("closing");
    dealOverlayEl.hidden = true;
  }, 220);
  document.body.style.overflow = "";
}
$("#deal-close").addEventListener("click", closeDealModal);
dealOverlayEl.addEventListener("click", closeDealModal);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !dealModalEl.hidden) closeDealModal(); });

dealModalCtaEl.addEventListener("click", () => {
  const ad = dealModalAd;
  if (!ad) return;
  const hasCouponCfg = ad.discountType === "delivery" || Number(ad.discountValue) > 0;
  if (!hasCouponCfg) { // ไม่มีคูปอง → ไปหน้าโปรโมชันเต็ม
    location.href = `deal.html?id=${ad.id}`;
    return;
  }
  if (dealModalCtaEl.disabled) { showToast("🎟️ คุณมีคูปองนี้แล้ว — ใช้ตอนสั่งซื้อได้เลย"); return; }
  const coupon = claimCoupon(ad);
  if (!coupon) { showToast("⚠️ โฆษณานี้ยังไม่มีคูปอง"); return; }
  dealModalCtaEl.disabled = true;
  dealModalCtaEl.textContent = `🎟️ มีคูปองแล้ว: ${coupon.code} ✓`;
  showToast(`🎟️ รับคูปองแล้ว! ${coupon.code} — ${couponValueLabel(coupon)} (${couponMinLabel(coupon)}) ใช้ตอนสั่งซื้อได้เลย`);
});

/* ===== ค้นหาร้าน/เมนูข้ามร้าน ===== */
const searchInput = $("#search-input");
const searchClearBtn = $("#search-clear");
const searchResultsEl = $("#search-results");
const categoryTabsEl = document.querySelector(".category-tabs");
const menuListEl = $("#menu-list");
let searchTimer = null;

function clearSearch() {
  searchInput.value = "";
  searchClearBtn.hidden = true;
  searchResultsEl.hidden = true;
  searchResultsEl.innerHTML = "";
  categoryTabsEl.hidden = false;
  menuListEl.hidden = false;
  renderCategoryTabs(); // ใช้หมวดของร้านที่เปิดอยู่ (ร้านไหนไม่มีหมวด → ปุ่มหาย)
  renderDealsRail(); // คืนแถวดีลเด็ด (ซ่อน/โชว์ตามจำนวนโฆษณา)
  renderPublicReviews(); // คืนความถูกต้องของส่วนรีวิวสาธารณะ
}

function renderSearchResults(q) {
  const query = q.trim().toLowerCase();
  searchClearBtn.hidden = !query;
  if (!query) {
    clearSearch();
    return;
  }

  categoryTabsEl.hidden = true;
  menuListEl.hidden = true;
  dealsRailEl.hidden = true;
  document.getElementById("public-reviews").hidden = true;

  const restaurants = getRestaurants();
  const matchRest = restaurants.filter(
    (r) => r.name.toLowerCase().includes(query) || r.cuisine.toLowerCase().includes(query)
  );
  const matchItems = [];
  for (const r of restaurants) {
    for (const m of r.menu) {
      if (m.name.toLowerCase().includes(query) || (m.desc || "").toLowerCase().includes(query)) {
        matchItems.push({ r, m });
      }
    }
  }

  searchResultsEl.hidden = false;
  if (!matchRest.length && !matchItems.length) {
    searchResultsEl.innerHTML = `
      <div class="search-empty">ไม่พบ "${searchInput.value.trim()}"<br />ลองค้นชื่อเมนูหรือประเภทร้านอื่น ๆ</div>`;
    return;
  }

  const restHtml = matchRest.length
    ? `<p class="search-group-title">ร้านค้า (${matchRest.length})</p>
       ${matchRest.map((r) => `
       <button class="search-rest" data-id="${r.id}" type="button">
         ${UI.imgBlock({ img: r.imageUrl || UI.storeImgUrl(r.name, r.cuisine), emoji: r.coverEmoji, color: r.coverBg, alt: r.name, fallback: "images/no-store.png", className: "store-emoji" })}
         <span class="search-rest-info">
           <b>${r.name}</b>
           <small>${r.cuisine} · ★ ${getEffectiveRating(r.id).rating} · ${customerDistanceKm(r)} กม.</small>
         </span>
         <span class="search-rest-go">ไปร้าน →</span>
       </button>`).join("")}`
    : "";

  const itemsHtml = matchItems.length
    ? `<p class="search-group-title">เมนู (${matchItems.length})</p>
       ${matchItems.map(({ r, m }) => `
       <article class="search-item" data-rest="${r.id}" data-item="${m.id}">
         ${UI.imgBlock({ img: m.img || m.imageUrl || UI.foodImgUrl(m.name, m.emoji), emoji: m.emoji, color: m.color, alt: m.name, fallback: "images/no-food.png", className: "food-img search-item-img" })}
         <div class="search-item-body">
           <b>${m.name}</b>
           <small>📍 ${r.name}</small>
         </div>
         <div class="search-item-right">
           <span class="menu-price">฿${m.price}</span>
           <button class="btn-add btn-add-sm" data-add="${r.id}" data-item="${m.id}" type="button">เพิ่มลงตะกร้า</button>
         </div>
       </article>`).join("")}`
    : "";

  searchResultsEl.innerHTML = restHtml + itemsHtml;
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => renderSearchResults(searchInput.value), 150);
});
searchClearBtn.addEventListener("click", clearSearch);

searchResultsEl.addEventListener("click", (e) => {
  const addBtn = e.target.closest("[data-add]");
  if (addBtn) {
    const restId = Number(addBtn.dataset.add);
    const itemId = Number(addBtn.dataset.item);
    if (restId !== currentRestaurantId) switchRestaurant(restId);
    const m = MENU.find((x) => x.id === itemId);
    if (!m) return;
    cart.set(m.id, (cart.get(m.id) || 0) + 1);
    saveCart();
    renderCart();
    showToast(`✓ เพิ่ม "${m.name}" ลงตะกร้าแล้ว`);
    return;
  }
  const restBtn = e.target.closest(".search-rest");
  if (restBtn) {
    switchRestaurant(Number(restBtn.dataset.id));
    clearSearch();
    return;
  }
  const itemCard = e.target.closest(".search-item");
  if (itemCard) {
    switchRestaurant(Number(itemCard.dataset.rest));
    clearSearch();
    document.querySelector(".menu-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

/* ปุ่มย้อนกลับ */
$(".btn-back").addEventListener("click", () => history.length > 1 ? history.back() : location.reload());

/* ===== เริ่มต้น ===== */
const publicReviewsEl = $("#public-reviews");
renderDealsRail();
renderRestaurant(current);
renderStoreSwitcher();
loadCart();
ensureActiveCategoryHasItems();
renderCategoryTabs();
renderMenu(activeCategory);
renderCart();
renderOrderTracker();
renderPublicReviews();

// 🔥 Firebase: เชื่อม Firestore (ถ้าตั้งค่า config แล้ว) — ร้านที่สมัครจากเครื่องอื่นจะโผล่ในแถบร้านค้าอัตโนมัติ
initFirebaseCollections();
// ถ้ามีตำแหน่งลูกค้าเดิม (จากครั้งก่อน) → โหลดระยะทางถนนจริงของทุกร้านเป็นพื้นหลัง
warmAllRoadDistances();
document.addEventListener("sangkha:firebase-restaurants", () => {
  renderStoreSwitcher(); // วาดแถบร้านค้าใหม่ (รวมร้านใหม่จาก Firestore)
  warmAllRoadDistances(); // ร้านใหม่จาก Firestore → โหลดระยะทางถนนจริงให้ด้วย
});
// 🔥 เมนูจาก Firestore อัปเดต (ร้านเพิ่ม/แก้เมนูจากเครื่องอื่น) → รีเฟรชเมนูของร้านที่เปิดอยู่ทันที
//   (getRestaurant → getMenu อ่านจาก Firestore cache — localStorage เป็นแค่ตัวสำรอง)
document.addEventListener("sangkha:firebase-menus", () => {
  current = getRestaurant(currentRestaurantId);
  MENU = current.menu;
  ensureActiveCategoryHasItems();
  renderCategoryTabs();
  renderMenu(activeCategory);
});

/* ===== จำตำแหน่งเลื่อน (กลับจากหน้าย่อย/รีเฟรช → กลับมาอยู่จุดเดิม) ===== */
const SCROLL_KEY = "sangkha-customer-scroll";
let scrollSaveTimer = null;
// เก็บตำแหน่งเลื่อน (debounce 150ms — ไม่เขียนถี่เกินไป)
window.addEventListener("scroll", () => {
  clearTimeout(scrollSaveTimer);
  scrollSaveTimer = setTimeout(() => {
    try { sessionStorage.setItem(SCROLL_KEY, String(window.scrollY)); } catch (_) { /* ไม่เป็นไร */ }
  }, 150);
}, { passive: true });
// คืนค่าตำแหน่งเดิมเมื่อกลับมาที่หน้า (จาก bfcache / history.back / หน้าย่อย)
window.addEventListener("pageshow", (e) => {
  try {
    const saved = Number(sessionStorage.getItem(SCROLL_KEY));
    if (saved > 0) window.scrollTo(0, saved);
  } catch (_) { /* ไม่เป็นไร */ }
  // ถ้าเป็น bfcache (กลับมาทันที) ข้อมูลในหน้าอยู่แล้ว — ถ้าโหลดใหม่ค่อยเรนเดอร์ใหม่
  if (e.persisted) return;
  current = getRestaurant(currentRestaurantId);
  MENU = current.menu;
  ensureActiveCategoryHasItems();
  renderCategoryTabs();
  renderMenu(activeCategory);
  renderStoreSwitcher();
  renderCart();
  renderOrderTracker();
});
