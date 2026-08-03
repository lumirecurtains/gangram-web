// 🏅 Smart Product Badges & Product Intelligence Metrics (Sprint A1)

import { MenuItem } from "./types";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "./firebase";

export type BadgeType =
  | "❤️ Owner's Choice"
  | "🔥 Most Ordered"
  | "📈 Trending"
  | "⚡ Fast Moving"
  | "💰 Best Value"
  | "⭐ Top Rated"
  | "👀 Most Viewed"
  | "🆕 New Arrival";

// Calculate smart badges based on metrics & Task 6 Priority sequence
export function getProductBadges(item: MenuItem, allItems: MenuItem[] = []): BadgeType[] {
  const badges: BadgeType[] = [];

  // Priority 1: ❤️ Owner's Choice (Admin manual toggle)
  if (item.ownersChoice) {
    badges.push("❤️ Owner's Choice");
  }

  // Priority 2: 🔥 Most Ordered (High orders count >= 5 or top order count)
  const maxOrders = Math.max(...allItems.map((i) => i.ordersCount || 0), 1);
  if ((item.ordersCount || 0) >= 5 || ((item.ordersCount || 0) > 0 && item.ordersCount === maxOrders)) {
    badges.push("🔥 Most Ordered");
  }

  // Priority 3: 📈 Trending (High views & order velocity)
  if ((item.ordersCount || 0) >= 3 && (item.views || 0) >= 10) {
    badges.push("📈 Trending");
  }

  // Priority 4: ⚡ Fast Moving (Sales velocity >= 4)
  if ((item.ordersCount || 0) >= 4) {
    badges.push("⚡ Fast Moving");
  }

  // Priority 5: 💰 Best Value (High rating >= 4.0 and price <= 180)
  const rating = item.avgRating || 4.8;
  if (rating >= 4.0 && item.price <= 180) {
    badges.push("💰 Best Value");
  }

  // Priority 6: ⭐ Top Rated (Task 2 Spec: Minimum 10 reviews required, avgRating >= 4.5)
  if ((item.reviewCount || 0) >= 10 && rating >= 4.5) {
    badges.push("⭐ Top Rated");
  }

  // Priority 7: 👀 Most Viewed (Views >= 15 or top views)
  const maxViews = Math.max(...allItems.map((i) => i.views || 0), 1);
  if ((item.views || 0) >= 15 || ((item.views || 0) > 5 && item.views === maxViews)) {
    badges.push("👀 Most Viewed");
  }

  // Priority 8: 🆕 New Arrival (Order index <= 2)
  if ((item.order || 0) <= 2) {
    badges.push("🆕 New Arrival");
  }

  return badges;
}

// Automatically increment view count when product detail is opened (Task 3 & 5)
export async function incrementProductViews(productId: string) {
  if (!productId) return;
  try {
    const itemRef = doc(db, "menuItems", productId);
    await updateDoc(itemRef, {
      views: increment(1),
    });
  } catch (err) {
    console.warn("View count increment notice:", err);
  }
}
