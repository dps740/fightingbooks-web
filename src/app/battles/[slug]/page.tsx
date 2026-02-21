import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import BattleAnimalPortrait from '@/components/BattleAnimalPortrait';

// Map animal display names → their actual image slug in /public/fighters/
// Only needed for names that don't match the simple lowercase-hyphen pattern
const IMAGE_SLUG_OVERRIDES: Record<string, string> = {
  'T-Rex': 'tyrannosaurus-rex',
  't-rex': 'tyrannosaurus-rex',
  'Tyrannosaurus Rex': 'tyrannosaurus-rex',
  'Killer Whale': 'orca',
  'Grizzly': 'grizzly-bear',
};

function animalToImageSlug(name: string): string {
  // Check overrides first
  if (IMAGE_SLUG_OVERRIDES[name]) return IMAGE_SLUG_OVERRIDES[name];
  // Default: lowercase, spaces and special chars → hyphens
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface BattleMetadata {
  title: string;
  description: string;
  keywords?: string[];
  date?: string;
  animal_a?: string;
  animal_b?: string;
}

interface BattleData {
  slug: string;
  content: string;
  metadata: BattleMetadata;
  animalA: string;
  animalB: string;
}

const BATTLES_DIR = path.join(process.cwd(), 'content', 'battles');

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function slugToAnimals(slug: string): [string, string] {
  // Handle "vs" separator
  const vsIndex = slug.indexOf('-vs-');
  if (vsIndex === -1) {
    const parts = slug.split('-');
    const mid = Math.floor(parts.length / 2);
    return [
      parts.slice(0, mid).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      parts.slice(mid).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    ];
  }
  const rawA = slug.slice(0, vsIndex);
  const rawB = slug.slice(vsIndex + 4);
  const toName = (s: string) =>
    s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return [toName(rawA), toName(rawB)];
}

function getBattleData(slug: string): BattleData | null {
  const filePath = path.join(BATTLES_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(rawContent);

  const [animalA, animalB] = slugToAnimals(slug);

  let title = frontmatter.title;
  let description = frontmatter.description;

  if (!title) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    title = titleMatch ? titleMatch[1] : `${animalA} vs ${animalB}: Who Would Win?`;
  }

  if (!description) {
    const descMatch = content.match(/\*(.+)\*/);
    description = descMatch ? descMatch[1] : `${animalA} vs ${animalB} — who wins in a fight? Full stats, weapons, and verdict.`;
  }

  return {
    slug,
    content,
    metadata: {
      title,
      description,
      keywords: frontmatter.keywords,
      date: frontmatter.date,
      animal_a: frontmatter.animal_a,
      animal_b: frontmatter.animal_b,
    },
    animalA: frontmatter.animal_a || animalA,
    animalB: frontmatter.animal_b || animalB,
  };
}

function getAllBattleSlugs(): string[] {
  try {
    const files = fs.readdirSync(BATTLES_DIR);
    return files
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
  } catch {
    return [];
  }
}

export function generateStaticParams() {
  const slugs = getAllBattleSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const battle = getBattleData(slug);

  if (!battle) {
    return { title: 'Battle Not Found' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whowouldwinbooks.com';

  return {
    title: `${battle.metadata.title} | Who Would Win Books`,
    description: battle.metadata.description,
    keywords: battle.metadata.keywords,
    alternates: {
      canonical: `${baseUrl}/battles/${slug}`,
    },
    openGraph: {
      title: battle.metadata.title,
      description: battle.metadata.description,
      type: 'article',
      url: `${baseUrl}/battles/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: battle.metadata.title,
      description: battle.metadata.description,
    },
  };
}

interface FighterPortrait {
  name: string;
  src: string;
}

function markdownToHtml(
  markdown: string,
  portraitA?: FighterPortrait,
  portraitB?: FighterPortrait,
): string {
  let html = markdown;

  // Headers — process in reverse order (h3 before h2 before h1)
  html = html.replace(/^### (.+)$/gm, (_match, rawTitle: string) => {
    // Strip leading emoji characters (🥊, etc.)
    const cleanTitle = rawTitle.replace(/^\p{Emoji}+\s*/u, '').trim();

    // Inject portrait image if this H3 is a fighter section
    let portraitHtml = '';
    const titleLower = cleanTitle.toLowerCase();
    const candidates: FighterPortrait[] = [portraitA, portraitB].filter(Boolean) as FighterPortrait[];
    for (const p of candidates) {
      if (titleLower.includes(p.name.toLowerCase())) {
        portraitHtml = `<div class="my-4 flex justify-center"><img src="${p.src}" alt="${p.name}" width="140" height="140" style="border-radius:50%;border:2px solid var(--accent-gold);object-fit:cover;width:140px;height:140px" loading="lazy" onerror="this.style.display='none'" /></div>`;
        break;
      }
    }

    return `<h3 class="text-xl font-bold mt-6 mb-3 text-[var(--text-primary)]">${cleanTitle}</h3>${portraitHtml}`;
  });
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="text-3xl font-bold mt-12 mb-6 text-[var(--accent-gold)]" style="font-family: var(--font-display)">$1</h2>'
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h1 class="text-4xl md:text-5xl font-bold mb-4 text-[var(--text-primary)]" style="font-family: var(--font-display)">$1</h1>'
  );

  // Bold & italic
  html = html.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="text-[var(--accent-gold)] font-bold">$1</strong>'
  );
  html = html.replace(
    /\*(.+?)\*/g,
    '<em class="text-[var(--text-secondary)] italic">$1</em>'
  );

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-[var(--accent-gold)] hover:underline">$1</a>'
  );

  // Horizontal rules
  html = html.replace(
    /^---$/gm,
    '<div class="section-divider my-8" style="border-top: 1px solid var(--border-accent)"></div>'
  );

  // Tables — collect rows and wrap in a table
  const tableRowRegex = /\|(.+)\|/;
  const lines = html.split('\n');
  const result: string[] = [];
  let inTable = false;
  let isFirstRow = true;
  let tableHtml = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (tableRowRegex.test(line)) {
      if (!inTable) {
        inTable = true;
        isFirstRow = true;
        tableHtml =
          '<div class="overflow-x-auto my-8"><table class="w-full border-collapse rounded-lg overflow-hidden">';
      }
      // Skip separator rows (e.g. |---|---|)
      if (/^\|[-:| ]+\|$/.test(line)) continue;

      const cells = line.split('|').filter(c => c !== '');
      if (isFirstRow) {
        // Header row
        tableHtml += '<thead><tr class="bg-[var(--accent-gold)] text-[var(--bg-primary)]">';
        cells.forEach(cell => {
          tableHtml += `<th class="px-4 py-3 font-bold text-left">${cell.trim()}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        isFirstRow = false;
      } else {
        tableHtml += '<tr class="border-b border-[var(--border-accent)] even:bg-[var(--bg-secondary)]">';
        cells.forEach((cell, idx) => {
          const cls =
            idx === 0
              ? 'px-4 py-3 font-semibold text-[var(--text-secondary)]'
              : 'px-4 py-3 text-[var(--text-primary)]';
          tableHtml += `<td class="${cls}">${cell.trim()}</td>`;
        });
        tableHtml += '</tr>';
      }
    } else {
      if (inTable) {
        tableHtml += '</tbody></table></div>';
        result.push(tableHtml);
        tableHtml = '';
        inTable = false;
        isFirstRow = true;
      }
      result.push(lines[i]);
    }
  }
  if (inTable) {
    tableHtml += '</tbody></table></div>';
    result.push(tableHtml);
  }
  html = result.join('\n');

  // Unordered lists
  html = html.replace(
    /^- (.+)$/gm,
    '<li class="ml-6 mb-2 text-[var(--text-primary)] list-disc">$1</li>'
  );
  // Wrap consecutive <li> items in <ul>
  html = html.replace(
    /(<li[^>]*>.*<\/li>\n?)+/gs,
    match => `<ul class="my-4 space-y-1">${match}</ul>`
  );

  // Paragraphs — lines that aren't already wrapped in a tag
  const paraLines = html.split('\n');
  const paras: string[] = [];
  for (const line of paraLines) {
    const trimmed = line.trim();
    if (
      trimmed === '' ||
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<ul') ||
      trimmed.startsWith('<li') ||
      trimmed.startsWith('</ul') ||
      trimmed.startsWith('</li') ||
      trimmed.startsWith('<div') ||
      trimmed.startsWith('</div') ||
      trimmed.startsWith('<table') ||
      trimmed.startsWith('</table') ||
      trimmed.startsWith('<thead') ||
      trimmed.startsWith('</thead') ||
      trimmed.startsWith('<tbody') ||
      trimmed.startsWith('</tbody') ||
      trimmed.startsWith('<tr') ||
      trimmed.startsWith('</tr') ||
      trimmed.startsWith('<th') ||
      trimmed.startsWith('<td')
    ) {
      paras.push(line);
    } else {
      paras.push(
        `<p class="mb-5 text-[var(--text-primary)] leading-relaxed text-lg">${trimmed}</p>`
      );
    }
  }
  html = paras.join('\n');

  return html;
}

function getRelatedBattles(currentSlug: string, currentAnimalA: string, currentAnimalB: string): { slug: string; title: string }[] {
  const allSlugs = getAllBattleSlugs().filter(s => s !== currentSlug);

  const normalizedA = currentAnimalA.toLowerCase();
  const normalizedB = currentAnimalB.toLowerCase();

  const scored = allSlugs.map(slug => {
    const slugLower = slug.toLowerCase();
    let score = 0;
    if (slugLower.includes(normalizedA.replace(/ /g, '-'))) score += 2;
    if (slugLower.includes(normalizedB.replace(/ /g, '-'))) score += 2;
    // Partial name matching
    const aParts = normalizedA.split(' ');
    const bParts = normalizedB.split(' ');
    for (const part of [...aParts, ...bParts]) {
      if (part.length > 3 && slugLower.includes(part)) score += 1;
    }
    return { slug, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 4).map(({ slug }) => ({
    slug,
    title: slugToTitle(slug.replace(/-vs-/g, ' vs ')),
  }));
}

export default async function BattlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const battle = getBattleData(slug);

  if (!battle) {
    notFound();
  }

  const portraitA: FighterPortrait = {
    name: battle.animalA,
    src: `/fighters/${animalToImageSlug(battle.animalA)}.jpg`,
  };
  const portraitB: FighterPortrait = {
    name: battle.animalB,
    src: `/fighters/${animalToImageSlug(battle.animalB)}.jpg`,
  };
  const htmlContent = markdownToHtml(battle.content, portraitA, portraitB);
  const relatedBattles = getRelatedBattles(slug, battle.animalA, battle.animalB);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whowouldwinbooks.com';

  // Build book generator URL using /read route
  const genUrl = `/read?a=${encodeURIComponent(battle.animalA)}&b=${encodeURIComponent(battle.animalB)}&env=neutral&mode=standard`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: battle.metadata.title,
    description: battle.metadata.description,
    url: `${baseUrl}/battles/${slug}`,
    datePublished: battle.metadata.date || new Date().toISOString().split('T')[0],
    dateModified: battle.metadata.date || new Date().toISOString().split('T')[0],
    publisher: {
      '@type': 'Organization',
      name: 'Who Would Win Books',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    author: {
      '@type': 'Organization',
      name: 'Who Would Win Books',
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
      <header
        className="border-b border-[var(--border-accent)]"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link
            href="/"
            className="text-[var(--accent-gold)] hover:opacity-80 font-bold text-lg"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            🥊 Who Would Win Books
          </Link>
          <Link
            href="/battles"
            className="text-sm font-bold uppercase tracking-wide text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors"
          >
            ← All Battles
          </Link>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <nav className="text-sm text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--accent-gold)]">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/battles" className="hover:text-[var(--accent-gold)]">Battles</Link>
          <span className="mx-2">›</span>
          <span className="text-[var(--text-secondary)]">{battle.animalA} vs {battle.animalB}</span>
        </nav>
      </div>

      {/* Article Content */}
      <article className="py-10 px-4">
        <div className="max-w-4xl mx-auto">

          {/* VS Hero Section */}
          <div
            className="flex items-center justify-center gap-4 md:gap-12 my-10 p-6 md:p-8 rounded-2xl"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-accent)' }}
          >
            <BattleAnimalPortrait
              src={`/fighters/${animalToImageSlug(battle.animalA)}.jpg`}
              alt={battle.animalA}
              name={battle.animalA}
            />

            {/* VS badge */}
            <div
              className="text-5xl md:text-7xl font-black shrink-0 select-none"
              style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-display)' }}
            >
              VS
            </div>

            <BattleAnimalPortrait
              src={`/fighters/${animalToImageSlug(battle.animalB)}.jpg`}
              alt={battle.animalB}
              name={battle.animalB}
            />
          </div>

          {/* Article body */}
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Primary CTA */}
          <div
            className="mt-16 p-8 rounded-xl text-center"
            style={{
              background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)',
              border: '2px solid var(--accent-gold)',
            }}
          >
            <div className="text-5xl mb-4">📖⚔️</div>
            <h3
              className="text-3xl font-bold mb-3 text-[var(--accent-gold)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              See the Full Illustrated Battle Book
            </h3>
            <p className="text-[var(--text-secondary)] mb-6 text-lg max-w-lg mx-auto">
              Get a full illustrated book for this exact matchup — AI-generated artwork, full
              stats, and a page-by-page battle narrative.
            </p>
            <Link
              href={genUrl}
              className="btn-primary inline-block px-10 py-4 rounded-lg text-xl font-bold hover:scale-105 transition-transform"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              🥊 Generate {battle.animalA} vs {battle.animalB} Book →
            </Link>
            <p className="text-[var(--text-muted)] text-sm mt-3">
              Free for popular matchups • whowouldwinbooks.com
            </p>
          </div>

          {/* Related Battles */}
          {relatedBattles.length > 0 && (
            <div className="mt-14">
              <h3
                className="text-2xl font-bold mb-6 text-[var(--accent-gold)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Related Battles
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {relatedBattles.map(({ slug: rSlug, title }) => (
                  <Link
                    key={rSlug}
                    href={`/battles/${rSlug}`}
                    className="group p-5 rounded-lg border transition-colors"
                    style={{
                      background: 'var(--bg-card)',
                      borderColor: 'var(--border-accent)',
                    }}
                  >
                    <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors">
                      ⚔️ {title}
                    </span>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Who would win?</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Secondary CTA */}
          <div className="mt-12 p-6 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
            <p className="text-[var(--text-secondary)] mb-3">
              Want to explore more matchups?
            </p>
            <Link
              href="/"
              className="text-[var(--accent-gold)] font-bold hover:underline"
            >
              Browse all animal battles at whowouldwinbooks.com →
            </Link>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer
        className="py-8 border-t border-[var(--border-accent)]"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center text-[var(--text-muted)] text-sm">
          <p>
            © {new Date().getFullYear()} Who Would Win Books •{' '}
            <Link href="/blog" className="hover:text-[var(--accent-gold)]">
              Battle Guides
            </Link>{' '}
            •{' '}
            <Link href="/battles" className="hover:text-[var(--accent-gold)]">
              All Battles
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
