import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gangaram Dairy Pilot",
  description: "Direct order platform — Gangaram Dairy. No commission, seedha order.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}
