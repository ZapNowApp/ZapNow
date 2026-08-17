/* ⚙️ Firebase ตัวอย่าง: ตั้งค่าที่นี่เพื่อให้ออเดอร์เก็บใน Firestore + dashboard ฟังสดข้ามเครื่อง (onSnapshot)
 *
 * ขั้นตอน (ครั้งแรก ~5 นาที):
 *   1) ไปที่ https://console.firebase.google.com → "สร้างโปรเจกต์" (ชื่ออะไรก็ได้ เช่น sangkha-demo)
 *   2) ในโปรเจกต์ → ไอคอน "เว็บ" (</>) → ตั้งชื่อแอป (เช่น "web") → จดค่า config ที่ได้
 *   3) ไปที่เมนู "Firestore Database" → "สร้างฐานข้อมูล" → โหมดทดสอบ (test mode 30 วัน)
 *   4) เอา config ที่จดไว้วางแทนค่าใน FIREBASE_CONFIG ด้านล่าง (apiKey ต้องไม่ใช่ตัว placeholder)
 *
 * ถ้ายังไม่ตั้งค่า → แอปทำงานโหมดท้องถิ่น (localStorage) เหมือนเดิมทุกอย่าง ไม่มีผลอะไร
 */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyA332AFsF6F5urpOR4uLqawXD6WU7cikpM",
  authDomain: "zapnowapp.firebaseapp.com",
  projectId: "zapnowapp",
  storageBucket: "zapnowapp.firebasestorage.app",
  messagingSenderId: "14392951654",
  appId: "1:14392951654:web:06e1c1ffa28c4ca8f43ea7",
};

// ระบบตรวจอัตโนมัติ: คอนฟิกครบ + apiKey ไม่ใช่ตัว placeholder = พร้อมใช้ Firebase
window.FIREBASE_CONFIGURED = !!(
  window.FIREBASE_CONFIG &&
  window.FIREBASE_CONFIG.projectId &&
  window.FIREBASE_CONFIG.apiKey &&
  !String(window.FIREBASE_CONFIG.apiKey).startsWith("AIza...") &&
  window.FIREBASE_CONFIG.apiKey !== "your-project-id"
);
