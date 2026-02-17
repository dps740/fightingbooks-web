'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { quickContentCheck, isKnownAnimal, checkRateLimit, incrementRateLimit } from '@/lib/content-moderation';
import { WHO_WOULD_WIN_BOOKS } from '@/data/who-would-win-books';
import { useTier, isAnimalLocked, isCyoaLocked, isTournamentLocked } from '@/lib/useTier';
import UpgradeModal from '@/components/UpgradeModal';
import TierInfoPopover from '@/components/TierInfoPopover';
import AccountMenu from '@/components/AccountMenu';
import SampleBookGallery from '@/components/SampleBookGallery';
import EmailCaptureModal from '@/components/EmailCaptureModal';
import { UserTier, REAL_ANIMALS, DINOSAUR_ANIMALS, FANTASY_ANIMALS } from '@/lib/tierAccess';

// Static fighter list from tierAccess.ts (base animals)
const STATIC_FIGHTERS = [
  ...REAL_ANIMALS.map(name => ({ name, category: 'real' as const, isCustom: false, imageUrl: undefined as string | undefined })),
  ...DINOSAUR_ANIMALS.map(name => ({ name, category: 'dinosaur' as const, isCustom: false, imageUrl: undefined as string | undefined })),
  ...FANTASY_ANIMALS.map(name => ({ name, category: 'fantasy' as const, isCustom: false, imageUrl: undefined as string | undefined })),
];

// DB animal type
interface DbAnimal {
  id: string;
  name: string;
  slug: string;
  category: string;
  scope: string;
  status: string;
  images: Record<string, string> | null;
  facts: Record<string, unknown> | null;
}

type FighterEntry = {
  name: string;
  category: 'real' | 'dinosaur' | 'fantasy';
  isCustom: boolean;
  imageUrl?: string;
  isUserCustom?: boolean;
  status?: string;
};

// Keep FIGHTERS as a reference for backward compat
const FIGHTERS = STATIC_FIGHTERS;

type AnimalCategory = 'real' | 'dinosaur' | 'fantasy';

// Base category tab config (counts updated dynamically)
const BASE_CATEGORY_TABS: { key: AnimalCategory; label: string; icon: string; baseCount: number; locked: boolean }[] = [
  { key: 'real', label: 'Real Animals', icon: '🦁', baseCount: 30, locked: false },
  { key: 'dinosaur', label: 'Dinosaurs', icon: '🦕', baseCount: 8, locked: true },
  { key: 'fantasy', label: 'Fantasy', icon: '🐉', baseCount: 9, locked: true },
];

// Section divider — dramatic crossed slashes
const SectionDivider = () => (
  <div className="relative py-6 overflow-hidden">
    {/* Main gold line */}
    <div className="absolute left-0 right-0 top-1/2" style={{
      height: '2px',
      background: 'linear-gradient(90deg, transparent 2%, rgba(255,215,0,0.6) 20%, rgba(255,215,0,0.9) 50%, rgba(255,215,0,0.6) 80%, transparent 98%)',
      transform: 'rotate(-1deg)',
      boxShadow: '0 0 8px rgba(255,215,0,0.3)',
    }} />
    {/* Red accent line */}
    <div className="absolute left-0 right-0 top-1/2 mt-1" style={{
      height: '1px',
      background: 'linear-gradient(90deg, transparent 10%, rgba(139,0,0,0.5) 30%, rgba(196,30,58,0.7) 50%, rgba(139,0,0,0.5) 70%, transparent 90%)',
      transform: 'rotate(0.7deg)',
    }} />
    {/* Center diamond accent */}
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rotate-45" style={{
      background: '#FFD700',
      boxShadow: '0 0 10px rgba(255,215,0,0.5)',
    }} />
  </div>
);

