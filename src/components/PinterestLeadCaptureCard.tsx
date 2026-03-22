'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

interface PinterestLeadCaptureCardProps {
  nextHref: string;
  matchupLabel: string;
}

export default function PinterestLeadCaptureCard({ nextHref, matchupLabel }: PinterestLeadCaptureCardProps) {
  const searchParams = useSearchParams();
  const utmSource = searchParams.get('utm_source') || '';
  const utmCampaign = searchParams.get('utm_campaign') || '';
  const utmMedium = searchParams.get('utm_medium') || '';
  const isPinterestTraffic = utmSource.toLowerCase() === 'pinterest';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const captureSource = useMemo(() => {
    const pieces = ['battle_page_gate'];
    if (utmSource) pieces.push(`src:${utmSource}`);
    if (utmMedium) pieces.push(`med:${utmMedium}`);
    if (utmCampaign) pieces.push(`camp:${utmCampaign}`);
    return pieces.join('|');
  }, [utmCampaign, utmMedium, utmSource]);

  if (!isPinterestTraffic && !utmCampaign) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/capture-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: captureSource }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      localStorage.setItem('fb_email', email);
      trackEvent('email_captured', {
        source: captureSource,
        matchup: matchupLabel,
      });
      setSubmitted(true);
    } catch {
      setError('Could not save your email. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="mt-10 rounded-2xl border p-6 md:p-8"
      style={{
        background: 'linear-gradient(135deg, rgba(196,30,58,0.12) 0%, rgba(20,20,20,0.98) 52%, rgba(212,175,55,0.12) 100%)',
        borderColor: 'rgba(212,175,55,0.38)',
        boxShadow: '0 0 30px rgba(212,175,55,0.08)',
      }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">
          Pinterest Reader Bonus
        </p>
        <h3 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Want your own custom battle next?
        </h3>
        <p className="text-[var(--text-secondary)] text-lg mb-6">
          Save your email, unlock your first custom book, and jump straight into the full {matchupLabel} battle flow.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              className="w-full rounded-xl border-2 px-4 py-4 text-lg text-white placeholder:text-white/35 focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(255,255,255,0.16)',
              }}
            />

            {error && <p className="text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary inline-block rounded-xl px-8 py-4 text-xl font-bold transition-transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {loading ? 'Saving…' : '⚔️ Save & Unlock My First Book'}
            </button>

            <p className="text-xs text-[var(--text-muted)]">
              We’ll save your email for updates and future book ideas. No fake worksheet promise. Just the real battle flow.
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold uppercase tracking-[0.12em] text-[var(--accent-gold)]"
              style={{ borderColor: 'rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.08)' }}>
              <span>✓</span>
              Saved
            </div>
            <p className="text-[var(--text-secondary)] text-lg">
              Nice. Your email is saved — now open the full {matchupLabel} battle book.
            </p>
            <a
              href={nextHref}
              onClick={() => trackEvent('email_cta_click', { matchup: matchupLabel, source: captureSource })}
              className="btn-primary inline-block rounded-xl px-8 py-4 text-xl font-bold transition-transform hover:scale-105"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              🥊 Open My Battle Book →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
