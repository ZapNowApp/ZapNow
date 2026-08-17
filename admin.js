/* ===== หน้าจัดการร้านค้า: เพิ่ม / แก้ไข / ลบสินค้า =====
   (EMOJIS, BG_PRESETS, ฟังก์ชันข้อมูล มาจาก menu-data.js) */

/* ===== หมวดแดชบอร์ด (ข้อมูลกลาง — ประกาศบนสุดกัน TDZ) ===== */
const CAT_ICON_SHOP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h16l-1.2 10H5.2z"/><path d="M3.5 6.5h17l-.7 3H4.2z"/><path d="M9 9.5V11a3 3 0 0 0 6 0V9.5"/></svg>';
const CAT_ICON_USERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.4"/><path d="M3.5 19.5c0-3 2.5-4.7 5.5-4.7s5.5 1.7 5.5 4.7"/><path d="M15.5 5.2a3.4 3.4 0 0 1 0 5.6"/><path d="M17.5 14.9c2 .8 3 2.3 3 4.6"/></svg>';
const ADMIN_CATS = [
  { key: "restaurants", title: "ร้านค้า", desc: "สถานะรับออเดอร์ · แก้ไขข้อมูลร้าน · รีเซ็ต PIN", color: "c1", icon: CAT_ICON_SHOP },
  { key: "menu", title: "เมนู", desc: "สินค้าของร้าน · เมนูรออนุมัติ", color: "c2", icon: UI.ICONS.menu },
  { key: "orders", title: "ออเดอร์", desc: "สรุปออเดอร์ · ไปรับออเดอร์สด", color: "c3", icon: UI.ICONS.orders },
  { key: "riders", title: "ไรเดอร์", desc: "ไรเดอร์ประจำร้าน · ไปหน้าไรเดอร์", color: "c4", icon: UI.ICONS.riders },
  { key: "customers", title: "ลูกค้า", desc: "จำนวนสมาชิก · ลูกค้าที่เคยสั่ง", color: "c5", icon: CAT_ICON_USERS },
  { key: "finance", title: "การเงิน", desc: "ค่าธรรมเนียม · ค่าจัดส่ง · ภาษีไรเดอร์", color: "c6", icon: UI.ICONS.wallet },
  { key: "system", title: "ระบบ", desc: "โฆษณาสไลด์ · รีวิวจากลูกค้า", color: "c7", icon: UI.ICONS.settings },
];

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const fromUrl = Number(new URLSearchParams(location.search).get("restaurant"));
let currentRestaurantId = fromUrl || Number(localStorage.getItem("sangkha-active-restaurant")) || 1;

/* ===== บทบาท: guest / store / admin — ร้านค้าเห็นเฉพาะร้านของตัวเอง ===== */
let role = "guest";
let storeProfile = getStoreProfile();
if (isAdminLoggedIn()) role = "admin";
else if (storeProfile) {
  role = "store";
  currentRestaurantId = Number(storeProfile.id);
}

let current = getRestaurant(currentRestaurantId);
let menu = current.menu;
let editingId = null; // null = เพิ่มใหม่, มีค่า = แก้ไข
let pendingImg = null; // รูปอาหารจริง (data URL) ที่เลือกล่าสุด
let pendingAdImg = null; // แบนเนอร์ AI ของโฆษณา (data URL)

const listEl = $("#product-list");
const emptyEl = $("#empty-state");
const overlay = $("#modal-overlay");
const form = $("#product-form");
const emojiPicker = $("#emoji-picker");

/* ===== รายการสินค้า ===== */
function renderList() {
  // ป้าย ⏳ บนสินค้าที่มีคำขอรออนุมัติ (เพิ่ม/แก้/ลบ ยังไม่ผ่าน)
  const pend = getPendingMenuFor(currentRestaurantId);
  const hasPending = (m) =>
    pend.some(
      (p) =>
        (p.action === "edit" && p.item.id === m.id) ||
        (p.action === "delete" && p.item.id === m.id) ||
        (p.action === "add" && p.item.name === m.name)
    );
  listEl.innerHTML = menu
    .map(
      (m) => `
      <article class="product-card" data-id="${m.id}">
        <div class="product-img" ${m.img ? "" : `style="background:${m.color}"`} role="img" aria-label="รูป${m.name}">${m.img ? `<img src="${m.img}" alt="รูป${m.name}" />` : m.emoji}</div>
        <div class="product-info">
          <div class="product-name">${m.name} ${hasPending(m) ? '<span class="pending-chip" title="มีคำขอรออนุมัติ">⏳</span>' : ""} <span class="product-cat">${m.category}</span></div>
          <p class="product-desc">${m.desc || "—"}</p>
        </div>
        <span class="product-price">฿${m.price}</span>
        <div class="product-actions">
          <button class="icon-btn edit" data-action="edit" data-id="${m.id}" aria-label="แก้ไข ${m.name}">✏️</button>
          <button class="icon-btn delete" data-action="delete" data-id="${m.id}" aria-label="ลบ ${m.name}">🗑️</button>
        </div>
      </article>`
    )
    .join("");

  emptyEl.hidden = menu.length > 0;

  // ร้านค้า: แถบแจ้งว่ามีคำขอเมนูรออนุมัติกี่รายการ
  const note = $("#store-pending-note");
  if (role === "store" && pend.length) {
    note.hidden = false;
    note.textContent = `📨 มีคำขอ ${pend.length} รายการรอแอดมินอนุมัติ (เพิ่ม/แก้ไข/ลบยังไม่ขึ้นหน้าร้าน) — ตรวจได้ที่หน้าแอดมิน`;
  } else {
    note.hidden = true;
  }

  const total = menu.length;
  const cats = new Set(menu.map((m) => m.category)).size;
  const minPrice = menu.length ? Math.min(...menu.map((m) => m.price)) : 0;
  $("#stat-total").textContent = total;
  $("#stat-categories").textContent = cats;
  $("#stat-min-price").textContent = total ? `฿${minPrice}` : "฿0";
}

/* ===== ตัวเลือกรูป ===== */
function buildEmojiPicker(selected) {
  emojiPicker.innerHTML = EMOJIS.map(
    (e, i) =>
      `<button type="button" class="emoji-option${e === selected ? " selected" : ""}" data-emoji="${e}" role="option" aria-selected="${e === selected}" aria-label="รูป ${e}">${e}</button>`
  ).join("");

  emojiPicker.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".emoji-option");
    if (!btn) return;
    $$(".emoji-option").forEach((b) => {
      b.classList.toggle("selected", b === btn);
      b.setAttribute("aria-selected", b === btn);
    });
  });
}

/* ===== อัปโหลดรูปอาหารจริง ===== */
const imgInput = $("#f-img");
const imgUpload = $("#img-upload");
const imgPreview = $("#img-upload-preview");
const btnRemoveImg = $("#btn-remove-img");

// อ่านไฟล์ภาพ → ย่อขนาด (สูงสุด 800px) → data URL เพื่อไม่ให้ localStorage เกินโควตา
function readImageFile(file, done) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const scale = MAX / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      done(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function renderImgPreview() {
  if (pendingImg) {
    imgPreview.innerHTML = `<img src="${pendingImg}" alt="ตัวอย่างรูปอาหาร" />`;
  } else {
    imgPreview.innerHTML = `<span class="img-upload-placeholder">📷<br />แตะเพื่อถ่าย / เลือกภาพ</span>`;
  }
  btnRemoveImg.hidden = !pendingImg;
  $("#btn-adjust-food-img").hidden = !pendingImg;
  $("#adjust-food-style").hidden = !pendingImg;
}

imgUpload.addEventListener("click", () => imgInput.click());
imgUpload.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    imgInput.click();
  }
});

imgInput.addEventListener("change", () => {
  const file = imgInput.files && imgInput.files[0];
  if (!file) return;
  if (file.size > 4 * 1024 * 1024) showToast("⚠️ ไฟล์ใหญ่เกิน 4MB — ระบบจะย่อให้อัตโนมัติ");
  readImageFile(file, (dataUrl) => {
    pendingImg = dataUrl;
    renderImgPreview();
  });
});

btnRemoveImg.addEventListener("click", () => {
  pendingImg = null;
  imgInput.value = "";
  renderImgPreview();
});

/* ===== AI ตกแต่งรูปอาหาร (ฟรี ไม่ต้องใช้คีย์ — Pollinations.ai) ===== */
const btnAiImg = $("#btn-ai-img");
let lastFoodSeed = null; // seed ของภาพล่าสุด — ใช้ "ปรับภาพเดิม" วาดใหม่ด้วย seed+1, +2,... ให้ใกล้เคียงแต่ต่างกันจริง
let foodVariation = 0;   // จำนวนครั้งที่ปรับภาพเดิม (seed+variation + เพิ่มคำลงใน prompt)

// ตัวเลือกแบบปรับภาพ (value = ค่าจาก select ในฟอร์ม) — ใช้ร่วมกันทั้งรูปอาหารและแบนเนอร์
const ADJUST_STYLE_LABELS = {
  auto: "🔄 สลับไปเรื่อย ๆ", color: "🎨 สีสดขึ้น", close: "🔍 ใกล้ขึ้น",
  clean: "🧹 พื้นหลังสะอาดขึ้น", light: "💡 แสงสวยขึ้น", plate: "🍽️ จัดจานสวยขึ้น",
};
// คำสั่งปรับเฉพาะแบบ (แยกชุดคำสำหรับรูปอาหาร vs แบนเนอร์โฆษณา)
const ADJUST_STYLE_PHRASES = {
  color: { food: "more vibrant colors, richer saturation and more appetizing presentation", banner: "more vibrant colors, richer saturation and eye-catching commercial design" },
  close: { food: "closer crop, sharper focus and premium restaurant plating", banner: "closer crop, sharper focus and dramatic product emphasis" },
  clean: { food: "cleaner background, balanced frame and vibrant garnish", banner: "cleaner background, balanced layout and professional advertising design" },
  light: { food: "better lighting, softer highlights and professional studio look", banner: "better lighting, softer highlights and cinematic commercial look" },
  plate: { food: "more refined composition, elegant plating and fine dining detail", banner: "more refined composition, elegant arrangement and premium branding" },
};
// แบบ "สลับไปเรื่อย ๆ" — หมุนหลากหลายทิศทาง แต่ละครั้งปรับคนละแบบ (seed เดิม → ภาพใกล้เคียงแต่เห็นผลต่างชัดเจนขึ้น)
const ADJUST_AUTO_PHRASES = [
  "more refined composition and detail",
  "better lighting, richer color and more appetizing presentation",
  "closer crop, sharper focus and premium restaurant plating",
  "warmer tones, more depth and professional food styling",
  "cleaner background, balanced frame and vibrant garnish",
];
// เลือกคำสั่งปรับตามแบบที่เลือก (ctx = "food" หรือ "banner") — auto = หมุนวน / เลือกแบบเฉพาะ = ใช้แบบเดิมซ้ำทุกครั้ง
function getAdjustPhrase(style, variation, ctx) {
  if (style === "auto" || !ADJUST_STYLE_PHRASES[style]) {
    return ADJUST_AUTO_PHRASES[(variation - 1) % ADJUST_AUTO_PHRASES.length];
  }
  return ADJUST_STYLE_PHRASES[style][ctx] || ADJUST_STYLE_PHRASES[style].food;
}

