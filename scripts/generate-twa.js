// ===== generate-twa.js =====
// สร้างโปรเจกต์ TWA (Android) ทั้ง 4 แอป ผ่าน @bubblewrap/core โดยตรง
// (ข้าม prompt ของ `bubblewrap init` — ตั้งค่าทุกช่องไว้ในสคริปต์นี้แล้ว)
// รัน: node scripts/generate-twa.js
// ต้องการ: Java JDK 17 + Android SDK + keystore ใน apk/<app>/android-keystore
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// @bubblewrap/core จากที่ bubblewrap CLI ติดตั้ง (global npm)
const CORE = require("C:/Users/Administrator/AppData/Roaming/npm/node_modules/@bubblewrap/cli/node_modules/@bubblewrap/core/dist/index.js");

const ROOT = path.resolve(__dirname, "..");
const HOST = "zapnowapp.github.io";
const BASE = `https://${HOST}/ZapNow/`;

const APPS = [
  {
    id: "customer",
    dir: "apk/customer",
    packageId: "com.zapnowapp.customer",
    name: "ZapNow — สั่งอาหารเดลิเวอรี",
    launcherName: "ZapNow",
    startUrl: "/ZapNow/index.html",
    themeColor: "#FF7A1A",
    backgroundColor: "#FFF7EF",
  },
  {
    id: "partner",
    dir: "apk/partner",
    packageId: "com.zapnowapp.partner",
    name: "Sangkha Partner — หลังร้าน",
    launcherName: "Partner",
    startUrl: "/ZapNow/login.html",
    themeColor: "#E11D48",
    backgroundColor: "#FFF7EF",
  },
  {
    id: "rider",
    dir: "apk/rider",
    packageId: "com.zapnowapp.rider",
    name: "Sangkha Rider — รับงานส่งอาหาร",
    launcherName: "Rider",
    startUrl: "/ZapNow/rider.html",
    themeColor: "#7C3AED",
    backgroundColor: "#F5F3FF",
  },
  {
    id: "admin",
    dir: "apk/admin",
    packageId: "com.zapnowapp.admin",
    name: "ZapNow Admin — จัดการระบบ",
    launcherName: "Admin",
    startUrl: "/ZapNow/admin.html",
    themeColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
];

function computeChecksum(data) {
  return crypto.createHash("sha1").update(data).digest("hex");
}

async function main() {
  for (const app of APPS) {
    const target = path.join(ROOT, app.dir);
    if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });

    const keystore = path.join(target, "android-keystore");
    if (!fs.existsSync(keystore)) {
      console.log(`✗ ${app.id}: ไม่พบ keystore — สร้างก่อนด้วย keytool`);
      process.exit(1);
    }

    const data = {
      packageId: app.packageId,
      host: HOST,
      name: app.name,
      launcherName: app.launcherName,
      display: "standalone",
      themeColor: app.themeColor,
      backgroundColor: app.backgroundColor,
      startUrl: app.startUrl,
      iconUrl: BASE + `icon-${app.id}-512.png`,
      maskableIconUrl: undefined,
      monochromeIconUrl: undefined,
      appVersion: "1.0",
      signingKey: { path: keystore, alias: "android" },
      splashScreenFadeOutDuration: 300,
      enableNotifications: true,
      shortcuts: [],
      webManifestUrl: BASE + `manifest-${app.id}.json`,
      features: {},
      orientation: "portrait",
    };

    const twaManifest = new CORE.TwaManifest(data);
    const manifestFile = path.join(target, "twa-manifest.json");
    await twaManifest.saveToFile(manifestFile);

    const twaGenerator = new CORE.TwaGenerator();
    const log = new CORE.BufferedLog(new CORE.ConsoleLog(`Generating TWA ${app.id}`));
    await twaGenerator.createTwaProject(target, twaManifest, log, () => {});

    const checksum = computeChecksum(await fs.promises.readFile(manifestFile));
    await fs.promises.writeFile(path.join(target, "manifest-checksum.txt"), checksum);

    console.log(`✓ ${app.id}: ${app.packageId} → ${target} (checksum ${checksum.slice(0, 8)}…)`);
  }
  console.log("เสร็จครบ 4 โปรเจกต์ TWA ✅");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
