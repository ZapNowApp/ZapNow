// ===== generate-app-icons.js =====
// สร้างไอคอนแอป 4 ชุด (ลูกค้า / ร้านค้า / ไรเดอร์ / แอดมิน) สำหรับ PWA Add to Home Screen
// รัน: node scripts/generate-app-icons.js
// เอาต์พุต: icon-<app>-512.png, icon-<app>-192.png, icon-<app>-180.png (apple-touch-icon), icon-<app>-48.png
// ใช้ built-in zlib เขียน PNG encoder ขนาดเล็กเอง (ไม่มี dependency)

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ---------- PNG encoder ขนาดเล็ก ----------
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter None
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- Canvas แบบ supersample (กันขอบหยัก) ----------
class Canvas {
  constructor(size) {
    this.s = size;             // logical size
    this.SS = size >= 256 ? 4 : 8; // supersample factor
    this.N = size * this.SS;
    this.px = new Float64Array(this.N * this.N); // alpha 0..1
  }
  L(x) { return ((x + 50) / 100) * this.N; }
  fill(x0, y0, x1, y1, a) {
    const X0 = Math.max(0, Math.round(this.L(x0))), Y0 = Math.max(0, Math.round(this.L(y0)));
    const X1 = Math.min(this.N, Math.round(this.L(x1))), Y1 = Math.min(this.N, Math.round(this.L(y1)));
    for (let y = Y0; y < Y1; y++)
      for (let x = X0; x < X1; x++)
        this.px[y * this.N + x] = Math.min(1, this.px[y * this.N + x] + a);
  }
  circle(cx, cy, r, a) {
    const X0 = Math.max(0, Math.round(this.L(cx - r))), Y0 = Math.max(0, Math.round(this.L(cy - r)));
    const X1 = Math.min(this.N, Math.round(this.L(cx + r))), Y1 = Math.min(this.N, Math.round(this.L(cy + r)));
    const R = r * this.SS, CX = this.L(cx), CY = this.L(cy);
    for (let y = Y0; y < Y1; y++)
      for (let x = X0; x < X1; x++) {
        const d = Math.hypot(x - CX, y - CY);
        if (d <= R) this.px[y * this.N + x] = Math.min(1, this.px[y * this.N + x] + a);
      }
  }
  line(x0, y0, x1, y1, thickness, a) {
    const r = thickness / 2;
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * this.SS);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.circle(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, a);
    }
  }
  toBuffer(bg) {
    const s = this.s, SS = this.SS;
    const out = Buffer.alloc(s * s * 4);
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        let sum = 0;
        for (let j = 0; j < SS; j++)
          for (let i = 0; i < SS; i++) sum += this.px[(y * SS + j) * this.N + (x * SS + i)];
        const a = sum / (SS * SS);
        const o = (y * s + x) * 4;
        out[o] = bg[0]; out[o + 1] = bg[1]; out[o + 2] = bg[2]; out[o + 3] = Math.round(a * 255);
      }
    return out;
  }
}
function punchCircle(c, cx, cy, r) {
  const X0 = Math.max(0, Math.round(c.L(cx - r))), Y0 = Math.max(0, Math.round(c.L(cy - r)));
  const X1 = Math.min(c.N, Math.round(c.L(cx + r))), Y1 = Math.min(c.N, Math.round(c.L(cy + r)));
  const R = r * c.SS, CX = c.L(cx), CY = c.L(cy);
  for (let y = Y0; y < Y1; y++)
    for (let x = X0; x < X1; x++) {
      if (Math.hypot(x - CX, y - CY) <= R) c.px[y * c.N + x] = 0;
    }
}
function roundedRect(c, x0, y0, x1, y1, rad, a) {
  c.fill(x0, y0, x1, y1, a);
  const cx0 = x0 + rad, cy0 = y0 + rad, cx1 = x1 - rad, cy1 = y1 - rad;
  punchCircle(c, cx0, cy0, rad);
  punchCircle(c, cx1, cy0, rad);
  punchCircle(c, cx0, cy1, rad);
  punchCircle(c, cx1, cy1, rad);
}

// ---------- ดีไซน์ 4 โลโก้ (วาดเป็นสีขาวบนพื้น gradient) ----------

