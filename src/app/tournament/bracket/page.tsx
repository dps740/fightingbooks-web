'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface TournamentState {
  fighters: string[];
  round1: [string, string][];
  semis: [string | null, string | null][];
  final: [string | null, string | null];
  winner: string | null;
  currentMatch: number;
  mode: 'standard' | 'cyoa';
}

function getImagePath(name: string): string {
  return `/fighters/${name.toLowerCase().replace(/ /g, '-')}.jpg`;
}

export default function BracketPage() {
  const router = useRouter();
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [showChampion, setShowChampion] = useState(false);

  // Load tournament state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tournament');
    if (saved) {
      const state = JSON.parse(saved);
      setTournament(state);
      
      // Check if tournament is complete
      if (state.winner) {
        setShowChampion(true);
      }
    } else {
      // No tournament in progress, go back to home
      router.push('/');
    }
  }, [router]);

  // Check for returning winner from a battle
  useEffect(() => {
    const handleFocus = () => {
      const saved = localStorage.getItem('tournament');
      if (saved) {
        const state = JSON.parse(saved);
        
        // Check if there's a lastWinner to process
        if (state.lastWinner) {
          processWinner(state, state.lastWinner);
        } else {
          setTournament(state);
          if (state.winner) {
            setShowChampion(true);
          }
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    handleFocus(); // Check immediately too
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const processWinner = (state: TournamentState, winner: string) => {
    const newState = { ...state };
    const matchNum = state.currentMatch;
    
    // Determine which round and advance winner
    if (matchNum < 4) {
      // Round 1 - advance to semis
      const semiIndex = Math.floor(matchNum / 2);
      const position = matchNum % 2;
      newState.semis[semiIndex][position] = winner;
      newState.currentMatch = matchNum + 1;
    } else if (matchNum < 6) {
      // Semis - advance to final
      const position = matchNum - 4;
      newState.final[position] = winner;
      newState.currentMatch = matchNum + 1;
    } else if (matchNum === 6) {
      // Final - declare champion!
      newState.winner = winner;
      newState.currentMatch = 7;
      setShowChampion(true);
    }
    
    // Clear lastWinner and save
    delete (newState as any).lastWinner;
    localStorage.setItem('tournament', JSON.stringify(newState));
    setTournament(newState);
  };

  const getCurrentMatchup = (): [string, string] | null => {
    if (!tournament) return null;
    const matchNum = tournament.currentMatch;
    
    if (matchNum < 4) {
      return tournament.round1[matchNum];
    } else if (matchNum < 6) {
      const semi = tournament.semis[matchNum - 4];
      if (semi[0] && semi[1]) return [semi[0], semi[1]];
    } else if (matchNum === 6) {
      if (tournament.final[0] && tournament.final[1]) {
        return [tournament.final[0], tournament.final[1]];
      }
    }
    return null;
  };

  const startCurrentBattle = () => {
    const matchup = getCurrentMatchup();
    if (!matchup || !tournament) return;
    
    // Save current state
    localStorage.setItem('tournament', JSON.stringify(tournament));
    
    // Navigate to battle
    router.push(`/read?a=${encodeURIComponent(matchup[0])}&b=${encodeURIComponent(matchup[1])}&mode=${tournament.mode}&tournament=true`);
  };

  const startNewTournament = () => {
    localStorage.removeItem('tournament');
    router.push('/');
  };

  const getMatchLabel = (matchNum: number): string => {
    if (matchNum < 4) return `Round 1 - Match ${matchNum + 1}`;
    if (matchNum < 6) return `Semi-Final ${matchNum - 3}`;
    if (matchNum === 6) return 'The Final';
    return 'Tournament Complete';
  };

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-yellow-900 to-orange-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading tournament...</div>
      </div>
    );
  }

  const currentMatchup = getCurrentMatchup();
  const isComplete = tournament.winner !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-yellow-900 to-orange-900 text-white p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-white/70 hover:text-white transition-colors"
          >
            ← Back to Home
          </button>
          <div className="flex items-center gap-3">
            <span className="text-4xl">🏆</span>
            <h1 className="font-bangers text-3xl text-[#FFD700]" style={{ textShadow: '2px 2px 0 #000' }}>
              TOURNAMENT BRACKET
            </h1>
          </div>
          <div className="text-[#FFD700] font-bold">
            {tournament.mode === 'cyoa' ? '🎭 Adventure' : '📖 Classic'}
          </div>
        </div>

        {/* Current Match Banner */}
        {!isComplete && currentMatchup && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-900 via-yellow-900 to-blue-900 rounded-xl p-6 mb-6 border-4 border-[#FFD700]"
          >
            <p className="text-center text-[#FFD700] font-bangers text-xl mb-4">
              {getMatchLabel(tournament.currentMatch)}
            </p>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <img 
                  src={getImagePath(currentMatchup[0])} 
                  alt={currentMatchup[0]}
                  className="w-24 h-24 rounded-full object-cover border-4 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                />
                <p className="font-bangers text-xl mt-2">{currentMatchup[0]}</p>
              </div>
              <div className="font-bangers text-5xl text-[#FFD700]" style={{ textShadow: '0 0 20px rgba(255,215,0,0.8)' }}>
                VS
              </div>
              <div className="text-center">
                <img 
                  src={getImagePath(currentMatchup[1])} 
                  alt={currentMatchup[1]}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                />
                <p className="font-bangers text-xl mt-2">{currentMatchup[1]}</p>
              </div>
            </div>
            <div className="text-center mt-6">
              <button
                onClick={startCurrentBattle}
                className="px-12 py-4 rounded-xl font-bangers text-3xl bg-gradient-to-b from-yellow-400 to-orange-500 text-red-900 border-4 border-yellow-600 shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-105 hover:shadow-[0_0_40px_rgba(255,215,0,0.7)] transition-all duration-300"
              >
                ⚔️ START BATTLE
              </button>
            </div>
          </motion.div>
        )}

        {/* Bracket Display */}
        <div className="bg-black/30 rounded-xl p-6 overflow-x-auto">
          <div className="flex justify-center items-center gap-4 min-w-[800px]">
            
            {/* Round 1 */}
            <div className="flex flex-col gap-8">
              {tournament.round1.map((match, i) => {
                const winner = tournament.semis[Math.floor(i / 2)][i % 2];
                const isCurrent = tournament.currentMatch === i;
                return (
                  <div 
                    key={i} 
                    className={`bg-white/10 rounded-xl p-3 w-48 ${isCurrent ? 'ring-2 ring-[#FFD700]' : ''}`}
                  >
                    <div className="text-xs text-white/50 mb-2">Match {i + 1}</div>
                    <div className={`flex items-center gap-2 p-2 rounded ${winner === match[0] ? 'bg-green-900/50' : 'bg-black/20'}`}>
                      <img src={getImagePath(match[0])} alt={match[0]} className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-sm truncate flex-1">{match[0]}</span>
                      {winner === match[0] && <span className="text-[#FFD700]">👑</span>}
                    </div>
                    <div className="text-center text-white/30 text-xs my-1">vs</div>
                    <div className={`flex items-center gap-2 p-2 rounded ${winner === match[1] ? 'bg-green-900/50' : 'bg-black/20'}`}>
                      <img src={getImagePath(match[1])} alt={match[1]} className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-sm truncate flex-1">{match[1]}</span>
                      {winner === match[1] && <span className="text-[#FFD700]">👑</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Connector */}
            <div className="flex flex-col gap-32 text-[#FFD700] text-2xl">
              <span>→</span>
              <span>→</span>
            </div>

            {/* Semi Finals */}
            <div className="flex flex-col gap-24">
              {tournament.semis.map((match, i) => {
                const winner = tournament.final[i];
                const isCurrent = tournament.currentMatch === i + 4;
                const isReady = match[0] && match[1];
                return (
                  <div 
                    key={i} 
                    className={`bg-white/10 rounded-xl p-3 w-48 ${isCurrent ? 'ring-2 ring-[#FFD700]' : ''}`}
                  >
                    <div className="text-xs text-white/50 mb-2">Semi-Final {i + 1}</div>
                    <div className={`flex items-center gap-2 p-2 rounded ${winner === match[0] ? 'bg-green-900/50' : 'bg-black/20'}`}>
                      {match[0] ? (
                        <>
                          <img src={getImagePath(match[0])} alt={match[0]} className="w-8 h-8 rounded-full object-cover" />
                          <span className="text-sm truncate flex-1">{match[0]}</span>
                          {winner === match[0] && <span className="text-[#FFD700]">👑</span>}
                        </>
                      ) : (
                        <span className="text-white/30 text-sm">TBD</span>
                      )}
                    </div>
                    <div className="text-center text-white/30 text-xs my-1">vs</div>
                    <div className={`flex items-center gap-2 p-2 rounded ${winner === match[1] ? 'bg-green-900/50' : 'bg-black/20'}`}>
                      {match[1] ? (
                        <>
                          <img src={getImagePath(match[1])} alt={match[1]} className="w-8 h-8 rounded-full object-cover" />
                          <span className="text-sm truncate flex-1">{match[1]}</span>
                          {winner === match[1] && <span className="text-[#FFD700]">👑</span>}
                        </>
                      ) : (
                        <span className="text-white/30 text-sm">TBD</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Connector */}
            <div className="text-[#FFD700] text-2xl">→</div>

            {/* Final */}
            <div className="bg-gradient-to-br from-yellow-600/30 to-amber-700/30 rounded-xl p-4 w-56 border-2 border-[#FFD700]">
              <div className="text-sm font-bold text-center mb-3 text-[#FFD700]">🏆 THE FINAL</div>
              <div className={`flex items-center gap-2 p-2 rounded ${tournament.winner === tournament.final[0] ? 'bg-green-900/50' : 'bg-black/20'}`}>
                {tournament.final[0] ? (
                  <>
                    <img src={getImagePath(tournament.final[0])} alt={tournament.final[0]} className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-sm truncate flex-1">{tournament.final[0]}</span>
                    {tournament.winner === tournament.final[0] && <span className="text-[#FFD700]">👑</span>}
                  </>
                ) : (
                  <span className="text-white/30 text-sm">TBD</span>
                )}
              </div>
              <div className="text-center text-white/30 text-xs my-1">vs</div>
              <div className={`flex items-center gap-2 p-2 rounded ${tournament.winner === tournament.final[1] ? 'bg-green-900/50' : 'bg-black/20'}`}>
                {tournament.final[1] ? (
                  <>
                    <img src={getImagePath(tournament.final[1])} alt={tournament.final[1]} className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-sm truncate flex-1">{tournament.final[1]}</span>
                    {tournament.winner === tournament.final[1] && <span className="text-[#FFD700]">👑</span>}
                  </>
                ) : (
                  <span className="text-white/30 text-sm">TBD</span>
                )}
              </div>
              
              {tournament.winner && (
                <div className="mt-4 text-center">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="font-bangers text-lg text-[#FFD700]">CHAMPION!</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-6 text-center text-white/60">
          {getMatchLabel(tournament.currentMatch)}
          {isComplete && ' - Tournament Complete!'}
        </div>

        {/* New Tournament button */}
        {isComplete && (
          <div className="mt-6 text-center">
            <button
              onClick={startNewTournament}
              className="px-8 py-3 rounded-xl font-bangers text-xl bg-white/10 hover:bg-white/20 border-2 border-white/30 transition-all"
            >
              🔄 New Tournament
            </button>
          </div>
        )}
      </div>

      {/* Champion Celebration Modal */}
      <AnimatePresence>
        {showChampion && tournament?.winner && (
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
                {[...Array(30)].map((_, i) => (
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
                    className="absolute text-2xl"
                  >
                    {['🎉', '🏆', '⭐', '✨', '👑'][Math.floor(Math.random() * 5)]}
                  </motion.div>
                ))}
              </div>

              <div className="text-center relative z-10">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-8xl mb-6"
                >
                  🏆
                </motion.div>

                <h2 className="font-bangers text-5xl text-white mb-4" style={{ textShadow: '3px 3px 0 #000' }}>
                  TOURNAMENT CHAMPION!
                </h2>

                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6 border-4 border-yellow-200">
                  <img 
                    src={getImagePath(tournament.winner)} 
                    alt={tournament.winner}
                    className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-[#FFD700] shadow-xl mb-4"
                  />
                  <div className="font-bangers text-4xl text-white" style={{ textShadow: '2px 2px 0 #000' }}>
                    {tournament.winner.toUpperCase()}
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={startNewTournament}
                    className="px-8 py-4 bg-white text-black rounded-xl font-bangers text-xl shadow-xl hover:scale-105 transition-all"
                  >
                    🔄 New Tournament
                  </button>
                  <button
                    onClick={() => setShowChampion(false)}
                    className="px-8 py-4 bg-black/30 text-white rounded-xl font-bangers text-xl border-2 border-white/50 hover:bg-black/50 transition-all"
                  >
                    View Bracket
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bangers&display=swap');
        .font-bangers { font-family: 'Bangers', cursive; }
      `}</style>
    </div>
  );
}
