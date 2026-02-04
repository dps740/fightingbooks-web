import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Send Feedback - FightingBooks",
  description: "Help us improve FightingBooks! Share your feedback, report bugs, or suggest new features.",
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
