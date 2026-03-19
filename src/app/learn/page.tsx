import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wildlife Learning Center | Educational Animal Activities & Books',
  description: 'Free educational resources for teaching kids about wildlife through animal comparisons. Activities, printable books, and science lessons for ages 5-12.',
  keywords: ['animal education', 'wildlife learning', 'science activities', 'educational resources', 'printable books'],
  openGraph: {
    title: 'Wildlife Learning Center | Educational Animal Activities & Books',
    description: 'Free educational resources, printable books, and wildlife learning activities for kids, parents, teachers, and homeschoolers.',
    type: 'website',
    url: 'https://whowouldwinbooks.com/learn',
    siteName: 'FightingBooks',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FightingBooks Wildlife Learning Center',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wildlife Learning Center | Educational Animal Activities & Books',
    description: 'Educational animal activities, printable books, and wildlife learning resources for kids.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/learn',
  },
};

const articles = [
  {
    slug: 'gorilla-vs-grizzly-bear-who-would-win',
    title: 'Gorilla vs Grizzly Bear: Who Would Win?',
    description: 'Educational analysis of this classic wildlife matchup with scientific facts, comparison charts, and printable book resources.',
    category: 'Animal Comparisons',
    readTime: '8 min',
  },
  {
    slug: 'animal-comparison-activities-for-kids',
    title: 'Animal Comparison Activities for Kids',
    description: 'Engaging classroom and homeschool activities that use animal comparisons to teach critical thinking and scientific reasoning.',
    category: 'Teaching Resources',
    readTime: '10 min',
  },
  {
    slug: 'who-would-win-animal-books-for-kids',
    title: 'Who Would Win Animal Books for Kids',
    description: 'Compare traditional Who Would Win books with interactive, customizable alternatives. Find the best option for your classroom or home.',
    category: 'Book Reviews',
    readTime: '9 min',
  },
  {
    slug: 'printable-animal-battle-books',
    title: 'Printable Animal Battle Books',
    description: 'Free downloadable wildlife learning PDFs for kids ages 5-7. Print instantly and build your educational library at zero cost.',
    category: 'Free Resources',
    readTime: '7 min',
  },
  {
    slug: 'fun-science-activities-kids-animals',
    title: 'Fun Science Activities: Animals & Wildlife',
    description: 'Hands-on science activities using animal comparisons to teach biology, observation skills, and the scientific method.',
    category: 'Science Activities',
    readTime: '11 min',
  },
];

