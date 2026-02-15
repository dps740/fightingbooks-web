'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface MatchupData {
  animal1: string;
  animal2: string;
  blogSlug: string | null;
  href: string;
}

interface GroupData {
  key: string;
  label: string;
  matchups: MatchupData[];
}

interface Props {
  groups: GroupData[];
  totalCount: number;
}

export default function MatchupsClient({ groups, totalCount }: Props) {
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['real']));
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups
      .map(g => ({
        ...g,
        matchups: g.matchups.filter(
          m => m.animal1.toLowerCase().includes(q) || m.animal2.toLowerCase().includes(q)
        ),
      }))
      .filter(g => g.matchups.length > 0);
  }, [groups, search]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredCount = filteredGroups.reduce((sum, g) => sum + g.matchups.length, 0);
  const INITIAL_SHOW = 50;

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Search */}
        <div className="mb-8 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search animals... (e.g. Lion, T-Rex, Dragon)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[var(--bg-card)] border-2 border-[var(--border-accent)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-gold)] focus:outline-none transition-colors"
          />
          {search && (
            <p className="text-sm text-[var(--text-muted)] mt-2 text-center">
              {filteredCount} matchups found
            </p>
          )}
        </div>

        {/* Category quick filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {groups.map(g => (
            <button
              key={g.key}
              onClick={() => toggleGroup(g.key)}
              className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide border-2 transition-all ${
                expandedGroups.has(g.key)
                  ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[var(--bg-primary)]'
                  : 'border-[var(--border-accent)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]'
              }`}
            >
              {g.label.split(' ').slice(0, 1).join('')} {g.matchups.length}
            </button>
          ))}
        </div>

        {/* Groups */}
        {filteredGroups.map(group => {
          const isExpanded = expandedGroups.has(group.key) || !!search;
          const visibleMatchups = showAll[group.key] || search
            ? group.matchups
            : group.matchups.slice(0, INITIAL_SHOW);

          return (
            <div key={group.key} className="mb-8">
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between py-4 px-6 bg-[var(--bg-secondary)] border-2 border-[var(--border-accent)] rounded-lg hover:border-[var(--accent-gold)] transition-colors group"
              >
                <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                  {group.label}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--text-muted)]">{group.matchups.length} matchups</span>
                  <span className="text-[var(--accent-gold)] text-xl">{isExpanded ? '▾' : '▸'}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {visibleMatchups.map(m => (
                    <Link
                      key={`${m.animal1}-${m.animal2}`}
                      href={m.href}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all hover:scale-[1.02] ${
                        m.blogSlug
                          ? 'bg-[var(--bg-card)] border-[var(--accent-gold)]/30 hover:border-[var(--accent-gold)] hover:shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                          : 'bg-[var(--bg-card)] border-[var(--border-accent)] hover:border-[var(--accent-red)] hover:shadow-[0_0_15px_rgba(196,30,58,0.15)]'
                      }`}
                    >
                      <span className="font-bold text-[var(--text-primary)] text-sm flex-1 text-right truncate">{m.animal1}</span>
                      <span className={`text-xs font-black px-2 py-0.5 rounded ${
                        m.blogSlug
                          ? 'bg-[var(--accent-gold)]/20 text-[var(--accent-gold)]'
                          : 'bg-[var(--accent-red)]/20 text-[var(--accent-red)]'
                      }`}>
                        VS
                      </span>
                      <span className="font-bold text-[var(--text-primary)] text-sm flex-1 truncate">{m.animal2}</span>
                      {m.blogSlug && (
                        <span className="text-xs text-[var(--accent-gold)]" title="Full article available">📖</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {isExpanded && !search && !showAll[group.key] && group.matchups.length > INITIAL_SHOW && (
                <button
                  onClick={() => setShowAll(prev => ({ ...prev, [group.key]: true }))}
                  className="mt-4 w-full py-3 text-center text-sm font-bold text-[var(--accent-gold)] border border-[var(--accent-gold)]/30 rounded-lg hover:bg-[var(--accent-gold)]/10 transition-colors"
                >
                  Show all {group.matchups.length} matchups ↓
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
