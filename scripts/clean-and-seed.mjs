import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const sa = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
const app = initializeApp({ credential: cert(sa) }, "clean-seed");
const db = getFirestore(app);

const CATEGORIES = ["Starters", "Main Course", "Breads", "Rice & Biryani", "Sweets", "Drinks"];

const MENU = [
  // [catIdx, name, price, desc, emoji, tag, photoUrl]
  [0, "Paneer Tikka", 220, "Charcoal tandoor mein bhuna, masaledar paneer", "🧀", "Chef Special", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80"],
  [0, "Veg Spring Rolls", 150, "Crispy rolls, hari chutney ke saath", "🌯", "", "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"],
  [0, "Hara Bhara Kabab", 170, "Palak-matar ke healthy kabab", "🥬", "Healthy", "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"],
  [0, "Dahi ke Kabab", 180, "Melt-in-mouth creamy kabab", "🍥", "", ""],

  [1, "Paneer Butter Masala", 240, "Rich creamy gravy, makhni tadka", "🍛", "Bestseller", "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80"],
  [1, "Dal Makhani", 180, "Raati 24 ghante slow-cooked", "🫘", "Signature", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80"],
  [1, "Chole Bhature", 160, "Punjabi chole, fluffy bhature", "🍽️", "Popular", "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80"],
  [1, "Masala Dosa", 140, "Crispy dosa, sambar-chutney", "🥞", "", ""],

  [2, "Butter Naan", 40, "Tandoori naan, butter lagakar", "🫓", "", "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80"],
  [2, "Tandoori Roti", 25, "Multigrain, garma-garam", "🫓", "", ""],
  [2, "Garlic Naan", 55, "Lahsun tadka wala naan", "🧄", "", ""],

  [3, "Veg Biryani", 210, "Basmati rice, kewda aroma, raita ke saath", "🍚", "Popular", "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"],
  [3, "Jeera Rice", 120, "Bhuna jeera, ghee tadka", "🍚", "", ""],
  [3, "Curd Rice", 110, "Thanda comfort food", "🥣", "", ""],

  [4, "Gulab Jamun (2pc)", 80, "Garma-garam, shahi", "🍮", "Must Try", "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"],
  [4, "Rasgulla (2pc)", 70, "Soft spongy, chasni wale", "⚪", "", ""],
  [4, "Kheer", 90, "Chawal ki kheer, badam-kishmish", "🥛", "", ""],

  [5, "Sweet Lassi", 90, "Malai maar ke, chhappan bhog", "🥤", "Refreshing", "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80"],
  [5, "Masala Chai", 30, "Adrak-elaichi wali kulhad chai", "☕", "", ""],
  [5, "Fresh Lime Soda", 60, "Sweet ya salty — aapki pasand", "🍋", "", ""]
];

async function deleteCollection(collectionPath) {
  const snap = await db.collection(collectionPath).get();
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

async function main() {
  console.log("🧹 Clearing old data...");
  await deleteCollection("categories");
  await deleteCollection("menuItems");

  console.log("🌱 Seeding fresh categories & dishes...");

  const catIds = [];
  for (let i = 0; i < CATEGORIES.length; i++) {
    const ref = await db.collection("categories").add({ name: CATEGORIES[i], order: i });
    catIds.push(ref.id);
  }

  for (let i = 0; i < MENU.length; i++) {
    const [catIdx, name, price, desc, emoji, tag, photo] = MENU[i];
    await db.collection("menuItems").add({
      name,
      price,
      desc,
      emoji,
      tag: tag || "",
      veg: true,
      available: true,
      photo: photo || "",
      categoryId: catIds[catIdx],
      order: i,
    });
  }

  console.log("✨ ALL MENU ITEMS RESTORED SUCCESSFULLY!");
}

main().catch(console.error);
