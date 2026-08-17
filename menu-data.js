/* ===== ชั้นข้อมูลร่วม: ร้านค้าหลายร้าน + เมนู (ใช้ทั้งหน้าร้านและหน้า admin) ===== */
const MENU_KEY = "sangkha-menu";

const RESTAURANTS = [
  {
    id: 1,
    name: "ครัวสังขา", cuisine: "อาหารไทย · อาหารตามสั่ง",
    coverEmoji: "🍜", coverBg: "linear-gradient(135deg, #ffb35c, #ff6b35 55%, #e0482b)",
    rating: 4.8, reviews: 1240, open: "10:00", close: "22:00", distanceKm: 1.2,
    deliveryFee: 30, freeDeliveryMin: 300, deliveryTime: "20–30 นาที",
    defaultMenu: [
      { id: 1, name: "ข้าวผัดปู", price: 95, category: "แนะนำ", desc: "ข้าวผัดหอมกลิ่นกระทะ กับเนื้อปูสด ๆ เสิร์ฟพร้อมไข่ข้น", emoji: "🦀", color: "#ffd8a8" },
      { id: 2, name: "ต้มยำกุ้งน้ำข้น", price: 120, category: "แนะนำ", desc: "กุ้งสดตัวโต น้ำซุปเข้มข้น เปรี้ยว เผ็ด ถึงเครื่อง", emoji: "🍤", color: "#ffc9c9" },
      { id: 3, name: "ผัดไทยกุ้งสด", price: 85, category: "จานหลัก", desc: "เส้นจันท์เหนียวนุ่ม คลุกเคล้ากับกุ้งสด ถั่วงอก และมะนาวสด", emoji: "🍜", color: "#ffe8a3" },
      { id: 4, name: "ข้าวกะเพราหมูกรอบ", price: 75, category: "จานหลัก", desc: "หมูกรอบชิ้นใหญ่ ใบกะเพราหอม ไข่ดาวกรอบ ๆ ขอบไหม้", emoji: "🍳", color: "#b5e6b5" },
      { id: 5, name: "ส้มตำไทย", price: 60, category: "จานหลัก", desc: "ตำสด ๆ ใส่ปูดอง มะเขือเทศ มะละกอกรอบ", emoji: "🥗", color: "#ffd3a6" },
      { id: 6, name: "ยำวุ้นเส้นหมูสับ", price: 70, category: "จานหลัก", desc: "วุ้นเส้นนุ่ม หมูสับ หอมแดง พริกป่น ครบรสแซ่บ", emoji: "🥢", color: "#d9e2ff" },
      { id: 7, name: "ชามะนาว", price: 45, category: "เครื่องดื่ม", desc: "ชาไทยเข้มข้น หอมใบเตย เปรี้ยวหวานสดชื่น", emoji: "🧋", color: "#f2c9a0" },
      { id: 8, name: "น้ำอัดลม", price: 25, category: "เครื่องดื่ม", desc: "เย็นจัด ฟิน ๆ หลากหลายรสชาติ", emoji: "🥤", color: "#c9e4f5" },
      { id: 9, name: "ข้าวเหนียวมะม่วง", price: 80, category: "ของหวาน", desc: "มะม่วงน้ำดอกไม้สุกงอม ข้าวเหนียวมูนเข้มข้น หอมกะทิ", emoji: "🥭", color: "#ffe08a" },
    ],
  },
  {
    id: 2,
    name: "พิซซ่าคิง", cuisine: "พิซซ่า · อาหารอิตาเลียน",
    coverEmoji: "🍕", coverBg: "linear-gradient(135deg, #ffd76f, #f39c12 60%, #d35400)",
    rating: 4.6, reviews: 2318, open: "10:30", close: "22:30", distanceKm: 2.4,
    deliveryFee: 25, freeDeliveryMin: 250, deliveryTime: "25–35 นาที",
    defaultMenu: [
      { id: 1, name: "พิซซ่ามาร์เกริต้า", price: 159, category: "แนะนำ", desc: "มอสซาเรลลา มะเขือเทศซอสสด ใบโหระพา", emoji: "🍕", color: "#ffe8a3" },
      { id: 2, name: "พิซซ่าเปปเปอโรนี", price: 179, category: "จานหลัก", desc: "เปปเปอโรนีเต็มหน้า ชีสยืด ๆ อบหอม", emoji: "🍕", color: "#ffc9c9" },
      { id: 3, name: "ซีซ่าร์สลัด", price: 99, category: "จานหลัก", desc: "ผักสด กรูตองกรอบ ราดซอสซีซาร์", emoji: "🥗", color: "#b5e6b5" },
      { id: 4, name: "ปีกไก่บาร์บีคิว", price: 89, category: "จานหลัก", desc: "ปีกไก่ทอดกรอบ เคล้าซอสบาร์บีคิว", emoji: "🍗", color: "#ffd3a6" },
      { id: 5, name: "น้ำอัดลมเย็น", price: 30, category: "เครื่องดื่ม", desc: "เย็นจัดหลากหลายรส", emoji: "🥤", color: "#c9e4f5" },
      { id: 6, name: "บราวนี่ช็อกโกแลต", price: 65, category: "ของหวาน", desc: "บราวนี่เข้มข้น เนื้อนุ่ม ทานคู่ไอศกรีม", emoji: "🍫", color: "#d9c8b0" },
    ],
  },
  {
    id: 3,
    name: "ก๋วยเตี๋ยวป้าแดง", cuisine: "ก๋วยเตี๋ยว · อาหารตามสั่ง",
    coverEmoji: "🍲", coverBg: "linear-gradient(135deg, #ff9a76, #e8532f 60%, #b0352b)",
    rating: 4.7, reviews: 862, open: "08:00", close: "16:00", distanceKm: 0.8,
    deliveryFee: 20, freeDeliveryMin: 200, deliveryTime: "15–25 นาที",
    defaultMenu: [
      { id: 1, name: "ก๋วยเตี๋ยวเรือเนื้อ", price: 55, category: "แนะนำ", desc: "น้ำซุปเข้มข้น เนื้อตุ๋นนุ่ม เส้นหลากหลาย", emoji: "🍜", color: "#e8c9a0" },
      { id: 2, name: "เย็นตาโฟ", price: 60, category: "จานหลัก", desc: "เต้าหู้ปลา ลูกชิ้น ซอสเย็นตาโฟสีชมพู", emoji: "🍲", color: "#ffc9c9" },
      { id: 3, name: "บะหมี่เกี๊ยวหมูแดง", price: 55, category: "จานหลัก", desc: "หมูแดงฉ่ำ เกี๊ยวหมูกรอบ", emoji: "🥟", color: "#ffe8a3" },
      { id: 4, name: "ลูกชิ้นปิ้ง", price: 40, category: "จานหลัก", desc: "ลูกชิ้นหมูย่างหอม 3 ไม้ พร้อมน้ำจิ้ม", emoji: "🍢", color: "#f2c9a0" },
      { id: 5, name: "โซดามะนาว", price: 25, category: "เครื่องดื่ม", desc: "โซดาเย็นจัด มะนาวสด", emoji: "🍋", color: "#e9f7c2" },
      { id: 6, name: "เต้าฮวยน้ำขิง", price: 35, category: "ของหวาน", desc: "เต้าฮวยนุ่ม หอมน้ำขิงร้อน ๆ", emoji: "🍮", color: "#f7e0c2" },
    ],
  },
  {
    id: 4,
    name: "คาเฟ่บัตเตอร์", cuisine: "คาเฟ่ · เครื่องดื่ม · เบเกอรี",
    coverEmoji: "☕", coverBg: "linear-gradient(135deg, #e8c5a0, #b07a4f 60%, #6f4a2b)",
    rating: 4.9, reviews: 510, open: "07:00", close: "19:00", distanceKm: 3.1,
    deliveryFee: 35, freeDeliveryMin: 350, deliveryTime: "30–40 นาที",
    defaultMenu: [
      { id: 1, name: "ลาเต้", price: 75, category: "แนะนำ", desc: "เอสเพรสโซ่เข้ม ผสมนมสด หอมมัน", emoji: "☕", color: "#e8d5b8" },
      { id: 2, name: "อเมริกาโน", price: 65, category: "เครื่องดื่ม", desc: "เอสเพรสโซ่ ใส่น้ำร้อน เข้มข้น", emoji: "🫘", color: "#d9c8b0" },
      { id: 3, name: "มัทฉะลาเต้", price: 85, category: "เครื่องดื่ม", desc: "มัทฉะเกรดพรีเมียม นมสดหอม", emoji: "🍵", color: "#c9e8c2" },
      { id: 4, name: "โกโก้เข้มข้น", price: 70, category: "เครื่องดื่ม", desc: "โกโก้ดัตช์เข้ม หอมกลมกล่อม", emoji: "🍫", color: "#d9c8b0" },
      { id: 5, name: "โทสต์เนยน้ำตาล", price: 45, category: "จานหลัก", desc: "ขนมปังปิ้งกรอบ ทาเนยน้ำตาล", emoji: "🍞", color: "#ffe8a3" },
      { id: 6, name: "ชีสเค้ก", price: 95, category: "ของหวาน", desc: "ชีสเค้กเนื้อเนียน หอมกลิ่นอบเชย", emoji: "🍰", color: "#f7e0c2" },
    ],
  },
];

/* ===== โฆษณา (สไลด์บนสุด + แทรกเมนู) ===== */
const ADS_KEY = "sangkha-ads";

const DEFAULT_ADS = [
  {
    id: 1, emoji: "🍔", title: "เบอร์เกอร์ซื้อ 1 แถม 1", category: "เบอร์เกอร์",
    desc: "เฉพาะวันนี้! ที่ร้านร่วมรายการทั่วประเทศ", cta: "ดูโปรโมชัน",
    bg: "linear-gradient(135deg, #ffb347, #ff6b35)",
    video: "ad-video", // ชื่อไฟล์คลิป (ไม่มี .mp4/.webm) — เว้นว่าง = ไม่มีวิดีโอ
    // คูปองส่วนลด: percent / baht / delivery (ส่งฟรี) / "" (ไม่มี)
    discountType: "percent", discountValue: 50, minOrder: 100,
  },
  {
    id: 2, emoji: "🧋", title: "เครื่องดื่มลด 50%", category: "เครื่องดื่ม",
    desc: "ทุกแก้วหลัง 14:00 น. สั่งผ่านแอปเท่านั้น", cta: "กดรับสิทธิ์",
    bg: "linear-gradient(135deg, #8e44ad, #5b2c6f)",
    video: "",
    discountType: "percent", discountValue: 50, minOrder: 0,
  },
  {
    id: 3, emoji: "🍣", title: "ซูชิชุดใหม่ ฿199", category: "ซูชิ",
    desc: "แซลมอนสด ส่งตรงทุกวัน จากร้านในเครือ", cta: "สั่งเลย",
    bg: "linear-gradient(135deg, #43cea2, #185a9d)",
    video: "",
    discountType: "baht", discountValue: 50, minOrder: 199,
  },
  {
    id: 4, emoji: "🛵", title: "SangKha Pro",
    desc: "ส่งฟรีไม่อั้น ทุกออเดอร์ ตลอดทั้งปี", cta: "สมัครสมาชิก",
    bg: "linear-gradient(135deg, #232526, #414345)",
    video: "",
    discountType: "delivery", discountValue: 0, minOrder: 0,
  },
];

// สีพื้นหลัง (gradient) ให้เลือกในหน้า admin
const BG_PRESETS = [
  "linear-gradient(135deg, #ffb347, #ff6b35)",
  "linear-gradient(135deg, #8e44ad, #5b2c6f)",
  "linear-gradient(135deg, #43cea2, #185a9d)",
  "linear-gradient(135deg, #232526, #414345)",
  "linear-gradient(135deg, #f7971e, #ffd200)",
  "linear-gradient(135deg, #eb3349, #f45c43)",
];

