'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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

  const effectiveA = customA || animalA;
  const effectiveB = customB || animalB;
  const canGenerate = effectiveA && effectiveB && effectiveA.toLowerCase() !== effectiveB.toLowerCase();

  const handleGenerate = () => {
    if (!canGenerate) return;
    setLoading(true);
    const params = new URLSearchParams({ a: effectiveA, b: effectiveB, env: 'neutral', mode: 'standard' });
    router.push(`/read?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-400 via-sky-500 to-sky-600 font-comic">
      {/* Hero Section - Book Cover Style */}
      <section className="relative py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* WHO WOULD WIN Banner */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block"
          >
            <div className="bg-yellow-400 border-4 border-red-600 rounded-lg px-8 py-4 shadow-xl transform -rotate-1">
              <h1 className="font-bangers text-4xl md:text-6xl text-red-600 tracking-wider" style={{ textShadow: '3px 3px 0 #000' }}>
                WHO WOULD WIN?
              </h1>
            </div>
          </motion.div>

          <p className="mt-6 text-xl md:text-2xl text-white font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            Create Your Own Animal Battle Book!
          </p>
          <p className="mt-2 text-white/90">
            Inspired by Jerry Pallotta's bestselling book series
          </p>
        </div>
      </section>

      {/* VS Selection Area */}
      <section className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-500 py-4 px-6">
              <h2 className="font-bangers text-2xl md:text-3xl text-yellow-300 text-center tracking-wide">
                ⚔️ PICK YOUR FIGHTERS! ⚔️
              </h2>
            </div>

            <div className="p-6 md:p-8">
              {/* VS Layout */}
              <div className="grid md:grid-cols-[1fr,auto,1fr] gap-6 items-start">
                {/* Fighter 1 */}
                <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-xl p-5 border-4 border-red-500">
                  <h3 className="font-bangers text-xl text-red-600 text-center mb-4">🔴 FIGHTER #1</h3>
                  <input
                    type="text"
                    placeholder="Type any animal..."
                    value={customA}
                    onChange={(e) => { setCustomA(e.target.value); setAnimalA(''); }}
                    className="w-full p-3 rounded-lg border-2 border-red-300 focus:border-red-500 focus:outline-none text-center font-bold"
                  />
                  <div className="flex flex-wrap gap-2 mt-4 justify-center">
                    {POPULAR_ANIMALS.slice(0, 8).map((animal) => (
                      <button
                        key={animal.name}
                        onClick={() => { setAnimalA(animal.name); setCustomA(''); }}
                        className={`px-3 py-2 rounded-full text-sm font-bold transition-all ${
                          animalA === animal.name
                            ? 'bg-red-500 text-white shadow-lg scale-105'
                            : 'bg-white text-gray-700 hover:bg-red-100 border-2 border-red-200'
                        }`}
                      >
                        {animal.emoji} {animal.name}
                      </button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {effectiveA && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-4 text-center"
                      >
                        <span className="font-bangers text-2xl text-red-600">{effectiveA}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* VS */}
                <div className="flex items-center justify-center">
                  <div className="bg-yellow-400 w-20 h-20 rounded-full flex items-center justify-center border-4 border-red-600 shadow-xl">
                    <span className="font-bangers text-3xl text-red-600">VS</span>
                  </div>
                </div>

                {/* Fighter 2 */}
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-5 border-4 border-blue-500">
                  <h3 className="font-bangers text-xl text-blue-600 text-center mb-4">🔵 FIGHTER #2</h3>
                  <input
                    type="text"
                    placeholder="Type any animal..."
                    value={customB}
                    onChange={(e) => { setCustomB(e.target.value); setAnimalB(''); }}
                    className="w-full p-3 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:outline-none text-center font-bold"
                  />
                  <div className="flex flex-wrap gap-2 mt-4 justify-center">
                    {POPULAR_ANIMALS.slice(8, 16).map((animal) => (
                      <button
                        key={animal.name}
                        onClick={() => { setAnimalB(animal.name); setCustomB(''); }}
                        className={`px-3 py-2 rounded-full text-sm font-bold transition-all ${
                          animalB === animal.name
                            ? 'bg-blue-500 text-white shadow-lg scale-105'
                            : 'bg-white text-gray-700 hover:bg-blue-100 border-2 border-blue-200'
                        }`}
                      >
                        {animal.emoji} {animal.name}
                      </button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {effectiveB && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-4 text-center"
                      >
                        <span className="font-bangers text-2xl text-blue-600">{effectiveB}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Matchup Preview */}
              <AnimatePresence>
                {effectiveA && effectiveB && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 text-center"
                  >
                    <div className="inline-block bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 p-1 rounded-xl">
                      <div className="bg-white px-8 py-4 rounded-lg">
                        <span className="font-bangers text-2xl">
                          <span className="text-red-600">{effectiveA}</span>
                          <span className="text-yellow-600 mx-3">VS</span>
                          <span className="text-blue-600">{effectiveB}</span>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generate Button */}
              <div className="mt-8 text-center">
                <motion.button
                  onClick={handleGenerate}
                  disabled={!canGenerate || loading}
                  whileHover={canGenerate ? { scale: 1.05 } : {}}
                  whileTap={canGenerate ? { scale: 0.95 } : {}}
                  className={`px-10 py-5 rounded-full font-bangers text-2xl tracking-wider shadow-xl transition-all ${
                    canGenerate && !loading
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? '⏳ Creating Book...' : '📖 CREATE MY BATTLE BOOK!'}
                </motion.button>
                {effectiveA && effectiveB && effectiveA.toLowerCase() === effectiveB.toLowerCase() && (
                  <p className="mt-3 text-red-500 font-bold">Pick two different animals!</p>
                )}
                <p className="mt-3 text-gray-500 text-sm">FREE to create • No signup required</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-bangers text-3xl text-white text-center mb-8" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            WHAT'S INSIDE YOUR BOOK?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '📚', title: 'REAL FACTS', desc: 'Learn about each animal\'s size, speed, weapons, and special abilities!' },
              { icon: '📊', title: 'TALE OF THE TAPE', desc: 'Compare stats side-by-side like a real championship matchup!' },
              { icon: '⚔️', title: 'EPIC BATTLE', desc: 'Watch the animals face off in an exciting battle narrative!' },
            ].map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 text-center shadow-xl border-4 border-yellow-400">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="font-bangers text-xl text-red-600 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Original Books Section */}
      <section className="py-12 px-4 bg-gradient-to-b from-transparent to-sky-700">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border-2 border-white/30">
            <h2 className="font-bangers text-2xl text-yellow-300 mb-4">❤️ LOVE ANIMAL BATTLES?</h2>
            <p className="text-white mb-6">
              Check out Jerry Pallotta's original <strong>"Who Would Win?"</strong> book series!
              Over 26 books with amazing illustrations by Rob Bolster.
            </p>
            <a
              href="https://jerrypallotta.com/book-store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-yellow-400 text-red-600 font-bangers text-xl px-8 py-3 rounded-full hover:bg-yellow-300 transition-colors shadow-lg"
            >
              📚 Visit Jerry's Book Store
            </a>
            <p className="mt-4 text-white/70 text-sm">
              FightingBooks is an independent fan project, not affiliated with Jerry Pallotta or Scholastic.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 bg-sky-800 text-center">
        <p className="text-white/70 text-sm">
          Made with ❤️ for animal fans everywhere • AI-generated educational content
        </p>
      </footer>

      {/* Global Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap');
        .font-bangers { font-family: 'Bangers', cursive; }
        .font-comic { font-family: 'Comic Neue', cursive; }
      `}</style>
    </main>
  );
}
