# 🔐 Firestore Security Rules — ZapNowApp

ไฟล์: **`firestore.rules`** (root โปรเจกต์ — ระดับเดียวกับ `index.html`, `server.js`)

---

## 1) โมเดลสิทธิ์โดยรวม

ระบบยืนยันตัวตนอิง **Firebase Auth** — ทุกสิทธิ์เช็คจาก `request.auth.uid` (ไม่ไว้วางใจค่าที่ client ส่งมาเฉย ๆ):

| บทบาท | ระบุตัวตนด้วย |
|---|---|
| ลูกค้า | `users` doc id = auth uid (ตอนนี้ app ใช้ `cust-<เบอร์>`) |
| ร้านค้า | `restaurants.ownerId` = auth uid (ตอนนี้ app ใช้ `rest-<id>`) |
| ไรเดอร์ | `riders` doc id = auth uid (ตอนนี้ app ใช้ `rider-xxxxxx`) |
| แอดมิน | custom claim `admin == true` **หรือ** users doc ตัวเองมี `role == 'admin'` |

> ตาราง "ตอนนี้ app ใช้..." = doc id ที่ **สะพาน Firebase ใน menu-data.js เขียนอยู่แล้ว** — เมื่อต่อ Firebase Auth เสร็จ ให้กำหนดให้ auth uid ของผู้ใช้แต่ละคนเท่ากับ doc id เหล่านั้น (หรือย้ายเป็น uid ใหม่แล้วแก้ field ให้ตรง) rules จะบังคับสิทธิ์ได้ทันที

---

## 2) อธิบายทีละส่วน

### 🔧 Helper functions (บนสุดของไฟล์)

| ฟังก์ชัน | ทำงาน |
|---|---|
| `signedIn()` | มี `request.auth` หรือไม่ (ล็อกอินแล้ว) |
| `isAdminClaim()` | token มี custom claim `admin == true` (ตั้งที่ Firebase Console) |
| `isAdminUser()` | users doc ของตัวเอง (doc id = auth uid) มี `role == 'admin'` — อ่านผ่าน `get()` |
| `isAdmin()` | `isAdminClaim() || isAdminUser()` — แอดมินแบบไหนก็ได้ |
| `isOwner(field)` | `resource.data[field] == request.auth.uid` — เช็คว่าเป็นเจ้าของเอกสารนี้ |
| `isOwnerOrAdmin(field)` | เจ้าของหรือแอดมิน |
| `isRestaurantOwner(restaurantId)` | อ่าน `restaurants/<id>.ownerId` เทียบ auth uid — **ต้อง `exists()` ก่อน `get()`** (กัน get() error ตอนเอกสารไม่มี) |

### 👤 users — "เจ้าของแก้ไขตัวเองได้ · admin ดูทั้งหมดได้"

```
allow read:   if signedIn() && (request.auth.uid == uid || isAdmin());
allow create: if signedIn() && request.auth.uid == uid && request.resource.data.uid == uid;
allow update: if signedIn() && request.auth.uid == uid && request.resource.data.uid == uid;
allow delete: if false;
```

- **อ่าน**: เฉพาะเจ้าของโปรไฟล์ตัวเอง + แอดมิน (ลูกค้าคนอื่นเห็นข้อมูลเราไม่ได้)
- **สร้าง**: ลงทะเบียนตัวเองได้ — บังคับ `uid` ตรงกันทั้ง **doc id** และ **data.uid** กับ **auth uid** = กันปลอมตัวเป็นคนอื่น
- **แก้ไข**: เจ้าของเท่านั้น และห้ามเปลี่ยน `data.uid` (กันย้ายบัญชี/แย่ง)
- **ลบ**: ปิด — กันลบผู้ใช้พลาด ให้แอดมินลบผ่าน Console

### 🏪 restaurants — "owner แก้ร้านตัวเอง · ลูกค้าอ่านได้"

```
allow read:   if true;
allow create: if signedIn() && (request.resource.data.ownerId == request.auth.uid || isAdmin());
allow update: if signedIn() && (request.resource.data.ownerId == request.auth.uid || resource.data.ownerId == request.auth.uid || isAdmin());
allow delete: if isAdmin();
```

- **อ่าน**: สาธารณะ — หน้าร้านลูกค้าเปิดดูร้าน/คะแนน/เวลาปิดเปิดได้โดยไม่ต้องล็อกอิน (ข้อมูลแคตตาล็อกไม่ใช่ความลับ)
- **สร้าง**: ต้องระบุตัวเองเป็น `ownerId` (กันใครก็ได้อ้างเป็นเจ้าของร้าน) + แอดมินสร้างได้ (ใช้ตอน seed)
- **แก้ไข**: เจ้าของ (เช็คทั้ง data เดิมและ data ใหม่) หรือแอดมิน — ร้านอื่นแก้ร้านเราไม่ได้
- **ลบ**: แอดมินเท่านั้น — กันเจ้าของลบร้านทิ้งกระทบประวัติออเดอร์/การเงิน

