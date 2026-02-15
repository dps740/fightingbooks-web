import { Metadata } from 'next';
import Link from 'next/link';
import { FIGHTERS, CATEGORY_INFO, getMatchupSlug, toUrlParam, type AnimalCategory } from '@/data/fighters';
import MatchupsClient from './MatchupsClient';

export const metadata: Metadata = {
  title: 'Animal Matchups — Who Would Win? | 1,000+ Battle Combinations',
  description: 'Browse 1,081 animal vs animal matchups. Lion vs Tiger, Gorilla vs Bear, T-Rex vs Triceratops and more. Find out who would win in every animal battle combination.',
  keywords: ['animal vs animal', 'who would win matchups', 'animal battle matchups', 'animal fights', 'who would win in a fight', 'animal comparisons'],
  openGraph: {
    title: 'Animal Matchups — Who Would Win? | 1,000+ Battle Combinations',
    description: 'Browse 1,081 animal vs animal matchups including real animals, dinosaurs, and fantasy creatures.',
    type: 'website',
  },
  alternates: {
    canonical: '/matchups',
  },
};

interface Matchup {
  animal1: string;
  animal2: string;
  cat1: AnimalCategory;
  cat2: AnimalCategory;
  blogSlug: string | null;
  crossType: string; // e.g. "real-vs-real", "real-vs-dinosaur"
}

function generateAllMatchups(): Matchup[] {
  const matchups: Matchup[] = [];
  for (let i = 0; i < FIGHTERS.length; i++) {
    for (let j = i + 1; j < FIGHTERS.length; j++) {
      const a = FIGHTERS[i];
      const b = FIGHTERS[j];
      const cats = [a.category, b.category].sort();
      matchups.push({
        animal1: a.name,
        animal2: b.name,
        cat1: a.category,
        cat2: b.category,
        blogSlug: getMatchupSlug(a.name, b.name),
        crossType: `${cats[0]}-vs-${cats[1]}`,
      });
    }
  }
  return matchups;
}

// Group matchups by cross-category type
function groupMatchups(matchups: Matchup[]) {
  const groups: Record<string, Matchup[]> = {};
  for (const m of matchups) {
    const key = getCategoryGroupKey(m.cat1, m.cat2);
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  return groups;
}

function getCategoryGroupKey(c1: AnimalCategory, c2: AnimalCategory): string {
  if (c1 === c2) return c1;
  const sorted = [c1, c2].sort();
  return `${sorted[0]}-vs-${sorted[1]}`;
}

const GROUP_LABELS: Record<string, string> = {
  'real': '🦁 Real Animals vs Real Animals',
  'dinosaur': '🦕 Dinosaurs vs Dinosaurs',
  'fantasy': '🐉 Fantasy vs Fantasy',
  'dinosaur-vs-real': '🦁⚔️🦕 Real Animals vs Dinosaurs',
  'fantasy-vs-real': '🦁⚔️🐉 Real Animals vs Fantasy',
  'dinosaur-vs-fantasy': '🦕⚔️🐉 Dinosaurs vs Fantasy',
};

const GROUP_ORDER = ['real', 'dinosaur', 'fantasy', 'dinosaur-vs-real', 'fantasy-vs-real', 'dinosaur-vs-fantasy'];

export default function MatchupsPage() {
  const allMatchups = generateAllMatchups();
  const grouped = groupMatchups(allMatchups);
  const withArticles = allMatchups.filter(m => m.blogSlug).length;

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Animal Matchups — Who Would Win?',
    description: `${allMatchups.length} unique animal battle matchup combinations`,
    numberOfItems: allMatchups.length,
    itemListElement: allMatchups.slice(0, 100).map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${m.animal1} vs ${m.animal2}`,
      url: m.blogSlug
        ? `https://whowouldwinbooks.com/blog/${m.blogSlug}`
        : `https://whowouldwinbooks.com/?animal1=${toUrlParam(m.animal1)}&animal2=${toUrlParam(m.animal2)}`,
    })),
  };

  // Pre-render all matchup text for SEO (server component)
  const groupData = GROUP_ORDER.filter(k => grouped[k]).map(key => ({
    key,
    label: GROUP_LABELS[key],
    matchups: grouped[key].map(m => ({
      animal1: m.animal1,
      animal2: m.animal2,
      blogSlug: m.blogSlug,
      href: m.blogSlug
        ? `/blog/${m.blogSlug}`
        : `/?animal1=${toUrlParam(m.animal1)}&animal2=${toUrlParam(m.animal2)}`,
    })),
  }));

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="border-b border-[var(--border-accent)] bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] text-sm font-bold uppercase tracking-wide">
            ← Back to Generator
          </Link>
          <Link href="/blog" className="text-[var(--text-secondary)] hover:text-[var(--accent-gold)] text-sm font-bold uppercase tracking-wide">
            Battle Guides →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 border-b-4 border-[var(--accent-gold)]">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            textShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
          }}>
            ANIMAL MATCHUPS — WHO WOULD WIN?
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-4">
            {allMatchups.length.toLocaleString()} unique animal battle combinations. Browse every possible matchup between {FIGHTERS.length} fighters.
          </p>
          <div className="flex justify-center gap-6 text-sm text-[var(--text-muted)]">
            <span>📖 <strong className="text-[var(--accent-gold)]">{withArticles}</strong> with full articles</span>
            <span>⚔️ <strong className="text-[var(--accent-gold)]">{allMatchups.length - withArticles}</strong> instant generators</span>
          </div>
        </div>
      </section>

      {/* Client-side filtering wrapper around server-rendered content */}
      <MatchupsClient groups={groupData} totalCount={allMatchups.length} />

      {/* CTA */}
      <section className="py-16 px-4 bg-[var(--bg-secondary)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            CREATE YOUR OWN BATTLE BOOK
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 text-lg">
            Pick any matchup above or create your own custom animal battle book in 60 seconds.
          </p>
          <Link
            href="/"
            className="btn-primary inline-block px-10 py-4 rounded-lg text-lg font-bold hover:scale-105 transition-transform"
          >
            🦁 Generate Your Book
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[var(--bg-primary)] border-t border-[var(--border-accent)]">
        <div className="max-w-6xl mx-auto px-4 text-center text-[var(--text-muted)] text-sm">
          <p>© 2025 FightingBooks • A fan tribute to Jerry Pallotta&apos;s Who Would Win? series</p>
        </div>
      </footer>
    </main>
  );
}
