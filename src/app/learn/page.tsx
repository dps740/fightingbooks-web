import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wildlife Learning Center | Educational Animal Activities & Books',
  description: 'Free educational resources for teaching kids about wildlife through animal comparisons. Activities, printable books, and science lessons for ages 5-12.',
  keywords: ['animal education', 'wildlife learning', 'science activities', 'educational resources', 'printable books'],
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
              <ul className="space-y-2 text-[var(--text-secondary)]">
                <li>• Classroom activities and lesson plans</li>
                <li>• Free printable books for students</li>
                <li>• Curriculum-aligned resources</li>
                <li>• Assessment ideas</li>
              </ul>
            </div>
            
            <div className="bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3 text-[var(--accent-gold)]">For Parents</h3>
              <ul className="space-y-2 text-[var(--text-secondary)]">
                <li>• Fun at-home science activities</li>
                <li>• Bedtime reading resources</li>
                <li>• Educational wildlife comparisons</li>
                <li>• Printable learning materials</li>
              </ul>
            </div>
            
            <div className="bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3 text-[var(--accent-gold)]">For Homeschool</h3>
              <ul className="space-y-2 text-[var(--text-secondary)]">
                <li>• Cross-curricular unit studies</li>
                <li>• Custom book creation for any topic</li>
                <li>• Hands-on science projects</li>
                <li>• Flexible learning resources</li>
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
              href="/blog"
              className="text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] font-bold"
            >
              View All Battle Guides →
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