### 📋 menus — "owner ของร้านนั้นเพิ่ม/แก้เมนู · ลูกค้าอ่านได้"

```
allow read:   if true;
allow create, update: if signedIn() && (isRestaurantOwner(request.resource.data.restaurantId) || isAdmin());
allow delete: if signedIn() && (isRestaurantOwner(resource.data.restaurantId) || isAdmin());
```

- **อ่าน**: สาธารณะ (ลูกค้า/ทุกคนดูเมนูได้)
- **เขียน**: ต้องเป็นเจ้าของร้านที่เมนูนั้นสังกัด — เช็คย้อนไปที่ `restaurants/<restaurantId>.ownerId` (subquery ด้วย `get()`) — เมนูของร้านอื่นแก้ไม่ได้ แม้รู้ id

### 🧾 orders — "ลูกค้าเห็นของตัวเอง · ร้านเห็นของร้านตัวเอง · ไรเดอร์เห็นงานที่รับ · admin เห็นหมด"

```
allow read: if signedIn() && (
  request.auth.uid == resource.data.customerId ||    // ลูกค้า
  request.auth.uid == resource.data.riderId ||       // ไรเดอร์ที่รับแล้ว
  resource.data.status == 'พร้อมส่ง' ||              // ไรเดอร์เห็น pool งานรอรับ
  isRestaurantOwner(resource.data.restaurantId) ||   // ร้าน
  isAdmin()                                          // แอดมิน
);
allow create: if signedIn() && (request.resource.data.customerId == request.auth.uid || isAdmin());
allow update: if signedIn() && (
  isAdmin() ||
  request.auth.uid == resource.data.customerId ||                    // ลูกค้า (ยกเลิก)
  isRestaurantOwner(resource.data.restaurantId) ||                   // ร้าน (เปลี่ยนสถานะ)
  request.auth.uid == resource.data.riderId ||                       // ไรเดอร์ (ขั้นส่ง/ส่งถึง)
  (resource.data.status == 'พร้อมส่ง' &&                              // ไรเดอร์รับงาน (claim)
   request.resource.data.riderId == request.auth.uid &&
   request.resource.data.status == 'กำลังจัดส่ง')
);
allow delete: if isAdmin();
```

- **อ่าน**: ลูกค้าเห็นเฉพาะใบของตัวเอง (`customerId`), ร้านเห็นเฉพาะใบของร้านตัวเอง, ไรเดอร์เห็นงานที่รับแล้ว + **งานที่ยังรอรับ** (status `พร้อมส่ง` — ใช้ query `where status == 'พร้อมส่ง'` ที่ rules อนุญาตเอง), แอดมินเห็นทุกใบ
- **สร้าง**: ลูกค้าสั่งได้ — บังคับ `customerId` = ตัวเอง (กันสั่งในนามคนอื่น)
- **แก้ไข**: ลูกค้า (ยกเลิก/แก้), ร้าน (เลื่อนสถานะ รับ→เตรียม→พร้อมส่ง), ไรเดอร์ที่รับแล้ว (ขั้นส่ง/ส่งถึงแล้ว) — และกรณีพิเศษ "ไรเดอร์รับงาน": ออเดอร์ที่ยังเป็น `พร้อมส่ง` อัปเดตตั้งตัวเองเป็น `riderId` + สถานะเป็น `กำลังจัดส่ง`
- **ลบ**: แอดมินเท่านั้น (ออเดอร์ = หลักฐานการเงิน)

### 🛵 riders — "ไรเดอร์แก้ข้อมูลตัวเองได้"

```
allow read:   if signedIn() && (request.auth.uid == riderId || isAdmin());
allow create: if signedIn() && (request.auth.uid == riderId || request.resource.data.riderId == request.auth.uid);
allow update: if signedIn() && (request.auth.uid == riderId || isAdmin());
allow delete: if isAdmin();
```

- **อ่าน**: ตัวเอง + แอดมิน (กันไรเดอร์คนอื่นเห็นชื่อ/เบอร์เรา)
- **สร้าง**: ลงทะเบียนตัวเอง (doc id หรือ `data.riderId` ต้องตรง auth uid)
- **แก้ไข**: ตัวเองเท่านั้น (แก้ชื่อ/เบอร์/อีเมล — ตรงกับหน้าโปรไฟล์ไรเดอร์)
- **ลบ**: แอดมินเท่านั้น

---

## 3) วิธีนำไปใช้

