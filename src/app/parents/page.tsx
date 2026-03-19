'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

// ─── Section Divider ───
function Divider() {
  return (
    <div className="relative py-6 overflow-hidden">
      <div className="absolute left-0 right-0 top-1/2" style={{
        height: '2px',
        background: 'linear-gradient(90deg, transparent 2%, rgba(255,215,0,0.5) 20%, rgba(255,215,0,0.8) 50%, rgba(255,215,0,0.5) 80%, transparent 98%)',
      }} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45" style={{
        background: '#FFD700',
        boxShadow: '0 0 10px rgba(255,215,0,0.5)',
      }} />
    </div>
  );
}

// ─── Spotlight glow component ───
function Spotlight({ color = 'rgba(255,215,0,0.06)', top = '30%' }: { color?: string; top?: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div style={{
        position: 'absolute',
        top,
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        height: '600px',
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${color} 0%, transparent 70%)`,
      }} />
    </div>
  );
}

// ─── Book page type cards for "What's Inside" ───
const BOOK_PAGES = [
  {
    title: 'Tale of the Tape',
    desc: 'Side-by-side stat comparison — weight, speed, bite force, and more',
    icon: '📊',
    accent: '#d4af37',
  },
  {
    title: 'Trait Deep Dives',
    desc: 'Each animal\'s unique abilities explained with vivid similes kids love',
    icon: '🔬',
    accent: '#c41e3a',
  },
  {
    title: 'Environment Context',
    desc: 'How the matchup terrain gives advantages and disadvantages',
    icon: '🌍',
    accent: '#1e90ff',
  },
  {
    title: 'Think About It',
    desc: 'Critical thinking prompts that ask your child to reason through matchups',
    icon: '💡',
    accent: '#d4af37',
  },
  {
    title: 'Scoring Breakdown',
    desc: 'Structured rubric across 5 categories — no random winners here',
    icon: '🏆',
    accent: '#c41e3a',
  },
];

const SAMPLE_BOOKS = [
  { a: 'Lion', b: 'Tiger', label: 'Fan Favorite', color: '#8B0000', href: '/read?a=Lion&b=Tiger&env=neutral&mode=standard' },
  { a: 'Gorilla', b: 'Grizzly Bear', label: 'Heavyweight Clash', color: '#1a4d1a', href: '/read?a=Gorilla&b=Grizzly%20Bear&env=neutral&mode=standard' },
  { a: 'Polar Bear', b: 'Crocodile', label: 'Apex Predators', color: '#2d2d3d', href: '/read?a=Polar%20Bear&b=Crocodile&env=neutral&mode=standard' },
  { a: 'Orca', b: 'Great White Shark', label: 'Ocean Showdown', color: '#0a3d6b', href: '/read?a=Orca&b=Great%20White%20Shark&env=neutral&mode=standard' },
];

const TESTIMONIALS = [
  {
    quote: '"My son read his book three times before bed. He\'s never done that with anything."',
    author: 'Sarah M.',
    detail: 'Mom of a 7-year-old',
  },
  {
    quote: '"Finally, screen time I don\'t feel guilty about. He\'s actually learning."',
    author: 'Marcus T.',
    detail: 'Dad of two boys, ages 6 & 9',
  },
  {
    quote: '"She started asking me real questions about animals after reading. That\'s a win."',
    author: 'Priya K.',
    detail: 'Mom of a 5-year-old',
  },
];

export default function ParentsPage() {
  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-primary)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'For Parents | FightingBooks',
            url: 'https://whowouldwinbooks.com/parents',
            description: 'A parent-facing overview of how FightingBooks helps with reading, science, and critical thinking.',
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
                name: 'For Parents',
                item: 'https://whowouldwinbooks.com/parents',
              },
            ],
          }),
        }}
      />

      {/* ════════════════════════════════════════════
          SECTION 1: HERO
          ════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center' }}>
        <Spotlight color="rgba(196,30,58,0.08)" top="20%" />
        <Spotlight color="rgba(255,215,0,0.05)" top="70%" />

        {/* Speed lines */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="speed-line" style={{
              top: `${15 + i * 14}%`,
              left: 0, right: 0,
              animation: `speed-line-${i % 2 === 0 ? 'left' : 'right'} ${3 + i * 0.7}s linear infinite`,
              animationDelay: `${i * 0.4}s`,
            }} />
          ))}
        </div>

        <div className="relative z-10 w-full px-5 py-16 max-w-2xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-block mb-6"
          >
            <span style={{
              background: 'rgba(212,175,55,0.12)',
              border: '1px solid rgba(212,175,55,0.3)',
              color: '#d4af37',
              padding: '6px 16px',
              borderRadius: '100px',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Educational · Ages 5–10
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            style={{
              fontFamily: "'Anton', 'Impact', sans-serif",
              fontSize: 'clamp(2.2rem, 8vw, 3.8rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
              color: '#fff',
              marginBottom: '1rem',
            }}
          >
            Turn Animal Debates Into{' '}
            <span style={{ color: '#d4af37' }}>Reading</span> and{' '}
            <span style={{ color: '#c41e3a' }}>Critical Thinking</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'clamp(0.95rem, 3vw, 1.15rem)',
              lineHeight: 1.6,
              maxWidth: '520px',
              margin: '0 auto 2rem',
            }}
          >
            Create custom wildlife learning books in seconds. Inspired by &ldquo;Who Would Win&rdquo; style stories — but interactive and endless.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10"
          >
            <Link href="/" className="btn-primary" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 32px', borderRadius: '8px', fontSize: '1rem',
              textDecoration: 'none', color: '#fff',
            }}>
              Create a Free Book <span style={{ fontSize: '1.2em' }}>→</span>
            </Link>
            <a href="#examples" className="btn-secondary" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 28px', borderRadius: '8px', fontSize: '0.95rem',
              textDecoration: 'none',
            }}>
              Try 4 Free Examples
            </a>
          </motion.div>

          {/* Demo video placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            style={{
              position: 'relative',
              aspectRatio: '16/9',
              maxWidth: '540px',
              margin: '0 auto',
              borderRadius: '12px',
              border: '2px solid var(--border-accent)',
              background: 'linear-gradient(135deg, #141414 0%, #1a1a1a 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Play button */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(180deg, var(--accent-red) 0%, var(--accent-red-dark) 100%)',
              border: '3px solid var(--accent-gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(196,30,58,0.3)',
              marginBottom: '12px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <polygon points="8,5 20,12 8,19" />
              </svg>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Demo video coming soon
            </span>
          </motion.div>
        </div>
      </section>

      <Divider />

      {/* ════════════════════════════════════════════
          SECTION 2: BENEFIT PILLARS
          ════════════════════════════════════════════ */}
      <section className="relative py-20 px-5">
        <Spotlight color="rgba(255,215,0,0.04)" top="50%" />
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} custom={0} style={{
            fontFamily: "'Anton', 'Impact', sans-serif",
            fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            marginBottom: '3rem',
            color: '#fff',
          }}>
            More Than Just <span style={{ color: '#d4af37' }}>Animals Fighting</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: '📖',
                title: 'Builds Vocabulary',
                desc: 'Fun similes and vivid descriptions that make new words stick — "jaws like a steel trap" beats a flashcard every time.',
              },
              {
                icon: '🦎',
                title: 'Real Wildlife Facts',
                desc: 'Every trait is grounded in real biology. Kids learn about habitats, adaptations, and what makes each animal unique.',
              },
              {
                icon: '🧠',
                title: 'Structured Reasoning',
                desc: 'A 5-category scoring rubric teaches kids to weigh evidence, not just guess. Critical thinking disguised as fun.',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                variants={fadeUp}
                custom={i + 1}
                style={{
                  background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: '12px',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top accent line */}
                <div style={{
                  position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
                  background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
                }} />
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{card.icon}</div>
                <h3 style={{
                  fontFamily: "'Anton', 'Impact', sans-serif",
                  fontSize: '1.2rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.75rem',
                  color: '#fff',
                }}>
                  {card.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <Divider />

      {/* ════════════════════════════════════════════
          SECTION 3: WHAT'S INSIDE EVERY BOOK
          ════════════════════════════════════════════ */}
      <section className="relative py-20 px-5">
        <Spotlight color="rgba(196,30,58,0.05)" top="40%" />
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} custom={0} style={{
            fontFamily: "'Anton', 'Impact', sans-serif",
            fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            marginBottom: '0.75rem',
            color: '#fff',
          }}>
            What&apos;s Inside <span style={{ color: '#c41e3a' }}>Every Book</span>
          </motion.h2>
          <motion.p variants={fadeUp} custom={0.5} style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            marginBottom: '2.5rem',
            maxWidth: '480px',
            margin: '0 auto 2.5rem',
          }}>
            Each book follows a structured format designed to teach while entertaining.
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BOOK_PAGES.map((page, i) => (
              <motion.div
                key={page.title}
                variants={fadeUp}
                custom={i + 1}
                style={{
                  background: '#141414',
                  border: '1px solid var(--border-accent)',
                  borderLeft: `3px solid ${page.accent}`,
                  borderRadius: '8px',
                  padding: '1.5rem',
                  position: 'relative',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem',
                }}>
                  <span style={{ fontSize: '1.4rem' }}>{page.icon}</span>
                  <h3 style={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#fff',
                    letterSpacing: '0.01em',
                  }}>
                    {page.title}
                  </h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.55 }}>
                  {page.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <Divider />

      {/* ════════════════════════════════════════════
          SECTION 4: SOCIAL PROOF
          ════════════════════════════════════════════ */}
      <section className="relative py-20 px-5">
        <Spotlight color="rgba(255,215,0,0.04)" top="50%" />
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} custom={0} style={{
            display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '2.5rem',
          }}>
            {['Perfect for curious kids ages 5–10', 'Screen-time that feels productive'].map((tag) => (
              <span key={tag} style={{
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.2)',
                color: '#d4af37',
                padding: '8px 18px',
                borderRadius: '100px',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}>
                {tag}
              </span>
            ))}
          </motion.div>

          <motion.h2 variants={fadeUp} custom={1} style={{
            fontFamily: "'Anton', 'Impact', sans-serif",
            fontSize: 'clamp(1.4rem, 5vw, 2rem)',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            marginBottom: '2rem',
            color: '#fff',
          }}>
            Parents Are Saying...
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.author}
                variants={fadeUp}
                custom={i + 2}
                style={{
                  background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: '10px',
                  padding: '1.5rem',
                  textAlign: 'left',
                  position: 'relative',
                }}
              >
                {/* Quote mark */}
                <div style={{
                  position: 'absolute', top: '12px', right: '16px',
                  fontSize: '2.5rem', color: 'rgba(212,175,55,0.15)',
                  fontFamily: 'Georgia, serif', lineHeight: 1,
                }}>
                  &ldquo;
                </div>
                <p style={{
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  marginBottom: '1rem',
                }}>
                  {t.quote}
                </p>
                <div>
                  <div style={{ color: '#d4af37', fontWeight: 700, fontSize: '0.85rem' }}>{t.author}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.detail}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p variants={fadeUp} custom={5} style={{
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            marginTop: '1.5rem',
            fontStyle: 'italic',
          }}>
            * Testimonials are representative of early user feedback
          </motion.p>
        </motion.div>
      </section>

      <Divider />

      {/* ════════════════════════════════════════════
          SECTION 5: FREE EXAMPLES + PRICING
          ════════════════════════════════════════════ */}
      <section id="examples" className="relative py-20 px-5">
        <Spotlight color="rgba(196,30,58,0.05)" top="30%" />
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} custom={0} style={{
            fontFamily: "'Anton', 'Impact', sans-serif",
            fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            marginBottom: '2.5rem',
            color: '#fff',
          }}>
            Try These <span style={{ color: '#d4af37' }}>Free</span> Examples
          </motion.h2>

          {/* Sample book cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {SAMPLE_BOOKS.map((book, i) => (
              <motion.div key={book.label} variants={fadeUp} custom={i + 1}>
                <Link
                  href={book.href}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: `linear-gradient(180deg, ${book.color} 0%, #0a0a0a 100%)`,
                    border: '1px solid var(--border-accent)',
                    borderRadius: '10px',
                    padding: '1.25rem 1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                    className="hover:scale-105"
                  >
                    <div style={{ fontSize: '0.65rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                      {book.label}
                    </div>
                    <div style={{ fontFamily: "'Anton', 'Impact', sans-serif", fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', textTransform: 'uppercase', color: '#fff', lineHeight: 1.2 }}>
                      {book.a}
                    </div>
                    <div style={{ fontFamily: "'Anton', 'Impact', sans-serif", fontSize: '0.9rem', color: '#d4af37', margin: '4px 0' }}>
                      VS
                    </div>
                    <div style={{ fontFamily: "'Anton', 'Impact', sans-serif", fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', textTransform: 'uppercase', color: '#fff', lineHeight: 1.2 }}>
                      {book.b}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Upgrade path */}
          <motion.div variants={fadeUp} custom={5}>
            <h3 style={{
              fontFamily: "'Anton', 'Impact', sans-serif",
              fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
              textAlign: 'center',
              textTransform: 'uppercase',
              color: '#fff',
              marginBottom: '0.5rem',
            }}>
              Or Create <span style={{ color: '#d4af37' }}>Unlimited</span> Custom Matchups
            </h3>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Choose the plan that fits your family
            </p>
          </motion.div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Base tier */}
            <motion.div variants={fadeUp} custom={6} style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
              border: '1px solid var(--border-accent)',
              borderRadius: '12px',
              padding: '2rem 1.5rem',
              position: 'relative',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                Base
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '1.25rem' }}>
                <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '2.5rem', color: '#fff' }}>$4.99</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>one-time</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
                {['30 real animals', 'Unlimited books', 'PDF downloads', 'All book formats'].map((f) => (
                  <li key={f} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#d4af37', fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/" className="btn-secondary" style={{
                display: 'block', textAlign: 'center', padding: '12px', borderRadius: '8px',
                textDecoration: 'none', fontSize: '0.9rem',
              }}>
                Get Started
              </Link>
            </motion.div>

            {/* Plus tier */}
            <motion.div variants={fadeUp} custom={7} style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
              border: '2px solid #d4af37',
              borderRadius: '12px',
              padding: '2rem 1.5rem',
              position: 'relative',
              boxShadow: '0 0 30px rgba(212,175,55,0.1)',
            }}>
              {/* Popular badge */}
              <div style={{
                position: 'absolute', top: '-12px', right: '16px',
                background: 'linear-gradient(180deg, #d4af37, #b8960f)',
                color: '#000', fontWeight: 800, fontSize: '0.65rem',
                padding: '4px 12px', borderRadius: '100px',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Most Popular
              </div>
              <div style={{ fontSize: '0.7rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                Plus
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '1.25rem' }}>
                <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '2.5rem', color: '#fff' }}>$4.99</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>/month</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
                {[
                  'Everything in Base',
                  'Dinosaurs & fantasy creatures',
                  'Choose Your Own Adventure mode',
                  'Tournament brackets',
                  'Create-your-own animals',
                ].map((f) => (
                  <li key={f} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#d4af37', fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/" className="btn-primary" style={{
                display: 'block', textAlign: 'center', padding: '12px', borderRadius: '8px',
                textDecoration: 'none', fontSize: '0.9rem', color: '#fff',
              }}>
                Get Plus
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <Divider />

      {/* ════════════════════════════════════════════
          SECTION 6: PUBLIC SITE PATHS
          ════════════════════════════════════════════ */}
      <section className="relative py-16 px-5">
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} custom={0} style={{
            fontFamily: "'Anton', 'Impact', sans-serif",
            fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            marginBottom: '0.75rem',
            color: '#fff',
          }}>
            Best Pages to Explore Next
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            maxWidth: '760px',
            margin: '0 auto 2rem auto',
            fontSize: '0.98rem',
            lineHeight: 1.7,
          }}>
            If you want the strongest reading and learning paths on the site, start with these battle pages, guides, and educational resources.
          </motion.p>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: 'Popular Battle Pages',
                links: [
                  { label: 'Lion vs Tiger', href: '/battles/lion-vs-tiger' },
                  { label: 'Gorilla vs Grizzly Bear', href: '/battles/gorilla-vs-grizzly-bear' },
                  { label: 'Orca vs Great White Shark', href: '/battles/orca-vs-great-white-shark' },
                  { label: 'Browse all battles', href: '/battles' },
                ],
              },
              {
                title: 'Guide Articles',
                links: [
                  { label: 'Lion vs Tiger Guide', href: '/blog/lion-vs-tiger' },
                  { label: 'Elephant vs Rhino Guide', href: '/blog/elephant-vs-rhino' },
                  { label: 'Hippo vs Rhino Guide', href: '/blog/hippo-vs-rhino' },
                  { label: 'Orca vs Great White Shark Guide', href: '/blog/orca-vs-great-white-shark' },
                ],
              },
              {
                title: 'Learning Resources',
                links: [
                  { label: 'Wildlife Learning Center', href: '/learn' },
                  { label: 'For Teachers', href: '/teachers' },
                  { label: 'Classroom Resources Guide', href: '/blog/classroom-resources' },
                  { label: 'Animal Comparison Activities', href: '/learn/animal-comparison-activities-for-kids' },
                  { label: 'Printable Animal Battle Books', href: '/learn/printable-animal-battle-books' },
                ],
              },
            ].map((group, i) => (
              <motion.div
                key={group.title}
                variants={fadeUp}
                custom={i + 2}
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                }}
              >
                <h3 style={{
                  fontFamily: "'Anton', 'Impact', sans-serif",
                  fontSize: '1.1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  color: '#d4af37',
                  marginBottom: '0.85rem',
                }}>
                  {group.title}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      style={{
                        color: '#fff',
                        textDecoration: 'none',
                        fontSize: '0.95rem',
                        lineHeight: 1.5,
                      }}
                      className="hover:underline"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <Divider />

      {/* ════════════════════════════════════════════
          SECTION 7: FINAL CTA
          ════════════════════════════════════════════ */}
      <section className="relative py-24 px-5">
        <Spotlight color="rgba(196,30,58,0.08)" top="50%" />
        <Spotlight color="rgba(255,215,0,0.06)" top="50%" />
        <motion.div
          className="max-w-xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} custom={0} style={{
            fontFamily: "'Anton', 'Impact', sans-serif",
            fontSize: 'clamp(1.8rem, 7vw, 3rem)',
            textTransform: 'uppercase',
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            color: '#fff',
          }}>
            Create Your Child&apos;s{' '}
            <span style={{ color: '#d4af37' }}>First Book</span>{' '}
            Today
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            marginBottom: '2rem',
          }}>
            It takes 30 seconds. Pick two animals and watch the magic happen.
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <Link href="/" className="btn-primary" style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '18px 48px', borderRadius: '10px', fontSize: '1.1rem',
              textDecoration: 'none', color: '#fff',
              boxShadow: '0 0 40px rgba(196,30,58,0.3)',
            }}>
              Create a Free Book <span style={{ fontSize: '1.3em' }}>→</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer spacer */}
      <div style={{ height: '4rem' }} />
    </div>
  );
}
