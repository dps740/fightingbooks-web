'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, ChevronRight, ExternalLink, Trophy, Target, Zap, BookOpen } from 'lucide-react';

const POPULAR_ANIMALS = [
  { name: 'Lion', emoji: '🦁' },
  { name: 'Tiger', emoji: '🐅' },
  { name: 'Grizzly Bear', emoji: '🐻' },
  { name: 'Gorilla', emoji: '🦍' },
  { name: 'Great White Shark', emoji: '🦈' },
  { name: 'Saltwater Crocodile', emoji: '🐊' },
  { name: 'African Elephant', emoji: '🐘' },
  { name: 'Polar Bear', emoji: '🐻‍❄️' },
  { name: 'Orca', emoji: '🐋' },
  { name: 'Hippo', emoji: '🦛' },
  { name: 'Rhino', emoji: '🦏' },
  { name: 'Wolf', emoji: '🐺' },
  { name: 'Komodo Dragon', emoji: '🦎' },
  { name: 'Anaconda', emoji: '🐍' },
  { name: 'Eagle', emoji: '🦅' },
  { name: 'Jaguar', emoji: '🐆' },
  { name: 'Honey Badger', emoji: '🦡' },
  { name: 'Wolverine', emoji: '🦡' },
  { name: 'Cape Buffalo', emoji: '🐃' },
  { name: 'King Cobra', emoji: '🐍' },
];

const ENVIRONMENTS = [
  { id: 'neutral', name: 'Neutral Ground', emoji: '⚔️' },
  { id: 'savanna', name: 'African Savanna', emoji: '🌍' },
  { id: 'jungle', name: 'Amazon Jungle', emoji: '🌴' },
  { id: 'arctic', name: 'Arctic Tundra', emoji: '❄️' },
  { id: 'ocean', name: 'Open Ocean', emoji: '🌊' },
  { id: 'swamp', name: 'Swampland', emoji: '🐊' },
];

const PALLOTTA_BOOKS = [
  { title: 'Lion vs. Tiger', asin: 'B00BT2FHN2' },
  { title: 'Killer Whale vs. Great White Shark', asin: 'B00BT2FHNW' },
  { title: 'Tyrannosaurus Rex vs. Velociraptor', asin: 'B00BT2FHOO' },
  { title: 'Polar Bear vs. Grizzly Bear', asin: 'B00BT2FHO4' },
];

