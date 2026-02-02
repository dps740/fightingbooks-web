'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { quickContentCheck, isKnownAnimal, checkRateLimit, incrementRateLimit } from '@/lib/content-moderation';

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
  const [loading, setLoading] = useState(false);

  const selectedA = FIGHTERS.find(f => f.name === animalA);
  const selectedB = FIGHTERS.find(f => f.name === animalB);
  
  // Pricing based on mode
  const getPrice = () => {
    if (gameMode === 'classic') return null; // Free
    return battleType === 'single' ? '$1' : '$5';
  };
  const canGenerate = animalA && animalB && animalA !== animalB;

  const getImagePath = (name: string) => `/fighters/${name.toLowerCase().replace(/ /g, '-')}.jpg`;

  const handleFighterSelect = (fighterName: string) => {
    if (selectingFor === 'A') {
      setAnimalA(fighterName);
      if (!animalB) setSelectingFor('B');
    } else {
      setAnimalB(fighterName);
      if (!animalA) setSelectingFor('A');
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
      
      {/* 1. Navigation */}
      <nav className="py-4 px-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span className="text-[#FFD700] font-bangers text-xl">🥊 FightingBooks</span>
          <a href="/blog" className="text-white hover:text-[#FFD700] font-bold transition-colors px-4 py-2 rounded-lg hover:bg-white/10">
            📚 Battle Guides
          </a>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="inline-block bg-[#FFD700] px-4 sm:px-10 py-3 sm:py-4 rounded-lg shadow-2xl border-4 border-[#8B0000]">
              <h1 className="font-bangers text-2xl sm:text-4xl md:text-5xl text-[#CC0000]" style={{ textShadow: '2px 2px 0 #000', letterSpacing: '2px' }}>
                WHO WOULD WIN?
              </h1>
            </div>
          </motion.div>
          <p className="text-xl font-bold text-[#FFD700] mt-3" style={{ textShadow: '2px 2px 4px #000' }}>
            Create Your Own Battle Book!
          </p>
          <p className="text-white/80 mt-2 text-lg">
            Inspired by Jerry Pallotta's bestselling series
          </p>
        </div>
      </section>

      {/* 3. Game Mode Selector - Hierarchical */}
      <section className="px-4 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            
            {/* Classic Mode Card */}
            <div className={`rounded-xl border-4 overflow-hidden transition-all ${
              gameMode === 'classic' ? 'border-[#FFD700] shadow-2xl' : 'border-gray-600'
            }`}>
              {/* Header */}
              <button
                onClick={() => setGameMode('classic')}
                className={`w-full p-3 sm:p-4 text-center transition-all ${
                  gameMode === 'classic'
                    ? 'bg-gradient-to-br from-green-600 to-green-800'
                    : 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700'
                }`}
              >
                <div className="text-2xl sm:text-3xl mb-1">📖</div>
                <div className="font-bangers text-lg sm:text-xl text-white">CLASSIC BATTLES</div>
                <div className="text-green-300 font-bold text-sm">100% FREE</div>
              </button>
              
              {/* Sub-options */}
              <div className={`grid grid-cols-2 gap-1 p-2 bg-black/40 ${gameMode !== 'classic' ? 'opacity-50' : ''}`}>
                <button
                  onClick={() => { setGameMode('classic'); setBattleType('single'); }}
                  disabled={gameMode !== 'classic'}
                  className={`p-2 rounded-lg text-center transition-all ${
                    gameMode === 'classic' && battleType === 'single'
                      ? 'bg-green-600 ring-2 ring-[#FFD700]'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="text-lg">⚔️</div>
                  <div className="font-bangers text-xs sm:text-sm text-white">SINGLE</div>
                  <div className="text-green-400 text-xs font-bold">FREE</div>
                </button>
                <button
                  onClick={() => { setGameMode('classic'); setBattleType('tournament'); }}
                  disabled={gameMode !== 'classic'}
                  className={`p-2 rounded-lg text-center transition-all ${
                    gameMode === 'classic' && battleType === 'tournament'
                      ? 'bg-green-600 ring-2 ring-[#FFD700]'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="text-lg">🏆</div>
                  <div className="font-bangers text-xs sm:text-sm text-white">TOURNAMENT</div>
                  <div className="text-green-400 text-xs font-bold">FREE</div>
                </button>
              </div>
            </div>

            {/* Adventure Mode Card */}
            <div className={`rounded-xl border-4 overflow-hidden transition-all ${
              gameMode === 'adventure' ? 'border-[#FFD700] shadow-2xl' : 'border-gray-600'
            }`}>
              {/* Header */}
              <button
                onClick={() => setGameMode('adventure')}
                className={`w-full p-3 sm:p-4 text-center transition-all ${
                  gameMode === 'adventure'
                    ? 'bg-gradient-to-br from-purple-600 to-purple-800'
                    : 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700'
                }`}
              >
                <div className="text-2xl sm:text-3xl mb-1">🎮</div>
                <div className="font-bangers text-lg sm:text-xl text-white">ADVENTURE MODE</div>
                <div className="text-purple-300 font-bold text-sm">PREMIUM ✨</div>
              </button>
              
              {/* Sub-options */}
              <div className={`grid grid-cols-2 gap-1 p-2 bg-black/40 ${gameMode !== 'adventure' ? 'opacity-50' : ''}`}>
                <button
                  onClick={() => { setGameMode('adventure'); setBattleType('single'); }}
                  disabled={gameMode !== 'adventure'}
                  className={`p-2 rounded-lg text-center transition-all ${
                    gameMode === 'adventure' && battleType === 'single'
                      ? 'bg-purple-600 ring-2 ring-[#FFD700]'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="text-lg">⚔️</div>
                  <div className="font-bangers text-xs sm:text-sm text-white">SINGLE</div>
                  <div className="text-purple-300 text-xs font-bold">$1</div>
                </button>
                <button
                  onClick={() => { setGameMode('adventure'); setBattleType('tournament'); }}
                  disabled={gameMode !== 'adventure'}
                  className={`p-2 rounded-lg text-center transition-all ${
                    gameMode === 'adventure' && battleType === 'tournament'
                      ? 'bg-purple-600 ring-2 ring-[#FFD700]'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="text-lg">🏆</div>
                  <div className="font-bangers text-xs sm:text-sm text-white">TOURNAMENT</div>
                  <div className="text-purple-300 text-xs font-bold">$5</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Fighter Selection - Street Fighter 2 Style */}
      <section className="px-4 pb-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-4">
            <h2 className="font-bangers text-3xl sm:text-4xl text-[#FFD700]" style={{ textShadow: '3px 3px 0 #000' }}>
              ⚔️ PLAYER SELECT
            </h2>
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
              {FIGHTERS.map((fighter, i) => (
                <button
                  key={i}
                  onClick={() => handleFighterSelect(fighter.name)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-3 transition-all hover:scale-110 hover:z-10 ${
                    (animalA === fighter.name || animalB === fighter.name)
                      ? 'border-yellow-400 ring-2 ring-yellow-400'
                      : 'border-gray-600 hover:border-white'
                  }`}
                >
                  <img src={getImagePath(fighter.name)} alt={fighter.name} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 py-1 px-1">
                    <p className="font-bangers text-white text-xs text-center truncate">
                      {fighter.name.toUpperCase()}
                    </p>
                  </div>
                  {(animalA === fighter.name || animalB === fighter.name) && (
                    <div className="absolute top-1 right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-sm">✓</span>
                    </div>
                  )}
                </button>
              ))}
              
              {/* Use Your Imagination */}
              <button
                onClick={() => {
                  const custom = prompt('Enter your creature:');
                  if (custom) handleFighterSelect(custom);
                }}
                className="relative aspect-square rounded-lg overflow-hidden border-3 border-dashed border-purple-400 transition-all hover:scale-110 hover:border-purple-300 bg-gradient-to-br from-purple-600 to-purple-800"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                  <div className="text-3xl mb-1">✨</div>
                  <p className="font-bangers text-white text-xs text-center leading-tight">YOUR IMAGINATION</p>
                  <p className="text-white text-[10px]">$1</p>
                </div>
              </button>
            </div>
          </div>

          {/* 5. Generate Button */}
          {canGenerate && (
            <div className="mt-6 text-center">
              <button onClick={handleGenerate} disabled={loading} className="px-12 py-4 rounded-xl font-bangers text-3xl bg-[#FFD700] text-[#8B0000] border-4 border-[#8B5A2B] shadow-xl hover:bg-yellow-300 hover:scale-105 transition-all disabled:opacity-50">
                {loading ? '⏳ CREATING...' : (
                  <>
                    {gameMode === 'adventure' && getPrice() ? `${getPrice()} • ` : ''}
                    {battleType === 'tournament' ? '🏆 START TOURNAMENT!' : '📖 CREATE BOOK!'}
                  </>
                )}
              </button>
              <p className="mt-4 text-white/90">
                {gameMode === 'classic' 
                  ? 'Free to create • No signup needed' 
                  : 'Premium interactive experience • You control the story'}
              </p>
            </div>
          )}
        </div>
      </section>

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
              {[
                // Classic matchups
                { title: 'Lion vs Tiger', asin: '0545175712' },
                { title: 'Killer Whale vs Great White Shark', asin: '0545175739' },
                { title: 'Tyrannosaurus Rex vs Velociraptor', asin: '0545175720' },
                { title: 'Polar Bear vs Grizzly Bear', asin: '054530170X' },
                { title: 'Hammerhead vs Bull Shark', asin: '0545301718' },
                { title: 'Komodo Dragon vs King Cobra', asin: '0545301726' },
                { title: 'Tarantula vs Scorpion', asin: '0545451914' },
                { title: 'Wolverine vs Tasmanian Devil', asin: '0545451906' },
                { title: 'Whale vs Giant Squid', asin: '0545301734' },
                { title: 'Rhino vs Hippo', asin: '0545451922' },
                { title: 'Lobster vs Crab', asin: '0545681219' },
                // More matchups
                { title: 'Hornet vs Wasp', asin: '0545451930' },
                { title: 'Triceratops vs Spinosaurus', asin: '0545681200' },
                { title: 'Jaguar vs Skunk', asin: '1338320254' },
                { title: 'Rattlesnake vs Secretary Bird', asin: '1338320289' },
                { title: 'Hyena vs Honey Badger', asin: '1338320297' },
                { title: 'Falcon vs Hawk', asin: '1338320300' },
                { title: 'Alligator vs Python', asin: '1338320319' },
                { title: 'Green Ants vs Army Ants', asin: '1338672118' },
                // Ultimate Rumbles
                { title: 'Ultimate Shark Rumble', asin: '1338320270' },
                { title: 'Ultimate Ocean Rumble', asin: '1338320262' },
                { title: 'Ultimate Jungle Rumble', asin: '0545946077' },
                { title: 'Ultimate Dinosaur Rumble', asin: '1338320327' },
                { title: 'Ultimate Bug Rumble', asin: '1338320335' },
                { title: 'Ultimate Reptile Rumble', asin: '1338745530' },
              ].map((book) => (
                <a
                  key={book.asin}
                  href={`https://www.amazon.com/dp/${book.asin}?tag=fightingbooks-20`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 group"
                >
                  <div className="w-36 h-52 rounded-lg overflow-hidden shadow-2xl border-3 border-white/10 group-hover:border-[#FF9900] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,153,0,0.4)]">
                    <img 
                      src={`https://images-na.ssl-images-amazon.com/images/P/${book.asin}.01._SCLZZZZZZZ_.jpg`}
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
