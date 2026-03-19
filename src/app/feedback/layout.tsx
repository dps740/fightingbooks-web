import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Send Feedback - FightingBooks",
  description: "Help us improve FightingBooks! Share your feedback, report bugs, or suggest new features.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
