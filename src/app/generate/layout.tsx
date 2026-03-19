import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generating Book - FightingBooks",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GenerateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
