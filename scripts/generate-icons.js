// ===== generate-icons.js =====
// สร้างไอคอนแอป/โลโก้ (PNG) สำหรับ Add to Home Screen โดยไม่พึ่ง dependency ภายนอก
// รัน: node scripts/generate-icons.js
// เอาต์พุต: icon-512.png, icon-192.png, icon-180.png (apple-touch-icon), icon-48.png, favicon-32.png, favicon-16.png
// ใช้ built-in zlib เขียน PNG encoder ขนาดเล็กเอง

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
  // พิกัด logical (-50..50) -> supersample (0..N)
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
  // เส้นหนา (รัศมีครึ่งความหนา) ระหว่าง 2 จุด logical
  line(x0, y0, x1, y1, thickness, a) {
    const r = thickness / 2;
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * this.SS);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.circle(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, a);
    }
  }
  // สี่เหลี่ยมมุมมน
  roundRect(x0, y0, x1, y1, rad, a) {
    const cx0 = x0 + rad, cy0 = y0 + rad, cx1 = x1 - rad, cy1 = y1 - rad;
    this.fill(x0, y0, x1, y1, a);
    // ลบมุม 4 จุด
    this.circle(cx0, cy0, rad, 0); // จะทับด้วย alpha=0 ไม่ได้ — ใช้วิธีลบทีหลังแทน
    this.circle(cx1, cy0, rad, 0);
    this.circle(cx0, cy1, rad, 0);
    this.circle(cx1, cy1, rad, 0);
    // วิธี: ลบ = ลด alpha ที่มุม ใช้ helper ลบจริง (แก้ด้านล่าง)
  }
  // downsample จาก supersample กลับเป็นขนาดจริง (เฉลี่ย SS x SS)
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

// ลบมุม: ลด alpha ณ จุด (ใช้หลังวาดทั้งสี่เหลี่ยม)
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