function getAds() {
  try {
    const raw = localStorage.getItem(ADS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // รวมค่าเริ่มต้น (เช่น ข้อมูลคูปอง) เข้ากับโฆษณาที่เก็บไว้ — รองรับข้อมูลรุ่นเก่า
        return parsed.map((a) => ({ ...(DEFAULT_ADS.find((d) => d.id === a.id) || {}), ...a }));
      }
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return DEFAULT_ADS.map((a) => ({ ...a }));
}

/* ===== เวลาออกอากาศโฆษณา (ตั้งในหน้า admin: startAt/endAt เป็น timestamp ms — เว้นว่าง = ออกตลอด) ===== */

// สถานะของโฆษณา: live / scheduled / expired / always
function getAdStatus(ad) {
  const now = Date.now();
  const start = Number(ad.startAt) || 0;
  const end = Number(ad.endAt) || 0;
  if (start && now < start) return "scheduled";
  if (end && now > end) return "expired";
  if (!start && !end) return "always";
  return "live";
}

function isAdLive(ad) {
  return getAdStatus(ad) === "live" || getAdStatus(ad) === "always";
}

// เฉพาะโฆษณาที่กำลังออกอากาศ (ใช้ในสไลด์บนสุด / แถวดีลเด็ด / หน้า deals)
function getLiveAds() {
  return getAds().filter(isAdLive);
}

/* ===== หมวดโฆษณา + กรองสไลด์หน้าแรกตามร้านที่ลูกค้าสนใจ (ติดตาม + ใกล้ตัว) ===== */

// ตัวเลือกหมวดโฆษณา (ใช้ในฟอร์ม admin + หลังร้านเลือกเอง) — ค่าเดียวกันทั้งระบบ
const AD_CATEGORIES = [
  { value: "", emoji: "🌐", label: "ทุกหมวด (โชว์ทุกหน้า)" },
  { value: "เบอร์เกอร์", emoji: "🍔", label: "เบอร์เกอร์" },
  { value: "เครื่องดื่ม", emoji: "🧋", label: "เครื่องดื่ม" },
  { value: "ซูชิ", emoji: "🍣", label: "ซูชิ / ญี่ปุ่น" },
  { value: "พิซซ่า", emoji: "🍕", label: "พิซซ่า / อิตาเลียน" },
  { value: "ของหวาน", emoji: "🍰", label: "ของหวาน" },
  { value: "อาหารไทย", emoji: "🍜", label: "อาหารไทย" },
  { value: "ฟาสต์ฟู้ด", emoji: "🍗", label: "ฟาสต์ฟู้ด" },
];

// คีย์เวิร์ด (ใน cuisine ร้าน) ที่ตรงกับหมวดโฆษณาแต่ละหมวด — จับคู่แบบหลวม ๆ กันร้านกรอกอิสระ
const AD_CATEGORY_KEYWORDS = {
  "เบอร์เกอร์": ["เบอร์เกอร์", "แฮมเบอร์เกอร์", "ฟาสต์ฟู้ด"],
  "เครื่องดื่ม": ["เครื่องดื่ม", "คาเฟ่", "กาแฟ", "ชา", "น้ำ", "สมูทตี้"],
  "ซูชิ": ["ซูชิ", "ญี่ปุ่น", "แซลมอน", "ซาชิมิ", "ปลาดิบ"],
  "พิซซ่า": ["พิซซ่า", "อิตาเลียน", "พาสต้า"],
  "ของหวาน": ["ของหวาน", "เบเกอรี", "เค้ก", "ขนม", "ไอศกรีม"],
  "อาหารไทย": ["ไทย", "อาหารตามสั่ง", "ก๋วยเตี๋ยว", "ส้มตำ", "ยำ", "ต้มยำ", "ผัด"],
  "ฟาสต์ฟู้ด": ["ฟาสต์ฟู้ด", "เบอร์เกอร์", "ไก่ทอด", "เฟรนช์ฟรายส์", "อเมริกัน"],
};

// โฆษณานี้ตรงกับหมวดของร้านนี้หรือไม่ (ไม่มีหมวด / หมวดใหม่ที่ยังไม่มีคีย์เวิร์ด = โชว์ทุกที่)
function adCategoryMatchesRestaurant(category, restaurant) {
  if (!category || category === "ทั่วไป") return true;
  // ร้านเลือกหมวดโฆษณาของตัวเองไว้ (หลังร้าน — ไม่ต้องรอแอดมิน) → ตรงกันก็โชว์ (ไม่ต้องเดาจาก cuisine)
  if (getRestaurantAdCategory(restaurant.id) === category) return true;
  const words = AD_CATEGORY_KEYWORDS[category];
  if (!words) return true;
  const cuisine = String(restaurant.cuisine || "").toLowerCase();
  return words.some((w) => cuisine.includes(w));
}

// ร้านที่ลูกค้าสนใจ: ร้านที่ติดตามมาก่อน แล้วเติมร้านใกล้ตัว (ใช้ตำแหน่ง = เรียงใกล้สุด) — ใช้คัดสไลด์โฆษณาหน้าแรก
function getCustomerInterestRestaurants(limit = 6) {
  const followIds = new Set(getFollows());
  const cgps = getCustomerGps();
  let list = getRestaurants();
  if (cgps) list = [...list].sort((a, b) => getRealDistanceKm(a, cgps) - getRealDistanceKm(b, cgps));
  const followed = list.filter((r) => followIds.has(r.id));
  const others = list.filter((r) => !followIds.has(r.id));
  return [...followed, ...others].slice(0, limit);
}

// สไลด์หน้าแรก: เฉพาะโฆษณาที่ตรงหมวดร้านที่ลูกค้าสนใจ (ติดตาม + ใกล้ตัว)
// ถ้ากรองแล้วว่าง → คืนทั้งหมด (กันสไลด์ว่าง — ไม่มีร้าน/ไม่มีตำแหน่ง/ไม่มีหมวดตรง = แสดงทั้งหมด)
function getHomeAds() {
  const live = getLiveAds();
  const interests = getCustomerInterestRestaurants();
  if (!interests.length) return live;
  const matched = live.filter((ad) => interests.some((r) => adCategoryMatchesRestaurant(ad.category, r)));
  return matched.length ? matched : live;
}

/* ===== หมวดโฆษณาของร้าน (ร้านตั้งเองได้ในหลังร้าน — ไม่ต้องรอแอดมิน) ===== */
const RESTAURANT_AD_CATEGORY_KEY = "sangkha-restaurant-ad-categories"; // restaurantId → หมวดโฆษณา

function getRestaurantAdCategory(id) {
  try {
    const map = JSON.parse(localStorage.getItem(RESTAURANT_AD_CATEGORY_KEY) || "{}");
    if (map[String(id)]) return map[String(id)];
  } catch (_) { /* ไม่เป็นไร */ }
  // ร้านที่ sync มาจากเครื่องอื่น (Firestore) อาจมีหมวดติดมากับ record
  const r = getRestaurants().find((x) => String(x.id) === String(id));
  return (r && r.adCategory) || "";
}

function setRestaurantAdCategory(id, category) {
  try {
    const map = JSON.parse(localStorage.getItem(RESTAURANT_AD_CATEGORY_KEY) || "{}");
    map[String(id)] = category || "";
    localStorage.setItem(RESTAURANT_AD_CATEGORY_KEY, JSON.stringify(map));
  } catch (_) { /* ไม่เป็นไร */ }
  fbSyncRestaurants(); // 🔥 สะท้อนหมวดลง Firestore (ร้าน doc) — เห็นข้ามเครื่อง
}

// ป้ายสถานะ + ข้อความบอกเวลา (ใช้ในหน้า admin)
function adStatusBadge(ad) {
  const st = getAdStatus(ad);
  if (st === "live") return `<span class="ad-status-badge live">🟢 กำลังออกอากาศ</span>`;
  if (st === "scheduled") return `<span class="ad-status-badge scheduled">🟡 รอเริ่ม ${fmtDateTime(ad.startAt)}</span>`;
  if (st === "expired") return `<span class="ad-status-badge expired">🔴 หมดอายุ ${fmtDateTime(ad.endAt)}</span>`;
  return `<span class="ad-status-badge always">🟢 ออกตลอด</span>`;
}

function fmtDateTime(ts) {
  const d = new Date(Number(ts));
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ===== คูปองส่วนลด (กดรับสิทธิ์ในหน้าโปรโมชัน → ใช้ตอนสั่งซื้อ) ===== */
const COUPONS_KEY = "sangkha-coupons";

function getCoupons() {
  try {
    const raw = localStorage.getItem(COUPONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return [];
}

function setCoupons(coupons) {
  try {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
  } catch (_) { /* ไม่เป็นไร */ }
}

// ข้อความแสดงมูลค่าคูปอง: "ลด 50%" / "ลด 50 บาท" / "ส่งฟรี"
function couponValueLabel(c) {
  if (c.discountType === "percent") return `ลด ${c.discountValue}%`;
  if (c.discountType === "baht") return `ลด ${c.discountValue} บาท`;
  if (c.discountType === "delivery") return "ส่งฟรี";
  return "ส่วนลด";
}

function couponMinLabel(c) {
  return c.minOrder > 0 ? `ขั้นต่ำ ${c.minOrder} บาท` : "ไม่จำกัดขั้นต่ำ";
}

// รับคูปองจากโฆษณา — คืนคูปอง (ใหม่ หรือใบเดิมถ้ามีแล้ว) หรือ null ถ้าโฆษณานั้นไม่มีคูปอง
function claimCoupon(ad) {
  if (!ad || !isAdLive(ad) || (ad.discountType !== "delivery" && !(Number(ad.discountValue) > 0))) return null;
  const existing = getCoupons().find((c) => c.adId === ad.id && !c.used);
  if (existing) return existing;
  const coupon = {
    code: `SANGKHA${ad.id}${Math.floor(1000 + Math.random() * 9000)}`,
    adId: ad.id,
    title: ad.title,
    emoji: ad.emoji,
    discountType: ad.discountType || "percent",
    discountValue: Number(ad.discountValue || 0),
    minOrder: Number(ad.minOrder || 0),
    claimedAt: Date.now(),
    used: false,
    // คูปองหมดอายุพร้อมกับโปรโมชัน (ถ้าโฆษณานั้นตั้งเวลาสิ้นสุด)
    expiresAt: Number(ad.endAt) || 0,
  };
  const coupons = getCoupons();
  coupons.push(coupon);
  setCoupons(coupons);
  return coupon;
}

function getUsableCoupons() {
  const now = Date.now();
  return getCoupons().filter((c) => !c.used && (!Number(c.expiresAt) || Number(c.expiresAt) > now));
}

function markCouponUsed(code) {
  const coupons = getCoupons();
  const c = coupons.find((x) => x.code === code);
  if (c) {
    c.used = true;
    setCoupons(coupons);
  }
}

function getAd(id) {
  return getAds().find((a) => a.id === id) || null;
}

// เงื่อนไขมาตรฐาน (ใช้เมื่อโฆษณานั้นไม่ระบุเงื่อนไขเอง)
const DEFAULT_AD_TERMS = [
  "โปรโมชันมีระยะเวลาจำกัด ตั้งแต่วันนี้จนกว่าจะหมดระยะเวลา",
  "ไม่สามารถใช้ร่วมกับโปรโมชันหรือส่วนลดอื่นได้",
  "สิทธิ์พิเศษเฉพาะสั่งผ่านแอป SangKha เท่านั้น",
  "สงวนสิทธิ์ในการเปลี่ยนแปลงเงื่อนไขโดยไม่ต้องแจ้งล่วงหน้า",
];

// คืนเงื่อนไขเป็นอาร์เรย์ (จากช่องเงื่อนไขใน admin คั่นด้วย | หรือใช้เงื่อนไขมาตรฐาน)
function getAdTerms(ad) {
  if (ad && ad.terms && ad.terms.trim()) {
    return ad.terms.split(/[|\n]/).map((t) => t.trim()).filter(Boolean);
  }
  return DEFAULT_AD_TERMS;
}

function setAds(ads) {
  try {
    localStorage.setItem(ADS_KEY, JSON.stringify(ads));
  } catch (_) { /* ไม่เป็นไร */ }
}

/* ===== สถิติคลิกโฆษณา ===== */
const AD_CLICKS_KEY = "sangkha-ad-clicks";

function getAdStats() {
  try {
    const raw = localStorage.getItem(AD_CLICKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return {};
}

function recordAdClick(id) {
  const stats = getAdStats();
  stats[id] = (stats[id] || 0) + 1;
  try {
    localStorage.setItem(AD_CLICKS_KEY, JSON.stringify(stats));
  } catch (_) { /* ไม่เป็นไร */ }
}

/* ===== อีโมจิให้เลือก (ใช้หน้า admin + หน้าสมัครร้านค้า) ===== */
const EMOJIS = [
  "🍔", "🍟", "🍕", "🌭", "🍿", "🥟", "🥠", "🍤",
  "🍣", "🍝", "🍛", "🍲", "🥘", "🍜", "🍢", "🍡",
  "🥮", "🍧", "🍨", "🍰", "🧁", "🍦", "🥧", "🍩",
  "🍪", "🥗", "🥙", "🌮", "🌯", "🥪", "🧆", "🫔",
];

const CATEGORIES = ["แนะนำ", "จานหลัก", "เครื่องดื่ม", "ของหวาน"];

// สีพื้นรูปอาหาร วนตามลำดับ
const COLOR_PALETTE = ["#ffd8a8", "#ffc9c9", "#ffe8a3", "#b5e6b5", "#d9e2ff", "#f2c9a0", "#c9e4f5", "#ffe08a", "#f7c6d9", "#c9f0d9"];

// อัปเกรดข้อมูลรุ่นเก่า (เมนูร้านเดียว) → ร้านแรก
(function migrate() {
  try {
    if (!localStorage.getItem(MENU_KEY + "-1") && localStorage.getItem(MENU_KEY)) {
      localStorage.setItem(MENU_KEY + "-1", localStorage.getItem(MENU_KEY));
    }
  } catch (_) { /* ไม่เป็นไร */ }
})();

/* สถานะเปิด/ปิดร้านตามเวลาจริง (ใช้ร่วมทุกหน้า — รองรับร้านข้ามเที่ยงคืน เช่น เปิด 22:00 ปิด 04:00) — true=เปิด false=ปิด null=เวลาไม่ครบ/ไม่ถูกต้อง */
function storeOpenStatus(open, close) {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const parse = (t) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || "").trim());
    if (!m) return null;
    const h = +m[1], mi = +m[2];
    if (h > 23 || mi > 59) return null;
    return h * 60 + mi;
  };
  const o = parse(open), c = parse(close);
  if (o === null || c === null) return null;
  if (o <= c) return mins >= o && mins < c;
  return mins >= o || mins < c; // ข้ามเที่ยงคืน
}

/* ===== ปิดรับออเดอร์ชั่วคราว (ร้านตั้งเองจากหลังร้าน — ไม่กระทบเวลาเปิด-ปิด) ===== */
const STORE_CLOSED_KEY = "sangkha-store-closed"; // restaurantId → { closedAt, reason }

function setStoreClosed(id, closed, reason) {
  try {
    const all = JSON.parse(localStorage.getItem(STORE_CLOSED_KEY) || "{}");
    if (closed) all[String(id)] = { closedAt: Date.now(), reason: reason || "" };
    else delete all[String(id)];
    localStorage.setItem(STORE_CLOSED_KEY, JSON.stringify(all));
  } catch (_) { /* ไม่เป็นไร */ }
}

// คืนข้อมูลการปิดชั่วคราวของร้าน (null = ไม่ได้ปิด)
function getStoreClosed(id) {
  try {
    const all = JSON.parse(localStorage.getItem(STORE_CLOSED_KEY) || "{}");
    return all[String(id)] || null;
  } catch (_) { return null; }
}

// สถานะรวมที่สั่งซื้อได้จริง: ปิดชั่วคราว (มือ) → ปิดทันที / ปิดอัตโนมัติ (ออเดอร์ค้าง) → ปิดทันที / ไม่งั้นเช็คเวลาเปิด-ปิด
function storeAcceptingOrders(r) {
  if (!r) return null;
  if (getStoreClosed(r.id)) return false;
  if (isAutoClosed(r.id)) return false;
  return storeOpenStatus(r.open, r.close);
}

/* ===== พิกัดบนแผนที่จาก GPS จริง (ใช้ร่วมทุกหน้า) ===== */
function seedRand(seed) {
  let s = Math.abs(seed) % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function strHash(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) >>> 0;
  return h;
}

// ตำแหน่งบนแผนที่ (0..1) จากพิกัดจริง — พิกัดเดียวกันวางตำแหน่งเดิมเสมอ
// region "start" = โซนล่างซ้าย (จุดเริ่ม เช่น ร้าน) / ค่าเริ่มต้น "end" = โซนบนขวา (ปลายทาง เช่น บ้านลูกค้า)
function gpsMapPos(gps, region) {
  const rnd = seedRand(strHash(String(gps.lat.toFixed(5)) + "|" + String(gps.lng.toFixed(5))));
  if (region === "start") return { x: 0.08 + rnd() * 0.24, y: 0.68 + rnd() * 0.2 };
  return { x: 0.58 + rnd() * 0.34, y: 0.08 + rnd() * 0.26 };
}

// ร้านนี้มีพิกัด GPS จริงหรือไม่ (ใส่ตอนสมัคร)
function restaurantHasGps(rest) {
  return !!(rest && typeof rest.lat === "number" && typeof rest.lng === "number");
}

/* ===== พิกัดจริงสำหรับแผนที่ (Leaflet + OpenStreetMap) ===== */
const MAP_DEFAULT_LAT = 13.7563; // กรุงเทพฯ (ใช้เมื่อไม่มีพิกัดจริง)
const MAP_DEFAULT_LNG = 100.5018;

// ระยะทางจริงระหว่าง 2 พิกัด (เมตร) — Haversine
function gpsDistanceM(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// พิกัดจริงของร้าน (ไม่มี = ค่าเริ่มต้น + jitter คงที่ต่อร้าน)
function restaurantGps(rest) {
  if (restaurantHasGps(rest)) return { lat: rest.lat, lng: rest.lng };
  const rnd = seedRand(strHash(String(rest ? rest.id || rest.name : "ร้าน")) + 7);
  return { lat: MAP_DEFAULT_LAT + (rnd() - 0.5) * 0.08, lng: MAP_DEFAULT_LNG + (rnd() - 0.5) * 0.08 };
}

// พิกัดจริงของบ้านลูกค้า (จาก GPS ที่ปักหมุดตอนสั่งซื้อ — ไม่มี = ค่าเริ่มต้น + jitter ต่อออเดอร์)
function orderHomeGps(order) {
  if (order && order.gps && typeof order.gps.lat === "number" && typeof order.gps.lng === "number") {
    return { lat: order.gps.lat, lng: order.gps.lng };
  }
  const rnd = seedRand(order ? order.id * 31 + 5 : 5);
  return { lat: MAP_DEFAULT_LAT + (rnd() - 0.5) * 0.06, lng: MAP_DEFAULT_LNG + (rnd() - 0.5) * 0.06 };
}

// เส้นทาง (จุด lat/lng) ระหว่าง A→B — แบ่งเป็น n ท่อนตรง
function routeGpsPoints(a, b, n) {
  n = n || 3;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    pts.push({ lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f });
  }
  return pts;
}

// ความยาวเส้นทางรวม (กม.) — ระยะทางจริงตามพิกัด
function pathKm(pts) {
  let m = 0;
  for (let i = 1; i < pts.length; i++) m += gpsDistanceM(pts[i - 1], pts[i]);
  return m / 1000;
}

// จุดบนเส้นทางตามสัดส่วน t (0..1) — ตามระยะทางจริง (ไม่ใช่ตามจำนวนจุด)
function pointAtGps(pts, t) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = gpsDistanceM(pts[i - 1], pts[i]);
    segs.push(d);
    total += d;
  }
  if (!total) return pts[pts.length - 1];
  const target = Math.min(1, Math.max(0, t)) * total;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    if (target <= acc + segs[i - 1] || i === pts.length - 1) {
      const seg = segs[i - 1];
      const f = seg ? (target - acc) / seg : 0;
      return { lat: pts[i - 1].lat + (pts[i].lat - pts[i - 1].lat) * f, lng: pts[i - 1].lng + (pts[i].lng - pts[i - 1].lng) * f };
    }
    acc += segs[i - 1];
  }
  return pts[pts.length - 1];
}

