import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL("https://whowouldwinbooks.com"),
  title: "Who Would Win? - Create Epic Animal Battle Books",
  description: "Create epic who would win style animal battle books! Pick any two animals, get an instant illustrated book with real science, stats, and a final verdict. Lions vs Tigers, Sharks vs Orcas, Dinosaurs and more.",
  keywords: ["who would win", "wildlife books", "kids books", "educational books", "custom books", "animal comparisons", "interactive books", "critical thinking"],
  authors: [{ name: "FightingBooks" }],
  creator: "FightingBooks",
  openGraph: {
    title: "Who Would Win? - Create Epic Animal Battle Books",
    description: "Create epic who would win style animal battle books! Pick any two animals, get an instant illustrated book with real science, stats, and a final verdict.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://whowouldwinbooks.com",
    siteName: "FightingBooks",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Who Would Win? - Epic Animal Battle Books",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Who Would Win? - Create Epic Animal Battle Books",
    description: "Create epic who would win style animal battle books! Pick any two animals, get an instant illustrated book with real science, stats, and a final verdict.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "pinterest-rich-pin": "true",
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
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', {
                  anonymize_ip: true,
                  send_page_view: true
                });
              `}
            </Script>
          </>
        ) : null}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
