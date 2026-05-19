import type { Metadata } from "next";
import { Inter, Noto_Sans_SC, Noto_Serif_SC, Oswald, Ma_Shan_Zheng } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-sc",
  display: "swap",
});

const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-serif-sc",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

const maShanZheng = Ma_Shan_Zheng({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-ma-shan-zheng",
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
    <html
      lang="en"
      className={`${inter.variable} ${notoSansSC.variable} ${notoSerifSC.variable} ${oswald.variable} ${maShanZheng.variable}`}
    >
      <body className="bg-white text-navy antialiased">{children}</body>
    </html>
  );
}
