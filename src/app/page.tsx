'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { quickContentCheck, isKnownAnimal, checkRateLimit, incrementRateLimit } from '@/lib/content-moderation';

// Expanded roster with fantasy creatures - will use AI-generated high-quality images
const FIGHTERS = [
  // Real Animals
  { name: 'Lion', category: 'real' },
  { name: 'Tiger', category: 'real' },
  { name: 'Grizzly Bear', category: 'real' },
  { name: 'Polar Bear', category: 'real' },
  { name: 'Gorilla', category: 'real' },
  { name: 'Silverback Gorilla', category: 'real' },
  { name: 'Great White Shark', category: 'real' },
  { name: 'Orca', category: 'real' },
  { name: 'Saltwater Crocodile', category: 'real' },
  { name: 'Nile Crocodile', category: 'real' },
  { name: 'African Elephant', category: 'real' },
  { name: 'Hippo', category: 'real' },
  { name: 'Rhino', category: 'real' },
  { name: 'Komodo Dragon', category: 'real' },
  { name: 'King Cobra', category: 'real' },
  { name: 'Anaconda', category: 'real' },
  { name: 'Python', category: 'real' },
  { name: 'Wolf', category: 'real' },
  { name: 'Jaguar', category: 'real' },
  { name: 'Leopard', category: 'real' },
  { name: 'Eagle', category: 'real' },
  { name: 'Wolverine', category: 'real' },
  { name: 'Honey Badger', category: 'real' },
  { name: 'Moose', category: 'real' },
  { name: 'Cape Buffalo', category: 'real' },
  { name: 'Cassowary', category: 'real' },
  
  // Fantasy Creatures
  { name: 'Dragon', category: 'fantasy' },
  { name: 'Griffin', category: 'fantasy' },
  { name: 'Hydra', category: 'fantasy' },
  { name: 'Phoenix', category: 'fantasy' },
  { name: 'Cerberus', category: 'fantasy' },
  { name: 'Chimera', category: 'fantasy' },
  { name: 'Manticore', category: 'fantasy' },
  { name: 'Basilisk', category: 'fantasy' },
];

