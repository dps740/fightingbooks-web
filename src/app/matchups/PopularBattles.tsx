'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PopularCard {
  animal1: string;
  animal2: string;
  reason: string;
  href: string;
  clicks?: number;
  source?: 'seed' | 'clicks';
}

interface Props {
  initialCards: PopularCard[];
}

function trackMatchupClick(animal1: string, animal2: string) {
  fetch('/api/matchups/popular', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ animal1, animal2 }),
    keepalive: true,
  }).catch(() => {
    // fire-and-forget
  });
}

export default function PopularBattles({ initialCards }: Props) {
  const [cards, setCards] = useState<PopularCard[]>(initialCards);
  const [source, setSource] = useState<'seed' | 'clicks'>('seed');

  useEffect(() => {
    let active = true;

    fetch('/api/matchups/popular')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data?.popular) && data.popular.length > 0) {
          setCards(data.popular);
          setSource(data.source === 'clicks' ? 'clicks' : 'seed');
        }
      })
      .catch(() => {
        // keep initial cards
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="py-12 px-4 border-b border-[var(--border-accent)] bg-[var(--bg-secondary)]" id="most-popular">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Most Popular Battles
          </h2>
          <p className="text-[var(--text-secondary)] mt-2">
            {source === 'clicks'
              ? 'Live ranking based on real battle-link clicks.'
              : 'Collecting click data now — this will auto-switch to live ranking as traffic comes in.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map((card) => (
            <Link
              key={`${card.animal1}-${card.animal2}`}
              href={card.href}
              onClick={() => trackMatchupClick(card.animal1, card.animal2)}
              className="p-4 rounded-lg border border-[var(--border-accent)] bg-[var(--bg-card)] hover:border-[var(--accent-gold)] hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all"
            >
              <p className="font-bold text-[var(--text-primary)]">
                {card.animal1} <span className="text-[var(--accent-red)]">vs</span> {card.animal2}
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-1">{card.reason}</p>
              {source === 'clicks' && typeof card.clicks === 'number' && (
                <p className="text-xs text-[var(--accent-gold)] mt-2 font-semibold">{card.clicks} clicks</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