/* ===== เส้นทางจริงตามถนน (OSRM — ฟรี ไม่ต้องใช้คีย์) ===== */
const RIDER_SPEED_KMH = 45; // ความเร็วไรเดอร์ — ใช้คำนวณ ETA จากระยะทางจริง

const roadRouteCache = new Map(); // key -> { pts, km } เมื่อโหลดเสร็จ (null = ล้มเหลว)
const roadRouteInFlight = new Map(); // key -> Promise

function roadRouteKey(a, b) {
  return [a.lat.toFixed(5), a.lng.toFixed(5), b.lat.toFixed(5), b.lng.toFixed(5)].join("|");
}

// ค่าที่โหลดเสร็จแล้ว (ซิงค์) — null = ยังไม่มี/ล้มเหลว
function getCachedRoadRoute(a, b) {
  return roadRouteCache.get(roadRouteKey(a, b)) || null;
}

// โหลดเส้นทางถนนจริงจาก OSRM (ล้มเหลว/ไม่มีเน็ต → null แล้วใช้เส้นตรงแทน)
function loadRoadRoute(a, b) {
  const key = roadRouteKey(a, b);
  if (roadRouteCache.has(key)) return Promise.resolve(roadRouteCache.get(key));
  if (roadRouteInFlight.has(key)) return roadRouteInFlight.get(key);
  const p = (async () => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("osrm " + res.status);
      const data = await res.json();
      const coords = data && data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) throw new Error("no route");
      const pts = coords.map((c) => ({ lat: c[1], lng: c[0] }));
      const km = (data.routes[0].distance || 0) / 1000;
      const val = { pts, km };
      roadRouteCache.set(key, val);
      return val;
    } catch (_) {
      roadRouteCache.set(key, null);
      return null;
    } finally {
      roadRouteInFlight.delete(key);
    }
  })();
  roadRouteInFlight.set(key, p);
  return p;
}

// เส้นทาง+เวลาจริงสำหรับเรนเดอร์แผนที่: ใช้ถนน OSRM ถ้าโหลดเสร็จแล้ว ไม่ก็เส้นตรง (start/end = พิกัดจริง)
function effectiveRoute(start, end, straightPath, straightKm) {
  const road = getCachedRoadRoute(start, end);
  const path = road && road.pts ? road.pts : straightPath;
  const km = Math.max(road && road.pts ? road.km : straightKm, 0.15);
  const legMs = (km / (RIDER_SPEED_KMH / 60)) * 60000;
  return { path, km, legMs, road };
}

/* ===== ร้านค้าที่สมัครเพิ่ม ===== */
const REGISTERED_KEY = "sangkha-registered-stores";

