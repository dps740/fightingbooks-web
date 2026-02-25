import { Metadata } from 'next';
import Link from 'next/link';
import { FIGHTERS, getMatchupSlug, type AnimalCategory } from '@/data/fighters';
import MatchupsClient from './MatchupsClient';

export const metadata: Metadata = {
  title: 'Animal Matchups — Who Would Win? | 1,000+ Battle Combinations',
  description: 'Browse 1,081 animal vs animal matchups. Search every battle page and explore the most popular matchups.',
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
  crossType: string;
}

interface PopularMatchup {
  animal1: string;
  animal2: string;
  reason: string;
}

const POPULAR_MATCHUPS: PopularMatchup[] = [
  { animal1: 'Lion', animal2: 'Tiger', reason: 'The classic big-cat showdown' },
  { animal1: 'Gorilla', animal2: 'Grizzly Bear', reason: 'Strength vs raw bear power' },
  { animal1: 'Great White Shark', animal2: 'Orca', reason: 'Ocean apex predator battle' },
  { animal1: 'Hippo', animal2: 'Crocodile', reason: 'River tank vs ambush hunter' },
  { animal1: 'Elephant', animal2: 'Rhino', reason: 'Heavyweight herbivore clash' },
  { animal1: 'Wolf', animal2: 'Lion', reason: 'Pack hunter vs king of the savanna' },
  { animal1: 'Tyrannosaurus Rex', animal2: 'Triceratops', reason: 'Iconic dinosaur rivalry' },
  { animal1: 'Spinosaurus', animal2: 'Tyrannosaurus Rex', reason: 'Two giant predators head-to-head' },
  { animal1: 'Dragon', animal2: 'Kraken', reason: 'Sky firepower vs sea terror' },
  { animal1: 'Hydra', animal2: 'Cerberus', reason: 'Mythical multi-headed monsters' },
  { animal1: 'Lion', animal2: 'Dragon', reason: 'Real predator vs fantasy beast' },
  { animal1: 'Orca', animal2: 'Kraken', reason: 'Top marine hunter vs legend' },
];

function toBattleSlugPart(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toBattleSlug(animal1: string, animal2: string): string {
  return `${toBattleSlugPart(animal1)}-vs-${toBattleSlugPart(animal2)}`;
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
  'real': 'Real Animals vs Real Animals',
  'dinosaur': 'Dinosaurs vs Dinosaurs',
  'fantasy': 'Fantasy vs Fantasy',
  'dinosaur-vs-real': 'Real Animals vs Dinosaurs',
  'fantasy-vs-real': 'Real Animals vs Fantasy',
  'dinosaur-vs-fantasy': 'Dinosaurs vs Fantasy',
};

const GROUP_ORDER = ['real', 'dinosaur', 'fantasy', 'dinosaur-vs-real', 'fantasy-vs-real', 'dinosaur-vs-fantasy'];

export default function MatchupsPage() {
  const allMatchups = generateAllMatchups();
  const grouped = groupMatchups(allMatchups);
  const withArticles = allMatchups.filter(m => m.blogSlug).length;

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
      url: `https://whowouldwinbooks.com/battles/${toBattleSlug(m.animal1, m.animal2)}`,
    })),
  };

  const groupData = GROUP_ORDER.filter(k => grouped[k]).map(key => ({
    key,
    label: GROUP_LABELS[key],
    matchups: grouped[key].map(m => ({
      animal1: m.animal1,
      animal2: m.animal2,
      blogSlug: m.blogSlug,
      href: `/battles/${toBattleSlug(m.animal1, m.animal2)}`,
    })),
  }));

  const popularCards = POPULAR_MATCHUPS.map(({ animal1, animal2, reason }) => {
    const blogSlug = getMatchupSlug(animal1, animal2);
    return {
      animal1,
      animal2,
      reason,
      blogSlug,
      href: `/battles/${toBattleSlug(animal1, animal2)}`,
    };
  });

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-[var(--border-accent)] bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] text-sm font-bold uppercase tracking-wide">
            ← Back to Home
          </Link>
          <Link href="/blog" className="text-[var(--text-secondary)] hover:text-[var(--accent-gold)] text-sm font-bold uppercase tracking-wide">
            Battle Guides →
          </Link>
        </div>
      </header>

      <section className="py-16 px-4 border-b-4 border-[var(--accent-gold)]">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            textShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
          }}>
            ANIMAL BATTLE LINKS
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-4">
            Search {allMatchups.length.toLocaleString()} battle pages between {FIGHTERS.length} fighters.
            Every matchup below links directly to its battle page.
          </p>
          <div className="flex justify-center gap-6 text-sm text-[var(--text-muted)]">
            <span><strong className="text-[var(--accent-gold)]">{withArticles}</strong> with detailed guides</span>
            <span><strong className="text-[var(--accent-gold)]">{allMatchups.length}</strong> total battle pages</span>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 border-b border-[var(--border-accent)] bg-[var(--bg-secondary)]" id="most-popular">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
              Most Popular Battles
            </h2>
            <p className="text-[var(--text-secondary)] mt-2">
              Start with the matchups families ask about most often.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {popularCards.map(card => (
              <Link
                key={`${card.animal1}-${card.animal2}`}
                href={card.href}
                className="p-4 rounded-lg border border-[var(--border-accent)] bg-[var(--bg-card)] hover:border-[var(--accent-gold)] hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all"
              >
                <p className="font-bold text-[var(--text-primary)]">
                  {card.animal1} <span className="text-[var(--accent-red)]">vs</span> {card.animal2}
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-1">{card.reason}</p>
                {card.blogSlug && (
                  <p className="text-xs text-[var(--accent-gold)] mt-2 font-semibold">Includes full battle guide</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <MatchupsClient groups={groupData} totalCount={allMatchups.length} />

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
            Generate Your Book
          </Link>
        </div>
      </section>

      <footer className="py-8 bg-[var(--bg-primary)] border-t border-[var(--border-accent)]">
        <div className="max-w-6xl mx-auto px-4 text-center text-[var(--text-muted)] text-sm">
          <p>© 2025 FightingBooks • A fan tribute to Jerry Pallotta&apos;s Who Would Win? series</p>
        </div>
      </footer>
    </main>
  );
}
