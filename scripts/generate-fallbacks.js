/* ============================================================
   generate-fallbacks.js — วาด PNG fallback (no-food / no-store /
   no-avatar) ด้วย Node ล้วน (zlib ในตัว — ไม่ต้องพึ่ง canvas/ffmpeg)
   รัน: node scripts/generate-fallbacks.js
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT = path.join(__dirname, "..", "images");
fs.mkdirSync(OUT, { recursive: true });
const SIZE = 128;

/* ---------- PNG encoder (RGBA, 8-bit) ---------- */
let crcTable = null;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function writePng(file, px) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // scanlines (filter byte 0 ต่อหน้า)
  const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
  for (let y = 0; y < SIZE; y++) {
    raw[y * (SIZE * 4 + 1)] = 0;
    px.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  console.log("✓", path.relative(process.cwd(), file), "(" + png.length + " bytes)");
}

/* ---------- เครื่องมือวาด (บน buffer RGBA) ---------- */
function canvas() {
  return Buffer.alloc(SIZE * SIZE * 4); // transparent
}
function setPx(px, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a == null ? 255 : a;
}
function fillRect(px, x0, y0, x1, y1, c) {
  for (let y = Math.max(0, y0); y <= Math.min(SIZE - 1, y1); y++)
    for (let x = Math.max(0, x0); x <= Math.min(SIZE - 1, x1); x++) setPx(px, x, y, c);
}
function fillCircle(px, cx, cy, r, c) {
  for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(SIZE - 1, Math.ceil(cy + r)); y++)
    for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(SIZE - 1, Math.ceil(cx + r)); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r * r) setPx(px, x, y, c);
    }
}
function ring(px, cx, cy, r, w, c) {
  for (let y = Math.max(0, Math.floor(cy - r - 1)); y <= Math.min(SIZE - 1, Math.ceil(cy + r + 1)); y++)
    for (let x = Math.max(0, Math.floor(cx - r - 1)); x <= Math.min(SIZE - 1, Math.ceil(cx + r + 1)); x++) {
      const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      if (d >= r - w && d <= r) setPx(px, x, y, c);
    }
}
// ครึ่งวงกลม (ไหล่ของคน)
function fillHalfCircle(px, cx, cy, r, c, cutY) {
  for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(SIZE - 1, Math.ceil(cy + r)); y++)
    for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(SIZE - 1, Math.ceil(cx + r)); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r * r && y >= cutY) setPx(px, x, y, c);
    }
}

/* ---------- 1) no-food.png — จานอาหาร ---------- */
(function () {
  const px = canvas();
  fillRect(px, 0, 0, SIZE - 1, SIZE - 1, [253, 241, 227, 255]); // ครีม
  // จาน
  fillCircle(px, 64, 66, 44, [255, 255, 255, 255]);
  ring(px, 64, 66, 44, 5, [255, 214, 166, 255]);
  ring(px, 64, 66, 34, 2.5, [255, 226, 190, 255]);
  // อาหาร 3 จุด
  fillCircle(px, 52, 58, 7, [255, 159, 92, 255]);
  fillCircle(px, 72, 52, 6, [255, 116, 92, 255]);
  fillCircle(px, 64, 74, 6, [166, 208, 122, 255]);
  // ไอน้ำ
  for (const [sx, sy] of [[48, 30], [64, 22], [80, 30]]) {
    fillCircle(px, sx, sy, 3, [233, 214, 190, 200]);
    fillCircle(px, sx + 4, sy - 4, 2, [233, 214, 190, 180]);
  }
  writePng(path.join(OUT, "no-food.png"), px);
})();

/* ---------- 2) no-store.png — หน้าร้าน ---------- */
(function () {
  const px = canvas();
  fillRect(px, 0, 0, SIZE - 1, SIZE - 1, [255, 241, 232, 255]); // สีพีชอ่อน
  // ตัวร้าน
  fillRect(px, 18, 44, 109, 108, [255, 255, 255, 255]);
  // หลังคากันสาด (ลายทาง)
  const stripe = [[255, 133, 67, 255], [255, 255, 255, 255], [255, 133, 67, 255], [255, 255, 255, 255], [255, 133, 67, 255], [255, 255, 255, 255], [255, 133, 67, 255]];
  stripe.forEach((c, i) => fillRect(px, 18 + i * 13, 40, 18 + i * 13 + 12, 56, c));
  // ชายคา
  fillRect(px, 12, 56, 115, 64, [255, 214, 166, 255]);
  // ประตู
  fillRect(px, 55, 74, 86, 108, [255, 232, 205, 255]);
  fillCircle(px, 80, 91, 2.2, [200, 140, 90, 255]);
  // หน้าต่างสองบาน
  fillRect(px, 26, 72, 46, 92, [214, 236, 250, 255]);
  fillRect(px, 95, 72, 115, 92, [214, 236, 250, 255]);
  // ไฟหน้าร้าน
  fillCircle(px, 64, 100, 3, [255, 92, 26, 255]);
  writePng(path.join(OUT, "no-store.png"), px);
})();

/* ---------- 3) no-avatar.png — คน (ไรเดอร์/ลูกค้า) ---------- */
(function () {
  const px = canvas();
  fillRect(px, 0, 0, SIZE - 1, SIZE - 1, [240, 233, 253, 255]); // ม่วงอ่อน
  fillCircle(px, 64, 48, 22, [196, 181, 226, 255]); // หัว
  fillHalfCircle(px, 64, 118, 42, [196, 181, 226, 255], 84); // ไหล่
  writePng(path.join(OUT, "no-avatar.png"), px);
})();

console.log("เสร็จ — ไฟล์อยู่ใน images/");