// สร้าง prompt จากชื่อ/หมวด/คำอธิบายที่กรอก (ถ้ายังไม่มีชื่อ ใช้หมวดหมู่แทน) — variation > 0 = เพิ่มคำ "ปรับปรุง" ตามแบบที่เลือก (style)
function buildFoodPrompt(variation, style) {
  const name = $("#f-name").value.trim();
  const cat = $("#f-category").value.trim();
  const desc = $("#f-desc").value.trim();
  const subject = name || (cat ? `จาน${cat}` : "จานอาหารไทย");
  const base = `${subject}, ${desc ? desc + ", " : ""}appetizing food photography, professional studio lighting, vibrant colors, fresh ingredients, shallow depth of field, restaurant menu photo, high resolution`;
  return (variation > 0 ? `${base}, improved version ${variation}, ${getAdjustPhrase(style, variation, "food")}` : base).slice(0, 300);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

// ย่อขนาดรูป (ค่าเริ่มต้น 800px) เพื่อไม่ให้ localStorage เกินโควตา — ถ้าวาดไม่ได้ ใช้ต้นฉบับ
function downscaleDataUrl(dataUrl, done, maxSize = 800) {
  const img = new Image();
  img.onload = () => {
    const MAX = maxSize;
    let { width, height } = img;
    if (width > MAX || height > MAX) {
      const scale = MAX / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
    done(canvas.toDataURL("image/jpeg", 0.82));
  };
  img.onerror = () => done(dataUrl);
  img.src = dataUrl;
}

// วาดรูปอาหารจริง (คืน true ถ้าสำเร็จ) — ใช้ร่วมกันระหว่าง "วาด" และ "ปรับภาพเดิม"
async function drawFoodImg(seed, prompt, okMsg) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    // private=true = ไม่เก็บ cache บนเซิร์ฟเวอร์ — แต่ละครั้งที่วาด/ปรับจะได้ภาพใหม่จริง (กัน CDN คืนภาพเดิม)
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&private=true&seed=${seed}`;
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`AI error ${res.status}`);
    const dataUrl = await blobToDataUrl(await res.blob());
    downscaleDataUrl(dataUrl, (small) => {
      pendingImg = small;
      renderImgPreview();
      showToast(okMsg);
    });
    return true;
  } catch (err) {
    showToast(err.name === "AbortError" ? "⏱️ AI ใช้เวลานานเกินไป — ลองอีกครั้งหรือใช้รูปที่ถ่าย" : "⚠️ AI ไม่ว่างตอนนี้ — ลองอีกครั้งหรือใช้รูปที่ถ่าย");
    return false;
  } finally {
    clearTimeout(timer);
  }
}

btnAiImg.addEventListener("click", async () => {
  if (btnAiImg.disabled) return;
  btnAiImg.disabled = true;
  const orig = btnAiImg.textContent;
  btnAiImg.textContent = "⏳ AI กำลังวาด...";
  lastFoodSeed = Math.floor(Math.random() * 1e6); // seed ใหม่ทุกครั้งที่วาดใหม่
  foodVariation = 0;
  await drawFoodImg(lastFoodSeed, buildFoodPrompt(0), "✨ AI วาดรูปเสร็จแล้ว — กดบันทึกสินค้าเพื่อใช้รูปนี้");
  btnAiImg.disabled = false;
  btnAiImg.textContent = orig;
});

$("#btn-adjust-food-img").addEventListener("click", async () => {
  const btn = $("#btn-adjust-food-img");
  if (btn.disabled) return;
  if (!lastFoodSeed) {
    showToast("✨ วาดรูปด้วย AI ก่อน แล้วค่อยกดปรับภาพเดิม");
    return;
  }
  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = "⏳ AI กำลังปรับ...";
  foodVariation++;
  const style = $("#adjust-food-style").value || "auto"; // แบบที่เลือก: สีสดขึ้น / ใกล้ขึ้น / พื้นหลังสะอาดขึ้น / ...
  // seed เดิม + จำนวนครั้ง (seed+N) — Pollinations คืนภาพเดิมเป๊ะถ้าใช้ seed เดียวกัน → เลื่อน seed นิดเดียว = ภาพใกล้เคียงแต่ต่างกันจริง
  await drawFoodImg(lastFoodSeed + foodVariation, buildFoodPrompt(foodVariation, style), `🎨 ปรับภาพเสร็จแล้ว (${ADJUST_STYLE_LABELS[style] || ""}) — กดอีกครั้งเพื่อปรับเพิ่ม`);
  btn.disabled = false;
  btn.textContent = orig;
});

/* ===== AI วาดแบนเนอร์โฆษณา (ภาพพื้นหลังตามหัวข้อ — ใช้ Pollinations เดียวกัน) ===== */
let lastAdSeed = null; // seed ของภาพล่าสุด — ใช้ "ปรับภาพเดิม" วาดใหม่ด้วย seed+1, +2,... ให้ใกล้เคียงแต่ต่างกันจริง
let adVariation = 0;   // จำนวนครั้งที่ปรับภาพเดิม (seed+variation + เพิ่มคำลงใน prompt)
let pendingAdRef = null; // รูปจริง (สินค้า/โลโก้) ที่จะประกอบลงบนแบนเนอร์ AI
let pendingIconImg = null; // รูปสินค้าจริงแทนไอคอนอีโมจิ (แสดงบนสไลด์บนสุด/การ์ดดีล)

function renderAdIconPreview() {
  const box = $("#ad-icon-preview");
  const clearBtn = $("#btn-clear-ad-icon");
  if (pendingIconImg) {
    box.innerHTML = `<img src="${pendingIconImg}" alt="รูปสินค้าจริงแทนไอคอน" />`;
    clearBtn.hidden = false;
  } else {
    box.innerHTML = `<span class="img-upload-placeholder">📷<br />แตะเพื่อถ่าย / เลือกภาพ</span>`;
    clearBtn.hidden = true;
  }
}

const adIconUpload = $("#ad-icon-upload");
const afIconImg = $("#af-icon-img");
adIconUpload.addEventListener("click", () => afIconImg.click());
adIconUpload.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); afIconImg.click(); }
});
afIconImg.addEventListener("change", () => {
  const file = afIconImg.files && afIconImg.files[0];
  if (!file) return;
  if (file.size > 4 * 1024 * 1024) showToast("⚠️ ไฟล์ใหญ่เกิน 4MB — ระบบจะย่อให้อัตโนมัติ");
  readImageFile(file, (dataUrl) => {
    downscaleDataUrl(dataUrl, (small) => {
      pendingIconImg = small;
      renderAdIconPreview();
    }, 400);
  });
});
$("#btn-clear-ad-icon").addEventListener("click", () => {
  pendingIconImg = null;
  afIconImg.value = "";
  renderAdIconPreview();
});

function renderAdRefPreview() {
  const box = $("#ai-ref-preview");
  const clearBtn = $("#btn-clear-ai-ref");
  if (pendingAdRef) {
    box.innerHTML = `<img src="${pendingAdRef}" alt="รูปจริงที่จะประกอบลงแบนเนอร์" />`;
    clearBtn.hidden = false;
  } else {
    box.innerHTML = `<span class="img-upload-placeholder">📷<br />แตะเพื่อถ่าย / เลือกภาพ</span>`;
    clearBtn.hidden = true;
  }
}

const aiRefUpload = $("#ai-ref-upload");
const afRefImg = $("#af-ref-img");
aiRefUpload.addEventListener("click", () => afRefImg.click());
aiRefUpload.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); afRefImg.click(); }
});
afRefImg.addEventListener("change", () => {
  const file = afRefImg.files && afRefImg.files[0];
  if (!file) return;
  if (file.size > 4 * 1024 * 1024) showToast("⚠️ ไฟล์ใหญ่เกิน 4MB — ระบบจะย่อให้อัตโนมัติ");
  readImageFile(file, (dataUrl) => {
    downscaleDataUrl(dataUrl, (small) => {
      pendingAdRef = small;
      renderAdRefPreview();
    }, 500);
  });
});
$("#btn-clear-ai-ref").addEventListener("click", () => {
  pendingAdRef = null;
  afRefImg.value = "";
  renderAdRefPreview();
});

// ประกอบรูปจริงลงบนพื้นหลัง AI (แคนวาส 1280×640): รูปจริงกรอบกลมมุมมน + วงแหวนขาว + เงา วางด้านขวา — ได้แบนเนอร์โฆษณามืออาชีพในภาพเดียว
function composeAdBanner(bgDataUrl, refDataUrl, done) {
  const bg = new Image();
  const ref = new Image();
  bg.onload = () => {
    const W = 1280, H = 640;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const s = Math.max(W / bg.width, H / bg.height);
    const dw = bg.width * s, dh = bg.height * s;
    ctx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ref.onload = () => {
      const pw = 300, ph = 300;
      const cx = W - 235, cy = H / 2 - 15;
      // เงาใต้กรอบ
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.45)";
      ctx.shadowBlur = 34;
      ctx.shadowOffsetY = 16;
      ctx.beginPath();
      ctx.roundRect(cx - pw / 2, cy - ph / 2, pw, ph, 30);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.restore();
      // รูปจริงในกรอบ (cover)
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cx - pw / 2 + 9, cy - ph / 2 + 9, pw - 18, ph - 18, 24);
      ctx.clip();
      const rs = Math.max((pw - 18) / ref.width, (ph - 18) / ref.height);
      const rdw = ref.width * rs, rdh = ref.height * rs;
      ctx.drawImage(ref, cx - pw / 2 + 9 - (rdw - (pw - 18)) / 2, cy - ph / 2 + 9 - (rdh - (ph - 18)) / 2, rdw, rdh);
      ctx.restore();
      // ป้ายเล็ก ๆ "โปรโมชัน" มุมกรอบ
      ctx.save();
      ctx.fillStyle = "#ff4757";
      ctx.beginPath();
      ctx.roundRect(cx + pw / 2 - 62, cy - ph / 2 - 16, 96, 26, 13);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "700 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("โปรโมชัน", cx + pw / 2 - 14, cy - ph / 2 - 3);
      ctx.restore();
      done(cv.toDataURL("image/jpeg", 0.85));
    };
    ref.onerror = () => done(bgDataUrl);
    ref.src = refDataUrl;
  };
  bg.onerror = () => done(bgDataUrl);
  bg.src = bgDataUrl;
}

function renderAdBannerPreview() {
  const box = $("#ai-banner-preview");
  const clearBtn = $("#btn-clear-ai-banner");
  const adjustBtn = $("#btn-adjust-banner");
  if (pendingAdImg) {
    box.hidden = false;
    box.innerHTML = `<img src="${pendingAdImg}" alt="ตัวอย่างแบนเนอร์ AI" />`;
    clearBtn.hidden = false;
    adjustBtn.hidden = false;
    $("#adjust-banner-style").hidden = false;
  } else {
    box.hidden = true;
    box.innerHTML = "";
    clearBtn.hidden = true;
    adjustBtn.hidden = true;
    $("#adjust-banner-style").hidden = true;
  }
}

// สร้าง prompt จากหัวข้อ/รายละเอียด/ช่องข้อความ/อีโมจิ — variation > 0 = เพิ่มคำ "ปรับปรุง" ตามแบบที่เลือก (style) ท้าย prompt (seed เดิม → ภาพใกล้เคียงแต่สวยขึ้น)
function buildAdBannerPrompt(variation, style) {
  const title = $("#af-title").value.trim();
  const desc = $("#af-desc").value.trim();
  const aiText = $("#af-ai-text").value.trim();
  const emoji = adEmojiPicker.querySelector(".emoji-option.selected")?.dataset.emoji || "";
  const subject = title || "อาหารอร่อย";
  // มีรูปจริง → ขอพื้นที่ว่างด้านขวาให้ระบบวางรูปสินค้า (กัน AI วาดของทับ)
  const space = pendingAdRef ? ", with an empty clean space on the right side reserved for a product photo" : "";
  const base = `${subject} ${emoji} promotion banner background, ${aiText ? aiText + ", " : ""}${desc ? desc + ", " : ""}appetizing food advertising, vibrant colors, professional commercial design, wide banner, high resolution${space}`;
  return (variation > 0 ? `${base}, improved version ${variation}, ${getAdjustPhrase(style, variation, "banner")}` : base).slice(0, 320);
}

// วาดแบนเนอร์จริง (คืน true ถ้าสำเร็จ) — ใช้ร่วมกันระหว่าง "วาด" และ "ปรับภาพเดิม"
async function drawAdBanner(seed, prompt, okMsg) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=640&nologo=true&private=true&seed=${seed}`;
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`AI error ${res.status}`);
    const dataUrl = await blobToDataUrl(await res.blob());
    const finish = (finalImg) => {
      pendingAdImg = finalImg;
      renderAdBannerPreview();
      showToast(okMsg);
    };
    // มีรูปจริง → ประกอบ (พื้นหลัง AI + รูปจริง + ป้ายโปรโมชัน) เป็นแบนเนอร์เดียว — ไม่มีรูปจริง → ย่อพื้นหลังตามปกติ
    if (pendingAdRef) composeAdBanner(dataUrl, pendingAdRef, (composed) => finish(composed));
    else downscaleDataUrl(dataUrl, finish);
    return true;
  } catch (err) {
    showToast(err.name === "AbortError" ? "⏱️ AI ใช้เวลานานเกินไป — ลองอีกครั้ง" : "⚠️ AI ไม่ว่างตอนนี้ — ลองอีกครั้ง");
    return false;
  } finally {
    clearTimeout(timer);
  }
}

$("#btn-ai-banner").addEventListener("click", async () => {
  const btn = $("#btn-ai-banner");
  if (btn.disabled) return;
  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = "⏳ AI กำลังวาดแบนเนอร์...";
  lastAdSeed = Math.floor(Math.random() * 1e6); // seed ใหม่ทุกครั้งที่วาดใหม่
  adVariation = 0;
  await drawAdBanner(lastAdSeed, buildAdBannerPrompt(0), "✨ วาดแบนเนอร์เสร็จแล้ว — กดบันทึกโฆษณาเพื่อใช้");
  btn.disabled = false;
  btn.textContent = orig;
});

