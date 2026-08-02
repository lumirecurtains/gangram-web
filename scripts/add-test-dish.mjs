import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const sa = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
const app = initializeApp({ credential: cert(sa) }, "test-dish");
const db = getFirestore(app);

async function main() {
  const catSnap = await db.collection("categories").get();
  let catId = "";
  if (!catSnap.empty) {
    catId = catSnap.docs[0].id;
  }

  const testPhotoUrl = "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80";

  const res = await db.collection("menuItems").add({
    name: "🌟 Royal Shahi Thali",
    price: 290,
    desc: "Paneer butter masala, dal makhani, butter naan, jeera rice & gulab jamun",
    categoryId: catId,
    emoji: "🍲",
    tag: "Chef Special",
    photo: testPhotoUrl,
    veg: true,
    available: true,
    order: -1
  });

  console.log("SUCCESS! Added test dish with photo ID:", res.id);
}

main().catch(console.error);
