// 🌱 Seed script — demo data Firestore mein daalne ke liye (ek baar chalao)
// Usage: npm run seed
// Ye data owner dashboard mein edit ho sakta hai

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const sa = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
const app = initializeApp({ credential: cert(sa) }, "seed");
const db = getFirestore(app);

const CATEGORIES = ["Starters", "Main Course", "Breads", "Rice & Biryani", "Sweets", "Drinks"];

const MENU = [
  // [cat, name, price, desc, emoji, tag, veg]
  [0, "Paneer Tikka", 220, "Charcoal tandoor mein bhuna, masaledar paneer", "🧀", "Chef Special", 1],
  [0, "Veg Spring Rolls", 150, "Crispy rolls, hari chutney ke saath", "🌯", "", 1],
  [0, "Hara Bhara Kabab", 170, "Palak-matar ke healthy kabab", "🥬", "Healthy", 1],
  [0, "Dahi ke Kabab", 180, "Melt-in-mouth creamy kabab", "🍥", "", 1],
  [1, "Paneer Butter Masala", 240, "Rich creamy gravy, makhni tadka", "🍛", "Bestseller", 1],
  [1, "Dal Makhani", 180, "Raati 24 ghante slow-cooked", "🫘", "Signature", 1],
  [1, "Chole Bhature", 160, "Punjabi chole, fluffy bhature", "🍽️", "", 1],
  [1, "Masala Dosa", 140, "Crispy dosa, sambar-chutney", "🥞", "", 1],
  [2, "Butter Naan", 40, "Tandoori naan, butter lagakar", "🫓", "", 1],
  [2, "Tandoori Roti", 25, "Multigrain, garma-garam", "🫓", "", 1],
  [2, "Garlic Naan", 55, "Lahsun tadka wala naan", "🧄", "", 1],
  [3, "Veg Biryani", 210, "Basmati rice, kewda aroma, raita ke saath", "🍚", "Popular", 1],
  [3, "Jeera Rice", 120, "Bhuna jeera, ghee tadka", "🍚", "", 1],
  [3, "Curd Rice", 110, "Thanda comfort food", "🥣", "", 1],
  [4, "Gulab Jamun (2pc)", 80, "Garma-garam, shahi", "🍮", "Must Try", 1],
  [4, "Rasgulla (2pc)", 70, "Soft spongy, chasni wale", "⚪", "", 1],
  [4, "Kheer", 90, "Chawal ki kheer, badam-kishmish", "🥛", "", 1],
  [5, "Sweet Lassi", 90, "Malai maar ke, chhappan bhog", "🥤", "Refreshing", 1],
  [5, "Masala Chai", 30, "Adrak-elaichi wali kulhad chai", "☕", "", 1],
  [5, "Fresh Lime Soda", 60, "Sweet ya salty — aapki pasand", "🍋", "", 1],
];

async function main() {
  // Settings
  await db.collection("settings").doc("main").set({
    name: "Gangaram Dairy",
    tagline: "Ghar Ka Swaad, Seedha Aapke Darwaze Tak",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918709734024",
    address: "Station Road, Gangaram Chowk, Begusarai, Bihar",
    phone: "+91 87097 34024",
    hours: "8 AM – 10 PM",
    open: true,
    openHour: 8,
    closeHour: 22,
    holidays: [],
    banner: "",
    ownerEmails: ["YAHAN_OWNER_EMAIL_DAALO@example.com"],
    deliveryBands: [
      { km: 1, charge: 20 },
      { km: 3, charge: 40 },
      { km: 5, charge: 70 },
      { km: 99, charge: 100 },
    ],
    orderCounter: 1000,
  });
  console.log("✅ settings/main done");

  // Categories
  const catIds = [];
  for (let i = 0; i < CATEGORIES.length; i++) {
    const ref = await db.collection("categories").add({ name: CATEGORIES[i], order: i });
    catIds.push(ref.id);
    console.log(`✅ category: ${CATEGORIES[i]}`);
  }

  // Menu items
  for (let i = 0; i < MENU.length; i++) {
    const [cat, name, price, desc, emoji, tag, veg] = MENU[i];
    await db.collection("menuItems").add({
      name, price, desc, emoji, tag: tag || "", veg: veg === 1, available: true,
      photo: "", categoryId: catIds[cat], order: i,
    });
  }
  console.log(`✅ ${MENU.length} menu items done`);

  console.log("");
  console.log("🎉 SEED COMPLETE! Ab browser mein refresh karo — menu dikh jayega.");
  console.log("");
  console.log("⚠️ IMPORTANT: settings/main mein ownerEmails array mein");
  console.log("   apna owner email daalna (jis se owner dashboard login hoga).");
}

main().catch((e) => { console.error("Seed error:", e); process.exit(1); });
