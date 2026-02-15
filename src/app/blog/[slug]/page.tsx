import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import BookAffiliateSection from '@/components/BookAffiliateSection';

interface ArticleMetadata {
  title: string;
  description: string;
  animals?: [string, string];
  keywords?: string[];
  date?: string;
}

interface ArticleData {
  slug: string;
  content: string;
  metadata: ArticleMetadata;
}

// Article metadata mapping (slug -> animals)
const ARTICLE_ANIMALS: Record<string, [string, string] | undefined> = {
  // Cornerstone content (no specific animals)
  'who-would-win-book-list': undefined,
  'classroom-resources': undefined,
  'books-like-who-would-win': undefined,
  'who-would-win-complete-guide': undefined,
  // Battle pages
  'lion-vs-tiger': ['Lion', 'Tiger'],
  'gorilla-vs-bear': ['Gorilla', 'Grizzly Bear'],
  'hippo-vs-rhino': ['Hippo', 'Rhino'],
  'polar-bear-vs-grizzly-bear': ['Polar Bear', 'Grizzly Bear'],
  'tiger-vs-bear': ['Tiger', 'Grizzly Bear'],
  'crocodile-vs-shark': ['Crocodile', 'Great White Shark'],
  'hippo-vs-crocodile': ['Hippo', 'Crocodile'],
  'gorilla-vs-lion': ['Gorilla', 'Lion'],
  'elephant-vs-rhino': ['Elephant', 'Rhino'],
  'orca-vs-great-white-shark': ['Killer Whale', 'Great White Shark'],
  'wolf-vs-lion': ['Wolf', 'Lion'],
  'hammerhead-shark-vs-electric-eel': ['Hammerhead Shark', 'Electric Eel'],
  'giant-panda-vs-great-horned-owl': ['Giant Panda', 'Great Horned Owl'],
  'jaguar-vs-leopard': ['Jaguar', 'Leopard'],
  'anaconda-vs-crocodile': ['Anaconda', 'Crocodile'],
  'honey-badger-vs-lion': ['Honey Badger', 'Lion'],
  'komodo-dragon-vs-king-cobra': ['Komodo Dragon', 'King Cobra'],
};

const VALID_SLUGS = Object.keys(ARTICLE_ANIMALS);

function getArticleData(slug: string): ArticleData | null {
  if (!VALID_SLUGS.includes(slug)) {
    return null;
  }

  const articlesDir = path.join(process.cwd(), 'content', 'articles');
  const filePath = path.join(articlesDir, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(rawContent);

  // Prefer frontmatter title/description, fall back to H1/italic extraction
  let title = frontmatter.title;
  let description = frontmatter.description;

  if (!title) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    title = titleMatch ? titleMatch[1] : slug;
  }

  if (!description) {
    const descMatch = content.match(/\*(.+)\*/);
    description = descMatch ? descMatch[1] : '';
  }

  return {
    slug,
    content,
    metadata: {
      title,
      description,
      animals: ARTICLE_ANIMALS[slug],
      keywords: frontmatter.keywords,
      date: frontmatter.date,
    },
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
    title: `${article.metadata.title} | Who Would Win Books`,
    description: article.metadata.description,
    keywords: article.metadata.keywords,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: article.metadata.title,
      description: article.metadata.description,
      type: 'article',
    },
  };
}

// Convert markdown to HTML (simple version)
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-2xl font-bold mt-8 mb-4 text-[var(--text-primary)]">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-3xl font-bold mt-12 mb-6 text-[var(--accent-gold)]" style="font-family: var(--font-display)">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-5xl font-bold mb-4 text-[var(--text-primary)]" style="font-family: var(--font-display)">$1</h1>');

  // Emphasis
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--accent-gold)] font-bold">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em class="text-[var(--text-secondary)] italic">$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] underline">$1</a>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<div class="section-divider my-8"></div>');

  // Paragraphs
  html = html.replace(/^(?!<[h|d|u|t])(.*[^ ])$/gm, '<p class="mb-4 text-[var(--text-primary)] leading-relaxed">$1</p>');

  // Lists
  html = html.replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 text-[var(--text-primary)]">• $1</li>');

  // Tables (simplified)
  html = html.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split('|').filter(c => c.trim());
    const cellsHtml = cells.map((cell, i) => 
      i === 0 
        ? `<td class="px-4 py-2 font-bold text-[var(--text-secondary)]">${cell.trim()}</td>`
        : `<td class="px-4 py-2 text-[var(--text-primary)]">${cell.trim()}</td>`
    ).join('');
    return `<tr class="stat-row">${cellsHtml}</tr>`;
  });

  // Wrap tables
  if (html.includes('<tr')) {
    html = html.replace(/(<tr.+<\/tr>\s*)+/gs, '<div class="tale-of-tape rounded-lg overflow-hidden my-8"><table class="w-full">$&</table></div>');
  }

  return html;
}

