import Link from 'next/link';
import { Metadata } from 'next';
import BookAffiliateSection from '@/components/BookAffiliateSection';

export const metadata: Metadata = {
  title: 'Battle Guides & Animal Comparisons | FightingBooks Blog',
  description: 'In-depth guides comparing the world\'s most powerful animals. Lion vs Tiger, Gorilla vs Bear, and more epic matchups analyzed with real facts.',
  openGraph: {
    title: 'Battle Guides & Animal Comparisons | FightingBooks Blog',
    description: 'In-depth guides comparing the world\'s most powerful animals.',
  },
};

interface Article {
  slug: string;
  title: string;
  description: string;
  animals: string[];
  readTime: string;
  searchVolume: string;
}

const articles: Article[] = [
  // === CORNERSTONE CONTENT ===
  {
    slug: 'who-would-win-book-list',
    title: 'Complete Who Would Win Book List (2026) - All 35+ Books',
    description: 'The definitive guide to Jerry Pallotta\'s Who Would Win? series. Complete list with reading levels, age recommendations, and reading order.',
    animals: ['📚 Book Guide'],
    readTime: '15 min',
    searchVolume: '8k/mo searches'
  },
  {
    slug: 'classroom-resources',
    title: 'Who Would Win Classroom Resources - Free Lesson Plans',
    description: 'Free downloadable lesson plans, discussion questions, and worksheets for the Who Would Win? book series. NGSS-aligned for grades 1-4.',
    animals: ['📝 Teaching'],
    readTime: '10 min',
    searchVolume: '2k/mo searches'
  },
  {
    slug: 'books-like-who-would-win',
    title: 'Books Like Who Would Win - 15 Similar Series (2026)',
    description: 'Finished all the Who Would Win books? Here are 15 similar series about animal battles that kids ages 6-12 will love.',
    animals: ['📖 Alternatives'],
    readTime: '12 min',
    searchVolume: '1k/mo searches'
  },
  // === GUIDES ===
  {
    slug: 'who-would-win-complete-guide',
    title: 'Who Would Win? The Complete Guide to Animal Battles',
    description: 'How to compare animals scientifically. What factors matter most, common mistakes, and the truth about hypothetical matchups.',
    animals: ['📚 Guide'],
    readTime: '12 min',
    searchVolume: '90k/mo searches'
  },
  {
    slug: 'lion-vs-tiger',
    title: 'Lion vs Tiger: Who Would Win in a Fight?',
    description: 'The ultimate breakdown of nature\'s most debated big cat battle. Size, strength, and fighting experience analyzed.',
    animals: ['🦁 Lion', '🐅 Tiger'],
    readTime: '8 min',
    searchVolume: '60k/mo searches'
  },
  {
    slug: 'gorilla-vs-bear',
    title: 'Gorilla vs Bear: Who Would Win?',
    description: 'Silverback strength meets grizzly power. The critical factor that decides this fight might surprise you.',
    animals: ['🦍 Gorilla', '🐻 Grizzly'],
    readTime: '7 min',
    searchVolume: '40k/mo searches'
  },
  {
    slug: 'crocodile-vs-shark',
    title: 'Crocodile vs Shark: Who Would Win?',
    description: 'Saltwater crocodile meets bull shark. Two apex predators clash in the ultimate battle of bite force and aggression.',
    animals: ['🐊 Crocodile', '🦈 Shark'],
    readTime: '9 min',
    searchVolume: '35k/mo searches'
  },
  {
    slug: 'hippo-vs-crocodile',
    title: 'Hippo vs Crocodile: Who Would Win?',
    description: 'Africa\'s most aggressive mammal versus its most patient predator. The outcome might shock you.',
    animals: ['🦛 Hippo', '🐊 Crocodile'],
    readTime: '9 min',
    searchVolume: '28k/mo searches'
  },
  {
    slug: 'gorilla-vs-lion',
    title: 'Gorilla vs Lion: Who Would Win?',
    description: 'Primate power meets feline ferocity. When brute strength faces off against predatory precision.',
    animals: ['🦍 Gorilla', '🦁 Lion'],
    readTime: '9 min',
    searchVolume: '25k/mo searches'
  },
  {
    slug: 'elephant-vs-rhino',
    title: 'Elephant vs Rhino: Who Would Win?',
    description: 'The two largest land mammals collide. Size, intelligence, and weaponry analyzed in this heavyweight showdown.',
    animals: ['🐘 Elephant', '🦏 Rhino'],
    readTime: '8 min',
    searchVolume: '18k/mo searches'
  },
  {
    slug: 'orca-vs-great-white-shark',
    title: 'Orca vs Great White Shark: Who Would Win?',
    description: 'The ocean\'s apex predator meets an even scarier apex predator. This matchup isn\'t even close.',
    animals: ['🐋 Orca', '🦈 Great White'],
    readTime: '8 min',
    searchVolume: '15k/mo searches'
  },
  {
    slug: 'wolf-vs-lion',
    title: 'Wolf vs Lion: Who Would Win?',
    description: 'Pack tactics meet solo supremacy. One-on-one is a mismatch, but what if the wolf brings friends?',
    animals: ['🐺 Wolf', '🦁 Lion'],
    readTime: '8 min',
    searchVolume: '12k/mo searches'
  },
  {
    slug: 'hippo-vs-rhino',
    title: 'Hippo vs Rhino: Who Would Win?',
    description: 'Two African giants clash. Discover which heavyweight has the edge in this epic battle of bite force vs horn power.',
    animals: ['🦛 Hippo', '🦏 Rhino'],
    readTime: '8 min',
    searchVolume: '10k/mo searches'
  },
  {
    slug: 'komodo-dragon-vs-king-cobra',
    title: 'Komodo Dragon vs King Cobra: Who Would Win?',
    description: 'The world\'s largest lizard meets the world\'s deadliest snake. Venom versus venom in an epic reptilian showdown.',
    animals: ['🦎 Komodo', '🐍 King Cobra'],
    readTime: '9 min',
    searchVolume: '9k/mo searches'
  },
  {
    slug: 'polar-bear-vs-grizzly-bear',
    title: 'Polar Bear vs Grizzly Bear: Who Would Win?',
    description: 'The ultimate bear showdown. Arctic giant versus inland powerhouse - size, strength, and fighting experience compared.',
    animals: ['🐻‍❄️ Polar Bear', '🐻 Grizzly'],
    readTime: '7 min',
    searchVolume: '8k/mo searches'
  },
  {
    slug: 'honey-badger-vs-lion',
    title: 'Honey Badger vs Lion: Who Would Win?',
    description: 'When the internet\'s favorite fearless animal meets the King of Beasts. Does attitude beat overwhelming force?',
    animals: ['🦡 Honey Badger', '🦁 Lion'],
    readTime: '9 min',
    searchVolume: '7k/mo searches'
  },
  {
    slug: 'jaguar-vs-leopard',
    title: 'Jaguar vs Leopard: Who Would Win?',
    description: 'Two spotted big cats - one\'s built like a tank, the other\'s a master assassin. The bite force gap is insane.',
    animals: ['🐆 Jaguar', '🐆 Leopard'],
    readTime: '9 min',
    searchVolume: '6k/mo searches'
  },
  {
    slug: 'tiger-vs-bear',
    title: 'Tiger vs Bear: Who Would Win?',
    description: 'Siberian tiger faces off against grizzly bear. Speed and agility versus raw power and durability.',
    animals: ['🐅 Tiger', '🐻 Bear'],
    readTime: '8 min',
    searchVolume: '6k/mo searches'
  },
  {
    slug: 'anaconda-vs-crocodile',
    title: 'Anaconda vs Crocodile: Who Would Win?',
    description: 'South America\'s apex constrictor meets its armored ambush predator. This fight actually happens in the wild.',
    animals: ['🐍 Anaconda', '🐊 Crocodile'],
    readTime: '9 min',
    searchVolume: '5k/mo searches'
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="border-b border-[var(--border-accent)] bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/" className="text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] text-sm font-bold uppercase tracking-wide">
            ← Back to Generator
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
            BATTLE GUIDES
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
            In-depth analysis of the world's most epic animal matchups. Real facts, scientific comparisons, and expert verdicts.
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group bg-[var(--bg-card)] border-2 border-[var(--border-accent)] rounded-lg overflow-hidden hover:border-[var(--accent-gold)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]"
              >
                <div className="p-6">
                  {/* Animals */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {article.animals.map((animal) => (
                      <span
                        key={animal}
                        className="text-sm px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-accent)] text-[var(--text-secondary)]"
                      >
                        {animal}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold mb-3 text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors">
                    {article.title}
                  </h2>

                  {/* Description */}
                  <p className="text-[var(--text-secondary)] mb-4 line-clamp-3">
                    {article.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                    <span>📖 {article.readTime}</span>
                    <span>🔥 {article.searchVolume}</span>
                  </div>
                </div>

                {/* Read More Bar */}
                <div className="bg-[var(--bg-secondary)] px-6 py-3 border-t border-[var(--border-accent)] group-hover:bg-[var(--accent-gold)] group-hover:text-[var(--bg-primary)] transition-colors font-bold text-sm uppercase tracking-wide">
                  Read Analysis →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Book Affiliate Section */}
      <BookAffiliateSection showAll={true} />

      {/* CTA Section */}
      <section className="py-16 px-4 bg-[var(--bg-secondary)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            CREATE YOUR OWN BATTLE BOOK
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 text-lg">
            Want to see these battles fully illustrated? Generate a custom book in 60 seconds.
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
          <p>© 2025 FightingBooks • A fan tribute to Jerry Pallotta's Who Would Win? series</p>
        </div>
      </footer>
    </main>
  );
}
