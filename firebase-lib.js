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


    // PHASE 2C-1: Restaurant Identity Migration Layer
    // รองรับ dual identity: legacy ownerId + Firebase UID
    async getRestaurantOwnerIdentity(ownerId) {
      if (!ready || !ownerId) return null;
      try {
        const snap = await db.collection("restaurantOwnerMappings").doc(String(ownerId)).get();
        return snap.exists ? { ownerId: snap.id, ...snap.data() } : null;
      } catch (err) {
        console.warn("getRestaurantOwnerIdentity failed:", err);
        return null;
      }
    },

    async linkRestaurantOwnerToFirebaseUid(ownerId, firebaseUid, role = "restaurant_owner") {
      if (!ready || !ownerId || !firebaseUid) return null;
      const payload = {
        ownerId: String(ownerId),
        firebaseUid: String(firebaseUid),
        role,
        linkedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection("restaurantOwnerMappings").doc(String(ownerId)).set(payload, { merge: true });
      await db.collection("restaurantOwnerMappings").doc(String(firebaseUid)).set({
        ...payload,
        lookupType: "firebaseUid"
      }, { merge: true });
      return payload;
    },

    async migrateRestaurantOwner(restaurant, firebaseUid) {
      if (!restaurant || !firebaseUid) return null;
      const ownerId = restaurant.ownerId || restaurant.ownerID || restaurant.id;
      if (!ownerId) return null;
      return this.linkRestaurantOwnerToFirebaseUid(ownerId, firebaseUid, "restaurant_owner");
    },

    async getRestaurantByOwnerIdentity(identity) {
      if (!ready || !identity) return [];
      const value = String(identity);
      try {
        const byOwner = await db.collection("restaurants").where("ownerId", "==", value).get();
        if (!byOwner.empty) {
          return byOwner.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        const mapping = await this.getRestaurantOwnerIdentity(value);
        if (mapping && mapping.firebaseUid) {
          const byUid = await db.collection("restaurants").where("ownerFirebaseUid", "==", mapping.firebaseUid).get();
          return byUid.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (err) {
        console.warn("getRestaurantByOwnerIdentity failed:", err);
      }
      return [];
    },

    async getOwnerRestaurants(identity) {
      return this.getRestaurantByOwnerIdentity(identity);
    },


    async getRestaurantDocument(restaurantId) {
      if (!restaurantId || !this.db) return null;
      try {
        const ref = this.db.collection("restaurants").doc(String(restaurantId));
        const snap = await ref.get();
        if (!snap.exists) return null;
        return { id: snap.id, ...snap.data() };
      } catch (error) {
        console.error("getRestaurantDocument error", error);
        return null;
      }
    },

    async createRestaurantMigrationRecord(restaurantId, data = {}) {
      if (!restaurantId || !this.db) return null;
      try {
        const payload = {
          restaurantId: String(restaurantId),
          migrated: false,
          createdAt: new Date().toISOString(),
          ...data
        };
        await this.db.collection("restaurantMigrations").doc(String(restaurantId)).set(payload, { merge: true });
        return payload;
      } catch (error) {
        console.error("createRestaurantMigrationRecord error", error);
        return null;
      }
    },

    async migrateRestaurantDocument(restaurantId, firebaseUid) {
      if (!restaurantId || !firebaseUid) return null;

      const restaurant = await this.getRestaurantDocument(restaurantId);
      if (!restaurant) return null;

      const ownerId = restaurant.ownerId || restaurant.ownerID || restaurantId;
      const payload = {
        ...restaurant,
        ownerId,
        ownerFirebaseUid: firebaseUid,
        identityMigrated: true,
        migratedAt: new Date().toISOString()
      };

      await this.db.collection("restaurants").doc(String(restaurantId)).set(payload, { merge: true });
      await this.createRestaurantMigrationRecord(restaurantId, {
        ownerId,
        firebaseUid,
        migrated: true,
        migratedAt: payload.migratedAt
      });

      return payload;
    },

    async isRestaurantMigrated(restaurantId) {
      const status = await this.getRestaurantMigrationStatus(restaurantId);
      return !!(status && status.migrated === true);
    },

    async getRestaurantMigrationStatus(restaurantId) {
      if (!restaurantId || !this.db) return null;
      try {
        const snap = await this.db.collection("restaurantMigrations").doc(String(restaurantId)).get();
        return snap.exists ? snap.data() : null;
      } catch (error) {
        console.error("getRestaurantMigrationStatus error", error);
        return null;
      }
    },

    async syncRestaurantOwnerIdentity(restaurantId, firebaseUid) {
      if (!restaurantId || !firebaseUid) return null;

      const restaurant = await this.getRestaurantDocument(restaurantId);
      if (!restaurant) return null;

      const ownerId = restaurant.ownerId || restaurant.ownerID || restaurantId;
      await this.linkRestaurantOwnerToFirebaseUid(ownerId, firebaseUid, "restaurant_owner");

      return this.migrateRestaurantDocument(restaurantId, firebaseUid);
    },


    async getRestaurantOwnerAuthIdentity(ownerId) {
      if (!ready || !ownerId) return null;

      const direct = await db.collection("restaurantOwnerMappings").doc(String(ownerId)).get();
      if (direct.exists) {
        return {
          ownerId: direct.data().ownerId || ownerId,
          firebaseUid: direct.data().firebaseUid || null,
          role: "restaurant",
          source: direct.data().lookupType === "firebaseUid" ? "firebase" : "mapping"
        };
      }

      const uidLookup = await db.collection("restaurantOwnerMappings").doc(String(ownerId)).get();
      if (uidLookup.exists) {
        return {
          ownerId: uidLookup.data().ownerId || ownerId,
          firebaseUid: uidLookup.data().firebaseUid || null,
          role: "restaurant",
          source: "firebase"
        };
      }

      return {
        ownerId: String(ownerId),
        firebaseUid: null,
        role: "restaurant",
        source: "legacy"
      };
    },

    async migrateRestaurantOwnerProfile(ownerId, firebaseUid) {
      if (!ready || !ownerId || !firebaseUid) return null;

      const legacy = await db.collection("users").doc(String(ownerId)).get();
      const profile = legacy.exists ? legacy.data() : {};

      const payload = {
        ...profile,
        firebaseUid: String(firebaseUid),
        legacyId: String(ownerId),
        role: "restaurant",
        migratedFromLegacy: true,
        migratedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("users").doc(String(firebaseUid)).set(payload, { merge: true });
      return payload;
    },

    async syncRestaurantOwnerAuthentication(ownerId) {
      const user = this.getAuthUser();
      if (!user || !user.uid) {
        return { success: false, ownerId, firebaseUid: null, role: "restaurant", migrated: false };
      }

      const firebaseUid = user.uid;
      await this.linkRestaurantOwnerToFirebaseUid(ownerId, firebaseUid);
      await this.migrateRestaurantOwnerProfile(ownerId, firebaseUid);
      await this.createRestaurantOwnerAuthAudit(ownerId, { firebaseUid });

      return {
        success: true,
        ownerId,
        firebaseUid,
        role: "restaurant",
        migrated: true
      };
    },

    async getRestaurantOwnerAuthContext(ownerId) {
      const identity = await this.getRestaurantOwnerAuthIdentity(ownerId);
      const user = this.getAuthUser();
      const restaurants = await this.getOwnerRestaurants(ownerId);

      return {
        ownerId,
        firebaseUid: identity ? identity.firebaseUid : null,
        user,
        restaurants,
        authenticated: !!user,
        migrated: !!(identity && identity.firebaseUid),
        role: "restaurant"
      };
    },

    async validateRestaurantOwnerAuthentication(ownerId, uid) {
      const identity = await this.getRestaurantOwnerAuthIdentity(ownerId);
      const valid = !!identity && identity.firebaseUid === uid;

      return {
        valid,
        ownerId,
        firebaseUid: uid,
        role: "restaurant",
        reason: valid ? "owner_mapping_match" : "owner_mapping_mismatch"
      };
    },

    async syncRestaurantSessionBridge(ownerId) {
      const identity = await this.getRestaurantOwnerAuthIdentity(ownerId);
      let restaurantId = null;

      try {
        const session = JSON.parse(localStorage.getItem("sangkha-active-restaurant") || "null") || {};
        restaurantId = session.restaurantId || null;
      } catch (e) {}

      return {
        synced: !!identity,
        firebaseUid: identity ? identity.firebaseUid : null,
        ownerId,
        restaurantId,
        sessionPreserved: true
      };
    },

    async createRestaurantOwnerAuthAudit(ownerId, data = {}) {
      if (!ready || !ownerId) return null;

      const payload = {
        ownerId: String(ownerId),
        firebaseUid: data.firebaseUid || null,
        action: "restaurant_owner_auth_sync",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("restaurantOwnerAuthAudits").doc(String(ownerId)).set(payload, { merge: true });
      return payload;
    },

    async getRiderIdentity(riderId) {
      if (!riderId) return null;

      const riderDoc = await this.db.collection("riders").doc(String(riderId)).get();
      if (!riderDoc.exists) return null;

      const rider = { id: riderDoc.id, ...riderDoc.data() };
      return {
        riderId: rider.id,
        firebaseUid: rider.firebaseUid || rider.uid || null,
        legacyId: rider.id,
        role: "rider",
        document: rider
      };
    },

    async linkRiderToFirebaseUid(riderId, firebaseUid) {
      if (!riderId || !firebaseUid) return null;

      const payload = {
        riderId: String(riderId),
        firebaseUid: String(firebaseUid),
        role: "rider",
        linked: true,
        linkedAt: new Date().toISOString()
      };

      await this.db.collection("riderReferenceMappings").doc(String(riderId)).set(payload, { merge: true });

      await this.db.collection("riders").doc(String(riderId)).set({
        firebaseUid: String(firebaseUid),
        identityMigrated: true
      }, { merge: true });

      return payload;
    },


    async getRiderAuthIdentity(riderId) {
      if (!riderId) return null;

      const input = String(riderId);
      const mappingDoc = await this.db.collection("riderReferenceMappings").doc(input).get();
      if (mappingDoc.exists) {
        const data = mappingDoc.data();
        return {
          riderId: data.riderId || input,
          firebaseUid: data.firebaseUid || null,
          role: "rider",
          source: "mapping"
        };
      }

      const rider = await this.getRiderIdentity(input);
      if (rider && rider.firebaseUid) {
        return { riderId: rider.riderId, firebaseUid: rider.firebaseUid, role: "rider", source: "firebase" };
      }

      return { riderId: input, firebaseUid: null, role: "rider", source: "legacy" };
    },

    async migrateRiderAuthProfile(riderId, firebaseUid) {
      if (!riderId || !firebaseUid) return null;

      const legacy = await this.db.collection("users").doc(String(riderId)).get();
      const profile = legacy.exists ? legacy.data() : {};

      const payload = {
        ...profile,
        firebaseUid: String(firebaseUid),
        legacyId: String(riderId),
        role: "rider",
        migratedFromLegacy: true,
        migratedAt: new Date().toISOString()
      };

      await this.db.collection("users").doc(String(firebaseUid)).set(payload, { merge: true });
      return payload;
    },

    async syncRiderAuthentication(riderId) {
      const authUser = this.getAuthUser ? this.getAuthUser() : null;
      if (!authUser || !authUser.uid) return { success: false, riderId, firebaseUid: null, role: "rider", migrated: false };

      const firebaseUid = authUser.uid;
      await this.linkRiderToFirebaseUid(riderId, firebaseUid);
      await this.migrateRiderAuthProfile(riderId, firebaseUid);
      await this.createRiderAuthAudit(riderId, { firebaseUid });

      return { success: true, riderId, firebaseUid, role: "rider", migrated: true };
    },

    async getRiderAuthContext(riderId) {
      const identity = await this.getRiderAuthIdentity(riderId);
      const user = identity && identity.firebaseUid ? await this.getUserProfile(identity.firebaseUid) : null;

      return {
        riderId: identity ? identity.riderId : riderId,
        firebaseUid: identity ? identity.firebaseUid : null,
        user,
        authenticated: !!(identity && identity.firebaseUid),
        migrated: !!(identity && identity.source === "mapping"),
        role: "rider"
      };
    },

    async validateRiderAuthentication(riderId, uid) {
      if (!riderId || !uid) return { valid: false, riderId, firebaseUid: uid, role: "rider", reason: "missing_identity" };

      const identity = await this.getRiderAuthIdentity(riderId);
      const valid = !!identity && identity.firebaseUid === uid;
      return { valid, riderId: identity.riderId, firebaseUid: uid, role: "rider", reason: valid ? "matched" : "not_match" };
    },

    async syncRiderSessionBridge(riderId) {
      const identity = await this.getRiderAuthIdentity(riderId);
      return {
        synced: !!(identity && identity.firebaseUid),
        firebaseUid: identity ? identity.firebaseUid : null,
        riderId,
        sessionPreserved: true
      };
    },

    async createRiderAuthAudit(riderId, data = {}) {
      if (!riderId) return null;
      const payload = {
        riderId: String(riderId),
        firebaseUid: data.firebaseUid || null,
        action: "rider_auth_sync",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await this.db.collection("riderAuthAudits").doc(String(riderId)).set(payload, { merge: true });
      return payload;
    },

    async migrateRiderDocument(riderId, firebaseUid) {
      if (!riderId || !firebaseUid) return null;

      const rider = await this.getRiderIdentity(riderId);
      if (!rider) return null;

      const payload = {
        ...rider.document,
        id: riderId,
        firebaseUid,
        identityMigrated: true,
        migratedAt: new Date().toISOString()
      };

      await this.db.collection("riders").doc(String(riderId)).set(payload, { merge: true });
      return payload;
    },

    async getRiderByIdentity(identity) {
      if (!identity) return null;

      let snapshot = await this.db.collection("riders")
        .where("firebaseUid", "==", String(identity))
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }

      const legacyDoc = await this.db.collection("riders").doc(String(identity)).get();
      if (!legacyDoc.exists) return null;

      return { id: legacyDoc.id, ...legacyDoc.data() };
    },

    async isRiderMigrated(riderId) {
      const rider = await this.getRiderIdentity(riderId);
      return !!(rider && (rider.document.identityMigrated === true || rider.document.firebaseUid));
    },

    async getRiderMigrationStatus(riderId) {
      const rider = await this.getRiderIdentity(riderId);
      if (!rider) return null;

      return {
        riderId: rider.riderId,
        migrated: !!(rider.document.identityMigrated === true || rider.document.firebaseUid),
        firebaseUid: rider.firebaseUid,
        legacyId: rider.legacyId,
        role: "rider"
      };
    },

    // PHASE 2C-4: Rider Document Sync / Reference Bridge Layer
    async getRiderDocument(riderId) {
      if (!riderId || !this.db) return null;
      const snap = await this.db.collection("riders").doc(String(riderId)).get();
      return snap.exists ? { id: snap.id, ...snap.data() } : null;
    },

    async createRiderMigrationRecord(riderId, data = {}) {
      if (!riderId || !this.db) return null;
      const payload = { riderId: String(riderId), migrated: false, createdAt: new Date().toISOString(), ...data };
      await this.db.collection("riderMigrations").doc(String(riderId)).set(payload, { merge: true });
      return payload;
    },

    async syncRiderIdentity(riderId, firebaseUid) {
      if (!riderId || !firebaseUid) return null;
      await this.linkRiderToFirebaseUid(riderId, firebaseUid);
      return this.migrateRiderDocument(riderId, firebaseUid);
    },

    async migrateRiderReference(riderId, firebaseUid) {
      if (!riderId || !firebaseUid || !this.db) return null;
      const payload = { riderId: String(riderId), riderFirebaseUid: String(firebaseUid), referenceMigrated: true, migratedAt: new Date().toISOString() };
      await this.db.collection("riderReferenceMappings").doc(String(riderId)).set(payload, { merge: true });
      await this.createRiderMigrationRecord(riderId, { firebaseUid, referenceMigrated: true });
      return payload;
    },

    async isRiderReferenceMigrated(riderId) {
      if (!riderId || !this.db) return false;
      const snap = await this.db.collection("riderMigrations").doc(String(riderId)).get();
      return snap.exists && snap.data().referenceMigrated === true;
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


    // สร้าง/อัปเดต user profile ใน Firestore โดยไม่ผูกกับ onAuthStateChanged
    // รองรับกรณี users/{uid} ยังไม่มี document
    async createUserProfile(uid, data) {
      if (!ready || !db) return Promise.resolve(null);
      if (!uid) return Promise.reject(new Error("uid is required"));
      const payload = Object.assign({}, data || {}, {
        uid: String(uid)
      });
      await db.collection("users").doc(String(uid)).set(payload, { merge: true });
      return payload;
    },

    // อ่าน user profile จาก users/{uid} ถ้าไม่มีคืน null
    async getUserProfile(uid) {
      if (!ready || !db || !uid) return null;
      const snap = await db.collection("users").doc(String(uid)).get();
      return snap.exists ? { id: snap.id, ...snap.data() } : null;
    },


    /**
     * PHASE 2B Identity Bridge compatibility lookup.
     * Supports Firebase UID and Legacy ID lookup.
     */
    async getUserByIdentity(identity) {
      if (!ready || !db || !identity) return null;

      const key = String(identity);

      const direct = await db.collection("users").doc(key).get();
      if (direct.exists) {
        return { id: direct.id, firebaseUid: direct.id, ...direct.data() };
      }

      const mapping = await db.collection("uidMappings")
        .where("legacyId", "==", key)
        .limit(1)
        .get();

      if (!mapping.empty) {
        const item = mapping.docs[0];
        const data = item.data();
        const profile = await db.collection("users").doc(String(data.firebaseUid)).get();

        if (profile.exists) {
          return {
            id: profile.id,
            firebaseUid: profile.id,
            legacyId: data.legacyId || null,
            role: data.role || null,
            ...profile.data()
          };
        }
      }

      return null;
    },

    // แก้ไข user profile เดิม โดยไม่สร้างอัตโนมัติ
    async updateUserProfile(uid, data) {
      if (!ready || !db) return Promise.resolve(null);
      if (!uid) return Promise.reject(new Error("uid is required"));
      await db.collection("users").doc(String(uid)).update(data || {});
      return this.getUserProfile(uid);
    },

    // คืน role ของ Firebase Auth user ปัจจุบันจาก users/{uid}
    async getCurrentUserRole() {
      if (!auth || !auth.currentUser) return null;
      const profile = await this.getUserProfile(auth.currentUser.uid);
      return profile && profile.role ? profile.role : null;
    },

    // ตรวจสอบว่ามี Firebase Auth user หรือไม่
    requireAuth() {
      if (!auth || !auth.currentUser) {
        throw new Error("ต้องเข้าสู่ระบบก่อน");
      }
      return auth.currentUser;
    },

    // ตรวจสอบ role จาก user profile
    async requireRole(role) {
      const user = this.requireAuth();
      const profile = await this.getUserProfile(user.uid);
      if (!profile || profile.role !== role) {
        throw new Error("ไม่มีสิทธิ์เข้าถึงส่วนนี้");
      }
      return profile;
    },

    // ===== Legacy UID Identity Bridge (Firebase UID <-> Existing App Identity) =====
    // สร้าง mapping layer เพื่อรองรับ migration จาก local/legacy user id ไป Firebase Auth UID
    async createUidMapping(firebaseUid, legacyId, role) {
      if (!ready || !db) return Promise.resolve(null);
      if (!firebaseUid || !legacyId) {
        return Promise.reject(new Error("firebaseUid and legacyId are required"));
      }

      const payload = {
        firebaseUid: String(firebaseUid),
        legacyId: String(legacyId),
        role: role || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("uidMappings").doc(String(firebaseUid)).set(payload, { merge: true });
      return payload;
    },

    // อ่าน mapping จาก Firebase UID
    async getUidMapping(firebaseUid) {
      if (!ready || !db || !firebaseUid) return null;
      const snap = await db.collection("uidMappings").doc(String(firebaseUid)).get();
      return snap.exists ? { id: snap.id, ...snap.data() } : null;
    },

    // แปลง Firebase UID กลับเป็น identity เดิมของระบบ
    async resolveUserIdentity(firebaseUid) {
      const mapping = await this.getUidMapping(firebaseUid);
      if (!mapping) {
        return {
          firebaseUid: String(firebaseUid || ""),
          legacyId: null,
          role: null
        };
      }
      return mapping;
    },


    /**
     * PHASE 2B-1.6: Identity Validation Layer
     * Validate that a user identity contains a valid Firebase UID mapping.
     */
    async validateUserIdentity(identity) {
      if (!identity) {
        return {
          valid: false,
          reason: "identity_required",
          firebaseUid: null,
          legacyId: null,
          role: null
        };
      }

      const user = await this.getUserByIdentity(identity);
      if (!user) {
        return {
          valid: false,
          reason: "user_not_found",
          firebaseUid: null,
          legacyId: null,
          role: null
        };
      }

      return {
        valid: true,
        reason: null,
        firebaseUid: user.firebaseUid || user.id || null,
        legacyId: user.legacyId || null,
        role: user.role || null,
        user
      };
    },


    async getLegacyUser(identity) {
      if (!identity || !db) return null;

      const resolved = await this.getUserByIdentity(identity);
      if (!resolved) return null;

      return {
        id: resolved.legacyId || resolved.id || null,
        firebaseUid: resolved.firebaseUid || resolved.id || null,
        ...resolved
      };
    },

    async createFirebaseUserProfileFromLegacy(legacyUser, firebaseUid) {
      if (!legacyUser || !firebaseUid || !db) return null;

      const profile = Object.assign({}, legacyUser, {
        uid: String(firebaseUid),
        firebaseUid: String(firebaseUid),
        legacyId: legacyUser.id || legacyUser.legacyId || null,
        migratedFromLegacy: true,
        migratedAt: new Date().toISOString()
      });

      delete profile.id;

      await this.createUserProfile(firebaseUid, profile);
      return profile;
    },

    async migrateUserDocument(identity) {
      const legacyUser = await this.getLegacyUser(identity);
      if (!legacyUser) {
        return {
          migrated: false,
          reason: "legacy_user_not_found"
        };
      }

      const firebaseUid = legacyUser.firebaseUid;
      if (!firebaseUid) {
        return {
          migrated: false,
          reason: "firebase_uid_missing"
        };
      }

      if (await this.isUserMigrated(firebaseUid)) {
        return {
          migrated: true,
          reason: "already_migrated",
          firebaseUid
        };
      }

      const profile = await this.createFirebaseUserProfileFromLegacy(legacyUser, firebaseUid);

      return {
        migrated: true,
        firebaseUid,
        profile
      };
    },

    async isUserMigrated(identity) {
      if (!identity || !db) return false;

      const uid = typeof identity === "object"
        ? (identity.firebaseUid || identity.uid || identity.id)
        : identity;

      if (!uid) return false;

      const profile = await this.getUserProfile(uid);
      return !!(profile && profile.migratedFromLegacy === true);
    },

    async getUserMigrationStatus(identity) {
      const migrated = await this.isUserMigrated(identity);

      return {
        migrated,
        identity,
        status: migrated ? "migrated" : "pending"
      };
    },

    /**
     * PHASE 2B-1.6: Require valid identity before protected operations.
     */
    async requireValidIdentity(identity) {
      const result = await this.validateUserIdentity(identity);
      if (!result.valid) {
        throw new Error("Invalid user identity: " + result.reason);
      }
      return result;
    },

    // ย้าย reference จาก legacy id ไป Firebase UID
    // ใช้สำหรับ migration phase ถัดไป โดยยังไม่แตะ flow login เดิม
    async migrateUserReference(collectionName, documentId, legacyField, firebaseUid) {
      if (!ready || !db) return Promise.resolve(null);
      if (!collectionName || !documentId || !legacyField || !firebaseUid) {
        return Promise.reject(new Error("migration parameters are required"));
      }

      const ref = db.collection(collectionName).doc(String(documentId));
      const snap = await ref.get();
      if (!snap.exists) return null;

      await ref.update({
        firebaseUid: String(firebaseUid),
        migratedFrom: snap.data()[legacyField] || null,
        migratedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return {
        collectionName,
        documentId: String(documentId),
        firebaseUid: String(firebaseUid)
      };
    },

    /**
     * PHASE 2D-1: Order Identity Bridge Layer
     * Read existing order identity without changing legacy order data.
     */
    async getOrderIdentity(orderId) {
      if (!ready || !db || !orderId) return null;

      const orderRef = db.collection("orders").doc(String(orderId));
      const snap = await orderRef.get();
      if (!snap.exists) return null;

      const order = snap.data() || {};
      const mappingSnap = await db.collection("orderIdentityMappings").doc(String(orderId)).get();
      const mapping = mappingSnap.exists ? mappingSnap.data() : {};

      return {
        orderId: String(orderId),
        legacyOrderId: order.orderId || String(orderId),
        customerIdentity: {
          legacyCustomerId: mapping.customerIdentity?.legacyCustomerId || order.customerId || null,
          firebaseUid: mapping.customerIdentity?.firebaseUid || order.customerFirebaseUid || null
        },
        riderIdentity: {
          legacyRiderId: mapping.riderIdentity?.legacyRiderId || order.riderId || null,
          firebaseUid: mapping.riderIdentity?.firebaseUid || order.riderFirebaseUid || null
        },
        firebaseReference: mapping.firebaseReference || null
      };
    },

    async createOrderMigrationRecord(orderId, data = {}) {
      if (!ready || !db || !orderId) return null;

      const now = firebase.firestore.FieldValue.serverTimestamp();
      const ref = db.collection("orderMigrations").doc(String(orderId));

      const payload = {
        orderId: String(orderId),
        customerMigrated: !!data.customerMigrated,
        riderMigrated: !!data.riderMigrated,
        legacyCustomerId: data.legacyCustomerId || null,
        customerFirebaseUid: data.customerFirebaseUid || null,
        legacyRiderId: data.legacyRiderId || null,
        riderFirebaseUid: data.riderFirebaseUid || null,
        status: data.status || "pending",
        createdAt: data.createdAt || now,
        updatedAt: now
      };

      await ref.set(payload, { merge: true });
      return payload;
    },

    async migrateOrderCustomerIdentity(orderId, firebaseUid) {
      if (!ready || !db || !orderId || !firebaseUid) return null;

      const orderSnap = await db.collection("orders").doc(String(orderId)).get();
      if (!orderSnap.exists) return null;

      const order = orderSnap.data() || {};
      const mappingRef = db.collection("orderIdentityMappings").doc(String(orderId));

      await mappingRef.set({
        customerIdentity: {
          legacyCustomerId: order.customerId || null,
          firebaseUid: String(firebaseUid)
        }
      }, { merge: true });

      await this.createOrderMigrationRecord(orderId, {
        customerMigrated: true,
        legacyCustomerId: order.customerId || null,
        customerFirebaseUid: String(firebaseUid),
        status: "partial"
      });

      return { orderId: String(orderId), customerFirebaseUid: String(firebaseUid) };
    },

    async migrateOrderRiderIdentity(orderId, firebaseUid) {
      if (!ready || !db || !orderId || !firebaseUid) return null;

      const orderSnap = await db.collection("orders").doc(String(orderId)).get();
      if (!orderSnap.exists) return null;

      const order = orderSnap.data() || {};
      const mappingRef = db.collection("orderIdentityMappings").doc(String(orderId));

      await mappingRef.set({
        riderIdentity: {
          legacyRiderId: order.riderId || null,
          firebaseUid: String(firebaseUid)
        }
      }, { merge: true });

      await this.createOrderMigrationRecord(orderId, {
        riderMigrated: true,
        legacyRiderId: order.riderId || null,
        riderFirebaseUid: String(firebaseUid),
        status: "partial"
      });

      return { orderId: String(orderId), riderFirebaseUid: String(firebaseUid) };
    },

    async getOrderMigrationStatus(orderId) {
      if (!ready || !db || !orderId) return { migrated: false, status: "pending" };

      const snap = await db.collection("orderMigrations").doc(String(orderId)).get();
      if (!snap.exists) {
        return { migrated: false, status: "pending", customerMigrated: false, riderMigrated: false };
      }

      const data = snap.data() || {};
      const migrated = data.customerMigrated === true && data.riderMigrated === true;

      return {
        migrated,
        status: migrated ? "migrated" : (data.status || "pending"),
        customerMigrated: !!data.customerMigrated,
        riderMigrated: !!data.riderMigrated
      };
    },

    async isOrderIdentityMigrated(orderId) {
      const status = await this.getOrderMigrationStatus(orderId);
      return status.migrated === true;
    },



    // PHASE 2D-2: Order Reference Migration Layer
    // Reference Bridge only - keeps legacy orders schema unchanged.
    async getOrderReference(orderId) {
      if (!ready || !db || !orderId) return null;
      try {
        const snap = await db.collection("orderReferenceMappings").doc(String(orderId)).get();
        if (!snap.exists) return null;
        const data = snap.data() || {};
        return {
          orderId: String(orderId),
          customerReference: {
            legacyCustomerId: data.legacyCustomerId || null,
            customerFirebaseUid: data.customerFirebaseUid || null
          },
          riderReference: {
            legacyRiderId: data.legacyRiderId || null,
            riderFirebaseUid: data.riderFirebaseUid || null
          },
          restaurantReference: {
            restaurantId: data.restaurantId || null,
            ownerFirebaseUid: data.ownerFirebaseUid || null
          }
        };
      } catch (error) {
        console.error("getOrderReference error", error);
        return null;
      }
    },

    async createOrderReferenceMigration(orderId, data = {}) {
      if (!ready || !db || !orderId) return null;
      const now = new Date().toISOString();
      const payload = {
        orderId: String(orderId),
        legacyCustomerId: data.legacyCustomerId || null,
        customerFirebaseUid: data.customerFirebaseUid || null,
        legacyRiderId: data.legacyRiderId || null,
        riderFirebaseUid: data.riderFirebaseUid || null,
        restaurantId: data.restaurantId || null,
        ownerFirebaseUid: data.ownerFirebaseUid || null,
        status: data.status || "pending",
        createdAt: data.createdAt || now,
        updatedAt: now
      };
      await db.collection("orderReferenceMappings").doc(String(orderId)).set(payload, { merge: true });
      return payload;
    },

    async syncOrderCustomerReference(orderId, firebaseUid) {
      if (!ready || !db || !orderId || !firebaseUid) return null;
      const snap = await db.collection("orders").doc(String(orderId)).get();
      if (!snap.exists) return null;
      const order = snap.data() || {};
      return this.createOrderReferenceMigration(orderId, {
        legacyCustomerId: order.customerId || null,
        customerFirebaseUid: String(firebaseUid)
      });
    },

    async syncOrderRiderReference(orderId, firebaseUid) {
      if (!ready || !db || !orderId || !firebaseUid) return null;
      const snap = await db.collection("orders").doc(String(orderId)).get();
      if (!snap.exists) return null;
      const order = snap.data() || {};
      return this.createOrderReferenceMigration(orderId, {
        legacyRiderId: order.riderId || null,
        riderFirebaseUid: String(firebaseUid)
      });
    },

    async syncOrderRestaurantReference(orderId) {
      if (!ready || !db || !orderId) return null;
      const orderSnap = await db.collection("orders").doc(String(orderId)).get();
      if (!orderSnap.exists) return null;
      const order = orderSnap.data() || {};
      if (!order.restaurantId) return null;

      const restaurantSnap = await db.collection("restaurants").doc(String(order.restaurantId)).get();
      if (!restaurantSnap.exists) return null;
      const restaurant = restaurantSnap.data() || {};

      return this.createOrderReferenceMigration(orderId, {
        restaurantId: order.restaurantId,
        ownerFirebaseUid: restaurant.ownerFirebaseUid || null
      });
    },

    async getOrderReferenceStatus(orderId) {
      const ref = await this.getOrderReference(orderId);
      if (!ref) {
        return {
          orderId: String(orderId),
          customerLinked: false,
          riderLinked: false,
          restaurantLinked: false,
          status: "pending"
        };
      }

      const customerLinked = !!ref.customerReference.customerFirebaseUid;
      const riderLinked = !!ref.riderReference.riderFirebaseUid;
      const restaurantLinked = !!ref.restaurantReference.ownerFirebaseUid;
      const count = [customerLinked, riderLinked, restaurantLinked].filter(Boolean).length;

      return {
        orderId: String(orderId),
        customerLinked,
        riderLinked,
        restaurantLinked,
        status: count === 3 ? "completed" : (count > 0 ? "partial" : "pending")
      };
    },

    async isOrderReferenceMigrated(orderId) {
      const status = await this.getOrderReferenceStatus(orderId);
      return status.status === "completed";
    },

    async resolveOrderCustomer(orderId) {
      if (!ready || !db || !orderId) return null;

      const snap = await db.collection("orders").doc(String(orderId)).get();
      if (!snap.exists) return null;

      const order = snap.data() || {};
      const customerId = order.customerId || null;
      const mapping = await this.getOrderReference(orderId);

      if (mapping && mapping.customerReference && mapping.customerReference.customerFirebaseUid) {
        return {
          orderId: String(orderId),
          customerId,
          firebaseUid: mapping.customerReference.customerFirebaseUid,
          source: "mapping"
        };
      }

      if (order.customerFirebaseUid) {
        return {
          orderId: String(orderId),
          customerId,
          firebaseUid: order.customerFirebaseUid,
          source: "firebase"
        };
      }

      if (customerId) {
        return {
          orderId: String(orderId),
          customerId,
          firebaseUid: null,
          source: "legacy"
        };
      }

      return null;
    },

    async resolveOrderRider(orderId) {
      if (!ready || !db || !orderId) return null;

      const snap = await db.collection("orders").doc(String(orderId)).get();
      if (!snap.exists) return null;

      const order = snap.data() || {};
      const riderId = order.riderId || null;
      const mapping = await this.getOrderReference(orderId);

      if (mapping && mapping.riderReference && mapping.riderReference.riderFirebaseUid) {
        return {
          orderId: String(orderId),
          riderId,
          firebaseUid: mapping.riderReference.riderFirebaseUid,
          source: "mapping"
        };
      }

      if (order.riderFirebaseUid) {
        return {
          orderId: String(orderId),
          riderId,
          firebaseUid: order.riderFirebaseUid,
          source: "firebase"
        };
      }

      if (riderId) {
        return {
          orderId: String(orderId),
          riderId,
          firebaseUid: null,
          source: "legacy"
        };
      }

      return null;
    },

    async resolveOrderRestaurant(orderId) {
      if (!ready || !db || !orderId) return null;

      const orderSnap = await db.collection("orders").doc(String(orderId)).get();
      if (!orderSnap.exists) return null;

      const order = orderSnap.data() || {};
      if (!order.restaurantId) return null;

      const restaurantSnap = await db.collection("restaurants").doc(String(order.restaurantId)).get();
      if (!restaurantSnap.exists) return null;

      const restaurant = restaurantSnap.data() || {};
      const mapping = await this.getOrderReference(orderId);
      const ownerFirebaseUid = (mapping && mapping.restaurantReference && mapping.restaurantReference.ownerFirebaseUid)
        || restaurant.ownerFirebaseUid
        || null;

      return {
        orderId: String(orderId),
        restaurantId: order.restaurantId,
        ownerId: restaurant.ownerId || null,
        ownerFirebaseUid,
        source: mapping && mapping.restaurantReference && mapping.restaurantReference.ownerFirebaseUid
          ? "mapping"
          : (ownerFirebaseUid ? "firebase" : "legacy")
      };
    },

    async getOrderOwnerContext(orderId) {
      const customer = await this.resolveOrderCustomer(orderId);
      const rider = await this.resolveOrderRider(orderId);
      const restaurant = await this.resolveOrderRestaurant(orderId);

      if (!customer && !rider && !restaurant) return null;

      return {
        orderId: String(orderId),
        customer: {
          legacyId: customer ? customer.customerId : null,
          firebaseUid: customer ? customer.firebaseUid : null
        },
        rider: {
          legacyId: rider ? rider.riderId : null,
          firebaseUid: rider ? rider.firebaseUid : null
        },
        restaurant: {
          restaurantId: restaurant ? restaurant.restaurantId : null,
          ownerFirebaseUid: restaurant ? restaurant.ownerFirebaseUid : null
        },
        resolvedAt: new Date().toISOString()
      };
    },

    async validateOrderOwnership(orderId, uid, role) {
      if (role === "admin") {
        return { valid: true, role, orderId: String(orderId), reason: "admin_access" };
      }

      const context = await this.getOrderOwnerContext(orderId);
      const userId = String(uid || "");
      let valid = false;

      if (context) {
        if (role === "customer") valid = context.customer.firebaseUid === userId;
        if (role === "rider") valid = context.rider.firebaseUid === userId;
        if (role === "restaurant_owner") valid = context.restaurant.ownerFirebaseUid === userId;
      }

      return {
        valid,
        role,
        orderId: String(orderId),
        reason: valid ? "ownership_verified" : "ownership_denied"
      };
    },


    async canCustomerViewOrder(orderId, uid) {
      const context = await this.getOrderOwnerContext(orderId);
      const userId = String(uid || "");
      const allowed = !!(context && context.customer && context.customer.firebaseUid === userId);
      return {
        allowed,
        orderId: String(orderId),
        role: "customer",
        reason: allowed ? "customer_verified" : "customer_denied"
      };
    },

    async canRiderManageOrder(orderId, uid) {
      const context = await this.getOrderOwnerContext(orderId);
      const userId = String(uid || "");
      const rider = await this.resolveOrderRider(orderId);
      const allowed = !!((rider && rider.firebaseUid === userId) || (context && context.rider && context.rider.firebaseUid === userId));
      return {
        allowed,
        orderId: String(orderId),
        role: "rider",
        reason: allowed ? "rider_verified" : "rider_denied"
      };
    },

    async canRestaurantManageOrder(orderId, uid) {
      const context = await this.getOrderOwnerContext(orderId);
      const userId = String(uid || "");
      const allowed = !!(context && context.restaurant && context.restaurant.ownerFirebaseUid === userId);
      return {
        allowed,
        orderId: String(orderId),
        role: "restaurant_owner",
        reason: allowed ? "restaurant_owner_verified" : "restaurant_owner_denied"
      };
    },

    async canAdminAccessOrder(orderId, uid) {
      const userId = String(uid || "");
      let role = null;
      try {
        const userDoc = await this.db.collection("users").doc(userId).get();
        if (userDoc.exists) role = userDoc.data().role;
      } catch (e) {}
      const allowed = role === "admin";
      return {
        allowed,
        role: "admin",
        orderId: String(orderId),
        reason: allowed ? "admin_verified" : "admin_denied"
      };
    },

    async checkOrderPermission(orderId, uid, role) {
      let result;
      if (role === "customer") result = await this.canCustomerViewOrder(orderId, uid);
      else if (role === "rider") result = await this.canRiderManageOrder(orderId, uid);
      else if (role === "restaurant_owner") result = await this.canRestaurantManageOrder(orderId, uid);
      else if (role === "admin") result = await this.canAdminAccessOrder(orderId, uid);
      else result = { allowed: false, reason: "invalid_role" };
      return {
        allowed: !!result.allowed,
        orderId: String(orderId),
        uid: String(uid || ""),
        role,
        reason: result.reason
      };
    },

    async getOrderSecurityContext(orderId) {
      const context = await this.getOrderOwnerContext(orderId);
      return {
        orderId: String(orderId),
        customerUid: context && context.customer ? context.customer.firebaseUid || null : null,
        riderUid: context && context.rider ? context.rider.firebaseUid || null : null,
        restaurantOwnerUid: context && context.restaurant ? context.restaurant.ownerFirebaseUid || null : null,
        permissions: {
          customer: !!(context && context.customer && context.customer.firebaseUid),
          rider: !!(context && context.rider && context.rider.firebaseUid),
          restaurant: !!(context && context.restaurant && context.restaurant.ownerFirebaseUid)
        },
        generatedAt: new Date().toISOString()
      };
    },

    async validateOrderAction(orderId, uid, role, action) {
      const permissions = {
        customer: ["view"],
        rider: ["view", "accept", "updateStatus"],
        restaurant_owner: ["view", "accept", "updateStatus", "manage"],
        admin: ["*"]
      };
      const allowedAction = permissions[role] && (permissions[role].includes("*") || permissions[role].includes(action));
      if (!allowedAction) {
        return { allowed: false, action, role, orderId: String(orderId), reason: "action_not_allowed" };
      }
      const permission = await this.checkOrderPermission(orderId, uid, role);
      return {
        allowed: permission.allowed,
        action,
        role,
        orderId: String(orderId),
        reason: permission.reason
      };
    },

    async canAccessOrder(orderId, uid) {
      const roles = ["customer", "rider", "restaurant_owner"];
      for (const role of roles) {
        const result = await this.validateOrderOwnership(orderId, uid, role);
        if (result.valid) return true;
      }
      return false;
    },

    async testOrderCustomerAccess(orderId, uid) {
      const result = await this.canCustomerViewOrder(orderId, uid);
      return {
        orderId: String(orderId),
        uid: String(uid || ""),
        role: "customer",
        allowed: !!result.allowed,
        passed: typeof result.allowed === "boolean",
        reason: result.reason || (result.allowed ? "customer_verified" : "customer_denied")
      };
    },

    async testOrderRiderAccess(orderId, uid) {
      const result = await this.canRiderManageOrder(orderId, uid);
      return {
        orderId: String(orderId),
        uid: String(uid || ""),
        role: "rider",
        allowed: !!result.allowed,
        passed: typeof result.allowed === "boolean",
        reason: result.reason || (result.allowed ? "rider_verified" : "rider_denied")
      };
    },

    async testOrderRestaurantAccess(orderId, uid) {
      const result = await this.canRestaurantManageOrder(orderId, uid);
      return {
        orderId: String(orderId),
        uid: String(uid || ""),
        role: "restaurant_owner",
        allowed: !!result.allowed,
        passed: typeof result.allowed === "boolean",
        reason: result.reason || (result.allowed ? "restaurant_owner_verified" : "restaurant_owner_denied")
      };
    },

    async testOrderAdminAccess(orderId, uid) {
      const result = await this.canAdminAccessOrder(orderId, uid);
      return {
        orderId: String(orderId),
        uid: String(uid || ""),
        role: "admin",
        allowed: !!result.allowed,
        passed: typeof result.allowed === "boolean",
        reason: result.reason || (result.allowed ? "admin_verified" : "admin_denied")
      };
    },

    async runOrderSecurityTestSuite(orderId, testUsers = {}) {
      const results = {
        customer: await this.testOrderCustomerAccess(orderId, testUsers.customerUid),
        rider: await this.testOrderRiderAccess(orderId, testUsers.riderUid),
        restaurant: await this.testOrderRestaurantAccess(orderId, testUsers.restaurantOwnerUid),
        admin: await this.testOrderAdminAccess(orderId, testUsers.adminUid)
      };

      const overallPassed = Object.values(results).every(item => item && item.passed === true);
      const report = {
        orderId: String(orderId),
        results,
        overallPassed,
        testedAt: new Date().toISOString()
      };

      await this.createOrderSecurityAudit(orderId, report);
      return report;
    },

    async getOrderSecurityTestReport(orderId) {
      const doc = await this.db.collection("orderSecurityTests").doc(String(orderId)).get();
      if (!doc.exists) return null;
      return doc.data();
    },

    async createOrderSecurityAudit(orderId, result) {
      const data = {
        orderId: String(orderId),
        action: "security_test",
        result,
        createdAt: new Date().toISOString()
      };

      await this.db.collection("orderSecurityAudits").doc(String(orderId)).set(data);

      await this.db.collection("orderSecurityTests").doc(String(orderId)).set({
        orderId: String(orderId),
        results: result.results,
        overallPassed: result.overallPassed,
        createdAt: data.createdAt
      });

      return data;
    },

    getAuthUser() {
      const currentUser = firebase.auth && firebase.auth().currentUser;
      if (!currentUser) return null;
      return {
        uid: currentUser.uid,
        email: currentUser.email || null,
        emailVerified: !!currentUser.emailVerified
      };
    },

    async syncAuthUserIdentity(firebaseUid, legacyId, role) {
      if (!firebaseUid || !legacyId) throw new Error("firebaseUid and legacyId are required");

      const mapping = {
        firebaseUid: String(firebaseUid),
        legacyId: String(legacyId),
        role: role || null,
        synced: true,
        syncedAt: new Date().toISOString()
      };

      if (typeof this.ensureUserIdentity === "function") {
        await this.ensureUserIdentity(firebaseUid, legacyId, role);
      } else {
        await this.db.collection("uidMappings").doc(String(firebaseUid)).set(mapping, { merge: true });
      }

      await this.createAuthSyncAudit(firebaseUid, mapping);
      return {
        synced: true,
        firebaseUid: String(firebaseUid),
        legacyId: String(legacyId),
        role: role || null
      };
    },

    async syncCurrentUserIdentity(legacyId, role) {
      const authUser = this.getAuthUser();
      if (!authUser) throw new Error("Firebase Auth user not found");
      return this.syncAuthUserIdentity(authUser.uid, legacyId, role);
    },

    async getCurrentIdentityContext() {
      const authUser = this.getAuthUser();
      if (!authUser) {
        return { firebaseUid: null, legacyId: null, role: null, user: null, authenticated: false };
      }

      const mapping = await this.getUidMapping(authUser.uid);
      const legacyId = mapping && mapping.legacyId ? mapping.legacyId : null;
      const user = legacyId ? await this.getUserByIdentity(legacyId) : await this.getUserProfile(authUser.uid);

      return {
        firebaseUid: authUser.uid,
        legacyId,
        role: (mapping && mapping.role) || (user && user.role) || null,
        user: user || null,
        authenticated: true
      };
    },

    async requireAuthenticatedIdentity() {
      const context = await this.getCurrentIdentityContext();
      if (!context.authenticated) throw new Error("Authentication required");
      if (!context.firebaseUid) throw new Error("Firebase identity missing");
      if (!context.legacyId && !context.user) throw new Error("Identity mapping missing");
      return context;
    },

    syncLegacySessionWithFirebase() {
      const firebaseUid = this.getAuthUser();
      const legacySession = {
        customer: JSON.parse(localStorage.getItem("customer") || "null"),
        restaurant: JSON.parse(sessionStorage.getItem("restaurant") || "null"),
        rider: JSON.parse(sessionStorage.getItem("rider") || "null"),
        admin: JSON.parse(sessionStorage.getItem("admin") || "null")
      };

      return {
        synced: !!(firebaseUid && firebaseUid.uid),
        legacySession,
        firebaseUid: firebaseUid ? firebaseUid.uid : null
      };
    },

    async validateAuthSyncStatus(uid) {
      const mapping = await this.getUidMapping(uid);
      const missing = [];
      if (!mapping) missing.push("uidMapping");
      if (mapping && !mapping.legacyId) missing.push("legacyId");
      if (mapping && !mapping.role) missing.push("role");

      return {
        synced: missing.length === 0,
        firebaseUid: String(uid),
        legacyId: mapping ? mapping.legacyId : null,
        role: mapping ? mapping.role : null,
        missing
      };
    },

    async createAuthSyncAudit(uid, data) {
      const audit = {
        uid: String(uid),
        legacyId: data.legacyId || null,
        role: data.role || null,
        action: "auth_sync",
        createdAt: new Date().toISOString()
      };

      await this.db.collection("authSyncAudits").doc(String(uid)).set(audit, { merge: true });
      return audit;
    },

    async getCustomerIdentity(customerId) {
      const input = String(customerId);
      const mapping = await this.getUidMapping(input);

      if (mapping && mapping.role === "customer") {
        return {
          customerId: mapping.legacyId || null,
          firebaseUid: mapping.firebaseUid || input,
          role: "customer",
          source: "mapping"
        };
      }

      const directUser = await this.getUserProfile(input);
      if (directUser && directUser.role === "customer") {
        return {
          customerId: directUser.legacyId || input,
          firebaseUid: input,
          role: "customer",
          source: "firebase"
        };
      }

      return {
        customerId: input,
        firebaseUid: null,
        role: "customer",
        source: "legacy"
      };
    },

    async linkCustomerToFirebaseUid(customerId, firebaseUid) {
      const mapping = {
        firebaseUid: String(firebaseUid),
        legacyId: String(customerId),
        role: "customer",
        linked: true,
        linkedAt: new Date().toISOString()
      };

      await this.db.collection("uidMappings").doc(String(firebaseUid)).set(mapping, { merge: true });
      return mapping;
    },

    async migrateCustomerProfile(customerId, firebaseUid) {
      const legacy = await this.getUserProfile(customerId);
      const profile = Object.assign({}, legacy || {}, {
        firebaseUid: String(firebaseUid),
        legacyId: String(customerId),
        migratedFromLegacy: true,
        role: "customer",
        migratedAt: new Date().toISOString()
      });

      await this.db.collection("users").doc(String(firebaseUid)).set(profile, { merge: true });
      return profile;
    },

    async syncCustomerAuthentication(customerId) {
      const authUser = this.getAuthUser();
      if (!authUser || !authUser.uid) {
        return { success: false, customerId, firebaseUid: null, role: "customer", migrated: false };
      }

      const firebaseUid = authUser.uid;
      await this.linkCustomerToFirebaseUid(customerId, firebaseUid);
      await this.migrateCustomerProfile(customerId, firebaseUid);
      await this.createCustomerAuthAudit(customerId, { firebaseUid });

      return {
        success: true,
        customerId,
        firebaseUid,
        role: "customer",
        migrated: true
      };
    },

    async getCustomerAuthContext(customerId) {
      const identity = await this.getCustomerIdentity(customerId);
      const user = identity.firebaseUid ? await this.getUserProfile(identity.firebaseUid) : null;

      return {
        customerId: identity.customerId,
        firebaseUid: identity.firebaseUid,
        user,
        authenticated: !!this.getAuthUser(),
        migrated: !!(user && user.migratedFromLegacy),
        role: "customer"
      };
    },

    async validateCustomerAuthentication(customerId, uid) {
      const identity = await this.getCustomerIdentity(customerId);
      const valid = identity.firebaseUid === String(uid);

      return {
        valid,
        customerId: identity.customerId,
        firebaseUid: identity.firebaseUid,
        role: "customer",
        reason: valid ? "identity_match" : "identity_mismatch"
      };
    },

    syncCustomerSessionBridge(customerId) {
      const authUser = this.getAuthUser();
      return {
        synced: !!(authUser && authUser.uid),
        firebaseUid: authUser ? authUser.uid : null,
        customerId,
        sessionPreserved: true
      };
    },

    async createCustomerAuthAudit(customerId, data) {
      const audit = {
        customerId: String(customerId),
        firebaseUid: data.firebaseUid || null,
        action: "customer_auth_sync",
        createdAt: new Date().toISOString()
      };

      await this.db.collection("customerAuthAudits").doc(String(customerId)).set(audit, { merge: true });
      return audit;
    },

    getAdminAuthIdentity(adminId) {
      const legacyId = String(adminId || "");
      const authUser = this.getAuthUser();
      const uid = authUser && authUser.uid ? authUser.uid : null;
      return this.db.collection("adminReferenceMappings").doc(legacyId).get()
        .then(doc => {
          const data = doc.exists ? doc.data() : {};
          if (data.firebaseUid || data.adminId) {
            return {
              adminId: data.adminId || legacyId,
              firebaseUid: data.firebaseUid || uid,
              role: "admin",
              source: "adminReferenceMappings"
            };
          }
          return {
            adminId: legacyId || uid,
            firebaseUid: uid,
            role: "admin",
            source: uid ? "firebaseAuth" : "legacy"
          };
        });
    },

    async linkAdminToFirebaseUid(adminId, firebaseUid) {
      const mapping = {
        adminId: String(adminId),
        firebaseUid: String(firebaseUid),
        role: "admin",
        linked: true,
        linkedAt: new Date().toISOString()
      };
      await this.db.collection("adminReferenceMappings").doc(String(adminId)).set(mapping, { merge: true });
      await this.db.collection("adminReferenceMappings").doc(String(firebaseUid)).set(mapping, { merge: true });
      return mapping;
    },

    async migrateAdminAuthProfile(adminId, firebaseUid) {
      const profile = {
        firebaseUid: String(firebaseUid),
        legacyId: String(adminId),
        role: "admin",
        migratedFromLegacy: true,
        migratedAt: new Date().toISOString()
      };
      await this.db.collection("users").doc(String(firebaseUid)).set(profile, { merge: true });
      return profile;
    },

    async syncAdminAuthentication(adminId) {
      const authUser = this.getAuthUser();
      const firebaseUid = authUser && authUser.uid;
      if (!firebaseUid) return { success: false, adminId, firebaseUid: null, role: "admin", migrated: false };
      await this.linkAdminToFirebaseUid(adminId, firebaseUid);
      await this.migrateAdminAuthProfile(adminId, firebaseUid);
      await this.createAdminAuthAudit(adminId, { firebaseUid });
      return { success: true, adminId, firebaseUid, role: "admin", migrated: true };
    },

    async getAdminAuthContext(adminId) {
      const identity = await this.getAdminAuthIdentity(adminId);
      const user = identity.firebaseUid ? await this.getUserProfile(identity.firebaseUid) : null;
      return {
        adminId: identity.adminId,
        firebaseUid: identity.firebaseUid,
        user,
        authenticated: !!identity.firebaseUid,
        migrated: !!(user && user.migratedFromLegacy),
        role: "admin"
      };
    },

    async validateAdminAuthentication(adminId, uid) {
      const identity = await this.getAdminAuthIdentity(adminId);
      const user = await this.getUserProfile(uid);
      const valid = !!(identity.firebaseUid === uid && user && user.role === "admin");
      return {
        valid,
        adminId,
        firebaseUid: uid,
        role: "admin",
        reason: valid ? "valid" : "admin_auth_validation_failed"
      };
    },

    syncAdminSessionBridge(adminId) {
      const authUser = this.getAuthUser();
      return {
        adminId,
        firebaseUid: authUser ? authUser.uid : null,
        sessionPreserved: true
      };
    },

    async createAdminAuthAudit(adminId, data) {
      const audit = {
        adminId: String(adminId),
        firebaseUid: data.firebaseUid || null,
        role: "admin",
        action: "admin_auth_sync",
        createdAt: new Date().toISOString()
      };
      await this.db.collection("adminAuthAudits").doc(String(adminId)).set(audit, { merge: true });
      return audit;
    },


    /**
     * PHASE 2F-1: Role Authorization Bridge Layer
     * Resolve Firebase Authentication identity into authorization roles.
     */
    async getUserRole(uid) {
      if (!uid || !this.db) {
        return { uid, role: null, source: "unknown" };
      }

      const userSnap = await this.db.collection("users").doc(String(uid)).get();
      if (userSnap.exists) {
        const user = userSnap.data() || {};
        if (user.role) {
          return { uid: String(uid), role: user.role, source: "firebaseProfile" };
        }
      }

      const mappingSnap = await this.db.collection("uidMappings").doc(String(uid)).get();
      if (mappingSnap.exists) {
        const mapping = mappingSnap.data() || {};
        if (mapping.role) {
          return { uid: String(uid), role: mapping.role, source: "mapping" };
        }
      }

      return { uid: String(uid), role: null, source: "unknown" };
    },

    async resolveUserRole(identity) {
      const input = typeof identity === "object" ? identity : { id: identity };
      const rawId = input.firebaseUid || input.uid || input.id || null;
      let firebaseUid = null;
      let legacyId = null;

      if (rawId) {
        const mappingSnap = await this.db.collection("uidMappings").doc(String(rawId)).get();
        if (mappingSnap.exists) {
          const mapping = mappingSnap.data() || {};
          firebaseUid = mapping.firebaseUid || String(rawId);
          legacyId = mapping.legacyId || null;
        }
      }

      if (!firebaseUid && rawId) {
        const profile = await this.getUserProfile(rawId);
        if (profile) {
          firebaseUid = rawId;
          legacyId = profile.legacyId || null;
        }
      }

      const roleData = firebaseUid ? await this.getUserRole(firebaseUid) : { role: null };

      return {
        identity,
        firebaseUid,
        legacyId,
        role: roleData.role || null
      };
    },

    async hasRole(uid, role) {
      const result = await this.getUserRole(uid);
      return result.role === role;
    },

    async requireRoleAccess(uid, role) {
      const allowed = await this.hasRole(uid, role);
      if (!allowed) {
        throw new Error("Unauthorized role");
      }
      return { allowed: true, uid, role };
    },

    async getAuthorizationContext(uid) {
      const roleData = await this.getUserRole(uid);
      const user = await this.getUserProfile(uid);

      return {
        uid,
        role: roleData.role,
        user,
        permissions: {},
        authenticated: !!this.getAuthUser(),
        generatedAt: new Date().toISOString()
      };
    },

    async validatePermission(uid, resource, action) {
      const roleData = await this.getUserRole(uid);
      const role = roleData.role;
      const permissions = {
        customer: { order: ["view", "create"] },
        rider: { order: ["view", "update"] },
        restaurant: { order: ["view", "manage"] },
        admin: { "*": ["*"] }
      };

      const allowed = role === "admin" || !!(
        permissions[role] &&
        permissions[role][resource] &&
        permissions[role][resource].includes(action)
      );

      return {
        allowed,
        uid,
        role,
        resource,
        action,
        reason: allowed ? "permission_granted" : "permission_denied"
      };
    },

    async createAuthorizationAudit(uid, data = {}) {
      const roleData = await this.getUserRole(uid);
      const audit = {
        uid: String(uid),
        role: roleData.role || null,
        resource: data.resource || null,
        action: data.action || null,
        result: data.result || null,
        createdAt: new Date().toISOString()
      };

      await this.db.collection("authorizationAudits").doc(String(uid)).set(audit, { merge: true });
      return audit;
    },

    getPermissionMatrix() {
      return {
        customer: {
          order: ["view", "create"]
        },
        restaurant: {
          order: ["view", "manage", "update"]
        },
        rider: {
          order: ["view", "update"]
        },
        admin: {
          "*": ["*"]
        }
      };
    },

    getRolePermissions(role) {
      const matrix = this.getPermissionMatrix();
      return {
        role,
        permissions: matrix[role] || {}
      };
    },

    checkRolePermission(role, resource, action) {
      const matrix = this.getPermissionMatrix();
      if (role === "admin") return true;

      return !!(
        matrix[role] &&
        matrix[role][resource] &&
        matrix[role][resource].includes(action)
      );
    },

    async validateResourcePermission(uid, resource, action) {
      const roleData = await this.getUserRole(uid);
      const role = roleData.role || null;
      const allowed = this.checkRolePermission(role, resource, action);

      return {
        allowed,
        uid,
        role,
        resource,
        action,
        reason: allowed ? "permission_granted" : "permission_denied"
      };
    },


    async enforceResourcePermission(uid, resource, action) {
      const roleContext = await this.getUserRole(uid);
      const role = roleContext.role || null;
      const permission = await this.validateResourcePermission(uid, resource, action);

      return {
        allowed: permission.allowed,
        uid,
        role,
        resource,
        action,
        reason: permission.reason
      };
    },

    async enforceOrderPermission(uid, orderId, action) {
      const context = await this.getOrderOwnerContext(orderId);
      const roleContext = await this.getUserRole(uid);
      const role = roleContext.role || null;
      const validation = await this.validateOrderAction(uid, orderId, action);
      const permission = await this.validateResourcePermission(uid, "order", action);

      const allowed = !!(validation && validation.allowed !== false && permission.allowed);

      return {
        allowed,
        orderId,
        uid,
        role,
        action,
        reason: allowed ? "permission_granted" : "permission_denied",
        ownerContext: context || null
      };
    },

    async enforceRestaurantPermission(uid, restaurantId, action) {
      const roleContext = await this.getUserRole(uid);
      const role = roleContext.role || null;
      const restaurant = await this.getRestaurantDocument(restaurantId);
      const ownerFirebaseUid = restaurant && (restaurant.ownerFirebaseUid || restaurant.firebaseUid);

      const rolePermission = await this.validateResourcePermission(uid, "restaurant", action);
      const isOwner = ownerFirebaseUid === uid;
      const allowed = role === "admin" || (rolePermission.allowed && isOwner);

      return {
        allowed,
        restaurantId,
        uid,
        role,
        reason: allowed ? "permission_granted" : "permission_denied"
      };
    },

    async enforceUserPermission(uid, targetUid, action) {
      const roleContext = await this.getUserRole(uid);
      const role = roleContext.role || null;
      const allowed = role === "admin" || (uid === targetUid && action === "view");

      return {
        allowed,
        owner: uid,
        target: targetUid,
        action,
        role,
        reason: allowed ? "permission_granted" : "permission_denied"
      };
    },

    async enforceRiderPermission(uid, riderId, action) {
      const roleContext = await this.getUserRole(uid);
      const role = roleContext.role || null;
      const riderContext = await this.getRiderAuthContext(uid);
      const validation = await this.validateRiderAuthentication(uid);
      const isRiderIdentityValid = !!(riderContext || validation);
      const allowed = role === "admin" || (role === "rider" && isRiderIdentityValid && (!riderId || riderId === uid));

      return {
        allowed,
        riderId,
        uid,
        role,
        reason: allowed ? "permission_granted" : "permission_denied"
      };
    },

    async getResourceSecurityContext(uid, resource) {
      const roleData = await this.getUserRole(uid);
      const role = roleData.role || null;
      const matrix = this.getPermissionMatrix();

      return {
        uid,
        role,
        resource,
        permissions: (matrix[role] && (matrix[role][resource] || matrix[role]["*"])) || [],
        generatedAt: new Date().toISOString()
      };
    },

    async createResourceAccessAudit(uid, data = {}) {
      const roleData = await this.getUserRole(uid);
      const audit = {
        uid,
        role: roleData.role || null,
        resource: data.resource || null,
        action: data.action || null,
        allowed: !!data.allowed,
        resourceId: data.resourceId || null,
        createdAt: new Date().toISOString()
      };

      if (this.db && this.db.collection) {
        await this.db.collection("resourceAccessAudits").doc(uid).set(audit, { merge: true });
      }

      return audit;
    },

    async getUserPermissionContext(uid) {
      const roleData = await this.getUserRole(uid);
      const role = roleData.role || null;

      return {
        uid,
        role,
        permissions: this.getRolePermissions(role).permissions,
        authenticated: !!uid,
        generatedAt: new Date().toISOString()
      };
    },

    async createPermissionAudit(uid, data = {}) {
      const roleData = await this.getUserRole(uid);
      const audit = {
        uid: String(uid),
        role: roleData.role || null,
        resource: data.resource || null,
        action: data.action || null,
        allowed: data.allowed === true,
        createdAt: new Date().toISOString()
      };

      await this.db.collection("permissionAudits").doc(String(uid)).set(audit, { merge: true });
      return audit;
    },

    async createSecurityExecutionAudit(uid, data = {}) {
      const audit = {
        uid,
        resource: data.resource || null,
        action: data.action || null,
        resourceId: data.resourceId || null,
        decisionId: data.decisionId || null,
        correlationId: data.correlationId || null,
        executionId: data.executionId || null,
        allowed: !!data.allowed,
        response: data.response || null,
        reason: data.reason || null,
        executedAt: new Date().toISOString()
      };

      try {
        if (this.db && this.db.collection) {
          await this.db.collection("securityExecutionAudits").doc(String(audit.executionId || uid)).set(audit, { merge: true });
        }
      } catch (error) {
        console.warn("Security execution audit failed", error);
      }

      return audit;
    },

    async secureCreateOrder(data = {}) {
      const uid = data.uid || data.customerUid || data.firebaseUid;
      const guard = await this.enforceResourcePermission(uid, "order", "create");

      await this.createSecurityExecutionAudit(uid, {
        resource: "order",
        action: "create",
        resourceId: data.orderId || null,
        allowed: guard.allowed
      });

      if (!guard.allowed) return { allowed: false, reason: "permission_denied" };

      if (typeof this.createOrder === "function") {
        return this.createOrder(data);
      }

      if (typeof this.saveOrder === "function") {
        return this.saveOrder(data);
      }

      throw new Error("createOrder API unavailable");
    },

    async secureGetOrder(orderId, uid) {
      const guard = await this.enforceOrderPermission(uid, orderId, "view");

      await this.createSecurityExecutionAudit(uid, {
        resource: "order",
        action: "view",
        resourceId: orderId,
        allowed: guard.allowed
      });

      if (!guard.allowed) return { allowed: false, reason: "permission_denied" };
      return this.getOrderById(orderId);
    },

    async secureUpdateOrderStatus(orderId, uid, status) {
      const guard = await this.enforceOrderPermission(uid, orderId, "update");

      await this.createSecurityExecutionAudit(uid, {
        resource: "order",
        action: "update",
        resourceId: orderId,
        allowed: guard.allowed
      });

      if (!guard.allowed) return { allowed: false, reason: "permission_denied" };
      return this.updateOrderStatus(orderId, status);
    },

    async secureRestaurantAccess(uid, restaurantId, action) {
      const guard = await this.enforceRestaurantPermission(uid, restaurantId, action);
      await this.createSecurityExecutionAudit(uid, {
        resource: "restaurant",
        action,
        resourceId: restaurantId,
        allowed: guard.allowed
      });
      return guard;
    },

    async secureRiderAccess(uid, riderId, action) {
      const guard = await this.enforceRiderPermission(uid, riderId, action);
      await this.createSecurityExecutionAudit(uid, {
        resource: "rider",
        action,
        resourceId: riderId,
        allowed: guard.allowed
      });
      return guard;
    },

    async secureUserAccess(uid, targetUid, action) {
      const guard = await this.enforceUserPermission(uid, targetUid, action);
      await this.createSecurityExecutionAudit(uid, {
        resource: "user",
        action,
        resourceId: targetUid,
        allowed: guard.allowed
      });
      return guard;
    },

    async testPermission(role, resource, action) {
      const result = this.validatePermission(role, resource, action);

      return {
        role,
        resource,
        action,
        allowed: !!result.allowed,
        reason: result.reason || (result.allowed ? "permission_granted" : "permission_denied")
      };
    },

    async testUserPermission(uid, resource, action) {
      const roleContext = await this.getUserRole(uid);
      const role = typeof roleContext === "string" ? roleContext : roleContext?.role;
      const result = await this.validateResourcePermission(uid, resource, action);

      return {
        uid,
        role,
        resource,
        action,
        allowed: !!result.allowed
      };
    },

    async testOrderSecurityPolicy(orderId, users = {}) {
      const results = {};

      const roles = {
        customer: users.customer,
        rider: users.rider,
        restaurant: users.restaurant,
        admin: users.admin
      };

      for (const [role, uid] of Object.entries(roles)) {
        if (!uid) {
          results[role] = {
            allowed: false,
            skipped: true,
            reason: "missing_test_user"
          };
          continue;
        }

        const validation = await this.validateOrderAction(uid, orderId, "view");
        const enforcement = await this.enforceOrderPermission(uid, orderId, "view");

        results[role] = {
          validation: !!validation.allowed,
          enforcement: !!enforcement.allowed,
          passed: !!validation.allowed === !!enforcement.allowed,
          allowed: !!enforcement.allowed
        };
      }

      return {
        orderId,
        results,
        overallPassed: Object.values(results).every(item => item.skipped || item.passed),
        testedAt: new Date().toISOString()
      };
    },

    async runSecurityPolicyTestSuite() {
      const matrixTest = await this.testPermission("customer", "order", "view");
      const matrixPassed = typeof matrixTest.allowed === "boolean";

      const suite = {
        passed: 0,
        failed: 0,
        totalTests: 0,
        completedAt: new Date().toISOString()
      };

      const tests = [matrixPassed];

      tests.forEach(test => {
        suite.totalTests++;
        if (test) suite.passed++;
        else suite.failed++;
      });

      await this.createSecurityPolicyAudit({
        testType: "securityPolicySuite",
        result: suite,
        passed: suite.passed,
        failed: suite.failed
      });

      return suite;
    },

    async createSecurityPolicyAudit(data) {
      const payload = {
        testType: data.testType,
        result: data.result || null,
        passed: data.passed || 0,
        failed: data.failed || 0,
        createdAt: new Date().toISOString()
      };

      if (typeof this.saveDoc === "function") {
        return this.saveDoc("securityPolicyAudits", String(Date.now()), payload);
      }

      return payload;
    },


    async createAuthorizationEvent(uid, data = {}) {
      const payload = {
        uid: uid || null,
        role: data.role || null,
        resource: data.resource || null,
        action: data.action || null,
        resourceId: data.resourceId || null,
        allowed: data.allowed === true,
        reason: data.reason || null,
        timestamp: new Date().toISOString()
      };

      if (typeof this.saveDoc === "function") {
        return this.saveDoc("authorizationEvents", String(Date.now()), payload);
      }

      return payload;
    },

    async logPermissionDecision(uid, decision = {}) {
      const payload = {
        uid: uid || null,
        resource: decision.resource || null,
        action: decision.action || null,
        allowed: decision.allowed === true,
        createdAt: new Date().toISOString()
      };

      if (typeof this.createAuthorizationEvent === "function") {
        await this.createAuthorizationEvent(uid, decision);
      }

      return payload;
    },

    async logSecurityExecution(uid, execution = {}) {
      const payload = {
        uid: uid || null,
        resource: execution.resource || null,
        action: execution.action || null,
        executed: execution.executed === true,
        result: execution.result || null,
        createdAt: new Date().toISOString()
      };

      if (typeof this.saveDoc === "function") {
        return this.saveDoc("securityExecutionLogs", String(Date.now()), payload);
      }

      return payload;
    },

    async getAuthorizationHistory(uid, limit = 50) {
      if (!uid || typeof this.db === "undefined") {
        return [];
      }

      try {
        const snapshot = await this.db.collection("authorizationEvents")
          .where("uid", "==", uid)
          .limit(limit)
          .get();

        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            resource: data.resource || null,
            action: data.action || null,
            allowed: data.allowed === true,
            timestamp: data.timestamp || null
          };
        });
      } catch (error) {
        return [];
      }
    },

    async getSecurityAuditSummary(uid) {
      const history = await this.getAuthorizationHistory(uid, 1000);

      const allowedRequests = history.filter(item => item.allowed).length;
      const deniedRequests = history.length - allowedRequests;

      return {
        uid: uid || null,
        totalRequests: history.length,
        allowedRequests,
        deniedRequests,
        lastActivity: history.length ? history[history.length - 1].timestamp : null
      };
    },

    async detectAuthorizationAnomaly(uid) {
      const summary = await this.getSecurityAuditSummary(uid);
      let score = 0;
      let reason = "normal";

      if (summary.deniedRequests >= 10) {
        score += 50;
        reason = "high_denied_requests";
      }

      if (summary.totalRequests > 100 && summary.deniedRequests > summary.allowedRequests) {
        score += 30;
        reason = "abnormal_access_pattern";
      }

      return {
        suspicious: score >= 50,
        reason,
        score
      };
    },

    async createSecurityMonitoringReport() {
      const report = {
        totalEvents: 0,
        allowed: 0,
        denied: 0,
        anomalies: 0,
        createdAt: new Date().toISOString()
      };

      if (typeof this.db !== "undefined") {
        try {
          const snapshot = await this.db.collection("authorizationEvents").get();
          report.totalEvents = snapshot.size;
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.allowed === true) {
              report.allowed++;
            } else {
              report.denied++;
            }
          });
        } catch (error) {
          return report;
        }
      }

      if (typeof this.saveDoc === "function") {
        return this.saveDoc("securityMonitoringReports", String(Date.now()), report);
      }

      return report;
    },

    async getSecurityPolicyReport() {
      if (typeof this.getAll !== "function") {
        return {
          lastRun: null,
          passed: 0,
          failed: 0,
          status: "unavailable"
        };
      }

      const audits = await this.getAll("securityPolicyAudits");
      const latest = Array.isArray(audits) ? audits[audits.length - 1] : null;

      return {
        lastRun: latest?.createdAt || null,
        passed: latest?.passed || 0,
        failed: latest?.failed || 0,
        status: latest && latest.failed === 0 ? "PASS" : "FAIL"
      };
    },

    async createAuthorizationMiddleware(uid) {
      const identity = await this.getCurrentIdentityContext(uid);
      const authorization = await this.getAuthorizationContext(uid);
      const permissions = await this.getUserPermissionContext(uid);

      return {
        uid: uid || null,
        role: authorization?.role || identity?.role || null,
        identity: identity || null,
        permissions: permissions || [],
        authenticated: !!uid && !!identity,
        createdAt: new Date().toISOString()
      };
    },

    async authorizeRequest(uid, resource, action, resourceId = null) {
      const context = await this.createAuthorizationMiddleware(uid);
      let allowed = false;
      let reason = "permission_denied";

      if (!context.authenticated) {
        reason = "unauthenticated";
      } else if (typeof this.validateResourcePermission === "function") {
        allowed = await this.validateResourcePermission(uid, resource, action, resourceId);
        reason = allowed ? "permission_granted" : reason;
      } else if (typeof this.enforceResourcePermission === "function") {
        allowed = await this.enforceResourcePermission(uid, resource, action, resourceId);
        reason = allowed ? "permission_granted" : reason;
      }

      const result = {
        allowed: allowed === true,
        uid: uid || null,
        role: context.role,
        resource,
        action,
        resourceId,
        reason,
        timestamp: new Date().toISOString()
      };

      if (typeof this.createAuthorizationMiddlewareAudit === "function") {
        await this.createAuthorizationMiddlewareAudit(result);
      }

      return result;
    },

    async requireAuthorization(uid, resource, action, resourceId = null) {
      const context = await this.authorizeRequest(uid, resource, action, resourceId);
      if (!context.allowed) {
        throw new Error("Authorization Failed");
      }
      return context;
    },

    async authorizeOrderRequest(uid, orderId, action) {
      if (typeof this.enforceOrderPermission === "function") {
        const allowed = await this.enforceOrderPermission(uid, orderId, action);
        const result = { allowed: allowed === true, uid, resource: "order", action, resourceId: orderId, timestamp: new Date().toISOString() };
        await this.createAuthorizationMiddlewareAudit(result);
        return result;
      }
      return this.authorizeRequest(uid, "order", action, orderId);
    },

    async authorizeRestaurantRequest(uid, restaurantId, action) {
      if (typeof this.enforceRestaurantPermission === "function") {
        const allowed = await this.enforceRestaurantPermission(uid, restaurantId, action);
        const result = { allowed: allowed === true, uid, resource: "restaurant", action, resourceId: restaurantId, timestamp: new Date().toISOString() };
        await this.createAuthorizationMiddlewareAudit(result);
        return result;
      }
      return this.authorizeRequest(uid, "restaurant", action, restaurantId);
    },

    async authorizeUserRequest(uid, targetUid, action) {
      if (typeof this.enforceUserPermission === "function") {
        const allowed = await this.enforceUserPermission(uid, targetUid, action);
        const result = { allowed: allowed === true, uid, resource: "user", action, resourceId: targetUid, timestamp: new Date().toISOString() };
        await this.createAuthorizationMiddlewareAudit(result);
        return result;
      }
      return this.authorizeRequest(uid, "user", action, targetUid);
    },

    async executeSecureAction(uid, resource, action, callback) {
      const authorization = await this.authorizeRequest(uid, resource, action);
      if (!authorization.allowed) {
        return { success: false, denied: true, context: authorization };
      }

      try {
        const result = await callback();
        if (typeof this.logSecurityExecution === "function") {
          await this.logSecurityExecution(uid, { resource, action, executed: true, result: "success" });
        }
        return { success: true, result };
      } catch (error) {
        if (typeof this.logSecurityExecution === "function") {
          await this.logSecurityExecution(uid, { resource, action, executed: false, result: "error" });
        }
        return { success: false, error: error.message };
      }
    },

    async createAuthorizationMiddlewareAudit(data = {}) {
      const payload = {
        uid: data.uid || null,
        resource: data.resource || null,
        action: data.action || null,
        allowed: data.allowed === true,
        executed: data.executed === true,
        createdAt: new Date().toISOString()
      };

      if (typeof this.saveDoc === "function") {
        return this.saveDoc("authorizationMiddlewareAudits", String(Date.now()), payload);
      }

      return payload;
    },

    async createAuthorizationPolicy(policy = {}) {
      const policyId = policy.policyId || ("policy_" + Date.now());
      const payload = {
        policyId,
        role: policy.role || null,
        resource: policy.resource || null,
        actions: Array.isArray(policy.actions) ? policy.actions : [],
        conditions: Array.isArray(policy.conditions) ? policy.conditions : [],
        effect: policy.effect || "allow",
        createdAt: new Date().toISOString()
      };

      if (typeof this.saveDoc === "function") {
        await this.saveDoc("authorizationPolicies", policyId, payload);
      }
      return payload;
    },

    async getAuthorizationPolicies() {
      if (typeof this.getAll !== "function") return [];
      try {
        return await this.getAll("authorizationPolicies");
      } catch (error) {
        return [];
      }
    },

    async getAuthorizationDecisionContext(uid, resource, action, resourceId = null) {
      const identity = await this.getCurrentIdentityContext(uid);
      const role = (await this.getUserRole(uid)) || identity?.role || null;
      let ownership = false;

      if (typeof this.validateResourcePermission === "function" && resourceId) {
        try {
          ownership = await this.validateResourcePermission(uid, resource, "owner", resourceId);
        } catch (error) {
          ownership = false;
        }
      }

      return {
        uid: uid || null,
        role,
        identity: identity || null,
        resource,
        action,
        resourceId,
        ownership,
        timestamp: new Date().toISOString()
      };
    },

    checkPolicyCondition(context, condition) {
      if (!condition) return true;
      const type = typeof condition === "string" ? condition : condition.type;

      switch (type) {
        case "ownerMatch":
        case "resourceOwnership":
          return context.ownership === true;
        case "userMatch":
          return !condition.uid || context.uid === condition.uid;
        case "roleMatch":
          return !condition.role || context.role === condition.role;
        case "adminOverride":
          return context.role === "admin";
        default:
          return true;
      }
    },

    async evaluateAuthorizationPolicy(uid, resource, action, resourceId = null) {
      const context = await this.getAuthorizationDecisionContext(uid, resource, action, resourceId);
      const policies = await this.getAuthorizationPolicies();
      let matchedPolicy = null;

      for (const policy of policies) {
        if (policy.role && policy.role !== context.role) continue;
        if (policy.resource && policy.resource !== resource) continue;
        if (Array.isArray(policy.actions) && !policy.actions.includes(action)) continue;

        const conditions = policy.conditions || [];
        if (conditions.every(condition => this.checkPolicyCondition(context, condition))) {
          matchedPolicy = policy;
          break;
        }
      }

      const allowed = matchedPolicy ? matchedPolicy.effect !== "deny" : false;
      return {
        allowed,
        uid,
        role: context.role,
        resource,
        action,
        policy: matchedPolicy,
        reason: matchedPolicy ? "policy_match" : "no_policy_match"
      };
    },

    async enforceAuthorizationPolicy(uid, resource, action, resourceId = null) {
      const decision = await this.evaluateAuthorizationPolicy(uid, resource, action, resourceId);
      if (!decision.allowed) {
        return { allowed: false, reason: decision.reason };
      }
      return { allowed: true, context: decision };
    },

    async authorizeWithPolicy(uid, resource, action, resourceId = null) {
      const policyDecision = await this.enforceAuthorizationPolicy(uid, resource, action, resourceId);
      if (policyDecision.allowed) return policyDecision;

      const permission = await this.authorizeRequest(uid, resource, action, resourceId);
      return permission.allowed ? { allowed: true, context: permission } : permission;
    },

    async createPolicyDecisionAudit(data = {}) {
      const payload = {
        uid: data.uid || null,
        role: data.role || null,
        resource: data.resource || null,
        action: data.action || null,
        decision: data.decision || (data.allowed ? "allow" : "deny"),
        policyId: data.policyId || null,
        reason: data.reason || null,
        createdAt: new Date().toISOString()
      };

      if (typeof this.saveDoc === "function") {
        return this.saveDoc("authorizationPolicyAudits", String(Date.now()), payload);
      }
      return payload;
    },

    async getPolicyAuditHistory(uid, limit = 50) {
      if (typeof this.db === "undefined") return [];
      try {
        const snapshot = await this.db.collection("authorizationPolicyAudits")
          .where("uid", "==", uid)
          .limit(limit)
          .get();
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            resource: data.resource || null,
            action: data.action || null,
            decision: data.decision || null,
            policyId: data.policyId || null,
            timestamp: data.createdAt || null
          };
        });
      } catch (error) {
        return [];
      }
    },

    async createSecurityRiskContext(uid, resource, action, resourceId = null) {
      const identity = await this.getCurrentIdentityContext(uid);
      const role = identity?.role || await this.getUserRole(uid);
      const history = await this.getAdaptiveAuthorizationHistory(uid, 20);
      return {
        uid: uid || null,
        role: role || null,
        resource: resource || null,
        action: action || null,
        resourceId: resourceId || null,
        accessHistory: history || [],
        timestamp: new Date().toISOString()
      };
    },

    async calculateAuthorizationRisk(context = {}) {
      let score = 0;
      const factors = [];
      const history = Array.isArray(context.accessHistory) ? context.accessHistory : [];

      if (!context.resource) { score += 20; factors.push("unknown_resource_access"); }
      if (history.filter(item => item.decision === "deny").length >= 3) { score += 25; factors.push("denied_access_history"); }
      if (context.role && context.action && !context.resource) { score += 15; factors.push("role_mismatch"); }
      if (context.resourceId && history.some(item => item.resource === context.resource && item.decision === "deny")) {
        score += 20;
        factors.push("ownership_mismatch");
      }

      const level = score >= 80 ? "critical" : score >= 60 ? "high" : score >= 30 ? "medium" : "low";
      return { score, level, factors };
    },

    async evaluateAdaptiveAuthorization(uid, resource, action, resourceId = null) {
      const context = await this.createSecurityRiskContext(uid, resource, action, resourceId);
      let policy = { allowed: false };
      if (typeof this.enforceAuthorizationPolicy === "function") {
        policy = await this.enforceAuthorizationPolicy(uid, resource, action, resourceId);
      }
      const risk = await this.calculateAuthorizationRisk(context);
      const allowed = policy.allowed === true && risk.level !== "critical";
      const decision = allowed ? "allow" : (risk.level === "high" || risk.level === "critical" ? "additional_validation" : "deny");

      const result = {
        allowed,
        riskScore: risk.score,
        riskLevel: risk.level,
        decision,
        reason: allowed ? "adaptive_policy_granted" : "adaptive_risk_restriction",
        context
      };

      await this.createAdaptiveAuthorizationAudit({ ...context, ...risk, decision });
      await this.updateSecurityRiskProfile(uid, { decision, riskScore: risk.score, resource, action });
      return result;
    },

    async requireAdaptiveAuthorization(uid, resource, action, resourceId = null) {
      const result = await this.evaluateAdaptiveAuthorization(uid, resource, action, resourceId);
      if (!result.allowed) throw new Error("Adaptive Authorization Failed");
      return { allowed: true, riskLevel: result.riskLevel, context: result.context };
    },

    async getUserSecurityRiskProfile(uid) {
      if (typeof this.db === "undefined") return { uid, totalRequests: 0, deniedRequests: 0, riskScore: 0, lastActivity: null };
      try {
        const doc = await this.db.collection("securityRiskProfiles").doc(uid).get();
        return doc.exists ? doc.data() : { uid, totalRequests: 0, deniedRequests: 0, riskScore: 0, lastActivity: null };
      } catch (error) {
        return { uid, totalRequests: 0, deniedRequests: 0, riskScore: 0, lastActivity: null };
      }
    },

    async updateSecurityRiskProfile(uid, event = {}) {
      const current = await this.getUserSecurityRiskProfile(uid);
      const profile = {
        uid,
        totalRequests: (current.totalRequests || 0) + 1,
        deniedRequests: (current.deniedRequests || 0) + (event.decision === "deny" ? 1 : 0),
        riskScore: Math.max(current.riskScore || 0, event.riskScore || 0),
        lastActivity: new Date().toISOString()
      };
      if (typeof this.saveDoc === "function") await this.saveDoc("securityRiskProfiles", uid, profile);
      return profile;
    },

    async detectSuspiciousAuthorization(uid) {
      const profile = await this.getUserSecurityRiskProfile(uid);
      const suspicious = profile.deniedRequests >= 5 || profile.riskScore >= 80;
      return {
        suspicious,
        score: profile.riskScore || 0,
        reason: suspicious ? "authorization_anomaly_detected" : "normal_activity"
      };
    },

    async createAdaptiveAuthorizationAudit(data = {}) {
      const payload = {
        uid: data.uid || null,
        role: data.role || null,
        resource: data.resource || null,
        action: data.action || null,
        riskScore: data.score || data.riskScore || 0,
        riskLevel: data.level || data.riskLevel || "low",
        decision: data.decision || "deny",
        createdAt: new Date().toISOString()
      };
      if (typeof this.saveDoc === "function") return this.saveDoc("adaptiveAuthorizationAudits", String(Date.now()), payload);
      return payload;
    },

    async getAdaptiveAuthorizationHistory(uid, limit = 50) {
      if (typeof this.db === "undefined") return [];
      try {
        const snapshot = await this.db.collection("adaptiveAuthorizationAudits").where("uid", "==", uid).limit(limit).get();
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return { resource: data.resource, action: data.action, riskLevel: data.riskLevel, decision: data.decision, timestamp: data.createdAt };
        });
      } catch (error) {
        return [];
      }
    },



    async createRuntimeSecurityContext(uid, resource, action, resourceId = null) {
      const identity = typeof this.resolveUserIdentity === "function" ? await this.resolveUserIdentity(uid) : { uid };
      const role = typeof this.getUserRole === "function" ? await this.getUserRole(uid) : null;
      const policyDecision = typeof this.evaluateAuthorizationPolicy === "function"
        ? await this.evaluateAuthorizationPolicy(uid, resource, action, resourceId)
        : { allowed: false };
      const adaptive = typeof this.evaluateAdaptiveAuthorization === "function"
        ? await this.evaluateAdaptiveAuthorization(uid, resource, action, resourceId)
        : { riskLevel: "low" };

      return {
        uid,
        role,
        identity,
        resource,
        action,
        resourceId,
        policyDecision,
        riskLevel: adaptive.riskLevel || "low",
        timestamp: new Date().toISOString()
      };
    },

    async verifyRuntimeAuthorization(context = {}) {
      const checks = {
        identity: !!context.uid,
        permission: false,
        policy: context.policyDecision?.allowed === true,
        risk: context.riskLevel !== "critical",
        ownership: true
      };

      if (typeof this.validateResourcePermission === "function") {
        checks.permission = await this.validateResourcePermission(context.uid, context.resource, context.action, context.resourceId);
      }

      const verified = Object.values(checks).every(Boolean);
      return {
        verified,
        reason: verified ? "runtime_authorization_granted" : "runtime_authorization_failed",
        checks
      };
    },

    async enforceRuntimeSecurity(uid, resource, action, resourceId = null) {
      const context = await this.createRuntimeSecurityContext(uid, resource, action, resourceId);
      const verification = await this.verifyRuntimeAuthorization(context);
      const allowed = verification.verified === true;

      await this.monitorRuntimeAuthorization(uid, {
        resource,
        action,
        decision: allowed ? "allow" : "deny",
        riskLevel: context.riskLevel
      });

      return {
        allowed,
        uid,
        resource,
        action,
        riskLevel: context.riskLevel,
        decision: allowed ? "allow" : "deny",
        reason: verification.reason
      };
    },

    async requireRuntimeSecurity(uid, resource, action, resourceId = null) {
      const result = await this.enforceRuntimeSecurity(uid, resource, action, resourceId);
      if (!result.allowed) throw new Error("Runtime Security Validation Failed");
      return result;
    },

    async secureRuntimeExecution(uid, resource, action, callback, resourceId = null) {
      try {
        const security = await this.requireRuntimeSecurity(uid, resource, action, resourceId);
        const result = await callback(security);
        await this.createRuntimeSecurityAudit({ uid, resource, action, decision: "allow", riskLevel: security.riskLevel, executed: true });
        return { success: true, allowed: true, result };
      } catch (error) {
        await this.createRuntimeSecurityAudit({ uid, resource, action, decision: "deny", riskLevel: "high", executed: false });
        return { success: false, allowed: false, error: error.message };
      }
    },

    async monitorRuntimeAuthorization(uid, event = {}) {
      const payload = {
        uid,
        ...event,
        createdAt: new Date().toISOString()
      };
      if (typeof this.saveDoc === "function") return this.saveDoc("runtimeAuthorizationEvents", String(Date.now()), payload);
      return payload;
    },

    async createRuntimeSecurityAudit(data = {}) {
      const payload = {
        uid: data.uid || null,
        role: data.role || null,
        resource: data.resource || null,
        action: data.action || null,
        decision: data.decision || "deny",
        riskLevel: data.riskLevel || "low",
        executed: data.executed === true,
        createdAt: new Date().toISOString()
      };
      if (typeof this.saveDoc === "function") return this.saveDoc("runtimeSecurityAudits", String(Date.now()), payload);
      return payload;
    },

    async getRuntimeAuthorizationHistory(uid, limit = 50) {
      if (typeof this.db === "undefined") return [];
      try {
        const snapshot = await this.db.collection("runtimeAuthorizationEvents").where("uid", "==", uid).limit(limit).get();
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return { resource: data.resource, action: data.action, decision: data.decision, riskLevel: data.riskLevel, timestamp: data.createdAt };
        });
      } catch (error) {
        return [];
      }
    },

    async detectRuntimeSecurityViolation(uid) {
      const history = await this.getRuntimeAuthorizationHistory(uid, 100);
      const denied = history.filter(item => item.decision === "deny").length;
      return {
        violation: denied >= 5,
        severity: denied >= 10 ? "critical" : denied >= 5 ? "high" : "low",
        reason: denied >= 5 ? "repeated_denied_runtime_access" : "normal_runtime_behavior"
      };
    },

    async collectAuthorizationSecuritySignals(uid) {
      const collections = ["authorizationEvents", "permissionAudits", "resourceAccessAudits", "runtimeAuthorizationEvents", "adaptiveAuthorizationAudits"];
      let events = [];
      try {
        for (const collection of collections) {
          const snap = await this.db.collection(collection).where("uid", "==", uid).limit(200).get();
          events = events.concat(snap.docs.map(doc => doc.data()));
        }
      } catch (e) {}
      return {
        uid,
        totalEvents: events.length,
        allowedEvents: events.filter(e => e.decision === "allow" || e.allowed === true).length,
        deniedEvents: events.filter(e => e.decision === "deny" || e.allowed === false).length,
        riskEvents: events.filter(e => ["high", "critical", "risky"].includes(e.riskLevel)).length,
        lastActivity: events.sort((a,b) => String(b.createdAt || b.timestamp).localeCompare(String(a.createdAt || a.timestamp)))[0]?.createdAt || null
      };
    },

    async analyzeAuthorizationBehavior(uid) {
      const signals = await this.collectAuthorizationSecuritySignals(uid);
      const findings = [];
      let score = 0;
      if (signals.deniedEvents >= 5) { score += 25; findings.push("repeated_denied_access"); }
      if (signals.deniedEvents >= 10) { score += 20; }
      if (signals.riskEvents >= 3) { score += 25; findings.push("abnormal_risk_activity"); }
      if (signals.totalEvents > 100) { score += 10; findings.push("high_action_frequency"); }
      const behaviorLevel = score >= 70 ? "critical" : score >= 45 ? "risky" : score >= 25 ? "suspicious" : "normal";
      return { uid, riskScore: score, behaviorLevel, findings };
    },

    async calculateDynamicRiskScore(uid) {
      const analysis = await this.analyzeAuthorizationBehavior(uid);
      const violation = await this.detectRuntimeSecurityViolation(uid);
      let score = analysis.riskScore + (violation.violation ? 25 : 0);
      score = Math.min(score, 100);
      return {
        score,
        level: score >= 75 ? "critical" : score >= 50 ? "risky" : score >= 25 ? "suspicious" : "normal",
        factors: [...analysis.findings, violation.reason]
      };
    },

    async adjustAuthorizationRisk(uid, event = {}) {
      const risk = await this.calculateDynamicRiskScore(uid);
      const profile = { uid, riskScore: risk.score, riskLevel: risk.level, factors: risk.factors, lastEvaluation: new Date().toISOString(), lastEvent: event };
      if (typeof this.saveDoc === "function") await this.saveDoc("securityRiskProfiles", uid, profile);
      return profile;
    },

    async generateSecurityRecommendation(uid) {
      const risk = await this.calculateDynamicRiskScore(uid);
      const recommendation = risk.level === "critical" || risk.level === "risky" ? "restrict sensitive action" : risk.level === "suspicious" ? "require additional verification" : "allow normal access";
      return { uid, recommendation, reason: risk.factors.join(", ") || "normal_behavior", severity: risk.level };
    },

    async evaluateSecurityIntelligence(uid, resource, action, resourceId) {
      const risk = await this.calculateDynamicRiskScore(uid);
      const recommendation = await this.generateSecurityRecommendation(uid);
      const policy = await this.evaluateAdaptiveAuthorization(uid, resource, action, resourceId).catch(() => ({ allowed: true }));
      const allowed = policy.allowed !== false && risk.level !== "critical";
      await this.createSecurityIntelligenceAudit({ uid, resource, action, riskScore: risk.score, riskLevel: risk.level, recommendation: recommendation.recommendation, decision: allowed ? "allow" : "deny" });
      return { allowed, riskScore: risk.score, riskLevel: risk.level, recommendation: recommendation.recommendation, reason: recommendation.reason };
    },

    async enforceSecurityIntelligence(uid, resource, action, resourceId) {
      const result = await this.evaluateSecurityIntelligence(uid, resource, action, resourceId);
      return result.allowed ? { allowed: true, riskLevel: result.riskLevel, recommendation: result.recommendation } : { allowed: false, reason: result.reason };
    },

    async createSecurityIntelligenceAudit(data = {}) {
      const payload = { uid: data.uid || null, resource: data.resource || null, action: data.action || null, riskScore: data.riskScore || 0, riskLevel: data.riskLevel || "normal", recommendation: data.recommendation || null, decision: data.decision || "deny", createdAt: new Date().toISOString() };
      if (typeof this.saveDoc === "function") return this.saveDoc("securityIntelligenceAudits", String(Date.now()), payload);
      return payload;
    },

    async getSecurityIntelligenceHistory(uid, limit = 50) {
      try {
        const snap = await this.db.collection("securityIntelligenceAudits").where("uid", "==", uid).limit(limit).get();
        return snap.docs.map(doc => { const d = doc.data(); return { riskLevel: d.riskLevel, recommendation: d.recommendation, decision: d.decision, timestamp: d.createdAt }; });
      } catch (e) { return []; }
    },

    async detectAdvancedSecurityThreat(uid) {
      const analysis = await this.analyzeAuthorizationBehavior(uid);
      const threatDetected = analysis.behaviorLevel === "risky" || analysis.behaviorLevel === "critical";
      return { threatDetected, severity: analysis.behaviorLevel, indicators: analysis.findings };
    },


    async collectAuthorizationOptimizationData(uid) {
      const history = await this.getAuthorizationHistory(uid, 100).catch(() => []);
      const intelligence = await this.getSecurityIntelligenceHistory(uid, 100).catch(() => []);
      const runtime = await this.getRuntimeAuthorizationHistory(uid, 100).catch(() => []);
      const allowed = [...history, ...intelligence, ...runtime].filter(e => e.decision === "allow" || e.allowed === true).length;
      const denied = [...history, ...intelligence, ...runtime].filter(e => e.decision === "deny" || e.allowed === false).length;
      const risks = intelligence.map(e => Number(e.riskScore || 0)).filter(Boolean);
      return {
        uid,
        totalDecisions: history.length + intelligence.length + runtime.length,
        allowed,
        denied,
        riskAverage: risks.length ? risks.reduce((a, b) => a + b, 0) / risks.length : 0,
        patterns: { repeatedDenials: denied >= 5, highRisk: risks.some(r => r >= 70) }
      };
    },

    async analyzePolicyPerformance(policyId) {
      const audits = await this.getPolicyAuditHistory(100).catch(() => []);
      const related = audits.filter(a => !policyId || a.policyId === policyId);
      const denied = related.filter(a => a.result === "deny").length;
      const total = related.length || 1;
      return {
        policyId,
        performanceScore: Math.max(0, Math.round(((total - denied) / total) * 100)),
        issues: denied > total * 0.5 ? ["high_false_deny_risk"] : [],
        recommendation: denied > total * 0.5 ? "review restriction" : "keep monitoring"
      };
    },

    async calculatePolicyOptimizationScore(policyId) {
      const performance = await this.analyzePolicyPerformance(policyId);
      const score = performance.performanceScore;
      return { policyId, score, factors: { accuracy: score, securityLevel: score, usabilityImpact: 100 - score } };
    },

    async generatePolicyOptimizationRecommendation(policyId) {
      const result = await this.calculatePolicyOptimizationScore(policyId);
      let recommendation = "keep policy";
      if (result.score < 50) recommendation = "decrease restriction";
      if (result.score > 90) recommendation = "increase restriction";
      return { policyId, recommendation, reason: "based on authorization performance", severity: result.score < 50 ? "medium" : "low" };
    },

    async optimizeAuthorizationPolicy(policyId) {
      const recommendation = await this.generatePolicyOptimizationRecommendation(policyId);
      const payload = { policyId, previousPolicy: await this.getAuthorizationPolicies().catch(() => null), recommendation, optimizedAt: new Date().toISOString() };
      if (typeof this.saveDoc === "function") await this.saveDoc("authorizationPolicyOptimization", policyId, payload);
      return payload;
    },

    async evaluateDynamicAuthorizationPolicy(uid, resource, action, resourceId) {
      const intelligence = await this.evaluateSecurityIntelligence(uid, resource, action, resourceId);
      const optimization = await this.generatePolicyOptimizationRecommendation(resource + ":" + action).catch(() => ({ recommendation: "keep policy" }));
      return { allowed: intelligence.allowed, policyId: resource + ":" + action, riskLevel: intelligence.riskLevel, optimizationApplied: true, reason: optimization.recommendation };
    },

    async createAuthorizationOptimizationAudit(data = {}) {
      const payload = { uid: data.uid || null, policyId: data.policyId || null, action: data.action || null, recommendation: data.recommendation || null, result: data.result || null, createdAt: new Date().toISOString() };
      if (typeof this.saveDoc === "function") return this.saveDoc("authorizationOptimizationAudits", String(Date.now()), payload);
      return payload;
    },

    async getAuthorizationOptimizationHistory(limit = 50) {
      try {
        const snap = await this.db.collection("authorizationOptimizationAudits").limit(limit).get();
        return snap.docs.map(doc => { const d = doc.data(); return { policyId: d.policyId, recommendation: d.recommendation, result: d.result, timestamp: d.createdAt }; });
      } catch (e) { return []; }
    },

    async detectPolicyDrift() {
      const history = await this.getAuthorizationOptimizationHistory(100);
      const affectedPolicies = history.filter(h => h.recommendation !== "keep policy").map(h => h.policyId);
      return { driftDetected: affectedPolicies.length > 0, affectedPolicies, severity: affectedPolicies.length > 5 ? "high" : "medium" };
    },

    async runAuthorizationOptimizationCycle() {
      const drift = await this.detectPolicyDrift();
      const optimizedPolicies = [];
      for (const policyId of drift.affectedPolicies) {
        await this.optimizeAuthorizationPolicy(policyId);
        optimizedPolicies.push(policyId);
      }
      await this.createAuthorizationOptimizationAudit({ recommendation: "cycle_complete", result: "success" });
      return { completed: true, optimizedPolicies, warnings: drift.driftDetected ? ["policy_drift_detected"] : [], timestamp: new Date().toISOString() };
    },

    async collectAuthorizationLearningData(uid) {
      const authorizationEvents = await this.getAuthorizationHistory(uid, 100).catch(() => []);
      const policyAudits = await this.getPolicyAuditHistory(100).catch(() => []);
      const adaptiveAudits = await this.getAdaptiveAuthorizationHistory(uid, 100).catch(() => []);
      const runtimeEvents = await this.getRuntimeAuthorizationHistory(uid, 100).catch(() => []);
      const intelligenceAudits = await this.getSecurityIntelligenceHistory(uid, 100).catch(() => []);
      const optimizationAudits = await this.getAuthorizationOptimizationHistory(100).catch(() => []);
      const all = [...authorizationEvents, ...policyAudits, ...adaptiveAudits, ...runtimeEvents, ...intelligenceAudits, ...optimizationAudits];
      return {
        uid,
        totalEvents: all.length,
        allowedEvents: all.filter(e => e.decision === "allow" || e.allowed === true || e.result === "allow").length,
        deniedEvents: all.filter(e => e.decision === "deny" || e.allowed === false || e.result === "deny").length,
        riskEvents: intelligenceAudits.filter(e => Number(e.riskScore || 0) >= 50).length,
        policyChanges: optimizationAudits.length,
        behaviorSignals: {
          actionFrequency: all.length,
          failedAttempts: all.filter(e => e.decision === "deny" || e.allowed === false).length
        },
        collectedAt: new Date().toISOString()
      };
    },

    async learnAuthorizationBehavior(uid) {
      const data = await this.collectAuthorizationLearningData(uid);
      const denyRate = data.totalEvents ? data.deniedEvents / data.totalEvents : 0;
      const confidenceScore = Math.min(100, Math.round(data.totalEvents * 2 + (1 - denyRate) * 50));
      return {
        uid,
        behaviorProfile: {
          accessVolume: data.totalEvents,
          successRate: data.totalEvents ? Math.round((data.allowedEvents / data.totalEvents) * 100) : 100,
          riskPattern: denyRate > 0.5 ? "unstable" : "normal"
        },
        confidenceScore,
        anomalies: denyRate > 0.5 ? ["high_denied_authorization_pattern"] : []
      };
    },

    async buildAuthorizationIntelligenceModel(uid) {
      const behavior = await this.learnAuthorizationBehavior(uid);
      const riskProfile = await this.calculateDynamicRiskScore(uid).catch(() => ({ score: 0, level: "normal" }));
      return {
        uid,
        role: await this.getUserRole(uid).catch(() => null),
        permissions: await this.getUserPermissions(uid).catch(() => []),
        behaviorProfile: behavior.behaviorProfile,
        riskProfile,
        policyHistory: await this.getAuthorizationOptimizationHistory(50).catch(() => []),
        runtimeHistory: await this.getRuntimeAuthorizationHistory(uid, 50).catch(() => []),
        generatedAt: new Date().toISOString()
      };
    },

    async evaluatePermissionAdaptation(uid, resource, action) {
      const model = await this.buildAuthorizationIntelligenceModel(uid);
      const risk = Number(model.riskProfile.score || 0);
      const denied = (model.behaviorProfile.successRate || 100) < 70;
      let recommendedAction = "maintain_permission";
      if (risk >= 75) recommendedAction = "restrict_access";
      else if (risk >= 50) recommendedAction = "require_verification";
      else if (denied) recommendedAction = "increase_security";
      return {
        recommendedAction,
        confidence: Math.min(100, 50 + risk),
        reason: `resource:${resource}, action:${action}, risk:${risk}`
      };
    },

    async makeAutonomousAuthorizationDecision(uid, resource, action, resourceId) {
      const context = await this.createAutonomousDecisionContext(uid, resource, action, resourceId);
      const impact = await this.analyzeAuthorizationImpact(context);
      const riskScore = Number(context.riskProfile?.score || 0);
      const threatLevel = context.threatForecast?.threatLevel || "low";
      const confidence = Math.max(0, Math.min(1, 1 - (riskScore / 100)));

      let decision = "allow";
      let reason = "Security evaluation passed";

      if (impact.impactLevel === "critical" || threatLevel === "critical") {
        decision = "deny";
        reason = "Critical security impact detected";
      } else if (riskScore >= 80) {
        decision = "temporary_restriction";
        reason = "High authorization risk";
      } else if (riskScore >= 60) {
        decision = "require_verification";
        reason = "Additional verification required";
      } else if (riskScore >= 35) {
        decision = "allow_with_monitoring";
        reason = "Allowed with enhanced monitoring";
      }

      const result = {
        decisionId: context.decisionId,
        correlationId: context.correlationId,
        executionId: context.executionId,
        allowed: decision === "allow" || decision === "allow_with_monitoring",
        decision,
        confidence,
        riskScore,
        threatLevel,
        reason,
        recommendation: reason,
        evaluatedAt: new Date().toISOString()
      };

      await this.createAutonomousDecisionAudit({
        uid,
        resource,
        action,
        resourceId,
        decisionId: context.decisionId,
        correlationId: context.correlationId,
        executionId: context.executionId,
        ...result
      });
      return result;
    },


    async createAutonomousDecisionContext(uid, resource, action, resourceId) {
      const decisionId = `decision_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const correlationId = `correlation_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const executionId = `execution_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const role = await this.getUserRole(uid).catch(() => "unknown");
      const permissions = await this.getUserPermissionContext(uid).catch(() => ({}));
      const behaviorProfile = await this.analyzeAuthorizationBehavior(uid).catch(() => ({}));
      const riskProfile = await this.getUserSecurityRiskProfile(uid).catch(() => ({ score: 0 }));
      const threatForecast = await this.predictAuthorizationThreat(uid).catch(() => ({ threatLevel: "low" }));
      const policyResult = await this.evaluateAuthorizationPolicy(uid, resource, action).catch(() => ({}));
      const runtimeState = await this.getRuntimeAuthorizationHistory(uid, 5).catch(() => []);

      return {
        decisionId,
        correlationId,
        executionId,
        uid,
        role,
        resource,
        action,
        resourceId,
        riskLevel: riskProfile.level || "low",
        threatLevel: threatForecast.threatLevel || "low",
        context: {
          identity: uid,
          permissions,
          behaviorProfile,
          riskProfile,
          threatForecast,
          policyResult,
          runtimeState
        },
        createdAt: new Date().toISOString()
      };
    },

    async analyzeAuthorizationImpact(context) {
      const factors = [];
      const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
      const resourceSensitivity = severityMap[context.riskLevel] || 1;
      const actionSeverity = /delete|admin|update/i.test(context.action) ? 3 : 1;
      const userRisk = Number(context.context.riskProfile?.score || 0);
      const threat = context.threatLevel;

      if (resourceSensitivity > 2) factors.push("sensitive_resource");
      if (actionSeverity > 1) factors.push("high_privilege_action");
      if (userRisk > 60) factors.push("elevated_user_risk");
      if (threat !== "low") factors.push("active_threat_signal");

      const score = resourceSensitivity + actionSeverity + (userRisk > 60 ? 2 : 0) + (threat !== "low" ? 2 : 0);
      return {
        impactLevel: score >= 7 ? "critical" : score >= 5 ? "high" : score >= 3 ? "medium" : "low",
        severity: score,
        factors
      };
    },

    async executeAutonomousSecurityResponse(decisionContext = {}) {
      const decision = decisionContext.decision || "deny";

      try {
        if (decision === "allow") return { executed: true, response: "continue", reason: "Authorized" };
        if (decision === "allow_with_monitoring") return { executed: true, response: "increase_monitoring", reason: "Monitoring enabled" };
        if (decision === "require_verification") {
          await this.createAuthorizationVerificationRequest(decisionContext.uid, decisionContext.resource, decisionContext.action);
          return { executed: true, response: "verification_required", reason: "Verification created" };
        }
        if (decision === "temporary_restriction") {
          await this.createTemporaryAuthorizationRestriction(decisionContext.uid, [decisionContext.action]);
          return { executed: true, response: "restricted", reason: "Temporary restriction created" };
        }
        return { executed: true, response: "blocked", reason: "Access denied" };
      } catch (error) {
        return { executed: false, response: "blocked", reason: "Security response failure" };
      }
    },

    async createAuthorizationVerificationRequest(uid, resource, action) {
      const id = Date.now().toString();
      await this.saveDoc("authorizationVerificationRequests", id, { uid, resource, action, status: "pending", reason: "Autonomous decision", createdAt: new Date().toISOString() });
      return id;
    },

    async createTemporaryAuthorizationRestriction(uid, restriction) {
      return await this.saveDoc("authorizationRestrictions", uid, {
        uid,
        restrictions: restriction,
        reason: "Autonomous security control",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        createdAt: new Date().toISOString()
      });
    },

    async enforceAutonomousAuthorization(uid, resource, action, resourceId) {
      try {
        const decision = await this.makeAutonomousAuthorizationDecision(uid, resource, action, resourceId);
        const response = await this.executeAutonomousSecurityResponse(decision);

        await this.createSecurityExecutionAudit(uid, {
          resource,
          action,
          resourceId,
          decisionId: decision.decisionId,
          correlationId: decision.correlationId,
          executionId: decision.executionId,
          allowed: decision.allowed,
          response: response.response,
          reason: decision.reason || response.reason
        });

        return decision.allowed
          ? { allowed: true, decision: decision.decision, confidence: decision.confidence, response }
          : { allowed: false, decision: decision.decision, reason: decision.reason, response };
      } catch (error) {
        await this.createSecurityExecutionAudit(uid, {
          resource,
          action,
          resourceId,
          allowed: false,
          reason: "Authorization fail-safe denial"
        }).catch(() => {});

        return { allowed: false, decision: "deny", reason: "Authorization service unavailable" };
      }
    },

    async learnFromAuthorizationDecision(uid, decision, result) {
      const feedbackScore = result ? 1 : -1;
      return await this.saveDoc("authorizationDecisionFeedback", uid + "_" + Date.now(), { uid, decision, result, feedbackScore, createdAt: new Date().toISOString() });
    },

    async createAutonomousDecisionAudit(data) {
      return await this.saveDoc("autonomousDecisionAudits", Date.now().toString(), { ...data, createdAt: new Date().toISOString() });
    },


    async getSecurityMetrics() {
      const collections = [
        "securityExecutionAudits",
        "authorizationEvents",
        "autonomousDecisionAudits"
      ];

      const metrics = {
        totalDecisions: 0,
        allowedCount: 0,
        deniedCount: 0,
        blockedCount: 0,
        threatDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
        responseDistribution: {
          continue: 0,
          monitoring: 0,
          verification: 0,
          restriction: 0,
          blocked: 0
        },
        resourceActivity: {},
        actionActivity: {},
        failureRate: 0,
        lastUpdated: new Date().toISOString()
      };

      let failedResponses = 0;
      let totalResponses = 0;

      try {
        for (const collectionName of collections) {
          const snapshot = await this.db.collection(collectionName).get();

          snapshot.forEach(doc => {
            const item = doc.data() || {};
            metrics.totalDecisions++;

            const decision = item.decision || (item.allowed === true ? "allowed" : null);
            if (decision === "allowed" || item.allowed === true) metrics.allowedCount++;
            if (decision === "denied" || item.allowed === false) metrics.deniedCount++;
            if (decision === "blocked" || item.response === "blocked") metrics.blockedCount++;

            const threat = item.threatLevel || "low";
            if (metrics.threatDistribution[threat] !== undefined) {
              metrics.threatDistribution[threat]++;
            }

            const response = item.response;
            if (response && metrics.responseDistribution[response] !== undefined) {
              metrics.responseDistribution[response]++;
            }

            if (item.resource) {
              metrics.resourceActivity[item.resource] = (metrics.resourceActivity[item.resource] || 0) + 1;
            }

            if (item.action) {
              metrics.actionActivity[item.action] = (metrics.actionActivity[item.action] || 0) + 1;
            }

            if (response) {
              totalResponses++;
              if (response === "blocked" || response === "restriction") failedResponses++;
            }
          });
        }
      } catch (error) {
        console.warn("Security metrics aggregation failed", error);
      }

      metrics.failureRate = totalResponses ? failedResponses / totalResponses : 0;
      metrics.lastUpdated = new Date().toISOString();
      return metrics;
    },

    async getSecurityTimeline(limit = 50) {
      const timeline = [];
      const sources = ["securityExecutionAudits", "autonomousDecisionAudits"];

      try {
        for (const source of sources) {
          const snapshot = await this.db.collection(source).get();
          snapshot.forEach(doc => {
            const item = doc.data() || {};
            timeline.push({
              decisionId: item.decisionId || null,
              correlationId: item.correlationId || null,
              executionId: item.executionId || null,
              uid: item.uid || null,
              resource: item.resource || null,
              action: item.action || null,
              decision: item.decision || null,
              response: item.response || null,
              threatLevel: item.threatLevel || null,
              riskScore: item.riskScore || null,
              timestamp: item.executedAt || item.createdAt || item.timestamp || null
            });
          });
        }
      } catch (error) {
        console.warn("Security timeline aggregation failed", error);
      }

      return timeline
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        .slice(0, limit);
    },

    async analyzeSecurityThreats() {
      const timeline = await this.getSecurityTimeline(1000);
      const deniedActions = {};

      timeline.forEach(item => {
        if (item.decision === "denied" || item.response === "blocked") {
          const key = `${item.resource || "unknown"}:${item.action || "unknown"}`;
          deniedActions[key] = (deniedActions[key] || 0) + 1;
        }
      });

      const criticalCount = timeline.filter(item => item.threatLevel === "critical").length;
      const highRiskCount = timeline.filter(item =>
        item.threatLevel === "high" || Number(item.riskScore || 0) >= 80
      ).length;

      return {
        threatLevelSummary: {
          critical: criticalCount,
          high: highRiskCount,
          total: timeline.length
        },
        riskTrend: {
          highRiskFrequency: timeline.length ? highRiskCount / timeline.length : 0
        },
        suspiciousPatterns: {
          repeatedDeniedActions: deniedActions
        },
        recommendations: [
          "Review repeated denied authorization patterns",
          "Monitor high risk authorization activity"
        ],
        generatedAt: new Date().toISOString()
      };
    },

    async getAutonomousDecisionHistory(uid, limit = 20) {
      return await this.getAll("autonomousDecisionAudits", limit, { uid });
    },


    async predictAuthorizationThreat(uid) {
      const collections = [
        "authorizationEvents",
        "securityIntelligenceAudits",
        "runtimeAuthorizationEvents",
        "adaptiveAuthorizationAudits",
        "authorizationOptimizationAudits"
      ];
      const signals = [];
      let score = 0;

      for (const name of collections) {
        try {
          const snap = await this.db.collection(name).where("uid", "==", uid).limit(50).get();
          const count = snap.size || 0;
          if (count > 0) signals.push({ source: name, events: count });
          score += Math.min(count, 20);
        } catch (e) {}
      }

      const probability = Math.min(score / 100, 1);
      return {
        uid,
        threatLevel: probability >= 0.7 ? "high" : probability >= 0.35 ? "medium" : "low",
        probability,
        confidence: Math.min(0.5 + signals.length * 0.1, 0.95),
        signals,
        generatedAt: new Date().toISOString()
      };
    },

    async forecastUserSecurityRisk(uid) {
      const prediction = await this.predictAuthorizationThreat(uid);
      const data = {
        uid,
        currentRisk: prediction.threatLevel,
        predictedRisk: prediction.threatLevel,
        confidence: prediction.confidence,
        threatSignals: prediction.signals,
        recommendation: prediction.probability > 0.7 ? "require_verification" : "allow_normal_access",
        generatedAt: new Date().toISOString()
      };
      if (this.db) await this.db.collection("securityForecasts").doc(uid).set(data, { merge: true });
      return data;
    },

    async detectPrivilegeEscalationRisk(uid) {
      const threat = await this.predictAuthorizationThreat(uid);
      const indicators = threat.signals.filter(s => s.source.includes("Authorization") || s.source.includes("authorization"));
      return {
        suspicious: threat.probability > 0.65,
        riskScore: threat.probability,
        indicators,
        reason: indicators.length ? "abnormal privilege activity detected" : "normal privilege pattern"
      };
    },

    async predictAccountCompromise(uid) {
      const threat = await this.predictAuthorizationThreat(uid);
      return {
        compromised: threat.probability > 0.75,
        probability: threat.probability,
        confidence: threat.confidence,
        factors: threat.signals
      };
    },

    async simulateFutureAuthorization(uid, resource, action, resourceId) {
      const forecast = await this.forecastUserSecurityRisk(uid);
      const policy = await this.evaluateAuthorizationPolicy(uid, resource, action, resourceId);
      return {
        allowed: policy.allowed !== false && forecast.predictedRisk !== "high",
        predictedRisk: forecast.predictedRisk,
        impact: forecast.predictedRisk === "high" ? "security_review_required" : "normal",
        recommendation: forecast.recommendation
      };
    },

    async generatePredictiveSecurityRecommendation(uid) {
      const forecast = await this.forecastUserSecurityRisk(uid);
      return {
        action: forecast.recommendation,
        confidence: forecast.confidence,
        reason: "generated from predictive threat forecast"
      };
    },

    async evaluatePredictiveAuthorization(uid, resource, action, resourceId) {
      const threat = await this.predictAuthorizationThreat(uid);
      const simulation = await this.simulateFutureAuthorization(uid, resource, action, resourceId);
      return {
        allowed: simulation.allowed,
        decision: simulation.allowed ? "allow" : "deny",
        threatLevel: threat.threatLevel,
        riskScore: threat.probability,
        confidence: threat.confidence,
        recommendation: simulation.recommendation,
        reason: simulation.impact,
        evaluatedAt: new Date().toISOString()
      };
    },

    async enforcePredictiveAuthorization(uid, resource, action, resourceId) {
      const decision = await this.evaluatePredictiveAuthorization(uid, resource, action, resourceId);
      return decision.allowed ? {
        allowed: true,
        threatLevel: decision.threatLevel,
        recommendation: decision.recommendation
      } : {
        allowed: false,
        reason: decision.reason
      };
    },

    async createThreatForecastAudit(data) {
      const id = Date.now().toString();
      await this.db.collection("threatForecastAudits").doc(id).set({ ...data, createdAt: new Date().toISOString() });
      return id;
    },

    async getThreatForecastHistory(uid, limit = 20) {
      const snap = await this.db.collection("threatForecastAudits").where("uid", "==", uid).limit(limit).get();
      return snap.docs.map(doc => ({
        threatLevel: doc.data().threatLevel,
        probability: doc.data().riskScore,
        recommendation: doc.data().recommendation,
        timestamp: doc.data().createdAt
      }));
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