export default function Home() {
  const router = useRouter();
  const [animalA, setAnimalA] = useState('');
  const [animalB, setAnimalB] = useState('');
  const [selectingFor, setSelectingFor] = useState<'A' | 'B'>('A');
  const [gameMode, setGameMode] = useState<'classic' | 'adventure'>('classic');
  const [showPricing, setShowPricing] = useState(false);
  const [battleType, setBattleType] = useState<'single' | 'tournament'>('single');
  const [loading, setLoading] = useState(false);
  const [showFightOverlay, setShowFightOverlay] = useState(false);
  const [animalCategory, setAnimalCategory] = useState<AnimalCategory>('real');
  
  // Tournament state
  const [tournamentFighters, setTournamentFighters] = useState<string[]>([]);
  const [showTournamentOverlay, setShowTournamentOverlay] = useState(false);
  
  // Email capture state
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [pendingGenerate, setPendingGenerate] = useState(false);
  
  // Tier & Upgrade state
  const tierData = useTier();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lockedAnimalClicked, setLockedAnimalClicked] = useState<string | undefined>();
  const [lockedFeature, setLockedFeature] = useState<string | undefined>();

  // DB-backed animals state
  const [dbAnimals, setDbAnimals] = useState<FighterEntry[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [hasGenerating, setHasGenerating] = useState(false);

  // Fetch DB-backed animals
  const fetchDbAnimals = useCallback(async () => {
    try {
      const response = await fetch('/api/animals/list');
      const data = await response.json();

      const entries: FighterEntry[] = [];
      let generating = false;

      // Add global custom animals
      if (data.global) {
        for (const animal of data.global) {
          // Skip if already in static list
          const existsInStatic = STATIC_FIGHTERS.some(
            f => f.name.toLowerCase() === animal.name.toLowerCase()
          );
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

      // Add user's custom animals
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
          if (animal.status === 'generating') {
            generating = true;
          }
        }
      }

      setDbAnimals(entries);
      setHasGenerating(generating);
    } catch (e) {
      console.error('Failed to fetch DB animals:', e);
    }
  }, [tierData.isAuthenticated]);

  // Fetch DB animals on mount and when tier changes
  useEffect(() => {
    fetchDbAnimals();
  }, [fetchDbAnimals]);

  // Poll if any animals are generating
  useEffect(() => {
    if (!hasGenerating) return;
    const interval = setInterval(() => {
      fetchDbAnimals();
    }, 5000);
    return () => clearInterval(interval);
  }, [hasGenerating, fetchDbAnimals]);
  
  // Handle upgrade checkout
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

  // Handle creating a custom animal
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

      // Success! Close modal and refresh animals
      setShowCreateModal(false);
      setCreateName('');
      setCreateLoading(false);
      await fetchDbAnimals();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Network error');
      setCreateLoading(false);
    }
  };
  
  // Handle tournament mode toggle
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
  };
  
  // Handle game mode selection with CYOA lock check
  const handleGameModeSelect = (mode: 'classic' | 'adventure') => {
    if (mode === 'adventure' && isCyoaLocked(tierData.tier)) {
      setLockedAnimalClicked(undefined);
      setLockedFeature('cyoa');
      setShowUpgradeModal(true);
      return;
    }
    setGameMode(mode);
  };
  
  // Handle tournament fighter selection
  const handleTournamentFighterSelect = (fighterName: string) => {
    const isCustom = dbAnimals.some(a => a.name === fighterName);
    if (!isCustom && isAnimalLocked(tierData.tier, fighterName)) {
      setLockedAnimalClicked(fighterName);
      setLockedFeature(undefined);
      setShowUpgradeModal(true);
      return;
    }
    
    if (tournamentFighters.includes(fighterName)) {
      setTournamentFighters(tournamentFighters.filter(f => f !== fighterName));
      setShowTournamentOverlay(false);
    } else if (tournamentFighters.length < 8) {
      const newFighters = [...tournamentFighters, fighterName];
      setTournamentFighters(newFighters);
      if (newFighters.length === 8) {
        setShowTournamentOverlay(true);
      }
    }
  };
  
  const handleStartTournament = () => {
    if (tournamentFighters.length !== 8) return;
    
    // Check email gate
    const hasEmail = typeof window !== 'undefined' && localStorage.getItem('fb_email');
    if (!tierData.isAuthenticated && !hasEmail) {
      setPendingGenerate(true);
      setShowEmailCapture(true);
      return;
    }
    
    proceedWithTournament();
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
  
  const canGenerate = animalA && animalB && animalA !== animalB;
  const canStartTournament = tournamentFighters.length === 8;

  const getImagePath = (name: string) => {
    // Check if this is a custom animal with a blob URL
    const dbAnimal = dbAnimals.find(a => a.name === name);
    if (dbAnimal?.imageUrl) return dbAnimal.imageUrl;
    return `/fighters/${name.toLowerCase().replace(/ /g, '-')}.jpg`;
  };

  const handleFighterSelect = (fighterName: string) => {
    const isCustom = dbAnimals.some(a => a.name === fighterName);
    if (!isCustom && isAnimalLocked(tierData.tier, fighterName)) {
      setLockedAnimalClicked(fighterName);
      setLockedFeature(undefined);
      setShowUpgradeModal(true);
      return;
    }
    
    // Deselect if clicking an already-selected fighter
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
      // Pass custom animal portrait URLs so VersusScreen can display them
      const dbA = dbAnimals.find(a => a.name === animalA);
      const dbB = dbAnimals.find(a => a.name === animalB);
      let readUrl = `/read?a=${encodeURIComponent(animalA)}&b=${encodeURIComponent(animalB)}&env=neutral&mode=${mode}`;
      if (dbA?.imageUrl) readUrl += `&imgA=${encodeURIComponent(dbA.imageUrl)}`;
      if (dbB?.imageUrl) readUrl += `&imgB=${encodeURIComponent(dbB.imageUrl)}`;
      router.push(readUrl);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    
    // Check if email gate needed: skip if authenticated or already captured
    const hasEmail = typeof window !== 'undefined' && localStorage.getItem('fb_email');
    if (!tierData.isAuthenticated && !hasEmail) {
      setPendingGenerate(true);
      setShowEmailCapture(true);
      return;
    }
    
    proceedWithGenerate();
  };

  // Merge static fighters with DB animals
  const allFighters: FighterEntry[] = [
    ...STATIC_FIGHTERS,
    ...dbAnimals,
  ];

  const selectedA = allFighters.find(f => f.name === animalA);
  const selectedB = allFighters.find(f => f.name === animalB);

  // Dynamic category tabs with updated counts
  const CATEGORY_TABS = BASE_CATEGORY_TABS.map(tab => ({
    ...tab,
    count: allFighters.filter(f => f.category === tab.key).length,
  }));

  // Filter fighters by selected category
  const filteredFighters = allFighters.filter(f => f.category === animalCategory);
  
  // Count locked animals for messaging
  const lockedRealCount = FIGHTERS.filter(f => f.category === 'real' && isAnimalLocked(tierData.tier, f.name)).length;
  const lockedTotalCount = FIGHTERS.filter(f => isAnimalLocked(tierData.tier, f.name)).length;

  // Scroll to pricing
  const scrollToPricing = () => {
    setShowPricing(true);
  };

  return (
    <main className="min-h-screen font-comic relative" style={{ background: 'linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)' }}>
      {/* Vignette overlay */}
      <div className="fixed inset-0 pointer-events-none z-[1]" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
      }} />
      
      {/* Header with Account Menu */}
      <header className="px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <nav className="flex gap-6 items-center">
            <a href="/learn" className="text-[#FFD700] hover:text-yellow-300 font-bold text-sm transition-colors">
              📚 LEARNING CENTER
            </a>
            <a href="/blog" className="text-[#FFD700] hover:text-yellow-300 font-bold text-sm transition-colors">
              📖 BATTLE GUIDES
            </a>
          </nav>
          <AccountMenu 
            isAuthenticated={tierData.isAuthenticated}
            email={tierData.email}
            tier={tierData.tier}
            onUpgrade={() => { setLockedFeature(undefined); setLockedAnimalClicked(undefined); setShowUpgradeModal(true); }}
          />
        </div>
      </header>

      {/* 1. HERO — Lead with benefit */}
      <section className="pt-4 pb-4 px-4 relative overflow-hidden">
        {/* Arena spotlight glow — dual lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.2) 0%, rgba(255,215,0,0.08) 35%, transparent 65%)',
        }} />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(196,30,58,0.1) 0%, transparent 60%)',
        }} />
        <div className="absolute top-20 right-1/4 w-[300px] h-[300px] pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(30,79,196,0.1) 0%, transparent 60%)',
        }} />
        {/* Animated speed lines */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="speed-line" style={{
            top: `${15 + i * 14}%`,
            left: 0,
            right: 0,
            width: `${30 + Math.random() * 40}%`,
            marginLeft: i % 2 === 0 ? 'auto' : '0',
            marginRight: i % 2 === 0 ? '0' : 'auto',
            animation: `${i % 2 === 0 ? 'speed-line-left' : 'speed-line-right'} ${3 + i * 0.7}s ${i * 0.5}s ease-in-out infinite`,
          }} />
        ))}
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Headline */}
          <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            <h1 className="font-bangers text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-3 px-4" style={{ textShadow: '3px 3px 0 #000, 0 0 20px rgba(255,215,0,0.3)', lineHeight: '1.2' }}>
              Turn Animal Debates Into<br />
              <span className="text-[#FFD700]">Reading and Critical Thinking</span>
            </h1>
          </motion.div>
          
          {/* Subheadline */}
          <motion.p 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto mb-5 px-4" 
            style={{ textShadow: '1px 1px 2px #000' }}
          >
            Custom wildlife learning books in seconds — fully interactive and endless.
          </motion.p>

          {/* Primary + Secondary CTAs */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4"
          >
            <a
              href="#create"
              className="px-10 py-5 rounded-xl font-bangers text-2xl sm:text-3xl bg-gradient-to-b from-yellow-400 to-orange-500 text-red-900 border-4 border-yellow-600 shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-105 hover:shadow-[0_0_40px_rgba(255,215,0,0.7)] transition-all w-full sm:w-auto"
            >
              Create a Free Book
            </a>
{/* Secondary CTA removed — example books visible directly below */}
          </motion.div>

          {/* 3 Benefit Pillars */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 max-w-4xl mx-auto mb-2"
          >
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
              <span className="text-white/90 text-sm sm:text-base font-medium">Builds vocabulary with fun similes</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
              <span className="text-white/90 text-sm sm:text-base font-medium">Real wildlife traits and comparisons</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
              <span className="text-white/90 text-sm sm:text-base font-medium">Reasoning through structured scoring</span>
            </div>
          </motion.div>

          {/* Age callout integrated into bullet line */}
        </div>
      </section>

      {/* DEMO SECTION - How it works */}
      <section className="py-3 px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="font-bangers text-xl sm:text-2xl text-center text-white mb-4" style={{ textShadow: '2px 2px 0 #000' }}>
            How It Works
          </h3>
          <div className="flex items-center justify-center gap-0">
            {[
              { num: '1', label: 'Pick Animals' },
              { num: '2', label: 'Compare Traits' },
              { num: '3', label: 'Read Story' },
              { num: '4', label: 'Discover Winner' },
            ].map((step, i) => (
              <div key={i} className="flex items-center">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-red-900 font-bold text-sm shrink-0">{step.num}</span>
                  <span className="text-white/90 text-sm font-medium whitespace-nowrap">{step.label}</span>
                </div>
                {i < 3 && <span className="text-white/30 mx-4">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. FREE EXAMPLE BOOKS SECTION */}
      <div id="sample-books" className="py-3 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-3">
            <h2 className="font-bangers text-2xl sm:text-3xl text-[#FFD700]" style={{ textShadow: '3px 3px 0 #000' }}>
              Example Books — Tap to Read
            </h2>
          </div>

          <SampleBookGallery />

          <div className="text-center mt-8">
            <p className="text-white/80 text-lg sm:text-xl mb-2">
              Or create unlimited custom matchups with membership
            </p>
            <button
              onClick={scrollToPricing}
              className="inline-block px-6 py-3 rounded-lg font-bangers text-lg bg-gradient-to-b from-purple-500 to-purple-700 text-white border-2 border-purple-400 hover:scale-105 transition-all"
            >
              See Membership Options →
            </button>
          </div>
        </div>
      </div>

      {/* Social Proof Bar */}
      <section className="py-3 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 text-white/50 text-sm">
          <span><strong className="text-white/70">2,500+</strong> wildlife learning books created</span>
          <span>•</span>
          <span>Educational</span>
          <span>•</span>
          <span>AI-Illustrated</span>
          <span>•</span>
          <span>Trusted by <strong className="text-white/70">500+</strong> families</span>
        </div>
      </section>

      {/* Divider: Free books → Pricing */}
      <SectionDivider />

      {/* PRICING MODAL */}
      {showPricing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowPricing(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0d1f0d] border-2 border-[#FFD700]/30 p-6 sm:p-8" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowPricing(false)} className="absolute top-3 right-4 text-white/60 hover:text-white text-2xl font-bold z-10">✕</button>
            <h2 className="font-bangers text-3xl sm:text-4xl text-[#FFD700] text-center mb-2" style={{ textShadow: '3px 3px 0 #000' }}>
              UNLOCK MORE ANIMALS
            </h2>
            <p className="text-white/60 text-center text-sm mb-6">The free version is great — but there&apos;s so much more to explore</p>

            {/* Member */}
            <div className="relative bg-[#1a1a2e] rounded-xl p-6 border-3 border-[#FFD700] mb-4 overflow-hidden" style={{ boxShadow: '0 0 30px rgba(255,215,0,0.2)' }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,215,0,0.08) 45%, rgba(255,215,0,0.15) 50%, rgba(255,215,0,0.08) 55%, transparent 60%)', backgroundSize: '200% 100%', animation: 'shimmer 3s infinite' }} />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bangers text-2xl text-[#FFD700]">MEMBER</h3>
                    <span className="font-bangers text-2xl text-white">$4.99</span>
                    <span className="text-white/50 text-sm">one-time, keep forever</span>
                  </div>
                  <p className="text-white/60 text-sm mb-2">Unlock the full animal kingdom — 30 real animals, 435+ matchups, tournaments, and printable PDFs</p>
                </div>
                <button onClick={() => handleUpgrade('member')} className="shrink-0 px-6 py-3 rounded-lg font-bangers text-lg bg-gradient-to-b from-yellow-400 to-orange-500 text-red-900 border-2 border-yellow-600 hover:scale-105 transition-all shadow-lg whitespace-nowrap">
                  Unlock All Animals
                </button>
              </div>
            </div>

            {/* Ultimate */}
            <div className="bg-[#1a1a2e] rounded-xl p-6 border-2 border-purple-500/40">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bangers text-2xl text-purple-400">ULTIMATE</h3>
                    <span className="font-bangers text-2xl text-white">$4.99<span className="text-base text-white/50">/mo</span></span>
                  </div>
                  <p className="text-white/60 text-sm mb-2">Everything in Member plus dinosaurs, fantasy creatures, Choose Your Own Adventure mode, and new animals every month</p>
                  <p className="text-white/40 text-xs">Includes Member access — cancel anytime</p>
                </div>
                <button onClick={() => handleUpgrade('ultimate')} className="shrink-0 px-6 py-3 rounded-lg font-bangers text-lg bg-gradient-to-b from-purple-500 to-purple-700 text-white border-2 border-purple-400 hover:scale-105 transition-all whitespace-nowrap">
                  Go Ultimate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE YOUR WILDLIFE BOOK — Mode Selector + Fighter Grid */}
      <div id="create">
        {/* Section header */}
        <section className="pt-6 pb-2 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-bangers text-4xl sm:text-5xl text-[#FFD700]" style={{ textShadow: '3px 3px 0 #000' }}>
              CREATE YOUR WILDLIFE BOOK
            </h2>
            <p className="text-white/70 text-lg mt-2">
              Pick two animals and discover who would win!
            </p>
          </div>
        </section>

        {/* Mode Selector — Compact */}
        <section className="px-4 pt-2 pb-3">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#1a1a2e] rounded-xl p-4 border-4 border-[#FFD700] shadow-2xl">
              <h3 className="font-bangers text-xl text-[#FFD700] text-center mb-2" style={{ textShadow: '2px 2px 0 #000' }}>
                CHOOSE YOUR MODE
              </h3>
              
              <div className="grid md:grid-cols-2 gap-3">
                <button
                  onClick={() => handleGameModeSelect('classic')}
                  className={`relative overflow-hidden rounded-lg p-4 border-3 transition-all ${
                    gameMode === 'classic' 
                      ? 'border-yellow-400 ring-3 ring-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.5)]' 
                      : 'border-green-600 hover:border-green-400'
                  }`}
                  style={{ background: 'linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">📖</div>
                    <div className="text-left">
                      <h4 className="font-bangers text-xl text-white">CLASSIC</h4>
                      <p className="text-white/70 text-xs">Watch the story unfold</p>
                    </div>
                  </div>
                  {gameMode === 'classic' && (
                    <div className="absolute top-2 right-2 bg-yellow-400 w-6 h-6 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-sm">✓</span>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => handleGameModeSelect('adventure')}
                  className={`relative overflow-hidden rounded-lg p-4 border-3 transition-all ${
                    gameMode === 'adventure' 
                      ? 'border-yellow-400 ring-3 ring-yellow-400/50 shadow-[0_0_20px_rgba(255,215,0,0.5)]' 
                      : 'border-purple-600 hover:border-purple-400'
                  }`}
                  style={{ background: 'linear-gradient(135deg, #4a1a47 0%, #5a2d5a 100%)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">🎭</div>
                    <div className="text-left">
                      <h4 className="font-bangers text-xl text-white">ADVENTURE</h4>
                      <p className="text-white/70 text-xs">YOU decide what happens!</p>
                    </div>
                    {isCyoaLocked(tierData.tier) && (
                      <span className="text-xs bg-[#FFD700] text-black px-2 py-0.5 rounded-full font-bold ml-auto">👑 ULTIMATE</span>
                    )}
                  </div>
                  {gameMode === 'adventure' && (
                    <div className="absolute top-2 right-2 bg-yellow-400 w-6 h-6 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-sm">✓</span>
                    </div>
                  )}
                </button>
              </div>
              
              {/* Tournament toggle — inline */}
              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  onClick={handleTournamentToggle}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    battleType === 'tournament'
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  🏆 Tournament Mode
                  {isTournamentLocked(tierData.tier) && (
                    <span className="text-[10px] bg-[#FFD700] text-black px-1.5 py-0.5 rounded-full">🔒 MEMBER</span>
                  )}
                  {battleType === 'tournament' && <span>✓</span>}
                </button>
                <span className="text-white/50 text-xs">
                  {battleType === 'tournament'
                    ? '🏆 Pick 8 champions for a bracket!'
                    : gameMode === 'classic' 
                    ? '📖 Full story with facts & illustrations' 
                    : '🎭 Your choices shape the story!'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Tournament Fighter Selection */}
        {battleType === 'tournament' && (
          <section className="px-4 pb-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-4">
                <h2 className="font-bangers text-3xl sm:text-4xl text-[#FFD700]" style={{ textShadow: '3px 3px 0 #000' }}>
                  SELECT 8 CHAMPIONS
                </h2>
                <p className="text-white/70 mt-2">
                  {gameMode === 'classic' ? '📖 Classic' : '🎭 Adventure'} mode • {tournamentFighters.length}/8 selected
                </p>
                <div className="mt-2">
                  <TierInfoPopover isAuthenticated={tierData.isAuthenticated} currentTier={tierData.tier} />
                </div>
              </div>

              {/* 8 Fighter Slots */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                {[...Array(8)].map((_, index) => {
                  const fighter = tournamentFighters[index];
                  const matchLabels = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B'];
                  return (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                        fighter 
                          ? 'border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.4)]' 
                          : 'border-white/30 border-dashed'
                      }`}
                      style={{ 
                        background: fighter 
                          ? 'linear-gradient(135deg, #1a1a2e 0%, #2d2d4e 100%)' 
                          : 'rgba(0,0,0,0.3)' 
                      }}
                    >
                      <div className="absolute top-0.5 left-0.5 bg-black/70 px-1 py-0.5 rounded text-[10px] font-bold text-[#FFD700] z-10">
                        {matchLabels[index]}
                      </div>
                      {fighter ? (
                        <button
                          onClick={() => handleTournamentFighterSelect(fighter)}
                          className="absolute inset-0 w-full h-full cursor-pointer hover:ring-2 hover:ring-red-500 transition-all"
                        >
                          <img src={getImagePath(fighter)} alt={fighter} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-1">
                            <p className="font-bangers text-white text-[10px] text-center truncate" style={{ textShadow: '1px 1px 0 #000' }}>
                              {fighter.toUpperCase()}
                            </p>
                          </div>
                        </button>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-white/40 text-xl">?</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 mb-3 justify-center flex-wrap">
                {CATEGORY_TABS.map((tab) => (
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
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      animalCategory === tab.key
                        ? 'bg-[#FFD700] text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]'
                        : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white/80'
                    }`}
                  >
                    {tab.icon} {tab.label} <span className="text-xs opacity-70">({tab.count})</span> {tab.locked && (tierData.tier === 'unregistered' || (tab.key === 'fantasy' && tierData.tier === 'member')) ? <span className="ml-1 text-yellow-400">🔒</span> : ''}
                  </button>
                ))}
              </div>

              {/* Character Grid */}
              <div className="bg-[#1a1a2e] rounded-xl p-4 border-4 border-[#FFD700]">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {filteredFighters.map((fighter, i) => {
                    const isSelected = tournamentFighters.includes(fighter.name);
                    const locked = isAnimalLocked(tierData.tier, fighter.name);
                    return (
                      <button
                        key={i}
                        onClick={() => handleTournamentFighterSelect(fighter.name)}
                        disabled={!isSelected && tournamentFighters.length >= 8 && !locked}
                        className={`relative aspect-square rounded-lg overflow-hidden border-3 transition-all ${
                          isSelected
                            ? 'border-[#FFD700] ring-2 ring-[#FFD700] opacity-50 grayscale'
                            : locked
                            ? 'border-gray-600 opacity-70 hover:border-yellow-500 hover:opacity-100 cursor-pointer'
                            : tournamentFighters.length >= 8
                            ? 'border-gray-600 opacity-30 cursor-not-allowed'
                            : 'border-gray-600 hover:border-white hover:scale-110 hover:z-10'
                        }`}
                      >
                        <img src={getImagePath(fighter.name)} alt={fighter.name} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 py-1 px-1">
                          <p className="font-bangers text-white text-xs text-center truncate">{fighter.name.toUpperCase()}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <span className="text-[#FFD700] text-2xl font-bold">✓</span>
                          </div>
                        )}
                        {locked && !isSelected && (
                          <div className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center">
                            <span className="text-yellow-400 text-sm">🔒</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Locked animals banner */}
                {lockedTotalCount > 0 && (
                  <button
                    onClick={scrollToPricing}
                    className="mt-4 w-full relative overflow-hidden rounded-lg py-3 px-4 transition-all hover:scale-[1.01] group"
                    style={{ background: 'linear-gradient(90deg, #1a1a2e, #2d1f4e, #1a1a2e)' }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.1), transparent)', animation: 'shimmer 2s infinite' }} />
                    <p className="font-bangers text-[#FFD700] text-lg sm:text-xl relative z-10" style={{ textShadow: '1px 1px 2px #000' }}>
                      🔒 {lockedTotalCount} More Animals with Member Access →
                    </p>
                    <p className="text-white/60 text-xs sm:text-sm relative z-10 mt-0.5">
                      Including 🦕 Dinosaurs and 🐉 Fantasy creatures!
                    </p>
                  </button>
                )}
              </div>

              {canStartTournament && !showTournamentOverlay && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowTournamentOverlay(true)}
                    className="px-10 py-4 rounded-xl font-bangers text-3xl bg-gradient-to-b from-yellow-400 to-orange-500 text-red-900 border-4 border-yellow-600 shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-105 hover:shadow-[0_0_40px_rgba(255,215,0,0.7)] transition-all duration-300"
                  >
                    READY FOR BATTLE!
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Single Battle Fighter Selection */}
        {battleType === 'single' && (
        <section className="px-4 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-4">
              <h2 className="font-bangers text-3xl sm:text-4xl text-[#FFD700]" style={{ textShadow: '3px 3px 0 #000' }}>
                PLAYER SELECT
              </h2>
              <div className="mt-2">
                <TierInfoPopover isAuthenticated={tierData.isAuthenticated} currentTier={tierData.tier} />
              </div>
            </div>

            {/* Red vs Blue corners */}
            <div className="flex flex-col md:grid md:gap-4 gap-2 mb-6" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
              <button
                onClick={() => setSelectingFor('A')}
                className={`relative overflow-hidden rounded-xl border-4 transition-all ${
                  selectingFor === 'A' ? 'border-yellow-400 shadow-2xl ring-4 ring-yellow-400/50' : 'border-red-600'
                }`}
                style={{ background: 'linear-gradient(135deg, #8B0000 0%, #CC0000 100%)', minHeight: '250px' }}
              >
                <div className="absolute top-2 left-2 bg-black/60 px-3 py-1 rounded-full z-10">
                  <span className="font-bangers text-white text-sm">RED CORNER</span>
                </div>
                {selectedA ? (
                  <>
                    <img src={getImagePath(selectedA.name)} alt={selectedA.name} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="font-bangers text-3xl text-white" style={{ textShadow: '3px 3px 0 #000' }}>
                        {selectedA.name.toUpperCase()}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(/fighters/lion.jpg), url(/fighters/tiger.jpg), url(/fighters/gorilla.jpg), url(/fighters/crocodile.jpg)', backgroundSize: '50% 50%', backgroundPosition: '0 0, 100% 0, 0 100%, 100% 100%', filter: 'grayscale(1) blur(2px)' }} />
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                      className="text-5xl mb-2"
                      style={{ filter: 'drop-shadow(0 0 12px rgba(255,50,50,0.6))' }}
                    >
                      ❓
                    </motion.div>
                    <span className="font-bangers text-lg text-white/70 relative z-10">TAP TO SELECT</span>
                  </div>
                )}
                {selectingFor === 'A' && (
                  <div className="absolute bottom-0 left-0 right-0 bg-yellow-400 py-1 text-center z-10">
                    <span className="font-bangers text-black">◀ SELECTING</span>
                  </div>
                )}
              </button>

              <div className="flex items-center justify-center px-1 sm:px-2">
                <div className="relative">
                  {/* Impact burst lines */}
                  <div className="vs-impact-lines" />
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="relative z-10 bg-[#FFD700] w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-4 border-[#8B0000]"
                    style={{ boxShadow: '0 0 25px rgba(255,215,0,0.6), 0 0 50px rgba(255,215,0,0.25), 0 0 80px rgba(255,215,0,0.1)' }}
                  >
                    <span className="font-bangers text-xl sm:text-2xl md:text-3xl text-[#8B0000]">VS</span>
                  </motion.div>
                </div>
              </div>

              <button
                onClick={() => setSelectingFor('B')}
                className={`relative overflow-hidden rounded-xl border-4 transition-all ${
                  selectingFor === 'B' ? 'border-yellow-400 shadow-2xl ring-4 ring-yellow-400/50' : 'border-blue-600'
                }`}
                style={{ background: 'linear-gradient(135deg, #0047AB 0%, #0066CC 100%)', minHeight: '250px' }}
              >
                <div className="absolute top-2 right-2 bg-black/60 px-3 py-1 rounded-full z-10">
                  <span className="font-bangers text-white text-sm">BLUE CORNER</span>
                </div>
                {selectedB ? (
                  <>
                    <img src={getImagePath(selectedB.name)} alt={selectedB.name} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="font-bangers text-3xl text-white" style={{ textShadow: '3px 3px 0 #000' }}>
                        {selectedB.name.toUpperCase()}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(/fighters/eagle.jpg), url(/fighters/wolf.jpg), url(/fighters/orca.jpg), url(/fighters/elephant.jpg)', backgroundSize: '50% 50%', backgroundPosition: '0 0, 100% 0, 0 100%, 100% 100%', filter: 'grayscale(1) blur(2px)' }} />
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.5 }}
                      className="text-5xl mb-2"
                      style={{ filter: 'drop-shadow(0 0 12px rgba(50,100,255,0.6))' }}
                    >
                      ❓
                    </motion.div>
                    <span className="font-bangers text-lg text-white/70 relative z-10">TAP TO SELECT</span>
                  </div>
                )}
                {selectingFor === 'B' && (
                  <div className="absolute bottom-0 left-0 right-0 bg-yellow-400 py-1 text-center z-10">
                    <span className="font-bangers text-black">SELECTING ▶</span>
                  </div>
                )}
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-3 justify-center flex-wrap">
              {CATEGORY_TABS.map((tab) => (
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
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    animalCategory === tab.key
                      ? 'bg-[#FFD700] text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]'
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white/80'
                  }`}
                >
                  {tab.icon} {tab.label} <span className="text-xs opacity-70">({tab.count})</span> {tab.locked && (tierData.tier === 'unregistered' || (tab.key === 'fantasy' && tierData.tier === 'member')) ? <span className="ml-1 text-yellow-400">🔒</span> : ''}
                </button>
              ))}
            </div>

            {/* Character Grid */}
            <div className="bg-[#1a1a2e] rounded-xl p-4 border-4 border-[#FFD700]">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {filteredFighters.map((fighter, i) => {
                  const locked = !fighter.isCustom && isAnimalLocked(tierData.tier, fighter.name);
                  const isSelected = animalA === fighter.name || animalB === fighter.name;
                  const isGenerating = fighter.status === 'generating';
                  const isFailed = fighter.status === 'failed';
                  return (
                    <motion.button
                      key={`${fighter.name}-${fighter.isUserCustom ? 'custom' : 'static'}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.5) }}
                      onClick={() => !isGenerating && !isFailed && handleFighterSelect(fighter.name)}
                      disabled={isGenerating || isFailed}
                      className={`relative aspect-square rounded-lg overflow-hidden border-3 transition-all hover:scale-110 hover:z-10 ${
                        isGenerating
                          ? 'border-purple-500 opacity-70 cursor-wait'
                          : isFailed
                          ? 'border-red-500 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'border-yellow-400 ring-2 ring-yellow-400'
                          : locked
                          ? 'border-gray-600 opacity-70 hover:border-yellow-500 hover:opacity-100'
                          : fighter.isUserCustom
                          ? 'border-purple-500 hover:border-purple-300'
                          : 'border-gray-600 hover:border-white'
                      }`}
                    >
                      {isGenerating ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-purple-700 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl animate-spin mb-1">✨</div>
                            <p className="text-purple-300 text-[10px] font-bold">CREATING...</p>
                          </div>
                        </div>
                      ) : (
                        <img src={getImagePath(fighter.name)} alt={fighter.name} className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 py-1 px-1">
                        <p className="font-bangers text-white text-xs text-center truncate">{fighter.name.toUpperCase()}</p>
                      </div>
                      {fighter.isUserCustom && !isGenerating && (
                        <div className="absolute top-1 left-1 bg-purple-600/80 px-1 py-0.5 rounded text-[9px] text-white font-bold">
                          ✨
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-black font-bold text-sm">✓</span>
                        </div>
                      )}
                      {locked && !isSelected && (
                        <div className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center">
                          <span className="text-yellow-400 text-sm">🔒</span>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
                
                {/* "Your Imagination" placeholder slots - fantasy only, fill remaining grid row */}
                {animalCategory === 'fantasy' && (() => {
                  const GRID_COLS = 8; // md:grid-cols-8
                  const animalCount = filteredFighters.length;
                  const remainder = animalCount % GRID_COLS;
                  const placeholderCount = remainder === 0 ? GRID_COLS : (GRID_COLS - remainder);
                  return Array.from({ length: placeholderCount }).map((_, i) => (
                    <button
                      key={`imagination-${i}`}
                      onClick={() => {
                        if (tierData.tier !== 'ultimate') {
                          setLockedAnimalClicked(undefined);
                          setLockedFeature('create-own');
                          setShowUpgradeModal(true);
                          return;
                        }
                        setShowCreateModal(true);
                      }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-3 border-dashed transition-all hover:scale-110 hover:z-10 ${
                        tierData.tier === 'ultimate'
                          ? 'border-purple-400 hover:border-purple-300 bg-gradient-to-br from-purple-900/80 to-purple-700/80 cursor-pointer'
                          : 'border-gray-500/50 bg-gradient-to-br from-gray-700/50 to-gray-800/50 opacity-60 cursor-pointer hover:border-yellow-500 hover:opacity-90'
                      }`}
                      title={tierData.tier === 'ultimate' ? 'Create your own creature!' : 'Ultimate tier required'}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                        <div className="text-2xl mb-0.5">✨</div>
                        <p className="font-bangers text-white/80 text-[9px] text-center leading-tight">YOUR IMAGINATION</p>
                        {tierData.tier === 'ultimate' ? (
                          <p className="text-purple-300 text-[8px] font-bold mt-0.5">TAP TO CREATE</p>
                        ) : (
                          <p className="text-yellow-400/70 text-[8px] font-bold mt-0.5">👑 ULTIMATE</p>
                        )}
                      </div>
                    </button>
                  ));
                })()}
              </div>

              {/* Locked animals banner */}
              {lockedTotalCount > 0 && (
                <button
                  onClick={scrollToPricing}
                  className="mt-4 w-full relative overflow-hidden rounded-lg py-3 px-4 transition-all hover:scale-[1.01] group"
                  style={{ background: 'linear-gradient(90deg, #1a1a2e, #2d1f4e, #1a1a2e)' }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.1), transparent)', animation: 'shimmer 2s infinite' }} />
                  <p className="font-bangers text-[#FFD700] text-lg sm:text-xl relative z-10" style={{ textShadow: '1px 1px 2px #000' }}>
                    🔒 {lockedTotalCount} More Animals with Member Access →
                  </p>
                  <p className="text-white/60 text-xs sm:text-sm relative z-10 mt-0.5">
                    Including 🦕 Dinosaurs and 🐉 Fantasy creatures!
                  </p>
                </button>
              )}
            </div>

            {canGenerate && !showFightOverlay && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowFightOverlay(true)}
                  className="px-10 py-4 rounded-xl font-bangers text-3xl bg-gradient-to-b from-yellow-400 to-orange-500 text-red-900 border-4 border-yellow-600 shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-105 hover:shadow-[0_0_40px_rgba(255,215,0,0.7)] transition-all duration-300"
                >
                  READY TO FIGHT!
                </button>
              </div>
            )}
          </div>
        </section>
        )}
      </div>

      {/* FIGHT! Overlay */}
      {battleType === 'single' && canGenerate && showFightOverlay && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => { if (!loading) { setShowFightOverlay(false); setAnimalA(''); setAnimalB(''); setSelectingFor('A'); } }}
        >
          <div className="text-center transition-transform duration-300">
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-4 border-red-500 overflow-hidden bg-gray-800 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                  <img src={`/fighters/${animalA?.toLowerCase().replace(/ /g, '-')}.jpg`} alt={animalA || ''} className="w-full h-full object-cover" />
                </div>
                <p className="font-bangers text-red-400 text-xl mt-2">{animalA}</p>
              </div>
              <div className="font-bangers text-6xl text-yellow-400" style={{ textShadow: '0 0 20px rgba(255,215,0,0.8)' }}>VS</div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-4 border-blue-500 overflow-hidden bg-gray-800 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                  <img src={`/fighters/${animalB?.toLowerCase().replace(/ /g, '-')}.jpg`} alt={animalB || ''} className="w-full h-full object-cover" />
                </div>
                <p className="font-bangers text-blue-400 text-xl mt-2">{animalB}</p>
              </div>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); handleGenerate(); }} 
              disabled={loading}
              className="px-16 py-6 rounded-2xl font-bangers text-5xl bg-gradient-to-b from-yellow-400 to-orange-500 text-red-900 border-4 border-yellow-600 shadow-[0_0_40px_rgba(255,215,0,0.6)] hover:scale-110 hover:shadow-[0_0_60px_rgba(255,215,0,0.8)] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? '⏳ CREATING...' : '⚔️ FIGHT!'}
            </button>
            
            <p className="mt-6 text-white/80 text-lg">
              {gameMode === 'classic' 
                ? 'Click to create your wildlife book!' 
                : '✨ Interactive adventure mode'}
            </p>
            {!loading && (
              <p className="mt-4 text-white/50 text-sm">Click FIGHT to proceed or anywhere else to re-select</p>
            )}
          </div>
        </div>
      )}

      {/* TOURNAMENT Overlay */}
      {battleType === 'tournament' && canStartTournament && showTournamentOverlay && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => { if (!loading) { setShowTournamentOverlay(false); } }}
        >
          <div className="text-center max-w-4xl mx-auto px-4" onClick={(e) => e.stopPropagation()}>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-8xl mb-6"
            >
              🏆
            </motion.div>
            
            <h2 className="font-bangers text-5xl text-[#FFD700] mb-6" style={{ textShadow: '3px 3px 0 #000' }}>
              TOURNAMENT READY!
            </h2>
            
            <div className="bg-black/50 rounded-xl p-6 mb-6 border-2 border-[#FFD700]/30">
              <p className="text-white/60 text-sm mb-4">FIRST ROUND MATCHUPS</p>
              <div className="grid grid-cols-2 gap-4">
                {[0, 2, 4, 6].map((i) => (
                  <div key={i} className="flex items-center justify-center gap-3 bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <img src={getImagePath(tournamentFighters[i])} alt={tournamentFighters[i]} className="w-10 h-10 rounded-full object-cover border-2 border-red-500" />
                      <span className="text-white text-sm font-bold truncate max-w-[80px]">{tournamentFighters[i]}</span>
                    </div>
                    <span className="text-[#FFD700] font-bangers">VS</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-bold truncate max-w-[80px]">{tournamentFighters[i + 1]}</span>
                      <img src={getImagePath(tournamentFighters[i + 1])} alt={tournamentFighters[i + 1]} className="w-10 h-10 rounded-full object-cover border-2 border-blue-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={handleStartTournament}
              disabled={loading}
              className="px-16 py-6 rounded-2xl font-bangers text-4xl bg-gradient-to-b from-yellow-400 to-orange-500 text-red-900 border-4 border-yellow-600 shadow-[0_0_40px_rgba(255,215,0,0.6)] hover:scale-110 hover:shadow-[0_0_60px_rgba(255,215,0,0.8)] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? '⏳ PREPARING...' : '🏆 START TOURNAMENT'}
            </button>
            
            <p className="mt-6 text-white/60 text-sm">
              {gameMode === 'classic' ? '📖 Classic mode' : '🎭 Adventure mode'} • 7 matchups to the championship
            </p>
            {!loading && (
              <p className="mt-4 text-white/50 text-sm">Click START to begin or outside to re-select fighters</p>
            )}
          </div>
        </div>
      )}

      {/* Divider: Creation → Blog CTA */}
      <SectionDivider />

      {/* Blog CTA */}
      <section className="py-6 px-4 bg-black/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Learning Center Card */}
            <div className="bg-gradient-to-br from-[#1e5a3d] via-[#2d5a3d] to-[#1e3d2a] rounded-xl p-8 border-4 border-[#FFD700]">
              <h2 className="font-bangers text-2xl text-[#FFD700] mb-3" style={{ letterSpacing: '2px' }}>
                📚 LEARNING CENTER
              </h2>
              <p className="text-white/90 text-base mb-5">
                Educational activities, printable books, and teaching resources for kids ages 5-12!
              </p>
              <a
                href="/learn"
                className="inline-block bg-[#FFD700] text-[#1e3d2a] font-bangers text-lg px-6 py-3 rounded-xl hover:bg-yellow-300 transition-all shadow-xl border-3 border-[#1e3d2a]"
              >
                EXPLORE RESOURCES
              </a>
            </div>
            
            {/* Battle Guides Card */}
            <div className="bg-gradient-to-r from-[#8B0000] via-[#CC0000] to-[#8B0000] rounded-xl p-8 border-4 border-[#FFD700]">
              <h2 className="font-bangers text-2xl text-[#FFD700] mb-3" style={{ letterSpacing: '2px' }}>
                📖 BATTLE GUIDES
              </h2>
              <p className="text-white/90 text-base mb-5">
                In-depth wildlife matchup guides with real facts, scientific analysis, and expert verdicts!
              </p>
              <a
                href="/blog"
                className="inline-block bg-[#FFD700] text-[#8B0000] font-bangers text-lg px-6 py-3 rounded-xl hover:bg-yellow-300 transition-all shadow-xl border-3 border-[#8B0000]"
              >
                READ GUIDES
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Official Books - Amazon Affiliate */}
      <section className="py-16 px-4 bg-gradient-to-b from-[#232f3e] to-[#131921]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-block bg-[#FF9900] px-6 py-2 rounded-full mb-4">
              <span className="text-black font-bold text-sm">📚 OFFICIAL BOOK SERIES</span>
            </div>
            <h2 className="font-bangers text-4xl sm:text-5xl text-white mb-4" style={{ textShadow: '3px 3px 0 #000' }}>
              GET THE REAL BOOKS!
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Jerry Pallotta&apos;s bestselling <strong className="text-[#FF9900]">Who Would Win?</strong> series — 26+ titles with amazing illustrations by Rob Bolster!
            </p>
          </div>
          
          <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-[#FF9900] scrollbar-track-white/10">
            <div className="flex gap-5 px-4 min-w-max">
              {WHO_WOULD_WIN_BOOKS.map((book) => (
                <a
                  key={book.asin}
                  href={book.amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 group"
                >
                  <div className="w-36 h-52 rounded-lg overflow-hidden shadow-2xl border-3 border-white/10 group-hover:border-[#FF9900] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,153,0,0.4)]">
                    <img 
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://placehold.co/200x300/232f3e/FFD700?text=${encodeURIComponent(book.title.split(' ')[0])}`;
                      }}
                    />
                  </div>
                  <p className="text-white/60 text-xs mt-2 max-w-36 text-center group-hover:text-[#FF9900] transition-colors line-clamp-2">{book.title}</p>
                </a>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-white/50 text-sm mb-4">👆 Scroll to see all books!</p>
            <a
              href="https://www.amazon.com/s?k=who+would+win+jerry+pallotta&tag=whowouldwinbo-20"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#FF9900] text-black font-bold text-xl px-10 py-4 rounded-xl hover:bg-[#FFB84D] transition-all shadow-xl hover:scale-105"
            >
              🛒 Shop Full Collection on Amazon
            </a>
          </div>
          <p className="mt-8 text-white/40 text-sm text-center">
            FightingBooks is a fan project — not affiliated with Jerry Pallotta or Scholastic. As an Amazon Associate we earn from qualifying purchases.
          </p>
        </div>
      </section>

      {/* Email Capture Modal */}
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

      {/* Upgrade Modal */}
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

      {/* Create Custom Animal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { if (!createLoading) { setShowCreateModal(false); setCreateError(''); setCreateName(''); } }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative max-w-md w-full rounded-2xl bg-[#0d1f0d] border-2 border-purple-500/50 p-6 sm:p-8" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { if (!createLoading) { setShowCreateModal(false); setCreateError(''); setCreateName(''); } }}
              className="absolute top-3 right-4 text-white/60 hover:text-white text-2xl font-bold z-10"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="text-5xl mb-3">✨</div>
              <h2 className="font-bangers text-3xl text-purple-300" style={{ textShadow: '2px 2px 0 #000' }}>
                CREATE YOUR CREATURE
              </h2>
              <p className="text-white/60 text-sm mt-2">
                Imagine any mythical creature and we&apos;ll bring it to life!
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-bold mb-2">Creature Name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => { setCreateName(e.target.value); setCreateError(''); }}
                  placeholder="e.g., Shadow Phoenix, Crystal Serpent..."
                  className="w-full px-4 py-3 bg-black/30 border-2 border-purple-500/30 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-400 text-lg"
                  disabled={createLoading}
                  maxLength={50}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && createName.trim() && !createLoading) {
                      handleCreateAnimal();
                    }
                  }}
                />
              </div>

              {createError && (
                <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                  <p className="text-red-300 text-sm">{createError}</p>
                </div>
              )}

              <button
                onClick={handleCreateAnimal}
                disabled={createLoading || !createName.trim()}
                className="w-full px-6 py-4 rounded-xl font-bangers text-xl bg-gradient-to-b from-purple-500 to-purple-700 text-white border-2 border-purple-400 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {createLoading ? '⏳ Creating your creature...' : '✨ Bring It to Life!'}
              </button>

              {createLoading && (
                <p className="text-white/50 text-xs text-center animate-pulse">
                  Generating facts and 5 unique illustrations... this takes about 30-60 seconds
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 bg-[#0d1f0d] text-center">
        <p className="text-white/50 text-sm">Made with ❤️ for animal fans • AI-powered educational content</p>
        <p className="text-white/30 text-xs mt-2">
          Content creator? <a href="mailto:scout@openclaw.ai" className="underline hover:text-white/50">Get free access</a>
        </p>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap');
        .font-bangers { font-family: 'Bangers', cursive; }
        .font-comic { font-family: 'Comic Neue', cursive; }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </main>
  );
}