$("#btn-adjust-banner").addEventListener("click", async () => {
  const btn = $("#btn-adjust-banner");
  if (btn.disabled) return;
  if (!lastAdSeed) {
    showToast("✨ วาดแบนเนอร์ก่อน แล้วค่อยกดปรับภาพเดิม");
    return;
  }
  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = "⏳ AI กำลังปรับ...";
  adVariation++;
  const style = $("#adjust-banner-style").value || "auto"; // แบบที่เลือก: สีสดขึ้น / ใกล้ขึ้น / พื้นหลังสะอาดขึ้น / ...
  // seed เดิม + จำนวนครั้ง (seed+N) — Pollinations คืนภาพเดิมเป๊ะถ้าใช้ seed เดียวกัน → เลื่อน seed นิดเดียว = ภาพใกล้เคียงแต่ต่างกันจริง
  await drawAdBanner(lastAdSeed + adVariation, buildAdBannerPrompt(adVariation, style), `🎨 ปรับแบนเนอร์เสร็จแล้ว (${ADJUST_STYLE_LABELS[style] || ""}) — กดอีกครั้งเพื่อปรับเพิ่ม`);
  btn.disabled = false;
  btn.textContent = orig;
});

$("#btn-clear-ai-banner").addEventListener("click", () => {
  pendingAdImg = null;
  renderAdBannerPreview();
});

/* ===== เลือกร้านค้า ===== */
function buildRestaurantSelect() {
  const sel = $("#restaurant-select");
  sel.innerHTML = getRestaurants()
    .map((r) => `<option value="${r.id}">${r.name} · ${r.cuisine}</option>`)
    .join("");
  sel.value = currentRestaurantId;
  updateSubtitle();
  updateDashLink();

  sel.addEventListener("change", () => {
    currentRestaurantId = Number(sel.value);
    current = getRestaurant(currentRestaurantId);
    menu = current.menu;
    updateSubtitle();
    updateDashLink();
    renderList();
    renderReviews();
    renderRestaurantRiders();
    renderRestaurantFee();
    renderWht();
    renderDeliverySettings();
    renderClosePanel();
    showToast(`กำลังจัดการร้าน "${current.name}"`);
  });
}

/* ===== ปิดรับออเดอร์ชั่วคราว + อัตโนมัติ (ร้านตั้งเอง — ไม่กระทบเวลาเปิด-ปิด — ใช้ร่วมกับหน้า dashboard/หน้าร้าน) ===== */
function renderClosePanel() {
  const reasonEl = $("#close-reason");
  if (reasonEl) { reasonEl.hidden = true; reasonEl.value = ""; }
  const rec = getStoreClosed(currentRestaurantId);
  const st = storeAcceptingOrders(current);
  const auto = getAutoCloseSetting(currentRestaurantId);
  const autoActive = isAutoClosed(currentRestaurantId);
  const pend = getPendingOrderCount(currentRestaurantId);
  const badge = $("#close-badge");
  const note = $("#close-note");
  const btn = $("#close-toggle");

  // ตัวควบคุมปิดอัตโนมัติ
  const autoChk = $("#close-auto");
  const autoN = $("#close-auto-n");
  const autoNote = $("#close-auto-note");
  if (autoChk) autoChk.checked = !!auto;
  if (autoN) autoN.value = auto ? auto.threshold : 5;
  if (autoNote) {
    autoNote.hidden = !auto;
    autoNote.textContent = auto
      ? autoActive
        ? `⛔ กำลังปิดอัตโนมัติ — ออเดอร์ค้าง ${pend} ใบ (ตั้งไว้ ≥ ${auto.threshold} ใบ) — ลูกค้าสั่งไม่ได้ จนกว่าจะเคลียร์ต่ำกว่า ${auto.threshold} ใบ แล้วระบบเปิดรับเอง`
        : `จะปิดอัตโนมัติเมื่อออเดอร์ค้างถึง ${auto.threshold} ใบ (ตอนนี้ ${pend} ใบ) — เปิดรับเองเมื่อเคลียร์ต่ำกว่า ${auto.threshold} ใบ`
      : "";
  }

  if (rec) {
    badge.textContent = "🔴 ปิดชั่วคราว";
    badge.style.background = "#ffe3e3";
    badge.style.color = "#c0392b";
    const closed = new Date(rec.closedAt);
    const since = closed.toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    note.textContent = rec.reason
      ? `ปิดชั่วคราวตั้งแต่ ${since} — เหตุผล: "${rec.reason}" — ลูกค้ายังสั่งซื้อไม่ได้จนกว่าจะเปิดรับใหม่`
      : `ปิดชั่วคราวตั้งแต่ ${since} — ลูกค้ายังสั่งซื้อไม่ได้จนกว่าจะเปิดรับใหม่`;
    btn.textContent = "🟢 เปิดรับออเดอร์";
  } else if (autoActive) {
    badge.textContent = `🔴 ปิดอัตโนมัติ (ค้าง ${pend} ใบ)`;
    badge.style.background = "#ffe3e3";
    badge.style.color = "#c0392b";
    note.textContent = `ออเดอร์ค้าง ${pend} ใบ ≥ เกณฑ์ ${auto.threshold} ใบ — ระบบปิดรับออเดอร์อัตโนมัติ — เปิดรับเองเมื่อเคลียร์ต่ำกว่า ${auto.threshold} ใบ (กดปุ่มด้านล่างเพื่อปิดมือก็ได้)`;
    btn.textContent = "🔴 ปิดชั่วคราว";
  } else if (st === false) {
    badge.textContent = "🟢 รับออเดอร์ได้";
    badge.style.background = "#e3f7ea";
    badge.style.color = "#0a7d3c";
    note.textContent = `ยังไม่ปิดชั่วคราว — แต่ตอนนี้อยู่นอกเวลาเปิด-ปิด (${current.open} – ${current.close}) ลูกค้ายังสั่งไม่ได้อัตโนมัติ`;
    btn.textContent = "🔴 ปิดชั่วคราว";
  } else {
    badge.textContent = "🟢 เปิดรับออเดอร์";
    badge.style.background = "#e3f7ea";
    badge.style.color = "#0a7d3c";
    note.textContent = `ร้านเปิดรับออเดอร์ตามปกติ (เวลา ${current.open} – ${current.close}) — ปิดชั่วคราวเพื่อหยุดรับโดยไม่ต้องแก้วลา — เปิดปิดอัตโนมัติตามออเดอร์ค้างได้ (ด้านล่าง)`;
    btn.textContent = "🔴 ปิดชั่วคราว";
  }
}

// ปิดชั่วคราว 2 ขั้น: แตะครั้งแรก → เปิดช่องเหตุผล (ไม่บังคับ) → แตะ "ยืนยัน" อีกครั้ง = ปิดจริง
const closeReasonInput = $("#close-reason");
$("#close-toggle").addEventListener("click", () => {
  const rec = getStoreClosed(currentRestaurantId);
  if (rec) {
    closeReasonInput.hidden = true;
    closeReasonInput.value = "";
    setStoreClosed(currentRestaurantId, false);
    renderClosePanel();
    showToast(`🟢 ${current.name} เปิดรับออเดอร์แล้ว`);
  } else if (!closeReasonInput.hidden) {
    // ยืนยันปิดชั่วคราว (พร้อมเหตุผลที่กรอก)
    const reason = closeReasonInput.value.trim();
    closeReasonInput.hidden = true;
    closeReasonInput.value = "";
    setStoreClosed(currentRestaurantId, true, reason);
    renderClosePanel();
    showToast(`🔴 ${current.name} ปิดรับออเดอร์ชั่วคราวแล้ว — หน้าร้านลูกค้าบล็อกการสั่งซื้อทันที`);
  } else {
    // ขั้นแรก: เปิดช่องเหตุผล
    closeReasonInput.hidden = false;
    closeReasonInput.focus();
    $("#close-toggle").textContent = "✅ ยืนยันปิดชั่วคราว";
  }
});
closeReasonInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("#close-toggle").click();
});

// ตั้งค่า/ปิดการปิดอัตโนมัติตามออเดอร์ค้าง
$("#close-auto").addEventListener("change", () => {
  const on = $("#close-auto").checked;
  setAutoCloseSetting(currentRestaurantId, on, $("#close-auto-n").value);
  renderClosePanel();
  showToast(on ? `🤖 เปิดปิดอัตโนมัติแล้ว — ร้านจะปิดเองเมื่อออเดอร์ค้างถึง ${getAutoCloseSetting(currentRestaurantId).threshold} ใบ` : "🤖 ปิดการทำงานอัตโนมัติแล้ว — กลับไปปิด/เปิดด้วยมือ");
});
$("#close-auto-n").addEventListener("change", () => {
  const auto = getAutoCloseSetting(currentRestaurantId);
  if (auto) {
    setAutoCloseSetting(currentRestaurantId, true, $("#close-auto-n").value);
    renderClosePanel();
    showToast(`🤖 ตั้งเกณฑ์ปิดอัตโนมัติเป็น ${getAutoCloseSetting(currentRestaurantId).threshold} ใบแล้ว`);
  } else {
    $("#close-auto-n").value = 5;
  }
});

/* ===== ค่าจัดส่งตามระยะทาง ===== */
function renderDeliverySettings() {
  const s = getDeliverySettings(currentRestaurantId);
  const base = s ? s.base : (current.deliveryBase !== undefined ? current.deliveryBase : current.deliveryFee);
  const perKm = s ? s.perKm : (current.deliveryPerKm !== undefined ? current.deliveryPerKm : DEFAULT_DELIVERY_PER_KM);
  const freeMin = s ? s.freeMin : current.freeDeliveryMin;
  $("#del-base").value = base;
  $("#del-perkm").value = perKm;
  $("#del-free").value = freeMin;
  $("#delivery-note-badge").textContent = s ? "ตั้งเองสำหรับร้านนี้" : "ใช้ค่าเริ่มต้นของร้าน";
  $("#delivery-note").innerHTML =
    `ค่าส่ง = ค่าเริ่มต้น + ต่อกม. × ระยะทาง (${current.distanceKm} กม.) → เช่น ฿${Math.round(Number(base) + Number(perKm) * Number(current.distanceKm))} · ส่งฟรีเมื่อยอด ≥ ฿${freeMin} — ตั้งเฉพาะร้านนี้ได้ (ข้อมูลแยกกันร้าน)`;
}

$("#del-save").addEventListener("click", () => {
  const v = setDeliverySettings(currentRestaurantId, { base: $("#del-base").value, perKm: $("#del-perkm").value, freeMin: $("#del-free").value });
  renderDeliverySettings();
  showToast(`🛵 ตั้งค่าจัดส่งร้านนี้แล้ว — ค่าส่ง ${v.base}฿ + ${v.perKm}฿/กม. · ส่งฟรีขั้นต่ำ ฿${v.freeMin}`);
});

$("#del-reset").addEventListener("click", () => {
  setDeliverySettings(currentRestaurantId, null);
  renderDeliverySettings();
  showToast(`🛵 คืนค่าเริ่มต้นของร้าน — ค่าส่ง ${current.deliveryFee}฿ (ค่าเริ่มต้น) + ${DEFAULT_DELIVERY_PER_KM}฿/กม.`);
});

/* ===== ค่าธรรมเนียมร้านนี้ ===== */
const restFeeInput = $("#rest-fee-rate");

function renderRestaurantFee() {
  const effective = getRestaurantFeeRate(currentRestaurantId);
  const specific = getRestaurantFeeRates()[currentRestaurantId];
  const promoEnd = getRestaurantPromoEndsAt(currentRestaurantId);
  const badge = $("#fee-effective");
  const note = $("#rest-fee-note");

  restFeeInput.value = specific !== undefined ? specific : "";

  if (promoEnd) {
    const d = new Date(promoEnd).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
    badge.textContent = `🎉 ฟรีค่าธรรมเนียม 30 วัน — หมด ${d}`;
    badge.classList.add("promo");
    note.innerHTML = `ร้านใหม่ได้โปรฯ <b>ฟรีค่าธรรมเนียม 0%</b> จนถึง ${d} — อัตราที่ตั้งในช่องนี้จะเริ่มใช้จริงหลังโปรฯ หมด (อัตราปัจจุบัน: <b>ฟรี 0%</b>)`;
  } else {
    badge.classList.remove("promo");
    badge.textContent = specific !== undefined ? `อัตราเฉพาะร้าน ${effective}%` : `ใช้อัตรารวม ${effective}%`;
    note.innerHTML = specific !== undefined
      ? `ร้านนี้คิดค่าธรรมเนียม <b>${effective}%</b> (ต่างจากอัตรารวม ${getPlatformFeeRate()}%) — คิดจากยอดอาหารหลังส่วนลด ค่าส่งเป็นของไรเดอร์`
      : `ร้านนี้ใช้อัตรารวม <b>${effective}%</b> — ตั้งอัตราเฉพาะร้านได้ (คิดจากยอดอาหารหลังส่วนลด ค่าส่งเป็นของไรเดอร์)`;
  }
}

$("#rest-fee-save").addEventListener("click", () => {
  const v = setRestaurantFeeRate(currentRestaurantId, restFeeInput.value);
  renderRestaurantFee();
  const eff = getRestaurantFeeRate(currentRestaurantId);
  showToast(v === null ? `💸 ล้างอัตราเฉพาะร้าน — ใช้อัตรารวม ${eff}%` : `💸 ตั้งค่าธรรมเนียมร้านนี้ ${v}% แล้ว${getRestaurantPromoEndsAt(currentRestaurantId) ? " (มีผลหลังโปรฯ ร้านใหม่หมด)" : " — อัตราปัจจุบัน " + eff + "%"}`);
});

