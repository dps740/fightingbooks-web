import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Read Book - FightingBooks",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
