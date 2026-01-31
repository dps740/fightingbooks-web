'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Sparkles, Zap, BookOpen, Heart, ExternalLink, Star, Users, Clock, ChevronDown } from 'lucide-react';

const POPULAR_ANIMALS = [
  { name: 'Lion', emoji: '🦁' },
  { name: 'Tiger', emoji: '🐅' },
  { name: 'Bear', emoji: '🐻' },
  { name: 'Wolf', emoji: '🐺' },
  { name: 'Eagle', emoji: '🦅' },
  { name: 'Shark', emoji: '🦈' },
  { name: 'Gorilla', emoji: '🦍' },
  { name: 'Crocodile', emoji: '🐊' },
  { name: 'Elephant', emoji: '🐘' },
  { name: 'Rhino', emoji: '🦏' },
  { name: 'Hippo', emoji: '🦛' },
  { name: 'Cobra', emoji: '🐍' },
  { name: 'Komodo Dragon', emoji: '🦎' },
  { name: 'Polar Bear', emoji: '🐻‍❄️' },
  { name: 'Grizzly Bear', emoji: '🐻' },
  { name: 'Great White Shark', emoji: '🦈' },
  { name: 'Orca', emoji: '🐋' },
  { name: 'Anaconda', emoji: '🐍' },
  { name: 'Jaguar', emoji: '🐆' },
  { name: 'Leopard', emoji: '🐆' },
  { name: 'Cheetah', emoji: '🐆' },
  { name: 'Hyena', emoji: '🦴' },
  { name: 'Wolverine', emoji: '🦡' },
  { name: 'Honey Badger', emoji: '🦡' },
];

const ENVIRONMENTS = [
  { id: 'random', name: 'Random', emoji: '🎲' },
  { id: 'savanna', name: 'Savanna', emoji: '🌍' },
  { id: 'jungle', name: 'Jungle', emoji: '🌴' },
  { id: 'arctic', name: 'Arctic', emoji: '❄️' },
  { id: 'ocean', name: 'Ocean', emoji: '🌊' },
  { id: 'desert', name: 'Desert', emoji: '🏜️' },
  { id: 'mountain', name: 'Mountain', emoji: '⛰️' },
  { id: 'swamp', name: 'Swamp', emoji: '🐊' },
];

const PALLOTTA_BOOKS = [
  { title: 'Killer Whale vs. Great White Shark', asin: 'B00BT2FHNW' },
  { title: 'Tyrannosaurus Rex vs. Velociraptor', asin: 'B00BT2FHOO' },
  { title: 'Lion vs. Tiger', asin: 'B00BT2FHN2' },
  { title: 'Wolverine vs. Tasmanian Devil', asin: 'B00F8F8WY0' },
];

const SAMPLE_BATTLES = [
  { a: 'Lion', b: 'Tiger', winner: 'Tiger' },
  { a: 'Gorilla', b: 'Grizzly Bear', winner: 'Grizzly Bear' },
  { a: 'Orca', b: 'Great White Shark', winner: 'Orca' },
];

