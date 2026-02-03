'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Swords, X, Plus, Play, Crown, Zap, Sparkles } from 'lucide-react';

const SUGGESTED_ANIMALS = [
  { name: 'Lion', emoji: '🦁' },
  { name: 'Tiger', emoji: '🐅' },
  { name: 'Bear', emoji: '🐻' },
  { name: 'Wolf', emoji: '🐺' },
  { name: 'Gorilla', emoji: '🦍' },
  { name: 'Shark', emoji: '🦈' },
  { name: 'Crocodile', emoji: '🐊' },
  { name: 'Eagle', emoji: '🦅' },
  { name: 'Elephant', emoji: '🐘' },
  { name: 'Rhino', emoji: '🦏' },
  { name: 'Hippo', emoji: '🦛' },
  { name: 'Cobra', emoji: '🐍' },
  { name: 'Orca', emoji: '🐋' },
  { name: 'Jaguar', emoji: '🐆' },
  { name: 'Polar Bear', emoji: '🐻‍❄️' },
  { name: 'Komodo Dragon', emoji: '🦎' },
];

interface TournamentState {
  fighters: string[];
  bracket: {
    round1: (string | null)[][];
    semis: (string | null)[][];
    final: (string | null)[];
    winner: string | null;
  };
  currentBattle: number;
  mode: 'standard' | 'cyoa';
}