$("#rest-fee-clear").addEventListener("click", () => {
  setRestaurantFeeRate(currentRestaurantId, null);
  renderRestaurantFee();
  showToast(`💸 ใช้ค่าเริ่มต้น (รวม) — อัตราร้านนี้ ${getRestaurantFeeRate(currentRestaurantId)}%`);
});

/* ===== ภาษีหัก ณ ที่จ่ายไรเดอร์ (ค่าเริ่มต้น + กฎเฉพาะร้าน/ช่วงเวลา) ===== */
const whtDefaultInput = $("#wht-default");
const whtRuleRate = $("#wht-rule-rate");
const whtRuleStart = $("#wht-rule-start");
const whtRuleEnd = $("#wht-rule-end");
const whtRuleRestaurant = $("#wht-rule-restaurant");

function fillWhtRestaurantSelect() {
  whtRuleRestaurant.innerHTML =
    `<option value="">ทุกที่</option>` +
    getRestaurants().map((r) => `<option value="${r.id}">${r.name}</option>`).join("");
}

function fmtWhtDate(v, suffix) {
  if (!v) return suffix;
  try {
    return new Date(v).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch (_) {
    return v;
  }
}

function renderWht() {
  const cfg = getWhtConfig();
  whtDefaultInput.value = cfg.defaultRate;
  // อัตราที่ร้านที่เลือกอยู่ใช้จริงตอนนี้ (สำหรับ badge)
  const eff = getWhtRate(currentRestaurantId);
  $("#wht-effective").textContent = `ร้านนี้ตอนนี้หัก ${eff}%`;
  const rulesEl = $("#wht-rules");
  if (!cfg.rules.length) {
    rulesEl.innerHTML = `<p class="admin-rider-empty">ยังไม่มีกฎอัตราพิเศษ — ใช้อัตราค่าเริ่มต้น ${cfg.defaultRate}% ทุกที่ทุกช่วงเวลา</p>`;
    return;
  }
  rulesEl.innerHTML = cfg.rules
    .map((r) => {
      const rest = r.restaurantId ? getRestaurants().find((x) => String(x.id) === String(r.restaurantId)) : null;
      return `
      <div class="wht-rule">
        <b>${r.rate}%</b>
        <span>${rest ? rest.name : "ทุกที่"}</span>
        <small>${fmtWhtDate(r.start, "ไม่จำกัดเริ่ม")} → ${fmtWhtDate(r.end, "ไม่จำกัดสิ้นสุด")}</small>
        <button type="button" data-wht-del="${r.id}" aria-label="ลบกฎนี้">🗑️</button>
      </div>`;
    })
    .join("");
}

$("#wht-default-save").addEventListener("click", () => {
  const v = setWhtDefaultRate(whtDefaultInput.value);
  renderWht();
  showToast(`🧾 ตั้งอัตราหัก ณ ที่จ่ายค่าเริ่มต้น ${v}% แล้ว — สลิปไรเดอร์คำนวณใหม่`);
});

$("#wht-rule-add").addEventListener("click", () => {
  const rate = whtRuleRate.value.trim();
  if (!(Number(rate) > 0)) {
    showToast("⚠️ กรอกอัตรา % ของกฎก่อน");
    whtRuleRate.focus();
    return;
  }
  const start = whtRuleStart.value;
  const end = whtRuleEnd.value;
  if (start && end && new Date(start).getTime() > new Date(end).getTime()) {
    showToast("⚠️ เวลาเริ่มต้องก่อนเวลาสิ้นสุด");
    return;
  }
  const rule = addWhtRule({ restaurantId: whtRuleRestaurant.value, rate, start, end });
  whtRuleRate.value = "";
  whtRuleStart.value = "";
  whtRuleEnd.value = "";
  renderWht();
  showToast(`🧾 เพิ่มกฎหัก ณ ที่จ่าย ${rule.rate}% แล้ว`);
});

$("#wht-rules").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-wht-del]");
  if (!btn) return;
  deleteWhtRule(btn.dataset.whtDel);
  renderWht();
  showToast("🗑️ ลบกฎหัก ณ ที่จ่ายแล้ว");
});

/* ===== ไรเดอร์ประจำร้าน (whitelist) ===== */
const riderWhitelistEl = $("#rider-whitelist");

function renderRestaurantRiders() {
  const riders = getRiders();
  const selected = getRestaurantRiders(currentRestaurantId);
  const summary = $("#rider-whitelist-summary");

  if (!riders.length) {
    riderWhitelistEl.innerHTML = `<p class="admin-rider-empty">ยังไม่มีไรเดอร์ลงทะเบียน — ไปที่ <a href="rider.html">Rider Dashboard</a> เพื่อลงทะเบียนก่อน</p>`;
    summary.textContent = "";
    return;
  }

  riderWhitelistEl.innerHTML = riders
    .map((r) => `
      <button type="button" class="rider-chip-toggle${selected.includes(r.id) ? " on" : ""}" data-rider-id="${r.id}">
        🛵 ${r.name}${r.phone && r.phone !== "-" ? ` <small>${r.phone}</small>` : ""}
      </button>`)
    .join("");
  summary.textContent = selected.length ? `ไรเดอร์ประจำร้าน ${selected.length} คน` : "ไรเดอร์ทุกคนเห็นงาน";
}

riderWhitelistEl.addEventListener("click", (e) => {
  const chip = e.target.closest(".rider-chip-toggle");
  if (!chip) return;
  const id = chip.dataset.riderId;
  const selected = getRestaurantRiders(currentRestaurantId);
  const idx = selected.indexOf(id);
  if (idx === -1) selected.push(id);
  else selected.splice(idx, 1);
  setRestaurantRiders(currentRestaurantId, selected);
  renderRestaurantRiders();
  showToast(selected.length ? `🛵 ตั้งไรเดอร์ประจำร้าน ${selected.length} คนแล้ว — เฉพาะไรเดอร์ในกลุ่มเห็นงาน` : "🛵 ยกเลิกแล้ว — ไรเดอร์ทุกคนเห็นงานของร้านนี้");
});

// ลิงก์ "รับออเดอร์" ไปยัง dashboard ของร้านที่เลือกอยู่
function updateDashLink() {
  const link = document.getElementById("btn-dash");
  if (link) link.href = `dashboard.html?restaurant=${currentRestaurantId}`;
}

function updateSubtitle() {
  $("#admin-subtitle").textContent = `${current.name} · เพิ่ม แก้ไข หรือลบสินค้าในเมนู`;
}

/* ===== เข้าสู่ระบบร้านค้า / แอดมิน ===== */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// เติมชื่อร้านให้อัตโนมัติจากลิงก์ "ไปจัดการเมนู" หลังสมัครร้าน (admin.html?restaurant=X)
function prefillStoreLogin() {
  const nameEl = $("#store-login-name");
  if (!nameEl) return;
  const fromUrl = Number(new URLSearchParams(location.search).get("restaurant"));
  if (fromUrl) {
    const r = getRestaurant(fromUrl);
    if (r) {
      nameEl.value = r.name;
      const pinEl = $("#store-login-pin");
      if (pinEl) pinEl.focus();
      return;
    }
  }
  // ล็อกอินใหม่จากหน้าเดิม ให้จำชื่อร้านล่าสุด (ถ้ามี) ไว้ช่วยกรอก
  try {
    const last = localStorage.getItem("sangkha-last-store-login");
    if (last) nameEl.value = last;
  } catch (_) { /* ไม่เป็นไร */ }
}

// สลับ UI ตามบทบาท + ซ่อนส่วนของแอดมิน/ร้านอื่นเมื่อเป็นร้านค้า
function renderAuth() {
  const guest = role === "guest";
  $("#admin-login").hidden = !guest;
  $("#admin-active").hidden = guest;
  document.body.classList.toggle("admin-guest", guest);
  document.body.classList.toggle("store-mode", role === "store");
  if (!guest) {
    $("#admin-active-name").textContent =
      role === "admin" ? "🛡️ แอดมิน (เห็นทุกอย่าง + อนุมัติเมนู)" : `🏪 ${storeProfile.name} · ${storeProfile.cuisine}`;
  }
  // ปุ่มลัดหัวบนถูกลบแล้ว (มีในแดชบอร์ดหมวด) — กัน null ถ้าไฟล์เก่ายังมีปุ่มอยู่
  const btnFinance = $("#btn-finance");
  const btnRider = $("#btn-rider");
  if (btnFinance) btnFinance.hidden = role === "store";
  if (btnRider) btnRider.hidden = role === "store";
  renderPending();
  renderPin();
  renderStoreEdit();
  renderClosePanel();
  if (!guest) showAdminHome(); // เข้าแดชบอร์ดหมวดหมู่ทันทีเมื่อล็อกอิน
}

// ล็อกอินร้านด้วยชื่อร้าน + PIN (ไม่เปิดเผยรายชื่อร้าน — กรอกชื่อตรงกับหน้าร้าน)
$("#store-login-btn").addEventListener("click", () => {
  const name = $("#store-login-name").value.trim();
  const pin = $("#store-login-pin").value.trim();
  const store = findStoreByName(name);
  if (!store) {
    showToast("⚠️ ไม่พบร้าน \"" + name + "\" — พิมพ์ชื่อร้านให้ตรงกับหน้าร้าน (เช่น ครัวสังขา)");
    return;
  }
  if (!verifyStorePin(store.id, pin)) {
    showToast("⚠️ PIN ไม่ถูกต้อง — ตรวจ PIN ของร้าน (ร้านพื้นฐานเริ่มต้น 1234)");
    return;
  }
  try { localStorage.setItem("sangkha-last-store-login", store.name); } catch (_) { /* ไม่เป็นไร */ }
  setStoreSession(store.id);
  setAdminSession(false);
  role = "store";
  storeProfile = store;
  currentRestaurantId = Number(store.id);
  current = getRestaurant(currentRestaurantId);
  menu = current.menu;
  editingId = null;
  $("#store-login-name").value = store.name;
  $("#store-login-pin").value = "";
  try { localStorage.setItem("sangkha-active-restaurant", String(store.id)); } catch (_) { /* ไม่เป็นไร */ }
  updateSubtitle();
  updateDashLink();
  renderAuth();
  renderList();
  renderRestaurantRiders();
  renderRestaurantFee();
  renderDeliverySettings();
  renderReviews();
  showToast(`🏪 เข้าสู่ระบบ ${store.name} — เห็นเฉพาะร้านนี้ เพิ่มเมนูต้องรอแอดมินอนุมัติ`);
});

// กด Enter ในช่องชื่อร้าน/PIN = ล็อกอินเลย
["store-login-name", "store-login-pin"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("keydown", (e) => { if (e.key === "Enter") $("#store-login-btn").click(); });
});
const adminPinEl = document.getElementById("admin-login-pin");
if (adminPinEl) adminPinEl.addEventListener("keydown", (e) => { if (e.key === "Enter") $("#admin-login-btn").click(); });

// Ripple effect ปุ่มล็อกอิน (เหมือนหน้า auth)
document.querySelectorAll("#admin-login .login-ripple").forEach((btn) => {
  btn.addEventListener("click", function (e) {
    const r = this.getBoundingClientRect();
    const d = Math.max(r.width, r.height) * 2;
    const span = document.createElement("span");
    span.className = "ripple";
    span.style.width = span.style.height = d + "px";
    span.style.left = e.clientX - r.left - d / 2 + "px";
    span.style.top = e.clientY - r.top - d / 2 + "px";
    this.appendChild(span);
    setTimeout(() => span.remove(), 700);
  });
});

$("#admin-login-btn").addEventListener("click", () => {
  const pin = $("#admin-login-pin").value.trim();
  if (pin !== getAdminPin()) {
    showToast("⚠️ PIN แอดมินไม่ถูกต้อง");
    return;
  }
  setAdminSession(true);
  clearStoreSession();
  role = "admin";
  storeProfile = null;
  $("#admin-login-pin").value = "";
  renderAuth();
  renderPending();
  showToast("🛡️ เข้าสู่ระบบแอดมิน — เห็นทุกอย่าง + อนุมัติเมนูรอตรวจ");
});

$("#admin-logout").addEventListener("click", () => {
  clearStoreSession();
  setAdminSession(false);
  role = "guest";
  storeProfile = null;
  renderAuth();
  showToast("🚪 ออกจากระบบแล้ว — ล็อกอินร้าน/แอดมินเพื่อเข้าหลังร้าน");
});

/* ===== เมนูรออนุมัติ (เฉพาะแอดมิน) ===== */
const PENDING_ACTION_TXT = { add: "➕ เพิ่มเมนู", edit: "✏️ แก้ไขเมนู", delete: "🗑️ ลบเมนู" };

