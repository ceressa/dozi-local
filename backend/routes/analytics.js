const express = require("express");
const { db } = require("../firebaseAdmin"); // Firebase ayar dosyanın yolu doğru olsun
const router = express.Router();

/* -------------------------------------------------------
   1. DASHBOARD VERİSİ (Grafikler için)
   Endpoint: /analytics/dashboard
------------------------------------------------------- */
router.get("/dashboard", async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysAgoTs = sevenDaysAgo.getTime();

    const logsSnap = await db.collection("medication_logs").get();
    const notifSnap = await db.collection("notifications").get();

    let totalLogs = 0;
    let takenCount = 0;
    let skippedCount = 0;
    let missedCount = 0;

    const notifSent = notifSnap.size;
    const notifRead = notifSnap.docs.filter(d => d.data().isRead).length;

    const dailyMap = {}; 
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Son 7 günü sıfırla
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayName = days[d.getDay()];
        dailyMap[dayName] = { date: dayName, taken: 0, skipped: 0, missed: 0 };
    }

    const hourlyMap = new Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, value: 0 }));
    const timeOfDayMap = { "Sabah": 0, "Öğle": 0, "Akşam": 0, "Gece": 0 };

    logsSnap.docs.forEach(doc => {
        const data = doc.data();
        totalLogs++;

        if (data.status === "TAKEN") takenCount++;
        else if (data.status === "SKIPPED") skippedCount++;
        else if (data.status === "MISSED" || data.status === "DOSE_MISSED") missedCount++;

        if (data.timestamp && data.timestamp > sevenDaysAgoTs) {
            const dateObj = new Date(Number(data.timestamp));
            const dayName = days[dateObj.getDay()];
            const hour = dateObj.getHours();

            if (dailyMap[dayName]) {
                if (data.status === "TAKEN") dailyMap[dayName].taken++;
                else if (data.status === "SKIPPED") dailyMap[dayName].skipped++;
                else if (data.status.includes("MISSED")) dailyMap[dayName].missed++;
            }

            if (data.status === "TAKEN") {
                hourlyMap[hour].value++;
                if (hour >= 6 && hour < 11) timeOfDayMap["Sabah"]++;
                else if (hour >= 11 && hour < 17) timeOfDayMap["Öğle"]++;
                else if (hour >= 17 && hour < 22) timeOfDayMap["Akşam"]++;
                else timeOfDayMap["Gece"]++;
            }
        }
    });

    const chartData = Object.values(dailyMap); 
    const pieData = [
        { name: "Taken", value: takenCount, color: "#10B981" },
        { name: "Skipped", value: skippedCount, color: "#F59E0B" },
        { name: "Missed", value: missedCount, color: "#EF4444" }
    ];
    const radarData = Object.keys(timeOfDayMap).map(key => ({ category: key, value: timeOfDayMap[key] }));

    res.send({
        summary: {
            totalMedicationLogs: totalLogs,
            taken: takenCount,
            skipped: skippedCount,
            missed: missedCount,
            notificationSent: notifSent,
            notificationRead: notifRead
        },
        charts: {
            dailyHistory: chartData,
            statusDistribution: pieData,
            hourlyActivity: hourlyMap,
            timeOfDayAdherence: radarData
        }
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).send({ error: error.message });
  }
});

/* -------------------------------------------------------
   2. TÜM HATIRLATMALAR (Dedektif Modu için)
   Endpoint: /analytics/all-reminders
------------------------------------------------------- */
router.get("/all-reminders", async (req, res) => {
  try {
    const usersSnap = await db.collection("users").get();
    const result = [];

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const user = userDoc.data();

      const medsSnap = await db.collection("users").doc(userId).collection("medicines").get();
      const logsSnap = await db.collection("users").doc(userId).collection("reminderLogs").get();

      result.push({
        userId,
        user,
        medicines: medsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        reminderLogs: logsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      });
    }

    res.send(result);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: e.message });
  }
});

module.exports = router;