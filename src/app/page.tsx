'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { quickContentCheck, isKnownAnimal, checkRateLimit, incrementRateLimit } from '@/lib/content-moderation';

// High-quality Wikipedia Commons images (reliable, no broken links)
const FIGHTERS = [
  { name: 'Lion', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lion_waiting_in_Namibia.jpg/400px-Lion_waiting_in_Namibia.jpg' },
  { name: 'Tiger', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Walking_tiger_female.jpg/400px-Walking_tiger_female.jpg' },
  { name: 'Grizzly Bear', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/GrizzlyBearJeanBeauworking.jpg/400px-GrizzlyBearJeanBeauworking.jpg' },
  { name: 'Gorilla', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Gorille_des_plaines_de_l%27ouest_%C3%A0_l%27Espace_Zoologique.jpg/400px-Gorille_des_plaines_de_l%27ouest_%C3%A0_l%27Espace_Zoologique.jpg' },
  { name: 'Great White Shark', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/White_shark.jpg/400px-White_shark.jpg' },
  { name: 'Crocodile', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Nile_crocodile_head.jpg/400px-Nile_crocodile_head.jpg' },
  { name: 'Elephant', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/African_Bush_Elephant.jpg/400px-African_Bush_Elephant.jpg' },
  { name: 'Polar Bear', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Polar_Bear_-_Alaska_%28cropped%29.jpg/400px-Polar_Bear_-_Alaska_%28cropped%29.jpg' },
  { name: 'Orca', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Killerwhales_jumping.jpg/400px-Killerwhales_jumping.jpg' },
  { name: 'Hippo', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Portrait_Hippopotamus_in_the_water.jpg/400px-Portrait_Hippopotamus_in_the_water.jpg' },
  { name: 'Komodo Dragon', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Komodo_dragon_with_tongue.jpg/400px-Komodo_dragon_with_tongue.jpg' },
  { name: 'Wolf', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Eurasian_wolf_2.jpg/400px-Eurasian_wolf_2.jpg' },
  { name: 'Anaconda', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Green_anaconda_%28Eunectes_murinus%29.JPG/400px-Green_anaconda_%28Eunectes_murinus%29.JPG' },
  { name: 'Eagle', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/About_to_Launch_%2826075320352%29.jpg/400px-About_to_Launch_%2826075320352%29.jpg' },
  { name: 'Jaguar', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Standing_jaguar.jpg/400px-Standing_jaguar.jpg' },
  { name: 'Rhino', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Diceros_bicornis.jpg/400px-Diceros_bicornis.jpg' },
  { name: 'King Cobra', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/12_-_The_Mystical_King_Cobra_and_Coffee_Forests.jpg/400px-12_-_The_Mystical_King_Cobra_and_Coffee_Forests.jpg' },
  { name: 'Wolverine', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Gulo_gulo_2.jpg/400px-Gulo_gulo_2.jpg' },
  { name: 'Honey Badger', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Honey_badger.jpg/400px-Honey_badger.jpg' },
];

// Keep old array for compatibility
const POPULAR_ANIMALS = FIGHTERS;

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

      {/* Animal Selection - Book Page Style */}
      <section className="px-4 pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Open Book Container */}
          <div className="bg-[#f5f0e1] rounded-lg shadow-2xl overflow-hidden" style={{ 
            boxShadow: '0 0 40px rgba(0,0,0,0.4), inset 0 0 80px rgba(139,90,43,0.1)',
            border: '8px solid #8B5A2B'
          }}>
            
            {/* Book Spine / Header */}
            <div className="bg-[#CC0000] py-3 px-6 text-center" style={{ borderBottom: '4px solid #8B5A2B' }}>
              <h2 className="font-bangers text-2xl sm:text-3xl text-[#FFD700]" style={{ textShadow: '2px 2px 0 #000', letterSpacing: '1px' }}>
                PICK YOUR ANIMALS
              </h2>
            </div>

            {/* Two-Page Spread */}
            <div className="grid md:grid-cols-[1fr,auto,1fr]">
              
              {/* LEFT PAGE - First Animal */}
              <div className="p-4 md:p-6 flex flex-col" style={{ 
                background: 'linear-gradient(to right, #e8e0d0 0%, #f5f0e1 100%)',
                borderRight: '1px solid #d4c4a8'
              }}>
                <h3 className="font-bangers text-xl text-[#8B0000] text-center mb-3" style={{ letterSpacing: '1px' }}>
                  FIRST ANIMAL
                </h3>
                {/* Custom Input */}
                <input
                  type="text"
                  placeholder="Type any animal..."
                  value={customA}
                  onChange={(e) => { setCustomA(e.target.value); setAnimalA(''); }}
                  className="w-full p-2 rounded border-2 border-[#8B5A2B] bg-white text-[#333] text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] mb-4"
                />
                {/* Animal Cards - Encyclopedia Style */}
                <div className="h-[400px] overflow-y-auto space-y-3 pr-2 flex-shrink-0" style={{ scrollbarWidth: 'thin' }}>
                  {FIGHTERS.map((fighter, i) => (
                    <button
                      key={`left-${fighter.name}-${i}`}
                      onClick={() => { setAnimalA(fighter.name); setCustomA(''); }}
                      className={`w-full rounded-lg overflow-hidden transition-all ${
                        animalA === fighter.name
                          ? 'ring-4 ring-[#CC0000] shadow-lg'
                          : 'border-2 border-[#8B5A2B]/40 hover:border-[#CC0000]'
                      }`}
                    >
                      {/* Animal Illustration Card */}
                      <div className="bg-white">
                        <div className="aspect-[4/3] relative">
                          <img 
                            src={fighter.img} 
                            alt={fighter.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://placehold.co/400x300/8B5A2B/FFFFFF?text=${encodeURIComponent(fighter.name)}`;
                            }}
                          />
                          {animalA === fighter.name && (
                            <div className="absolute top-2 right-2 w-8 h-8 bg-[#CC0000] rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">✓</span>
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-[#f5f0e1] border-t-2 border-[#8B5A2B]">
                          <span className="font-bangers text-lg text-[#333]">{fighter.name.toUpperCase()}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {/* Selected Display */}
                {effectiveA && (
                  <div className="mt-4 bg-[#CC0000] text-white font-bangers text-xl text-center py-3 rounded border-2 border-[#8B5A2B]">
                    {effectiveA.toUpperCase()}
                  </div>
                )}
              </div>

              {/* CENTER BINDING / VS - Animated! */}
              <div className="hidden md:flex items-center justify-center px-2" style={{ 
                background: 'linear-gradient(to right, #d4c4a8, #c4b498, #d4c4a8)',
                width: '50px'
              }}>
                <motion.div 
                  animate={{ 
                    scale: [1, 1.15, 1],
                    rotate: [0, 5, -5, 0] 
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="bg-[#FFD700] w-14 h-14 rounded-full flex items-center justify-center border-4 border-[#8B0000] shadow-xl"
                  style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.4)' }}
                >
                  <span className="font-bangers text-xl text-[#8B0000]" style={{ textShadow: '1px 1px 0 #FFD700' }}>VS</span>
                </motion.div>
              </div>
              
              {/* Mobile VS divider - Animated! */}
              <div className="md:hidden py-4 text-center bg-[#d4c4a8]">
                <motion.span 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="inline-block font-bangers text-2xl text-[#8B0000] bg-[#FFD700] px-5 py-2 rounded-full border-4 border-[#8B0000] shadow-lg"
                >
                  VS
                </motion.span>
              </div>

              {/* RIGHT PAGE - Second Animal */}
              <div className="p-4 md:p-6 flex flex-col" style={{ 
                background: 'linear-gradient(to left, #e8e0d0 0%, #f5f0e1 100%)',
                borderLeft: '1px solid #d4c4a8'
              }}>
                <h3 className="font-bangers text-xl text-[#0066CC] text-center mb-3" style={{ letterSpacing: '1px' }}>
                  SECOND ANIMAL
                </h3>
                {/* Custom Input */}
                <input
                  type="text"
                  placeholder="Type any animal..."
                  value={customB}
                  onChange={(e) => { setCustomB(e.target.value); setAnimalB(''); }}
                  className="w-full p-2 rounded border-2 border-[#8B5A2B] bg-white text-[#333] text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC] mb-4"
                />
                {/* Animal Cards - Encyclopedia Style */}
                <div className="h-[400px] overflow-y-auto space-y-3 pr-2 flex-shrink-0" style={{ scrollbarWidth: 'thin' }}>
                  {FIGHTERS.map((fighter, i) => (
                    <button
                      key={`right-${fighter.name}-${i}`}
                      onClick={() => { setAnimalB(fighter.name); setCustomB(''); }}
                      className={`w-full rounded-lg overflow-hidden transition-all ${
                        animalB === fighter.name
                          ? 'ring-4 ring-[#0066CC] shadow-lg'
                          : 'border-2 border-[#8B5A2B]/40 hover:border-[#0066CC]'
                      }`}
                    >
                      {/* Animal Illustration Card */}
                      <div className="bg-white">
                        <div className="aspect-[4/3] relative">
                          <img 
                            src={fighter.img} 
                            alt={fighter.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://placehold.co/400x300/8B5A2B/FFFFFF?text=${encodeURIComponent(fighter.name)}`;
                            }}
                          />
                          {animalB === fighter.name && (
                            <div className="absolute top-2 right-2 w-8 h-8 bg-[#0066CC] rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">✓</span>
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-[#f5f0e1] border-t-2 border-[#8B5A2B]">
                          <span className="font-bangers text-lg text-[#333]">{fighter.name.toUpperCase()}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {/* Selected Display */}
                {effectiveB && (
                  <div className="mt-4 bg-[#0066CC] text-white font-bangers text-xl text-center py-3 rounded border-2 border-[#8B5A2B]">
                    {effectiveB.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Matchup Display - Book Style */}
            {effectiveA && effectiveB && (
              <div className="py-4 text-center bg-[#d4c4a8] border-t-2 border-[#8B5A2B]">
                <span className="font-bangers text-2xl md:text-3xl text-[#333]">
                  <span className="text-[#CC0000]">{effectiveA.toUpperCase()}</span>
                  <span className="text-[#8B5A2B] mx-3">VS</span>
                  <span className="text-[#0066CC]">{effectiveB.toUpperCase()}</span>
                </span>
              </div>
            )}

            {/* Choose Your Adventure Toggle - Book Page Style */}
            <div className="p-4 bg-[#f5f0e1] border-t-2 border-[#8B5A2B]">
              <button
                onClick={() => setCyoaMode(!cyoaMode)}
                className={`w-full max-w-md mx-auto block p-4 rounded-lg border-2 transition-all ${
                  cyoaMode 
                    ? 'bg-[#CC0000] border-[#8B5A2B] text-white' 
                    : 'bg-white border-[#8B5A2B] text-[#333] hover:bg-[#f5f0e1]'
                }`}
              >
                <div className="font-bangers text-xl mb-1" style={cyoaMode ? { color: '#FFD700' } : {}}>
                  📖 CHOOSE YOUR ADVENTURE MODE
                </div>
                <div className="text-sm opacity-80">
                  {cyoaMode ? '✓ ACTIVE - You\'ll make 3 battle decisions!' : 'Tap to enable interactive story mode'}
                </div>
              </button>
            </div>

            {/* Create Book Button - Inside the book */}
            <div className="p-6 bg-[#CC0000] text-center" style={{ borderTop: '4px solid #8B5A2B' }}>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || loading}
                className={`px-8 sm:px-12 py-4 rounded-lg font-bangers text-xl sm:text-2xl md:text-3xl transition-all ${
                  canGenerate && !loading
                    ? 'bg-[#FFD700] text-[#8B0000] border-4 border-[#8B5A2B] shadow-lg hover:bg-yellow-300 cursor-pointer'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed border-4 border-gray-500'
                }`}
              >
                {loading ? '⏳ CREATING...' : cyoaMode ? '📖 START ADVENTURE!' : '📖 CREATE MY BOOK!'}
              </button>
              
              {effectiveA && effectiveB && effectiveA.toLowerCase() === effectiveB.toLowerCase() && (
                <p className="mt-3 text-white font-bold bg-[#8B0000] inline-block px-4 py-1 rounded">⚠️ Pick two DIFFERENT animals!</p>
              )}
              {validationError && (
                <p className="mt-3 text-white font-bold bg-[#8B0000] inline-block px-4 py-2 rounded">
                  ⚠️ {validationError}
                </p>
              )}
              <p className="mt-4 text-white/90">Free to create • No signup needed</p>
              {(customA || customB) && (
                <p className="mt-2 text-[#FFD700]/80 text-sm">
                  🧪 Custom creatures are experimental — results may vary!
                </p>
              )}
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
