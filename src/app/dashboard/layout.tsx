import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Books - FightingBooks",
  description: "View and manage your generated animal battle books.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