export default function Home() {
  const router = useRouter();
  const [animalA, setAnimalA] = useState('');
  const [animalB, setAnimalB] = useState('');
  const [customA, setCustomA] = useState('');
  const [customB, setCustomB] = useState('');
  const [environment, setEnvironment] = useState('neutral');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'standard' | 'cyoa'>('standard');

  const effectiveA = customA || animalA;
  const effectiveB = customB || animalB;
  const canGenerate = effectiveA && effectiveB && effectiveA.toLowerCase() !== effectiveB.toLowerCase();

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    const params = new URLSearchParams({ a: effectiveA, b: effectiveB, env: environment, mode });
    router.push(`/read?${params.toString()}`);
  };

  const scrollToCreate = () => {
    document.getElementById('arena')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero Section - Dark & Dramatic */}
      <section className="relative min-h-screen flex flex-col">
        {/* Top Bar */}
        <nav className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <Swords className="w-8 h-8 text-[#d4af37]" />
            <span className="text-2xl font-black tracking-tight">FIGHTINGBOOKS</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="#arena" className="hover:text-white transition-colors">CREATE</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">HOW IT WORKS</a>
            <a href="#originals" className="hover:text-white transition-colors">ORIGINALS</a>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-6xl w-full">
            {/* Split VS Display */}
            <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 md:gap-8 items-center mb-12">
              {/* Red Corner */}
              <motion.div 
                className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border-l-4 border-[#c41e3a] p-8 text-center"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-xs font-bold text-[#c41e3a] tracking-[0.3em] mb-2">RED CORNER</div>
                <div className="text-6xl mb-4">🦁</div>
                <div className="text-3xl font-black">LION</div>
                <div className="text-sm text-gray-500 mt-2">420 lbs • 10ft length</div>
              </motion.div>

              {/* VS */}
              <motion.div 
                className="text-center py-8"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <div className="text-6xl md:text-8xl font-black text-[#d4af37] tracking-wider" style={{
                  textShadow: '0 0 30px rgba(212,175,55,0.5), 0 0 60px rgba(196,30,58,0.3)'
                }}>
                  VS
                </div>
              </motion.div>

              {/* Blue Corner */}
              <motion.div 
                className="bg-gradient-to-bl from-[#1a1a1a] to-[#0d0d0d] border-r-4 border-[#1e4fc4] p-8 text-center"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-xs font-bold text-[#1e4fc4] tracking-[0.3em] mb-2">BLUE CORNER</div>
                <div className="text-6xl mb-4">🐅</div>
                <div className="text-3xl font-black">TIGER</div>
                <div className="text-sm text-gray-500 mt-2">660 lbs • 12ft length</div>
              </motion.div>
            </div>

            {/* Headline */}
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
                WHO WOULD WIN?
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Create your own epic animal battle books inspired by Jerry Pallotta&apos;s legendary series.
                Real facts. Real science. AI-generated artwork.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <button
                onClick={scrollToCreate}
                className="px-8 py-4 bg-gradient-to-b from-[#c41e3a] to-[#9a1830] border-2 border-[#d4af37] text-white font-bold text-lg uppercase tracking-wider hover:from-[#d42848] hover:to-[#c41e3a] transition-all shadow-lg shadow-red-900/30"
              >
                <span className="flex items-center justify-center gap-3">
                  Create Your Battle
                  <ChevronRight className="w-5 h-5" />
                </span>
              </button>
              <button
                onClick={() => router.push('/tournament')}
                className="px-8 py-4 bg-transparent border-2 border-[#d4af37] text-[#d4af37] font-bold text-lg uppercase tracking-wider hover:bg-[#d4af37] hover:text-black transition-all"
              >
                <span className="flex items-center justify-center gap-3">
                  <Trophy className="w-5 h-5" />
                  Tournament Mode
                </span>
              </button>
            </motion.div>

            <p className="text-center text-gray-600 text-sm mt-6">
              Free for popular matchups • No signup required
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
      </section>

      {/* Create Section */}
      <section id="arena" className="py-20 px-4 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              SELECT YOUR FIGHTERS
            </h2>
            <p className="text-gray-500">Choose two animals and watch them battle</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Red Corner Selection */}
            <div className="bg-[#1a1a1a] border-l-4 border-[#c41e3a] p-6">
              <div className="text-sm font-bold text-[#c41e3a] tracking-[0.2em] mb-4">RED CORNER</div>
              <input
                type="text"
                placeholder="Type any animal..."
                value={customA}
                onChange={(e) => { setCustomA(e.target.value); setAnimalA(''); }}
                className="w-full p-4 bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-gray-600 focus:border-[#c41e3a] focus:outline-none mb-4"
              />
              <div className="flex flex-wrap gap-2">
                {POPULAR_ANIMALS.slice(0, 10).map((animal) => (
                  <button
                    key={animal.name}
                    onClick={() => { setAnimalA(animal.name); setCustomA(''); }}
                    className={`px-3 py-2 text-sm font-medium transition-all ${
                      animalA === animal.name
                        ? 'bg-[#c41e3a] text-white'
                        : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white'
                    }`}
                  >
                    {animal.emoji} {animal.name}
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {effectiveA && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 text-center"
                  >
                    <div className="text-4xl font-black text-[#c41e3a]">{effectiveA.toUpperCase()}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Blue Corner Selection */}
            <div className="bg-[#1a1a1a] border-r-4 border-[#1e4fc4] p-6">
              <div className="text-sm font-bold text-[#1e4fc4] tracking-[0.2em] mb-4 text-right">BLUE CORNER</div>
              <input
                type="text"
                placeholder="Type any animal..."
                value={customB}
                onChange={(e) => { setCustomB(e.target.value); setAnimalB(''); }}
                className="w-full p-4 bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-gray-600 focus:border-[#1e4fc4] focus:outline-none mb-4"
              />
              <div className="flex flex-wrap gap-2 justify-end">
                {POPULAR_ANIMALS.slice(10, 20).map((animal) => (
                  <button
                    key={animal.name}
                    onClick={() => { setAnimalB(animal.name); setCustomB(''); }}
                    className={`px-3 py-2 text-sm font-medium transition-all ${
                      animalB === animal.name
                        ? 'bg-[#1e4fc4] text-white'
                        : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white'
                    }`}
                  >
                    {animal.emoji} {animal.name}
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {effectiveB && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 text-center"
                  >
                    <div className="text-4xl font-black text-[#1e4fc4]">{effectiveB.toUpperCase()}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* VS Display when both selected */}
          <AnimatePresence>
            {effectiveA && effectiveB && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center mb-12"
              >
                <div className="inline-flex items-center gap-6 bg-[#1a1a1a] border border-[#d4af37] px-8 py-4">
                  <span className="text-2xl font-black text-[#c41e3a]">{effectiveA.toUpperCase()}</span>
                  <span className="text-3xl font-black text-[#d4af37]">VS</span>
                  <span className="text-2xl font-black text-[#1e4fc4]">{effectiveB.toUpperCase()}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Environment Selection */}
          <div className="bg-[#141414] border border-[#2a2a2a] p-6 mb-8">
            <div className="text-sm font-bold text-gray-500 tracking-[0.2em] mb-4">BATTLE ARENA</div>
            <div className="flex flex-wrap gap-3">
              {ENVIRONMENTS.map((env) => (
                <button
                  key={env.id}
                  onClick={() => setEnvironment(env.id)}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    environment === env.id
                      ? 'bg-[#d4af37] text-black'
                      : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]'
                  }`}
                >
                  {env.emoji} {env.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div className="bg-[#141414] border border-[#2a2a2a] p-6 mb-8">
            <div className="text-sm font-bold text-gray-500 tracking-[0.2em] mb-4">BOOK TYPE</div>
            <div className="flex gap-4">
              <button
                onClick={() => setMode('standard')}
                className={`flex-1 p-4 text-center transition-all border ${
                  mode === 'standard'
                    ? 'bg-[#c41e3a] border-[#d4af37] text-white'
                    : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]'
                }`}
              >
                <div className="font-bold mb-1">STANDARD BOOK</div>
                <div className="text-sm opacity-70">15-page battle narrative</div>
                <div className="text-xs mt-2 text-green-400">FREE</div>
              </button>
              <button
                onClick={() => setMode('cyoa')}
                className={`flex-1 p-4 text-center transition-all border ${
                  mode === 'cyoa'
                    ? 'bg-[#1e4fc4] border-[#d4af37] text-white'
                    : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]'
                }`}
              >
                <div className="font-bold mb-1">CHOOSE YOUR PATH</div>
                <div className="text-sm opacity-70">Interactive battle choices</div>
                <div className="text-xs mt-2 text-[#d4af37]">$1</div>
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <div className="text-center">
            <motion.button
              onClick={handleGenerate}
              disabled={!canGenerate || loading}
              className={`px-12 py-5 text-xl font-bold uppercase tracking-wider transition-all ${
                canGenerate && !loading
                  ? 'bg-gradient-to-b from-[#c41e3a] to-[#9a1830] border-2 border-[#d4af37] text-white hover:from-[#d42848] hover:to-[#c41e3a] shadow-lg shadow-red-900/50 cursor-pointer'
                  : 'bg-[#2a2a2a] border-2 border-[#3a3a3a] text-gray-600 cursor-not-allowed'
              }`}
              whileHover={canGenerate ? { scale: 1.02 } : {}}
              whileTap={canGenerate ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >⏳</motion.div>
                  Generating Battle...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <Zap className="w-6 h-6" />
                  Generate Battle Book
                  <Zap className="w-6 h-6" />
                </span>
              )}
            </motion.button>
            {effectiveA && effectiveB && effectiveA.toLowerCase() === effectiveB.toLowerCase() && (
              <p className="mt-4 text-[#c41e3a] font-medium">Select two different animals</p>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12 tracking-tight">HOW IT WORKS</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'PICK YOUR FIGHTERS', desc: 'Choose any two animals from our list or type your own' },
              { num: '02', title: 'WE RESEARCH THE FACTS', desc: 'AI analyzes real stats: size, speed, weapons, tactics' },
              { num: '03', title: 'GET YOUR BATTLE BOOK', desc: '15-page illustrated book with facts and narrative' },
            ].map((step) => (
              <div key={step.num} className="bg-[#141414] border border-[#2a2a2a] p-8">
                <div className="text-5xl font-black text-[#d4af37] mb-4">{step.num}</div>
                <div className="text-xl font-bold mb-3">{step.title}</div>
                <div className="text-gray-500">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Original Books */}
      <section id="originals" className="py-20 px-4 bg-[#0d0d0d] border-t border-[#2a2a2a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="w-8 h-8 text-[#d4af37]" />
              <h2 className="text-3xl font-black tracking-tight">THE ORIGINAL SERIES</h2>
              <BookOpen className="w-8 h-8 text-[#d4af37]" />
            </div>
            <p className="text-gray-500 max-w-xl mx-auto">
              Inspired by Jerry Pallotta&apos;s &quot;Who Would Win?&quot; — the book series that started it all.
              Support the original!
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PALLOTTA_BOOKS.map((book) => (
              <a
                key={book.asin}
                href={`https://www.amazon.com/dp/${book.asin}?tag=fightingbooks-20`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1a1a1a] border border-[#2a2a2a] p-6 text-center hover:border-[#d4af37] transition-all group"
              >
                <div className="text-4xl mb-4">📚</div>
                <div className="font-bold text-sm mb-2 group-hover:text-[#d4af37] transition-colors">
                  {book.title}
                </div>
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                  Amazon <ExternalLink className="w-3 h-3" />
                </div>
              </a>
            ))}
          </div>
          
          <p className="text-center text-xs text-gray-600 mt-8">
            FightingBooks is an independent fan project. Not affiliated with Jerry Pallotta or Scholastic.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-[#0a0a0a] border-t border-[#2a2a2a]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-[#d4af37]" />
            <span className="font-bold">FIGHTINGBOOKS</span>
          </div>
          <div className="text-sm text-gray-600">
            Educational fan project • AI-generated content
          </div>
        </div>
      </footer>
    </main>
  );
}
