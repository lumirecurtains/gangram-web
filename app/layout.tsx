import type { Metadata } from "next";
import "./globals.css";
import { getRestaurantJsonLd, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Gangaram Dairy Begusarai | Pure Dairy & Homemade Food Delivery",
    template: "%s | Gangaram Dairy Begusarai",
  },
  description:
    "Order fresh pure milk, paneer, sweets, thali & authentic home-style food online from Gangaram Dairy in Begusarai, Bihar. Fast local delivery directly to your doorstep with zero aggregator commission.",
  keywords: [
    "Gangaram Dairy",
    "Gangaram Dairy Begusarai",
    "Begusarai Food Delivery",
    "Dairy Products Begusarai",
    "Online Sweets Begusarai",
    "Paneer Begusarai",
    "Begusarai Restaurant",
    "Home Delivery Begusarai Bihar",
    "Veg Thali Begusarai",
  ],
  authors: [{ name: "Gangaram Dairy Begusarai" }],
  creator: "Gangaram Dairy Begusarai",
  publisher: "Gangaram Dairy",
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Gangaram Dairy Begusarai | Pure Dairy & Homemade Food Delivery",
    description:
      "Fresh pure milk, paneer, sweets & authentic thali delivered directly to your doorstep in Begusarai, Bihar.",
    url: SITE_URL,
    siteName: "Gangaram Dairy Begusarai",
    locale: "hi_IN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Gangaram Dairy Begusarai Bihar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gangaram Dairy Begusarai | Pure Dairy & Food Delivery",
    description:
      "Order fresh pure dairy, sweets & authentic food online in Begusarai, Bihar.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = getRestaurantJsonLd();

  return (
    <html lang="hi">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