function getRegisteredStores() {
  try {
    const raw = localStorage.getItem(REGISTERED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return [];
}

function isRegisteredStore(id) {
  return getRegisteredStores().some((r) => r.id === id);
}

// ลบร้านที่สมัคร (admin) — ลบจาก Firestore + localStorage ให้ตรงกัน ไม่เหลือ residue
// (ลบร้าน/เมนู/บัญชีผู้ใช้/การตั้งค่าทั้งหมดของร้าน — ไม่ลบออเดอร์ เพราะเป็นประวัติการเงินของแพลตฟอร์ม)
// คืนค่า snapshot ของร้านที่ลบ (เพื่อกด "เลิกทำ" ได้ภายในไม่กี่วินาที)
async function removeRegisteredStore(id) {
  const idStr = String(id);
  // 0) เก็บ snapshot ก่อนลบ (สำหรับ undo)
  const rec = getRegisteredStores().find((r) => String(r.id) === idStr) || null;
  const menuRaw = localStorage.getItem(MENU_KEY + "-" + idStr);
  const settings = {};
  [STORE_CLOSED_KEY, STORE_EDITS_KEY, STORE_PINS_KEY, RESTAURANT_FEE_KEY, DELIVERY_SETTINGS_KEY, RESTAURANT_RIDERS_KEY, AUTO_CLOSE_KEY].forEach((key) => {
    try {
      const obj = JSON.parse(localStorage.getItem(key) || "{}");
      if (obj && typeof obj === "object" && Object.prototype.hasOwnProperty.call(obj, idStr)) settings[key] = obj[idStr];
    } catch (_) { /* ไม่เป็นไร */ }
  });
  const followsIdx = [];
  getFollows().forEach((f, i) => { if (String(f) === idStr) followsIdx.push(i); });
  const pendingOwn = getPendingMenu().filter((p) => String(p.restaurantId) === idStr);
  const fb = { restaurants: null, menus: null, users: null };
  if (window.FirebaseOrders && window.FirebaseOrders.getAll) {
    try {
      const [rs, ms, us] = await Promise.all([
        window.FirebaseOrders.getAll("restaurants"),
        window.FirebaseOrders.getAll("menus"),
        window.FirebaseOrders.getAll("users"),
      ]);
      fb.restaurants = (rs || []).find((d) => String(d.id) === idStr) || null;
      fb.menus = (ms || []).find((d) => String(d.id) === idStr) || null;
      fb.users = (us || []).find((d) => String(d.uid ?? d.id) === "rest-" + idStr) || null;
    } catch (_) { /* ไม่เป็นไร */ }
  }
  // 1) ทะเบียนร้านสมัคร (local)
  try {
    localStorage.setItem(REGISTERED_KEY, JSON.stringify(getRegisteredStores().filter((r) => String(r.id) !== idStr)));
  } catch (_) { /* ไม่เป็นไร */ }
  // 2) เมนูของร้าน (local)
  try { localStorage.removeItem(MENU_KEY + "-" + idStr); } catch (_) { /* ไม่เป็นไร */ }
  // 3) ข้อมูล/การตั้งค่าต่อร้าน (object keyed by restaurantId)
  [STORE_CLOSED_KEY, STORE_EDITS_KEY, STORE_PINS_KEY, RESTAURANT_FEE_KEY, DELIVERY_SETTINGS_KEY, RESTAURANT_RIDERS_KEY, AUTO_CLOSE_KEY].forEach((key) => {
    try {
      const obj = JSON.parse(localStorage.getItem(key) || "{}");
      if (obj && typeof obj === "object" && Object.prototype.hasOwnProperty.call(obj, idStr)) {
        delete obj[idStr];
        localStorage.setItem(key, JSON.stringify(obj));
      }
    } catch (_) { /* ไม่เป็นไร */ }
  });
  // 4) รายการติดตาม + เมนูที่รออนุมัติของร้านนี้
  try { localStorage.setItem(FOLLOWS_KEY, JSON.stringify(getFollows().filter((f) => String(f) !== idStr))); } catch (_) { /* ไม่เป็นไร */ }
  try { localStorage.setItem(PENDING_MENU_KEY, JSON.stringify(getPendingMenu().filter((p) => String(p.restaurantId) !== idStr))); } catch (_) { /* ไม่เป็นไร */ }
  // 5) Firestore: restaurants / menus / users ของร้าน (ออเดอร์คงไว้ — ประวัติการเงิน)
  if (window.FirebaseOrders && window.FirebaseOrders.deleteDoc) {
    try {
      await Promise.all([
        window.FirebaseOrders.deleteDoc("restaurants", idStr),
        window.FirebaseOrders.deleteDoc("menus", idStr),
        window.FirebaseOrders.deleteDoc("users", "rest-" + idStr),
      ]);
    } catch (_) { /* ไม่เป็นไร */ }
  }
  return { id, idStr, rec, menuRaw, settings, followsIdx, pendingOwn, fb, deletedAt: Date.now() };
}

// กู้คืนร้านที่เพิ่งลบ (undo ภายในไม่กี่วินาที) — คืน true ถ้าสำเร็จ
async function restoreRegisteredStore(snap) {
  if (!snap || !snap.idStr) return false;
  const idStr = String(snap.idStr);
  // 1) ทะเบียนร้าน (ไม่ซ้ำ)
  try {
    const reg = getRegisteredStores();
    if (!reg.some((r) => String(r.id) === idStr)) {
      if (snap.rec) reg.push(snap.rec);
      localStorage.setItem(REGISTERED_KEY, JSON.stringify(reg));
    }
  } catch (_) { /* ไม่เป็นไร */ }
  // 2) เมนู (ถ้ามีตอนลบ)
  if (snap.menuRaw != null) { try { localStorage.setItem(MENU_KEY + "-" + idStr, snap.menuRaw); } catch (_) { /* ไม่เป็นไร */ } }
  // 3) การตั้งค่าต่อร้าน
  Object.entries(snap.settings || {}).forEach(([key, val]) => {
    try {
      const obj = JSON.parse(localStorage.getItem(key) || "{}");
      obj[idStr] = val;
      localStorage.setItem(key, JSON.stringify(obj));
    } catch (_) { /* ไม่เป็นไร */ }
  });
  // 4) รายการติดตาม (คืนตำแหน่งเดิม) + เมนูรออนุมัติ
  try {
    const follows = getFollows();
    (snap.followsIdx || []).forEach((i) => { if (i >= 0 && i <= follows.length) follows.splice(i, 0, idStr); });
    localStorage.setItem(FOLLOWS_KEY, JSON.stringify(follows));
  } catch (_) { /* ไม่เป็นไร */ }
  try {
    const pending = getPendingMenu();
    (snap.pendingOwn || []).forEach((p) => { if (!pending.some((x) => x.id === p.id)) pending.push(p); });
    localStorage.setItem(PENDING_MENU_KEY, JSON.stringify(pending));
  } catch (_) { /* ไม่เป็นไร */ }
  // 5) Firestore: เขียนกลับเอกสารที่ capture ไว้ตอนลบ (ถ้ามี)
  if (window.FirebaseOrders && window.FirebaseOrders.saveDoc) {
    try {
      await Promise.all([
        snap.fb.restaurants ? window.FirebaseOrders.saveDoc("restaurants", idStr, snap.fb.restaurants) : Promise.resolve(),
        snap.fb.menus ? window.FirebaseOrders.saveDoc("menus", idStr, snap.fb.menus) : Promise.resolve(),
        snap.fb.users ? window.FirebaseOrders.saveDoc("users", "rest-" + idStr, snap.fb.users) : Promise.resolve(),
      ]);
    } catch (_) { /* ไม่เป็นไร */ }
  }
  return true;
}

/* ===== ร้านที่ลูกค้าติดตาม ===== */
const FOLLOWS_KEY = "sangkha-follows";

function getFollows() {
  try {
    const raw = localStorage.getItem(FOLLOWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return [];
}

function isFollowed(id) {
  return getFollows().includes(id);
}

// คืนค่า true = เพิ่งติดตาม, false = เพิ่งเลิกติดตาม
function toggleFollow(id) {
  const follows = getFollows();
  const idx = follows.indexOf(id);
  if (idx === -1) follows.push(id);
  else follows.splice(idx, 1);
  try {
    localStorage.setItem(FOLLOWS_KEY, JSON.stringify(follows));
  } catch (_) { /* ไม่เป็นไร */ }
  return idx === -1;
}

function addRegisteredStore(store) {
  const stores = getRegisteredStores();
  const id = nextId([...RESTAURANTS, ...stores]);
  const newStore = { ...store, id, rating: 5.0, reviews: 0, createdAt: Date.now(), defaultMenu: [] };
  stores.push(newStore);
  try {
    localStorage.setItem(REGISTERED_KEY, JSON.stringify(stores));
  } catch (_) { /* ไม่เป็นไร */ }
  // 🔥 สะท้อนลง Firestore: ร้านใหม่ + ผู้ใช้ (role: restaurant)
  fbSyncRestaurants();
  fbSaveUser({ uid: "rest-" + newStore.id, name: newStore.name, phone: store.phone || "", role: "restaurant", restaurantId: newStore.id });
  return newStore;
}

function getRestaurants() {
  // ข้อมูลที่แอดมินแก้ไข (ชื่อ/ประเภท/เวลาเปิดปิด) ทับข้อมูลตั้งต้น — ส่งผลทุกหน้า (หน้าร้าน/หลังร้าน)
  const edits = getStoreEdits();
  return [...RESTAURANTS, ...getRegisteredStores()].map((r) => {
    const e = edits[String(r.id)];
    return { ...r, ...(e || {}), menu: getMenu(r.id) };
  });
}

function getRestaurant(id) {
  // เปรียบเทียบแบบ String (รองรับ id ที่เป็นเลขหรือสตริง — เช่น "4" จาก select)
  const all = getRestaurants();
  return all.find((r) => String(r.id) === String(id)) || all[0];
}

function getMenu(restaurantId) {
  const rid = String(restaurantId);
  // 🔥 Firebase พร้อม + โหลดเมนูจาก Firestore แล้ว → ใช้เมนู Firestore เป็นหลัก
  //   (ร้านเพิ่ม/แก้เมนูจากเครื่องอื่น เห็นที่หน้าร้านทันที — localStorage เป็นแคชสำรอง)
  if (remoteMenusLoaded && Object.prototype.hasOwnProperty.call(remoteMenusCache, rid)) {
    return remoteMenusCache[rid].map((m) => ({ ...m }));
  }
  return getLocalMenu(restaurantId);
}

// อ่านเมนูจาก localStorage โดยตรง (ไม่แตะ Firestore cache) — ใช้ตอนสะท้อน/seed ขึ้น Firestore
//   (กันกรณี cache เก่ายังไม่ทันรีเฟรชแล้วเขียนทับเมนูที่เพิ่งบันทึก)
function getLocalMenu(restaurantId) {
  const r = RESTAURANTS.find((x) => x.id === restaurantId);
  try {
    const raw = localStorage.getItem(MENU_KEY + "-" + restaurantId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return (r ? r.defaultMenu : []).map((m) => ({ ...m }));
}

function setMenu(restaurantId, menu) {
  try {
    localStorage.setItem(MENU_KEY + "-" + restaurantId, JSON.stringify(menu));
  } catch (_) { /* ไม่เป็นไร */ }
  fbSyncMenus(restaurantId); // 🔥 สะท้อนเมนูของร้านนี้ลง Firestore (menus)
}

function nextId(menu) {
  const max = menu.reduce((a, m) => Math.max(a, m.id || 0), 0);
  return max + 1;
}

/* ===== คำสั่งซื้อ (ลูกค้าสั่ง → ขึ้นที่ dashboard ของร้าน) ===== */
const ORDERS_KEY = "sangkha-orders";

const ORDER_STATUSES = ["ใหม่", "กำลังเตรียม", "พร้อมส่ง", "กำลังจัดส่ง", "เสร็จสิ้น", "ยกเลิก"];

// สถานะถัดไปเมื่อกดปุ่มเลื่อนขั้น (ยกเว้น เสร็จสิ้น / ยกเลิก)
const ORDER_NEXT_STATUS = {
  "ใหม่": "กำลังเตรียม",
  "กำลังเตรียม": "พร้อมส่ง",
  "พร้อมส่ง": "กำลังจัดส่ง",
  "กำลังจัดส่ง": "เสร็จสิ้น",
};

/* ===== ไรเดอร์หลายคน (ลงทะเบียน ชื่อ+เบอร์ → เลือกงานพร้อมกัน ห้ามรับซ้ำ) ===== */
const RIDER_KEY = "sangkha-rider"; // เซสชัน: ไรเดอร์ที่กำลังใช้งานในหน้านี้
const RIDERS_KEY = "sangkha-riders"; // ทะเบียนไรเดอร์ทั้งหมด

function getRiders() {
  try {
    const raw = localStorage.getItem(RIDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return [];
}

function getRiderById(id) {
  return getRiders().find((r) => r.id === id) || null;
}

// เข้าสู่ระบบ: ค้นหาไรเดอร์จากชื่อ + เบอร์ (ไม่เปิดเผยรายชื่อไรเดอร์คนอื่น — ต้องรู้ชื่อ/เบอร์ตัวเอง)
function findRiderByNamePhone(name, phone) {
  const n = (name || "").trim().toLowerCase();
  const p = (phone || "").trim();
  return getRiders().find((r) => r.name.trim().toLowerCase() === n && (r.phone || "") === p) || null;
}

// ออกจากระบบ: ล้างเซสชันไรเดอร์ที่กำลังใช้งาน (กลับไปหน้าเข้าสู่ระบบ)
function clearRiderSession() {
  try {
    localStorage.removeItem(RIDER_KEY);
  } catch (_) { /* ไม่เป็นไร */ }
}

// แก้ไขเบอร์โทรของไรเดอร์ — อัปเดตทะเบียน + เซสชัน (คืน null ถ้าเบอร์ซ้ำกับไรเดอร์คนอื่น)
function updateRiderPhone(riderId, phone) {
  const riders = getRiders();
  const rider = riders.find((r) => r.id === riderId);
  if (!rider) return null;
  const p = (phone || "").trim();
  if (p && riders.some((r) => r.id !== riderId && (r.phone || "") === p)) return null;
  rider.phone = p || "-";
  try {
    localStorage.setItem(RIDERS_KEY, JSON.stringify(riders));
  } catch (_) { /* ไม่เป็นไร */ }
  fbSyncRiders(); // 🔥 สะท้อนไรเดอร์ลง Firestore
  setRiderSession(rider.id); // อัปเดตเซสชันให้ตรงกับทะเบียน
  return rider;
}

// แก้ไขอีเมลไรเดอร์ (ใช้รับสลิปรายเดือน) — อัปเดตทะเบียน (คืน null ถ้าไม่มีไรเดอร์)
function updateRiderEmail(riderId, email) {
  const riders = getRiders();
  const rider = riders.find((r) => r.id === riderId);
  if (!rider) return null;
  rider.email = (email || "").trim();
  try {
    localStorage.setItem(RIDERS_KEY, JSON.stringify(riders));
  } catch (_) { /* ไม่เป็นไร */ }
  fbSyncRiders(); // 🔥 สะท้อนไรเดอร์ลง Firestore
  return rider;
}

// แก้ไขชื่อไรเดอร์ — อัปเดตทะเบียน + เซสชัน (คืน null ถ้าชื่อซ้ำกับไรเดอร์คนอื่น หรือชื่อว่าง)
function updateRiderName(riderId, name) {
  const riders = getRiders();
  const rider = riders.find((r) => r.id === riderId);
  if (!rider) return null;
  const n = (name || "").trim();
  if (!n) return null;
  if (riders.some((r) => r.id !== riderId && r.name.trim().toLowerCase() === n.toLowerCase())) return null;
  rider.name = n;
  try {
    localStorage.setItem(RIDERS_KEY, JSON.stringify(riders));
  } catch (_) { /* ไม่เป็นไร */ }
  fbSyncRiders(); // 🔥 สะท้อนไรเดอร์ลง Firestore
  setRiderSession(rider.id); // อัปเดตเซสชันให้ตรงกับทะเบียน
  return rider;
}

// ลงทะเบียนไรเดอร์ใหม่ (ชื่อ + เบอร์) — ถ้าชื่อ+เบอร์ซ้ำ ใช้คนเดิม และตั้งเป็นไรเดอร์ที่กำลังใช้งานด้วย
function registerRider(name, phone) {
  const nameStr = (name || "").trim();
  const phoneStr = (phone || "").trim();
  if (!nameStr) return null;
  const existing = getRiders().find((r) => r.name === nameStr && r.phone === phoneStr);
  const rider = existing || {
    id: "rider-" + Math.random().toString(36).slice(2, 8),
    name: nameStr,
    phone: phoneStr || "-",
    email: "",
    joinedAt: Date.now(),
  };
  if (!existing) {
    const riders = getRiders();
    riders.push(rider);
    try {
      localStorage.setItem(RIDERS_KEY, JSON.stringify(riders));
    } catch (_) { /* ไม่เป็นไร */ }
    // 🔥 สะท้อนลง Firestore: ไรเดอร์ใหม่ + ผู้ใช้ (role: rider)
    fbSyncRiders();
    fbSaveUser({ uid: rider.id, name: rider.name, phone: rider.phone || "", role: "rider", riderId: rider.id });
  }
  setRiderSession(rider.id);
  return rider;
}

// ไรเดอร์ที่กำลังใช้งานอยู่ (เซสชัน) — ดึงข้อมูลเต็มจากทะเบียน (มีเบอร์ด้วย)
function getRiderProfile() {
  try {
    const raw = localStorage.getItem(RIDER_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return getRiderById(p.id) || (p.name ? { id: p.id, name: p.name, phone: p.phone || "" } : null);
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return null;
}

// สลับไรเดอร์ที่กำลังใช้งาน (login) — คืนไรเดอร์หรือ null ถ้าไม่มี
function setRiderSession(id) {
  const rider = getRiderById(id);
  if (!rider) return null;
  try {
    localStorage.setItem(RIDER_KEY, JSON.stringify({ id: rider.id, name: rider.name, phone: rider.phone || "" }));
  } catch (_) { /* ไม่เป็นไร */ }
  return rider;
}

/* ===== เซสชันร้านค้า + แอดมิน (แยกร้าน — ร้านเห็นเฉพาะระบบของตัวเอง) =====
   - ร้านค้าล็อกอินด้วย ชื่อร้าน + PIN (สมัครแล้วได้ PIN จากฟอร์ม — ร้านพื้นฐาน/ร้านเก่า = 1234)
   - แอดมินล็อกอินด้วย PIN แอดมิน (ค่าเริ่มต้น "admin" — เปลี่ยนได้ที่ localStorage `sangkha-admin-pin`)
   - ร้านค้าที่เพิ่ม/แก้/ลบเมนู → เข้าคิวรออนุมัติ (sangkha-pending-menu) ก่อนแอดมินอนุมัติ */
const STORE_SESSION_KEY = "sangkha-store-session"; // { id } ของร้านที่ล็อกอิน
const ADMIN_SESSION_KEY = "sangkha-admin-session"; // "1" = ล็อกอินแอดมินแล้ว
const DEFAULT_STORE_PIN = "1234"; // PIN เริ่มต้นของร้านพื้นฐาน/ร้านที่สมัครก่อนมีระบบ PIN
const DEFAULT_ADMIN_PIN = "admin"; // PIN แอดมินเริ่มต้น

function getStoreSession() {
  try {
    const raw = localStorage.getItem(STORE_SESSION_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.id) return p;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return null;
}

function setStoreSession(id) {
  try {
    localStorage.setItem(STORE_SESSION_KEY, JSON.stringify({ id }));
  } catch (_) { /* ไม่เป็นไร */ }
}

function clearStoreSession() {
  try {
    localStorage.removeItem(STORE_SESSION_KEY);
  } catch (_) { /* ไม่เป็นไร */ }
}

// โปรไฟล์ร้านที่ล็อกอินอยู่ (จากทะเบียนร้านทั้งหมด)
function getStoreProfile() {
  const s = getStoreSession();
  if (!s) return null;
  return getRestaurants().find((r) => String(r.id) === String(s.id)) || null;
}

/* ===== PIN ร้าน (แอดมินรีเซ็ตได้ — เก็บ override ใน sangkha-store-pins) ===== */
const STORE_PINS_KEY = "sangkha-store-pins"; // restaurantId → PIN ที่แอดมินตั้งใหม่

function getStorePins() {
  try {
    const raw = localStorage.getItem(STORE_PINS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return {};
}

// PIN ที่ใช้จริงของร้าน: ที่แอดมินรีเซ็ต > PIN ตอนสมัคร > ค่าเริ่มต้น 1234
function getStorePin(id) {
  const pins = getStorePins();
  const idStr = String(id);
  if (idStr in pins && pins[idStr]) return String(pins[idStr]);
  const r = getRestaurants().find((x) => String(x.id) === idStr);
  if (r && r.pin) return String(r.pin);
  return DEFAULT_STORE_PIN;
}

// แอดมินรีเซ็ต PIN ของร้าน (คืน PIN ใหม่)
function setStorePin(id, pin) {
  const pins = getStorePins();
  pins[String(id)] = String(pin || "").trim();
  try {
    localStorage.setItem(STORE_PINS_KEY, JSON.stringify(pins));
  } catch (_) { /* ไม่เป็นไร */ }
  return pins[String(id)];
}

/* ===== แก้ไขข้อมูลร้านโดยแอดมิน (ครบทุกข้อมูลสมัคร — ร้านสมัครผิดแล้วแก้เองไม่ได้) ===== */
const STORE_EDITS_KEY = "sangkha-store-edits"; // restaurantId → { name, cuisine, open, close, coverEmoji, coverBg, address, distanceKm, deliveryFee, freeDeliveryMin, deliveryTime, lat, lng }
const STORE_EDIT_TEXT_FIELDS = ["name", "cuisine", "open", "close", "coverEmoji", "coverBg", "address", "deliveryTime"];
const STORE_EDIT_NUM_FIELDS = ["distanceKm", "deliveryFee", "freeDeliveryMin", "lat", "lng"];

function getStoreEdits() {
  try {
    const raw = localStorage.getItem(STORE_EDITS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return {};
}

// แก้ไขข้อมูลร้าน (รวมกับที่เคยแก้) — field ว่าง/ล้าง = คืนค่าเดิมของร้าน — คืน override ใหม่
function setStoreEdit(id, patch) {
  const edits = getStoreEdits();
  const idStr = String(id);
  edits[idStr] = { ...(edits[idStr] || {}), ...patch };
  // ล้าง field ที่ว่างออก (คืนข้อมูลตั้งต้นของร้าน)
  STORE_EDIT_TEXT_FIELDS.forEach((k) => {
    if (edits[idStr][k] === undefined || edits[idStr][k] === null || String(edits[idStr][k]).trim() === "") delete edits[idStr][k];
  });
  STORE_EDIT_NUM_FIELDS.forEach((k) => {
    if (edits[idStr][k] === undefined || edits[idStr][k] === null || !isFinite(Number(edits[idStr][k]))) delete edits[idStr][k];
  });
  if (!Object.keys(edits[idStr]).length) delete edits[idStr];
  try {
    localStorage.setItem(STORE_EDITS_KEY, JSON.stringify(edits));
  } catch (_) { /* ไม่เป็นไร */ }
  fbSyncRestaurants(); // 🔥 สะท้อนข้อมูลร้านที่แก้ไขลง Firestore (restaurants)
  return edits[idStr];
}

// ตรวจ PIN ร้าน (คืนร้านถ้าถูก / null ถ้าไม่ถูก)
function verifyStorePin(id, pin) {
  const r = getRestaurants().find((x) => String(x.id) === String(id));
  if (!r) return null;
  if (getStorePin(id) !== String((pin || "").trim())) return null;
  return r;
}

// หาร้านจากชื่อ (ไม่สนใจตัวพิมพ์เล็ก/ใหญ่ + ตัดช่องว่าง) — ใช้ตอนล็อกอินแบบพิมพ์ชื่อ (ไม่เปิดเผยรายชื่อร้านให้คนนอก)
function findStoreByName(name) {
  const q = String(name || "").trim().toLowerCase();
  if (!q) return null;
  return getRestaurants().find((r) => String(r.name || "").trim().toLowerCase() === q) || null;
}

function isAdminLoggedIn() {
  try {
    return localStorage.getItem(ADMIN_SESSION_KEY) === "1";
  } catch (_) { /* ไม่เป็นไร */ }
  return false;
}

function setAdminSession(on) {
  try {
    if (on) localStorage.setItem(ADMIN_SESSION_KEY, "1");
    else localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (_) { /* ไม่เป็นไร */ }
}

function getAdminPin() {
  try {
    const v = (localStorage.getItem("sangkha-admin-pin") || "").trim();
    if (v) return v;
  } catch (_) { /* ไม่เป็นไร */ }
  return DEFAULT_ADMIN_PIN;
}

/* ===== คิวเมนูรออนุมัติ (ร้านเพิ่ม/แก้/ลบเมนู → แอดมินอนุมัติก่อนขึ้นหน้าร้าน) ===== */
const PENDING_MENU_KEY = "sangkha-pending-menu";

function getPendingMenu() {
  try {
    const raw = localStorage.getItem(PENDING_MENU_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return [];
}

// เพิ่มรายการรออนุมัติ: action = "add" | "edit" | "delete" (item = ข้อมูลสินค้า — add ไม่มี id)
function addPendingMenuItem(restaurantId, action, item) {
  const pending = getPendingMenu();
  const record = {
    id: "pm-" + Math.random().toString(36).slice(2, 8),
    restaurantId,
    action,
    item: { ...item },
    submittedAt: Date.now(),
  };
  pending.push(record);
  try {
    localStorage.setItem(PENDING_MENU_KEY, JSON.stringify(pending));
  } catch (_) { /* ไม่เป็นไร */ }
  return record;
}

function deletePendingMenuItem(id) {
  const pending = getPendingMenu();
  try {
    localStorage.setItem(PENDING_MENU_KEY, JSON.stringify(pending.filter((p) => p.id !== id)));
  } catch (_) { /* ไม่เป็นไร */ }
}

// อนุมัติ → นำไปใช้กับเมนูจริงของร้าน (คืน true ถ้าสำเร็จ)
function approvePendingMenuItem(id) {
  const pending = getPendingMenu();
  const rec = pending.find((p) => p.id === id);
  if (!rec) return false;
  const menu = getMenu(rec.restaurantId);
  if (rec.action === "add") {
    const { id: _drop, ...rest } = rec.item;
    menu.push({ id: nextId(menu), ...rest });
  } else if (rec.action === "edit") {
    const idx = menu.findIndex((m) => m.id === rec.item.id);
    if (idx === -1) return false;
    menu[idx] = { ...menu[idx], ...rec.item };
  } else if (rec.action === "delete") {
    const idx = menu.findIndex((m) => m.id === rec.item.id);
    if (idx === -1) return false;
    menu.splice(idx, 1);
  } else {
    return false;
  }
  setMenu(rec.restaurantId, menu);
  deletePendingMenuItem(id);
  return true;
}

// รายการรออนุมัติของร้านหนึ่ง (ใช้ติดป้าย ⏳ บนการ์ดสินค้า)
function getPendingMenuFor(restaurantId) {
  return getPendingMenu().filter((p) => String(p.restaurantId) === String(restaurantId));
}

/* ===== ไรเดอร์ประจำร้าน (whitelist — ตั้งในหน้า admin) ===== */
// งานจากร้านที่เลือกไรเดอร์ไว้ จะเห็นเฉพาะไรเดอร์ในกลุ่ม (ไม่เลือกใคร = ไรเดอร์ทุกคนเห็นงาน)
const RESTAURANT_RIDERS_KEY = "sangkha-restaurant-riders";

function getRestaurantRiderMap() {
  try {
    const raw = localStorage.getItem(RESTAURANT_RIDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return {};
}

function getRestaurantRiders(restaurantId) {
  const map = getRestaurantRiderMap();
  return Array.isArray(map[restaurantId]) ? map[restaurantId] : [];
}

function setRestaurantRiders(restaurantId, riderIds) {
  const map = getRestaurantRiderMap();
  map[restaurantId] = riderIds.filter(Boolean);
  try {
    localStorage.setItem(RESTAURANT_RIDERS_KEY, JSON.stringify(map));
  } catch (_) { /* ไม่เป็นไร */ }
}

// ไรเดอร์คนนี้เห็นงานของร้านนี้หรือไม่ (ร้านไม่มี whitelist → ทุกคนเห็น)
function riderCanSeeRestaurant(restaurantId, riderId) {
  const ids = getRestaurantRiders(restaurantId);
  return ids.length === 0 || ids.includes(riderId);
}

/* ===== ค่าธรรมเนียมแพลตฟอร์ม (คิด % จากยอดอาหารหลังส่วนลดของร้าน) ===== */
const PLATFORM_FEE_KEY = "sangkha-platform-fee";
const DEFAULT_PLATFORM_FEE = 10; // %

function getPlatformFeeRate() {
  try {
    const v = Number(localStorage.getItem(PLATFORM_FEE_KEY));
    if (v > 0) return v;
  } catch (_) { /* ไม่เป็นไร */ }
  return DEFAULT_PLATFORM_FEE;
}

function setPlatformFeeRate(pct) {
  const v = Math.max(0, Math.min(90, Number(pct) || 0));
  try {
    localStorage.setItem(PLATFORM_FEE_KEY, String(v));
  } catch (_) { /* ไม่เป็นไร */ }
  return v;
}

/* ===== ค่าธรรมเนียมรายร้าน (ร้านใหม่ฟรี 30 วัน / ตั้งอัตราเฉพาะร้าน / ใช้ค่าเริ่มต้นรวม) ===== */
const RESTAURANT_FEE_KEY = "sangkha-restaurant-fees";
const NEW_STORE_PROMO_DAYS = 30;

// map: restaurantId → อัตราที่ตั้งเฉพาะร้าน (%)
function getRestaurantFeeRates() {
  try {
    const raw = localStorage.getItem(RESTAURANT_FEE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return {};
}

// ตั้งอัตราเฉพาะร้าน (null = ลบ กลับไปใช้อัตรารวม) — คืนค่าที่บันทึกจริง
function setRestaurantFeeRate(restaurantId, pct) {
  const rates = getRestaurantFeeRates();
  const v = pct === null || pct === undefined || pct === "" ? null : Math.max(0, Math.min(90, Number(pct) || 0));
  if (v === null) delete rates[restaurantId];
  else rates[restaurantId] = v;
  try {
    localStorage.setItem(RESTAURANT_FEE_KEY, JSON.stringify(rates));
  } catch (_) { /* ไม่เป็นไร */ }
  return v;
}

// ร้านใหม่ = ร้านที่สมัครภายใน 30 วัน (ร้านพื้นฐาน/ร้านเก่าที่ไม่มี createdAt ไม่นับ)
function isNewRestaurant(restaurantId) {
  const store = getRegisteredStores().find((s) => s.id === restaurantId);
  if (!store || !store.createdAt) return false;
  return Date.now() - store.createdAt < NEW_STORE_PROMO_DAYS * 24 * 60 * 60 * 1000;
}

// วันหมดโปรฯ ฟรีค่าธรรมเนียม (null = ไม่ใช่ร้านใหม่)
function getRestaurantPromoEndsAt(restaurantId) {
  const store = getRegisteredStores().find((s) => s.id === restaurantId);
  if (!store || !store.createdAt) return null;
  const end = store.createdAt + NEW_STORE_PROMO_DAYS * 24 * 60 * 60 * 1000;
  return end > Date.now() ? end : null;
}

// อัตราที่ใช้จริงของร้าน: ร้านใหม่ → 0% (โปรฯ) ; ตั้งเฉพาะร้าน → ค่านั้น ; ไม่ตั้ง → อัตรารวม
function getRestaurantFeeRate(restaurantId) {
  if (isNewRestaurant(restaurantId)) return 0;
  const rates = getRestaurantFeeRates();
  if (restaurantId in rates) return Number(rates[restaurantId]) || 0;
  return getPlatformFeeRate();
}

// ค่าธรรมเนียมของออเดอร์หนึ่งใบ = % ของ (ยอดอาหาร − ส่วนลด) — ค่าส่งเป็นของไรเดอร์
function orderPlatformFee(o, rate) {
  const revenue = Math.max(0, (Number(o.subtotal) || 0) - (Number(o.discount) || 0));
  return Math.round(revenue * (rate / 100));
}

/* ===== ภาษีหัก ณ ที่จ่ายไรเดอร์ (ตั้งในหน้า admin — ค่าเริ่มต้น 3% / อัตรารายร้าน / ช่วงเวลา) ===== */
const WHT_KEY = "sangkha-wht-config";
const DEFAULT_WHT_RATE = 3; // %

// { defaultRate: 3, rules: [{ id, restaurantId: "" | id, rate, start, end }] }
function getWhtConfig() {
  try {
    const raw = localStorage.getItem(WHT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          defaultRate: Number(parsed.defaultRate) >= 0 ? Number(parsed.defaultRate) : DEFAULT_WHT_RATE,
          rules: Array.isArray(parsed.rules) ? parsed.rules : [],
        };
      }
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return { defaultRate: DEFAULT_WHT_RATE, rules: [] };
}

function setWhtConfig(cfg) {
  try {
    localStorage.setItem(WHT_KEY, JSON.stringify(cfg));
  } catch (_) { /* ไม่เป็นไร */ }
  return cfg;
}

// ตั้งอัตราค่าเริ่มต้น (%) — คืนค่าที่บันทึกจริง
function setWhtDefaultRate(pct) {
  const v = Math.max(0, Math.min(20, Number(pct) || 0));
  const cfg = getWhtConfig();
  cfg.defaultRate = v;
  setWhtConfig(cfg);
  return v;
}

// เพิ่มกฎอัตรา (restaurantId = "" ใช้ทุกที่ / start/end = "" ไม่จำกัดช่วง) — คืนกฎใหม่
function addWhtRule({ restaurantId, rate, start, end }) {
  const cfg = getWhtConfig();
  const rule = {
    id: "wht-" + Math.random().toString(36).slice(2, 8),
    restaurantId: restaurantId || "",
    rate: Math.max(0, Math.min(20, Number(rate) || 0)),
    start: start || "",
    end: end || "",
  };
  cfg.rules.push(rule);
  setWhtConfig(cfg);
  return rule;
}

function deleteWhtRule(id) {
  const cfg = getWhtConfig();
  cfg.rules = cfg.rules.filter((r) => r.id !== id);
  setWhtConfig(cfg);
}

// อัตราที่ใช้จริงของงานนี้ (ตามร้าน + เวลาที่ส่งเสร็จ): กฎเฉพาะร้านก่อน → กฎทุกที่ → ค่าเริ่มต้น
// กฎหลายข้อตรงกัน → ใช้ข้อที่เริ่มหลังสุด (ใหม่สุด) — start/end ว่าง = ไม่จำกัดช่วง
function getWhtRate(restaurantId, ts) {
  const cfg = getWhtConfig();
  const t = Number(ts) || Date.now();
  const inRange = (r) =>
    (!r.start || t >= new Date(r.start).getTime()) && (!r.end || t <= new Date(r.end).getTime());
  const pick = (list) => list.sort((a, b) => (b.start || "").localeCompare(a.start || ""))[0];
  const specific = pick(cfg.rules.filter((r) => r.restaurantId && String(r.restaurantId) === String(restaurantId) && inRange(r)));
  if (specific) return Number(specific.rate) || 0;
  const global = pick(cfg.rules.filter((r) => !r.restaurantId && inRange(r)));
  if (global) return Number(global.rate) || 0;
  return Number(cfg.defaultRate) >= 0 ? Number(cfg.defaultRate) : DEFAULT_WHT_RATE;
}

/* ===== ตำแหน่งลูกค้า (ใช้คำนวณระยะทางจริงจากพิกัดร้าน ↔ พิกัดลูกค้า) ===== */
const CUSTOMER_GPS_KEY = "sangkha-customer-gps";

function getCustomerGps() {
  try {
    const raw = localStorage.getItem(CUSTOMER_GPS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p.lat === "number" && typeof p.lng === "number") return p;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return null;
}

function setCustomerGps(gps) {
  if (!gps || typeof gps.lat !== "number" || typeof gps.lng !== "number") return null;
  try {
    localStorage.setItem(CUSTOMER_GPS_KEY, JSON.stringify({ lat: gps.lat, lng: gps.lng }));
  } catch (_) { /* ไม่เป็นไร */ }
  return { lat: gps.lat, lng: gps.lng };
}

/* ===== ค่าจัดส่งตามระยะทาง ===== */
const DELIVERY_SETTINGS_KEY = "sangkha-restaurant-delivery";
const DEFAULT_DELIVERY_PER_KM = 5; // ฿/กม. เมื่อร้านไม่ได้ตั้ง

// การตั้งค่าจัดส่งเฉพาะร้าน: { base, perKm, freeMin } หรือ null (ใช้ค่าเริ่มต้นของร้าน)
function getDeliverySettings(restaurantId) {
  try {
    const raw = localStorage.getItem(DELIVERY_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed[restaurantId]) return parsed[restaurantId];
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return null;
}

// ตั้งค่าจัดส่งเฉพาะร้าน (null = คืนค่าเริ่มต้นของร้าน) — คืนค่าที่บันทึกจริง
function setDeliverySettings(restaurantId, settings) {
  let all = {};
  try {
    const raw = localStorage.getItem(DELIVERY_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") all = parsed;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  if (settings === null) delete all[restaurantId];
  else {
    all[restaurantId] = {
      base: Math.max(0, Number(settings.base) || 0),
      perKm: Math.max(0, Number(settings.perKm) || 0),
      freeMin: Math.max(0, Number(settings.freeMin) || 0),
    };
  }
  try {
    localStorage.setItem(DELIVERY_SETTINGS_KEY, JSON.stringify(all));
  } catch (_) { /* ไม่เป็นไร */ }
  return settings === null ? null : all[restaurantId];
}

// ค่าจัดส่งตามระยะทาง = ค่าเริ่มต้น + ต่อกม. × ระยะทาง (ส่งฟรีเมื่อยอดถึงขั้นต่ำ)
// distanceKm ไม่บังคับ — ไม่ส่ง = ใช้ distanceKm ของร้าน
function getDeliveryFee(restaurant, subtotal, distanceKm) {
  if (!restaurant) return 0;
  const s = getDeliverySettings(restaurant.id);
  const freeMin = s ? s.freeMin : (Number(restaurant.freeDeliveryMin) || 0);
  if (freeMin > 0 && (Number(subtotal) || 0) >= freeMin) return 0;
  const base = s ? s.base : (restaurant.deliveryBase !== undefined ? restaurant.deliveryBase : Number(restaurant.deliveryFee) || 0);
  const perKm = s ? s.perKm : (restaurant.deliveryPerKm !== undefined ? restaurant.deliveryPerKm : DEFAULT_DELIVERY_PER_KM);
  const km = Math.max(0, Number(distanceKm) || Number(restaurant.distanceKm) || 1);
  return Math.max(0, Math.round(Number(base) + perKm * km));
}

// ระยะทางจริงระหว่าง 2 พิกัด (Haversine) หน่วย กม.
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ระยะทางจริงที่ใช้คิดค่าส่ง: ใช้ระยะทางถนนจริง (OSRM) ถ้าโหลดเสร็จแล้ว (ตรงกับแผนที่) ไม่ก็ Haversine — ปัดทศนิยม 1 ตำแหน่ง ขั้นต่ำ 0.2 กม.
// ไม่มีพิกัดครบ → ใช้ distanceKm ที่ร้านกรอก
function getRealDistanceKm(restaurant, customerGps) {
  if (restaurantHasGps(restaurant) && customerGps && typeof customerGps.lat === "number" && typeof customerGps.lng === "number") {
    const road = getCachedRoadRoute({ lat: restaurant.lat, lng: restaurant.lng }, { lat: customerGps.lat, lng: customerGps.lng });
    if (road && road.pts) return Math.max(0.2, Math.round(road.km * 10) / 10);
    return Math.max(0.2, Math.round(haversineKm(restaurant.lat, restaurant.lng, customerGps.lat, customerGps.lng) * 10) / 10);
  }
  return Number(restaurant.distanceKm) || 1;
}

/* ===== กระเป๋าเงินไรเดอร์ (รายได้สะสม + เบิกถอน + ประวัติ) ===== */
const WITHDRAWALS_KEY = "sangkha-rider-withdrawals";

function getRiderWithdrawals(riderId) {
  try {
    const raw = localStorage.getItem(WITHDRAWALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((w) => w.riderId === riderId).sort((a, b) => b.requestedAt - a.requestedAt);
      }
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return [];
}

// รายได้สะสม = ค่าจัดส่งของทุกงานที่ไรเดอร์คนนี้ส่งเสร็จ
function getRiderEarnings(riderId) {
  return getOrders()
    .filter((o) => o.riderId === riderId && o.status === "เสร็จสิ้น")
    .reduce((s, o) => s + (Number(o.delivery) || 0), 0);
}

// ยอดเบิกได้ = รายได้สะสม − เบิกไปแล้ว
function getRiderBalance(riderId) {
  const withdrawn = getRiderWithdrawals(riderId).reduce((s, w) => s + w.amount, 0);
  return getRiderEarnings(riderId) - withdrawn;
}

// เบิกถอน — คืน record ใหม่ หรือ null (จำนวนไม่ถูกต้อง / เกินยอดเบิกได้)
function addRiderWithdrawal(riderId, amount) {
  const amt = Math.floor(Number(amount));
  if (!(amt > 0) || amt > getRiderBalance(riderId)) return null;
  const record = {
    id: "w-" + Math.random().toString(36).slice(2, 8),
    riderId,
    amount: amt,
    requestedAt: Date.now(),
  };
  try {
    const raw = localStorage.getItem(WITHDRAWALS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) throw new Error("bad");
    list.push(record);
    localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(list));
  } catch (_) { /* ไม่เป็นไร */ }
  return record;
}

function deleteRiderWithdrawal(id) {
  try {
    const raw = localStorage.getItem(WITHDRAWALS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return;
    localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(list.filter((w) => w.id !== id)));
  } catch (_) { /* ไม่เป็นไร */ }
}

/* ===== ประวัติการส่งสลิปรายเดือนทางอีเมล ===== */
const SLIPS_KEY = "sangkha-rider-slips";

// บันทึกว่าไรเดอร์ส่งสลิปประจำเดือนไหน ไปยังอีเมลไหน เมื่อไหร่
function logSlipSent(riderId, period, email) {
  try {
    const raw = localStorage.getItem(SLIPS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) throw new Error("bad");
    list.push({ riderId, period, email: email || "", sentAt: Date.now() });
    localStorage.setItem(SLIPS_KEY, JSON.stringify(list));
  } catch (_) { /* ไม่เป็นไร */ }
}

// สลิปที่ส่งล่าสุดของไรเดอร์คนนี้ในงวดนั้น (คืน record หรือ null)
function getLastSlipSent(riderId, period) {
  try {
    const raw = localStorage.getItem(SLIPS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return null;
    const hits = list
      .filter((s) => s.riderId === riderId && s.period === period)
      .sort((a, b) => b.sentAt - a.sentAt);
    return hits[0] || null;
  } catch (_) { /* ไม่เป็นไร */ }
  return null;
}

/* ===== บริดจ์แจ้งเตือน → Service Worker (ไรเดอร์ + ร้านค้า) =====
   - ทุกหน้าที่โหลดไฟล์นี้ฟังเหตุการณ์ storage (แท็บอื่นเขียนข้อมูล)
   - ไรเดอร์: งาน "พร้อมส่ง" ใหม่ → แจ้งแม้ไม่ได้อยู่ที่หน้า rider
   - ร้านค้า: ออเดอร์ใหม่ / รีวิวใหม่ / โปรโมชันหมดเวลา → แจ้งแม้ไม่ได้อยู่ที่ dashboard/admin
   - หน้าเปิดอยู่ที่ไหนก็ได้ในเบราว์เซอร์นี้ (ข้อมูลใน localStorage — ไม่มีเซิร์ฟเวอร์ push) */
(function initNotifyBridge() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (!location.protocol.startsWith("http")) return;

  navigator.serviceWorker.register("sw.js").catch(() => { /* ไม่เป็นไร */ });

  function swPost(msg) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(msg);
    } else {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.active) reg.active.postMessage(msg);
      }).catch(() => {});
    }
  }

  // งาน/ออเดอร์/รีวิวที่เห็นแล้วตอนเปิดหน้า (กันแจ้งเตือนซ้ำของข้อมูลเก่า)
  let seenReady = new Set(getOrders().filter((o) => o.status === "พร้อมส่ง").map((o) => o.id));
  let seenNewOrders = new Set(getOrders().filter((o) => o.status === "ใหม่").map((o) => o.id));
  let seenReviews = new Set(getReviews().map((r) => r.orderId + "-" + r.restaurantId));
  // โปรโมชันที่หมดอายุไปแล้วตอนเปิดหน้า = ถือว่าเห็นแล้ว (แจ้งเฉพาะที่เพิ่งหมดระหว่างใช้งาน)
  let notifiedExpired = new Set(getAds().filter((a) => a.endAt && Date.now() > Number(a.endAt)).map((a) => a.id));

  function packOrder(o) {
    const rest = getRestaurant(o.restaurantId);
    return {
      id: o.id,
      restaurantId: o.restaurantId,
      restaurant: rest ? rest.name : "ร้าน",
      customer: o.customer ? o.customer.name : "ลูกค้า",
      total: "฿" + (Number(o.total) || 0).toLocaleString("th-TH"),
    };
  }

  function packReview(r) {
    const rest = getRestaurant(r.restaurantId);
    const order = getOrders().find((o) => o.id === r.orderId);
    return {
      orderId: r.orderId,
      restaurantId: r.restaurantId,
      restaurant: rest ? rest.name : "ร้าน",
      customer: (order && order.customer && order.customer.name) || "ลูกค้า",
      rating: r.rating,
      review: (r.review || "").slice(0, 60),
    };
  }

  // โปรโมชันที่หมดเวลาระหว่างเปิดหน้า (เช็คเป็นระยะ + ทุกครั้งที่แก้โฆษณาในแท็บอื่น)
  function checkExpiredPromos() {
    const now = Date.now();
    const fresh = getAds().filter((a) => a.endAt && now > Number(a.endAt) && !notifiedExpired.has(a.id));
    if (!fresh.length) return;
    fresh.forEach((a) => notifiedExpired.add(a.id));
    swPost({ type: "PROMO_EXPIRED", items: fresh.map((a) => ({ id: a.id, title: a.title })) });
  }

  window.addEventListener("storage", (e) => {
    if (e.key === ORDERS_KEY) {
      const orders = getOrders();
      const freshReady = orders.filter((o) => o.status === "พร้อมส่ง" && !seenReady.has(o.id));
      const freshNew = orders.filter((o) => o.status === "ใหม่" && !seenNewOrders.has(o.id));
      seenReady = new Set(orders.filter((o) => o.status === "พร้อมส่ง").map((o) => o.id));
      seenNewOrders = new Set(orders.filter((o) => o.status === "ใหม่").map((o) => o.id));
      if (freshReady.length) swPost({ type: "NEW_READY_ORDERS", items: freshReady.map(packOrder) });
      if (freshNew.length) swPost({ type: "NEW_ORDER", items: freshNew.map(packOrder) });
    }
    if (e.key === REVIEWS_KEY) {
      const reviews = getReviews();
      const fresh = reviews.filter((r) => !seenReviews.has(r.orderId + "-" + r.restaurantId));
      if (fresh.length) {
        seenReviews = new Set(reviews.map((r) => r.orderId + "-" + r.restaurantId));
        swPost({ type: "NEW_REVIEW", items: fresh.map(packReview) });
      }
    }
    if (e.key === ADS_KEY) checkExpiredPromos();
  });

  // เช็คโปรโมชันหมดเวลาทุก 30 วิ (เผื่อไม่มีเหตุการณ์ storage — เช่น เวลาผ่านไปเอง)
  setInterval(checkExpiredPromos, 30000);

  // ใช้ตรวจสอบว่า SW รับข้อความแล้ว (เก็บไว้บน window)
  navigator.serviceWorker.addEventListener("message", (e) => {
    if (e.data && e.data.type === "NOTIFY_ACK") {
      try {
        window.__notifyAck = { at: Date.now(), kind: e.data.kind, count: e.data.count };
      } catch (_) { /* ไม่เป็นไร */ }
    }
  });
})();

// ขั้นตอนการส่งของไรเดอร์ (ไรเดอร์กดอัปเดตเอง → ลูกค้าเห็นบนแผนที่)
const RIDER_STAGES = ["ไปรับอาหาร", "ถึงร้านแล้ว", "กำลังไปส่ง"];

// ไรเดอร์รับงาน: ออเดอร์ พร้อมส่ง → กำลังจัดส่ง + ระบุผู้ส่ง (เริ่มขั้น ไปรับอาหาร)
function assignRider(orderId, rider) {
  const orders = getOrders();
  const o = orders.find((x) => x.id === orderId);
  if (!o || o.status !== "พร้อมส่ง") return null;
  o.status = "กำลังจัดส่ง";
  o.riderId = rider.id;
  o.riderName = rider.name;
  o.pickedUpAt = Date.now();
  o.riderStage = "ไปรับอาหาร";
  setOrders(orders);
  fbMirror(() => window.FirebaseOrders.saveOrder(o)); // 🔥 ไรเดอร์รับงาน → สะท้อน riderId + สถานะลง Firestore
  return o;
}

// ไรเดอร์กดอัปเดตขั้น: ไปรับอาหาร → ถึงร้านแล้ว → กำลังไปส่ง (เริ่มนับเวลาเดินทางเมื่อกำลังไปส่ง)
function setRiderStage(orderId, stage) {
  const orders = getOrders();
  const o = orders.find((x) => x.id === orderId);
  if (!o || o.status !== "กำลังจัดส่ง") return null;
  o.riderStage = stage;
  if (stage === "กำลังไปส่ง") o.departedAt = Date.now();
  setOrders(orders);
  fbMirror(() => window.FirebaseOrders.saveOrder(o)); // 🔥 ขั้นตอนไรเดอร์ → สะท้อนลง Firestore (ลูกค้าเห็นข้ามเครื่อง)
  return o;
}

/* ===== จัดงานอัตโนมัติ: ไรเดอร์ที่ "ใกล้สุด" (จำลองด้วยเวลาว่างนานสุด + จำนวนงานน้อยสุด) ===== */

// ไรเดอร์ที่ว่าง (ไม่มีงานกำลังส่ง) และเห็นงานของร้านนี้ — เลือกคนที่รอว่างนานสุด (งานน้อยสุดถ้าเสมอกัน)
function findBestRider(restaurantId) {
  const riders = getRiders();
  if (!riders.length) return null;
  const busyIds = new Set(
    getOrders()
      .filter((o) => o.status === "กำลังจัดส่ง" && o.riderId)
      .map((o) => o.riderId)
  );
  const eligible = riders.filter((r) => riderCanSeeRestaurant(restaurantId, r.id) && !busyIds.has(r.id));
  if (!eligible.length) return null;

  const now = Date.now();
  const scored = eligible.map((r) => {
    // เวลาว่าง = ตั้งแต่ส่งเสร็จงานล่าสุด (หรือเริ่มเป็นไรเดอร์ ถ้ายังไม่เคยส่ง) — ยิ่งนานยิ่ง "ใกล้/ว่าง"
    const lastDone = getOrders()
      .filter((o) => o.riderId === r.id && o.status === "เสร็จสิ้น")
      .reduce((m, o) => Math.max(m, o.deliveredAt || 0), 0);
    const idleMs = now - (lastDone || r.joinedAt || now - 3600e3);
    // จำนวนงานที่ส่งสำเร็จวันนี้ (กันคนนึงได้งานซ้ำ ๆ)
    const doneToday = getOrders().filter((o) => {
      if (o.riderId !== r.id || o.status !== "เสร็จสิ้น") return false;
      const d = new Date(o.deliveredAt || o.createdAt);
      const today = new Date();
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }).length;
    return { rider: r, idleMs, doneToday };
  });

  scored.sort((a, b) => b.idleMs - a.idleMs || a.doneToday - b.doneToday);
  return scored[0].rider;
}

// จัดงานให้ไรเดอร์ที่ใกล้/ว่างสุดโดยอัตโนมัติ — คืน { order, rider } หรือ null ถ้าไม่มีไรเดอร์ว่าง
function assignNearestRider(orderId) {
  const order = getOrders().find((o) => o.id === orderId);
  if (!order || order.status !== "พร้อมส่ง") return null;
  const rider = findBestRider(order.restaurantId);
  if (!rider) return null;
  const assigned = assignRider(orderId, rider);
  return assigned ? { order: assigned, rider } : null;
}

// ไรเดอร์ส่งถึงแล้ว: กำลังจัดส่ง → เสร็จสิ้น
function completeDelivery(orderId) {
  const orders = getOrders();
  const o = orders.find((x) => x.id === orderId);
  if (!o || o.status !== "กำลังจัดส่ง") return null;
  o.status = "เสร็จสิ้น";
  o.deliveredAt = Date.now();
  setOrders(orders);
  fbMirror(() => window.FirebaseOrders.saveOrder(o)); // 🔥 ส่งถึงแล้ว → สะท้อนลง Firestore
  return o;
}

// ไรเดอร์คืนงาน (ไม่อยากส่งแล้ว): กำลังจัดส่ง → กลับเป็น พร้อมส่ง
function releaseOrder(orderId) {
  const orders = getOrders();
  const o = orders.find((x) => x.id === orderId);
  if (!o || o.status !== "กำลังจัดส่ง") return null;
  o.status = "พร้อมส่ง";
  delete o.riderId;
  delete o.riderName;
  delete o.pickedUpAt;
  setOrders(orders);
  fbMirror(() => window.FirebaseOrders.saveOrder(o)); // 🔥 คืนงาน → สะท้อนลง Firestore
  return o;
}

function getOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.sort((a, b) => b.createdAt - a.createdAt);
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return [];
}

function setOrders(orders) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (_) { /* ไม่เป็นไร */ }
}

/* ===== สะพานเชื่อม Firebase (ตัวอย่าง): ถ้าตั้งค่า firebase-config.js แล้ว ออเดอร์จะถูกสะท้อนลง Firestore ด้วย =====
   - localStorage ยังเป็นแคชหลัก (ทำงานต่อได้แม้ไม่มีเน็ต) — dashboard ฟังสดจาก Firestore เมื่อเชื่อมต่อ */
function fbMirror(fn) {
  if (!window.FirebaseOrders || !window.FirebaseOrders.isReady) return;
  try { fn(); } catch (_) { /* สะท้อนล้มเหลวไม่กระทบโหมดท้องถิ่น */ }
}

// ออเดอร์จาก Firestore (ข้ามเครื่อง) → เขียนทับแคชท้องถิ่น ให้หน้านี้/แท็บนี้เรนเดอร์ข้อมูลล่าสุด
function mergeRemoteOrders(remote) {
  if (!Array.isArray(remote)) return;
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(remote.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))));
  } catch (_) { /* ไม่เป็นไร */ }
}

/* ===== สะพานเชื่อม Firebase ครบทุกคอลเลกชัน (users / restaurants / menus / orders / riders) =====
   - localStorage ยังเป็นแคชหลัก (ทำงานต่อได้แม้ไม่มีเน็ต) — เมื่อตั้งค่า firebase-config.js แล้ว
     ทุกการเขียน (เพิ่มร้าน/เมนู/ไรเดอร์/ออเดอร์/ผู้ใช้) จะถูกสะท้อนลง Firestore ด้วย
   - โครงสร้างคอลเลกชัน:
     users        doc id = uid          (ลูกค้า: cust-<เบอร์> · ร้าน: rest-<id> · ไรเดอร์: <riderId>)
     restaurants  doc id = restaurantId
     menus        doc id = "<restaurantId>-<menuId>"
     orders       doc id = เลขออเดอร์
     riders       doc id = riderId
   ===== */

// ร้านทั้งหมด → Firestore restaurants (สะท้อนทุกครั้งที่มีการเพิ่ม/แก้ไขร้าน)
function fbSyncRestaurants() {
  fbMirror(() => {
    getRestaurants().forEach((r) => {
      window.FirebaseOrders.saveDoc("restaurants", r.id, {
        restaurantId: String(r.id),
        ownerId: r.ownerId || "rest-" + r.id,
        name: r.name,
        address: r.address || "",
        phone: r.phone || "",
        latitude: typeof r.lat === "number" ? r.lat : null,
        longitude: typeof r.lng === "number" ? r.lng : null,
        status: "active",
        rating: Number(r.rating) || 0,
        cuisine: r.cuisine || "",
        open: r.open || "",
        close: r.close || "",
        coverEmoji: r.coverEmoji || "",
        coverBg: r.coverBg || "",
        imageUrl: r.imageUrl || "",
        adCategory: getRestaurantAdCategory(r.id) || "",
        deliveryFee: Number(r.deliveryFee) || 0,
        createdAt: r.createdAt || 0,
      });
    });
  });
}

// เมนูของร้านหนึ่ง → Firestore menus (doc id = "ร้าน-เมนู")
//   อ่านจาก localStorage โดยตรง (getLocalMenu) — สะท้อนสิ่งที่เพิ่งบันทึกจริง ไม่ใช่ cache ที่อาจเก่า
function fbSyncMenus(restaurantId) {
  fbMirror(() => {
    getLocalMenu(restaurantId).forEach((m) => {
      window.FirebaseOrders.saveDoc("menus", restaurantId + "-" + m.id, {
        menuId: String(m.id),
        restaurantId: String(restaurantId),
        name: m.name,
        price: Number(m.price) || 0,
        image: m.img || m.emoji || "",
        imageUrl: m.img || "",
        emoji: m.emoji || "🍽️",
        desc: m.desc || "",
        color: m.color || "",
        category: m.category || "แนะนำ",
        status: "active",
        createdAt: Date.now(),
      });
    });
  });
}

// ไรเดอร์ทั้งหมด → Firestore riders
function fbSyncRiders() {
  fbMirror(() => {
    getRiders().forEach((r) => {
      window.FirebaseOrders.saveDoc("riders", r.id, {
        riderId: r.id,
        name: r.name,
        phone: r.phone || "",
        vehicle: r.vehicle || "motorcycle",
        status: r.status || "available",
        latitude: typeof r.lat === "number" ? r.lat : null,
        longitude: typeof r.lng === "number" ? r.lng : null,
        email: r.email || "",
        createdAt: r.joinedAt || 0,
      });
    });
  });
}

// บันทึกผู้ใช้ → Firestore users (uid กำหนดเอง: ลูกค้า/ร้าน/ไรเดอร์)
function fbSaveUser(user) {
  fbMirror(() => {
    window.FirebaseOrders.saveDoc("users", user.uid, {
      uid: user.uid,
      name: user.name || "",
      phone: user.phone || "",
      role: user.role || "customer",
      status: user.status || "active",
      createdAt: user.createdAt || Date.now(),
      restaurantId: user.restaurantId || "",
      riderId: user.riderId || "",
    });
  });
}

// ร้านจาก Firestore (สมัครจากเครื่องอื่น) → รวมเข้ากับร้านที่สมัครในเครื่องนี้ (ไม่ทับร้านพื้นฐาน/ร้านที่มีอยู่แล้ว)
function mergeRemoteRestaurants(remote) {
  if (!Array.isArray(remote)) return;
  try {
    const baseIds = new Set(RESTAURANTS.map((r) => String(r.id)));
    const local = getRegisteredStores();
    const localIds = new Set(local.map((r) => String(r.id)));
    let changed = false;
    remote.forEach((doc) => {
      const rid = String(doc.restaurantId ?? doc.id);
      if (baseIds.has(rid)) return; // ร้านพื้นฐาน
      const existing = local.find((r) => String(r.id) === rid);
      if (existing) {
        // ร้านมีในเครื่องแล้ว — อัปเดตเฉพาะหมวดโฆษณาที่ร้านตั้งจากเครื่องอื่น (ไม่แตะข้อมูลอื่น)
        if (doc.adCategory && existing.adCategory !== doc.adCategory) {
          existing.adCategory = doc.adCategory;
          changed = true;
        }
        return;
      }
      local.push({
        id: Number.isFinite(Number(rid)) ? Number(rid) : rid,
        name: doc.name || "ร้านใหม่",
        cuisine: doc.cuisine || "",
        coverEmoji: doc.coverEmoji || "🍽️",
        coverBg: doc.coverBg || "linear-gradient(135deg, #f7971e, #ffd200)",
        imageUrl: doc.imageUrl || "",
        adCategory: doc.adCategory || "",
        open: doc.open || "09:00",
        close: doc.close || "21:00",
        rating: Number(doc.rating) || 5.0,
        reviews: 0,
        deliveryFee: Number(doc.deliveryFee) || 0,
        freeDeliveryMin: 0,
        deliveryTime: "20–30 นาที",
        ...(typeof doc.latitude === "number" ? { lat: doc.latitude } : {}),
        ...(typeof doc.longitude === "number" ? { lng: doc.longitude } : {}),
        createdAt: Number(doc.createdAt) || Date.now(),
        defaultMenu: [],
        fromFirebase: true,
      });
      changed = true;
    });
    if (changed) localStorage.setItem(REGISTERED_KEY, JSON.stringify(local));
  } catch (_) { /* ไม่เป็นไร */ }
}

// ไรเดอร์จาก Firestore (ลงทะเบียนจากเครื่องอื่น) → รวมเข้ากับทะเบียนในเครื่องนี้
function mergeRemoteRiders(remote) {
  if (!Array.isArray(remote)) return;
  try {
    const local = getRiders();
    const localIds = new Set(local.map((r) => String(r.id)));
    let changed = false;
    remote.forEach((doc) => {
      const rid = String(doc.riderId ?? doc.id);
      if (localIds.has(rid)) return;
      local.push({
        id: rid,
        name: doc.name || "ไรเดอร์",
        phone: doc.phone || "-",
        email: doc.email || "",
        joinedAt: Number(doc.createdAt) || Date.now(),
        fromFirebase: true,
      });
      changed = true;
    });
    if (changed) localStorage.setItem(RIDERS_KEY, JSON.stringify(local));
  } catch (_) { /* ไม่เป็นไร */ }
}

/* ===== เมนูจาก Firestore (หน้าร้านอ่านเมนูสดข้ามเครื่อง) ===== */
// แคชเมนูจาก Firestore: { restaurantId: [menuItem, ...] } — เมื่อโหลดแล้ว เมนู Firestore เป็นแหล่งหลัก (localStorage = สำรอง)
let remoteMenusCache = {};
let remoteMenusLoaded = false;

// เมนูจาก Firestore (เพิ่ม/แก้จากเครื่องอื่น) → อัปเดตแคชในเครื่อง (ไม่เขียน localStorage — เมนูสดอ่านจาก Firestore)
function mergeRemoteMenus(remote) {
  if (!Array.isArray(remote)) return;
  try {
    const map = {};
    remote.forEach((doc) => {
      const rid = String(doc.restaurantId ?? "");
      if (!rid) return;
      const imgRaw = doc.imageUrl || doc.image || "";
      // image อาจเป็น URL รูปจริง หรืออีโมจิ (doc เก่าที่บันทึกด้วย m.img || m.emoji)
      const looksLikeImg = /^(data:|\/|https?:|\.(png|jpe?g|webp|gif|svg)(\?|$))/i.test(imgRaw) || imgRaw.includes("/");
      (map[rid] = map[rid] || []).push({
        id: Number.isFinite(Number(doc.menuId)) ? Number(doc.menuId) : doc.menuId,
        name: doc.name || "เมนู",
        price: Number(doc.price) || 0,
        category: doc.category || "แนะนำ",
        desc: doc.desc || "",
        img: looksLikeImg ? imgRaw : "",
        emoji: looksLikeImg ? (doc.emoji || "🍽️") : (imgRaw || doc.emoji || "🍽️"),
        color: doc.color || "",
      });
    });
    // เรียงตาม id เมนู (ลำดับที่ร้านตั้งไว้ — id ไล่เลขกันอยู่แล้ว)
    Object.keys(map).forEach((rid) => {
      map[rid].sort((a, b) => {
        const na = Number(a.id);
        const nb = Number(b.id);
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
        return String(a.id).localeCompare(String(b.id));
      });
    });
    remoteMenusCache = map;
    remoteMenusLoaded = true;
  } catch (_) { /* ไม่เป็นไร */ }
}

// ดึงเมนูทั้งหมดจาก Firestore ครั้งเดียวตอนเริ่ม (FirebaseOrders.getAll) → แคช + แจ้งหน้าเรนเดอร์ใหม่
function loadRemoteMenus() {
  if (!window.FirebaseOrders || !window.FirebaseOrders.isConfigured) return Promise.resolve();
  return window.FirebaseOrders.init().then((ok) => {
    if (!ok) return;
    return window.FirebaseOrders.getAll("menus")
      .then((docs) => {
        mergeRemoteMenus(docs);
        document.dispatchEvent(new CustomEvent("sangkha:firebase-menus"));
      })
      .catch(() => { /* เน็ตหลุด/ยังไม่พร้อม → ใช้ localStorage ตามเดิม */ });
  });
}

// เตรียมข้อมูล localStorage ทั้งหมดเป็น payload สำหรับ seed ขึ้น Firestore (เฉพาะ collection ที่ว่าง)
function collectLocalData() {
  const restaurants = getRestaurants().map((r) => ({
    id: String(r.id),
    restaurantId: String(r.id),
    ownerId: r.ownerId || "rest-" + r.id,
    name: r.name,
    address: r.address || "",
    phone: r.phone || "",
    latitude: typeof r.lat === "number" ? r.lat : null,
    longitude: typeof r.lng === "number" ? r.lng : null,
    status: "active",
    rating: Number(r.rating) || 0,
    cuisine: r.cuisine || "",
    open: r.open || "",
    close: r.close || "",
    coverEmoji: r.coverEmoji || "",
    coverBg: r.coverBg || "",
    imageUrl: r.imageUrl || "",
    deliveryFee: Number(r.deliveryFee) || 0,
    createdAt: r.createdAt || 0,
  }));
  const menus = [];
  getRestaurants().forEach((r) => {
    getLocalMenu(r.id).forEach((m) => {
      menus.push({
        id: r.id + "-" + m.id,
        menuId: String(m.id),
        restaurantId: String(r.id),
        name: m.name,
        price: Number(m.price) || 0,
        image: m.img || m.emoji || "",
        imageUrl: m.img || "",
        emoji: m.emoji || "🍽️",
        desc: m.desc || "",
        color: m.color || "",
        category: m.category || "แนะนำ",
        status: "active",
        createdAt: Date.now(),
      });
    });
  });
  const riders = getRiders().map((r) => ({
    id: r.id,
    riderId: r.id,
    name: r.name,
    phone: r.phone || "",
    vehicle: r.vehicle || "motorcycle",
    status: r.status || "available",
    latitude: typeof r.lat === "number" ? r.lat : null,
    longitude: typeof r.lng === "number" ? r.lng : null,
    email: r.email || "",
    createdAt: r.joinedAt || 0,
  }));
  const orders = getOrders().map((o) => {
    const c = o.customer || {};
    const digits = String(c.phone || "").replace(/\D/g, "");
    return {
      id: String(o.id),
      customerId: o.customerId || (digits ? "cust-" + digits : ""),
      ...o,
    };
  });
  const users = getRiders().map((r) => ({
    id: r.id,
    uid: r.id,
    name: r.name,
    phone: r.phone || "",
    role: "rider",
    status: "active",
    createdAt: r.joinedAt || 0,
    riderId: r.id,
  }));
  return { users, restaurants, menus, orders, riders };
}

// เรียกครั้งเดียวตอนเริ่ม (หน้าไหนก็ได้): init Firebase → seed ข้อมูล demo (collection ว่างเท่านั้น)
//    แล้วฟังสดคอลเลกชัน restaurants/riders → รวมร้าน/ไรเดอร์ใหม่จากเครื่องอื่นเข้าท้องถิ่น
//    (ออเดอร์ dashboard ฟังสดอยู่แล้วที่ dashboard.js — ส่วนนี้เพิ่มร้าน/ไรเดอร์ให้ทุกหน้า)
function initFirebaseCollections() {
  if (!window.FirebaseOrders || !window.FirebaseOrders.isConfigured) return;
  window.FirebaseOrders.init().then((ok) => {
    if (!ok) return;
    // seed ข้อมูลปัจจุบันขึ้น Firestore (เฉพาะ collection ที่ยังว่าง — ไม่ทับข้อมูลที่มีอยู่)
    window.FirebaseOrders.seedLocalData(collectLocalData());
    // ฟังร้าน + ไรเดอร์จาก Firestore → รวมเข้าแคชท้องถิ่น (ร้านสมัคร/ไรเดอร์ลงทะเบียนจากเครื่องอื่นจะโผล่มาที่เครื่องนี้)
    window.FirebaseOrders.subscribeCollection("restaurants", (remote) => {
      mergeRemoteRestaurants(remote);
      document.dispatchEvent(new CustomEvent("sangkha:firebase-restaurants"));
    });
    window.FirebaseOrders.subscribeCollection("riders", (remote) => {
      mergeRemoteRiders(remote);
      document.dispatchEvent(new CustomEvent("sangkha:firebase-riders"));
    });
    // 🔥 เมนู: ดึงครั้งเดียว (getAll) + ฟังสด → ร้านเพิ่ม/แก้เมนูจากเครื่องอื่น เห็นที่หน้าร้านทันที
    loadRemoteMenus();
    window.FirebaseOrders.subscribeCollection("menus", (remote) => {
      mergeRemoteMenus(remote);
      document.dispatchEvent(new CustomEvent("sangkha:firebase-menus"));
    });
  });
}

// บันทึกออเดอร์ใหม่ (สถานะเริ่มต้น "ใหม่") — คืนออเดอร์ที่บันทึกแล้ว
function addOrder(order) {
  const orders = getOrders();
  const cust = order.customer || {};
  // customerId = uid ของผู้ใช้ลูกค้า (doc users: cust-<เบอร์>) — ใช้ตรวจสิทธิ์ "ลูกค้าเห็นออเดอร์ตัวเอง" ใน Security Rules
  const custPhoneDigits = String(cust.phone || "").replace(/\D/g, "");
  const newOrder = {
    id: nextId(orders),
    status: "ใหม่",
    createdAt: Date.now(),
    customerId: custPhoneDigits ? "cust-" + custPhoneDigits : "",
    ...order,
  };
  orders.unshift(newOrder);
  setOrders(orders);
  fbMirror(() => window.FirebaseOrders.saveOrder(newOrder)); // 🔥 สะท้อนลง Firestore (orders)
  // 🔥 บันทึกผู้ใช้ลูกค้า (role: customer — doc id = cust-<เบอร์> ใช้เบอร์ซ้ำคนเดิม = อัปเดต)
  if (custPhoneDigits) {
    fbSaveUser({ uid: "cust-" + custPhoneDigits, name: cust.name || "", phone: String(cust.phone), role: "customer" });
  }
  return newOrder;
}

function updateOrderStatus(id, status) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  order.status = status;
  setOrders(orders);
  fbMirror(() => window.FirebaseOrders.saveOrder(order)); // 🔥 อัปเดต Firestore (ส่งทั้งตัว กัน field หาย)
  return order;
}

function deleteOrder(id) {
  setOrders(getOrders().filter((o) => o.id !== id));
  fbMirror(() => window.FirebaseOrders.deleteOrder(id)); // 🔥 ลบจาก Firestore ด้วย
}

function getOrdersFor(restaurantId) {
  return getOrders().filter((o) => String(o.restaurantId) === String(restaurantId));
}

/* ===== ปิดรับออเดอร์อัตโนมัติเมื่อออเดอร์ค้างเกินจำนวนที่ตั้ง (ร้านเปิด/ปิดเองโดยไม่ต้องแตะ) ===== */
const AUTO_CLOSE_KEY = "sangkha-auto-close"; // restaurantId → { enabled, threshold }

function getAutoCloseSetting(id) {
  try {
    const all = JSON.parse(localStorage.getItem(AUTO_CLOSE_KEY) || "{}");
    const s = all[String(id)];
    if (s && s.enabled && Number(s.threshold) > 0) return { enabled: true, threshold: Number(s.threshold) };
    return null;
  } catch (_) { return null; }
}

function setAutoCloseSetting(id, enabled, threshold) {
  try {
    const all = JSON.parse(localStorage.getItem(AUTO_CLOSE_KEY) || "{}");
    if (enabled) all[String(id)] = { enabled: true, threshold: Math.max(1, Math.min(99, Number(threshold) || 5)) };
    else delete all[String(id)];
    localStorage.setItem(AUTO_CLOSE_KEY, JSON.stringify(all));
  } catch (_) { /* ไม่เป็นไร */ }
}

// จำนวนออเดอร์ที่ยังไม่ได้ส่งต่อ (ค้างเตรียม) — ใช้ตัดสินปิดอัตโนมัติ
function getPendingOrderCount(restaurantId) {
  try {
    return getOrdersFor(restaurantId).filter((o) => o.status === "ใหม่" || o.status === "กำลังเตรียม").length;
  } catch (_) { return 0; }
}

// ระบบปิดอัตโนมัติกำลังทำงานอยู่หรือไม่ (ออเดอร์ค้าง ≥ เกณฑ์ที่ตั้ง)
function isAutoClosed(restaurantId) {
  const s = getAutoCloseSetting(restaurantId);
  if (!s) return false;
  return getPendingOrderCount(restaurantId) >= s.threshold;
}

/* ===== รีวิวจากลูกค้า (ให้คะแนนหลังออเดอร์เสร็จสิ้น) ===== */
const REVIEWS_KEY = "sangkha-reviews";

function getReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) { /* ไม่เป็นไร */ }
  return [];
}

function getReviewForOrder(orderId, restaurantId) {
  return getReviews().find((r) => r.orderId === orderId && (!restaurantId || r.restaurantId === restaurantId)) || null;
}

// บันทึก/แก้รีวิวของออเดอร์ (1 ออเดอร์ ให้คะแนนได้ครั้งเดียว — ส่งใหม่ = แก้ไข)
function addReview(review) {
  const reviews = getReviews().filter((r) => r.orderId !== review.orderId);
  reviews.push({ ...review, createdAt: Date.now() });
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  } catch (_) { /* ไม่เป็นไร */ }
}

// บันทึก/แก้คำตอบของร้านค้าต่อรีวิว (1 รีวิว ตอบได้ 1 ครั้ง — ส่งใหม่ = แก้ไข)
function addReviewReply(orderId, restaurantId, reply) {
  const reviews = getReviews();
  const r = reviews.find((x) => x.orderId === orderId && x.restaurantId === restaurantId);
  if (!r) return null;
  r.reply = reply;
  r.repliedAt = Date.now();
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  } catch (_) { /* ไม่เป็นไร */ }
  return r;
}

// คะแนนรวมของร้าน = คะแนนตั้งต้น (พร้อมจำนวนรีวิวตั้งต้น) + รีวิวจากลูกค้าที่ส่งจริง
function getEffectiveRating(restaurantId) {
  const rest = getRestaurant(restaurantId);
  const mine = getReviews().filter((r) => r.restaurantId === restaurantId);
  if (!mine.length) return { rating: rest.rating, reviews: rest.reviews };
  const total = rest.rating * rest.reviews + mine.reduce((s, r) => s + r.rating, 0);
  const count = rest.reviews + mine.length;
  return { rating: Math.round((total / count) * 10) / 10, reviews: count };
}

/* ===== Dark Theme (แยกรายคน/รายบทบาท — สลับแล้วไม่ไปเปลี่ยนหน้าของคนอื่น) =====
   - ร้านค้า → sangkha-theme:store:{id} · ไรเดอร์ → sangkha-theme:rider:{id}
   - แอดมิน → sangkha-theme:admin · ลูกค้า → sangkha-theme:customer:{เบอร์}
   - ยังไม่ล็อกอิน (guest) → sangkha-theme (ค่าเริ่มต้นเครื่อง) */
function resolveThemeKey() {
  try {
    const ss = localStorage.getItem(STORE_SESSION_KEY);
    if (ss) {
      try {
        const o = JSON.parse(ss);
        return "sangkha-theme:store:" + (o && o.id != null ? o.id : "x");
      } catch (_) {
        return "sangkha-theme:store";
      }
    }
    const rid = localStorage.getItem(RIDER_KEY);
    if (rid) return "sangkha-theme:rider:" + rid;
    if (localStorage.getItem(ADMIN_SESSION_KEY)) return "sangkha-theme:admin";
    const cs = localStorage.getItem("sangkha-customer-session");
    if (cs) return "sangkha-theme:customer:" + cs;
  } catch (_) { /* ไม่เป็นไร */ }
  return "sangkha-theme";
}

function getTheme() {
  try {
    return localStorage.getItem(resolveThemeKey()) === "dark" ? "dark" : "light";
  } catch (_) {
    return "light";
  }
}

function setTheme(t) {
  try {
    localStorage.setItem(resolveThemeKey(), t);
  } catch (_) { /* ไม่เป็นไร */ }
}