export default function TournamentPage() {
  const router = useRouter();
  const [fighters, setFighters] = useState<string[]>([]);
  const [customAnimal, setCustomAnimal] = useState('');
  const [mode, setMode] = useState<'standard' | 'cyoa'>('standard');
  const [started, setStarted] = useState(false);
  const [bracket, setBracket] = useState<TournamentState['bracket'] | null>(null);
  const [currentMatch, setCurrentMatch] = useState(0);

  const addFighter = (name: string) => {
    if (fighters.length < 8 && !fighters.includes(name)) {
      setFighters([...fighters, name]);
    }
  };

  const removeFighter = (name: string) => {
    setFighters(fighters.filter(f => f !== name));
  };

  const addCustom = () => {
    if (customAnimal.trim() && fighters.length < 8) {
      addFighter(customAnimal.trim());
      setCustomAnimal('');
    }
  };

  const shuffleAndStart = () => {
    // Shuffle fighters
    const shuffled = [...fighters].sort(() => Math.random() - 0.5);
    
    // Create bracket
    const newBracket: TournamentState['bracket'] = {
      round1: [
        [shuffled[0], shuffled[1]],
        [shuffled[2], shuffled[3]],
        [shuffled[4], shuffled[5]],
        [shuffled[6], shuffled[7]],
      ],
      semis: [
        [null, null],
        [null, null],
      ],
      final: [null, null],
      winner: null,
    };
    
    setBracket(newBracket);
    setStarted(true);
    setCurrentMatch(0);
  };

  const startCurrentBattle = () => {
    if (!bracket) return;
    
    let matchup: [string, string] | null = null;
    
    // Determine which match we're on
    if (currentMatch < 4) {
      // Round 1
      const [a, b] = bracket.round1[currentMatch];
      if (a && b) matchup = [a, b];
    } else if (currentMatch < 6) {
      // Semis
      const [a, b] = bracket.semis[currentMatch - 4];
      if (a && b) matchup = [a, b];
    } else {
      // Final
      const [a, b] = bracket.final;
      if (a && b) matchup = [a, b];
    }
    
    if (matchup) {
      // Save tournament state and go to battle
      localStorage.setItem('tournament', JSON.stringify({
        fighters,
        bracket,
        currentBattle: currentMatch,
        mode,
      }));
      
      router.push(`/read?a=${encodeURIComponent(matchup[0])}&b=${encodeURIComponent(matchup[1])}&mode=${mode}&tournament=true`);
    }
  };

  const canStart = fighters.length === 8;
  const matchLabels = ['Match 1', 'Match 2', 'Match 3', 'Match 4', 'Semi 1', 'Semi 2', 'FINAL'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-amber-900 to-orange-900 text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-white/70 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-2xl font-bold">Tournament Mode</h1>
          </div>
          <div className="text-yellow-400 font-bold">$5</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!started ? (
          <>
            {/* Fighter Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/30 backdrop-blur-sm rounded-3xl p-6 mb-8 border border-white/10"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                Select 8 Champions
                <span className="ml-auto text-lg text-yellow-400">{fighters.length}/8</span>
              </h2>

              {/* Selected Fighters */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    layout
                    className={`aspect-square rounded-xl flex items-center justify-center text-center p-2 ${
                      fighters[i]
                        ? 'bg-gradient-to-br from-amber-600 to-orange-700 border-2 border-yellow-400'
                        : 'bg-white/5 border-2 border-dashed border-white/20'
                    }`}
                  >
                    {fighters[i] ? (
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <button
                          onClick={() => removeFighter(fighters[i])}
                          className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 hover:bg-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="text-3xl mb-1">
                          {SUGGESTED_ANIMALS.find(a => a.name === fighters[i])?.emoji || '🦴'}
                        </span>
                        <span className="text-xs font-medium">{fighters[i]}</span>
                      </div>
                    ) : (
                      <Plus className="w-8 h-8 text-white/30" />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Custom Animal Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={customAnimal}
                  onChange={(e) => setCustomAnimal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                  placeholder="Type any animal..."
                  className="flex-grow p-3 bg-white/10 border border-white/20 rounded-xl focus:border-yellow-400 focus:outline-none"
                />
                <button
                  onClick={addCustom}
                  disabled={!customAnimal.trim() || fighters.length >= 8}
                  className="px-4 py-3 bg-yellow-500 text-black rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400"
                >
                  Add
                </button>
              </div>

              {/* Quick Select */}
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_ANIMALS.filter(a => !fighters.includes(a.name)).slice(0, 12).map((animal) => (
                  <motion.button
                    key={animal.name}
                    onClick={() => addFighter(animal.name)}
                    disabled={fighters.length >= 8}
                    className="px-3 py-2 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {animal.emoji} {animal.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Mode Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-black/30 backdrop-blur-sm rounded-3xl p-6 mb-8 border border-white/10"
            >
              <h2 className="text-xl font-bold mb-4">Battle Mode</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setMode('standard')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    mode === 'standard'
                      ? 'bg-amber-600 border-yellow-400'
                      : 'bg-white/5 border-white/20 hover:border-white/40'
                  }`}
                >
                  <div className="text-2xl mb-2">📚</div>
                  <div className="font-bold">Standard</div>
                  <div className="text-sm text-white/70">Watch the battles unfold</div>
                </button>
                <button
                  onClick={() => setMode('cyoa')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    mode === 'cyoa'
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-400'
                      : 'bg-white/5 border-white/20 hover:border-white/40'
                  }`}
                >
                  <div className="text-2xl mb-2">🎮</div>
                  <div className="font-bold">Choose Your Adventure</div>
                  <div className="text-sm text-white/70">Control every battle!</div>
                </button>
              </div>
            </motion.div>

            {/* Start Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <motion.button
                onClick={shuffleAndStart}
                disabled={!canStart}
                className={`px-12 py-5 rounded-2xl text-xl font-bold transition-all ${
                  canStart
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-2xl shadow-orange-500/30 cursor-pointer'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
                whileHover={canStart ? { scale: 1.05 } : {}}
                whileTap={canStart ? { scale: 0.95 } : {}}
              >
                <span className="flex items-center gap-3">
                  <Trophy className="w-6 h-6" />
                  Start Tournament!
                </span>
              </motion.button>
              {!canStart && (
                <p className="mt-3 text-white/50">Select {8 - fighters.length} more fighter{8 - fighters.length !== 1 ? 's' : ''}</p>
              )}
            </motion.div>
          </>
        ) : (
          /* Tournament Bracket View */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-x-auto"
          >
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Tournament Bracket
            </h2>

            <div className="flex justify-center items-center gap-4 min-w-[800px] py-8">
              {/* Round 1 */}
              <div className="flex flex-col gap-8">
                {bracket?.round1.map((match, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-3 w-48">
                    <div className="text-xs text-white/50 mb-2">Match {i + 1}</div>
                    <div className="flex items-center justify-between mb-2 p-2 bg-black/20 rounded">
                      <span>{match[0]}</span>
                      {bracket.semis[Math.floor(i/2)][i%2] === match[0] && <Crown className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <div className="text-center text-white/30 text-xs">vs</div>
                    <div className="flex items-center justify-between mt-2 p-2 bg-black/20 rounded">
                      <span>{match[1]}</span>
                      {bracket.semis[Math.floor(i/2)][i%2] === match[1] && <Crown className="w-4 h-4 text-yellow-400" />}
                    </div>
                    {currentMatch === i && !bracket.semis[Math.floor(i/2)][i%2] && (
                      <button
                        onClick={startCurrentBattle}
                        className="w-full mt-3 py-2 bg-yellow-500 text-black rounded-lg font-medium text-sm flex items-center justify-center gap-1"
                      >
                        <Play className="w-4 h-4" /> Battle!
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Connector lines */}
              <div className="flex flex-col gap-32 text-yellow-400">
                <Zap className="w-6 h-6" />
                <Zap className="w-6 h-6" />
              </div>

              {/* Semis */}
              <div className="flex flex-col gap-24">
                {bracket?.semis.map((match, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-3 w-48">
                    <div className="text-xs text-white/50 mb-2">Semi-Final {i + 1}</div>
                    <div className="flex items-center justify-between mb-2 p-2 bg-black/20 rounded">
                      <span>{match[0] || '???'}</span>
                      {bracket.final[i] === match[0] && match[0] && <Crown className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <div className="text-center text-white/30 text-xs">vs</div>
                    <div className="flex items-center justify-between mt-2 p-2 bg-black/20 rounded">
                      <span>{match[1] || '???'}</span>
                      {bracket.final[i] === match[1] && match[1] && <Crown className="w-4 h-4 text-yellow-400" />}
                    </div>
                    {currentMatch === i + 4 && match[0] && match[1] && !bracket.final[i] && (
                      <button
                        onClick={startCurrentBattle}
                        className="w-full mt-3 py-2 bg-yellow-500 text-black rounded-lg font-medium text-sm flex items-center justify-center gap-1"
                      >
                        <Play className="w-4 h-4" /> Battle!
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Connector */}
              <Zap className="w-8 h-8 text-yellow-400" />

              {/* Final */}
              <div className="bg-gradient-to-br from-yellow-600 to-amber-700 rounded-xl p-4 w-56 border-2 border-yellow-400">
                <div className="text-sm font-bold text-center mb-3 flex items-center justify-center gap-2">
                  <Trophy className="w-5 h-5" /> FINAL
                </div>
                <div className="flex items-center justify-between mb-2 p-2 bg-black/20 rounded">
                  <span>{bracket?.final[0] || '???'}</span>
                  {bracket?.winner === bracket?.final[0] && bracket?.final[0] && <Crown className="w-4 h-4 text-yellow-300" />}
                </div>
                <div className="text-center text-white/50 text-xs">vs</div>
                <div className="flex items-center justify-between mt-2 p-2 bg-black/20 rounded">
                  <span>{bracket?.final[1] || '???'}</span>
                  {bracket?.winner === bracket?.final[1] && bracket?.final[1] && <Crown className="w-4 h-4 text-yellow-300" />}
                </div>
                {currentMatch === 6 && bracket?.final[0] && bracket?.final[1] && !bracket.winner && (
                  <button
                    onClick={startCurrentBattle}
                    className="w-full mt-3 py-2 bg-white text-black rounded-lg font-bold text-sm flex items-center justify-center gap-1"
                  >
                    <Trophy className="w-4 h-4" /> FINAL BATTLE!
                  </button>
                )}
                {bracket?.winner && (
                  <div className="mt-4 text-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <div className="font-bold text-lg">{bracket.winner}</div>
                    <div className="text-sm text-yellow-200">CHAMPION!</div>
                  </div>
                )}
              </div>
            </div>

            {/* Champion Celebration Modal */}
            <AnimatePresence>
              {showChampion && bracket?.winner && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
                  onClick={() => setShowChampion(false)}
                >
                  <motion.div
                    initial={{ scale: 0.5, rotateY: -180 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    exit={{ scale: 0.5, rotateY: 180 }}
                    transition={{ type: 'spring', duration: 0.8 }}
                    className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 rounded-3xl p-12 max-w-2xl w-full mx-4 border-8 border-yellow-300 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Confetti effect */}
                    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                      {[...Array(50)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ y: -20, x: Math.random() * 100 + '%', rotate: 0 }}
                          animate={{
                            y: '100vh',
                            rotate: Math.random() * 360,
                            transition: {
                              duration: Math.random() * 2 + 3,
                              repeat: Infinity,
                              delay: Math.random() * 2,
                            },
                          }}
                          className="absolute"
                          style={{
                            fontSize: '24px',
                          }}
                        >
                          {['🎉', '🏆', '⭐', '✨', '👑'][Math.floor(Math.random() * 5)]}
                        </motion.div>
                      ))}
                    </div>

                    <div className="text-center relative z-10">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <Trophy className="w-32 h-32 mx-auto text-yellow-200 mb-6 drop-shadow-2xl" />
                      </motion.div>

                      <h2 className="text-6xl font-bold text-white mb-4 drop-shadow-lg" style={{ fontFamily: 'Bangers, cursive', letterSpacing: '3px' }}>
                        TOURNAMENT CHAMPION!
                      </h2>

                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 mb-8 border-4 border-yellow-200">
                        <div className="text-8xl mb-4">
                          {SUGGESTED_ANIMALS.find(a => a.name === bracket.winner)?.emoji || '🏆'}
                        </div>
                        <div className="text-5xl font-bold text-white drop-shadow-lg" style={{ fontFamily: 'Bangers, cursive' }}>
                          {bracket.winner}
                        </div>
                      </div>

                      <div className="flex gap-4 justify-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={startNewTournament}
                          className="px-8 py-4 bg-white text-black rounded-xl font-bold text-xl flex items-center gap-2 shadow-xl"
                          style={{ fontFamily: 'Bangers, cursive' }}
                        >
                          <Sparkles className="w-6 h-6" />
                          New Tournament
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowChampion(false)}
                          className="px-8 py-4 bg-black/30 text-white rounded-xl font-bold text-xl border-2 border-white/50"
                          style={{ fontFamily: 'Bangers, cursive' }}
                        >
                          View Bracket
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