function renderPending() {
  const pending = getPendingMenu();
  const panel = $("#pending-panel");
  panel.hidden = role !== "admin";
  // badge จำนวนรออนุมัติบนการ์ด "เมนู" ในแดชบอร์ด (แอดมินเห็นทันทีไม่ต้องเข้าหมวด)
  const badge = $("#cat-pending-badge");
  if (badge) {
    const show = role === "admin" && pending.length > 0;
    badge.hidden = !show;
    if (show) badge.textContent = pending.length;
  }
  if (role !== "admin") return;
  $("#pending-count").textContent = `${pending.length} รายการ`;
  $("#pending-empty").hidden = pending.length > 0;
  $("#pending-list").innerHTML = pending
    .map((p) => {
      const rest = getRestaurants().find((r) => String(r.id) === String(p.restaurantId));
      const price = p.item.price ? ` · ฿${p.item.price}` : "";
      return `
      <div class="pending-item" data-id="${p.id}">
        <div class="pending-main">
          <b>${PENDING_ACTION_TXT[p.action] || p.action} "${escapeHtml(p.item.name || "")}"</b>
          <span>${rest ? escapeHtml(rest.name) : "ร้าน #" + p.restaurantId}${price}${p.item.category ? ` · ${escapeHtml(p.item.category)}` : ""}</span>
          <small>ส่งเมื่อ ${new Date(p.submittedAt).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small>
        </div>
        <div class="pending-actions">
          <button type="button" class="btn-primary btn-sm" data-approve="${p.id}">✅ อนุมัติ</button>
          <button type="button" class="btn-ghost btn-sm" data-reject="${p.id}">ปฏิเสธ</button>
        </div>
      </div>`;
    })
    .join("");
}

$("#pending-list").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-approve],[data-reject]");
  if (!btn) return;
  const id = btn.dataset.approve || btn.dataset.reject;
  const rec = getPendingMenu().find((p) => p.id === id);
  if (!rec) return;
  if (btn.dataset.approve) {
    const ok = approvePendingMenuItem(id);
    renderPending();
    if (Number(rec.restaurantId) === currentRestaurantId) renderList();
    showToast(ok ? `✅ อนุมัติแล้ว — "${rec.item.name || ""}" ขึ้นเมนู ${getRestaurant(rec.restaurantId).name}` : "⚠️ อนุมัติไม่สำเร็จ — อาจถูกลบ/แก้ไขไปแล้ว");
  } else {
    deletePendingMenuItem(id);
    renderPending();
    showToast(`🚫 ปฏิเสธ "${rec.item.name || ""}" — ไม่นำไปใช้`);
  }
});

/* ===== รีเซ็ต PIN ร้าน (เฉพาะแอดมิน) ===== */
function fillPinRestaurantSelect() {
  const sel = $("#pin-restaurant");
  sel.innerHTML = getRestaurants()
    .map((r) => `<option value="${r.id}">${r.name} · ${r.cuisine}</option>`)
    .join("");
  sel.value = currentRestaurantId;
}

function renderPin() {
  const panel = $("#pin-panel");
  panel.hidden = role !== "admin";
  if (role !== "admin") return;
  const id = $("#pin-restaurant").value;
  const r = getRestaurants().find((x) => String(x.id) === String(id));
  if (!r) return;
  $("#pin-effective").textContent = `PIN ปัจจุบัน: ${getStorePin(id)}`;
  $("#pin-note").innerHTML =
    `ใช้เมื่อร้านลืมรหัส — ตั้ง PIN ใหม่ แล้วแจ้งร้าน <b>${escapeHtml(r.name)}</b> ให้ล็อกอินด้วย PIN ใหม่ (ร้านพื้นฐานเริ่มต้น 1234)`;
}

$("#pin-restaurant").addEventListener("change", renderPin);

$("#pin-save").addEventListener("click", () => {
  const id = $("#pin-restaurant").value;
  const pin = $("#pin-new").value.trim();
  const r = getRestaurants().find((x) => String(x.id) === String(id));
  if (!r) return;
  if (pin.length < 4) {
    showToast("⚠️ PIN ใหม่ต้องอย่างน้อย 4 ตัวอักษร");
    $("#pin-new").focus();
    return;
  }
  setStorePin(id, pin);
  $("#pin-new").value = "";
  renderPin();
  showToast(`🔑 รีเซ็ต PIN ของ ${r.name} เป็น ${pin} แล้ว — แจ้งร้านให้ล็อกอินด้วย PIN ใหม่`);
});

/* ===== แก้ไขข้อมูลร้าน (เฉพาะแอดมิน — ร้านสมัครผิดแล้วแก้เองไม่ได้) ===== */
function fillStoreEditSelect() {
  const sel = $("#store-edit-restaurant");
  sel.innerHTML = getRestaurants()
    .map((r) => `<option value="${r.id}">${r.name} · ${r.cuisine}</option>`)
    .join("");
  sel.value = currentRestaurantId;
}

// อัปเดตตัวเลือกชื่อร้านในทุก select หลังแก้ข้อมูล (ไม่ผูก listener ซ้ำ)
function refreshRestaurantSelectOptions() {
  const sel = $("#restaurant-select");
  sel.innerHTML = getRestaurants()
    .map((r) => `<option value="${r.id}">${r.name} · ${r.cuisine}</option>`)
    .join("");
  sel.value = currentRestaurantId;
  fillPinRestaurantSelect();
  fillStoreEditSelect();
}

// ตัวเลือกโลโก้ (อีโมจิ) + สีพื้นหลัง — คลิกเลือกได้ทันที (เลือกแล้วกดบันทึก)
function buildStoreEditEmojiPicker(selected) {
  const picker = $("#se-emoji-picker");
  picker.innerHTML = EMOJIS.map(
    (e) =>
      `<button type="button" class="emoji-option${e === selected ? " selected" : ""}" data-emoji="${e}" role="option" aria-selected="${e === selected}" aria-label="โลโก้ ${e}">${e}</button>`
  ).join("");
  picker.querySelectorAll(".emoji-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      picker.querySelectorAll(".emoji-option").forEach((b) => {
        b.classList.toggle("selected", b === btn);
        b.setAttribute("aria-selected", b === btn);
      });
    });
  });
}

function buildStoreEditBgPicker(selected) {
  const picker = $("#se-bg-picker");
  picker.innerHTML = BG_PRESETS.map(
    (bg) =>
      `<button type="button" class="bg-option${bg === selected ? " selected" : ""}" data-bg="${bg}" role="radio" aria-checked="${bg === selected}" aria-label="สีพื้นหลัง"></button>`
  ).join("");
  picker.querySelectorAll(".bg-option").forEach((btn) => {
    btn.style.background = btn.dataset.bg;
    btn.addEventListener("click", () => {
      picker.querySelectorAll(".bg-option").forEach((b) => {
        b.classList.toggle("selected", b === btn);
        b.setAttribute("aria-checked", b === btn);
      });
    });
  });
}

function renderStoreEdit() {
  const panel = $("#store-edit-panel");
  panel.hidden = role !== "admin";
  if (role !== "admin") return;
  const id = $("#store-edit-restaurant").value;
  const r = getRestaurants().find((x) => String(x.id) === String(id));
  if (!r) return;
  $("#se-name").value = r.name || "";
  $("#se-cuisine").value = r.cuisine || "";
  $("#se-ad-category").value = getRestaurantAdCategory(id) || "";
  $("#se-open").value = r.open || "";
  $("#se-close").value = r.close || "";
  $("#se-img").value = r.imageUrl || "";
  $("#se-address").value = r.address || "";
  $("#se-distance").value = r.distanceKm || "";
  $("#se-fee").value = r.deliveryFee || "";
  $("#se-free").value = r.freeDeliveryMin || "";
  $("#se-time").value = r.deliveryTime || "";
  $("#se-lat").value = r.lat ?? "";
  $("#se-lng").value = r.lng ?? "";
  buildStoreEditEmojiPicker(r.coverEmoji || "🍔");
  buildStoreEditBgPicker(r.coverBg || BG_PRESETS[0]);
  $("#store-edit-badge").textContent = getStoreEdits()[String(id)] ? "แก้ไขแล้ว (ต่างจากที่สมัคร)" : "ใช้ข้อมูลปัจจุบัน";
  $("#store-edit-note").innerHTML =
    `แก้ครบทุกข้อมูลสมัคร (ชื่อ/ประเภท/โลโก้/สี/เวลา/ที่อยู่/ระยะทาง/ค่าส่ง/พิกัด) — ร้านสมัครผิดแล้วแก้เองไม่ได้ แอดมินแก้ให้ (ส่งผลทั้งหน้าร้าน/หลังร้านทันที) — ร้านที่สมัครลบได้ด้วยปุ่ม 🗑️ (ลบจาก Firestore + เครื่องทั้งหมด)`;
  // ปุ่มลบร้าน: แสดงเฉพาะร้านที่สมัคร (ร้านพื้นฐานลบไม่ได้)
  const delBtn = $("#se-delete");
  if (delBtn) delBtn.hidden = !isRegisteredStore(r.id);
}

$("#store-edit-restaurant").addEventListener("change", renderStoreEdit);

// ค่าตัวเลข: ช่องว่าง = undefined (คืนค่าเดิมของร้าน)
const seNum = (v) => {
  const t = String(v).trim();
  return t === "" ? undefined : Number(t);
};

$("#se-save").addEventListener("click", () => {
  const id = $("#store-edit-restaurant").value;
  const name = $("#se-name").value.trim();
  const cuisine = $("#se-cuisine").value.trim();
  if (!name || !cuisine) {
    showToast("⚠️ ชื่อร้านและประเภทอาหารห้ามว่าง");
    return;
  }
  const rNow = getRestaurant(id); // ค่าปัจจุบัน (เผื่อโลโก้/สีตั้งต้นไม่อยู่ในตัวเลือก → เก็บค่าเดิมไว้)
  const emoji = $("#se-emoji-picker .emoji-option.selected")?.dataset.emoji;
  const bg = $("#se-bg-picker .bg-option.selected")?.dataset.bg;
  setRestaurantAdCategory(id, $("#se-ad-category").value); // หมวดโฆษณาร้าน (ร้านตั้งเองได้ — แอดมินแก้ให้ตรง)
  setStoreEdit(id, {
    name,
    cuisine,
    open: $("#se-open").value,
    close: $("#se-close").value,
    coverEmoji: emoji || rNow.coverEmoji || "🍔",
    coverBg: bg || rNow.coverBg || BG_PRESETS[0],
    imageUrl: $("#se-img").value.trim(),
    address: $("#se-address").value.trim(),
    deliveryTime: $("#se-time").value.trim(),
    distanceKm: seNum($("#se-distance").value),
    deliveryFee: seNum($("#se-fee").value),
    freeDeliveryMin: seNum($("#se-free").value),
    lat: seNum($("#se-lat").value),
    lng: seNum($("#se-lng").value),
  });
  // ถ้าแก้ร้านที่เลือกอยู่ → อัปเดตตัวแปร + ชื่อบนหัวหน้า
  if (Number(id) === currentRestaurantId) {
    current = getRestaurant(currentRestaurantId);
    menu = current.menu;
    updateSubtitle();
  }
  refreshRestaurantSelectOptions();
  renderStoreEdit();
  showToast(`🏪 แก้ไขข้อมูล ${name} แล้ว — หน้าร้าน/หลังร้านอัปเดตทันที`);
});

$("#se-reset").addEventListener("click", () => {
  const id = $("#store-edit-restaurant").value;
  // field ว่าง/undefined = คืนค่าเดิมของร้าน
  setStoreEdit(id, {
    name: "", cuisine: "", open: "", close: "", coverEmoji: "", coverBg: "", imageUrl: "", address: "", deliveryTime: "",
    distanceKm: undefined, deliveryFee: undefined, freeDeliveryMin: undefined, lat: undefined, lng: undefined,
  });
  setRestaurantAdCategory(id, ""); // คืนหมวดโฆษณาเป็น "ทุกหมวด"
  if (Number(id) === currentRestaurantId) {
    current = getRestaurant(currentRestaurantId);
    menu = current.menu;
    updateSubtitle();
  }
  refreshRestaurantSelectOptions();
  renderStoreEdit();
  const r = getRestaurant(id);
  showToast(`↩️ คืนข้อมูลเดิมของ ${r.name} แล้ว`);
});