// ลูกค้า: กระเป๋าเดลิเวอรี + รถไรเดอร์ (โลโก้หลักของแบรนด์)
function glyphCustomer(fg) {
  // เส้นทางวิ่ง (เส้นประโค้ง) ด้านล่าง
  const pathPts = [];
  for (let t = 0; t <= 1; t += 0.02) {
    const x = -38 + 76 * t;
    const y = 32 - Math.sin(t * Math.PI) * 6;
    pathPts.push([x, y]);
  }
  for (let i = 0; i < pathPts.length - 1; i++) {
    if (i % 3 === 0) continue; // เส้นประ
    fg.line(pathPts[i][0], pathPts[i][1], pathPts[i + 1][0], pathPts[i + 1][1], 2.2, 1);
  }
  fg.circle(-38, 32, 3.4, 1);
  fg.circle(38, 32, 3.4, 1);
  // รถไรเดอร์ (สกู๊ตเตอร์) + กระเป๋า
  fg.circle(-16, 22, 7.5, 1);
  fg.circle(20, 22, 7.5, 1);
  punchCircle(fg, -16, 22, 3.2);
  punchCircle(fg, 20, 22, 3.2);
  fg.line(-16, 12, 20, 12, 4.5, 1);
  fg.line(20, 12, 20, 18, 4.5, 1);
  fg.line(-16, 12, -16, 18, 4.5, 1);
  fg.line(-16, 8, -28, 4, 4, 1);
  fg.line(-28, 4, -28, 10, 4, 1);
  fg.line(-31, 4, -25, 4, 3.5, 1);
  fg.line(-10, 12, -10, 4, 4.5, 1);
  fg.line(-10, 2, -2, 2, 5, 1);
  fg.line(2, 4, 10, 4, 4, 1);
  // กระเป๋าเดลิเวอรี
  roundedRect(fg, -4, -22, 30, -4, 5, 1);
  roundedRect(fg, -8, -18, -2, -8, 3, 1);
  fg.line(13, -22, 13, -4, 2, 0.9);
  roundedRect(fg, -1, -18, 8, -11, 2.5, 0.95);
  fg.line(-0.5, -16.2, 6, -16.2, 1.6, 1); // ตัว Z
  fg.line(-0.5, -16.2, 6, -12.8, 1.6, 1);
  fg.line(-0.5, -12.8, 6, -12.8, 1.6, 1);
  fg.circle(-36, -16, 2.2, 0.9);
  fg.circle(36, -16, 2.2, 0.9);
}

// ร้านค้า: หน้าร้าน (เพิง/หลังคาจีบ + ประตู + หน้าต่าง)
function glyphPartner(fg) {
  // หลังคาจีบ (awning)
  roundedRect(fg, -42, -36, 42, -22, 6, 1);
  for (let i = -5; i <= 5; i++) fg.circle(i * 7, -22, 4.2, 1); // จีบหยักใต้หลังคา
  for (let i = -5; i <= 4; i++) punchCircle(fg, i * 7 + 3.5, -22, 2.4); // เจาะร่องระหว่างจีบ
  // หน้าต่างสองข้าง
  roundedRect(fg, -36, -14, -20, 0, 3, 1);
  roundedRect(fg, 20, -14, 36, 0, 3, 1);
  // ประตู
  roundedRect(fg, -13, -10, 13, 36, 4, 1);
  punchCircle(fg, 0, -3, 4.2);       // กระจกกลมบนประตู
  punchCircle(fg, 8, 12, 1.7);       // ลูกบิด
}

// ไรเดอร์: สกู๊ตเตอร์ + หมวกกันน็อก (คนขี่) — ต่างจากลูกค้าที่เป็นสกู๊ตเตอร์+กระเป๋า
function glyphRider(fg) {
  // ล้อ
  fg.circle(-16, 26, 9, 1);
  fg.circle(22, 26, 9, 1);
  punchCircle(fg, -16, 26, 4);
  punchCircle(fg, 22, 26, 4);
  // แคร่ + ขาตั้ง
  fg.line(-16, 14, 22, 14, 5, 1);
  fg.line(22, 14, 22, 20, 5, 1);
  fg.line(-16, 14, -16, 20, 5, 1);
  // คันชัก + แฮนด์
  fg.line(-16, 10, -28, 4, 4.5, 1);
  fg.line(-28, 4, -28, 11, 4.5, 1);
  fg.line(-32, 4, -24, 4, 4, 1);
  // เบาะนั่ง
  fg.line(-10, 14, -10, 5, 5, 1);
  fg.line(-10, 3, -1, 3, 5.5, 1);
  // หมวกกันน็อกค้างที่แฮนด์ (โดม + กระบัง)
  fg.circle(-38, -8, 8, 1);
  fg.line(-43, -8, -33, -8, 2.6, 1);
  fg.line(-42, -13, -34, -13, 2.6, 1);
  // เส้นความเร็ว
  fg.line(-44, 20, -36, 20, 2.4, 0.9);
  fg.line(-44, 26, -40, 26, 2.4, 0.9);
}

