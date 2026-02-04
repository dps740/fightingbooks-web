import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Who Would Win? Animal Battles",
  description: "Read about epic animal battles, learn fascinating facts, and discover which creatures would win in hypothetical matchups.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