/* ===== ลบร้านที่สมัคร (Firestore + localStorage ให้ตรงกัน ไม่เหลือ residue) ===== */
$("#se-delete").addEventListener("click", async () => {
  const id = $("#store-edit-restaurant").value;
  const r = getRestaurant(id);
  if (!r || !isRegisteredStore(r.id)) {
    showToast("⚠️ ลบได้เฉพาะร้านที่สมัคร (ร้านพื้นฐานลบไม่ได้)");
    return;
  }
  const pending = getPendingMenu().filter((p) => String(p.restaurantId) === String(r.id)).length;
  if (!confirm(`ลบร้าน "${r.name}" จริงหรือ?\n\nจะลบออกจาก Firestore + ข้อมูลในเครื่องทั้งหมด (เมนู / พิกัด / ค่าส่ง / การตั้งค่า / การติดตาม)${pending ? ` + เมนูที่รออนุมัติ ${pending} รายการ` : ""}\n— ประวัติออเดอร์/การเงินเดิมของแพลตฟอร์มยังคงอยู่`)) return;
  const btn = $("#se-delete");
  btn.disabled = true;
  btn.textContent = "⏳ กำลังลบ…";
  const snap = await removeRegisteredStore(r.id);
  const deletedName = r.name;
  // ถ้าลบร้านที่กำลังจัดการ → สลับไปร้านแรก
  if (Number(id) === currentRestaurantId) {
    currentRestaurantId = Number(getRestaurants()[0].id);
    current = getRestaurant(currentRestaurantId);
    menu = current.menu;
  }
  const reRenderAll = () => {
    refreshRestaurantSelectOptions();
    updateSubtitle();
    updateDashLink();
    renderList();
    renderPending();
    renderReviews();
    renderRestaurantRiders();
    renderRestaurantFee();
    renderWht();
    renderDeliverySettings();
    renderClosePanel();
    renderStoreEdit();
  };
  reRenderAll();
  btn.disabled = false;
  btn.textContent = "🗑️ ลบร้านสมัคร";
  showToast(`🗑️ ลบร้าน "${deletedName}" แล้ว`, {
    ms: 10000,
    undo: async () => {
      await restoreRegisteredStore(snap);
      if (Number(snap.id) === currentRestaurantId) {
        currentRestaurantId = Number(snap.id);
        current = getRestaurant(currentRestaurantId);
        menu = current.menu;
      }
      refreshRestaurantSelectOptions();
      updateSubtitle();
      updateDashLink();
      renderList();
      renderPending();
      renderReviews();
      renderRestaurantRiders();
      renderRestaurantFee();
      renderWht();
      renderDeliverySettings();
      renderClosePanel();
      renderStoreEdit();
      showToast(`↩️ กู้คืนร้าน "${deletedName}" แล้ว — กลับมาเหมือนเดิม (Firestore + เครื่อง)`);
    },
  });
});

/* ===== ตัวอย่างหน้าร้าน (พรีวิวจากค่าที่กรอกใน panel — เห็นผลทันที) — ใช้ storeOpenStatus ร่วมจาก menu-data.js ===== */
function previewHtml() {
  const id = $("#store-edit-restaurant").value;
  const r = getRestaurant(id);
  const emoji = $("#se-emoji-picker .emoji-option.selected")?.dataset.emoji || r.coverEmoji || "🍔";
  const bg = $("#se-bg-picker .bg-option.selected")?.dataset.bg || r.coverBg || BG_PRESETS[0];
  const name = $("#se-name").value.trim() || r.name || "(ชื่อร้าน)";
  const cuisine = $("#se-cuisine").value.trim() || r.cuisine || "(ประเภทอาหาร)";
  const open = $("#se-open").value || r.open || "";
  const close = $("#se-close").value || r.close || "";
  const status = storeOpenStatus(open, close);
  const tempClosed = getStoreClosed(id);
  const statusBadge = tempClosed
    ? `<span class="preview-open-badge closed">🔴 ปิดชั่วคราว${tempClosed.reason ? ` — ${escapeHtml(tempClosed.reason)}` : ""}</span>`
    : status === null
      ? `<span class="preview-open-badge unknown">🕐 ยังไม่ตั้งเวลาเปิด-ปิด</span>`
      : status
        ? `<span class="preview-open-badge open">🟢 เปิดอยู่</span>`
        : `<span class="preview-open-badge closed">🔴 ปิดอยู่</span>`;
  const dist = $("#se-distance").value !== "" ? Number($("#se-distance").value) : r.distanceKm;
  const fee = $("#se-fee").value !== "" ? Number($("#se-fee").value) : r.deliveryFee;
  const free = $("#se-free").value !== "" ? Number($("#se-free").value) : r.freeDeliveryMin;
  const time = $("#se-time").value.trim() || r.deliveryTime || "—";
  const address = $("#se-address").value.trim() || r.address || "";
  const imgUrl = $("#se-img").value.trim() || r.imageUrl || "";
  const rating = Number(r.rating) || 5.0;
  // เมนูตัวอย่าง: 3 รายการแรกของร้าน (เมนูที่ยังใช้งานอยู่ — เมนูที่รออนุมัติจะขึ้นเมื่อแอดมินอนุมัติแล้ว)
  const menuItems = getMenu(id).slice(0, 3);
  return `
    <div class="preview-store" style="background:${bg}">
      ${imgUrl ? `<img class="preview-emoji-img" src="${escapeHtml(imgUrl)}" alt="" loading="lazy" />` : `<div class="preview-emoji">${emoji}</div>`}
      <div class="preview-info">
        <b>${escapeHtml(name)}</b>
        <span>${escapeHtml(cuisine)} · ⭐ ${rating}</span>
        ${statusBadge}
      </div>
    </div>
    <div class="preview-meta">
      ${address ? `<span>🏠 ${escapeHtml(address)}</span>` : ""}
      <span>🕐 เปิด ${open || "—"} – ปิด ${close || "—"}</span>
      <span>📍 ระยะทาง ${dist} กม.</span>
      <span>🛵 ค่าส่ง ฿${fee} · ส่งฟรีเมื่อยอด ≥ ฿${free}</span>
      <span>⏱️ จัดส่ง ${escapeHtml(time)}</span>
    </div>
    <div class="preview-menu-head">🍽️ เมนู (ตัวอย่าง ${menuItems.length ? menuItems.length + " รายการแรก" : "—"})</div>
    ${menuItems.length
      ? `<div class="preview-menu">
          ${menuItems
            .map(
              (m) => `
            <div class="preview-menu-item">
              <div class="preview-menu-img" ${m.img ? "" : `style="background:${m.color}"`} role="img" aria-label="${escapeHtml(m.name)}">${m.img ? `<img src="${m.img}" alt="${escapeHtml(m.name)}" />` : m.emoji}</div>
              <div class="preview-menu-info">
                <b>${escapeHtml(m.name)}</b>
                <span>${escapeHtml(m.category)}</span>
              </div>
              <span class="preview-menu-price">฿${m.price}</span>
            </div>`
            )
            .join("")}
        </div>`
      : `<p class="preview-menu-empty">ยังไม่มีสินค้า — เพิ่มเมนู (ร้านค้าต้องรอแอดมินอนุมัติ) แล้วจะแสดงที่นี่</p>`}
    <p class="preview-note">ตัวอย่างจากค่าที่กรอกอยู่ (ยังไม่บันทึก) — กด "💾 บันทึก" เพื่อให้หน้าร้านจริงอัปเดต · เมนูที่แสดงคือรายการที่อนุมัติแล้ว (คำขอเพิ่ม/แก้/ลบ ยังไม่รวมจนกว่าแอดมินอนุมัติ)</p>`;
}

function refreshPreview() {
  const body = $("#preview-body");
  if (!body || $("#preview-overlay").hidden) return;
  body.innerHTML = previewHtml();
}

$("#se-preview").addEventListener("click", () => {
  $("#preview-overlay").hidden = false;
  document.body.style.overflow = "hidden";
  refreshPreview();
});

$("#preview-close").addEventListener("click", () => {
  $("#preview-overlay").hidden = true;
  document.body.style.overflow = "";
});
$("#preview-overlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) {
    $("#preview-overlay").hidden = true;
    document.body.style.overflow = "";
  }
});

// อัปเดตพรีวิวสดตามที่พิมพ์/เลือก
["se-name", "se-cuisine", "se-open", "se-close", "se-img", "se-address", "se-distance", "se-fee", "se-free", "se-time", "se-lat", "se-lng"].forEach((id) => {
  // se-ad-category เป็น select — กัน reset ไปใช้ text ผิด
  if (id === "se-ad-category") return;
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", refreshPreview);
});
$("#se-emoji-picker").addEventListener("click", refreshPreview);
$("#se-bg-picker").addEventListener("click", refreshPreview);
$("#store-edit-restaurant").addEventListener("change", refreshPreview);

// รีเฟรชพรีวิวทุก 30 วิ ขณะเปิดอยู่ (สถานะเปิด/ปิดร้านอัปเดตตามเวลาจริง)
setInterval(() => {
  const ov = $("#preview-overlay");
  if (ov && !ov.hidden) refreshPreview();
}, 30000);

/* ===== หมวดหมู่ ===== */
function buildCategorySelect() {
  const sel = $("#f-category");
  sel.innerHTML = CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");
}

/* ===== โมดัล ===== */
function openModal(item) {
  editingId = item ? item.id : null;
  $("#modal-title").textContent = item ? "แก้ไขสินค้า" : "เพิ่มสินค้า";
  $("#btn-save").textContent = item ? "บันทึกการแก้ไข" : "บันทึกสินค้า";

  $("#f-id").value = item ? item.id : "";
  $("#f-name").value = item ? item.name : "";
  $("#f-price").value = item ? item.price : "";
  $("#f-category").value = item ? item.category : CATEGORIES[0];
  $("#f-desc").value = item ? item.desc || "" : "";
  buildEmojiPicker(item ? item.emoji : "🍔");
  pendingImg = item ? item.img || null : null;
  lastFoodSeed = null;
  foodVariation = 0;
  imgInput.value = "";
  renderImgPreview();

  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => $("#f-name").focus(), 50);
}

function closeModal() {
  overlay.hidden = true;
  document.body.style.overflow = "";
}

/* ===== บันทึก ===== */
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = $("#f-name").value.trim();
  const price = Number($("#f-price").value);
  if (!name) { showToast("⚠️ กรุณากรอกชื่อสินค้า"); $("#f-name").focus(); return; }
  if (!price || price < 1) { showToast("⚠️ กรุณากรอกราคาที่ถูกต้อง"); $("#f-price").focus(); return; }

  const emoji = emojiPicker.querySelector(".emoji-option.selected")?.dataset.emoji || "🍔";
  const color = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];

  const data = {
    name,
    price,
    category: $("#f-category").value,
    desc: $("#f-desc").value.trim(),
    emoji,
    color,
    img: pendingImg || undefined,
  };

  // ร้านค้า (ไม่ใช่แอดมิน): ส่งเข้าคิวรออนุมัติ — ยังไม่ขึ้นเมนูจริง
  if (role === "store") {
    const item = editingId ? { ...menu.find((m) => m.id === editingId), ...data } : data;
    addPendingMenuItem(currentRestaurantId, editingId ? "edit" : "add", item);
    showToast(editingId ? `📨 ขออนุมัติแก้ไข "${name}" แล้ว — รอแอดมินอนุมัติ` : `📨 ขออนุมัติเพิ่ม "${name}" แล้ว — รอแอดมินอนุมัติ`);
    renderList();
    closeModal();
    return;
  }

  if (editingId) {
    const idx = menu.findIndex((m) => m.id === editingId);
    if (idx !== -1) menu[idx] = { ...menu[idx], ...data };
    showToast(`✓ แก้ไข "${name}" เรียบร้อย`);
  } else {
    menu.push({ id: nextId(menu), ...data });
    showToast(`✓ เพิ่ม "${name}" ลงเมนูแล้ว`);
  }

  setMenu(currentRestaurantId, menu);
  renderList();
  closeModal();
});

/* ===== เหตุการณ์ ===== */
$("#btn-add").addEventListener("click", () => openModal(null));
$("#btn-cancel").addEventListener("click", closeModal);
$("#modal-close").addEventListener("click", closeModal);

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!overlay.hidden) closeModal();
  if (!adOverlay.hidden) closeAdModal();
  if (!$("#preview-overlay").hidden) {
    $("#preview-overlay").hidden = true;
    document.body.style.overflow = "";
  }
});

listEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-btn");
  if (!btn) return;
  const item = menu.find((m) => m.id === Number(btn.dataset.id));
  if (!item) return;

  if (btn.dataset.action === "edit") {
    openModal(item);
  } else if (btn.dataset.action === "delete") {
    if (!confirm(`ลบ "${item.name}" ออกจากเมนู?`)) return;
    // ร้านค้า: ส่งขออนุมัติลบ — ยังไม่ลบจริงจนกว่าแอดมินอนุมัติ
    if (role === "store") {
      addPendingMenuItem(currentRestaurantId, "delete", { id: item.id, name: item.name });
      renderList();
      showToast(`📨 ขออนุมัติลบ "${item.name}" แล้ว — รอแอดมินอนุมัติ`);
      return;
    }
    menu = menu.filter((m) => m.id !== item.id);
    setMenu(currentRestaurantId, menu);
    renderList();
    showToast(`🗑️ ลบ "${item.name}" แล้ว`);
  }
});

/* ===== จัดการโฆษณา (สไลด์บนสุด) ===== */
let ads = getAds();
let editingAdId = null;
let selectedBg = BG_PRESETS[0];

