import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://whowouldwinbooks.com"),
  alternates: {
    canonical: "/",
  },
  title: "Who Would Win? - Create Epic Animal Battle Books",
  description: "Create custom illustrated books where your favorite animals battle it out! Inspired by Jerry Pallotta's bestselling series. Generate AI-powered battle stories with Lions, Tigers, Sharks, Dinosaurs and more.",
  keywords: ["who would win", "animal battles", "kids books", "AI book generator", "custom books", "animal fights", "educational books"],
  authors: [{ name: "FightingBooks" }],
  creator: "FightingBooks",
  openGraph: {
    title: "Who Would Win? - Create Epic Animal Battle Books",
    description: "Create custom illustrated books where your favorite animals battle it out! Generate AI-powered battle stories instantly.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://whowouldwinbooks.com",
    siteName: "FightingBooks",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Who Would Win? - Epic Animal Battles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Who Would Win? - Create Epic Animal Battle Books",
    description: "Create custom illustrated books where your favorite animals battle it out!",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 min-h-screen`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
