import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Battles | Who Would Win Books',
  description: 'Battle hub with searchable matchups, popular battles, and featured deep-dive guides.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function BlogPageRedirect() {
  redirect('/battles');
}
