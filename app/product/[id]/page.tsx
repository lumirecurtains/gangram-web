// 🍲 Dynamic Product SEO & Product Page Route — /product/[id] (Sprint A2 Tasks 2 & 3)

import { Metadata } from "next";
import { adminDb } from "@/lib/firebaseAdmin";
import { SITE_URL, getProductJsonLd } from "@/lib/seo";
import ProductDetailClient from "./ProductDetailClient";
import { MenuItem } from "@/lib/types";

async function getProductData(id: string): Promise<MenuItem | null> {
  try {
    const snap = await adminDb.collection("menuItems").doc(id).get();
    if (snap.exists) {
      return { id: snap.id, ...snap.data() } as MenuItem;
    }
  } catch (err) {
    console.warn("Product fetch server error:", err);
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductData(resolvedParams.id);

  if (!product) {
    return {
      title: "Dish Not Found | Gangaram Dairy Begusarai",
      description: "Swaadish khana aur dairy products online order karein Gangaram Dairy Begusarai se.",
    };
  }

  const title = `${product.name} - ₹${product.price} | Gangaram Dairy Begusarai`;
  const description = `${product.name} (${product.desc || "Taaza ghar ka swaad"}). Order online for fast delivery in Begusarai, Bihar. Rating: ⭐ ${product.avgRating || 4.8}/5.`;
  const image = product.photo || `${SITE_URL}/og-image.jpg`;

  return {
    title,
    description,
    keywords: [
      product.name,
      `${product.name} Begusarai`,
      "Gangaram Dairy Begusarai",
      "Begusarai Food Delivery",
      "Online Dairy Begusarai",
    ],
    alternates: {
      canonical: `${SITE_URL}/product/${product.id}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/product/${product.id}`,
      siteName: "Gangaram Dairy Begusarai",
      locale: "hi_IN",
      type: "article",
      images: [
        {
          url: image,
          alt: `${product.name} - Gangaram Dairy Begusarai`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const product = await getProductData(resolvedParams.id);
  const jsonLd = product ? getProductJsonLd(product) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient id={resolvedParams.id} initialProduct={product} />
    </>
  );
}