export default function Home() {
  const router = useRouter();
  const [animalA, setAnimalA] = useState('');
  const [animalB, setAnimalB] = useState('');
  const [showCustomA, setShowCustomA] = useState(false);
  const [showCustomB, setShowCustomB] = useState(false);
  const [customA, setCustomA] = useState('');
  const [customB, setCustomB] = useState('');
  const [battleMode, setBattleMode] = useState('standard'); // standard, cyoa, tournament
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const effectiveA = customA || animalA;
  const effectiveB = customB || animalB;
  const canGenerate = effectiveA && effectiveB && effectiveA.toLowerCase() !== effectiveB.toLowerCase();

  const handleCustomSelection = (corner: 'A' | 'B') => {
    // In production, this would trigger Stripe payment
    // For now, just show the input
    if (corner === 'A') {
      setShowCustomA(true);
      setAnimalA('');
    } else {
      setShowCustomB(true);
      setAnimalB('');
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setValidationError('');
    
    // Validate custom inputs
    const customInputs = [
      { value: customA, name: 'Red corner' },
      { value: customB, name: 'Blue corner' },
    ].filter(i => i.value);
    
    for (const input of customInputs) {
      const check = quickContentCheck(input.value);
      if (!check.allowed) {
        setValidationError(`${input.name}: ${check.reason}`);
        return;
      }
    }
    
    // Rate limit for non-standard animals
    const hasCustomAnimal = (customA && !isKnownAnimal(customA)) || (customB && !isKnownAnimal(customB));
    if (hasCustomAnimal) {
      const rateLimit = checkRateLimit();
      if (!rateLimit.allowed) {
        setValidationError(`You've used all ${5} custom animal slots for today. Try a common animal or come back tomorrow!`);
        return;
      }
      incrementRateLimit();
    }
    
    setLoading(true);
    
    if (battleMode === 'tournament') {
      router.push(`/tournament?seed1=${encodeURIComponent(effectiveA)}&seed2=${encodeURIComponent(effectiveB)}`);
    } else {
      const mode = battleMode === 'cyoa' ? 'cyoa' : 'standard';
      router.push(`/read?a=${encodeURIComponent(effectiveA)}&b=${encodeURIComponent(effectiveB)}&env=neutral&mode=${mode}`);
    }
  };

  return (
    <main className="min-h-screen font-comic" style={{ background: 'linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)' }}>
      {/* Navigation */}
      <nav className="py-4 px-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span className="text-[#FFD700] font-bangers text-xl">🥊 FightingBooks</span>
          <a 
            href="/blog" 
            className="text-white hover:text-[#FFD700] font-bold transition-colors px-4 py-2 rounded-lg hover:bg-white/10"
          >
            📚 Battle Guides
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block bg-[#FFD700] px-4 sm:px-10 py-3 sm:py-4 rounded-lg shadow-2xl border-4 border-[#8B0000]">
              <h1 className="font-bangers text-2xl sm:text-4xl md:text-6xl text-[#CC0000]" style={{ 
                textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                letterSpacing: '2px'
              }}>
                WHO WOULD WIN?
              </h1>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#FFD700]" style={{ textShadow: '2px 2px 4px #000' }}>
              Create Your Own Battle Book!
            </p>
            <p className="text-white/80 mt-2 text-lg">
              Inspired by Jerry Pallotta's bestselling series
            </p>
          </motion.div>
        </div>
      </section>

      {/* Fighter Selection - Street Fighter 2 Style */}
      <section className="px-4 pb-8 pt-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#f5f0e1] rounded-lg shadow-2xl overflow-hidden border-8 border-[#8B5A2B]">
            
            {/* Header */}
            <div className="bg-[#CC0000] py-3 px-6 text-center border-b-4 border-[#8B5A2B]">
              <h2 className="font-bangers text-2xl sm:text-3xl text-[#FFD700]" style={{ textShadow: '2px 2px 0 #000' }}>
                ⚔️ PICK YOUR FIGHTERS
              </h2>
            </div>

            {/* Two-Column Fighter Select */}
            <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 p-4">
              
              {/* RED CORNER */}
              <div>
                <div className="text-center mb-4 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg">
                  <h3 className="font-bangers text-2xl text-white" style={{ textShadow: '2px 2px 0 #000' }}>
                    🔴 RED CORNER
                  </h3>
                </div>
                
                <div className="h-[600px] overflow-y-auto pr-2 space-y-2" style={{ scrollbarWidth: 'thin' }}>
                  {FIGHTERS.map((fighter, i) => (
                    <button
                      key={`red-${fighter.name}-${i}`}
                      onClick={() => { setAnimalA(fighter.name); setShowCustomA(false); setCustomA(''); }}
                      className={`w-full p-3 rounded-lg text-left transition-all font-bangers text-lg ${
                        animalA === fighter.name
                          ? 'bg-red-600 text-white ring-4 ring-red-800 scale-105'
                          : 'bg-white hover:bg-red-50 border-2 border-gray-300 hover:border-red-600'
                      }`}
                    >
                      <span className={fighter.category === 'fantasy' ? 'text-purple-600' : ''}>
                        {fighter.name} {fighter.category === 'fantasy' ? '✨' : ''}
                      </span>
                    </button>
                  ))}
                  
                  {/* Use Your Imagination Card */}
                  <button
                    onClick={() => handleCustomSelection('A')}
                    className={`w-full p-4 rounded-lg text-left transition-all border-4 border-dashed ${
                      showCustomA
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white ring-4 ring-purple-800'
                        : 'bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border-purple-400'
                    }`}
                  >
                    <div className="font-bangers text-xl text-purple-900">
                      ✨ USE YOUR IMAGINATION
                    </div>
                    <div className="text-sm text-purple-700 mt-1">Custom creature • $1</div>
                  </button>
                  
                  {showCustomA && (
                    <input
                      type="text"
                      placeholder="Enter any creature..."
                      value={customA}
                      onChange={(e) => setCustomA(e.target.value)}
                      className="w-full p-3 rounded border-4 border-purple-500 text-center font-bold focus:ring-4 focus:ring-purple-600"
                      autoFocus
                    />
                  )}
                </div>
              </div>

              {/* CENTER VS */}
              <div className="hidden md:flex items-center justify-center px-4">
                <motion.div 
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="bg-[#FFD700] w-20 h-20 rounded-full flex items-center justify-center border-6 border-[#8B0000] shadow-2xl"
                >
                  <span className="font-bangers text-3xl text-[#8B0000]">VS</span>
                </motion.div>
              </div>

              {/* Mobile VS */}
              <div className="md:hidden text-center py-4">
                <span className="inline-block font-bangers text-3xl bg-[#FFD700] px-8 py-3 rounded-full border-4 border-[#8B0000]">
                  VS
                </span>
              </div>

              {/* BLUE CORNER */}
              <div>
                <div className="text-center mb-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg">
                  <h3 className="font-bangers text-2xl text-white" style={{ textShadow: '2px 2px 0 #000' }}>
                    🔵 BLUE CORNER
                  </h3>
                </div>
                
                <div className="h-[600px] overflow-y-auto pr-2 space-y-2" style={{ scrollbarWidth: 'thin' }}>
                  {FIGHTERS.map((fighter, i) => (
                    <button
                      key={`blue-${fighter.name}-${i}`}
                      onClick={() => { setAnimalB(fighter.name); setShowCustomB(false); setCustomB(''); }}
                      className={`w-full p-3 rounded-lg text-left transition-all font-bangers text-lg ${
                        animalB === fighter.name
                          ? 'bg-blue-600 text-white ring-4 ring-blue-800 scale-105'
                          : 'bg-white hover:bg-blue-50 border-2 border-gray-300 hover:border-blue-600'
                      }`}
                    >
                      <span className={fighter.category === 'fantasy' ? 'text-purple-600' : ''}>
                        {fighter.name} {fighter.category === 'fantasy' ? '✨' : ''}
                      </span>
                    </button>
                  ))}
                  
                  {/* Use Your Imagination Card */}
                  <button
                    onClick={() => handleCustomSelection('B')}
                    className={`w-full p-4 rounded-lg text-left transition-all border-4 border-dashed ${
                      showCustomB
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white ring-4 ring-purple-800'
                        : 'bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border-purple-400'
                    }`}
                  >
                    <div className="font-bangers text-xl text-purple-900">
                      ✨ USE YOUR IMAGINATION
                    </div>
                    <div className="text-sm text-purple-700 mt-1">Custom creature • $1</div>
                  </button>
                  
                  {showCustomB && (
                    <input
                      type="text"
                      placeholder="Enter any creature..."
                      value={customB}
                      onChange={(e) => setCustomB(e.target.value)}
                      className="w-full p-3 rounded border-4 border-purple-500 text-center font-bold focus:ring-4 focus:ring-purple-600"
                      autoFocus
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Battle Mode Selection */}
            {effectiveA && effectiveB && (
              <div className="p-6 bg-gradient-to-r from-amber-100 to-orange-100 border-t-4 border-[#8B5A2B]">
                <h3 className="font-bangers text-2xl text-center text-[#8B0000] mb-4">
                  ⚔️ CHOOSE YOUR BATTLE MODE
                </h3>
                
                <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                  {/* Standard Mode */}
                  <button
                    onClick={() => setBattleMode('standard')}
                    className={`p-6 rounded-xl text-center transition-all border-4 ${
                      battleMode === 'standard'
                        ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-800 text-white scale-105 shadow-2xl'
                        : 'bg-white border-gray-300 hover:border-green-500 hover:shadow-lg'
                    }`}
                  >
                    <div className="text-5xl mb-2">📖</div>
                    <div className="font-bangers text-2xl mb-2">CLASSIC</div>
                    <div className="text-sm opacity-90">
                      Read the epic showdown from start to finish
                    </div>
                  </button>

                  {/* CYOA Mode */}
                  <button
                    onClick={() => setBattleMode('cyoa')}
                    className={`p-6 rounded-xl text-center transition-all border-4 ${
                      battleMode === 'cyoa'
                        ? 'bg-gradient-to-br from-purple-500 to-purple-600 border-purple-800 text-white scale-105 shadow-2xl'
                        : 'bg-white border-gray-300 hover:border-purple-500 hover:shadow-lg'
                    }`}
                  >
                    <div className="text-5xl mb-2">🎮</div>
                    <div className="font-bangers text-2xl mb-2">INTERACTIVE</div>
                    <div className="text-sm opacity-90">
                      YOU decide the outcome! Make 3 key choices
                    </div>
                  </button>

                  {/* Tournament Mode */}
                  <button
                    onClick={() => setBattleMode('tournament')}
                    className={`p-6 rounded-xl text-center transition-all border-4 ${
                      battleMode === 'tournament'
                        ? 'bg-gradient-to-br from-orange-500 to-red-600 border-red-800 text-white scale-105 shadow-2xl'
                        : 'bg-white border-gray-300 hover:border-orange-500 hover:shadow-lg'
                    }`}
                  >
                    <div className="text-5xl mb-2">🏆</div>
                    <div className="font-bangers text-2xl mb-2">TOURNAMENT</div>
                    <div className="text-sm opacity-90">
                      8-fighter bracket championship battle
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Matchup & Create Button */}
            {effectiveA && effectiveB && (
              <div className="p-6 bg-[#CC0000] text-center border-t-4 border-[#8B5A2B]">
                <div className="mb-4">
                  <span className="font-bangers text-3xl">
                    <span className="text-[#FFD700]">{effectiveA.toUpperCase()}</span>
                    <span className="text-white mx-4">VS</span>
                    <span className="text-[#87CEEB]">{effectiveB.toUpperCase()}</span>
                  </span>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || loading}
                  className={`px-12 py-4 rounded-xl font-bangers text-3xl transition-all ${
                    canGenerate && !loading
                      ? 'bg-[#FFD700] text-[#8B0000] border-4 border-[#8B5A2B] shadow-xl hover:bg-yellow-300 hover:scale-105'
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed border-4 border-gray-500'
                  }`}
                >
                  {loading ? '⏳ CREATING...' : battleMode === 'tournament' ? '🏆 START TOURNAMENT!' : '📖 CREATE BOOK!'}
                </button>
                
                {validationError && (
                  <p className="mt-4 text-white font-bold bg-[#8B0000] inline-block px-6 py-2 rounded-lg">
                    ⚠️ {validationError}
                  </p>
                )}
                
                <p className="mt-4 text-white/90">Free to create • No signup needed</p>
                {(customA || customB) && (
                  <p className="mt-2 text-[#FFD700] text-sm">
                    💎 Custom creature mode activated!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* What's Inside */}
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

      {/* Blog CTA */}
      <section className="py-8 px-4 bg-black/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-[#8B0000] via-[#CC0000] to-[#8B0000] rounded-xl p-8 border-4 border-[#FFD700]">
            <h2 className="font-bangers text-3xl text-[#FFD700] mb-4">
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

      {/* Official Books */}
      <section className="py-16 px-4 bg-gradient-to-b from-[#232f3e] to-[#131921]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-block bg-[#FF9900] px-6 py-2 rounded-full mb-4">
              <span className="text-black font-bold text-sm">📚 OFFICIAL BOOK SERIES</span>
            </div>
            <h2 className="font-bangers text-5xl text-white mb-4" style={{ textShadow: '3px 3px 0 #000' }}>
              GET THE REAL BOOKS!
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Jerry Pallotta's bestselling <strong className="text-[#FF9900]">Who Would Win?</strong> series — 26+ titles!
            </p>
          </div>
          
          <div className="overflow-x-auto pb-6">
            <div className="flex gap-5 px-4 min-w-max">
              {[
                { title: 'Lion vs Tiger', asin: '0545175712' },
                { title: 'Killer Whale vs Great White Shark', asin: '0545175739' },
                { title: 'Tyrannosaurus Rex vs Velociraptor', asin: '0545175720' },
                { title: 'Polar Bear vs Grizzly Bear', asin: '0545175747' },
                { title: 'Hammerhead vs Bull Shark', asin: '0545301718' },
                { title: 'Komodo Dragon vs King Cobra', asin: '0545301726' },
                { title: 'Ultimate Shark Rumble', asin: '1338672142' },
                { title: 'Ultimate Ocean Rumble', asin: '0545681138' },
              ].map((book) => (
                <a
                  key={book.asin}
                  href={`https://www.amazon.com/dp/${book.asin}?tag=fightingbooks-20`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 group"
                >
                  <div className="w-36 h-52 rounded-lg overflow-hidden shadow-2xl border-3 border-white/10 group-hover:border-[#FF9900] transition-all group-hover:scale-110">
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
            FightingBooks is a fan project. As an Amazon Associate we earn from qualifying purchases.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-[#0d1f0d] text-center">
        <p className="text-white/50 text-sm">Made with ❤️ for animal fans • AI-powered educational content</p>
      </footer>

      {/* Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap');
        .font-bangers { font-family: 'Bangers', cursive; }
        .font-comic { font-family: 'Comic Neue', cursive; }
      `}</style>
    </main>
  );
}
