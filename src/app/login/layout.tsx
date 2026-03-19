import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - FightingBooks",
  description: "Sign in to your FightingBooks account to continue creating epic animal battle books.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