const adListEl = $("#ad-list");
const adEmptyEl = $("#ad-empty");
const adOverlay = $("#ad-modal-overlay");
const adForm = $("#ad-form");
const adEmojiPicker = $("#ad-emoji-picker");
const bgPicker = $("#bg-picker");

function renderAds() {
  const stats = getAdStats();
  const total = ads.reduce((sum, a) => sum + (stats[a.id] || 0), 0);

  adListEl.innerHTML = ads
    .map(
      (a) => `
      <article class="ad-card" style="background:${a.bg}" data-id="${a.id}">
        <div class="ad-card-preview" aria-hidden="true">${a.emoji}</div>
        <div class="ad-card-info">
          <div class="ad-card-title">
            ${a.title}
            ${a.video ? `<span class="ad-card-video-badge">🎬 คลิป: ${a.video}</span>` : `<span class="ad-card-video-badge">🖼 ภาพนิ่ง</span>`}
            <span class="ad-click-count">👆 ${stats[a.id] || 0} คลิก</span>
          </div>
          <div class="ad-status-row">${adStatusBadge(a)}</div>
          <p class="ad-card-desc">${a.desc || "—"} · ปุ่ม: ${a.cta || "ดูโปรโมชัน"}</p>
          ${a.discountType === "delivery" || Number(a.discountValue) > 0
            ? `<span class="ad-coupon-badge">🎟️ ${couponValueLabel(a)}${Number(a.minOrder) > 0 ? ` · ขั้นต่ำ ${a.minOrder}฿` : ""}</span>`
            : ""}
        </div>
        <div class="ad-card-actions">
          <button class="icon-btn edit" data-action="edit" data-id="${a.id}" aria-label="แก้ไขโฆษณา ${a.title}">✏️</button>
          <button class="icon-btn delete" data-action="delete" data-id="${a.id}" aria-label="ลบโฆษณา ${a.title}">🗑️</button>
        </div>
      </article>`
    )
    .join("");

  $("#ad-total-clicks").textContent = total > 0 ? `👆 รวม ${total} คลิก` : "";
  adEmptyEl.hidden = ads.length > 0;
}

function buildAdEmojiPicker(selected) {
  adEmojiPicker.innerHTML = EMOJIS.map(
    (e) =>
      `<button type="button" class="emoji-option${e === selected ? " selected" : ""}" data-emoji="${e}" role="option" aria-selected="${e === selected}" aria-label="รูป ${e}">${e}</button>`
  ).join("");
  adEmojiPicker.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".emoji-option");
    if (!btn) return;
    $$("#ad-emoji-picker .emoji-option").forEach((b) => {
      b.classList.toggle("selected", b === btn);
      b.setAttribute("aria-selected", b === btn);
    });
  });
}

function buildBgPicker(selected) {
  bgPicker.innerHTML = BG_PRESETS.map(
    (bg) =>
      `<button type="button" class="bg-option${bg === selected ? " selected" : ""}" data-bg="${bg}" role="radio" aria-checked="${bg === selected}" aria-label="สีพื้นหลัง"></button>`
  ).join("");
  $$(".bg-option").forEach((b) => {
    b.style.background = b.dataset.bg;
  });
  bgPicker.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".bg-option");
    if (!btn) return;
    selectedBg = btn.dataset.bg;
    $$(".bg-option").forEach((b) => {
      b.classList.toggle("selected", b === btn);
      b.setAttribute("aria-checked", b === btn);
    });
  });
}

// timestamp ms → ค่า datetime-local (YYYY-MM-DDTHH:mm ตามเวลาท้องถิ่น)
function toDateTimeLocal(ts) {
  if (!Number(ts)) return "";
  const d = new Date(Number(ts));
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function openAdModal(ad) {
  editingAdId = ad ? ad.id : null;
  $("#ad-modal-title").textContent = ad ? "แก้ไขโฆษณา" : "เพิ่มโฆษณา";
  $("#af-save").textContent = ad ? "บันทึกการแก้ไข" : "บันทึกโฆษณา";

  $("#af-id").value = ad ? ad.id : "";
  $("#af-category").value = ad ? ad.category || "" : "";
  $("#af-title").value = ad ? ad.title : "";
  $("#af-cta").value = ad ? ad.cta || "" : "ดูโปรโมชัน";
  $("#af-desc").value = ad ? ad.desc || "" : "";
  $("#af-video").value = ad ? ad.video || "" : "";
  $("#af-video-warn").hidden = true;
  pendingAdImg = ad ? ad.aiImg || null : null;
  pendingAdRef = ad ? ad.aiRef || null : null;
  pendingIconImg = ad ? ad.iconImg || null : null;
  $("#af-ai-text").value = ad ? ad.aiText || "" : "";
  $("#af-motion").checked = !!(ad && ad.aiMotion);
  $("#af-title-anim").value = ad && ad.titleAnim ? ad.titleAnim : "none";
  lastAdSeed = null;
  adVariation = 0;
  renderAdBannerPreview();
  renderAdRefPreview();
  renderAdIconPreview();
  $("#af-terms").value = ad ? ad.terms || "" : "";
  $("#af-discount-type").value = ad && ad.discountType ? ad.discountType : "";
  $("#af-discount-value").value = ad && Number(ad.discountValue) > 0 ? ad.discountValue : "";
  $("#af-min-order").value = ad && Number(ad.minOrder) > 0 ? ad.minOrder : "";
  $("#af-start-at").value = toDateTimeLocal(ad && ad.startAt);
  $("#af-end-at").value = toDateTimeLocal(ad && ad.endAt);
  selectedBg = ad ? ad.bg : BG_PRESETS[0];
  buildAdEmojiPicker(ad ? ad.emoji : "🍔");
  buildBgPicker(selectedBg);

  adOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => $("#af-title").focus(), 50);
}

function closeAdModal() {
  adOverlay.hidden = true;
  document.body.style.overflow = "";
}

/* ตรวจว่าคลิปวิดีโอโหลดได้จริงไหม: ลิงก์เต็ม (https://...) ตรวจข้าม origin แบบ best-effort — ชื่อไฟล์ในโฟลเดอร์ ตรวจ .mp4/.webm ตรง origin เดียวกัน (สถานะจริง) */
async function checkVideoAvailable(rawVideo) {
  if (!rawVideo) return true; // เว้นว่าง = ใช้พื้นสี + อีโมจิแทน ไม่ต้องตรวจ
  if (/^https?:\/\//i.test(rawVideo)) {
    try {
      const res = await fetch(rawVideo, { method: "HEAD" });
      if (res.ok) return true;
    } catch (_) { /* ลองวิธีถัดไป */ }
    try {
      const res2 = await fetch(rawVideo, { method: "GET", headers: { Range: "bytes=0-0" } });
      if (res2.ok) return true;
    } catch (_) { /* ลองวิธีถัดไป */ }
    try {
      // CORS บล็อก HEAD/GET ธรรมดา — no-cors เช็คแค่เชื่อมต่อถึงเซิร์ฟเวอร์ได้ (มองไม่เห็นสถานะ)
      await fetch(rawVideo, { method: "HEAD", mode: "no-cors" });
      return true;
    } catch (_) { return false; }
  }
  const base = rawVideo.replace(/\.(mp4|webm)$/i, "");
  for (const ext of ["mp4", "webm"]) {
    try {
      const res = await fetch(`${base}.${ext}`, { method: "HEAD" });
      if (res.ok) return true;
    } catch (_) { /* ลองนามสกุลถัดไป */ }
  }
  return false;
}

/* เช็คสดทุกครั้งที่พิมพ์/วางลิงก์ (กันรอถึงตอนบันทึก) — เงียบถ้ายังพิมพ์อยู่ */
let videoCheckTimer = null;
$("#af-video").addEventListener("input", () => {
  $("#af-video-warn").hidden = true;
  clearTimeout(videoCheckTimer);
  videoCheckTimer = setTimeout(async () => {
    const v = $("#af-video").value.trim();
    if (!v) return;
    const ok = await checkVideoAvailable(v);
    if (v !== $("#af-video").value.trim()) return; // ผู้ใช้เปลี่ยนไปแล้วระหว่างตรวจ
    if (!ok) showToast("⚠️ วิดีโอนี้โหลดไม่ได้ — ตรวจ URL หรือชื่อไฟล์ให้ถูกต้อง");
    $("#af-video-warn").hidden = ok;
  }, 700);
});

/* ตั้งช่วงเวลาออกอากาศแบบเร็ว: เริ่มทันที + สิ้นสุดตามปุ่มที่กด (หรือล้าง) */
document.querySelectorAll(".quick-range-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.clear) {
      $("#af-start-at").value = "";
      $("#af-end-at").value = "";
      return;
    }
    const hours = Number(btn.dataset.hours);
    const now = Date.now();
    $("#af-start-at").value = toDateTimeLocal(now);
    $("#af-end-at").value = toDateTimeLocal(now + hours * 3600 * 1000);
  });
});

adForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = $("#af-title").value.trim();
  if (!title) { showToast("⚠️ กรุณากรอกหัวข้อโฆษณา"); $("#af-title").focus(); return; }

  const emoji = adEmojiPicker.querySelector(".emoji-option.selected")?.dataset.emoji || "🍔";
  const startAt = $("#af-start-at").value ? new Date($("#af-start-at").value).getTime() : 0;
  const endAt = $("#af-end-at").value ? new Date($("#af-end-at").value).getTime() : 0;
  if (startAt && endAt && startAt >= endAt) {
    showToast("⚠️ เวลาเริ่มต้องก่อนเวลาสิ้นสุด");
    return;
  }

  // วิดีโอ: วางลิงก์เต็ม (https://...mp4/webm) ได้โดยตรง — ถ้าเป็นชื่อไฟล์เฉย ๆ ตัดนามสกุลออก (โฟลเดอร์ต้องมี {ชื่อ}.mp4/.webm)
  const rawVideo = $("#af-video").value.trim();
  const video = rawVideo && !/^https?:\/\//i.test(rawVideo) ? rawVideo.replace(/\.(mp4|webm)$/i, "") : rawVideo;

  // ตรวจก่อนบันทึก: วิดีโอโหลดไม่ได้ = เตือนทันที + ไม่บันทึก (แทนการเงียบ ๆ ซ่อนที่หน้าร้าน)
  if (video) {
    const ok = await checkVideoAvailable(rawVideo);
    if (!ok) {
      const warn = $("#af-video-warn");
      warn.hidden = false;
      showToast("⛔ ยังไม่บันทึก — วิดีโอนี้โหลดไม่ได้ (ลิงก์เสีย / ไม่มีไฟล์ในโฟลเดอร์)");
      $("#af-video").focus();
      return;
    }
    $("#af-video-warn").hidden = true;
  }

  const data = {
    title,
    emoji,
    category: $("#af-category").value || undefined,
    desc: $("#af-desc").value.trim(),
    cta: $("#af-cta").value.trim() || "ดูโปรโมชัน",
    bg: selectedBg,
    aiImg: pendingAdImg || undefined,
    aiRef: pendingAdRef || undefined,
    aiText: $("#af-ai-text").value.trim() || undefined,
    aiMotion: $("#af-motion").checked || undefined,
    iconImg: pendingIconImg || undefined,
    titleAnim: $("#af-title-anim").value === "none" ? undefined : $("#af-title-anim").value,
    video,
    terms: $("#af-terms").value.trim(),
    discountType: $("#af-discount-type").value,
    discountValue: Number($("#af-discount-value").value || 0),
    minOrder: Number($("#af-min-order").value || 0),
    startAt,
    endAt,
  };

  if (editingAdId) {
    const idx = ads.findIndex((a) => a.id === editingAdId);
    if (idx !== -1) ads[idx] = { ...ads[idx], ...data };
    showToast(`✓ แก้ไขโฆษณา "${title}" เรียบร้อย`);
  } else {
    ads.push({ id: nextId(ads), ...data });
    showToast(`✓ เพิ่มโฆษณา "${title}" แล้ว`);
  }

  setAds(ads);
  renderAds();
  closeAdModal();
});

$("#btn-add-ad").addEventListener("click", () => openAdModal(null));
$("#af-cancel").addEventListener("click", closeAdModal);
$("#ad-modal-close").addEventListener("click", closeAdModal);

adOverlay.addEventListener("click", (e) => {
  if (e.target === adOverlay) closeAdModal();
});

adListEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-btn");
  if (!btn) return;
  const ad = ads.find((a) => a.id === Number(btn.dataset.id));
  if (!ad) return;

  if (btn.dataset.action === "edit") {
    openAdModal(ad);
  } else if (btn.dataset.action === "delete") {
    if (!confirm(`ลบโฆษณา "${ad.title}" ?`)) return;
    ads = ads.filter((a) => a.id !== ad.id);
    setAds(ads);
    renderAds();
    showToast(`🗑️ ลบโฆษณา "${ad.title}" แล้ว`);
  }
});

