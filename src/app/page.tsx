'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { quickContentCheck, isKnownAnimal, checkRateLimit, incrementRateLimit } from '@/lib/content-moderation';
import { WHO_WOULD_WIN_BOOKS } from '@/data/who-would-win-books';
import { useTier, isAnimalLocked, isCyoaLocked } from '@/lib/useTier';
import UpgradeModal from '@/components/UpgradeModal';
import TierInfoPopover from '@/components/TierInfoPopover';
import AccountMenu from '@/components/AccountMenu';
import { UserTier } from '@/lib/tierAccess';

// All fighters with AI-generated portraits (39 total + 1 custom slot = 40 = 5x8 grid)
const FIGHTERS = [
  { name: 'Lion', category: 'real' },
  { name: 'Tiger', category: 'real' },
  { name: 'Grizzly Bear', category: 'real' },
  { name: 'Polar Bear', category: 'real' },
  { name: 'Gorilla', category: 'real' },
  { name: 'Great White Shark', category: 'real' },
  { name: 'Orca', category: 'real' },
  { name: 'Crocodile', category: 'real' },
  { name: 'Elephant', category: 'real' },
  { name: 'Hippo', category: 'real' },
  { name: 'Rhino', category: 'real' },
  { name: 'Komodo Dragon', category: 'real' },
  { name: 'King Cobra', category: 'real' },
  { name: 'Anaconda', category: 'real' },
  { name: 'Wolf', category: 'real' },
  { name: 'Jaguar', category: 'real' },
  { name: 'Leopard', category: 'real' },
  { name: 'Eagle', category: 'real' },
  { name: 'Wolverine', category: 'real' },
  { name: 'Honey Badger', category: 'real' },
  { name: 'Moose', category: 'real' },
  { name: 'Cape Buffalo', category: 'real' },
  { name: 'Cassowary', category: 'real' },
  { name: 'Python', category: 'real' },
  { name: 'Alligator', category: 'real' },
  { name: 'Black Panther', category: 'real' },
  { name: 'Cheetah', category: 'real' },
  { name: 'Hyena', category: 'real' },
  { name: 'Walrus', category: 'real' },
  { name: 'Octopus', category: 'real' },
  // Dinosaurs
  { name: 'Tyrannosaurus Rex', category: 'dinosaur' },
  { name: 'Velociraptor', category: 'dinosaur' },
  { name: 'Triceratops', category: 'dinosaur' },
  { name: 'Spinosaurus', category: 'dinosaur' },
  { name: 'Stegosaurus', category: 'dinosaur' },
  { name: 'Ankylosaurus', category: 'dinosaur' },
  { name: 'Pteranodon', category: 'dinosaur' },
  { name: 'Brachiosaurus', category: 'dinosaur' },
  // Fantasy
  { name: 'Dragon', category: 'fantasy' },
  { name: 'Griffin', category: 'fantasy' },
  { name: 'Hydra', category: 'fantasy' },
  { name: 'Phoenix', category: 'fantasy' },
  { name: 'Cerberus', category: 'fantasy' },
  { name: 'Chimera', category: 'fantasy' },
  { name: 'Manticore', category: 'fantasy' },
  { name: 'Basilisk', category: 'fantasy' },
  { name: 'Kraken', category: 'fantasy' },
];