export default function LearnPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Wildlife Learning Center',
            url: 'https://whowouldwinbooks.com/learn',
            description: 'Educational animal activities, printable books, and wildlife learning resources for kids, parents, teachers, and homeschoolers.',
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
                name: 'Learning Center',
                item: 'https://whowouldwinbooks.com/learn',
              },
            ],
          }),
        }}
      />
      {/* Header */}
      <header className="border-b border-[var(--border-accent)] bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link href="/" className="text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] text-sm font-bold uppercase tracking-wide mb-4 inline-block">
            ← Back to Generator
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Wildlife Learning Center
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-3xl">
            Free educational resources, activities, and printable books to help kids learn about wildlife through engaging animal comparisons.
          </p>
        </div>
      </header>

      {/* Hero CTA */}
      <section className="py-12 px-4 bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-[var(--accent-gold)]" style={{ fontFamily: 'var(--font-display)' }}>
            Create Custom Wildlife Books for Free
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-6">
            Turn any animal matchup into a beautifully illustrated learning book. Perfect for classrooms, homeschool, or curious kids.
          </p>
          <Link
            href="/"
            className="btn-primary inline-block px-8 py-3 rounded-lg text-lg font-bold hover:scale-105 transition-transform"
          >
            🦁 Generate Your First Book
          </Link>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-[var(--text-primary)]">Educational Articles & Resources</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/learn/${article.slug}`}
                className="group bg-[var(--bg-card)] border-2 border-[var(--border-accent)] rounded-lg p-6 hover:border-[var(--accent-gold)] transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-[var(--accent-gold)] uppercase tracking-wide">
                    {article.category}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">• {article.readTime} read</span>
                </div>
                
                <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors">
                  {article.title}
                </h3>
                
                <p className="text-[var(--text-secondary)] mb-4 leading-relaxed">
                  {article.description}
                </p>
                
                <span className="text-[var(--accent-gold)] font-bold text-sm group-hover:underline">
                  Read More →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-4 bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-[var(--text-primary)]">Popular Topics</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3 text-[var(--accent-gold)]">For Teachers</h3>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li><Link href="/teachers" className="hover:text-[var(--accent-gold)]">Teacher resource hub</Link></li>
                <li><Link href="/blog/classroom-resources" className="hover:text-[var(--accent-gold)]">Classroom activities and lesson plans</Link></li>
                <li><Link href="/learn/printable-animal-battle-books" className="hover:text-[var(--accent-gold)]">Free printable books for students</Link></li>
                <li><Link href="/learn/animal-comparison-activities-for-kids" className="hover:text-[var(--accent-gold)]">Animal comparison activities</Link></li>
              </ul>
            </div>
            
            <div className="bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3 text-[var(--accent-gold)]">For Parents</h3>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li><Link href="/parents" className="hover:text-[var(--accent-gold)]">Parent overview page</Link></li>
                <li><Link href="/learn/fun-science-activities-kids-animals" className="hover:text-[var(--accent-gold)]">Fun at-home science activities</Link></li>
                <li><Link href="/learn/who-would-win-animal-books-for-kids" className="hover:text-[var(--accent-gold)]">Book comparison guide</Link></li>
                <li><Link href="/learn/printable-animal-battle-books" className="hover:text-[var(--accent-gold)]">Printable learning materials</Link></li>
              </ul>
            </div>
            
            <div className="bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3 text-[var(--accent-gold)]">For Homeschool</h3>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li><Link href="/learn/animal-comparison-activities-for-kids" className="hover:text-[var(--accent-gold)]">Cross-curricular unit ideas</Link></li>
                <li><Link href="/" className="hover:text-[var(--accent-gold)]">Custom book creation</Link></li>
                <li><Link href="/learn/fun-science-activities-kids-animals" className="hover:text-[var(--accent-gold)]">Hands-on science projects</Link></li>
                <li><Link href="/blog/classroom-resources" className="hover:text-[var(--accent-gold)]">Flexible lesson prompts</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Animal Battles */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-[var(--text-primary)]">Popular Animal Battles</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { animals: 'Lion vs Tiger', slug: 'lion-vs-tiger' },
              { animals: 'Gorilla vs Bear', slug: 'gorilla-vs-bear' },
              { animals: 'Shark vs Crocodile', slug: 'crocodile-vs-shark' },
              { animals: 'Hippo vs Rhino', slug: 'hippo-vs-rhino' },
              { animals: 'Polar Bear vs Grizzly', slug: 'polar-bear-vs-grizzly-bear' },
              { animals: 'Killer Whale vs Shark', slug: 'orca-vs-great-white-shark' },
              { animals: 'Elephant vs Rhino', slug: 'elephant-vs-rhino' },
              { animals: 'Tiger vs Bear', slug: 'tiger-vs-bear' },
            ].map((battle) => (
              <Link
                key={battle.slug}
                href={`/blog/${battle.slug}`}
                className="bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-lg p-4 text-center hover:border-[var(--accent-gold)] transition-colors"
              >
                <span className="text-[var(--text-primary)] font-bold hover:text-[var(--accent-gold)]">
                  {battle.animals}
                </span>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link
              href="/battles"
              className="text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] font-bold"
            >
              Browse All Battles →
            </Link>
          </div>
        </div>
      </section>

      {/* Cross-site hub links */}
      <section className="py-16 px-4 bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-[var(--text-primary)]">Where to Go Next</h2>

          <div className="grid md:grid-cols-4 gap-6">
            <Link
              href="/battles"
              className="bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-lg p-6 hover:border-[var(--accent-gold)] transition-colors"
            >
              <h3 className="text-xl font-bold mb-3 text-[var(--accent-gold)]">Browse Battle Pages</h3>
              <p className="text-[var(--text-secondary)]">Explore the main matchup hub with the strongest canonical battle destinations.</p>
            </Link>

            <Link
              href="/battles/lion-vs-tiger"
              className="bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-lg p-6 hover:border-[var(--accent-gold)] transition-colors"
            >
              <h3 className="text-xl font-bold mb-3 text-[var(--accent-gold)]">Lion vs Tiger Battle</h3>
              <p className="text-[var(--text-secondary)]">Jump straight into one of the strongest matchup pages on the site.</p>
            </Link>

            <Link
              href="/parents"
              className="bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-lg p-6 hover:border-[var(--accent-gold)] transition-colors"
            >
              <h3 className="text-xl font-bold mb-3 text-[var(--accent-gold)]">For Parents</h3>
              <p className="text-[var(--text-secondary)]">See the parent-facing overview of how these books help with reading and critical thinking.</p>
            </Link>

            <Link
              href="/teachers"
              className="bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-lg p-6 hover:border-[var(--accent-gold)] transition-colors"
            >
              <h3 className="text-xl font-bold mb-3 text-[var(--accent-gold)]">For Teachers</h3>
              <p className="text-[var(--text-secondary)]">Open the teacher-specific landing page for classroom resources and printable paths.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-[var(--accent-gold)]" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-[var(--text-secondary)] mb-8">
            Create your first custom wildlife book in 30 seconds. Choose any two animals and get a beautifully illustrated educational book—free for popular matchups!
          </p>
          <Link
            href="/"
            className="btn-primary inline-block px-10 py-4 rounded-lg text-lg font-bold hover:scale-105 transition-transform"
          >
            🦁 Create Your Book Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[var(--bg-primary)] border-t border-[var(--border-accent)]">
        <div className="max-w-6xl mx-auto px-4 text-center text-[var(--text-muted)] text-sm">
          <p>© 2025 FightingBooks • Educational wildlife learning inspired by Who Would Win?</p>
        </div>
      </footer>
    </main>
  );
}