/* ===== รีวิวจากลูกค้า (ดู + ตอบกลับ) ===== */
const reviewListEl = $("#review-list");

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

function renderReviews() {
  const reviews = getReviews()
    .filter((r) => r.restaurantId === currentRestaurantId)
    .sort((a, b) => b.createdAt - a.createdAt);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  $("#rev-summary").textContent = reviews.length ? `⭐ เฉลี่ย ${avg.toFixed(1)} · ${reviews.length} รีวิว` : "";
  reviewListEl.innerHTML = reviews.map(reviewCard).join("");
  $("#review-empty").hidden = reviews.length > 0;
}

reviewListEl.addEventListener("click", (e) => {
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
    addReviewReply(orderId, currentRestaurantId, text);
    renderReviews();
    showToast("💬 ส่งคำตอบแล้ว");
  } else if (action === "delete") {
    if (!confirm("ลบคำตอบของร้านออก?")) return;
    addReviewReply(orderId, currentRestaurantId, "");
    renderReviews();
    showToast("🗑️ ลบคำตอบแล้ว");
  }
});

// คิวรออนุมัติเปลี่ยนจาก Firestore (ร้าน/แอดมินเครื่องอื่น) → อัปเดตจอทันที
if (!document.__sangkhaFbPending) {
  document.__sangkhaFbPending = true;
  document.addEventListener("sangkha:firebase-pending", () => {
    renderPending();
    renderList();
  });
}

// รีวิว/คำตอบอัปเดตสด (ลูกค้าส่งรีวิวในแท็บอื่น) + ทะเบียนไรเดอร์เปลี่ยน (ลงทะเบียนที่ Rider Dashboard) + อัตราค่าธรรมเนียม
window.addEventListener("storage", (e) => {
  if (e.key === REVIEWS_KEY) renderReviews();
  if (e.key === RIDERS_KEY) renderRestaurantRiders();
  if (e.key === "sangkha-restaurant-fees" || e.key === "sangkha-platform-fee" || e.key === "sangkha-registered-stores") renderRestaurantFee();
  if (e.key === "sangkha-restaurant-delivery") renderDeliverySettings();
  if (e.key === WHT_KEY) renderWht();
  if (e.key === PENDING_MENU_KEY) { renderPending(); renderList(); }
  if (e.key === STORE_PINS_KEY) renderPin();
  if (e.key === STORE_EDITS_KEY) renderStoreEdit();
  if (e.key === STORE_CLOSED_KEY) {
    renderClosePanel();
    renderStoreEdit(); // พรีวิว badge สะท้อนสถานะปิดชั่วคราว
  }
  if (e.key === AUTO_CLOSE_KEY) renderClosePanel();
  if (e.key === ORDERS_KEY) renderClosePanel(); // ออเดอร์ค้างเปลี่ยน → สถานะปิดอัตโนมัติอัปเดต
});

/* ===== แจ้งเตือน ===== */
const toastEl = $("#toast");
const toastMsg = $("#toast-msg");
const toastUndo = $("#toast-undo");
// showToast(msg) ธรรมดา / showToast(msg, { undo: fn, ms: 10000 }) = มีปุ่ม "↩️ เลิกทำ" ค้างตาม ms
function showToast(msg, opts = {}) {
  toastMsg.textContent = msg;
  toastUndo.hidden = !opts.undo;
  toastUndo.onclick = null;
  if (opts.undo) toastUndo.onclick = () => { clearTimeout(showToast._t); toastEl.classList.remove("show"); opts.undo(); };
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), opts.ms || 1800);
}

/* ===== เริ่มต้น ===== */
prefillStoreLogin();
fillPinRestaurantSelect();
fillStoreEditSelect();
renderAuth();
buildRestaurantSelect();
buildCategorySelect();
renderList();
renderAds();
renderReviews();
renderRestaurantRiders();
renderRestaurantFee();
renderDeliverySettings();
fillWhtRestaurantSelect();
renderWht();
renderPending();
renderPin();
renderStoreEdit();

// 🔥 Firebase: เชื่อม Firestore (ถ้าตั้งค่า config แล้ว) — ร้าน/ไรเดอร์ที่สมัครจากเครื่องอื่นจะโผล่ในหน้า admin
initFirebaseCollections();
document.addEventListener("sangkha:firebase-restaurants", () => {
  buildRestaurantSelect();
  fillWhtRestaurantSelect();
  renderStoreEdit();
});
document.addEventListener("sangkha:firebase-riders", () => renderRestaurantRiders());
// 🔥 เมนูจาก Firestore อัปเดต (เพิ่ม/แก้จากเครื่องอื่น หรือตอนโหลดครั้งแรก) → รีเฟรชรายการสินค้าของร้านที่เปิดอยู่
//   (หลังร้านอ่านเมนู Firestore เป็นหลักเหมือนหน้าร้าน — localStorage เป็นแค่ตัวสำรอง)
document.addEventListener("sangkha:firebase-menus", () => {
  current = getRestaurant(currentRestaurantId);
  menu = current.menu;
  renderList();
  refreshPreview();
});

/* ============================================================
   แดชบอร์ดแอดมินแบบหมวดหมู่ (UI ใหม่ — ไม่แตะระบบเดิม)
   ------------------------------------------------------------
   หน้าแรก = สรุปตัวเลข + การ์ดหมวด 7 ใบ → กดเข้าแต่ละหมวด
   เห็นเฉพาะ panel กลุ่มนั้น (id/ฟังก์ชันเดิมทั้งหมดยังใช้เหมือนเดิม)
   ============================================================ */
function renderAdminCats() {
  const wrap = $("#admin-cats");
  if (!wrap) return;
  wrap.innerHTML = ADMIN_CATS
    .map((c) =>
      '<button type="button" class="admin-cat-card" data-cat="' + c.key + '">' +
      '<span class="cat-ico ' + c.color + '">' + c.icon + "</span>" +
      '<span class="cat-txt"><b>' + c.title + (c.key === "menu" ? '<em class="cat-badge" id="cat-pending-badge" hidden></em>' : "") + "</b><span>" + c.desc + "</span></span>" +
      '<span class="cat-go" aria-hidden="true">›</span>' +
      "</button>"
    )
    .join("");
  renderPending(); // อัปเดต badge จำนวนรออนุมัติบนการ์ดเมนู
}

// จำนวนลูกค้า = บัญชีที่สมัคร + เบอร์ลูกค้าที่เคยสั่ง (ไม่นับซ้ำ)
function countCustomers() {
  let n = 0;
  try {
    const raw = localStorage.getItem("sangkha-customer-accounts");
    if (raw) n += Object.keys(JSON.parse(raw)).length;
  } catch (_) { /* ไม่เป็นไร */ }
  try {
    n += new Set(getOrders().map((o) => (o.customer && (o.customer.phone || o.customer.name || "")) || "")).size;
  } catch (_) { /* ไม่เป็นไร */ }
  return n;
}

function renderAdminSummary() {
  const orders = getOrders();
  const todayStr = new Date().toDateString();
  const salesToday = orders
    .filter((o) => o.status !== "ยกเลิก" && o.status !== "cancelled" && new Date(o.createdAt).toDateString() === todayStr)
    .reduce((s, o) => s + (Number(o.total) || 0), 0);
  $("#sum-orders").textContent = orders.length;
  $("#sum-restaurants").textContent = getRestaurants().length;
  $("#sum-riders").textContent = getRiders().length;
  $("#sum-customers").textContent = countCustomers();
  $("#sum-sales-today").textContent = "฿" + salesToday.toLocaleString("th-TH");
}

// สรุปในหมวด ออเดอร์ (แอดมิน = ทั้งแพลตฟอร์ม / ร้าน = เฉพาะร้านตัวเอง)
function renderOrdersCat() {
  const el = $("#admin-orders-summary");
  if (!el) return;
  const orders = role === "store" ? getOrdersFor(currentRestaurantId) : getOrders();
  const cnt = (st) => orders.filter((o) => o.status === st).length;
  const total = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  el.innerHTML =
    '<div class="admin-fee-head"><b>📦 สรุปออเดอร์' + (role === "store" ? " (ร้านนี้)" : " (ทั้งแพลตฟอร์ม)") + "</b></div>" +
    '<div class="admin-cat-stats">' +
    '<div class="admin-cat-stat"><b>' + cnt("ใหม่") + "</b><span>รอรับ</span></div>" +
    '<div class="admin-cat-stat"><b>' + cnt("กำลังเตรียม") + "</b><span>กำลังเตรียม</span></div>" +
    '<div class="admin-cat-stat"><b>' + cnt("พร้อมส่ง") + "</b><span>พร้อมส่ง</span></div>" +
    '<div class="admin-cat-stat"><b>' + cnt("กำลังจัดส่ง") + "</b><span>กำลังจัดส่ง</span></div>" +
    '<div class="admin-cat-stat"><b>' + cnt("เสร็จสิ้น") + "</b><span>เสร็จสิ้น</span></div>" +
    '<div class="admin-cat-stat"><b>' + orders.length + "</b><span>ทั้งหมด · ฿" + Number(total || 0).toLocaleString("th-TH") + "</span></div>" +
    "</div>" +
    '<div class="admin-cat-action">' +
    '<a class="btn-primary" href="dashboard.html">📋 ไปรับออเดอร์ (dashboard)</a>' +
    "</div>";
}

// สรุปในหมวด ลูกค้า (เฉพาะแอดมิน)
function renderCustomersCat() {
  const el = $("#admin-customers-summary");
  if (!el) return;
  const orders = getOrders();
  const uniquePhones = new Set(orders.map((o) => (o.customer && o.customer.phone) || "").filter(Boolean));
  const spent = {}; // เบอร์ → ยอดรวม
  orders.forEach((o) => {
    const p = (o.customer && o.customer.phone) || "";
    if (p) spent[p] = (spent[p] || 0) + (Number(o.total) || 0);
  });
  const top = Object.entries(spent).sort((a, b) => b[1] - a[1]).slice(0, 5);
  el.innerHTML =
    '<div class="admin-fee-head"><b>👤 ลูกค้า</b><span class="admin-fee-badge">' + countCustomers() + " คน</span></div>" +
    '<div class="admin-cat-stats">' +
    '<div class="admin-cat-stat"><b>' + uniquePhones.size + "</b><span>เบอร์ที่เคยสั่ง</span></div>" +
    '<div class="admin-cat-stat"><b>฿' + Number(Object.values(spent).reduce((a, b) => a + b, 0) || 0).toLocaleString("th-TH") + "</b><span>ยอดรวมที่สั่ง</span></div>" +
    "</div>" +
    (top.length
      ? '<div class="pending-list">' +
        top.map(([p, v], i) => {
          const medal = ["🥇", "🥈", "🥉"][i] || "🏅";
          return '<div class="pending-item"><span>' + medal + " " + p + "</span><b>฿" + Number(v).toLocaleString("th-TH") + "</b></div>";
        }).join("") +
        "</div>"
      : '<p class="admin-fee-note">ยังไม่มีลูกค้าสั่งซื้อ — เมื่อลูกค้าสั่งผ่านหน้าร้าน จะเห็นสรุปที่นี่</p>') +
    '<div class="admin-cat-action"><a class="btn-primary" href="index.html">🍜 เปิดหน้าร้านลูกค้า</a></div>';
}

/* ===== สลับหน้า: แดชบอร์ดหลัก ↔ หมวด ===== */
function showAdminHome() {
  if (role === "guest") return;
  $("#admin-home").hidden = false;
  $("#admin-cat-view").hidden = true;
  document.querySelectorAll(".admin-cat-group").forEach((g) => g.classList.remove("active"));
  renderAdminSummary();
  renderAdminCats();
  window.scrollTo(0, 0);
}

function showAdminCat(key) {
  const cat = ADMIN_CATS.find((c) => c.key === key);
  if (!cat) return;
  $("#admin-home").hidden = true;
  $("#admin-cat-view").hidden = false;
  $("#admin-cat-title").textContent = cat.title;
  document.querySelectorAll(".admin-cat-group").forEach((g) => g.classList.toggle("active", g.dataset.group === key));
  if (key === "orders") renderOrdersCat();
  if (key === "customers") renderCustomersCat();
  window.scrollTo(0, 0);
}

// คลิกการ์ดหมวด
$("#admin-cats") && $("#admin-cats").addEventListener("click", (e) => {
  const card = e.target.closest(".admin-cat-card");
  if (card) showAdminCat(card.dataset.cat);
});
// กลับหน้าหลัก
$("#admin-cat-back") && $("#admin-cat-back").addEventListener("click", showAdminHome);

/* ===== เริ่มต้น: ถ้าล็อกอินอยู่แล้ว → แสดงแดชบอร์ด ===== */
if (role !== "guest") {
  renderAdminSummary();
  renderAdminCats();
} else {
  // แขก: ซ่อนทั้งแดชบอร์ดและหมวด (CSS จัดการ)
  $("#admin-home").hidden = false;
  $("#admin-cat-view").hidden = true;
}
