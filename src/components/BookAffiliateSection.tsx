'use client';

import Image from 'next/image';
import { WHO_WOULD_WIN_BOOKS, findRelatedBooks, type WhoWouldWinBook } from '@/data/who-would-win-books';

interface BookAffiliateSectionProps {
  /** Animals from the current battle (e.g., ["Lion", "Tiger"]) */
  animals?: [string, string];
  /** Show all books or just featured ones */
  showAll?: boolean;
  /** Maximum books to show (default: 24 for all) */
  limit?: number;
}

export default function BookAffiliateSection({ 
  animals, 
  showAll = true,
  limit 
}: BookAffiliateSectionProps) {
  // Find related books if animals provided
  const relatedBooks = animals ? findRelatedBooks(animals[0], animals[1]) : [];
  const otherBooks = animals 
    ? WHO_WOULD_WIN_BOOKS.filter(book => !relatedBooks.includes(book))
    : WHO_WOULD_WIN_BOOKS;

  // Combine related first, then others
  let booksToShow: WhoWouldWinBook[] = [...relatedBooks, ...otherBooks];
  
  // Apply limit if specified
  if (limit && limit < booksToShow.length) {
    booksToShow = booksToShow.slice(0, limit);
  }

  return (
    <section className="py-12 px-4 bg-[var(--bg-card)] border-y-2 border-[var(--accent-gold)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 
            className="text-4xl font-bold mb-3 text-[var(--accent-gold)]" 
            style={{ fontFamily: 'var(--font-display)' }}
          >
            📚 LOVE ANIMAL BATTLES?
          </h2>
          <p className="text-xl text-[var(--text-secondary)] mb-2">
            Check out Jerry Pallotta's Who Would Win? book series!
          </p>
          {relatedBooks.length > 0 && (
            <p className="text-sm text-[var(--accent-gold)] font-bold">
              ⭐ {relatedBooks.length} related {relatedBooks.length === 1 ? 'book' : 'books'} shown first
            </p>
          )}
        </div>

        {/* Book Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          {booksToShow.map((book, index) => {
            const isRelated = relatedBooks.includes(book);
            
            return (
              <a
                key={book.asin}
                href={book.amazonUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="group relative"
              >
                {/* Related badge */}
                {isRelated && (
                  <div className="absolute -top-2 -right-2 bg-[var(--accent-red)] text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg">
                    ⭐
                  </div>
                )}

                {/* Book cover */}
                <div className="relative aspect-[2/3] bg-[var(--bg-secondary)] rounded-lg overflow-hidden border-2 border-[var(--border-accent)] group-hover:border-[var(--accent-gold)] transition-all duration-300 shadow-lg group-hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-center px-2">
                      <p className="text-white font-bold text-xs mb-1">{book.title}</p>
                      <p className="text-[var(--accent-gold)] text-xs font-bold">View on Amazon →</p>
                    </div>
                  </div>
                </div>

                {/* Title (mobile only) */}
                <p className="mt-2 text-xs text-center text-[var(--text-secondary)] line-clamp-2 sm:hidden">
                  {book.title}
                </p>
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-[var(--border-accent)]">
          <p className="text-sm text-[var(--text-muted)] mb-3">
            <strong className="text-[var(--text-primary)]">FightingBooks is a fan project.</strong> We encourage everyone to support Jerry Pallotta's original series!
          </p>
          <a
            href={`https://www.amazon.com/s?k=who+would+win+jerry+pallotta&tag=${WHO_WOULD_WIN_BOOKS[0].amazonUrl.split('tag=')[1]}`}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-block bg-[var(--accent-gold)] text-[var(--bg-primary)] px-6 py-3 rounded-lg font-bold hover:bg-[var(--accent-gold-dark)] transition-colors shadow-lg hover:shadow-xl"
          >
            Browse All Books on Amazon →
          </a>
        </div>
      </div>
    </section>
  );
}
