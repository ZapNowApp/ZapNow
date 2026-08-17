/* ============================================================
   UI ตัวรวม (loader) — components/ui.js
   ------------------------------------------------------------
   โหลดไฟล์นี้เพียงไฟล์เดียวในทุกหน้า แล้ว component ทั้งหมด
   (AppHeader/UserCard/ActionCard/Button/Input/BottomNav/Modal/
   BottomSheet/Loading/StatusBadge/StatisticCard) จะพร้อมใช้
   ผ่าน window.UI.* — แต่ละตัวคืน HTML string (ใส่ id/class เดิมได้)
   ============================================================ */
(function () {
  "use strict";

  if (window.UI) return; // ป้องกันโหลดซ้ำ

  window.UI = {};

  // ---------- ไอคอน SVG ชุดเดียวกับทั้งระบบ ----------
  UI.ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 11 12 3.5 20.5 11"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5.2h4V20"/></svg>',
    orders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16V8z"/><path d="M3.5 8 12 13 20.5 8"/><path d="M12 13v7.5"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5h16"/><path d="M5.8 12.5c0 3.9 2.8 6.8 6.2 6.8s6.2-2.9 6.2-6.8"/><path d="M9 9.5V6.8"/><path d="M13 9.5V6.8"/></svg>',
    reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 20.5h17"/><path d="M6 20V13"/><path d="M12 20V4.5"/><path d="M18 20v-8"/></svg>',
    riders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.8 8.2h9.2v8.3H2.8z"/><path d="M12 10.8h3.6l3.6 3.6v2.1h-7.2z"/><circle cx="7.4" cy="17.3" r="1.6"/><circle cx="16.6" cy="17.3" r="1.6"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="6" width="17" height="14" rx="2.5"/><path d="M3.5 11h17"/><path d="M8 6V4.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2V6"/><path d="M8.5 15h3"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6.5-5.2-6.5-10a6.5 6.5 0 0 1 13 0c0 4.8-6.5 10-6.5 10z"/><circle cx="12" cy="10.5" r="2.6"/></svg>',
    tracking: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="17.5" r="2.3"/><circle cx="18" cy="17.5" r="2.3"/><path d="M8.3 17.5h7.4"/><path d="M15.7 17.5 13.8 9.5H9.4"/><path d="M13.8 9.5l1-2.7h3.6"/><path d="M18.4 6.8V11h-4.6"/><path d="M4.5 9.5h3.4"/></svg>',
    promo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2.5 5 13.5h5.5L11 21.5 19 10h-5.5z"/></svg>',
    history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5"/><path d="M3.5 3.5V8.5H8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 20c0-3.6 3.4-5.7 7.5-5.7s7.5 2.1 7.5 5.7"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4.5h4V19.5h-4"/><path d="M9.5 8 5 12l4.5 4"/><path d="M5.5 12H15"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 20c0-3.6 3.4-5.7 7.5-5.7s7.5 2.1 7.5 5.7"/></svg>',
  };

  // ---------- helper ----------
  UI.escapeHtml = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  // Ripple — delegate กับ .ds-btn ทั้งหมดใน document
  UI.initRipple = function (root) {
    (root || document).addEventListener("pointerdown", function (e) {
      const btn = e.target.closest(".ds-btn");
      if (!btn || btn.disabled) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const span = document.createElement("span");
      span.className = "ds-ripple";
      span.style.width = span.style.height = size + "px";
      span.style.left = (e.clientX - rect.left - size / 2) + "px";
      span.style.top = (e.clientY - rect.top - size / 2) + "px";
      btn.appendChild(span);
      setTimeout(function () { span.remove(); }, 650);
    });
  };

  // แทนที่ innerHTML ของ mount point ด้วย string (ไม่จำเป็นต้องมี mount — ส่ง string ตรงได้)
  UI.mount = function (selector, html) {
    const el = typeof selector === "string" ? document.querySelector(selector) : selector;
    if (el) el.innerHTML = html;
    return el;
  };

  // เปิด/ปิด modal / bottom sheet (class .ds-overlay / .ds-sheet-overlay)
  UI.openModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.hidden = false;
    document.body.style.overflow = "hidden";
  };
  UI.closeModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
    document.body.style.overflow = "";
  };

  /* ============================================================
     1. AppHeader — แถบบนสุด (logo + ชื่อ + subtitle + live/avatar)
     ============================================================ */
  UI.AppHeader = function (o) {
    o = o || {};
    const back = o.back
      ? '<a class="ds-btn-back" href="' + (o.backHref || "#") + '" aria-label="กลับ">' + UI.ICONS.back + "</a>"
      : "";
    const live = o.live
      ? '<span class="ds-header-live"><span class="ds-header-live-dot"></span><span>' + UI.escapeHtml(o.liveText || "สด") + "</span></span>"
      : "";
    const avatar = o.avatarImg
      ? '<span class="ds-header-avatar"><img src="' + UI.escapeHtml(o.avatarImg) + '" alt="รูปโปรไฟล์" loading="lazy" onerror="UI._imgFail(this)" data-fallback="images/no-avatar.png" /></span>'
      : o.avatar
        ? '<span class="ds-header-avatar" role="img" aria-label="รูปโปรไฟล์">' + UI.escapeHtml(o.avatar) + "</span>"
        : "";
    return (
      '<header class="ds-header' + (o.className ? " " + o.className : "") + '">' +
      '<div class="ds-header-inner">' +
      back +
      (o.logoImg
        ? '<span class="ds-header-logo"><img src="' + UI.escapeHtml(o.logoImg) + '" alt="โลโก้" loading="lazy" onerror="UI._imgFail(this)" data-fallback="images/no-store.png" /></span>'
        : o.logo
          ? '<span class="ds-header-logo" role="img" aria-label="โลโก้">' + UI.escapeHtml(o.logo) + "</span>"
          : "") +
      '<div class="ds-header-info">' +
      "<h1" + (o.titleId ? ' id="' + o.titleId + '"' : "") + ">" + UI.escapeHtml(o.title || "") + "</h1>" +
      (o.subtitle ? '<p' + (o.subtitleId ? ' id="' + o.subtitleId + '"' : "") + ">" + UI.escapeHtml(o.subtitle) + "</p>" : "") +
      "</div>" +
      '<div class="ds-header-side">' + (o.side || "") + live + avatar + "</div>" +
      "</div>" +
      "</header>"
    );
  };

  /* ============================================================
     2. UserCard — การ์ดผู้ใช้ (hero) โลโก้/ชื่อ/สถานะ/สถิติ
     ============================================================ */
  UI.UserCard = function (o) {
    o = o || {};
    const stats = (o.stats || [])
      .map(function (s) {
        return '<div class="ds-user-stat"><b' + (s.id ? ' id="' + s.id + '"' : "") + ">" + UI.escapeHtml(s.value == null ? "—" : s.value) + "</b><span>" + UI.escapeHtml(s.label) + "</span></div>";
      })
      .join("");
    const badge = (o.badge || o.extraBadge)
      ? '<div class="ds-user-badge">' + (o.badge ? UI.StatusBadge(o.badge) : "") + (o.extraBadge ? UI.StatusBadge(o.extraBadge) : "") + "</div>"
      : "";
    const avatar = o.avatarImg
      ? '<div class="ds-user-avatar"' + (o.avatarId ? ' id="' + o.avatarId + '"' : "") + '><img src="' + UI.escapeHtml(o.avatarImg) + '" alt="รูปโปรไฟล์" loading="lazy" onerror="UI._imgFail(this)" data-fallback="images/no-avatar.png" /></div>'
      : '<div class="ds-user-avatar"' + (o.avatarId ? ' id="' + o.avatarId + '"' : "") + ' role="img" aria-label="รูปโปรไฟล์">' + UI.escapeHtml(o.avatar || "🍽️") + "</div>";
    return (
      '<div class="ds-user-card' + (o.hero ? " hero" : "") + '">' +
      avatar +
      '<div class="ds-user-info">' +
      "<h2" + (o.nameId ? ' id="' + o.nameId + '"' : "") + ">" + UI.escapeHtml(o.name || "—") + "</h2>" +
      (o.subtitle ? "<p" + (o.subtitleId ? ' id="' + o.subtitleId + '"' : "") + ">" + UI.escapeHtml(o.subtitle) + "</p>" : "") +
      badge +
      "</div>" +
      (stats ? '<div class="ds-user-stats">' + stats + "</div>" : "") +
      "</div>"
    );
  };

  /* ============================================================
     3. ActionCard — การ์ดปุ่มเมนูหลัก (icon + title + desc)
     ============================================================ */
  UI.ActionCard = function (o) {
    o = o || {};
    const tone = o.icon && o.icon !== "svg" ? " " + o.icon : "";
    const iconHtml = o.svg ? o.svg : o.icon && o.icon !== "svg" ? UI.escapeHtml(o.icon) : UI.ICONS[o.iconKey || "menu"];
    const attrs = [];
    if (o.id) attrs.push('id="' + o.id + '"');
    (o.data || []).forEach(function (d) { attrs.push('data-' + d.k + '="' + UI.escapeHtml(d.v) + '"'); });
    return (
      '<button type="button" class="ds-action-card" ' + attrs.join(" ") + ">" +
      '<span class="ds-action-icon' + tone + '">' + iconHtml + "</span>" +
      "<b>" + UI.escapeHtml(o.title || "") + "</b>" +
      (o.desc ? "<small>" + UI.escapeHtml(o.desc) + "</small>" : "") +
      "</button>"
    );
  };

  /* ============================================================
     4. Button — primary/secondary/ghost/danger + loading + ripple
     ============================================================ */
  UI.Button = function (o) {
    o = o || {};
    const cls = ["ds-btn", o.variant || "primary", o.size || "", o.block ? "block" : "", o.className || ""].filter(Boolean).join(" ");
    const attrs = [];
    if (o.id) attrs.push('id="' + o.id + '"');
    if (o.type) attrs.push('type="' + o.type + '"');
    if (o.disabled) attrs.push("disabled");
    if (o.data) o.data.forEach(function (d) { attrs.push('data-' + d.k + '="' + UI.escapeHtml(d.v) + '"'); });
    if (o.attrs) Object.keys(o.attrs).forEach(function (k) { attrs.push(k + '="' + UI.escapeHtml(o.attrs[k]) + '"'); });
    const spinner = o.loading ? '<span class="ds-spinner"></span>' : "";
    const icon = !o.loading && o.icon ? '<span class="ds-btn-icon" aria-hidden="true">' + o.icon + "</span>" : "";
    // legacy=true: โครงสร้าง btn-label/btn-spinner เดิม (หน้า auth — setBtnLoading เดิมยังใช้ได้)
    if (o.legacy) {
      return (
        '<button ' + attrs.join(" ") + ' class="' + cls + '">' +
        '<span class="btn-label">' + UI.escapeHtml(o.label || "") + "</span>" +
        '<span class="btn-spinner" aria-hidden="true"></span></button>'
      );
    }
    return (
      '<button ' + attrs.join(" ") + ' class="' + cls + '">' + spinner + icon +
      "<span>" + UI.escapeHtml(o.label || "") + "</span></button>"
    );
  };

  /* ============================================================
     5. Input — ช่องกรอก (icon + focus + error)
     ============================================================ */
  UI.Input = function (o) {
    o = o || {};
    const icon = o.icon ? '<span class="ds-input-icon">' + UI.escapeHtml(o.icon) + "</span>" : "";
    const err = o.error ? '<span class="ds-field-error">' + UI.escapeHtml(o.error) + "</span>" : "";
    const attrs = [];
    if (o.id) attrs.push('id="' + o.id + '"');
    if (o.type) attrs.push('type="' + o.type + '"');
    if (o.placeholder) attrs.push('placeholder="' + UI.escapeHtml(o.placeholder) + '"');
    if (o.value != null) attrs.push('value="' + UI.escapeHtml(o.value) + '"');
    if (o.maxlength) attrs.push("maxlength=\"" + o.maxlength + '"');
    if (o.minlength) attrs.push("minlength=\"" + o.minlength + '"');
    if (o.required) attrs.push("required");
    if (o.disabled) attrs.push("disabled");
    if (o.autocomplete) attrs.push('autocomplete="' + UI.escapeHtml(o.autocomplete) + '"');
    if (o.inputmode) attrs.push('inputmode="' + UI.escapeHtml(o.inputmode) + '"');
    if (o.attrs) Object.keys(o.attrs).forEach(function (k) { attrs.push(k + '="' + UI.escapeHtml(o.attrs[k]) + '"'); });
    const wrapCls = ["ds-input-wrap", o.wrapClass || ""].filter(Boolean).join(" ");
    const fieldCls = ["ds-field", o.fieldClass || ""].filter(Boolean).join(" ");
    const inputCls = ["ds-input", o.className || "", o.icon ? "with-icon" : "", o.error ? "error" : ""].filter(Boolean).join(" ");
    return (
      '<div class="' + fieldCls + '">' +
      (o.label ? "<label" + (o.id ? ' for="' + o.id + '"' : "") + ">" + UI.escapeHtml(o.label) + (o.labelSuffix || "") + "</label>" : "") +
      '<div class="' + wrapCls + '">' + icon +
      '<input ' + attrs.join(" ") + ' class="' + inputCls + '" />' +
      (o.suffix || "") +
      "</div>" + err + "</div>"
    );
  };

  /* ============================================================
     6. BottomNav — แถบเมนูล่าง (4 รายการ) items: [{page,label,iconKey,badge,badgeId}]
     ============================================================ */
  UI.BottomNav = function (o) {
    o = o || {};
    const items = (o.items || [])
      .map(function (it) {
        const badge = it.badge
          ? '<b id="' + (it.badgeId || "") + '" class="ds-nav-badge"' + (it.badgeHidden ? " hidden" : "") + ">" + UI.escapeHtml(it.badge) + "</b>"
          : "";
        return (
          '<button type="button" class="ds-bottom-nav-item' + (it.active ? " active" : "") + '" data-page="' + UI.escapeHtml(it.page) + '">' +
          UI.ICONS[it.iconKey || "home"] + "<span>" + UI.escapeHtml(it.label) + "</span>" + badge +
          "</button>"
        );
      })
      .join("");
    return '<nav class="ds-bottom-nav' + (o.className ? " " + o.className : "") + '" aria-label="เมนูหลัก">' + items + "</nav>";
  };

  /* ============================================================
     7. Modal — กล่องโต้ตอบ (overlay + head + body) ใช้ UI.openModal/closeModal
     ============================================================ */
  UI.Modal = function (o) {
    o = o || {};
    return (
      '<div id="' + (o.id || "ds-modal") + '" class="ds-overlay" hidden role="dialog" aria-modal="true"' +
      (o.ariaLabel ? ' aria-label="' + UI.escapeHtml(o.ariaLabel) + '"' : "") + ">" +
      '<div class="ds-modal' + (o.className ? " " + o.className : "") + '">' +
      '<div class="ds-modal-head"><h2>' + UI.escapeHtml(o.title || "") + "</h2>" +
      '<button type="button" class="ds-modal-close" aria-label="ปิด" onclick="UI.closeModal(\'' + (o.id || "ds-modal") + '\')">✕</button></div>' +
      '<div class="ds-modal-body"' + (o.bodyId ? ' id="' + o.bodyId + '"' : "") + ">" + (o.body || "") + "</div>" +
      "</div></div>"
    );
  };

  /* ============================================================
     8. BottomSheet — แผ่นด้านล่าง (items: [{label,icon,danger,onclick}])
     ============================================================ */
  UI.BottomSheet = function (o) {
    o = o || {};
    const items = (o.items || [])
      .map(function (it) {
        return (
          '<button type="button" class="ds-sheet-item' + (it.danger ? " danger" : "") + '"' +
          (it.id ? ' id="' + it.id + '"' : "") +
          (it.onclick ? ' onclick="' + it.onclick + '"' : "") + ">" +
          (it.icon ? '<span class="ds-sheet-icon">' + UI.escapeHtml(it.icon) + "</span>" : "") +
          "<span>" + UI.escapeHtml(it.label) + "</span></button>"
        );
      })
      .join("");
    return (
      '<div id="' + (o.id || "ds-sheet") + '" class="ds-sheet-overlay" hidden role="dialog" aria-modal="true">' +
      '<div class="ds-bottom-sheet">' +
      '<div class="ds-sheet-grabber"></div>' +
      (o.title ? '<h3 class="ds-sheet-title">' + UI.escapeHtml(o.title) + "</h3>" : "") +
      items +
      "</div></div>"
    );
  };

  /* ============================================================
     9. Loading — spinner + ข้อความ (full = เต็มจอ)
     ============================================================ */
  UI.Loading = function (o) {
    o = o || {};
    return (
      '<div class="ds-loading' + (o.full ? " full" : "") + '"' + (o.id ? ' id="' + o.id + '"' : "") + '>' +
      '<span class="ds-spinner"></span>' +
      (o.text ? "<span>" + UI.escapeHtml(o.text) + "</span>" : "") +
      "</div>"
    );
  };

  /* ============================================================
     10. StatusBadge — ป้ายสถานะ (success/danger/info/rider/warn/muted)
     ============================================================ */
  UI.StatusBadge = function (o) {
    o = o || {};
    return (
      '<span class="ds-badge ' + (o.tone || "muted") + '"' + (o.id ? ' id="' + o.id + '"' : "") + ">" +
      (o.dot !== false ? '<span class="dot"></span>' : "") +
      UI.escapeHtml(o.text || "") + "</span>"
    );
  };

  /* ============================================================
     11. StatisticCard — การ์ดสถิติ (ตัวเลข + ป้าย)
     ============================================================ */
  UI.StatisticCard = function (o) {
    o = o || {};
    return (
      '<div class="ds-stat-card' + (o.tone ? " " + o.tone : "") + '">' +
      "<b" + (o.valueId ? ' id="' + o.valueId + '"' : "") + ">" + UI.escapeHtml(o.value == null ? "0" : o.value) + "</b>" +
      "<span>" + UI.escapeHtml(o.label || "") + "</span></div>"
    );
  };

  /* ============================================================
     12. ระบบรูปภาพ (ภาพจริง + fallback อัตโนมัติ)
     ------------------------------------------------------------
     - ใช้ image URL ได้ทุกที่ (รูปสินค้า/ร้าน/ผู้ใช้)
     - ไม่มีรูป → แสดงภาพ placeholder (images/no-*.png) + อีโมจิซ้อนกลาง
     - รูปโหลดไม่ได้ → สลับเป็น placeholder อัตโนมัติ (ไม่แผลงเป็นกล่องดำ)
     ============================================================ */
  UI._imgFail = function (img) {
    var wrap = img && img.parentNode;
    if (!wrap) return;
    img.remove();
    if (!wrap.querySelector(".ds-img-placeholder")) {
      var fb = document.createElement("img");
      fb.className = "ds-img-placeholder";
      fb.src = wrap.getAttribute("data-fallback") || "images/no-food.png";
      fb.alt = "";
      fb.setAttribute("aria-hidden", "true");
      wrap.appendChild(fb);
    }
    var emo = wrap.getAttribute("data-emoji");
    if (emo && !wrap.querySelector(".ds-img-emoji")) {
      var i = document.createElement("i");
      i.className = "ds-img-emoji";
      i.setAttribute("aria-hidden", "true");
      i.textContent = emo;
      wrap.appendChild(i);
    }
  };

  // บล็อกรูปพร้อม fallback — o: { img, emoji, color, alt, fallback, className }
  UI.imgBlock = function (o) {
    o = o || {};
    var cls = o.className ? " " + o.className : "";
    var alt = UI.escapeHtml(o.alt || "");
    var src = String(o.img || "").trim();
    var fb = o.fallback || "images/no-food.png";
    var style = o.color ? ' style="background:' + o.color + '"' : "";
    var emoji = o.emoji ? ' data-emoji="' + UI.escapeHtml(o.emoji) + '"' : "";
    var img = src
      ? '<img src="' + UI.escapeHtml(src) + '" alt="' + alt + '" loading="lazy" onerror="UI._imgFail(this)" />'
      : '<img class="ds-img-placeholder" src="' + UI.escapeHtml(fb) + '" alt="" aria-hidden="true" />';
    return (
      '<span class="ds-img-block' + cls + '" data-fallback="' + UI.escapeHtml(fb) + '"' + emoji + style + ">" +
      img +
      (emoji && !src ? '<i class="ds-img-emoji" aria-hidden="true">' + UI.escapeHtml(o.emoji) + "</i>" : "") +
      "</span>"
    );
  };

  // seed คงที่ต่อชื่อ → รูป AI เดิมทุกครั้ง (Pollinations — ใช้อยู่แล้วในหน้า admin)
  UI._hashSeed = function (s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };

  // คำอธิบายภาษาอังกฤษของเมนู seed (Pollinations เข้าใจอังกฤษดีกว่าไทย)
  UI._EN_FOOD = {
    "ข้าวผัดปู": "crab fried rice", "ต้มยำกุ้งน้ำข้น": "spicy tom yum shrimp soup", "ผัดไทยกุ้งสด": "pad thai with fresh shrimp",
    "ข้าวกะเพราหมูกรอบ": "thai basil pork belly rice with fried egg", "ส้มตำไทย": "thai papaya salad som tam",
    "ยำวุ้นเส้นหมูสับ": "glass noodle salad with minced pork", "ชามะนาว": "thai lemon tea", "น้ำอัดลม": "cold soda drink with ice",
    "ข้าวเหนียวมะม่วง": "mango sticky rice thai dessert", "พิซซ่ามาร์เกริต้า": "margherita pizza", "พิซซ่าเปปเปอโรนี": "pepperoni pizza",
    "ซีซ่าร์สลัด": "caesar salad with grilled chicken", "ปีกไก่บาร์บีคิว": "barbecue chicken wings", "น้ำอัดลมเย็น": "cold cola soda with ice",
    "บราวนี่ช็อกโกแลต": "chocolate brownie with fudge", "ก๋วยเตี๋ยวเรือเนื้อ": "thai beef boat noodles", "เย็นตาโฟ": "yen ta fo pink noodle soup",
    "บะหมี่เกี๊ยวหมูแดง": "wonton noodles with red roasted pork", "ลูกชิ้นปิ้ง": "grilled thai pork meatball skewers", "โซดามะนาว": "lemon soda drink",
    "เต้าฮวยน้ำขิง": "ginger tofu pudding dessert", "ลาเต้": "cafe latte with latte art", "อเมริกาโน": "americano black coffee",
    "มัทฉะลาเต้": "matcha latte green", "โกโก้เข้มข้น": "hot cocoa chocolate drink", "โทสต์เนยน้ำตาล": "butter sugar toast bread",
    "ชีสเค้ก": "cheesecake slice with berry sauce",
  };
  UI._EN_EMOJI = {
    "🍜": "noodles", "🍕": "pizza", "🍤": "shrimp", "🥗": "salad", "🍗": "chicken", "🧋": "bubble tea", "🥤": "soda",
    "🥭": "mango", "🍰": "cake", "☕": "coffee", "🍵": "green tea", "🍫": "chocolate", "🍳": "fried egg rice", "🥟": "dumplings",
    "🍢": "skewers", "🍲": "soup", "🍝": "pasta", "🦀": "crab dish", "🥢": "thai dish", "🍮": "pudding", "🍞": "toast", "🍋": "lemon",
  };
  // URL รูปอาหาร AI (Pollinations) — ใช้เมื่อไม่มีรูปจริง
  UI.foodImgUrl = function (name, emoji) {
    var key = String(name || "").trim();
    var en = UI._EN_FOOD[key] || (emoji && UI._EN_EMOJI[emoji] ? UI._EN_EMOJI[emoji] : "thai food dish");
    var prompt = "professional food photography of " + en + ", highly appetizing, restaurant menu photo, bright soft lighting, shallow depth of field, clean background, no text";
    var seed = UI._hashSeed(key + en);
    return "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt) + "?width=600&height=450&nologo=true&private=true&seed=" + seed;
  };

  UI._EN_STORE = {
    "ครัวสังขา": "thai street food kitchen", "พิซซ่าคิง": "pizza restaurant", "ก๋วยเตี๋ยวป้าแดง": "noodle shop", "คาเฟ่บัตเตอร์": "cozy cafe bakery",
  };
  // URL รูปหน้าร้าน AI — ใช้เมื่อไม่มีรูปจริง
  UI.storeImgUrl = function (name, cuisine) {
    var key = String(name || "").trim();
    var en = UI._EN_STORE[key] || (String(cuisine || "").trim() || "thai restaurant");
    var prompt = "restaurant storefront of " + en + ", delicious food display, food delivery app cover, vibrant colors, appetizing, no text";
    var seed = UI._hashSeed(key + "store");
    return "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt) + "?width=600&height=450&nologo=true&private=true&seed=" + seed;
  };

  /* ============================================================
     12b. CustomerBottomNav — แถบเมนูล่างฝั่งลูกค้า (6 เมนู)
     items: [{page,label,iconKey,badge,badgeId,badgeHidden,active}] —
     ค่าเริ่มต้น: หน้าแรก/ร้านอาหาร/โปรโมชัน/ออเดอร์/ติดตามส่ง/บัญชี
     ============================================================ */
  UI.CustomerBottomNav = function (o) {
    o = o || {};
    const defaults = [
      { page: "home", label: "หน้าแรก", iconKey: "home" },
      { page: "restaurants", label: "ร้านอาหาร", iconKey: "menu" },
      { page: "promos", label: "โปรโมชัน", iconKey: "promo" },
      { page: "orders", label: "ออเดอร์", iconKey: "orders", badge: o.ordersBadge, badgeId: o.ordersBadgeId, badgeHidden: o.ordersBadgeHidden },
      { page: "tracking", label: "ติดตามส่ง", iconKey: "tracking" },
      { page: "account", label: "บัญชี", iconKey: "profile" },
    ];
    const items = (o.items || defaults).map(function (it, i) {
      return {
        page: it.page,
        label: it.label,
        iconKey: it.iconKey,
        badge: it.badge,
        badgeId: it.badgeId,
        badgeHidden: it.badgeHidden,
        active: o.active ? it.page === o.active : i === 0,
      };
    });
    const inner = items
      .map(function (it) {
        const badge = it.badge != null
          ? '<b id="' + (it.badgeId || "") + '" class="ds-nav-badge"' + (it.badgeHidden ? " hidden" : "") + ">" + UI.escapeHtml(it.badge) + "</b>"
          : "";
        return (
          '<button type="button" class="ds-bottom-nav-item' + (it.active ? " active" : "") + '" data-cust-page="' + UI.escapeHtml(it.page) + '">' +
          (UI.ICONS[it.iconKey] || UI.ICONS.home) + "<span>" + UI.escapeHtml(it.label) + "</span>" + badge +
          "</button>"
        );
      })
      .join("");
    return '<nav class="ds-bottom-nav ds-customer-nav" aria-label="เมนูลูกค้า">' + inner + "</nav>";
  };

  /* ============================================================
     13. FoodCard — การ์ดอาหาร (รูปบน + ชื่อ + รายละเอียด + ราคา + ปุ่มเพิ่มตะกร้า)
     o: { id, img, emoji, color, name, desc, price, btn, btnLabel, data, className }
     ============================================================ */
  UI.FoodCard = function (o) {
    o = o || {};
    var attrs = [];
    if (o.id) attrs.push('id="' + o.id + '"');
    if (o.className) attrs.push('class="' + o.className + '"');
    (o.data || []).forEach(function (d) { attrs.push("data-" + d.k + '="' + UI.escapeHtml(d.v) + '"'); });
    var price = o.price == null ? "" : "฿" + UI.escapeHtml(o.price);
    var btn = o.btn;
    if (!btn) {
      btn =
        '<button type="button" class="ds-btn small food-card-btn btn-add" data-id="' + UI.escapeHtml(o.id) + '">' +
        UI.escapeHtml(o.btnLabel || "เพิ่มลงตะกร้า") + "</button>";
    }
    return (
      '<article class="food-card" ' + attrs.join(" ") + ">" +
      UI.imgBlock({ img: o.img || UI.foodImgUrl(o.name, o.emoji), emoji: o.emoji, color: o.color, alt: o.name, fallback: "images/no-food.png", className: "food-image" }) +
      '<div class="food-card-body">' +
      "<h3 class=\"food-card-name\">" + UI.escapeHtml(o.name) + "</h3>" +
      (o.desc ? '<p class="food-card-desc">' + UI.escapeHtml(o.desc) + "</p>" : "") +
      '<div class="food-card-bottom">' +
      '<span class="food-card-price">' + price + "</span>" + btn +
      "</div></div></article>"
    );
  };

  /* ============================================================
     14. RestaurantCard — การ์ดร้านค้า (รูป + ชื่อ + ★ + เวลา + ระยะ + ปุ่มดูร้าน)
     o: { id, href, img, emoji, color, name, cuisine, rating, reviews, time, distance, isNew, footer, data, className }
     ============================================================ */
  UI.RestaurantCard = function (o) {
    o = o || {};
    var attrs = [];
    if (o.id) attrs.push('id="' + o.id + '"');
    if (o.href) attrs.push('href="' + UI.escapeHtml(o.href) + '"');
    if (o.className) attrs.push('class="' + o.className + '"');
    (o.data || []).forEach(function (d) { attrs.push("data-" + d.k + '="' + UI.escapeHtml(d.v) + '"'); });
    var meta = [];
    if (o.rating != null) meta.push('<span class="restaurant-card-rating">★ ' + UI.escapeHtml(o.rating) + "</span>");
    if (o.time) meta.push('<span class="restaurant-card-time">⏱ ' + UI.escapeHtml(o.time) + "</span>");
    if (o.distance) meta.push('<span class="restaurant-card-distance">📍 ' + UI.escapeHtml(o.distance) + "</span>");
    var footer = o.footer
      ? '<div class="restaurant-card-footer">' + o.footer + "</div>"
      : o.cta
        ? '<div class="restaurant-card-footer"><button type="button" class="ds-btn small">' + UI.escapeHtml(o.cta) + "</button></div>"
        : "";
    return (
      '<article class="restaurant-card" ' + attrs.join(" ") + ">" +
      UI.imgBlock({ img: o.img || UI.storeImgUrl(o.name, o.cuisine), emoji: o.emoji, color: o.color, alt: o.name, fallback: "images/no-store.png", className: "restaurant-image" }) +
      '<div class="restaurant-card-body">' +
      "<h3 class=\"restaurant-card-name\">" + UI.escapeHtml(o.name) +
      (o.isNew ? '<span class="restaurant-card-new">ใหม่</span>' : "") + "</h3>" +
      (o.cuisine ? '<p class="restaurant-card-cuisine">' + UI.escapeHtml(o.cuisine) + "</p>" : "") +
      (meta.length ? '<div class="restaurant-card-meta">' + meta.join("") + "</div>" : "") +
      footer +
      "</div></article>"
    );
  };

  /* ============================================================
     15. MenuCard — การ์ดเมนูกะทัดรัด (รูป + ชื่อ + ราคา + ปุ่ม +)
     o: { id, img, emoji, color, name, price, data, className }
     ============================================================ */
  UI.MenuCard = function (o) {
    o = o || {};
    var attrs = [];
    if (o.id) attrs.push('id="' + o.id + '"');
    if (o.className) attrs.push('class="' + o.className + '"');
    (o.data || []).forEach(function (d) { attrs.push("data-" + d.k + '="' + UI.escapeHtml(d.v) + '"'); });
    return (
      '<article class="menu-card" ' + attrs.join(" ") + ">" +
      UI.imgBlock({ img: o.img || UI.foodImgUrl(o.name, o.emoji), emoji: o.emoji, color: o.color, alt: o.name, fallback: "images/no-food.png", className: "menu-card-img" }) +
      '<div class="menu-card-body">' +
      "<h4 class=\"menu-card-name\">" + UI.escapeHtml(o.name) + "</h4>" +
      '<span class="menu-card-price">฿' + UI.escapeHtml(o.price) + "</span>" +
      "</div>" +
      '<button type="button" class="menu-card-add btn-add" data-id="' + UI.escapeHtml(o.id) + '" aria-label="เพิ่ม ' + UI.escapeHtml(o.name) + '">＋</button>' +
      "</article>"
    );
  };

  // ---------- init ----------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { UI.initRipple(); });
  } else {
    UI.initRipple();
  }
})();
