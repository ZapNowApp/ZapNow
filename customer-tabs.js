/* ============================================================
   customer-tabs.js — UI แบบ Mobile App ของหน้าร้านลูกค้า (6 แท็บ)
   ------------------------------------------------------------
   🏠 หน้าแรก · 🍜 ร้านอาหาร · 🔥 โปรโมชัน · 📦 ออเดอร์ · 🛵 ติดตามส่ง · 👤 บัญชี
   - ไม่ลบระบบเดิม: ใช้ฟังก์ชันเดิมทั้งหมด (switchRestaurant,
     getOrders, getActiveOrder, reorder, openHistory, trackerMapData...)
   - แท็บ "ร้านอาหาร" = เนื้อหาเดิมทั้งหน้า (สไลด์/ชิปร้าน/เมนู/ตะกร้า)
   - component แถบเมนูล่าง: UI.CustomerBottomNav (components/ui.js)
   ============================================================ */
(function () {
  "use strict";
  if (typeof UI === "undefined" || typeof getRestaurants === "undefined") return;

  const $ = (s) => document.querySelector(s);

  /* ===== Dark Theme (แยกตามบทบาท/ผู้ใช้ — ไม่ไปสลับหน้าของคนอื่น) ===== */
  // ลูกค้าล็อกอิน → ธีมของลูกค้าเบอร์นั้น · ยังไม่ล็อกอิน → ค่าเริ่มต้นเครื่อง (guest)
  function currentTheme() {
    return typeof getTheme === "function" ? getTheme() : "light";
  }
  function toggleTheme() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    showToast(next === "dark" ? "🌙 เปิดโหมดมืดแล้ว — เฉพาะบัญชีของคุณ" : "☀️ กลับโหมดสว่างแล้ว");
  }

  /* ===== 1. mount แถบเมนูล่าง (component กลาง) ===== */
  UI.mount(
    "#cust-nav-mount",
    UI.CustomerBottomNav({
      active: "home",
      ordersBadge: "0",
      ordersBadgeId: "cust-nav-orders-badge",
      ordersBadgeHidden: true,
    })
  );

  /* ===== 2. สลับแท็บ ===== */
  function showCustomerTab(name) {
    document.querySelectorAll(".customer-tab").forEach((t) => t.classList.toggle("active", t.id === "tab-" + name));
    document.querySelectorAll("[data-cust-page]").forEach((b) => b.classList.toggle("active", b.dataset.custPage === name));
    window.scrollTo(0, 0);
    if (name === "home") { if (window.refreshHomeAds) window.refreshHomeAds(); renderHomeTab(); }
    else if (name === "restaurants") refreshRestaurantTab();
    else if (name === "promos") renderPromosTab();
    else if (name === "orders") renderOrdersTab();
    else if (name === "tracking") renderTrackingTab();
    else if (name === "account") renderAccountTab();
  }
  document.querySelectorAll("[data-cust-page]").forEach((btn) => {
    btn.addEventListener("click", () => showCustomerTab(btn.dataset.custPage));
  });

  // เข้าแท็บร้านอาหาร → วาดข้อมูลสด (ระบบเดิม — เมนู/ชิป/สถานะ/ตะกร้า)
  function refreshRestaurantTab() {
    const current = getRestaurant(currentRestaurantId);
    MENU = current.menu;
    renderRestaurant(current);
    renderStoreSwitcher();
    ensureActiveCategoryHasItems();
    renderMenu(activeCategory);
    renderCart();
    renderOrderTracker();
    renderPublicReviews();
  }

  /* ===== 3. หน้าแรก (สวัสดี + ที่อยู่ + โปรโมชั่น + ร้านใกล้คุณ) ===== */
  const homeGreetName = $("#home-greet-name");
  const homeDeliverTo = $("#home-deliver-to");
  const homePromosEl = $("#home-promos");
  const homeRestaurantsEl = $("#home-restaurants");

  function getCustomerSession() {
    try { return localStorage.getItem("sangkha-customer-session") || ""; } catch (_) { return ""; }
  }
  function getCustomerAccount(phone) {
    try {
      const raw = localStorage.getItem("sangkha-customer-accounts");
      if (!raw) return null;
      const map = JSON.parse(raw);
      const acc = map && (map[phone] || map[String(phone).replace(/\D/g, "")]);
      return acc || null;
    } catch (_) { return null; }
  }

  function renderHomeTab() {
    const sess = getCustomerSession();
    const acc = sess ? getCustomerAccount(sess) : null;
    homeGreetName.textContent = acc && acc.name ? acc.name : sess ? sess : "ยินดีต้อนรับสู่ SangkhaFood";
    const gps = getCustomerGps();
    homeDeliverTo.textContent = gps ? gps.lat.toFixed(4) + ", " + gps.lng.toFixed(4) : "แตะเพื่อตั้งตำแหน่ง";
    renderHomePromos();
    renderHomeRestaurants();
  }

  // โปรโมชั่น (จากข้อมูลโฆษณาเดียวกับสไลด์บนสุด — ไม่สร้างข้อมูลใหม่)
  function renderHomePromos() {
    if (!homePromosEl) return;
    const ads = (typeof ADS !== "undefined" && ADS && ADS.length ? ADS : getLiveAds());
    homePromosEl.innerHTML = ads
      .map((ad) => {
        const bg = ad.bg || "linear-gradient(135deg,#ffb347,#ff6b35)";
        const imgSrc = ad.imageUrl || ad.bgImage || "";
        const media = imgSrc
          ? UI.imgBlock({ img: imgSrc, emoji: ad.emoji, color: bg, alt: ad.title, fallback: "images/no-food.png" })
          : '<span class="promo-emoji" aria-hidden="true" style="position:absolute;inset:0;display:grid;place-items:center;font-size:54px">' + escapeHtml(ad.emoji || "🎁") + "</span>";
        return (
          '<button class="promo-card" data-promo="' + ad.id + '" type="button" style="background:' + bg + '">' +
          media +
          '<span class="promo-scrim"></span>' +
          "<b>" + escapeHtml(ad.title || "") + "</b>" +
          (ad.desc ? "<small>" + escapeHtml(ad.desc) + "</small>" : "") +
          '<span class="promo-cta">' + escapeHtml(ad.cta || "ดูโปรโมชัน") + " →</span>" +
          "</button>"
        );
      })
      .join("");
  }
  /* ===== 4. แท็บ โปรโมชัน (รวมดีลจากทุกแบนเนอร์ — รายการแนวตั้ง) ===== */
  const promosListEl = $("#promos-list");

  // ระยะเวลาที่เหลือของโฆษณา (ตั้ง endAt ใน admin) — ไม่มี endAt = ออกตลอด
  function formatAdLeft(ad) {
    const end = Number(ad.endAt) || 0;
    if (!end) return "";
    const ms = end - Date.now();
    if (ms <= 0) return "หมดเขตแล้ว";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h >= 24) {
      const d = Math.floor(h / 24);
      return "หมดเขตใน " + d + " วัน";
    }
    return "หมดเขตใน " + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function renderPromosTab() {
    if (!promosListEl) return;
    const ads = typeof getLiveAds === "function" ? getLiveAds() : (typeof ADS !== "undefined" && ADS ? ADS : []);
    if (!ads.length) {
      promosListEl.innerHTML = '<p class="empty-state">ยังไม่มีโปรโมชัน — กลับมาดูใหม่ภายหลัง</p>';
      return;
    }
    promosListEl.innerHTML = ads
      .map((ad) => {
        const bg = ad.bg || "linear-gradient(135deg,#ffb347,#ff6b35)";
        const imgSrc = ad.imageUrl || ad.bgImage || "";
        const isMotion = !!(ad.aiMotion && ad.aiImg);
        const media = imgSrc || isMotion
          ? UI.imgBlock({ img: imgSrc || ad.aiImg || "", emoji: ad.emoji, color: bg, alt: ad.title, fallback: "images/no-food.png" })
          : '<span class="promo-emoji" aria-hidden="true">' + escapeHtml(ad.emoji || "🎁") + "</span>";
        const timeLeft = formatAdLeft(ad);
        return (
          '<article class="promo-item" data-promo="' + ad.id + '" role="button" tabindex="0" aria-label="โฆษณา: ' + escapeHtml(ad.title || "") + '" style="background:' + bg + '">' +
          (isMotion && ad.aiImg ? '<div class="ad-kenburns" style="background-image:url(\'' + ad.aiImg + '\')" aria-hidden="true"></div><div class="ad-shine" aria-hidden="true"></div>' : "") +
          media +
          '<span class="promo-scrim"></span>' +
          '<span class="ad-badge">โฆษณา</span>' +
          '<div class="promo-item-body">' +
          (timeLeft ? '<span class="promo-item-time">⏳ ' + escapeHtml(timeLeft) + "</span>" : "") +
          "<b>" + escapeHtml(ad.title || "") + "</b>" +
          (ad.desc ? "<small>" + escapeHtml(ad.desc) + "</small>" : "") +
          '<span class="promo-cta">' + escapeHtml(ad.cta || "ดูโปรโมชัน") + " →</span>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }
  if (promosListEl) {
    promosListEl.addEventListener("click", (e) => {
      const card = e.target.closest("[data-promo]");
      if (!card) return;
      const id = Number(card.dataset.promo);
      const ad = (typeof getLiveAds === "function" ? getLiveAds() : []).find((a) => a.id === id);
      if (ad && typeof recordAdClick === "function") recordAdClick(ad.id);
      location.href = "deal.html?id=" + id;
    });
    // ร้าน/แอดมินแก้โฆษณาจากแท็บอื่น → อัปเดตทันที
    window.addEventListener("storage", (e) => {
      if (e.key === "sangkha-ads" && document.getElementById("tab-promos").classList.contains("active")) renderPromosTab();
    });
  }

  homePromosEl.addEventListener("click", (e) => {
    const card = e.target.closest("[data-promo]");
    if (!card) return;
    const id = Number(card.dataset.promo);
    recordAdClick(id);
    location.href = "deal.html?id=" + id;
  });

  // ร้านอาหารใกล้คุณ (RestaurantCard — ภาพจริง + ★ + เวลา + ระยะ + ปุ่มดูร้าน)
  function renderHomeRestaurants() {
    if (!homeRestaurantsEl) return;
    const hasLoc = !!getCustomerGps();
    const rests = getRestaurants()
      .map((r) => ({
        r,
        dist: customerDistanceKm(r),
      }))
      .sort((a, b) => (hasLoc ? a.dist - b.dist : String(a.r.name).localeCompare(String(b.r.name), "th")));
    homeRestaurantsEl.innerHTML = rests
      .map((item) =>
        UI.RestaurantCard({
          id: item.r.id,
          img: item.r.imageUrl || UI.storeImgUrl(item.r.name, item.r.cuisine),
          emoji: item.r.coverEmoji,
          color: item.r.coverBg,
          name: item.r.name,
          cuisine: item.r.cuisine,
          rating: getEffectiveRating(item.r.id).rating,
          time: item.r.deliveryTime,
          distance: item.dist.toFixed(1) + " กม.",
          isNew: isRegisteredStore(item.r.id),
          cta: "ดูร้าน",
          data: [{ k: "rid", v: item.r.id }],
        })
      )
      .join("");
  }
  homeRestaurantsEl.addEventListener("click", (e) => {
    const card = e.target.closest("[data-rid]");
    if (!card) return;
    switchRestaurant(Number(card.dataset.rid));
    showCustomerTab("restaurants");
  });

  // ที่อยู่จัดส่ง (แตะ = ตั้งตำแหน่งผ่านระบบเดิม)
  $("#home-loc").addEventListener("click", () => {
    showCustomerTab("restaurants");
    const btn = $("#btn-locate-me");
    if (btn) btn.click();
  });

  // ค้นหาจากหน้าแรก → ใช้ช่องค้นหาหลัก (ระบบเดิม) ในแท็บร้านอาหาร
  const homeSearch = $("#home-search");
  homeSearch.addEventListener("input", () => {
    const main = $("#search-input");
    if (main) main.value = homeSearch.value;
  });
  homeSearch.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const q = homeSearch.value.trim();
    showCustomerTab("restaurants");
    const main = $("#search-input");
    if (main) {
      main.value = q;
      main.focus();
      main.dispatchEvent(new Event("input"));
    }
  });

  /* ===== 4. หน้าออเดอร์ (การ์ดออเดอร์ + สถานะ + สั่งซ้ำ + ติดตาม) ===== */
  const ordersListEl = $("#orders-list");
  const ORDER_STATUS_CLS = {
    "ใหม่": "new", "กำลังเตรียม": "preparing", "พร้อมส่ง": "ready",
    "กำลังจัดส่ง": "delivering", "เสร็จสิ้น": "done", "ยกเลิก": "cancelled",
  };
  const IN_PROGRESS = ["ใหม่", "กำลังเตรียม", "พร้อมส่ง", "กำลังจัดส่ง"];

  function orderCardHtml(o) {
    const rest = getRestaurant(o.restaurantId);
    const restName = rest ? rest.name : "ร้าน";
    const items = Array.isArray(o.items) ? o.items : [];
    const statusCls = ORDER_STATUS_CLS[o.status] || "new";
    const tracking = IN_PROGRESS.includes(o.status);
    return (
      '<article class="order-card">' +
      '<div class="order-card-head">' +
      "<div><b>ออเดอร์ #" + o.id + " · " + escapeHtml(restName) + "</b>" +
      "<small>" + fmtDateTime(o.createdAt) + "</small></div>" +
      '<span class="order-status ' + statusCls + '">' + escapeHtml(o.status) + "</span>" +
      "</div>" +
      '<div class="order-items">' +
      items
        .map((it) => {
          const qty = Number(it.qty) || 0;
          return '<span class="order-item-chip">' + escapeHtml(it.name || "—") + (qty > 1 ? " ×" + qty : "") + "</span>";
        })
        .join("") +
      "</div>" +
      '<div class="order-card-foot">' +
      '<span class="order-card-total">' + fmt(o.total || 0) + "</span>" +
      '<div class="order-card-actions">' +
      (tracking ? '<button class="order-card-btn rider" data-track="' + o.id + '" type="button">🛵 ติดตาม</button>' : "") +
      (o.status === "เสร็จสิ้น" || o.status === "ยกเลิก" ? '<button class="order-card-btn primary" data-reorder="' + o.id + '" type="button">🔄 สั่งซ้ำ</button>' : "") +
      "</div></div></article>"
    );
  }

  function renderOrdersTab() {
    const orders = getOrders().sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
    ordersListEl.innerHTML = orders.length
      ? orders.map(orderCardHtml).join("")
      : '<div class="orders-empty"><span class="big">🧺</span>ยังไม่มีออเดอร์<br />สั่งอาหารอร่อย ๆ แล้วกลับมาดูได้ที่นี่</div>';
  }

  ordersListEl.addEventListener("click", (e) => {
    const trackBtn = e.target.closest("[data-track]");
    if (trackBtn) {
      showCustomerTab("tracking");
      return;
    }
    const reBtn = e.target.closest("[data-reorder]");
    if (reBtn) reorder(Number(reBtn.dataset.reorder));
  });

  /* ===== 5. หน้าติดตามส่ง (ไรเดอร์ + สถานะ + แผนที่ Leaflet + เปิด Google Maps) ===== */
  const trackingPageEl = $("#tracking-page");
  let custTrackingMap = null;
  let custTrackingCtx = null;

  function destroyCustTrackingMap() {
    if (custTrackingMap) {
      custTrackingMap.remove();
      custTrackingMap = null;
    }
    custTrackingCtx = null;
  }

  function renderTrackingTab() {
    const orders = getOrders();
    const active = getActiveOrder() || orders.filter((o) => IN_PROGRESS.includes(o.status)).sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0))[0] || null;
    if (!active) {
      destroyCustTrackingMap();
      trackingPageEl.innerHTML =
        '<div class="orders-empty"><span class="big">🛵</span>ยังไม่มีออเดอร์ระหว่างส่ง<br />' +
        '<button class="order-card-btn primary" id="tracking-go-order" type="button" style="margin-top:12px">🍜 ไปสั่งอาหาร</button></div>';
      const go = $("#tracking-go-order");
      if (go) go.addEventListener("click", () => showCustomerTab("restaurants"));
      return;
    }

    const rest = getRestaurant(active.restaurantId);
    const restName = rest ? rest.name : "ร้าน";
    const stepIdx = { "ใหม่": 0, "กำลังเตรียม": 1, "พร้อมส่ง": 1, "กำลังจัดส่ง": 2, "เสร็จสิ้น": 3 }[active.status] ?? 0;
    const delivering = active.status === "กำลังจัดส่ง" && active.riderName;
    const rider = active.riderId ? getRiderById(active.riderId) : null;
    const riderPhone = active.riderPhone || (rider && rider.phone) || "—";
    const etaText = delivering ? riderStageSub(active) : "";
    const gps = getCustomerGps();

    trackingPageEl.innerHTML =
      '<div class="delivery-card">' +
      "<h3>ออเดอร์ #" + active.id + " · " + escapeHtml(restName) + "</h3>" +
      '<span class="dc-sub">' + escapeHtml(active.status) + " · " + fmt(active.total || 0) + " · " + fmtDateTime(active.createdAt) + "</span>" +
      '<div class="track-steps" role="list" aria-label="ขั้นตอนสถานะ">' +
      STATUS_STEPS.map((s, i) =>
        '<div class="track-step' + (i <= stepIdx ? " active" : "") + '" role="listitem">' +
        '<div class="track-step-dot" aria-hidden="true">' + (i <= stepIdx ? s.icon : "○") + "</div>" +
        '<span class="track-step-label">' + escapeHtml(s.label) + "</span></div>"
      ).join("") +
      "</div>" +
      (delivering
        ? '<div class="rider-info"><span class="rider-info-avatar"><img src="images/no-avatar.png" alt="" /></span>' +
          '<div class="flex"><b>🛵 ' + escapeHtml(active.riderName) + "</b>" +
          "<small>เบอร์ " + escapeHtml(riderPhone) + "</small>" +
          '<small id="tracking-eta">' + escapeHtml(etaText) + "</small></div>" +
          '<a class="order-card-btn rider" href="https://maps.google.com/?q=' + (gps ? gps.lat + "," + gps.lng : "13.736,100.51") + '" target="_blank" rel="noopener">🗺️ เปิดแผนที่</a></div>'
        : '<div class="rider-info"><span class="rider-info-avatar" aria-hidden="true">👨‍🍳</span>' +
          '<div class="flex"><b>' + (active.status === "ใหม่" ? "รอร้านรับออเดอร์" : active.status === "พร้อมส่ง" ? "อาหารพร้อม รอไรเดอร์" : "กำลังเตรียมอาหาร") + "</b>" +
          "<small>ร้าน " + escapeHtml(restName) + " · จัดส่ง " + escapeHtml(rest ? rest.deliveryTime : "") + "</small></div></div>") +
      "</div>" +
      '<div class="delivery-card" id="tracking-map-card" hidden>' +
      '<h3>📍 ตำแหน่งไรเดอร์ (สด)</h3>' +
      '<div class="tracking-map-box" id="tracking-map-leaflet" aria-label="แผนที่ตำแหน่งไรเดอร์ (OpenStreetMap)"></div>' +
      '<p class="dc-sub" style="margin-top:8px">เปิดใน Google Maps เพื่อนำทาง — "เปิดแผนที่" ปุ่มข้างชื่อไรเดอร์</p>' +
      "</div>";

    // แผนที่สดเฉพาะขั้นกำลังจัดส่ง (ใช้ระบบเส้นทางเดิม — OSRM/Leaflet)
    if (delivering) {
      const card = $("#tracking-map-card");
      card.hidden = false;
      const el = $("#tracking-map-leaflet");
      if (window.L && el) {
        if (!custTrackingMap) {
          custTrackingMap = L.map(el, { zoomControl: false }).setView([13.736, 100.51], 14);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          }).addTo(custTrackingMap);
        }
        custTrackingCtx = { orderId: active.id, riderName: active.riderName, restName };
        custTrackingMap.invalidateSize();
        renderCustTrackingMap(active);
      }
    } else {
      destroyCustTrackingMap();
    }
  }

  // วาดไรเดอร์บนแผนที่ (ข้อมูลเดียวกับ tracker — ใช้ helper เดิมทั้งหมด)
  function renderCustTrackingMap(order) {
    if (!custTrackingMap || !order) return;
    const data = trackerMapData(order);
    const eff = effectiveRoute(data.start, data.end, data.path, data.totalKm);
    const path = eff.path;
    if (!eff.road) {
      loadRoadRoute(data.start, data.end).then((val) => {
        if (val && val.pts && custTrackingMap) renderCustTrackingMap(order);
      });
    }
    let elapsed = data.elapsed;
    if (data.stage === "กำลังไปส่ง") {
      elapsed = Math.min(1, Math.max(0, (Date.now() - (order.departedAt || order.pickedUpAt || order.createdAt)) / eff.legMs));
    }
    custTrackingMap.eachLayer((l) => { if (l instanceof L.Polyline || l instanceof L.Marker) custTrackingMap.removeLayer(l); });
    L.polyline(path.map((p) => [p.lat, p.lng]), { color: "#ff5c1a", weight: 4, dashArray: "8 6" }).addTo(custTrackingMap);
    L.marker([data.start.lat, data.start.lng], { icon: trackerEmojiIcon("🏪", (data.rest.name || "ร้าน").slice(0, 14)) }).addTo(custTrackingMap);
    L.marker([data.end.lat, data.end.lng], { icon: trackerEmojiIcon("🏠", "บ้านคุณ") }).addTo(custTrackingMap);
    const pos = pointAtGps(path, elapsed);
    L.marker([pos.lat, pos.lng], { icon: trackerEmojiIcon("🛵") }).addTo(custTrackingMap);
    custTrackingMap.fitBounds(L.latLngBounds(path.map((p) => [p.lat, p.lng])), { padding: [26, 26], maxZoom: 16 });
    const etaEl = $("#tracking-eta");
    if (etaEl) etaEl.textContent = riderStageSub(order);
  }

  /* ===== 6. หน้าบัญชี ===== */
  const accountAvatarEl = $("#account-avatar");
  const accountNameEl = $("#account-name");
  const accountPhoneEl = $("#account-phone");
  const accountStatusEl = $("#account-status");
  const accountMenuEl = $("#account-menu");

  function renderAccountTab() {
    const sess = getCustomerSession();
    const acc = sess ? getCustomerAccount(sess) : null;
    accountAvatarEl.innerHTML = '<img src="images/no-avatar.png" alt="รูปโปรไฟล์" />';
    accountNameEl.textContent = acc && acc.name ? acc.name : sess ? sess : "ยังไม่ได้เข้าสู่ระบบ";
    accountPhoneEl.textContent = sess ? sess : "เข้าสู่ระบบเพื่อใช้สิทธิ์สมาชิก";
    accountStatusEl.textContent = sess ? "✅ สมาชิก SangkhaFood" : "👤 ยังไม่ได้เข้าสู่ระบบ";

    const items = [
      { icon: "🌙", label: "โหมดมืด", act: "theme", switch: true },
      { icon: "👤", label: "แก้ไขข้อมูล", act: "edit" },
      { icon: "📍", label: "ที่อยู่จัดส่ง", act: "address" },
      { icon: "❤️", label: "ร้านโปรด", act: "favorites" },
      { icon: "🎟️", label: "คูปองของฉัน", act: "coupons" },
      { icon: "📦", label: "ประวัติออเดอร์", act: "history" },
      { icon: "⭐", label: "คะแนนสะสม", act: "points" },
      { icon: "⚙️", label: "ตั้งค่า", act: "settings" },
      { icon: "🚪", label: "ออกจากระบบ", act: "logout", danger: true },
    ];
    const isDark = currentTheme() === "dark";
    accountMenuEl.innerHTML = items
      .map(
        (it) =>
          '<button class="account-menu-item' + (it.danger ? " danger" : "") + '" data-act="' + it.act + '" type="button">' +
          '<span class="ami-icon" aria-hidden="true">' + it.icon + "</span>" +
          "<span>" + escapeHtml(it.label) + "</span>" +
          (it.switch
            ? '<span class="theme-switch' + (isDark ? " on" : "") + '" aria-hidden="true"><span class="theme-knob"></span></span>'
            : '<span class="ami-go" aria-hidden="true">›</span>') +
          "</button>"
      )
      .join("");
  }

  accountMenuEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "theme") {
      toggleTheme();
      renderAccountTab();
    } else if (act === "edit") {
      location.href = "customer-login.html";
    } else if (act === "address") {
      showCustomerTab("restaurants");
      const loc = $("#btn-locate-me");
      if (loc) loc.click();
      else showToast("📍 กดปุ่ม \"ใช้ตำแหน่งของฉัน\" ในหัวร้านเพื่อตั้งที่อยู่จัดส่ง");
    } else if (act === "favorites") {
      const follows = getFollows();
      if (!follows.length) {
        showToast("❤️ ยังไม่มีร้านโปรด — กด 🔖 ติดตามร้านที่หน้าร้านได้เลย");
      } else {
        const names = follows.map((id) => getRestaurant(id).name).filter(Boolean);
        showToast("❤️ ร้านโปรด: " + names.join(", "));
        showCustomerTab("restaurants");
      }
    } else if (act === "coupons") {
      const coupons = getCoupons();
      const valid = coupons.filter((c) => !c.usedAt);
      showToast("🎟️ คุณมีคูปอง " + valid.length + " ใบ (ใช้ได้ " + coupons.length + " ใบ) — เลือกได้ตอนสั่งซื้อ");
    } else if (act === "history") {
      openHistory();
    } else if (act === "points") {
      showToast("⭐ คะแนนสะสม — ระบบเตรียมเปิดเร็ว ๆ นี้ ✨");
    } else if (act === "settings") {
      showToast("⚙️ ตั้งค่า — เร็ว ๆ นี้");
    } else if (act === "logout") {
      if (!confirm("ออกจากระบบ?")) return;
      try { localStorage.removeItem("sangkha-customer-session"); } catch (_) { /* ไม่เป็นไร */ }
      showToast("👋 ออกจากระบบแล้ว");
      renderAccountTab();
      renderHomeTab();
    }
  });

  /* ===== 7. badge ออเดอร์ + รีเฟรชสด ===== */
  function updateOrdersBadge() {
    const n = getOrders().filter((o) => IN_PROGRESS.includes(o.status)).length;
    const badge = $("#cust-nav-orders-badge");
    if (badge) {
      badge.hidden = n === 0;
      badge.textContent = n > 99 ? "99+" : String(n);
    }
  }

  setInterval(() => {
    updateOrdersBadge();
    const activeTab = document.querySelector(".customer-tab.active");
    if (!activeTab) return;
    if (activeTab.id === "tab-home") renderHomeTab();
    else if (activeTab.id === "tab-orders") renderOrdersTab();
    else if (activeTab.id === "tab-tracking") {
      const active = getActiveOrder() || getOrders().filter((o) => IN_PROGRESS.includes(o.status)).length;
      if (active) renderTrackingTab();
    } else if (activeTab.id === "tab-account") renderAccountTab();
  }, 3000);

  window.addEventListener("storage", () => {
    updateOrdersBadge();
    const activeTab = document.querySelector(".customer-tab.active");
    if (activeTab && activeTab.id === "tab-restaurants") refreshRestaurantTab();
  });

  /* ===== init ===== */
  updateOrdersBadge();
  renderHomeTab();
})();
