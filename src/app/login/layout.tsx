import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - FightingBooks",
  description: "Sign in to your FightingBooks account to continue creating epic animal battle books.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
