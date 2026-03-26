import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up Free - FightingBooks",
  description: "Create your free FightingBooks account. Get access to 8 popular animals and hundreds of cached wildlife battles. Upgrade to Member for 31 animals and unlimited generation!",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
