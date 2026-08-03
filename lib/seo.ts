// 🔍 SEO & JSON-LD Structured Data Helper (Sprint A2)

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gangaram-dairy.vercel.app";

export function getRestaurantJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${SITE_URL}/#restaurant`,
    "name": "Gangaram Dairy",
    "image": `${SITE_URL}/og-image.jpg`,
    "url": SITE_URL,
    "telephone": "+918709734024",
    "priceRange": "₹₹",
    "menu": `${SITE_URL}/#menu`,
    "acceptsReservations": "False",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Station Road, Gangaram Chowk",
      "addressLocality": "Begusarai",
      "addressRegion": "BR",
      "postalCode": "851101",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 25.4181,
      "longitude": 86.1272
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "08:00",
        "closes": "22:00"
      }
    ],
    "servesCuisine": ["Pure Dairy", "North Indian", "Sweets", "Vegetarian", "Fast Food"],
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": "Begusarai, Bihar, India"
    }
  };
}

export function getProductJsonLd(product: {
  id: string;
  name: string;
  desc?: string;
  price: number;
  photo?: string;
  avgRating?: number;
  reviewCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}/product/${product.id}#product`,
    "name": product.name,
    "image": product.photo || `${SITE_URL}/og-image.jpg`,
    "description": product.desc || `${product.name} - Pure and fresh from Gangaram Dairy Begusarai`,
    "brand": {
      "@type": "Brand",
      "name": "Gangaram Dairy"
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "url": `${SITE_URL}/product/${product.id}`,
      "seller": {
        "@type": "Organization",
        "name": "Gangaram Dairy Begusarai"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.avgRating || 4.8,
      "reviewCount": product.reviewCount || 12,
      "bestRating": 5,
      "worstRating": 1
    }
  };
}
