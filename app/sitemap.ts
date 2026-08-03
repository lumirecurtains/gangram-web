// 🗺️ Dynamic Sitemap Generator — /sitemap.xml (Task 5)

import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/order-history`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  try {
    const snap = await adminDb.collection("menuItems").get();
    snap.docs.forEach((doc) => {
      routes.push({
        url: `${SITE_URL}/product/${doc.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });
  } catch (err) {
    console.warn("Sitemap product fetch notice:", err);
  }

  return routes;
}