**วิธี ก — วางใน Firebase Console (เร็วสุด):**
1. [console.firebase.google.com](https://console.firebase.google.com) → เลือกโปรเจกต์
2. **Firestore Database → Rules** (แท็บ)
3. ลบ rules เดิมทั้งหมด → วางเนื้อหาใน `firestore.rules` ทั้งหมด → **Publish**

**วิธี ข — firebase CLI (เก็บไฟล์เป็น source of truth):**
```bash
# ติดตั้ง CLI + ล็อกอิน (ครั้งแรก)
npm install -g firebase-tools
firebase login

# ในโฟลเดอร์โปรเจกต์ (มี firestore.rules อยู่แล้ว)
firebase init firestore     # เลือกโปรเจกต์ → ใช้ไฟล์ firestore.rules ที่มี
firebase deploy --only firestore:rules
```

---

## 4) ⚠️ สำคัญ — สถานะปัจจุบันของแอป

แอปตอนนี้**ยังใช้ล็อกอิน PIN ใน localStorage (ยังไม่ได้ต่อ Firebase Auth)** — `request.auth` จึงเป็น `null` เสมอ:

- **ถ้า deploy rules นี้ตอนนี้** → ทุกการเขียน Firestore จะโดนบล็อก (สั่งซื้อ/สมัครร้าน/ไรเดอร์ไม่สะท้อนขึ้น Firestore) แต่แอปยังทำงานปกติผ่าน localStorage
- **ลำดับที่แนะนำ:**
  1. วาง config จริงใน `firebase-config.js` + **ต่อ Firebase Auth** (ลูกค้า/ร้าน/ไรเดอร์สมัครด้วยอีเมล/เบอร์ → ได้ auth uid) → ให้ uid ตรงกับ doc id (ตารางข้อ 1)
  2. วาง config + **seed ข้อมูล demo ขึ้น Firestore ก่อน** (ตอน rules ยังเป็นโหมดทดสอบ — seed ครั้งเดียว)
  3. deploy rules นี้
  4. **ตั้งแอดมินคนแรก** ก่อน deploy: Firebase Console → **Authentication → Users** → เพิ่ม custom claim `admin: true` (หรือสร้าง users doc ของตัวเองใน Console ด้วย `role: "admin"`)

**ทางเลือกชั่วคราว (ถ้ายังไม่ต่อ Auth แต่ไม่อยากให้ Firestore เปิดโหมดทดสอบ):**
- เปิด **Anonymous Authentication** ใน Firebase Console แล้วให้แอป `signInAnonymously()` ตอน init → `request.auth.uid` มีค่า → rules ทำงานได้ (แต่ uid สุ่มใหม่ทุกครั้ง จึงไม่ match `cust-<เบอร์>` เดิม — ใช้ได้กับออเดอร์ใหม่ที่เขียน `customerId = uid` นั้น)

---

## 5) ข้อจำกัดที่ควรรู้

- **ไรเดอร์ 2 คนกดรับงานเดียวกันพร้อมกัน**: rules ตรวจแค่ "ออเดอร์ยังเป็น พร้อมส่ง" ตอนเขียน — เขียนพร้อมกัน 2 ครั้งอาจผ่านทั้งคู่ (last-write-wins) → **กันรับซ้ำที่แอป** ต้องใช้ **Firestore Transaction** (อ่าน → เช็ค → เขียนในครั้งเดียว) — แอปปัจจุบันกันที่เลเยอร์ localStorage แล้ว (คนแรกได้งาน) ต่อยอดเป็น transaction ได้เมื่อย้ายออเดอร์ขึ้น Firestore เต็มรูปแบบ
- **`get()` ใน rules นับเป็นการอ่าน** — หน้าจอที่กรองออเดอร์บ่อย ๆ อาจมีค่าใช้จ่าย read เพิ่ม (ทั่ว ๆ ไปไม่ใช่ปัญหาสำหรับขนาดนี้)
- **ห้ามเก็บข้อมูลลับใน field** ที่อ่านสาธารณะ (restaurants/menus) เช่น PIN ร้าน/เบอร์ไรเดอร์ — field เหล่านี้อยู่เฉพาะ users/riders ที่อ่านได้เฉพาะเจ้าของ

---

## 6) ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | ไว้ทำอะไร |
|---|---|
| `firestore.rules` | Rules หลัก — วางใน Firebase Console หรือ deploy ผ่าน CLI |
| `FIRESTORE_RULES.md` | เอกสารนี้ — อธิบายทุกส่วน |
| `firebase-lib.js` | ชั้นเชื่อม Firebase (init/Auth/Firestore + helper) |
| `menu-data.js` | สะพานเขียนข้อมูล → Firestore (เพิ่ม `customerId` ในออเดอร์ + mirror ครบทุกขั้นตอนไรเดอร์) |
