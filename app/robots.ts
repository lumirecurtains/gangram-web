// 🤖 Dynamic Robots.txt Generator (Task 5)

import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/product/*", "/order-history"],
      disallow: ["/dashboard", "/api/*"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
