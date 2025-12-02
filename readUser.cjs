const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function readUser(uid) {
  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();

  console.log("\n=== USER DOCUMENT ===");
  console.log(snap.data());

  console.log("\n=== SUBCOLLECTIONS ===");
  const collections = await userRef.listCollections();

  for (const col of collections) {
    console.log(`\n> ${col.id}`);
    const docs = await col.get();
    docs.forEach((d) => {
      console.log(" -", d.id, d.data());
    });
  }
}

readUser("JPfWWzs33fNCSbWXLGPbfnf3EQy1");
