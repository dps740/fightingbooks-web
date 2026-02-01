'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { quickContentCheck, isKnownAnimal, checkRateLimit, incrementRateLimit } from '@/lib/content-moderation';

const POPULAR_ANIMALS = [
  { name: 'Lion', emoji: '🦁' },
  { name: 'Tiger', emoji: '🐅' },
  { name: 'Grizzly Bear', emoji: '🐻' },
  { name: 'Gorilla', emoji: '🦍' },
  { name: 'Great White Shark', emoji: '🦈' },
  { name: 'Crocodile', emoji: '🐊' },
  { name: 'Elephant', emoji: '🐘' },
  { name: 'Polar Bear', emoji: '🐻‍❄️' },
  { name: 'Orca', emoji: '🐋' },
  { name: 'Hippo', emoji: '🦛' },
  { name: 'Komodo Dragon', emoji: '🦎' },
  { name: 'Wolf', emoji: '🐺' },
  { name: 'Anaconda', emoji: '🐍' },
  { name: 'Eagle', emoji: '🦅' },
  { name: 'Jaguar', emoji: '🐆' },
  { name: 'Rhino', emoji: '🦏' },
];

export default function Home() {
  const router = useRouter();
  const [animalA, setAnimalA] = useState('');
  const [animalB, setAnimalB] = useState('');
  const [customA, setCustomA] = useState('');
  const [customB, setCustomB] = useState('');
  const [loading, setLoading] = useState(false);
  const [cyoaMode, setCyoaMode] = useState(false);
  const [validationError, setValidationError] = useState('');

  const effectiveA = customA || animalA;
  const effectiveB = customB || animalB;
  const canGenerate = effectiveA && effectiveB && effectiveA.toLowerCase() !== effectiveB.toLowerCase();

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
    const mode = cyoaMode ? 'cyoa' : 'standard';
    router.push(`/read?a=${encodeURIComponent(effectiveA)}&b=${encodeURIComponent(effectiveB)}&env=neutral&mode=${mode}`);
  };

  return (
    <main className="min-h-screen font-comic" style={{ background: 'linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)' }}>
      {/* Navigation */}
      <nav className="py-4 px-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <span className="text-[#FFD700] font-bangers text-xl">🥊 FightingBooks</span>
          <a 
            href="/blog" 
            className="text-white/80 hover:text-[#FFD700] font-bold transition-colors px-4 py-2 rounded-lg hover:bg-white/10"
          >
            📚 Battle Guides
          </a>
        </div>
      </nav>

      {/* Hero - Book Cover Style */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* WHO WOULD WIN? Banner - Yellow with red text, like the books */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block bg-[#FFD700] px-4 sm:px-10 py-3 sm:py-4 rounded-lg shadow-2xl border-4 border-[#8B0000]" style={{ transform: 'perspective(500px) rotateX(5deg)' }}>
              <h1 className="font-bangers text-2xl sm:text-4xl md:text-6xl lg:text-7xl text-[#CC0000]" style={{ 
                textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                letterSpacing: '2px'
              }}>
                WHO WOULD WIN?
              </h1>
            </div>
          </motion.div>

          {/* Subheading */}
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

      {/* Fighter Selection - Main Card */}
      <section className="px-4 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#f5f5dc] rounded-xl shadow-2xl overflow-hidden border-4 border-[#8B4513]">
            
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-[#8B0000] via-[#CC0000] to-[#8B0000] py-3 sm:py-4 px-4 sm:px-6">
              <h2 className="font-bangers text-xl sm:text-2xl md:text-3xl text-[#FFD700] text-center" style={{ textShadow: '2px 2px 0 #000', letterSpacing: '1px' }}>
                ⚔️ CHOOSE YOUR FIGHTERS ⚔️
              </h2>
            </div>

            <div className="p-6 md:p-8">
              {/* Two Fighter Columns */}
              <div className="grid md:grid-cols-[1fr,80px,1fr] gap-4 md:gap-6">
                
                {/* RED CORNER - Fighter 1 */}
                <div className="bg-gradient-to-b from-[#ffcccc] to-[#ff9999] rounded-xl p-5 border-4 border-[#CC0000] shadow-lg">
                  <div className="bg-[#CC0000] text-white font-bangers text-xl text-center py-2 rounded-lg mb-4" style={{ letterSpacing: '2px' }}>
                    🔴 RED CORNER
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type any creature..."
                      value={customA}
                      onChange={(e) => { setCustomA(e.target.value); setAnimalA(''); }}
                      className="w-full p-3 rounded-lg border-3 border-[#CC0000] focus:ring-2 focus:ring-[#CC0000] focus:outline-none text-center font-bold text-lg bg-white"
                    />
                    {customA && (
                      <span className="absolute -top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        🧪 EXPERIMENTAL
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 justify-center max-h-40 overflow-y-auto">
                    {POPULAR_ANIMALS.slice(0, 8).map((animal) => (
                      <button
                        key={animal.name}
                        onClick={() => { setAnimalA(animal.name); setCustomA(''); }}
                        className={`px-3 py-2 rounded-full text-sm font-bold transition-all ${
                          animalA === animal.name
                            ? 'bg-[#CC0000] text-white shadow-lg transform scale-110'
                            : 'bg-white hover:bg-[#ffeeee] border-2 border-[#CC0000]/30'
                        }`}
                      >
                        {animal.emoji} {animal.name}
                      </button>
                    ))}
                  </div>
                  {effectiveA && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 bg-[#CC0000] text-white font-bangers text-2xl text-center py-3 rounded-lg">
                      {effectiveA.toUpperCase()}
                    </motion.div>
                  )}
                </div>

                {/* VS Circle */}
                <div className="flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-20 h-20 bg-[#FFD700] rounded-full flex items-center justify-center border-4 border-[#8B0000] shadow-xl"
                  >
                    <span className="font-bangers text-3xl text-[#8B0000]">VS</span>
                  </motion.div>
                </div>

                {/* BLUE CORNER - Fighter 2 */}
                <div className="bg-gradient-to-b from-[#cce5ff] to-[#99ccff] rounded-xl p-5 border-4 border-[#0066CC] shadow-lg">
                  <div className="bg-[#0066CC] text-white font-bangers text-xl text-center py-2 rounded-lg mb-4" style={{ letterSpacing: '2px' }}>
                    🔵 BLUE CORNER
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type any creature..."
                      value={customB}
                      onChange={(e) => { setCustomB(e.target.value); setAnimalB(''); }}
                      className="w-full p-3 rounded-lg border-3 border-[#0066CC] focus:ring-2 focus:ring-[#0066CC] focus:outline-none text-center font-bold text-lg bg-white"
                    />
                    {customB && (
                      <span className="absolute -top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        🧪 EXPERIMENTAL
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 justify-center max-h-40 overflow-y-auto">
                    {POPULAR_ANIMALS.slice(8, 16).map((animal) => (
                      <button
                        key={animal.name}
                        onClick={() => { setAnimalB(animal.name); setCustomB(''); }}
                        className={`px-3 py-2 rounded-full text-sm font-bold transition-all ${
                          animalB === animal.name
                            ? 'bg-[#0066CC] text-white shadow-lg transform scale-110'
                            : 'bg-white hover:bg-[#eef5ff] border-2 border-[#0066CC]/30'
                        }`}
                      >
                        {animal.emoji} {animal.name}
                      </button>
                    ))}
                  </div>
                  {effectiveB && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 bg-[#0066CC] text-white font-bangers text-2xl text-center py-3 rounded-lg">
                      {effectiveB.toUpperCase()}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Matchup Display */}
              {effectiveA && effectiveB && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
                  <div className="inline-block bg-[#2d5a3d] px-8 py-4 rounded-xl border-4 border-[#FFD700]">
                    <span className="font-bangers text-2xl md:text-3xl">
                      <span className="text-[#ff6b6b]">{effectiveA.toUpperCase()}</span>
                      <span className="text-[#FFD700] mx-4">VS</span>
                      <span className="text-[#6bb3ff]">{effectiveB.toUpperCase()}</span>
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Choose Your Own Adventure Mode Toggle */}
              <div className="mt-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`max-w-md mx-auto p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    cyoaMode 
                      ? 'bg-gradient-to-r from-purple-900/50 to-purple-700/50 border-purple-400 shadow-lg shadow-purple-500/20' 
                      : 'bg-gray-100 border-gray-300 hover:border-purple-300'
                  }`}
                  onClick={() => setCyoaMode(!cyoaMode)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-6 rounded-full p-1 transition-all ${cyoaMode ? 'bg-purple-500' : 'bg-gray-300'}`}>
                      <motion.div 
                        className="w-4 h-4 bg-white rounded-full shadow"
                        animate={{ x: cyoaMode ? 24 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bangers text-lg ${cyoaMode ? 'text-white' : 'text-gray-800'}`}>
                          🎮 CHOOSE YOUR ADVENTURE
                        </span>
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          PREMIUM
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${cyoaMode ? 'text-purple-200' : 'text-gray-600'}`}>
                        You control the battle! Make choices that change how the fight unfolds.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Generate Button */}
              <div className="mt-8 text-center">
                <motion.button
                  onClick={handleGenerate}
                  disabled={!canGenerate || loading}
                  whileHover={canGenerate ? { scale: 1.05, boxShadow: '0 0 30px rgba(255,215,0,0.5)' } : {}}
                  whileTap={canGenerate ? { scale: 0.95 } : {}}
                  className={`px-6 sm:px-12 py-4 sm:py-5 rounded-xl font-bangers text-lg sm:text-2xl md:text-3xl tracking-wide transition-all ${
                    canGenerate && !loading
                      ? 'bg-gradient-to-b from-[#32CD32] to-[#228B22] text-white border-4 border-[#FFD700] shadow-xl cursor-pointer'
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed border-4 border-gray-500'
                  }`}
                  style={canGenerate ? { textShadow: '2px 2px 0 #000' } : {}}
                >
                  {loading ? '⏳ CREATING...' : '📖 CREATE MY BOOK!'}
                </motion.button>
                
                {effectiveA && effectiveB && effectiveA.toLowerCase() === effectiveB.toLowerCase() && (
                  <p className="mt-3 text-[#CC0000] font-bold bg-white inline-block px-4 py-1 rounded">⚠️ Pick two DIFFERENT animals!</p>
                )}
                {validationError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-[#CC0000] font-bold bg-white inline-block px-4 py-2 rounded"
                  >
                    ⚠️ {validationError}
                  </motion.p>
                )}
                <p className="mt-4 text-white/70">Free to create • No signup needed</p>
                {(customA || customB) && (
                  <p className="mt-2 text-orange-300/80 text-sm">
                    🧪 Custom creatures are experimental — results may vary!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog CTA */}
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

      {/* What's Inside Section */}
      <section className="py-12 px-4" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-bangers text-4xl text-[#FFD700] text-center mb-8" style={{ textShadow: '3px 3px 0 #000', letterSpacing: '2px' }}>
            📚 WHAT'S INSIDE YOUR BOOK?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🔬', title: 'REAL FACTS', desc: 'Learn each animal\'s size, speed, weapons, and special abilities!', color: '#4CAF50' },
              { icon: '📊', title: 'TALE OF THE TAPE', desc: 'Compare stats side-by-side like a championship matchup!', color: '#FF9800' },
              { icon: '⚔️', title: 'EPIC BATTLE', desc: 'Watch them face off in an exciting illustrated showdown!', color: '#f44336' },
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

      {/* Tournament Mode */}
      <section className="py-10 px-4 bg-gradient-to-r from-amber-900 via-yellow-900 to-orange-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-bangers text-3xl text-[#FFD700] mb-4" style={{ textShadow: '2px 2px 0 #000' }}>
            🏆 TOURNAMENT MODE
          </h2>
          <p className="text-white text-lg mb-6">
            Pick 8 animals and run a bracket tournament to crown the ultimate champion!
          </p>
          <a
            href="/tournament"
            className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bangers text-2xl px-10 py-4 rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all shadow-xl"
          >
            🎮 START TOURNAMENT
          </a>
        </div>
      </section>

      {/* Original Books - Full Amazon Collection */}
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
          
          {/* Book Grid - All Books */}
          <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-[#FF9900] scrollbar-track-white/10">
            <div className="flex gap-5 px-4 min-w-max">
              {[
                { title: 'Lion vs Tiger', asin: '0545175712' },
                { title: 'Killer Whale vs Great White Shark', asin: '0545175739' },
                { title: 'Tyrannosaurus Rex vs Velociraptor', asin: '0545175720' },
                { title: 'Polar Bear vs Grizzly Bear', asin: '0545175747' },
                { title: 'Hammerhead vs Bull Shark', asin: '0545301718' },
                { title: 'Komodo Dragon vs King Cobra', asin: '0545301726' },
                { title: 'Tarantula vs Scorpion', asin: '0545451914' },
                { title: 'Wolverine vs Tasmanian Devil', asin: '0545451906' },
                { title: 'Whale vs Giant Squid', asin: '0545301734' },
                { title: 'Rhino vs Hippo', asin: '0545451922' },
                { title: 'Lobster vs Crab', asin: '0545681197' },
                { title: 'Rattlesnake vs Secretary Bird', asin: '0545451930' },
                { title: 'Jaguar vs Skunk', asin: '0545946085' },
                { title: 'Alligator vs Python', asin: '0545681200' },
                { title: 'Falcon vs Hawk', asin: '1338320262' },
                { title: 'Hyena vs Honey Badger', asin: '0545946093' },
                { title: 'Triceratops vs Spinosaurus', asin: '0545681219' },
                { title: 'Ultimate Ocean Rumble', asin: '0545681138' },
                { title: 'Ultimate Jungle Rumble', asin: '1338320254' },
                { title: 'Ultimate Dinosaur Rumble', asin: '1338320270' },
                { title: 'Ultimate Bug Rumble', asin: '1338320289' },
                { title: 'Green Ants vs Army Ants', asin: '1338672126' },
                { title: 'Hornet vs Wasp', asin: '1338672134' },
                { title: 'Ultimate Shark Rumble', asin: '1338672142' },
                { title: 'Coyote vs Dingo', asin: '1338745271' },
                { title: 'Biggest Shark vs Monster Crocodile', asin: '1339032139' },
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
                    />
                  </div>
                  <p className="text-white/60 text-xs mt-2 max-w-36 text-center group-hover:text-[#FF9900] transition-colors line-clamp-2">{book.title}</p>
                </a>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-white/50 text-sm mb-4">👆 Scroll to see all 26 books!</p>
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