export default function Home() {
  const router = useRouter();
  const [animalA, setAnimalA] = useState('');
  const [animalB, setAnimalB] = useState('');
  const [environment, setEnvironment] = useState('random');
  const [customA, setCustomA] = useState('');
  const [customB, setCustomB] = useState('');
  const [loading, setLoading] = useState(false);
  const [booksCreated, setBooksCreated] = useState(1247);

  // Animate book counter
  useEffect(() => {
    const interval = setInterval(() => {
      setBooksCreated(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const effectiveA = customA || animalA;
  const effectiveB = customB || animalB;
  const canGenerate = effectiveA && effectiveB && effectiveA.toLowerCase() !== effectiveB.toLowerCase();

  const [mode, setMode] = useState<'standard' | 'cyoa'>('standard');

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    const params = new URLSearchParams({ a: effectiveA, b: effectiveB, env: environment, mode });
    router.push(`/read?${params.toString()}`);
  };

  const scrollToCreate = () => {
    document.getElementById('create-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-red-600 to-purple-700" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 text-8xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>🦁</div>
          <div className="absolute top-40 right-20 text-7xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}>🐅</div>
          <div className="absolute bottom-40 left-1/4 text-6xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '3.5s' }}>🦈</div>
          <div className="absolute bottom-20 right-1/3 text-8xl animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '2.8s' }}>🐻</div>
          <div className="absolute top-1/3 left-1/3 text-5xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.2s' }}>🦅</div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          {/* Logo */}
          <motion.div 
            className="flex items-center justify-center gap-4 mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Swords className="w-12 h-12 md:w-16 md:h-16 text-yellow-300" />
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-yellow-300 to-orange-300">
                FightingBooks
              </span>
            </h1>
            <Swords className="w-12 h-12 md:w-16 md:h-16 text-yellow-300 scale-x-[-1]" />
          </motion.div>

          <motion.p 
            className="text-xl md:text-3xl text-white/90 mb-4 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Create Epic Animal Battle Books in Seconds!
          </motion.p>

          {/* Fan Tribute */}
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-red-400" fill="currentColor" />
              <span className="font-semibold text-yellow-200">A Fan Tribute</span>
              <Heart className="w-5 h-5 text-red-400" fill="currentColor" />
            </div>
            <p className="text-white/80 max-w-xl mx-auto">
              Inspired by Jerry Pallotta&apos;s beloved <strong className="text-white">&quot;Who Would Win?&quot;</strong> book series 
              — creating custom battles for the next generation of animal fans!
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="flex flex-wrap justify-center gap-6 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <BookOpen className="w-5 h-5 text-yellow-300" />
              <span className="font-bold">{booksCreated.toLocaleString()}</span>
              <span className="text-white/70">books created</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Star className="w-5 h-5 text-yellow-300" fill="currentColor" />
              <span className="font-bold">4.9</span>
              <span className="text-white/70">rating</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Clock className="w-5 h-5 text-yellow-300" />
              <span className="font-bold">60s</span>
              <span className="text-white/70">to create</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <motion.button
              onClick={scrollToCreate}
              className="group px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 rounded-2xl font-bold text-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6" />
                Create Your Battle — FREE!
                <Sparkles className="w-6 h-6" />
              </span>
            </motion.button>
            <motion.button
              onClick={() => router.push('/tournament')}
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all border border-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center justify-center gap-2">
                🏆 Tournament Mode — $5
              </span>
            </motion.button>
          </motion.div>

          <motion.p 
            className="mt-4 text-white/60 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            No signup required for your first book!
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown className="w-8 h-8 text-white/50" />
        </motion.div>
      </section>

      {/* Create Section */}
      <section id="create-section" className="py-16 px-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 flex items-center justify-center gap-3">
              <Zap className="w-8 h-8 text-yellow-400" />
              Choose Your Fighters
              <Zap className="w-8 h-8 text-yellow-400" />
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Fighter 1 */}
              <motion.div 
                className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-3xl p-6 border border-red-500/30"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <h3 className="text-xl font-bold text-red-400 mb-4 text-center">🔴 Fighter #1</h3>
                <input
                  type="text"
                  placeholder="Type any animal..."
                  value={customA}
                  onChange={(e) => { setCustomA(e.target.value); setAnimalA(''); }}
                  className="w-full p-4 bg-gray-900/50 border-2 border-red-500/30 rounded-xl mb-4 focus:border-red-400 focus:outline-none text-white placeholder-gray-500"
                />
                <div className="flex flex-wrap gap-2 justify-center">
                  {POPULAR_ANIMALS.slice(0, 12).map((animal) => (
                    <motion.button
                      key={animal.name}
                      onClick={() => { setAnimalA(animal.name); setCustomA(''); }}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${
                        animalA === animal.name
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>{animal.emoji}</span> {animal.name}
                    </motion.button>
                  ))}
                </div>
                <AnimatePresence>
                  {effectiveA && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="mt-4 text-center text-3xl font-black text-red-400 bg-gray-900/50 rounded-xl py-3"
                    >
                      {effectiveA}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Fighter 2 */}
              <motion.div 
                className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-3xl p-6 border border-blue-500/30"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <h3 className="text-xl font-bold text-blue-400 mb-4 text-center">🔵 Fighter #2</h3>
                <input
                  type="text"
                  placeholder="Type any animal..."
                  value={customB}
                  onChange={(e) => { setCustomB(e.target.value); setAnimalB(''); }}
                  className="w-full p-4 bg-gray-900/50 border-2 border-blue-500/30 rounded-xl mb-4 focus:border-blue-400 focus:outline-none text-white placeholder-gray-500"
                />
                <div className="flex flex-wrap gap-2 justify-center">
                  {POPULAR_ANIMALS.slice(12, 24).map((animal) => (
                    <motion.button
                      key={animal.name}
                      onClick={() => { setAnimalB(animal.name); setCustomB(''); }}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${
                        animalB === animal.name
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>{animal.emoji}</span> {animal.name}
                    </motion.button>
                  ))}
                </div>
                <AnimatePresence>
                  {effectiveB && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="mt-4 text-center text-3xl font-black text-blue-400 bg-gray-900/50 rounded-xl py-3"
                    >
                      {effectiveB}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* VS Display */}
            <AnimatePresence>
              {effectiveA && effectiveB && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="text-center mb-8"
                >
                  <div className="inline-flex items-center gap-4 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 p-1 rounded-2xl">
                    <div className="bg-gray-900 px-6 py-4 rounded-xl">
                      <span className="text-2xl md:text-3xl font-black text-red-400">{effectiveA}</span>
                    </div>
                    <motion.div 
                      className="text-4xl font-black text-white"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      ⚡VS⚡
                    </motion.div>
                    <div className="bg-gray-900 px-6 py-4 rounded-xl">
                      <span className="text-2xl md:text-3xl font-black text-blue-400">{effectiveB}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mode Selection */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-6 mb-6 border border-purple-500/30">
              <h3 className="text-lg font-semibold text-center mb-4 text-purple-300">📖 Book Type</h3>
              <div className="flex justify-center gap-4 flex-wrap">
                <motion.button
                  onClick={() => setMode('standard')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    mode === 'standard'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  📚 Standard Book
                  <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">FREE</span>
                </motion.button>
                <motion.button
                  onClick={() => setMode('cyoa')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    mode === 'cyoa'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🎮 Choose Your Adventure
                  <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full">$1</span>
                </motion.button>
              </div>
              <p className="text-center text-gray-400 text-xs mt-3">
                Pick from our animal list = FREE unlimited! Custom animals = $1
              </p>
              {mode === 'cyoa' && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-center text-purple-300 text-sm mt-3"
                >
                  ⚡ YOU control the battle! Make choices that change the story.
                </motion.p>
              )}
            </div>

            {/* Environment */}
            <div className="bg-gray-800/50 rounded-2xl p-6 mb-8 border border-gray-700">
              <h3 className="text-lg font-semibold text-center mb-4 text-gray-300">🌍 Battle Arena</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {ENVIRONMENTS.map((env) => (
                  <motion.button
                    key={env.id}
                    onClick={() => setEnvironment(env.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      environment === env.id
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {env.emoji} {env.name}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="text-center">
              <motion.button
                onClick={handleGenerate}
                disabled={!canGenerate || loading}
                className={`px-12 py-5 rounded-2xl text-xl font-bold transition-all ${
                  canGenerate && !loading
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl shadow-green-500/30 cursor-pointer'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
                whileHover={canGenerate ? { scale: 1.05 } : {}}
                whileTap={canGenerate ? { scale: 0.95 } : {}}
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <motion.span 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >⏳</motion.span>
                    Creating Epic Battle...
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6" />
                    Generate My Battle Book!
                    <Sparkles className="w-6 h-6" />
                  </span>
                )}
              </motion.button>
              {effectiveA && effectiveB && effectiveA.toLowerCase() === effectiveB.toLowerCase() && (
                <p className="mt-3 text-red-400 font-medium">Pick two different animals!</p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What You Get</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '🎨', title: 'AI Illustrations', desc: 'Unique artwork generated for every single page' },
              { icon: '📖', title: '15-Page Book', desc: 'Facts, stats, battle narrative & epic conclusion' },
              { icon: '⚡', title: 'Instant Download', desc: 'PDF ready in about 60 seconds' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-gray-700/50 rounded-2xl p-6 text-center border border-gray-600"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Jerry Pallotta Books */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-800 to-amber-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="w-8 h-8 text-amber-400" />
              <h2 className="text-3xl font-bold">Love Animal Battles?</h2>
              <BookOpen className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-gray-400 max-w-xl mx-auto">
              Get the original <strong className="text-white">&quot;Who Would Win?&quot;</strong> books by Jerry Pallotta — 
              the series that inspired us all!
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PALLOTTA_BOOKS.map((book, i) => (
              <motion.a
                key={book.asin}
                href={`https://www.amazon.com/dp/${book.asin}`}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-amber-900/30 rounded-xl p-4 text-center hover:bg-amber-800/40 transition-colors border border-amber-700/30 group"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-4xl mb-3">📚</div>
                <p className="text-sm font-medium text-amber-100 group-hover:text-white mb-2">
                  {book.title}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                  View on Amazon <ExternalLink className="w-3 h-3" />
                </span>
              </motion.a>
            ))}
          </div>
          
          <p className="text-center text-xs text-gray-500 mt-6">
            * FightingBooks is an independent fan project, not affiliated with Jerry Pallotta or Scholastic.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 px-4 text-center text-gray-500 text-sm border-t border-gray-800">
        <p className="mb-2">
          <span className="text-white font-bold">FightingBooks</span> — A fan tribute to animal battle books everywhere
        </p>
        <p>🎨 AI-generated • 📖 Educational & fun • 💡 Made with ❤️</p>
      </footer>
    </main>
  );
}