// ---------- ดีไซน์โลโก้: กระเป๋าเดลิเวอรี + รถไรเดอร์ ----------
// พิกัดคิดในระบบ logical หน่วย = 1 โดย size = ขนาดพิกเซล (เช่น 512) -> ระยะ = size/100
function drawIcon(size) {
  const bgc = new Canvas(size);       // พื้นหลัง gradient
  const fg = new Canvas(size);        // เนื้อขาว (mask)
  const u = size / 100; // 1 หน่วย = size/100 px

  // --- พื้นหลัง: สี่เหลี่ยมมุมมนไล่สีส้ม→แดง (แนวทแยง) ---
  const bg = [255, 122, 26];   // #FF7A1A (มุมซ้ายบน)
  const bg2 = [255, 61, 44];   // #FF3D2C (มุมขวาล่าง)
  roundedRect(bgc, -50, -50, 50, 50, 22, 1);

  // --- เส้นทางวิ่ง (เส้นประโค้ง) ด้านล่าง ---
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

  // --- รถไรเดอร์ (สกู๊ตเตอร์) + กระเป๋า สีขาว ---
  fg.circle(-16, 22, 7.5, 1);   // ล้อหลัง
  fg.circle(20, 22, 7.5, 1);    // ล้อหน้า
  // เจาะรูกลางล้อ (เห็นพื้นหลัง)
  punchCircle(fg, -16, 22, 3.2);
  punchCircle(fg, 20, 22, 3.2);
  fg.line(-16, 12, 20, 12, 4.5, 1);      // แคร่
  fg.line(20, 12, 20, 18, 4.5, 1);       // ขาตั้งหน้า
  fg.line(-16, 12, -16, 18, 4.5, 1);     // ขาตั้งหลัง
  fg.line(-16, 8, -28, 4, 4, 1);         // คันชักไปแฮนด์
  fg.line(-28, 4, -28, 10, 4, 1);        // แฮนด์ตั้ง
  fg.line(-31, 4, -25, 4, 3.5, 1);       // แฮนด์คัน
  fg.line(-10, 12, -10, 4, 4.5, 1);      // เบาะตั้ง
  fg.line(-10, 2, -2, 2, 5, 1);          // เบาะนั่ง
  fg.line(2, 4, 10, 4, 4, 1);            // เบาะหลังเล็ก

  // --- กระเป๋าเดลิเวอรี (กล่องหลังรถ) ---
  roundedRect(fg, -4, -22, 30, -4, 5, 1);            // กล่องหลัก
  roundedRect(fg, -8, -18, -2, -8, 3, 1);            // หูกระเป๋าด้านหน้า
  fg.line(13, -22, 13, -4, 2, 0.9);                  // เส้นแบ่งฝากล่อง
  roundedRect(fg, -1, -18, 8, -11, 2.5, 0.95);       // แผ่นป้าย
  fg.line(-0.5, -16.2, 6, -16.2, 1.6, 1);            // ตัว Z
  fg.line(-0.5, -16.2, 6, -12.8, 1.6, 1);
  fg.line(-0.5, -12.8, 6, -12.8, 1.6, 1);

  // --- จุดตกแต่งมุม (เล็ก ๆ เบา ๆ) ---
  fg.circle(-36, -16, 2.2, 0.9);
  fg.circle(36, -16, 2.2, 0.9);

  // --- รวมชั้น: bg gradient + fg สีขาว (blend ตาม fgA) ---
  const N = bgc.N;
  const buf = Buffer.alloc(N * N * 4);
  const WHITE = [255, 255, 255];
  for (let i = 0; i < N * N; i++) {
    const t = Math.max(0, Math.min(1, ((i % N) / N + Math.floor(i / N) / N) / 2)); // แนวทแยง
    const fgA = fg.px[i];
    const bgA = bgc.px[i];
    const gR = bg[0] + (bg2[0] - bg[0]) * t;
    const gG = bg[1] + (bg2[1] - bg[1]) * t;
    const gB = bg[2] + (bg2[2] - bg[2]) * t;
    // ผสมสี gradient กับขาวตาม fgA (สีขาวโปร่งแสงบางจุด -> blend)
    const a = bgA;
    buf[i * 4] = Math.round((gR * (1 - fgA) + WHITE[0] * fgA));
    buf[i * 4 + 1] = Math.round((gG * (1 - fgA) + WHITE[1] * fgA));
    buf[i * 4 + 2] = Math.round((gB * (1 - fgA) + WHITE[2] * fgA));
    buf[i * 4 + 3] = Math.round(a * 255);
  }

  // downsample NxN -> size x size
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
        out[oo] = bg[0]; out[oo + 1] = bg[1]; out[oo + 2] = bg[2];
      }
      out[oo + 3] = Math.round((a / n) * 255);
    }
  return encodePNG(size, size, out);
}

// ---------- เขียนไฟล์ ----------
const root = path.join(__dirname, "..");
const targets = [
  ["icon-512.png", 512],
  ["icon-192.png", 192],
  ["icon-180.png", 180], // apple-touch-icon
  ["icon-48.png", 48],
  ["favicon-32.png", 32],
  ["favicon-16.png", 16],
];
for (const [name, size] of targets) {
  const png = drawIcon(size);
  fs.writeFileSync(path.join(root, name), png);
  console.log(`✓ ${name} (${size}x${size}) — ${png.length} bytes`);
}

// สร้าง favicon.ico (รวม 16 + 32) — ใช้ PNG ฝังแบบ ICO
function makeIco(png16, png32) {
  const entries = [
    { w: 16, h: 16, data: png16 },
    { w: 32, h: 32, data: png32 },
  ];
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type icon
  header.writeUInt16LE(entries.length, 4);
  const dirs = [];
  let offset = 6 + 16 * entries.length;
  for (const e of entries) {
    const d = Buffer.alloc(16);
    d[0] = e.w >= 256 ? 0 : e.w;
    d[1] = e.h >= 256 ? 0 : e.h;
    d[2] = 0; d[3] = 0;               // palette
    d.writeUInt16LE(1, 4);            // planes
    d.writeUInt16LE(32, 6);           // bpp
    d.writeUInt32LE(e.data.length, 8);
    d.writeUInt32LE(offset, 12);
    dirs.push(d);
    offset += e.data.length;
  }
  return Buffer.concat([header, ...dirs, ...entries.map((e) => e.data)]);
}
const ico = makeIco(drawIcon(16), drawIcon(32));
fs.writeFileSync(path.join(root, "favicon.ico"), ico);
console.log(`✓ favicon.ico — ${ico.length} bytes`);
console.log("เสร็จครบทุกขนาด ✅");
