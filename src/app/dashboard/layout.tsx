import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Books - FightingBooks",
  description: "View and manage your generated animal battle books.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