// แอดมิน: โล่ + เครื่องหมายถูก
function glyphAdmin(fg) {
  roundedRect(fg, -32, -40, 32, 12, 12, 1);
  fg.line(32, 12, 0, 40, 8, 1);
  fg.line(-32, 12, 0, 40, 8, 1);
  // เครื่องหมายถูก
  fg.line(-15, -4, -5, 7, 4.2, 1);
  fg.line(-5, 7, 18, -16, 4.2, 1);
}

// ---------- วาดไอคอนรวม ----------
function drawIcon(size, gradTop, gradBottom, glyphFn) {
  const bgc = new Canvas(size);
  const fg = new Canvas(size);
  roundedRect(bgc, -50, -50, 50, 50, 22, 1);
  glyphFn(fg);

  const N = bgc.N;
  const buf = Buffer.alloc(N * N * 4);
  for (let i = 0; i < N * N; i++) {
    const t = Math.max(0, Math.min(1, ((i % N) / N + Math.floor(i / N) / N) / 2)); // แนวทแยง
    const fgA = fg.px[i];
    const bgA = bgc.px[i];
    const gR = gradTop[0] + (gradBottom[0] - gradTop[0]) * t;
    const gG = gradTop[1] + (gradBottom[1] - gradTop[1]) * t;
    const gB = gradTop[2] + (gradBottom[2] - gradTop[2]) * t;
    const a = bgA;
    buf[i * 4] = Math.round(gR * (1 - fgA) + 255 * fgA);
    buf[i * 4 + 1] = Math.round(gG * (1 - fgA) + 255 * fgA);
    buf[i * 4 + 2] = Math.round(gB * (1 - fgA) + 255 * fgA);
    buf[i * 4 + 3] = Math.round(a * 255);
  }

  const SS = bgc.SS, s = size;
  const out = Buffer.alloc(s * s * 4);
  for (let y = 0; y < s; y++)
    for (let x = 0; x < s; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let j = 0; j < SS; j++)
        for (let i = 0; i < SS; i++) {
          const o = ((y * SS + j) * N + (x * SS + i)) * 4;
          const aa = buf[o + 3] / 255;
          r += buf[o] * aa; g += buf[o + 1] * aa; b += buf[o + 2] * aa; a += aa;
        }
      const n = SS * SS;
      const oo = (y * s + x) * 4;
      if (a > 0) {
        out[oo] = Math.round(r / a); out[oo + 1] = Math.round(g / a); out[oo + 2] = Math.round(b / a);
      } else {
        out[oo] = gradTop[0]; out[oo + 1] = gradTop[1]; out[oo + 2] = gradTop[2];
      }
      out[oo + 3] = Math.round((a / n) * 255);
    }
  return encodePNG(size, size, out);
}

// ---------- เขียนไฟล์ ----------
const root = path.join(__dirname, "..");
const APPS = [
  { id: "customer", name: "ลูกค้า",   top: [255, 122, 26], bottom: [255, 61, 44],  glyph: glyphCustomer }, // #FF7A1A → #FF3D2C
  { id: "partner",  name: "ร้านค้า",  top: [244, 63, 94],  bottom: [190, 18, 60],  glyph: glyphPartner  }, // #F43F5E → #BE123C
  { id: "rider",    name: "ไรเดอร์",  top: [139, 92, 246], bottom: [109, 40, 217], glyph: glyphRider    }, // #8B5CF6 → #6D28D9
  { id: "admin",    name: "แอดมิน",  top: [14, 165, 233], bottom: [37, 99, 235],  glyph: glyphAdmin    }, // #0EA5E9 → #2563EB
];

for (const app of APPS) {
  for (const size of [512, 192, 180, 48]) {
    const name = `icon-${app.id}-${size}.png`;
    const png = drawIcon(size, app.top, app.bottom, app.glyph);
    fs.writeFileSync(path.join(root, name), png);
    console.log(`✓ ${name} (${size}x${size}) — ${png.length} bytes`);
  }
  console.log(`  → ไอคอนแอป ${app.name} (${app.id}) เสร็จ`);
}
console.log("เสร็จครบ 4 แอป ✅");