export default function Home() {
  const router = useRouter();
  const [animalA, setAnimalA] = useState('');
  const [animalB, setAnimalB] = useState('');
  const [selectingFor, setSelectingFor] = useState<'A' | 'B'>('A');
  const [gameMode, setGameMode] = useState<'classic' | 'adventure'>('classic');
  const [battleType, setBattleType] = useState<'single' | 'tournament'>('single');
  const [modeStep, setModeStep] = useState<1 | 2>(1); // Step 1: battle type, Step 2: game mode
  const [loading, setLoading] = useState(false);
  const [showFightOverlay, setShowFightOverlay] = useState(false);
  
  // Tournament state
  const [tournamentFighters, setTournamentFighters] = useState<string[]>([]);
  const [showTournamentOverlay, setShowTournamentOverlay] = useState(false);
  
  // Tier & Upgrade state
  const tierData = useTier();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lockedAnimalClicked, setLockedAnimalClicked] = useState<string | undefined>();
  
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

  const selectedA = FIGHTERS.find(f => f.name === animalA);
  const selectedB = FIGHTERS.find(f => f.name === animalB);
  
  // Handle battle type selection (step 1)
  const handleBattleTypeSelect = (type: 'single' | 'tournament') => {
    setBattleType(type);
    setModeStep(2); // Advance to step 2
    // Reset selections when switching
    if (type === 'tournament') {
      setTournamentFighters([]);
      setAnimalA('');
      setAnimalB('');
    } else {
      setTournamentFighters([]);
    }
  };
  
  // Handle going back to step 1
  const handleBackToStep1 = () => {
    setModeStep(1);
    setTournamentFighters([]);
  };
  
  // Handle tournament fighter selection
  const handleTournamentFighterSelect = (fighterName: string) => {
    // Check if animal is locked
    if (isAnimalLocked(tierData.tier, fighterName)) {
      setLockedAnimalClicked(fighterName);
      setShowUpgradeModal(true);
      return;
    }
    
    if (tournamentFighters.includes(fighterName)) {
      // Deselect - remove from array
      setTournamentFighters(tournamentFighters.filter(f => f !== fighterName));
      setShowTournamentOverlay(false);
    } else if (tournamentFighters.length < 8) {
      // Select - add to array
      const newFighters = [...tournamentFighters, fighterName];
      setTournamentFighters(newFighters);
      // Show overlay when 8th fighter selected
      if (newFighters.length === 8) {
        setShowTournamentOverlay(true);
      }
    }
  };
  
  // Start tournament - save state and navigate to bracket
  const handleStartTournament = () => {
    if (tournamentFighters.length !== 8) return;
    setLoading(true);
    
    // Create bracket structure
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
    
    // Save to localStorage
    localStorage.setItem('tournament', JSON.stringify(bracket));
    
    // Navigate to bracket view
    router.push('/tournament/bracket');
  };
  
  const canGenerate = animalA && animalB && animalA !== animalB;
  const canStartTournament = tournamentFighters.length === 8;

  const getImagePath = (name: string) => `/fighters/${name.toLowerCase().replace(/ /g, '-')}.jpg`;

  const handleFighterSelect = (fighterName: string) => {
    // Check if animal is locked
    if (isAnimalLocked(tierData.tier, fighterName)) {
      setLockedAnimalClicked(fighterName);
      setShowUpgradeModal(true);
      return;
    }
    
    if (selectingFor === 'A') {
      setAnimalA(fighterName);
      if (!animalB) {
        setSelectingFor('B');
      } else if (fighterName !== animalB) {
        // Both selected, show overlay
        setShowFightOverlay(true);
      }
    } else {
      setAnimalB(fighterName);
      if (!animalA) {
        setSelectingFor('A');
      } else if (fighterName !== animalA) {
        // Both selected, show overlay
        setShowFightOverlay(true);
      }
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    
    if (battleType === 'tournament') {
      const mode = gameMode === 'adventure' ? 'cyoa' : 'standard';
      router.push(`/tournament?seed1=${encodeURIComponent(animalA)}&seed2=${encodeURIComponent(animalB)}&mode=${mode}`);
    } else {
      const mode = gameMode === 'adventure' ? 'cyoa' : 'standard';
      router.push(`/read?a=${encodeURIComponent(animalA)}&b=${encodeURIComponent(animalB)}&env=neutral&mode=${mode}`);
    }
  };

  return (
    <main className="min-h-screen font-comic" style={{ background: 'linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)' }}>
      
      {/* Header with Account Menu */}
      <header className="px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo/Home link */}
          <a href="/" className="font-bangers text-[#FFD700] text-xl hover:text-yellow-300 transition-colors" style={{ textShadow: '2px 2px 0 #000' }}>
            WHO WOULD WIN?
          </a>
          
          {/* Account Menu */}
          <AccountMenu 
            isAuthenticated={tierData.isAuthenticated}
            email={tierData.email}
            tier={tierData.tier}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/80 text-lg mb-4">
            Inspired by Jerry Pallotta's bestselling series
          </p>
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="inline-block bg-[#FFD700] px-4 sm:px-10 py-3 sm:py-4 rounded-lg shadow-2xl border-4 border-[#8B0000]">
              <h1 className="font-bangers text-2xl sm:text-4xl md:text-5xl text-[#CC0000]" style={{ textShadow: '2px 2px 0 #000', letterSpacing: '2px' }}>
                WHO WOULD WIN?
              </h1>
            </div>
          </motion.div>
          <p className="text-xl font-bold text-[#FFD700] mt-4 mb-2" style={{ textShadow: '2px 2px 4px #000' }}>
            Create your own match ups with {FIGHTERS.length} animals to choose from
          </p>
        </div>
      </section>

      {/* Fighter Carousel */}
      <section className="py-6 px-4">
        <div className="max-w-7xl mx-auto overflow-hidden">
          <motion.div 
            className="flex gap-3"
            animate={{ x: [0, -2000] }}
            transition={{ 
              x: { repeat: Infinity, duration: 30, ease: "linear" }
            }}
          >
            {[...FIGHTERS, ...FIGHTERS].map((fighter, i) => (
              <div 
                key={`${fighter.name}-${i}`}
                className="flex-shrink-0 w-20 h-20 rounded-full overflow-hidden border-3 border-[#FFD700]/50 shadow-lg"
              >
                <img 
                  src={getImagePath(fighter.name)} 
                  alt={fighter.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 3. Two-Step Mode Selector */}
      <section className="px-4 pt-2 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1a1a2e] rounded-xl p-6 border-4 border-[#FFD700] shadow-2xl">
            
            {/* Step 1: Battle Type (Single vs Tournament) */}
            {modeStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="font-bangers text-2xl text-[#FFD700] text-center mb-4" style={{ textShadow: '2px 2px 0 #000' }}>
                  Choose your style
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Single Battle */}
                  <button
                    onClick={() => handleBattleTypeSelect('single')}
                    className="relative overflow-hidden rounded-lg p-6 border-4 transition-all border-red-600 hover:border-red-400 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]"
                    style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)' }}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-3">⚔️</div>
                      <h3 className="font-bangers text-2xl text-white mb-2">SINGLE BATTLE</h3>
                      <p className="text-white/80 text-sm">One epic fight between two champions</p>
                    </div>
                  </button>

                  {/* Tournament */}
                  <button
                    onClick={() => handleBattleTypeSelect('tournament')}
                    className="relative overflow-hidden rounded-lg p-6 border-4 transition-all border-amber-500 hover:border-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                    style={{ background: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)' }}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-3">🏆</div>
                      <h3 className="font-bangers text-2xl text-white mb-2">TOURNAMENT</h3>
                      <p className="text-white/80 text-sm">8 champions battle through the bracket</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Game Mode (Classic vs Adventure) */}
            {modeStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Back button */}
                <button
                  onClick={handleBackToStep1}
                  className="mb-4 text-white/70 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <span>←</span>
                  <span className="text-sm">Back to battle type</span>
                </button>
                
                <h2 className="font-bangers text-2xl text-[#FFD700] text-center mb-2" style={{ textShadow: '2px 2px 0 #000' }}>
                  🎮 CHOOSE YOUR MODE
                </h2>
                <p className="text-white/60 text-center text-sm mb-4">
                  {battleType === 'single' ? '⚔️ Single Battle' : '🏆 Tournament'} selected
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Classic Mode */}
                  <button
                    onClick={() => setGameMode('classic')}
                    className={`relative overflow-hidden rounded-lg p-6 border-4 transition-all ${
                      gameMode === 'classic' 
                        ? 'border-yellow-400 ring-4 ring-yellow-400/50 shadow-[0_0_30px_rgba(255,215,0,0.5)]' 
                        : 'border-green-600 hover:border-green-400'
                    }`}
                    style={{ background: 'linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)' }}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-3">📖</div>
                      <h3 className="font-bangers text-2xl text-white mb-2">CLASSIC</h3>
                      <p className="text-white/80 text-sm">Watch the battle unfold</p>
                    </div>
                    {gameMode === 'classic' && (
                      <div className="absolute top-2 right-2 bg-yellow-400 w-8 h-8 rounded-full flex items-center justify-center">
                        <span className="text-black font-bold">✓</span>
                      </div>
                    )}
                  </button>

                  {/* Adventure Mode */}
                  <button
                    onClick={() => setGameMode('adventure')}
                    className={`relative overflow-hidden rounded-lg p-6 border-4 transition-all ${
                      gameMode === 'adventure' 
                        ? 'border-yellow-400 ring-4 ring-yellow-400/50 shadow-[0_0_30px_rgba(255,215,0,0.5)]' 
                        : 'border-purple-600 hover:border-purple-400'
                    }`}
                    style={{ background: 'linear-gradient(135deg, #4a1a47 0%, #5a2d5a 100%)' }}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-3">🎭</div>
                      <h3 className="font-bangers text-2xl text-white mb-2">ADVENTURE</h3>
                      <p className="text-white/80 text-sm">YOU decide what happens!</p>
                    </div>
                    {gameMode === 'adventure' && (
                      <div className="absolute top-2 right-2 bg-yellow-400 w-8 h-8 rounded-full flex items-center justify-center">
                        <span className="text-black font-bold">✓</span>
                      </div>
                    )}
                  </button>
                </div>
                
                {/* Mode description */}
                <div className="mt-4 p-4 bg-black/30 rounded-lg">
                  <p className="text-white/90 text-sm text-center">
                    {gameMode === 'classic' 
                      ? '📖 Experience the full battle from start to finish with educational facts and epic illustrations!' 
                      : '🎭 Make critical choices that shape the battle! Your decisions determine who wins!'}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Tournament Fighter Selection - 8 slots */}
      {battleType === 'tournament' && modeStep === 2 && (
        <section className="px-4 pb-6">
          <div className="max-w-6xl mx-auto">
            
            <div className="text-center mb-4">
              <h2 className="font-bangers text-3xl sm:text-4xl text-[#FFD700]" style={{ textShadow: '3px 3px 0 #000' }}>
                🏆 SELECT 8 CHAMPIONS
              </h2>
              <p className="text-white/70 mt-2">
                {gameMode === 'classic' ? '📖 Classic' : '🎭 Adventure'} mode • {tournamentFighters.length}/8 selected
              </p>
              <p className="text-white/50 text-sm mt-1">
                Tap to select • Tap slot or fighter again to remove
              </p>
              
              {/* Tier Info Popover - hover to see options */}
              <div className="mt-2">
                <TierInfoPopover isAuthenticated={tierData.isAuthenticated} currentTier={tierData.tier} />
              </div>
            </div>

            {/* 8 Fighter Slots - single row, compact */}
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
                    {/* Match label */}
                    <div className="absolute top-0.5 left-0.5 bg-black/70 px-1 py-0.5 rounded text-[10px] font-bold text-[#FFD700] z-10">
                      {matchLabels[index]}
                    </div>
                    
                    {fighter ? (
                      <button
                        onClick={() => handleTournamentFighterSelect(fighter)}
                        className="absolute inset-0 w-full h-full cursor-pointer hover:ring-2 hover:ring-red-500 transition-all"
                      >
                        <img 
                          src={getImagePath(fighter)} 
                          alt={fighter} 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
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

            {/* Character Grid */}
            <div className="bg-[#1a1a2e] rounded-xl p-4 border-4 border-[#FFD700]">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {FIGHTERS.map((fighter, i) => {
                  const isSelected = tournamentFighters.includes(fighter.name);
                  const isLocked = isAnimalLocked(tierData.tier, fighter.name);
                  return (
                    <button
                      key={i}
                      onClick={() => handleTournamentFighterSelect(fighter.name)}
                      disabled={!isSelected && tournamentFighters.length >= 8 && !isLocked}
                      className={`relative aspect-square rounded-lg overflow-hidden border-3 transition-all ${
                        isSelected
                          ? 'border-[#FFD700] ring-2 ring-[#FFD700] opacity-50 grayscale'
                          : isLocked
                          ? 'border-gray-600 opacity-70 hover:border-yellow-500 hover:opacity-100 cursor-pointer'
                          : tournamentFighters.length >= 8
                          ? 'border-gray-600 opacity-30 cursor-not-allowed'
                          : 'border-gray-600 hover:border-white hover:scale-110 hover:z-10'
                      }`}
                    >
                      <img src={getImagePath(fighter.name)} alt={fighter.name} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 py-1 px-1">
                        <p className="font-bangers text-white text-xs text-center truncate">
                          {fighter.name.toUpperCase()}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="text-[#FFD700] text-2xl font-bold">✓</span>
                        </div>
                      )}
                      {/* Lock icon for locked animals */}
                      {isLocked && !isSelected && (
                        <div className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center">
                          <span className="text-yellow-400 text-sm">🔒</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ready button when 8 selected */}
            {canStartTournament && !showTournamentOverlay && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowTournamentOverlay(true)}
                  className="px-10 py-4 rounded-xl font-bangers text-3xl bg-gradient-to-b from-yellow-400 to-orange-500 text-red-900 border-4 border-yellow-600 shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-105 hover:shadow-[0_0_40px_rgba(255,215,0,0.7)] transition-all duration-300"
                >
                  🏆 READY FOR BATTLE!
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4b. Fighter Selection - Only shown for single battle */}
      {battleType === 'single' && modeStep === 2 && (
      <section className="px-4 pb-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-4">
            <h2 className="font-bangers text-3xl sm:text-4xl text-[#FFD700]" style={{ textShadow: '3px 3px 0 #000' }}>
              ⚔️ PLAYER SELECT
            </h2>
            
            {/* Tier Info Popover - hover to see options */}
            <div className="mt-2">
              <TierInfoPopover isAuthenticated={tierData.isAuthenticated} currentTier={tierData.tier} />
            </div>
          </div>

          {/* Side-by-Side on tablet+, stacked on mobile */}
          <div className="flex flex-col md:grid md:gap-4 gap-2 mb-6" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
            
            {/* RED CORNER - LEFT */}
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
                <div className="flex items-center justify-center h-full">
                  <span className="font-bangers text-xl text-white/60">CLICK TO SELECT</span>
                </div>
              )}
              {selectingFor === 'A' && (
                <div className="absolute bottom-0 left-0 right-0 bg-yellow-400 py-1 text-center z-10">
                  <span className="font-bangers text-black">◀ SELECTING</span>
                </div>
              )}
            </button>

            {/* VS Badge - CENTER */}
            <div className="flex items-center justify-center px-1 sm:px-2">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-[#FFD700] w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-4 border-[#8B0000] shadow-xl"
              >
                <span className="font-bangers text-xl sm:text-2xl md:text-3xl text-[#8B0000]">VS</span>
              </motion.div>
            </div>

            {/* BLUE CORNER - RIGHT */}
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
                <div className="flex items-center justify-center h-full">
                  <span className="font-bangers text-xl text-white/60">CLICK TO SELECT</span>
                </div>
              )}
              {selectingFor === 'B' && (
                <div className="absolute bottom-0 left-0 right-0 bg-yellow-400 py-1 text-center z-10">
                  <span className="font-bangers text-black">SELECTING ▶</span>
                </div>
              )}
            </button>
          </div>

          {/* Character Grid - BOTTOM */}
          <div className="bg-[#1a1a2e] rounded-xl p-4 border-4 border-[#FFD700]">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {FIGHTERS.map((fighter, i) => {
                const isLocked = isAnimalLocked(tierData.tier, fighter.name);
                const isSelected = animalA === fighter.name || animalB === fighter.name;
                return (
                  <button
                    key={i}
                    onClick={() => handleFighterSelect(fighter.name)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-3 transition-all hover:scale-110 hover:z-10 ${
                      isSelected
                        ? 'border-yellow-400 ring-2 ring-yellow-400'
                        : isLocked
                        ? 'border-gray-600 opacity-70 hover:border-yellow-500 hover:opacity-100'
                        : 'border-gray-600 hover:border-white'
                    }`}
                  >
                    <img src={getImagePath(fighter.name)} alt={fighter.name} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 py-1 px-1">
                      <p className="font-bangers text-white text-xs text-center truncate">
                        {fighter.name.toUpperCase()}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-black font-bold text-sm">✓</span>
                      </div>
                    )}
                    {/* Lock icon for locked animals */}
                    {isLocked && !isSelected && (
                      <div className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center">
                        <span className="text-yellow-400 text-sm">🔒</span>
                      </div>
                    )}
                  </button>
                );
              })}
              
              {/* Use Your Imagination - Coming Soon */}
              <div
                className="relative aspect-square rounded-lg overflow-hidden border-3 border-dashed border-gray-500 bg-gradient-to-br from-gray-600 to-gray-800 opacity-75 cursor-not-allowed"
                title="Coming Soon!"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                  <div className="text-3xl mb-1">✨</div>
                  <p className="font-bangers text-white text-xs text-center leading-tight">YOUR IMAGINATION</p>
                  <p className="text-yellow-400 text-[10px] font-bold">COMING SOON</p>
                </div>
              </div>
            </div>
          </div>

          {/* Show "Ready to Fight" button when both selected but overlay dismissed */}
          {canGenerate && !showFightOverlay && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowFightOverlay(true)}
                className="px-10 py-4 rounded-xl font-bangers text-3xl bg-gradient-to-b from-yellow-400 to-orange-500 text-red-900 border-4 border-yellow-600 shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-105 hover:shadow-[0_0_40px_rgba(255,215,0,0.7)] transition-all duration-300"
              >
                ⚔️ READY TO FIGHT!
              </button>
            </div>
          )}
        </div>
      </section>
      )}

      {/* FIGHT! Overlay - appears when both fighters selected AND overlay is open (single battle only) */}
      {battleType === 'single' && canGenerate && showFightOverlay && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => { if (!loading) { setShowFightOverlay(false); setAnimalA(''); setAnimalB(''); setSelectingFor('A'); } }}
        >
          <div className="text-center transition-transform duration-300">
            {/* VS Display */}
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
            
            {/* FIGHT Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); handleGenerate(); }} 
              disabled={loading}
              className="px-16 py-6 rounded-2xl font-bangers text-5xl bg-gradient-to-b from-yellow-400 to-orange-500 text-red-900 border-4 border-yellow-600 shadow-[0_0_40px_rgba(255,215,0,0.6)] hover:scale-110 hover:shadow-[0_0_60px_rgba(255,215,0,0.8)] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? '⏳ CREATING...' : '⚔️ FIGHT!'}
            </button>
            
            <p className="mt-6 text-white/80 text-lg">
              {gameMode === 'classic' 
                ? 'Click to create your battle book!' 
                : '✨ Interactive adventure mode'}
            </p>
            
            {/* Close hint */}
            {!loading && (
              <p className="mt-4 text-white/50 text-sm">Click FIGHT to proceed or anywhere else to re-select</p>
            )}
          </div>
        </div>
      )}

      {/* TOURNAMENT Overlay - appears when 8 fighters selected */}
      {battleType === 'tournament' && canStartTournament && showTournamentOverlay && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => { if (!loading) { setShowTournamentOverlay(false); } }}
        >
          <div className="text-center max-w-4xl mx-auto px-4" onClick={(e) => e.stopPropagation()}>
            {/* Trophy */}
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
            
            {/* Bracket Preview */}
            <div className="bg-black/50 rounded-xl p-6 mb-6 border-2 border-[#FFD700]/30">
              <p className="text-white/60 text-sm mb-4">FIRST ROUND MATCHUPS</p>
              <div className="grid grid-cols-2 gap-4">
                {[0, 2, 4, 6].map((i) => (
                  <div key={i} className="flex items-center justify-center gap-3 bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <img 
                        src={getImagePath(tournamentFighters[i])} 
                        alt={tournamentFighters[i]} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-red-500"
                      />
                      <span className="text-white text-sm font-bold truncate max-w-[80px]">{tournamentFighters[i]}</span>
                    </div>
                    <span className="text-[#FFD700] font-bangers">VS</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-bold truncate max-w-[80px]">{tournamentFighters[i + 1]}</span>
                      <img 
                        src={getImagePath(tournamentFighters[i + 1])} 
                        alt={tournamentFighters[i + 1]} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Start Button */}
            <button 
              onClick={handleStartTournament}
              disabled={loading}
              className="px-16 py-6 rounded-2xl font-bangers text-4xl bg-gradient-to-b from-yellow-400 to-orange-500 text-red-900 border-4 border-yellow-600 shadow-[0_0_40px_rgba(255,215,0,0.6)] hover:scale-110 hover:shadow-[0_0_60px_rgba(255,215,0,0.8)] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? '⏳ PREPARING...' : '🏆 START TOURNAMENT'}
            </button>
            
            <p className="mt-6 text-white/60 text-sm">
              {gameMode === 'classic' ? '📖 Classic mode' : '🎭 Adventure mode'} • 7 battles to the championship
            </p>
            
            {/* Close hint */}
            {!loading && (
              <p className="mt-4 text-white/50 text-sm">Click START to begin or outside to re-select fighters</p>
            )}
          </div>
        </div>
      )}

      {/* 5. What's Inside Your Book */}
      <section className="py-12 px-4" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-bangers text-4xl text-[#FFD700] text-center mb-8" style={{ textShadow: '3px 3px 0 #000' }}>
            📚 WHAT'S INSIDE YOUR BOOK?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🌍', title: 'HABITAT', desc: 'Learn where they live and survive', color: '#4CAF50' },
              { icon: '🔬', title: 'REAL FACTS', desc: 'Size, speed, weapons, and abilities', color: '#2196F3' },
              { icon: '📊', title: 'TALE OF THE TAPE', desc: 'Compare stats like a championship bout', color: '#FF9800' },
              { icon: '⚔️', title: 'EPIC BATTLE', desc: 'Watch them face off in an illustrated showdown', color: '#f44336' },
            ].map((f) => (
              <motion.div 
                key={f.title}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-[#f5f5dc] rounded-xl p-6 text-center border-4 shadow-xl"
                style={{ borderColor: f.color }}
              >
                <div className="text-6xl mb-4">{f.icon}</div>
                <h3 className="font-bangers text-2xl mb-2" style={{ color: f.color }}>{f.title}</h3>
                <p className="text-gray-700 font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Blog CTA Section */}
      <section className="py-8 px-4 bg-black/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-[#8B0000] via-[#CC0000] to-[#8B0000] rounded-xl p-8 border-4 border-[#FFD700]">
            <h2 className="font-bangers text-3xl text-[#FFD700] mb-4" style={{ letterSpacing: '2px' }}>
              📚 WANT TO LEARN MORE?
            </h2>
            <p className="text-white/90 text-lg mb-6">
              Read in-depth battle guides with real facts, scientific analysis, and expert verdicts!
            </p>
            <a
              href="/blog"
              className="inline-block bg-[#FFD700] text-[#8B0000] font-bangers text-xl px-8 py-3 rounded-xl hover:bg-yellow-300 transition-all shadow-xl border-4 border-[#8B0000]"
            >
              🔥 READ BATTLE GUIDES
            </a>
          </div>
        </div>
      </section>

      {/* 7. Official Books - Amazon Affiliate */}
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
              Jerry Pallotta's bestselling <strong className="text-[#FF9900]">Who Would Win?</strong> series — 26+ titles with amazing illustrations by Rob Bolster!
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
              href="https://www.amazon.com/s?k=who+would+win+jerry+pallotta&tag=fightingbooks-20"
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

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        lockedAnimal={lockedAnimalClicked}
        currentTier={tierData.tier}
        upgradeOptions={tierData.canUpgradeTo}
        onUpgrade={handleUpgrade}
      />

      {/* 9. Footer */}
      <footer className="py-6 bg-[#0d1f0d] text-center">
        <p className="text-white/50 text-sm">Made with ❤️ for animal fans • AI-powered educational content</p>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap');
        .font-bangers { font-family: 'Bangers', cursive; }
        .font-comic { font-family: 'Comic Neue', cursive; }
      `}</style>
    </main>
  );
}
// Deploy trigger 1770217700
