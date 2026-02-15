import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

interface LearnArticle {
  slug: string;
  title: string;
  description: string;
  content: string;
  keywords: string[];
  datePublished: string;
}

const LEARN_ARTICLES: Record<string, Omit<LearnArticle, 'content' | 'slug'>> = {
  'gorilla-vs-grizzly-bear-who-would-win': {
    title: 'Gorilla vs Grizzly Bear: Who Would Win? Educational Analysis',
    description: 'Discover the fascinating science behind a gorilla vs grizzly bear battle. Educational comparison with wildlife facts, printable books, and interactive learning tools for kids.',
    keywords: ['gorilla vs grizzly bear who would win', 'animal comparison', 'wildlife education', 'who would win books'],
    datePublished: '2025-02-14',
  },
  'animal-comparison-activities-for-kids': {
    title: 'Animal Comparison Activities for Kids: Fun Wildlife Learning',
    description: 'Engaging animal comparison activities that teach kids critical thinking, wildlife facts, and scientific reasoning. Free printable books and interactive tools.',
    keywords: ['animal comparison activities for kids', 'educational activities', 'wildlife learning', 'science activities'],
    datePublished: '2025-02-14',
  },
  'who-would-win-animal-books-for-kids': {
    title: 'Who Would Win Animal Books for Kids: Interactive vs Traditional',
    description: 'Compare traditional Who Would Win books with interactive, customizable alternatives. Create personalized wildlife learning experiences for ages 5-8.',
    keywords: ['who would win animal books for kids', 'jerry pallotta books', 'educational books', 'interactive books'],
    datePublished: '2025-02-14',
  },
  'printable-animal-battle-books': {
    title: 'Printable Animal Battle Books: Free Wildlife Learning PDFs',
    description: 'Download free printable animal battle books for kids ages 5-7. Educational wildlife comparisons with vivid illustrations and scientific facts.',
    keywords: ['printable animal battle books', 'free printable books', 'animal books pdf', 'educational printables'],
    datePublished: '2025-02-14',
  },
  'fun-science-activities-kids-animals': {
    title: 'Fun Science Activities for Kids: Animals & Wildlife Exploration',
    description: 'Hands-on science activities using animal comparisons to teach biology, critical thinking, and research skills. Perfect for homeschool and classroom.',
    keywords: ['fun science activities kids animals', 'wildlife science', 'educational activities', 'animal learning'],
    datePublished: '2025-02-14',
  },
};

const VALID_SLUGS = Object.keys(LEARN_ARTICLES);

function getArticleData(slug: string): LearnArticle | null {
  if (!VALID_SLUGS.includes(slug)) {
    return null;
  }

  const articlesDir = path.join(process.cwd(), 'content', 'learn');
  const filePath = path.join(articlesDir, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const metadata = LEARN_ARTICLES[slug];

  return {
    slug,
    content,
    ...metadata,
  };
}

// Generate static params for all articles
export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({
    slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleData(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      publishedTime: article.datePublished,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
    },
  };
}

// Convert markdown to HTML
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-xl font-bold mt-6 mb-3 text-[var(--text-primary)]">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-2xl font-bold mt-8 mb-4 text-[var(--text-primary)]">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-3xl font-bold mt-12 mb-6 text-[var(--accent-gold)]" style="font-family: var(--font-display)">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-4xl md:text-5xl font-bold mb-6 text-[var(--text-primary)]" style="font-family: var(--font-display)">$1</h1>');

  // Emphasis
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--accent-gold)] font-bold">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em class="text-[var(--text-secondary)] italic">$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] underline">$1</a>');

  // Lists
  html = html.replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 text-[var(--text-primary)] leading-relaxed">• $1</li>');
  
  // Wrap consecutive list items in ul
  html = html.replace(/(<li.+<\/li>\n?)+/g, '<ul class="mb-6">$&</ul>');

  // Paragraphs (must come after other replacements)
  html = html.replace(/^(?!<[huld])(.*[^ \n])$/gm, '<p class="mb-4 text-[var(--text-primary)] leading-relaxed text-lg">$1</p>');

  return html;
}

// Generate JSON-LD structured data
function generateStructuredData(article: LearnArticle) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.datePublished,
    author: {
      '@type': 'Organization',
      name: 'FightingBooks',
    },
    publisher: {
      '@type': 'Organization',
      name: 'FightingBooks',
      logo: {
        '@type': 'ImageObject',
        url: 'https://whowouldwinbooks.com/logo.png',
      },
    },
    keywords: article.keywords.join(', '),
  };
}

export default async function LearnArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleData(slug);

  if (!article) {
    notFound();
  }

  const htmlContent = markdownToHtml(article.content);
  const structuredData = generateStructuredData(article);

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Header */}
      <header className="border-b border-[var(--border-accent)] bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/learn" className="text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] text-sm font-bold uppercase tracking-wide">
            ← Back to Learning Center
          </Link>
        </div>
      </header>

      {/* Article Content */}
      <article className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Article body */}
          <div 
            className="prose prose-invert prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* CTA Box */}
          <div className="mt-16 p-8 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border-2 border-[var(--accent-gold)] rounded-lg text-center shadow-xl">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--accent-gold)]" style={{ fontFamily: 'var(--font-display)' }}>
              CREATE YOUR OWN WILDLIFE BOOK
            </h3>
            <p className="text-[var(--text-secondary)] mb-6 text-lg max-w-2xl mx-auto">
              Turn any animal matchup into a beautifully illustrated learning book. Free for popular battles, printable PDF included!
            </p>
            <Link
              href="/"
              className="btn-primary inline-block px-10 py-4 rounded-lg text-lg font-bold hover:scale-105 transition-transform"
            >
              🦁 Generate Your Book Now
            </Link>
          </div>

          {/* Related Articles */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 text-[var(--accent-gold)]">More Wildlife Learning</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {VALID_SLUGS
                .filter(s => s !== slug)
                .slice(0, 4)
                .map((relatedSlug) => {
                  const relatedArticle = LEARN_ARTICLES[relatedSlug];
                  return (
                    <Link
                      key={relatedSlug}
                      href={`/learn/${relatedSlug}`}
                      className="p-6 bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-lg hover:border-[var(--accent-gold)] transition-colors"
                    >
                      <h4 className="text-[var(--text-primary)] font-bold mb-2 hover:text-[var(--accent-gold)]">
                        {relatedArticle.title.split(':')[0]}
                      </h4>
                      <p className="text-[var(--text-muted)] text-sm">
                        {relatedArticle.description.substring(0, 100)}...
                      </p>
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="py-8 bg-[var(--bg-secondary)] border-t border-[var(--border-accent)]">
        <div className="max-w-4xl mx-auto px-4 text-center text-[var(--text-muted)] text-sm">
          <p>© 2025 FightingBooks • Educational wildlife learning inspired by Who Would Win?</p>
        </div>
      </footer>
    </main>
  );
}