// Get related articles that share an animal with the current article
function getRelatedSlugs(currentSlug: string): string[] {
  const currentAnimals = ARTICLE_ANIMALS[currentSlug];
  
  const otherSlugs = VALID_SLUGS.filter(s => s !== currentSlug);
  
  if (!currentAnimals) {
    // For cornerstone content, just return first 4
    return otherSlugs.slice(0, 4);
  }

  // Score each slug by shared animals
  const scored = otherSlugs.map(s => {
    const animals = ARTICLE_ANIMALS[s];
    let score = 0;
    if (animals) {
      for (const animal of animals) {
        if (currentAnimals.includes(animal)) {
          score += 1;
        }
      }
    }
    return { slug: s, score };
  });

  // Sort by score descending, then take top 4
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 4).map(s => s.slug);
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleData(slug);

  if (!article) {
    notFound();
  }

  const htmlContent = markdownToHtml(article.content);
  const relatedSlugs = getRelatedSlugs(slug);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whowouldwinbooks.com';

  // JSON-LD Article schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.metadata.title,
    description: article.metadata.description,
    url: `${baseUrl}/blog/${slug}`,
    datePublished: article.metadata.date || '2026-02-08',
    publisher: {
      '@type': 'Organization',
      name: 'Who Would Win Books',
      url: baseUrl,
    },
  };

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="border-b border-[var(--border-accent)] bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/blog" className="text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] text-sm font-bold uppercase tracking-wide">
            ← Back to All Guides
          </Link>
        </div>
      </header>

      {/* Article Content */}
      <article className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Article body */}
          <div 
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* CTA Box */}
          <div className="mt-16 p-8 bg-[var(--bg-card)] border-2 border-[var(--accent-gold)] rounded-lg text-center">
            <h3 className="text-3xl font-bold mb-4 text-[var(--accent-gold)]" style={{ fontFamily: 'var(--font-display)' }}>
              CREATE YOUR OWN BATTLE BOOK
            </h3>
            <p className="text-[var(--text-secondary)] mb-6 text-lg">
              See this matchup fully illustrated with AI-generated artwork. Free for popular battles.
            </p>
            <Link
              href="/"
              className="btn-primary inline-block px-10 py-4 rounded-lg text-lg font-bold hover:scale-105 transition-transform"
            >
              🦁 Generate Book Now
            </Link>
          </div>

          {/* Related Articles */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 text-[var(--accent-gold)]">Related Battles</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {relatedSlugs.map((relatedSlug) => (
                  <Link
                    key={relatedSlug}
                    href={`/blog/${relatedSlug}`}
                    className="p-4 bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-lg hover:border-[var(--accent-gold)] transition-colors"
                  >
                    <span className="text-[var(--text-primary)] hover:text-[var(--accent-gold)]">
                      {relatedSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </article>

      {/* Book Affiliate Section */}
      <BookAffiliateSection animals={article.metadata.animals} />

      {/* Footer */}
      <footer className="py-8 bg-[var(--bg-secondary)] border-t border-[var(--border-accent)]">
        <div className="max-w-4xl mx-auto px-4 text-center text-[var(--text-muted)] text-sm">
          <p>© 2025 FightingBooks • A fan tribute to Jerry Pallotta&apos;s Who Would Win? series</p>
        </div>
      </footer>
    </main>
  );
}
