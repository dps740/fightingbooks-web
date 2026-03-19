import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Animal Battle Classroom Resources for Teachers | FightingBooks',
  description: 'Teacher-friendly animal comparison resources, printable battle books, classroom activities, and discussion prompts for grades 1-5.',
  keywords: [
    'animal comparison activities for teachers',
    'animal battle classroom resources',
    'who would win classroom resources',
    'printable animal books for classroom',
    'wildlife lesson ideas',
  ],
  openGraph: {
    title: 'Animal Battle Classroom Resources for Teachers | FightingBooks',
    description: 'Classroom-ready wildlife comparison resources, printable books, and discussion prompts for teachers and homeschool educators.',
    type: 'website',
    url: 'https://whowouldwinbooks.com/teachers',
    siteName: 'FightingBooks',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FightingBooks teacher resources',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Animal Battle Classroom Resources for Teachers | FightingBooks',
    description: 'Teacher-friendly wildlife comparison resources, printable books, and classroom prompts.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/teachers',
  },
};

const resourceCards = [
  {
    title: 'Classroom Resources Guide',
    href: '/blog/classroom-resources',
    description: 'Lesson-plan style prompts, standards-friendly discussion ideas, and book-study structure.',
  },
  {
    title: 'Animal Comparison Activities',
    href: '/learn/animal-comparison-activities-for-kids',
    description: 'Critical-thinking activities built around comparing speed, size, weapons, and habitat.',
  },
  {
    title: 'Printable Animal Battle Books',
    href: '/learn/printable-animal-battle-books',
    description: 'Printable resources you can use for centers, homework, or quick reading stations.',
  },
  {
    title: 'Fun Wildlife Science Activities',
    href: '/learn/fun-science-activities-kids-animals',
    description: 'Science-angle activities that make animal matchups more than just entertainment.',
  },
  {
    title: 'Who Would Win Book Alternatives',
    href: '/learn/who-would-win-animal-books-for-kids',
    description: 'Useful if you want the same hook as classic matchup books but with more flexibility.',
  },
  {
    title: 'Browse Canonical Battle Pages',
    href: '/battles',
    description: 'The strongest direct matchup destination on the site, with canonical battle URLs.',
  },
];

const useCases = [
  'Bell-ringer compare/contrast prompts',
  'Opinion writing with evidence',
  'Small-group nonfiction discussion',
  'Science extension for habitats and adaptations',
  'Printable reading station material',
  'Fast sub-plan or enrichment activity',
];

export default function TeachersPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Animal Battle Classroom Resources for Teachers',
            url: 'https://whowouldwinbooks.com/teachers',
            description: 'Teacher-friendly animal comparison resources, printable battle books, and classroom activities.',
            isPartOf: {
              '@type': 'WebSite',
              name: 'FightingBooks',
              url: 'https://whowouldwinbooks.com',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://whowouldwinbooks.com',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Teachers',
                item: 'https://whowouldwinbooks.com/teachers',
              },
            ],
          }),
        }}
      />

      <header className="border-b border-[var(--border-accent)] bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link href="/learn" className="text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] text-sm font-bold uppercase tracking-wide mb-4 inline-block">
            ← Back to Learning Center
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Classroom Animal Battle Resources for Teachers
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-4xl">
            A cleaner landing page for teachers, librarians, and homeschool educators who want wildlife reading prompts,
            printable battle books, and compare-and-contrast activities without digging through the whole site.
          </p>
        </div>
      </header>

      <section className="py-12 px-4 bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-[var(--accent-gold)]" style={{ fontFamily: 'var(--font-display)' }}>
              Built for high-interest reading and evidence-based discussion
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-6 leading-relaxed">
              The strongest classroom use case here is simple: kids care about the matchup, then you turn that energy into
              reading, science vocabulary, compare/contrast writing, and supported argument.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/blog/classroom-resources" className="btn-primary inline-block px-8 py-3 rounded-lg text-lg font-bold hover:scale-105 transition-transform">
                Open classroom guide
              </Link>
              <Link href="/" className="inline-block px-8 py-3 rounded-lg text-lg font-bold border border-[var(--border-accent)] text-[var(--text-primary)] hover:border-[var(--accent-gold)] transition-colors">
                Generate a custom book
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-accent)] bg-[var(--bg-card)] p-6">
            <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">Strong classroom uses</h3>
            <ul className="space-y-3 text-[var(--text-secondary)]">
              {useCases.map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed">
                  <span className="text-[var(--accent-gold)]">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-[var(--text-primary)]">Best teacher-facing pages on the site</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resourceCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group bg-[var(--bg-card)] border-2 border-[var(--border-accent)] rounded-lg p-6 hover:border-[var(--accent-gold)] transition-all"
              >
                <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors">
                  {card.title}
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {card.description}
                </p>
                <span className="mt-4 inline-block text-[var(--accent-gold)] font-bold text-sm group-hover:underline">
                  Open resource →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-[var(--text-primary)]">Suggested teacher workflow</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              ['1', 'Pick a matchup', 'Start with a familiar battle like Lion vs Tiger or Orca vs Great White Shark.'],
              ['2', 'Read the guide', 'Use the guide page or classroom-resources article to anchor discussion.'],
              ['3', 'Print or generate', 'Use printable resources or create a custom book from the generator.'],
              ['4', 'Turn it into writing', 'Have students defend a winner using facts instead of guesses.'],
            ].map(([step, title, body]) => (
              <div key={step} className="rounded-xl border border-[var(--border-accent)] bg-[var(--bg-card)] p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-gold)] text-[var(--bg-primary)] font-bold mb-4">
                  {step}
                </span>
                <h3 className="text-lg font-bold mb-2 text-[var(--text-primary)]">{title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-6">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-[var(--accent-gold)]" style={{ fontFamily: 'var(--font-display)' }}>
            Want a fast entry point?
          </h2>
          <p className="text-xl text-[var(--text-secondary)] mb-8">
            Start with the classroom resources guide, then jump to printable books or generate a custom matchup for your lesson.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/blog/classroom-resources" className="btn-primary inline-block px-10 py-4 rounded-lg text-lg font-bold hover:scale-105 transition-transform">
              Classroom resources
            </Link>
            <Link href="/learn/printable-animal-battle-books" className="inline-block px-10 py-4 rounded-lg text-lg font-bold border border-[var(--border-accent)] text-[var(--text-primary)] hover:border-[var(--accent-gold)] transition-colors">
              Printable books
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-8 bg-[var(--bg-primary)] border-t border-[var(--border-accent)]">
        <div className="max-w-6xl mx-auto px-4 text-center text-[var(--text-muted)] text-sm">
          <p>
            © 2026 FightingBooks • <Link href="/learn" className="hover:text-[var(--accent-gold)]">Learning Center</Link> • <Link href="/parents" className="hover:text-[var(--accent-gold)]">For Parents</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
