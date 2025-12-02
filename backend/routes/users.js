const express = require("express");
const { db } = require("../firebaseAdmin");
const router = express.Router();

/* =======================================================
   YARDIMCI FONKSİYONLAR
   ======================================================= */
// Firestore Timestamp veya Number tarihleri güvenli şekilde sıralamak için
const getMillis = (item, field = 'createdAt') => {
  const val = item[field];
  if (!val) return 0;
  // Eğer Firestore Timestamp objesiyse .toMillis() vardır
  if (typeof val.toMillis === 'function') return val.toMillis();
  // Eğer zaten sayıysa (timestamp number) direkt döndür
  if (typeof val === 'number') return val;
  // String ise date objesine çevir
  return new Date(val).getTime();
};

/* =======================================================
   TEMEL KULLANICI İŞLEMLERİ
   ======================================================= */

// 1. Tüm kullanıcıları getir
router.get("/", async (req, res) => {
  try {
    const snap = await db.collection("users").get();
    const users = snap.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data()
    }));
    res.send(users);
  } catch (e) {
    console.error("Fetch Users Error:", e);
    res.status(500).send({ error: e.message });
  }
});

// 2. Tek kullanıcı detayı getir
router.get("/:uid", async (req, res) => {
  try {
    const doc = await db.collection("users").doc(req.params.uid).get();
    if (!doc.exists) {
      return res.status(404).send({ error: "User not found" });
    }
    
    // Kullanıcının ana belgesindeki medicines array'ini veya diğer verileri döner
    res.send({ uid: doc.id, ...doc.data() });
  } catch (e) {
    console.error("Fetch User Detail Error:", e);
    res.status(500).send({ error: e.message });
  }
});

// 3. Kullanıcı güncelle
router.patch("/:uid", async (req, res) => {
  try {
    await db.collection("users").doc(req.params.uid).update(req.body);
    res.send({ success: true });
  } catch (e) {
    console.error("Update User Error:", e);
    res.status(500).send({ error: e.message });
  }
});

/* =======================================================
   SUB-DATA ENDPOINTS (DETAYLAR)
   ======================================================= */

// [YENİ EKLENDİ] 4. İlaçlar (Medicines)
// Frontend'deki "İlaçlar" sekmesinin çalışması için bu şart.
router.get("/:uid/medicines", async (req, res) => {
  try {
    const { uid } = req.params;
    // İlaçlar sub-collection ise:
    const snap = await db.collection("users").doc(uid).collection("medicines").get();
    
    const medicines = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    
    res.send(medicines);
  } catch (e) {
    console.error("Fetch Medicines Error:", e);
    res.status(500).send({ error: e.message });
  }
});

// 5. Medication Logs (Kullanım Geçmişi)
router.get("/:uid/medication-logs", async (req, res) => {
  try {
    const { uid } = req.params;
    // Root collection'dan sorguluyoruz
    const snap = await db
      .collection("medication_logs")
      .where("userId", "==", uid)
      .limit(100) // Performans için limit koydum
      .get();

    let logs = snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    // Javascript ile sıralama (Firestore index hatası almamak için)
    logs.sort((a, b) => getMillis(b, 'createdAt') - getMillis(a, 'createdAt'));

    res.send(logs);
  } catch (e) {
    console.error("Fetch Med Logs Error:", e);
    res.status(500).send({ error: e.message });
  }
});

// 6. Notifications (Bildirimler)
router.get("/:uid/notifications", async (req, res) => {
  try {
    const { uid } = req.params;
    const snap = await db
      .collection("notifications")
      .where("userId", "==", uid)
      .limit(50)
      .get();

    let notifs = snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    notifs.sort((a, b) => getMillis(b, 'createdAt') - getMillis(a, 'createdAt'));

    res.send(notifs);
  } catch (e) {
    console.error("Fetch Notifications Error:", e);
    res.status(500).send({ error: e.message });
  }
});

// 7. Buddies (İlaç Arkadaşları)
router.get("/:uid/buddies", async (req, res) => {
  try {
    const { uid } = req.params;

    // Paralel sorgu
    const [snapUser, snapBuddy] = await Promise.all([
        db.collection("buddies").where("userId", "==", uid).get(),
        db.collection("buddies").where("buddyUserId", "==", uid).get()
    ]);

    const fromUser = snapUser.docs.map((d) => ({
      id: d.id,
      direction: "OWNER", // Kullanıcı eklemiş
      ...d.data()
    }));

    const toUser = snapBuddy.docs.map((d) => ({
      id: d.id,
      direction: "BUDDY_OF", // Başkası kullanıcıyı eklemiş
      ...d.data()
    }));

    res.send([...fromUser, ...toUser]);
  } catch (e) {
    console.error("Fetch Buddies Error:", e);
    res.status(500).send({ error: e.message });
  }
});

// 8. Family Plan (Aile)
router.get("/:uid/family", async (req, res) => {
  try {
    const { uid } = req.params;
    let familyPlan = null;

    const userDoc = await db.collection("users").doc(uid).get();

    if (userDoc.exists) {
      const u = userDoc.data();

      // Senaryo A: Kullanıcıda ID kayıtlıysa direkt çek
      if (u.familyPlanId) {
        const fp = await db.collection("family_plans").doc(u.familyPlanId).get();
        if (fp.exists) familyPlan = { id: fp.id, ...fp.data() };
      } 
      // Senaryo B: ID yoksa üyelerden veya organizerdan ara
      else {
        const [snapMembers, snapOrg] = await Promise.all([
            db.collection("family_plans").where("currentMembers", "array-contains", uid).get(),
            db.collection("family_plans").where("organizerId", "==", uid).get()
        ]);

        if (!snapMembers.empty) {
          const fp = snapMembers.docs[0];
          familyPlan = { id: fp.id, ...fp.data() };
        } else if (!snapOrg.empty) {
          const fp = snapOrg.docs[0];
          familyPlan = { id: fp.id, ...fp.data() };
        }
      }
    }

    res.send({ familyPlan });
  } catch (e) {
    console.error("Fetch Family Error:", e);
    res.status(500).send({ error: e.message });
  }
});

// 9. Reminder Logs (Teknik Loglar - Subcollection)
router.get("/:uid/reminder-logs", async (req, res) => {
  try {
    const { uid } = req.params;

    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("reminderLogs")
      .get();

    const logs = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    // timestamp veya createdAt alanına göre sırala
    logs.sort((a, b) => {
        const timeA = a.timestamp || getMillis(a, 'createdAt');
        const timeB = b.timestamp || getMillis(b, 'createdAt');
        return timeB - timeA;
    });

    res.send(logs);
  } catch (e) {
    console.error("Fetch Reminder Logs Error:", e);
    res.status(500).send({ error: e.message });
  }
});

// 10. User Stats (İstatistikler)
router.get("/:uid/stats", async (req, res) => {
  try {
    const { uid } = req.params;

    let doc = await db.collection("user_stats").doc(uid).get();
    let stats = null;

    if (doc.exists) {
      stats = { id: doc.id, ...doc.data() };
    } else {
      const snap = await db
        .collection("user_stats")
        .where("userId", "==", uid)
        .limit(1)
        .get();

      if (!snap.empty) {
        const d = snap.docs[0];
        stats = { id: d.id, ...d.data() };
      }
    }

    res.send({ stats });
  } catch (e) {
    console.error("Fetch Stats Error:", e);
    res.status(500).send({ error: e.message });
  }
});

module.exports = router;