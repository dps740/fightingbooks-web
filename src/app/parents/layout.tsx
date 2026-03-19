import { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Parents | FightingBooks",
  description: "See how FightingBooks helps parents turn animal curiosity into reading, science, and critical-thinking time kids actually enjoy.",
  keywords: ["animal books for kids", "educational books for kids", "critical thinking for kids", "animal comparison books", "parents wildlife books"],
  openGraph: {
    title: "For Parents | FightingBooks",
    description: "See how FightingBooks helps parents turn animal curiosity into reading, science, and critical-thinking time kids actually enjoy.",
    type: "website",
    url: "https://whowouldwinbooks.com/parents",
    siteName: "FightingBooks",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FightingBooks for Parents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "For Parents | FightingBooks",
    description: "A parent-facing overview of how FightingBooks helps with reading, science, and critical thinking.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/parents",
  },
};

export default function ParentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
