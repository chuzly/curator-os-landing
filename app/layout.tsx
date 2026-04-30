import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Curator OS — Market intelligence for serious Pokemon TCG collectors",
  description:
    "Curator-led market intelligence for Pokemon TCG collectors and vendors across Malaysia, Singapore, Japan, Hong Kong, and Taiwan.",
  openGraph: {
    title: "Curator OS",
    description:
      "Market intelligence for serious Pokemon TCG collectors and vendors across Asia-Pacific.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white text-navy antialiased">{children}</body>
    </html>
  );
}
