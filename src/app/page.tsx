'use client';

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Bangers, Barlow, Barlow_Condensed } from 'next/font/google';
import { WHO_WOULD_WIN_BOOKS } from '@/data/who-would-win-books';
import { useTier, isAnimalLocked, isCyoaLocked, isTournamentLocked } from '@/lib/useTier';
import UpgradeModal from '@/components/UpgradeModal';
import TierInfoPopover from '@/components/TierInfoPopover';
import AccountMenu from '@/components/AccountMenu';
import SampleBookGallery from '@/components/SampleBookGallery';
import EmailCaptureModal from '@/components/EmailCaptureModal';
import { UserTier, REAL_ANIMALS, DINOSAUR_ANIMALS, FANTASY_ANIMALS } from '@/lib/tierAccess';

const bangers = Bangers({ subsets: ['latin'], weight: '400', variable: '--font-bangers' });
const barlow = Barlow({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-barlow' });
const barlowCondensed = Barlow_Condensed({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-barlow-condensed' });

const STATIC_FIGHTERS = [
  ...REAL_ANIMALS.map(name => ({ name, category: 'real' as const, isCustom: false, imageUrl: undefined as string | undefined })),
  ...DINOSAUR_ANIMALS.map(name => ({ name, category: 'dinosaur' as const, isCustom: false, imageUrl: undefined as string | undefined })),
  ...FANTASY_ANIMALS.map(name => ({ name, category: 'fantasy' as const, isCustom: false, imageUrl: undefined as string | undefined })),
];

const FIGHTERS = STATIC_FIGHTERS;

type AnimalCategory = 'real' | 'dinosaur' | 'fantasy';

interface FighterEntry {
  name: string;
  category: 'real' | 'dinosaur' | 'fantasy';
  isCustom: boolean;
  imageUrl?: string;
  isUserCustom?: boolean;
  status?: string;
}

const BASE_CATEGORY_TABS: { key: AnimalCategory; label: string; baseCount: number; locked: boolean }[] = [
  { key: 'real', label: 'Animals', baseCount: 30, locked: false },
  { key: 'dinosaur', label: 'Dinosaurs', baseCount: 8, locked: true },
  { key: 'fantasy', label: 'Fantasy', baseCount: 9, locked: true },
];

const CATEGORY_ORDER: AnimalCategory[] = ['real', 'dinosaur', 'fantasy'];
const FEATURED_ANIMALS = ['Lion', 'Tiger', 'Gorilla'];

const HERO_BOOKS = [
  { title: 'Lion vs Tiger', image: '/fighters/battle-lion-vs-tiger-cover.jpg', href: '/read?a=Lion&b=Tiger&env=neutral&mode=standard' },
  { title: 'Gorilla vs Grizzly Bear', image: '/fighters/battle-gorilla-vs-grizzly-bear-cover.jpg', href: '/read?a=Gorilla&b=Grizzly%20Bear&env=neutral&mode=standard' },
  { title: 'Great White Shark vs Orca', image: '/fighters/battle-great-white-shark-vs-orca-cover.jpg', href: '/read?a=Great%20White%20Shark&b=Orca&env=neutral&mode=standard' },
  { title: 'Polar Bear vs Crocodile', image: '/fighters/battle-polar-bear-vs-crocodile-cover.jpg', href: '/read?a=Polar%20Bear&b=Crocodile&env=neutral&mode=standard' },
];

const HOW_STEPS = [
  {
    title: 'Choose Your Fighters',
    body: 'Pick any two animals from the roster, or build an eight-fighter bracket in tournament mode.',
  },
  {
    title: 'Pick a Reading Mode',
    body: 'Classic gives you the full illustrated showdown. Adventure mode adds branching choices for eligible tiers.',
  },
  {
    title: 'We Build the Book',
    body: 'The app assembles a battle book with images, facts, matchup analysis, and a final verdict.',
  },
  {
    title: 'Read, Compare, Repeat',
    body: 'Save favorites, explore more matchups, and keep discovering new animals and battle outcomes.',
  },
];

const AMAZON_BOOK_ASINS = ['0545175747', '0545301718', '0545160758', '0545451914', '0545681189', '0545451906', '1338320262'];

const LOCK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 1 1 8 0v3" />
  </svg>
);

const CHECK_ICON = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.3" className="h-3.5 w-3.5">
    <path d="M4 10.5 8 14l8-8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const sectionTitleStyle = (fontClass: string): CSSProperties => ({
  fontFamily: fontClass,
  letterSpacing: '0.04em',
  lineHeight: 0.95,
});

function slugifyAnimal(name: string) {
  return name.toLowerCase().replace(/ /g, '-');
}

function getPhysicalBooks() {
  return AMAZON_BOOK_ASINS.map(asin => {
    const match = WHO_WOULD_WIN_BOOKS.find(book => book.asin === asin);
    return {
      asin,
      href: match?.amazonUrl || `https://www.amazon.com/dp/${asin}?tag=whowouldwinbo-20`,
      title: match?.title || 'Who Would Win?',
      cover: `/covers/${asin}.jpg`,
    };
  });
}

export default function Home() {
  const router = useRouter();
  const tierData = useTier();

  const [animalA, setAnimalA] = useState('');
  const [animalB, setAnimalB] = useState('');
  const [selectingFor, setSelectingFor] = useState<'A' | 'B'>('A');
  const [hoveredBook, setHoveredBook] = useState<number | null>(null);
  const [expandedBook, setExpandedBook] = useState<{ index: number; rect: DOMRect } | null>(null);
  const [gameMode, setGameMode] = useState<'classic' | 'adventure'>('classic');
  const [showPricing, setShowPricing] = useState(false);
  const [battleType, setBattleType] = useState<'single' | 'tournament'>('single');
  const [loading, setLoading] = useState(false);
  const [showFightOverlay, setShowFightOverlay] = useState(false);
  const [animalCategory, setAnimalCategory] = useState<AnimalCategory>('real');

  const [tournamentFighters, setTournamentFighters] = useState<string[]>([]);
  const [showTournamentOverlay, setShowTournamentOverlay] = useState(false);

  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [pendingGenerate, setPendingGenerate] = useState(false);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lockedAnimalClicked, setLockedAnimalClicked] = useState<string | undefined>();
  const [lockedFeature, setLockedFeature] = useState<string | undefined>();

  const [dbAnimals, setDbAnimals] = useState<FighterEntry[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [hasGenerating, setHasGenerating] = useState(false);

  const fetchDbAnimals = useCallback(async () => {
    try {
      const response = await fetch('/api/animals/list');
      const data = await response.json();

      const entries: FighterEntry[] = [];
      let generating = false;

      if (data.global) {
        for (const animal of data.global) {
          const existsInStatic = STATIC_FIGHTERS.some(f => f.name.toLowerCase() === animal.name.toLowerCase());
          if (!existsInStatic) {
            entries.push({
              name: animal.name,
              category: animal.category as 'real' | 'dinosaur' | 'fantasy',
              isCustom: true,
              imageUrl: animal.images?.portrait,
              status: animal.status,
            });
          }
        }
      }

      if (data.custom) {
        for (const animal of data.custom) {
          entries.push({
            name: animal.name,
            category: 'fantasy',
            isCustom: true,
            isUserCustom: true,
            imageUrl: animal.images?.portrait,
            status: animal.status,
          });
          if (animal.status === 'generating') generating = true;
        }
      }

      setDbAnimals(entries);
      setHasGenerating(generating);
    } catch (e) {
      console.error('Failed to fetch DB animals:', e);
    }
  }, []);

  useEffect(() => {
    fetchDbAnimals();
  }, [fetchDbAnimals]);

  useEffect(() => {
    if (!hasGenerating) return;
    const interval = setInterval(() => {
      fetchDbAnimals();
    }, 5000);
    return () => clearInterval(interval);
  }, [hasGenerating, fetchDbAnimals]);

  const handleUpgrade = async (tier: UserTier) => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout failed');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
    }
  };

  const handleCreateAnimal = async () => {
    if (!createName.trim() || createLoading) return;

    setCreateLoading(true);
    setCreateError('');

    try {
      const response = await fetch('/api/animals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error || 'Failed to create creature');
        setCreateLoading(false);
        return;
      }

      setShowCreateModal(false);
      setCreateName('');
      setCreateLoading(false);
      await fetchDbAnimals();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Network error');
      setCreateLoading(false);
    }
  };

  const handleTournamentToggle = () => {
    if (battleType === 'tournament') {
      setBattleType('single');
      setTournamentFighters([]);
      return;
    }
    if (isTournamentLocked(tierData.tier)) {
      setLockedAnimalClicked(undefined);
      setLockedFeature('tournament');
      setShowUpgradeModal(true);
      return;
    }
    setBattleType('tournament');
    setTournamentFighters([]);
    setAnimalA('');
    setAnimalB('');
    setShowFightOverlay(false);
  };

  const handleGameModeSelect = (mode: 'classic' | 'adventure') => {
    if (mode === 'adventure' && isCyoaLocked(tierData.tier)) {
      setLockedAnimalClicked(undefined);
      setLockedFeature('cyoa');
      setShowUpgradeModal(true);
      return;
    }
    setGameMode(mode);
  };

  const handleTournamentFighterSelect = (fighterName: string) => {
    const isUserCustom = dbAnimals.some(a => a.name === fighterName && a.isUserCustom);
    if (!isUserCustom && isAnimalLocked(tierData.tier, fighterName)) {
      setLockedAnimalClicked(fighterName);
      setLockedFeature(undefined);
      setShowUpgradeModal(true);
      return;
    }

    if (tournamentFighters.includes(fighterName)) {
      setTournamentFighters(tournamentFighters.filter(f => f !== fighterName));
      setShowTournamentOverlay(false);
    } else if (tournamentFighters.length < 8) {
      const next = [...tournamentFighters, fighterName];
      setTournamentFighters(next);
      if (next.length === 8) setShowTournamentOverlay(true);
    }
  };

  const proceedWithTournament = () => {
    setLoading(true);
    const bracket = {
      fighters: tournamentFighters,
      round1: [
        [tournamentFighters[0], tournamentFighters[1]],
        [tournamentFighters[2], tournamentFighters[3]],
        [tournamentFighters[4], tournamentFighters[5]],
        [tournamentFighters[6], tournamentFighters[7]],
      ],
      semis: [[null, null], [null, null]],
      final: [null, null],
      winner: null,
      currentMatch: 0,
      mode: gameMode === 'adventure' ? 'cyoa' : 'standard',
    };

    localStorage.setItem('tournament', JSON.stringify(bracket));
    router.push('/tournament/bracket');
  };

  const handleStartTournament = () => {
    if (tournamentFighters.length !== 8) return;

    const hasEmail = typeof window !== 'undefined' && localStorage.getItem('fb_email');
    if (!tierData.isAuthenticated && !hasEmail) {
      setPendingGenerate(true);
      setShowEmailCapture(true);
      return;
    }

    proceedWithTournament();
  };

  const getImagePath = (name: string) => {
    const dbAnimal = dbAnimals.find(a => a.name === name);
    if (dbAnimal?.imageUrl) return dbAnimal.imageUrl;
    return `/fighters/${slugifyAnimal(name)}.jpg`;
  };

  const handleFighterSelect = (fighterName: string) => {
    const isUserCustom = dbAnimals.some(a => a.name === fighterName && a.isUserCustom);
    if (!isUserCustom && isAnimalLocked(tierData.tier, fighterName)) {
      setLockedAnimalClicked(fighterName);
      setLockedFeature(undefined);
      setShowUpgradeModal(true);
      return;
    }

    if (fighterName === animalA) {
      setAnimalA('');
      setSelectingFor('A');
      return;
    }
    if (fighterName === animalB) {
      setAnimalB('');
      setSelectingFor('B');
      return;
    }

    if (selectingFor === 'A') {
      setAnimalA(fighterName);
      if (!animalB) {
        setSelectingFor('B');
      } else if (fighterName !== animalB) {
        setShowFightOverlay(true);
      }
    } else {
      setAnimalB(fighterName);
      if (!animalA) {
        setSelectingFor('A');
      } else if (fighterName !== animalA) {
        setShowFightOverlay(true);
      }
    }
  };

  const proceedWithGenerate = () => {
    setLoading(true);
    if (battleType === 'tournament') {
      const mode = gameMode === 'adventure' ? 'cyoa' : 'standard';
      router.push(`/tournament?seed1=${encodeURIComponent(animalA)}&seed2=${encodeURIComponent(animalB)}&mode=${mode}`);
    } else {
      const mode = gameMode === 'adventure' ? 'cyoa' : 'standard';
      const dbA = dbAnimals.find(a => a.name === animalA);
      const dbB = dbAnimals.find(a => a.name === animalB);
      let readUrl = `/read?a=${encodeURIComponent(animalA)}&b=${encodeURIComponent(animalB)}&env=neutral&mode=${mode}`;
      if (dbA?.imageUrl) readUrl += `&imgA=${encodeURIComponent(dbA.imageUrl)}`;
      if (dbB?.imageUrl) readUrl += `&imgB=${encodeURIComponent(dbB.imageUrl)}`;
      router.push(readUrl);
    }
  };

  const handleGenerate = async () => {
    if (!(animalA && animalB && animalA !== animalB)) return;

    const hasEmail = typeof window !== 'undefined' && localStorage.getItem('fb_email');
    if (!tierData.isAuthenticated && !hasEmail) {
      setPendingGenerate(true);
      setShowEmailCapture(true);
      return;
    }

    proceedWithGenerate();
  };

  const allFighters: FighterEntry[] = [...STATIC_FIGHTERS, ...dbAnimals];
  const selectedA = allFighters.find(f => f.name === animalA);
  const selectedB = allFighters.find(f => f.name === animalB);

  const CATEGORY_TABS = BASE_CATEGORY_TABS.map(tab => ({
    ...tab,
    count: allFighters.filter(f => f.category === tab.key).length,
  }));

  const filteredFighters = allFighters
    .filter(f => f.category === animalCategory)
    .sort((a, b) => {
      const aFeatured = FEATURED_ANIMALS.includes(a.name) ? FEATURED_ANIMALS.indexOf(a.name) : 99;
      const bFeatured = FEATURED_ANIMALS.includes(b.name) ? FEATURED_ANIMALS.indexOf(b.name) : 99;
      if (aFeatured !== bFeatured) return aFeatured - bFeatured;
      return a.name.localeCompare(b.name);
    });

  const navigateCategory = (direction: 'prev' | 'next') => {
    const currentIndex = CATEGORY_ORDER.indexOf(animalCategory);
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % CATEGORY_ORDER.length
      : (currentIndex - 1 + CATEGORY_ORDER.length) % CATEGORY_ORDER.length;

    const newCategory = CATEGORY_ORDER[newIndex];
    const tab = CATEGORY_TABS.find(t => t.key === newCategory);

    if (tab?.locked) {
      if (newCategory === 'dinosaur' && tierData.tier !== 'ultimate' && tierData.tier !== 'member') {
        setLockedAnimalClicked(undefined);
        setLockedFeature(newCategory);
        setShowUpgradeModal(true);
        return;
      }
      if (newCategory === 'fantasy' && tierData.tier !== 'ultimate') {
        setLockedAnimalClicked(undefined);
        setLockedFeature(newCategory);
        setShowUpgradeModal(true);
        return;
      }
    }

    setAnimalCategory(newCategory);
  };

  const lockedTotalCount = FIGHTERS.filter(f => isAnimalLocked(tierData.tier, f.name)).length;
  const canGenerate = animalA && animalB && animalA !== animalB;
  const canStartTournament = tournamentFighters.length === 8;
  const physicalBooks = getPhysicalBooks();

  return (
    <main
      className={`${bangers.variable} ${barlow.variable} ${barlowCondensed.variable} min-h-screen text-white`}
      style={{
        background: '#0d1c10',
        fontFamily: 'var(--font-barlow)',
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Who Would Win Books',
            url: 'https://whowouldwinbooks.com',
            description: 'Create epic who would win style animal battle books with real science, stats, and illustrated battles.',
          }),
        }}
      />

      <div className="hidden" aria-hidden="true">
        <SampleBookGallery />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-md" style={{ background: 'linear-gradient(to bottom, rgba(13,28,16,0.96), rgba(13,28,16,0.82))' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <a href="#top" className="text-[1.35rem] text-[#e8b63c]" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.08em' }}>
            </a>
            <nav className="hidden items-center gap-5 md:flex" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
              <a href="#create" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9eb5a4] transition hover:text-white">Create</a>
              <a href="#how" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9eb5a4] transition hover:text-white">How It Works</a>
              <a href="#membership" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9eb5a4] transition hover:text-white">Membership</a>

            </nav>
          </div>
          <AccountMenu
            isAuthenticated={tierData.isAuthenticated}
            email={tierData.email}
            tier={tierData.tier}
            onUpgrade={() => {
              setLockedFeature(undefined);
              setLockedAnimalClicked(undefined);
              setShowUpgradeModal(true);
            }}
          />
        </div>
      </header>

      <section id="top" className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 55% at 50% 18%, rgba(201,152,42,0.14) 0%, transparent 60%),
              radial-gradient(ellipse 60% 60% at 18% 88%, rgba(42,82,54,0.35) 0%, transparent 55%),
              radial-gradient(ellipse 60% 60% at 82% 84%, rgba(42,82,54,0.24) 0%, transparent 55%),
              linear-gradient(rgba(13,28,16,0.65), rgba(13,28,16,0.82)),
              url('/fighters/battle-gorilla-vs-grizzly-bear-cover.jpg') center 28% / cover no-repeat
            `,
          }}
        />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '14px 14px' }} />

        <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl flex-col px-4 pb-0 pt-16 sm:px-6 lg:px-8 lg:pt-20">
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center text-center">
            <span className="mb-4 text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#c9982a]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
              Kids' Battle Books — Built in Seconds
            </span>
            <h1 className="mb-4 text-[3.7rem] leading-none sm:text-[5.5rem] lg:text-[8rem]" style={sectionTitleStyle('var(--font-bangers)')}>
              Who Would
              <span className="block text-[#e8b63c]">Win?</span>
            </h1>
            <p className="mb-10 max-w-xl text-[1rem] leading-7 text-[#9eb5a4] sm:text-[1.05rem]">
              Pick two animals and get an illustrated matchup with real science, stat comparisons, and a final verdict kids actually want to read.
            </p>

            {/* MOBILE book fan — simple CSS, no hover state needed */}
            <div className="relative mb-6 h-[210px] w-full max-w-[360px] sm:h-[260px] sm:max-w-[540px] lg:hidden">
              {HERO_BOOKS.slice(0, 3).map((book, index) => {
                const positions = [
                  'left-1/2 top-[5px] h-[190px] w-[145px] -translate-x-1/2 sm:h-[230px] sm:w-[175px]',
                  'left-[calc(50%-130px)] top-[18px] h-[160px] w-[115px] -rotate-[4deg] sm:left-[calc(50%-160px)] sm:h-[200px] sm:w-[145px]',
                  'left-[calc(50%+20px)] top-[18px] h-[160px] w-[115px] rotate-[3.5deg] sm:left-[calc(50%+20px)] sm:h-[200px] sm:w-[145px]',
                ];
                const zIndexes = [5, 4, 4];
                return (
                  <a
                    key={book.title}
                    href={book.href}
                    className={`absolute overflow-hidden rounded-[3px] transition-transform duration-200 active:scale-95 ${positions[index]}`}
                    style={{ 
                      zIndex: zIndexes[index],
                      boxShadow: '0 0 0 1.5px rgba(232,182,60,0.55), 0 16px 45px rgba(0,0,0,0.75)',
                    }}
                  >
                    <img src={book.image} alt={book.title} className="h-full w-full object-cover" />
                  </a>
                );
              })}
            </div>

            {/* DESKTOP book fan — dynamic hover states */}
            <div className="relative mb-6 hidden h-[300px] w-full max-w-[820px] lg:block">
              {HERO_BOOKS.map((book, index) => {
                const baseRotations = [0, -3.5, 3, -7];
                const hoverAwayRotations = [0, -9, 9, -14];
                const desktopPositions = [
                  { left: '50%', top: '5px', width: '220px', height: '290px', translateX: '-50%', zBase: 5 },
                  { left: 'calc(50% - 215px)', top: '20px', width: '185px', height: '260px', translateX: '0', zBase: 4 },
                  { left: 'calc(50% + 30px)', top: '20px', width: '185px', height: '260px', translateX: '0', zBase: 4 },
                  { left: 'calc(50% - 330px)', top: '38px', width: '165px', height: '230px', translateX: '0', zBase: 3 },
                ];
                const pos = desktopPositions[index];
                const isHovered = hoveredBook === index;
                const otherHovered = hoveredBook !== null && hoveredBook !== index;
                const rotation = otherHovered ? hoverAwayRotations[index] : baseRotations[index];
                const translateY = isHovered ? '-28px' : '0px';
                const scale = isHovered ? 1.08 : otherHovered ? 0.94 : 1;
                const opacity = index === 3 ? (otherHovered ? 0.35 : 0.7) : (otherHovered ? 0.55 : 1);
                const zIndex = isHovered ? 20 : pos.zBase;
                const boxShadow = isHovered
                  ? '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(232,182,60,0.5)'
                  : '0 18px 55px rgba(0,0,0,0.65)';
                return (
                  <button
                    key={book.title}
                    onClick={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setExpandedBook({ index, rect });
                      setTimeout(() => { window.location.href = book.href; }, 550);
                    }}
                    onMouseEnter={() => setHoveredBook(index)}
                    onMouseLeave={() => setHoveredBook(null)}
                    style={{
                      position: 'absolute', left: pos.left, top: pos.top,
                      width: pos.width, height: pos.height, zIndex,
                      transform: `translateX(${pos.translateX}) translateY(${translateY}) rotate(${rotation}deg) scale(${scale})`,
                      opacity, boxShadow,
                      transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease, box-shadow 0.35s ease',
                      animationDelay: `${index * 0.12 + 0.2}s`,
                      borderRadius: '3px', overflow: 'hidden',
                      border: isHovered ? '1px solid rgba(232,182,60,0.4)' : '1px solid rgba(201,152,42,0.1)',
                      cursor: 'pointer', background: 'none', padding: 0,
                    }}
                    className="[animation:bookFanIn_0.55s_cubic-bezier(0.34,1.56,0.64,1)_both]"
                  >
                    <img src={book.image} alt={book.title} className="h-full w-full object-cover"
                      style={{ transform: isHovered ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.4s ease' }} />
                    <div style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.25s ease' }}
                      className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent px-3 pb-3 pt-10 text-center">
                      <span className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-white" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                        {book.title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Click-to-expand: book scales up + screen darkens */}
            {expandedBook && (
              <>
                {/* Dark overlay fades in */}
                <div
                  className="fixed inset-0 z-[998] pointer-events-none bg-[#0d1c10]"
                  style={{ animation: 'screenDarken 0.55s ease forwards' }}
                />
                {/* Book scales from its position */}
                <div
                  style={{
                    position: 'fixed',
                    left: expandedBook.rect.left + expandedBook.rect.width / 2,
                    top: expandedBook.rect.top + expandedBook.rect.height / 2,
                    width: expandedBook.rect.width,
                    height: expandedBook.rect.height,
                    marginLeft: -expandedBook.rect.width / 2,
                    marginTop: -expandedBook.rect.height / 2,
                    animation: 'bookScaleUpNoShift 0.55s cubic-bezier(0.16,1,0.3,1) forwards',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    zIndex: 999,
                    pointerEvents: 'none',
                  }}
                >
                  <img src={HERO_BOOKS[expandedBook.index].image} alt="" className="h-full w-full object-cover" />
                </div>
              </>
            )}

            <p className="mb-8 hidden text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#7a9280] lg:block" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
              Open a free sample above, or build your own battle below
            </p>

            <div className="mb-14 flex flex-col items-center gap-3">
              <a
                href="#create"
                className="inline-flex items-center justify-center rounded-sm bg-[#e8b63c] px-10 py-4 text-[1rem] font-bold uppercase tracking-[0.14em] text-[#0d1c10] transition hover:-translate-y-0.5 hover:bg-[#f5d98a]"
                style={{ fontFamily: 'var(--font-barlow-condensed)' }}
              >
                Create Your Own Battle
              </a>
              <span className="text-[0.76rem] uppercase tracking-[0.1em] text-[#7a9280]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                Free to start · no signup needed · designed for ages 5–12
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-white/6 sm:grid-cols-4">
            {[
              ['5,000+', 'Books Created'],
              ['Real', 'Science & Stats'],
              ['Ages 5–12', 'Ideal Reading Level'],
              ['Builds', 'Reading Vocabulary'],
            ].map(([value, label], index) => (
              <div key={label} className={`px-4 py-6 text-center ${index % 2 === 0 ? 'border-r border-white/6 sm:border-r' : ''} ${index > 1 ? 'border-t border-white/6 sm:border-t-0' : ''} ${index < 3 ? 'sm:border-r sm:border-white/6' : ''}`}>
                <span className="block text-[1.7rem] font-bold leading-none text-[#e8b63c] sm:text-[2rem]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>{value}</span>
                <span className="mt-1 block text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#7a9280]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#2a5236] to-transparent" />

      <section id="create" className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Atmospheric background shift per category */}
        {animalCategory === 'dinosaur' && <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-950/20 to-transparent transition-all duration-500" />}
        {animalCategory === 'fantasy' && <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-950/25 to-transparent transition-all duration-500" />}
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-3 block text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#c9982a]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
            Build Your Book
          </span>
          <h2 className="text-[2.5rem] sm:text-[3.5rem]" style={sectionTitleStyle('var(--font-bangers)')}>
            Choose Your Fighters
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[0.95rem] leading-7 text-[#9eb5a4]">
            Select a matchup, choose a mode, and generate your next animal showdown.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex rounded-full border border-[#2a5236] bg-[#1b2e1f] p-1">
            <button
              onClick={() => handleGameModeSelect('classic')}
              className={`rounded-full px-6 py-2 text-[0.78rem] font-bold uppercase tracking-[0.16em] transition ${gameMode === 'classic' ? 'bg-[#2a5236] text-white' : 'text-[#7a9280] hover:text-white'}`}
              style={{ fontFamily: 'var(--font-barlow-condensed)' }}
            >
              Classic
            </button>
            <button
              onClick={() => handleGameModeSelect('adventure')}
              className={`rounded-full px-6 py-2 text-[0.78rem] font-bold uppercase tracking-[0.16em] transition ${gameMode === 'adventure' ? 'bg-[#2a5236] text-white' : 'text-[#7a9280] hover:text-white'}`}
              style={{ fontFamily: 'var(--font-barlow-condensed)' }}
            >
              Adventure
            </button>
          </div>

          <button
            onClick={handleTournamentToggle}
            className={`rounded-full border px-5 py-2 text-[0.78rem] font-bold uppercase tracking-[0.16em] transition ${battleType === 'tournament' ? 'border-[#e8b63c] bg-[#e8b63c] text-[#0d1c10]' : 'border-[#2a5236] bg-transparent text-[#9eb5a4] hover:text-white'}`}
            style={{ fontFamily: 'var(--font-barlow-condensed)' }}
          >
            Tournament Mode
          </button>
        </div>

        {battleType === 'single' ? (
          <>
            <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-start lg:gap-8">
              {[
                { key: 'A' as const, label: 'Red Corner', animal: selectedA, active: selectingFor === 'A', color: '#8f2020' },
                { key: 'B' as const, label: 'Blue Corner', animal: selectedB, active: selectingFor === 'B', color: '#1d4f8c' },
              ].map((slot, index) => (
                <>
                  {index === 1 && (
                    <div key="vs" className="flex items-center justify-center py-2 lg:py-16">
                      <span className="text-[2.8rem] leading-none text-[#c9982a] opacity-70 sm:text-[3.6rem]" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.08em' }}>
                        VS
                      </span>
                    </div>
                  )}
                  <button
                    key={slot.key}
                    onClick={() => setSelectingFor(slot.key)}
                    className={`relative min-h-[160px] overflow-hidden rounded-md border text-left transition sm:min-h-[220px] ${slot.animal ? 'border-[#e8b63c]' : 'border-[#2a5236] hover:border-[#c9982a]'} ${slot.active ? 'ring-2 ring-[#e8b63c]' : ''}`}
                    style={{ background: '#1b2e1f' }}
                  >
                    {slot.animal && (
                      <div className="absolute inset-0 opacity-60" style={{ background: `linear-gradient(rgba(13,28,16,0.2), rgba(13,28,16,0.65)), url(${getImagePath(slot.animal.name)}) center / cover no-repeat` }} />
                    )}
                    <div className="relative flex h-full min-h-[160px] flex-col items-center justify-center px-6 py-8 text-center sm:min-h-[220px]">
                      <span className="mb-3 text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#9eb5a4]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                        {slot.label}
                      </span>
                      {slot.animal ? (
                        <span className="text-[2rem] text-white sm:text-[2.6rem]" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.04em', lineHeight: 1 }}>
                          {slot.animal.name}
                        </span>
                      ) : (
                        <span className="text-[1rem] font-semibold uppercase tracking-[0.12em] text-[#7a9280]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                          Tap to Select
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: slot.color }} />
                  </button>
                </>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={() => navigateCategory('prev')}
                className="flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[#9eb5a4] transition hover:border-[#c9982a] hover:text-[#e8b63c]"
                aria-label="Previous category"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5"><path d="M12 4 6 10l6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>

              <div className="flex flex-wrap justify-center gap-2">
                {CATEGORY_TABS.map(tab => {
                  const isLocked = tab.locked && (tierData.tier === 'unregistered' || (tab.key === 'fantasy' && tierData.tier === 'member'));
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        if (tab.locked && tab.key === 'dinosaur' && tierData.tier !== 'ultimate' && tierData.tier !== 'member') {
                          setLockedAnimalClicked(undefined);
                          setLockedFeature(tab.key);
                          setShowUpgradeModal(true);
                          return;
                        }
                        if (tab.locked && tab.key === 'fantasy' && tierData.tier !== 'ultimate') {
                          setLockedAnimalClicked(undefined);
                          setLockedFeature(tab.key);
                          setShowUpgradeModal(true);
                          return;
                        }
                        setAnimalCategory(tab.key);
                      }}
                      className={`rounded-md border px-4 py-2 text-[0.78rem] font-bold uppercase tracking-[0.14em] transition ${animalCategory === tab.key ? 'border-[#c9982a] bg-[#c9982a] text-[#0d1c10]' : 'border-white/10 bg-white/5 text-[#9eb5a4] hover:text-white'}`}
                      style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                    >
                      {tab.label} ({tab.count}){isLocked ? ' Locked' : ''}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => navigateCategory('next')}
                className="flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[#9eb5a4] transition hover:border-[#c9982a] hover:text-[#e8b63c]"
                aria-label="Next category"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5"><path d="m8 4 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>

            <div
              className="mt-6 grid auto-rows-[85px] grid-cols-[repeat(auto-fill,minmax(85px,1fr))] gap-2 sm:auto-rows-[120px] sm:grid-cols-[repeat(auto-fill,minmax(120px,1fr))]"
              style={{ gridAutoFlow: 'dense' }}
            >
              {filteredFighters.map(fighter => {
                const locked = !fighter.isUserCustom && isAnimalLocked(tierData.tier, fighter.name);
                const isGenerating = fighter.status === 'generating';
                const isFailed = fighter.status === 'failed';
                const isSelected = animalA === fighter.name || animalB === fighter.name;
                const isFeatured = animalCategory === 'real' && FEATURED_ANIMALS.includes(fighter.name);

                return (
                  <button
                    key={`${fighter.name}-${fighter.isUserCustom ? 'custom' : 'base'}`}
                    onClick={() => {
                      if (!isGenerating && !isFailed) handleFighterSelect(fighter.name);
                    }}
                    disabled={isGenerating || isFailed}
                    className={`group relative overflow-hidden rounded-[3px] border transition ${isFeatured ? 'col-span-2 row-span-2' : ''} ${isSelected ? 'border-[#e8b63c] shadow-[0_0_0_3px_rgba(232,182,60,0.18)]' : 'border-white/8'} ${locked ? 'opacity-90' : 'hover:z-10 hover:scale-[1.03] hover:border-[#c9982a]'}`}
                    style={{ background: '#131e16' }}
                  >
                    {isGenerating ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#2a5236]">
                        <span className="text-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/80" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                          Creating
                        </span>
                      </div>
                    ) : (
                      <>
                        <img src={getImagePath(fighter.name)} alt={fighter.name} className={`h-full w-full object-cover transition duration-300 ${locked ? 'brightness-50 saturate-50' : 'group-hover:scale-[1.06]'}`} />
                        {!locked && animalCategory === 'dinosaur' && <div className="pointer-events-none absolute inset-0 bg-amber-900/20 mix-blend-multiply" />}
                        {!locked && animalCategory === 'fantasy' && <div className="pointer-events-none absolute inset-0 bg-indigo-900/25 mix-blend-multiply" />}
                      </>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                    {isSelected && (
                      <div className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#e8b63c] text-[#0d1c10]">
                        {CHECK_ICON}
                      </div>
                    )}

                    {locked && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0d1c10]/28">
                        <div className="flex items-center gap-1 rounded-sm border border-[#c9982a]/40 bg-[#0d1c10]/75 px-2 py-1 text-[#e8b63c]">
                          {LOCK_ICON}
                          <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                            Member
                          </span>
                        </div>
                      </div>
                    )}

                    {fighter.isUserCustom && !locked && !isGenerating && (
                      <div className="absolute left-2 top-2 z-10 rounded-sm border border-white/15 bg-black/55 px-1.5 py-1 text-[0.56rem] font-bold uppercase tracking-[0.12em] text-white/80" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                        Custom
                      </div>
                    )}

                    <div className={`absolute inset-x-0 bottom-0 z-10 translate-y-1 px-2 pb-2 pt-8 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 ${isSelected ? 'opacity-100 translate-y-0' : ''}`}>
                      <span className={`block text-center font-bold uppercase tracking-[0.1em] text-white ${isFeatured ? 'text-[0.9rem]' : 'text-[0.68rem] sm:text-[0.72rem]'}`} style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                        {fighter.name}
                      </span>
                    </div>
                  </button>
                );
              })}

              {animalCategory === 'fantasy' && (
                <button
                  onClick={() => {
                    if (tierData.tier !== 'ultimate') {
                      setLockedAnimalClicked(undefined);
                      setLockedFeature('create-own');
                      setShowUpgradeModal(true);
                      return;
                    }
                    setShowCreateModal(true);
                  }}
                  className="group relative overflow-hidden rounded-[3px] border border-dashed border-[#c9982a]/45 bg-[#1b2e1f] transition hover:border-[#e8b63c]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2a5236]/40 to-[#131e16]" />
                  <div className="relative flex h-full flex-col items-center justify-center px-3 text-center">
                    <span className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-white/90" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                      Create Your Own
                    </span>
                    <span className="mt-1 text-[0.62rem] uppercase tracking-[0.12em] text-[#9eb5a4]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                      Ultimate feature
                    </span>
                  </div>
                </button>
              )}
            </div>

            {lockedTotalCount > 0 && (
              <button
                onClick={() => setShowPricing(true)}
                className="mt-5 w-full rounded-sm border border-[#c9982a]/30 bg-[linear-gradient(90deg,#131e16,#1b2e1f,#131e16)] px-5 py-4 text-left transition hover:border-[#c9982a]"
              >
                <span className="block text-[1rem] text-[#e8b63c]" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.03em' }}>
                  Unlock {lockedTotalCount} More Animals
                </span>
                <span className="mt-1 block text-sm text-[#9eb5a4]">
                  Get access to more matchups, tournament mode, and higher-tier categories.
                </span>
              </button>
            )}

            <button
              onClick={() => setShowFightOverlay(true)}
              disabled={!canGenerate}
              className="mt-8 w-full rounded-sm px-6 py-4 text-[1.05rem] font-bold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:bg-[#2a5236] disabled:text-[#7a9280] disabled:hover:translate-y-0 sm:text-[1.1rem]"
              style={{ fontFamily: 'var(--font-barlow-condensed)', background: canGenerate ? '#e8b63c' : '#2a5236', color: canGenerate ? '#0d1c10' : '#7a9280' }}
            >
              Generate Battle Book
            </button>
          </>
        ) : (
          <div className="mt-10 space-y-6">
            <div className="rounded-md border border-[#2a5236] bg-[#131e16] p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-[2rem] text-white sm:text-[2.3rem]" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.04em', lineHeight: 1 }}>
                    Tournament Bracket
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9eb5a4]">
                    Select eight fighters to seed your bracket. Click a selected fighter again to remove it.
                  </p>
                </div>
                <div className="rounded-sm border border-[#2a5236] bg-[#0d1c10] px-4 py-3 text-center">
                  <span className="block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#7a9280]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                    Selected
                  </span>
                  <span className="block text-[1.8rem] leading-none text-[#e8b63c]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                    {tournamentFighters.length}/8
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                {[...Array(8)].map((_, index) => {
                  const fighter = tournamentFighters[index];
                  return (
                    <button
                      key={index}
                      onClick={() => fighter && handleTournamentFighterSelect(fighter)}
                      className={`relative aspect-square overflow-hidden rounded-[3px] border ${fighter ? 'border-[#e8b63c]' : 'border-dashed border-white/15'} bg-[#0d1c10] text-left`}
                    >
                      {fighter ? (
                        <>
                          <img src={getImagePath(fighter)} alt={fighter} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 px-2 pb-2 pt-8 text-center">
                            <span className="block text-[0.62rem] font-bold uppercase tracking-[0.08em] text-white" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>{fighter}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center text-center">
                          <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#7a9280]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                            Slot {index + 1}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={() => navigateCategory('prev')}
                className="flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[#9eb5a4] transition hover:border-[#c9982a] hover:text-[#e8b63c]"
                aria-label="Previous category"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5"><path d="M12 4 6 10l6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>

              <div className="flex flex-wrap justify-center gap-2">
                {CATEGORY_TABS.map(tab => {
                  const isLocked = tab.locked && (tierData.tier === 'unregistered' || (tab.key === 'fantasy' && tierData.tier === 'member'));
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        if (tab.locked && tab.key === 'dinosaur' && tierData.tier !== 'ultimate' && tierData.tier !== 'member') {
                          setLockedAnimalClicked(undefined);
                          setLockedFeature(tab.key);
                          setShowUpgradeModal(true);
                          return;
                        }
                        if (tab.locked && tab.key === 'fantasy' && tierData.tier !== 'ultimate') {
                          setLockedAnimalClicked(undefined);
                          setLockedFeature(tab.key);
                          setShowUpgradeModal(true);
                          return;
                        }
                        setAnimalCategory(tab.key);
                      }}
                      className={`rounded-md border px-4 py-2 text-[0.78rem] font-bold uppercase tracking-[0.14em] transition ${animalCategory === tab.key ? 'border-[#c9982a] bg-[#c9982a] text-[#0d1c10]' : 'border-white/10 bg-white/5 text-[#9eb5a4] hover:text-white'}`}
                      style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                    >
                      {tab.label} ({tab.count}){isLocked ? ' Locked' : ''}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => navigateCategory('next')}
                className="flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[#9eb5a4] transition hover:border-[#c9982a] hover:text-[#e8b63c]"
                aria-label="Next category"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5"><path d="m8 4 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>

            <div className="grid auto-rows-[85px] grid-cols-[repeat(auto-fill,minmax(85px,1fr))] gap-2 sm:auto-rows-[120px] sm:grid-cols-[repeat(auto-fill,minmax(120px,1fr))]" style={{ gridAutoFlow: 'dense' }}>
              {filteredFighters.map(fighter => {
                const locked = !fighter.isUserCustom && isAnimalLocked(tierData.tier, fighter.name);
                const isSelected = tournamentFighters.includes(fighter.name);
                const isGenerating = fighter.status === 'generating';
                const isFeatured = animalCategory === 'real' && FEATURED_ANIMALS.includes(fighter.name);
                return (
                  <button
                    key={`tournament-${fighter.name}`}
                    onClick={() => !isGenerating && handleTournamentFighterSelect(fighter.name)}
                    disabled={isGenerating}
                    className={`group relative overflow-hidden rounded-[3px] border transition ${isFeatured ? 'col-span-2 row-span-2' : ''} ${isSelected ? 'border-[#e8b63c] shadow-[0_0_0_3px_rgba(232,182,60,0.18)]' : 'border-white/8'} ${locked ? 'opacity-90' : 'hover:z-10 hover:scale-[1.03] hover:border-[#c9982a]'}`}
                    style={{ background: '#131e16' }}
                  >
                    {isGenerating ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#2a5236]">
                        <span className="text-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/80" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                          Creating
                        </span>
                      </div>
                    ) : (
                      <img src={getImagePath(fighter.name)} alt={fighter.name} className={`h-full w-full object-cover transition duration-300 ${locked ? 'brightness-50 saturate-50' : 'group-hover:scale-[1.06]'}`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                    {isSelected && (
                      <div className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#e8b63c] text-[#0d1c10]">
                        {CHECK_ICON}
                      </div>
                    )}
                    {locked && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d1c10]/28">
                        <div className="flex items-center gap-1 rounded-sm border border-[#c9982a]/40 bg-[#0d1c10]/75 px-2 py-1 text-[#e8b63c]">
                          {LOCK_ICON}
                          <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                            Member
                          </span>
                        </div>
                      </div>
                    )}
                    <div className={`absolute inset-x-0 bottom-0 z-10 translate-y-1 px-2 pb-2 pt-8 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 ${isSelected ? 'opacity-100 translate-y-0' : ''}`}>
                      <span className={`block text-center font-bold uppercase tracking-[0.1em] text-white ${isFeatured ? 'text-[0.9rem]' : 'text-[0.68rem] sm:text-[0.72rem]'}`} style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                        {fighter.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleStartTournament}
              disabled={!canStartTournament}
              className="w-full rounded-sm px-6 py-4 text-[1.05rem] font-bold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:bg-[#2a5236] disabled:text-[#7a9280]"
              style={{ fontFamily: 'var(--font-barlow-condensed)', background: canStartTournament ? '#e8b63c' : '#2a5236', color: canStartTournament ? '#0d1c10' : '#7a9280' }}
            >
              Start Tournament
            </button>
          </div>
        )}
      </section>

      <section id="membership" className="relative overflow-hidden py-24">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(rgba(10,22,12,0.82), rgba(10,22,12,0.82)), url('/fighters/battle-lion-vs-tiger-cover.jpg') center / cover no-repeat`,
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="mb-4 inline-block rounded-sm border border-[#c9982a]/25 bg-[#c9982a]/8 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#c9982a]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
            Membership
          </span>
          <h2 className="text-[2.3rem] sm:text-[3rem]" style={sectionTitleStyle('var(--font-bangers)')}>
            Unlock the Full Roster
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[0.96rem] leading-7 text-[#9eb5a4]">
            The free tier gets you started. Membership opens up more animals, tournament play, printable books, and advanced story modes.
          </p>
          <ul className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-3 text-center">
            {[
              'More animals across higher tiers including dinosaurs and fantasy creatures',
              'Unlimited book creation and deeper matchup variety',
              'Tournament mode and classroom-friendly printable formats',
              'Early access to new roster additions and premium features',
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-[0.84rem] font-semibold tracking-[0.03em] text-white" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                <span className="inline-block h-px w-4 bg-[#c9982a]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col items-center gap-3">
            <button
              onClick={() => setShowPricing(true)}
              className="inline-flex items-center justify-center rounded-sm border border-[#c9982a] px-8 py-4 text-[0.95rem] font-bold uppercase tracking-[0.14em] text-[#e8b63c] transition hover:bg-[#c9982a] hover:text-[#0d1c10]"
              style={{ fontFamily: 'var(--font-barlow-condensed)' }}
            >
              View Membership Options
            </button>
            <span className="text-[0.74rem] uppercase tracking-[0.08em] text-[#7a9280]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
              Member access starts at $4.99
            </span>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#2a5236] to-transparent" />

      <section id="how" className="border-y border-white/5 bg-[#131e16] py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="mb-3 block text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#c9982a]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
            The Process
          </span>
          <h2 className="text-[2.4rem] sm:text-[3.2rem]" style={sectionTitleStyle('var(--font-bangers)')}>
            How It Works
          </h2>
          <div className="relative mt-12 grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-6">
            <div className="absolute left-[12%] right-[12%] top-5 hidden h-px bg-gradient-to-r from-transparent via-[#2a5236] to-transparent md:block" />
            {HOW_STEPS.map((step, index) => (
              <div key={step.title} className="relative px-2">
                <div className="mb-5 flex justify-center">
                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#2a5236] bg-[#1b2e1f] text-[0.9rem] font-bold text-[#e8b63c]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-[1.1rem] font-bold text-white" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
                  {step.title}
                </h3>
                <p className="mt-3 text-[0.88rem] leading-7 text-[#9eb5a4]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#2a5236] to-transparent" />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="mb-3 block text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#c9982a]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
            The Original Series
          </span>
          <h2 className="text-[2.4rem] sm:text-[3.2rem]" style={sectionTitleStyle('var(--font-bangers)')}>
            The Books That Started It All
          </h2>
        </div>

        <div className="mt-12 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative flex min-h-[225px] min-w-max gap-3 px-1 sm:block sm:min-h-[280px] sm:min-w-0">
            {physicalBooks.map((book, index) => {
              const desktopStyles = [
                'sm:left-[0%] sm:top-[45px] sm:h-[190px] sm:w-[140px] sm:-rotate-[2deg] sm:z-[5]',
                'sm:left-[9%] sm:top-[30px] sm:h-[205px] sm:w-[150px] sm:rotate-[1deg] sm:z-[6]',
                'sm:left-[19%] sm:top-[20px] sm:h-[215px] sm:w-[155px] sm:-rotate-[1.5deg] sm:z-[7]',
                'sm:left-[29%] sm:top-[28px] sm:h-[205px] sm:w-[150px] sm:rotate-[2.5deg] sm:z-[6]',
                'sm:left-[39%] sm:top-[38px] sm:h-[198px] sm:w-[145px] sm:-rotate-[2deg] sm:z-[5]',
                'sm:left-[49%] sm:top-[25px] sm:h-[205px] sm:w-[150px] sm:rotate-[1.5deg] sm:z-[6]',
                'sm:left-[59%] sm:top-[15px] sm:h-[215px] sm:w-[155px] sm:-rotate-[1deg] sm:z-[7]',
              ];
              return (
                <a
                  key={book.asin}
                  href={book.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`relative block h-[138px] w-[100px] flex-shrink-0 overflow-hidden rounded-[3px] shadow-[0_16px_50px_rgba(0,0,0,0.6)] transition hover:-translate-y-2 hover:shadow-[0_26px_65px_rgba(0,0,0,0.7)] sm:absolute sm:h-auto sm:w-auto ${desktopStyles[index]}`}
                >
                  <img src={book.cover} alt={book.title} className="h-full w-full object-cover" />
                </a>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-left">
          <div className="max-w-3xl text-[0.94rem] leading-7 text-[#9eb5a4]">
            The <strong className="font-medium text-[#cfd8d1]">Who Would Win?</strong> series by Jerry Pallotta helped define the animal battle format for a generation of readers. FightingBooks is a fan project inspired by that same matchup-first curiosity.
          </div>
          <a
            href="https://www.amazon.com/s?k=who+would+win+jerry+pallotta&tag=whowouldwinbo-20"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm border border-[#c9982a] px-6 py-3 text-[0.82rem] font-bold uppercase tracking-[0.14em] text-[#c9982a] transition hover:bg-[#c9982a] hover:text-[#0d1c10]"
            style={{ fontFamily: 'var(--font-barlow-condensed)' }}
          >
            Shop Full Collection on Amazon
          </a>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#2a5236] to-transparent" />

      <footer className="px-4 py-10 text-center sm:px-6 lg:px-8">
        <p className="text-[0.78rem] uppercase tracking-[0.08em] text-[#7a9280]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
          Based on the bestselling Who Would Win? series by Jerry Pallotta. FightingBooks is a fan project and is not affiliated with Jerry Pallotta or Scholastic.
        </p>
      </footer>

      {showPricing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowPricing(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-[#c9982a]/25 bg-[#0d1c10] p-6 sm:p-8" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowPricing(false)} className="absolute right-4 top-3 text-2xl text-white/50 transition hover:text-white">×</button>
            <div className="text-center">
              <h2 className="text-[2.4rem] text-[#e8b63c] sm:text-[3rem]" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.04em', lineHeight: 1 }}>
                Unlock More Matchups
              </h2>
              <p className="mt-3 text-sm text-[#9eb5a4]">The free version is real, but the full roster goes much deeper.</p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-[#c9982a] bg-[#131e16] p-6 shadow-[0_0_30px_rgba(201,152,42,0.08)]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-[2rem] text-[#e8b63c]" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.04em', lineHeight: 1 }}>
                      Member
                    </h3>
                    <p className="mt-2 text-sm text-[#9eb5a4]">More real animals, tournament mode, and printable books.</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-3xl text-white" style={{ fontFamily: 'var(--font-bangers)' }}>$4.99</div>
                    <div className="text-xs uppercase tracking-[0.12em] text-[#7a9280]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>one-time</div>
                  </div>
                </div>
                <button
                  onClick={() => handleUpgrade('member')}
                  className="mt-6 w-full rounded-sm bg-[#e8b63c] px-5 py-3 text-[0.95rem] font-bold uppercase tracking-[0.14em] text-[#0d1c10] transition hover:bg-[#f5d98a]"
                  style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                >
                  Unlock Member
                </button>
              </div>

              <div className="rounded-lg border border-[#6f5ab5]/40 bg-[#13161f] p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-[2rem] text-[#d7c9ff]" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.04em', lineHeight: 1 }}>
                      Ultimate
                    </h3>
                    <p className="mt-2 text-sm text-[#a8a4b5]">Adds fantasy, advanced story modes, and custom creature creation.</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-3xl text-white" style={{ fontFamily: 'var(--font-bangers)' }}>$4.99</div>
                    <div className="text-xs uppercase tracking-[0.12em] text-[#7a9280]" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>per month</div>
                  </div>
                </div>
                <button
                  onClick={() => handleUpgrade('ultimate')}
                  className="mt-6 w-full rounded-sm border border-[#8e78d9] bg-[#5c4698] px-5 py-3 text-[0.95rem] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#6c56ad]"
                  style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                >
                  Go Ultimate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {battleType === 'single' && canGenerate && showFightOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => { if (!loading) { setShowFightOverlay(false); setAnimalA(''); setAnimalB(''); setSelectingFor('A'); } }}>
          <div className="w-full max-w-3xl rounded-xl border border-[#c9982a]/25 bg-[#0d1c10] p-6 sm:p-8" onClick={e => e.stopPropagation()}>
            <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto_1fr]">
              {[animalA, animalB].map((animal, index) => (
                <div key={animal} className="text-center">
                  <div className={`mx-auto h-24 w-24 overflow-hidden rounded-full border-4 ${index === 0 ? 'border-[#8f2020]' : 'border-[#1d4f8c]'} sm:h-28 sm:w-28`}>
                    <img src={getImagePath(animal)} alt={animal} className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-3 text-[1.45rem] text-white sm:text-[1.8rem]" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.03em' }}>{animal}</p>
                </div>
              ))}
              <div className="text-center text-[3rem] text-[#e8b63c]" style={{ fontFamily: 'var(--font-bangers)' }}>VS</div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="rounded-sm bg-[#e8b63c] px-10 py-4 text-[1.2rem] font-bold uppercase tracking-[0.14em] text-[#0d1c10] transition hover:-translate-y-0.5 hover:bg-[#f5d98a] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ fontFamily: 'var(--font-barlow-condensed)' }}
              >
                {loading ? 'Creating Book' : 'Fight'}
              </button>
              <p className="mt-4 text-sm text-[#9eb5a4]">
                {gameMode === 'classic' ? 'Classic mode will generate the standard battle book.' : 'Adventure mode will generate the branching story version.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {battleType === 'tournament' && canStartTournament && showTournamentOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => { if (!loading) setShowTournamentOverlay(false); }}>
          <div className="w-full max-w-4xl rounded-xl border border-[#c9982a]/25 bg-[#0d1c10] p-6 sm:p-8" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <h2 className="text-[2.6rem] text-[#e8b63c] sm:text-[3.2rem]" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.04em', lineHeight: 1 }}>
                Tournament Ready
              </h2>
              <p className="mt-3 text-sm text-[#9eb5a4]">Here are your first-round matchups.</p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[0, 2, 4, 6].map(i => (
                <div key={i} className="rounded-md border border-white/8 bg-[#131e16] p-4">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="flex items-center gap-3">
                      <img src={getImagePath(tournamentFighters[i])} alt={tournamentFighters[i]} className="h-12 w-12 rounded-full object-cover" />
                      <span className="text-sm font-semibold text-white">{tournamentFighters[i]}</span>
                    </div>
                    <span className="text-[1.6rem] text-[#c9982a]" style={{ fontFamily: 'var(--font-bangers)' }}>VS</span>
                    <div className="flex items-center justify-end gap-3 text-right">
                      <span className="text-sm font-semibold text-white">{tournamentFighters[i + 1]}</span>
                      <img src={getImagePath(tournamentFighters[i + 1])} alt={tournamentFighters[i + 1]} className="h-12 w-12 rounded-full object-cover" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleStartTournament}
                disabled={loading}
                className="rounded-sm bg-[#e8b63c] px-10 py-4 text-[1.15rem] font-bold uppercase tracking-[0.14em] text-[#0d1c10] transition hover:-translate-y-0.5 hover:bg-[#f5d98a] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ fontFamily: 'var(--font-barlow-condensed)' }}
              >
                {loading ? 'Preparing Bracket' : 'Start Tournament'}
              </button>
            </div>
          </div>
        </div>
      )}

      <EmailCaptureModal
        isOpen={showEmailCapture}
        onClose={() => { setShowEmailCapture(false); setPendingGenerate(false); }}
        onSubmit={() => {
          setShowEmailCapture(false);
          if (pendingGenerate) {
            setPendingGenerate(false);
            if (battleType === 'tournament') {
              proceedWithTournament();
            } else {
              proceedWithGenerate();
            }
          }
        }}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        lockedAnimal={lockedAnimalClicked}
        lockedFeature={lockedFeature}
        currentTier={tierData.tier}
        upgradeOptions={tierData.canUpgradeTo}
        onUpgrade={handleUpgrade}
        isAuthenticated={tierData.isAuthenticated}
      />

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { if (!createLoading) { setShowCreateModal(false); setCreateError(''); setCreateName(''); } }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-xl border border-[#8e78d9]/40 bg-[#0d1c10] p-6 sm:p-8" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { if (!createLoading) { setShowCreateModal(false); setCreateError(''); setCreateName(''); } }}
              className="absolute right-4 top-3 text-2xl text-white/50 transition hover:text-white"
            >
              ×
            </button>

            <div className="text-center">
              <h2 className="text-[2.2rem] text-[#d7c9ff]" style={{ fontFamily: 'var(--font-bangers)', letterSpacing: '0.04em', lineHeight: 1 }}>
                Create Your Creature
              </h2>
              <p className="mt-3 text-sm text-[#a8a4b5]">Name a creature and we’ll generate its profile and images.</p>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/80">Creature Name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={e => { setCreateName(e.target.value); setCreateError(''); }}
                  placeholder="Shadow Phoenix, Crystal Serpent..."
                  className="w-full rounded-md border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#8e78d9]"
                  disabled={createLoading}
                  maxLength={50}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && createName.trim() && !createLoading) handleCreateAnimal();
                  }}
                />
              </div>

              {createError && (
                <div className="rounded-md border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-200">
                  {createError}
                </div>
              )}

              <button
                onClick={handleCreateAnimal}
                disabled={createLoading || !createName.trim()}
                className="w-full rounded-sm border border-[#8e78d9] bg-[#5c4698] px-5 py-3 text-[0.95rem] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#6c56ad] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ fontFamily: 'var(--font-barlow-condensed)' }}
              >
                {createLoading ? 'Creating Creature' : 'Bring It to Life'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
