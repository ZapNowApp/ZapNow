/* 🔥 Firebase: ชั้นเชื่อมกลางสำหรับทุกหน้า (App + Auth + Firestore)
 *
 * - โหลด Firebase SDK (compat) จาก CDN — ไม่ต้องติดตั้ง/build อะไร
 * - ถ้าไม่ได้ตั้งค่าใน firebase-config.js → ทุกฟังก์ชันไม่ทำงาน (แอปใช้ localStorage เหมือนเดิม)
 * - initializeApp ถูกเรียกครั้งเดียวเท่านั้น (guard firebase.apps + singleton promise)
 * - Auto-init: ถ้าตั้งค่า config แล้ว Firebase จะพร้อมใช้ทุกหน้าโดยอัตโนมัติ
 * - ใช้งาน: window.FirebaseOrders.init().then(ok => ok && FirebaseOrders.subscribeOrders(cb))
 *   หรือใช้ของจริงตรง ๆ: FirebaseOrders.db.collection(...) / FirebaseOrders.auth.signInWithEmailAndPassword(...)
 */
(function () {
  const CONFIG = window.FIREBASE_CONFIG;
  const CONFIGURED = window.FIREBASE_CONFIGURED === true;

  let app = null;
  let db = null;
  let auth = null;
  let initPromise = null; // singleton: หลายหน้าเรียก init() พร้อมกันได้ promise เดียวกัน (กัน init ซ้ำ)
  let ready = false;

  // โหลด Firebase SDK (firebase-app + firebase-auth + firebase-firestore แบบ compat) จาก CDN
  // storage/messaging ไม่โหลดเพราะแอปยังไม่ใช้งาน (ถ้าจะใช้ค่อยเพิ่มบรรทัดในลิสต์นี้)
  function loadSdk() {
    const urls = [
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js",
    ];
    return Promise.all(
      urls.map(
        (src) =>
          new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = src;
            s.onload = resolve;
            s.onerror = () => reject(new Error("โหลด Firebase SDK ไม่ได้: " + src));
            document.head.appendChild(s);
          })
      )
    );
  }

  window.FirebaseOrders = {
    get isReady() { return ready; },
    get isConfigured() { return CONFIGURED; },

    // อินสแตนซ์ Firebase — เปิดให้หน้า HTML ใช้ของจริงตรง ๆ ได้ (หลัง init เสร็จ)
    get app() { return app; },
    get db() { return db; },
    get auth() { return auth; },

    // เริ่มต้น: โหลด SDK + initializeApp (ครั้งเดียว) + auth + firestore — คืน true ถ้าพร้อมใช้
    init() {
      if (!CONFIGURED) return Promise.resolve(false);
      if (initPromise) return initPromise; // เรียกซ้ำ/หลายหน้า = promise เดียวกัน ไม่ initializeApp ซ้ำ
      initPromise = loadSdk()
        .then(() => {
          // guard: ถ้ามีแอปที่ init ไปแล้ว (โค้ดอื่น/หน้าเดียวกัน) ใช้ตัวเดิม — กัน "Firebase App already exists"
          app = firebase.apps.length ? firebase.apps[0] : firebase.initializeApp(CONFIG);
          db = firebase.firestore(app);
          if (firebase.auth) auth = firebase.auth(app); // auth พร้อมใช้ทุกหน้า (ถ้า SDK โหลดสำเร็จ)
          ready = true;
          return true;
        })
        .catch((err) => {
          console.warn("⚠️ Firebase init ล้มเหลว (ใช้โหมดท้องถิ่นแทน):", err && err.message ? err.message : err);
          return false;
        });
      return initPromise;
    },

    // ⭐ ฟังสดคอลเลกชันทั่วไป: ทุกครั้งที่คอลเลกชัน name ใน Firestore เปลี่ยน → cb(docs [{ id, ...data }])
    //    onErr (optional) เรียกเมื่อ subscription ล้มเหลว (เช่น project/สิทธิ์ผิด) — คืนฟังก์ชันเลิกฟัง
    subscribeCollection(name, cb, onErr) {
      if (!ready) return () => {};
      const handleErr = (err) => {
        const msg = err && err.message ? err.message : String(err);
        console.warn("⚠️ Firestore subscribe error (", name, "):", msg);
        if (onErr) onErr(msg);
      };
      try {
        return db
          .collection(name)
          .orderBy("createdAt", "desc")
          .onSnapshot(
            (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
            handleErr
          );
      } catch (err) {
        // คอลเลกชันไม่มี field createdAt (เช่น seeded ด้วยข้อมูลเก่า) → ฟังแบบไม่เรียงลำดับ
        handleErr(err);
        return db.collection(name).onSnapshot((snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), handleErr);
      }
    },

    // ⭐ ฟังสดออเดอร์ (เรียงใหม่สุดก่อน) — เทียบเท่า subscribeCollection("orders", ...)
    subscribeOrders(cb, onErr) {
      return this.subscribeCollection("orders", cb, onErr);
    },

    // บันทึกเอกสารลงคอลเลกชัน (doc id = String(id) — id ซ้ำ = เขียนทับ)
    saveDoc(collectionName, id, data) {
      if (!ready) return Promise.resolve();
      return db.collection(collectionName).doc(String(id)).set(data || {});
    },

    // ลบเอกสารออกจากคอลเลกชัน
    deleteDoc(collectionName, id) {
      if (!ready) return Promise.resolve();
      return db.collection(collectionName).doc(String(id)).delete();
    },

    // ดึงเอกสารทั้งหมดของคอลเลกชันครั้งเดียว → [{ id, ...data }] (ใช้เช็คว่า collection ว่างไหมตอน seed)
    async getAll(collectionName) {
      if (!ready) return [];
      const snap = await db.collection(collectionName).get();
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    // ⚙️ ระบบจริง: คอลเลกชันที่แอปใช้ (users / restaurants / menus / orders / riders)
    //    เรียกเมื่อ init สำเร็จ — ถ้า collection ว่าง จะอัปโหลดข้อมูล localStorage ปัจจุบันเป็นชุดเริ่มต้น (ไม่ทับข้อมูลที่มีอยู่)
    async seedLocalData(data) {
      if (!ready) return;
      const sources = data || window.__sangkhaLocalData;
      if (!sources || typeof sources !== "object") return;
      const tasks = [];
      for (const name of ["users", "restaurants", "menus", "orders", "riders"]) {
        if (!Array.isArray(sources[name])) continue;
        try {
          const existing = await this.getAll(name);
          if (existing.length > 0) continue; // มีข้อมูลแล้ว — ไม่ทับ
          sources[name].forEach((doc) => tasks.push(this.saveDoc(name, doc.id, doc)));
        } catch (_) { /* ข้าม collection ที่อ่านไม่ได้ */ }
      }
      await Promise.all(tasks);
    },

    saveOrder(order) {
      if (!ready) return Promise.resolve();
      return db.collection("orders").doc(String(order.id)).set(order);
    },

    updateOrder(id, patch) {
      if (!ready) return Promise.resolve();
      return db.collection("orders").doc(String(id)).update(patch);
    },

    deleteOrder(id) {
      if (!ready) return Promise.resolve();
      return db.collection("orders").doc(String(id)).delete();
    },

    // ===== Firebase Auth (พร้อมใช้ — ระบบล็อกอินเดิมของแอปยังใช้ PIN ใน localStorage เหมือนเดิม) =====
    // ฟังการเปลี่ยนสถานะล็อกอิน: cb(user) — user=null เมื่อออกจากระบบ
    onAuthChange(cb) {
      if (!ready || !auth) return () => {};
      return auth.onAuthStateChanged((user) => cb(user));
    },

    // ล็อกอินด้วยอีเมล/รหัสผ่าน (Firebase Auth) — ใช้เมื่ออยากให้ลูกค้า/ร้าน/ไรเดอร์มีบัญชีจริง
    signIn(email, password) {
      if (!ready || !auth) return Promise.reject(new Error("Firebase Auth ยังไม่พร้อม (ยังไม่ได้ตั้งค่า config)"));
      return auth.signInWithEmailAndPassword(email, password);
    },

    signUp(email, password) {
      if (!ready || !auth) return Promise.reject(new Error("Firebase Auth ยังไม่พร้อม (ยังไม่ได้ตั้งค่า config)"));
      return auth.createUserWithEmailAndPassword(email, password);
    },

    signOut() {
      if (!ready || !auth) return Promise.resolve();
      return auth.signOut();
    },
  };

  // 🔥 Auto-init: ถ้าตั้งค่า config แล้ว ให้ Firebase พร้อมใช้ทุกหน้าโดยอัตโนมัติ
  //    (หน้าไหนเรียก init() ซ้ำจะได้ promise เดียวกัน — ไม่ duplicate initializeApp)
  if (CONFIGURED) window.FirebaseOrders.init();
})();
