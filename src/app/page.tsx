'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { quickContentCheck, isKnownAnimal, checkRateLimit, incrementRateLimit } from '@/lib/content-moderation';

// Fighters with high-quality Wikipedia images
const FIGHTERS = [
  { name: 'Lion', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lion_waiting_in_Namibia.jpg/300px-Lion_waiting_in_Namibia.jpg' },
  { name: 'Tiger', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Walking_tiger_female.jpg/300px-Walking_tiger_female.jpg' },
  { name: 'Grizzly Bear', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/GrizzlyBearJeanBeauworking.jpg/300px-GrizzlyBearJeanBeauworking.jpg' },
  { name: 'Polar Bear', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Polar_Bear_-_Alaska_%28cropped%29.jpg/300px-Polar_Bear_-_Alaska_%28cropped%29.jpg' },
  { name: 'Gorilla', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Gorille_des_plaines_de_l%27ouest_%C3%A0_l%27Espace_Zoologique.jpg/300px-Gorille_des_plaines_de_l%27ouest_%C3%A0_l%27Espace_Zoologique.jpg' },
  { name: 'Great White Shark', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/White_shark.jpg/300px-White_shark.jpg' },
  { name: 'Orca', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Killerwhales_jumping.jpg/300px-Killerwhales_jumping.jpg' },
  { name: 'Crocodile', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Nile_crocodile_head.jpg/300px-Nile_crocodile_head.jpg' },
  { name: 'Elephant', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/African_Bush_Elephant.jpg/300px-African_Bush_Elephant.jpg' },
  { name: 'Hippo', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Portrait_Hippopotamus_in_the_water.jpg/300px-Portrait_Hippopotamus_in_the_water.jpg' },
  { name: 'Rhino', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Diceros_bicornis.jpg/300px-Diceros_bicornis.jpg' },
  { name: 'Komodo Dragon', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Komodo_dragon_with_tongue.jpg/300px-Komodo_dragon_with_tongue.jpg' },
  { name: 'King Cobra', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/12_-_The_Mystical_King_Cobra_and_Coffee_Forests.jpg/300px-12_-_The_Mystical_King_Cobra_and_Coffee_Forests.jpg' },
  { name: 'Anaconda', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Green_anaconda_%28Eunectes_murinus%29.JPG/300px-Green_anaconda_%28Eunectes_murinus%29.JPG' },
  { name: 'Wolf', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Eurasian_wolf_2.jpg/300px-Eurasian_wolf_2.jpg' },
  { name: 'Jaguar', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Standing_jaguar.jpg/300px-Standing_jaguar.jpg' },
  { name: 'Leopard', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/African_leopard_male_%28cropped%29.jpg/300px-African_leopard_male_%28cropped%29.jpg' },
  { name: 'Eagle', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/About_to_Launch_%2826075320352%29.jpg/300px-About_to_Launch_%2826075320352%29.jpg' },
  { name: 'Wolverine', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Gulo_gulo_2.jpg/300px-Gulo_gulo_2.jpg' },
  { name: 'Honey Badger', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Honey_badger.jpg/300px-Honey_badger.jpg' },
  { name: 'Moose', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Moose_983.JPG/300px-Moose_983.JPG' },
  { name: 'Cape Buffalo', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/African_buffalo.jpg/300px-African_buffalo.jpg' },
  { name: 'Cassowary', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Casuarius_casuarius_-Lone_Pine_Koala_Sanctuary-8a.jpg/300px-Casuarius_casuarius_-Lone_Pine_Koala_Sanctuary-8a.jpg' },
  { name: 'Python', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Python_molurus_molurus2.jpg/300px-Python_molurus_molurus2.jpg' },
];

export default function Home() {
  const router = useRouter();
  const [animalA, setAnimalA] = useState('');
  const [animalB, setAnimalB] = useState('');
  const [selectingFor, setSelectingFor] = useState<'A' | 'B'>('A');
  const [battleMode, setBattleMode] = useState('standard');
  const [loading, setLoading] = useState(false);

  const selectedA = FIGHTERS.find(f => f.name === animalA);
  const selectedB = FIGHTERS.find(f => f.name === animalB);
  const canGenerate = animalA && animalB && animalA !== animalB;

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
    
    if (battleMode === 'tournament') {
      router.push(`/tournament?seed1=${encodeURIComponent(animalA)}&seed2=${encodeURIComponent(animalB)}`);
    } else {
      const mode = battleMode === 'cyoa' ? 'cyoa' : 'standard';
      router.push(`/read?a=${encodeURIComponent(animalA)}&b=${encodeURIComponent(animalB)}&env=neutral&mode=${mode}`);
    }
  };

  return (
    <main className="min-h-screen font-comic" style={{ background: 'linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)' }}>
      {/* Navigation */}
      <nav className="py-4 px-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span className="text-[#FFD700] font-bangers text-xl">🥊 FightingBooks</span>
          <a href="/blog" className="text-white hover:text-[#FFD700] font-bold transition-colors px-4 py-2 rounded-lg hover:bg-white/10">
            📚 Battle Guides
          </a>
        </div>
      </nav>

      {/* Hero */}
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
        </div>
      </section>

      {/* Fighter Selection - Street Fighter 2 Style */}
      <section className="px-4 pb-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Player Select Header */}
          <div className="text-center mb-4">
            <h2 className="font-bangers text-3xl sm:text-4xl text-[#FFD700]" style={{ textShadow: '3px 3px 0 #000' }}>
              ⚔️ PLAYER SELECT
            </h2>
          </div>

          {/* Side-by-Side: Red Left, Blue Right */}
          <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 mb-6">
            
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
                  <img src={selectedA.img} alt={selectedA.name} className="absolute inset-0 w-full h-full object-cover opacity-90" />
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

            {/* VS Badge */}
            <div className="hidden md:flex items-center justify-center px-2">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-[#FFD700] w-20 h-20 rounded-full flex items-center justify-center border-4 border-[#8B0000] shadow-xl"
              >
                <span className="font-bangers text-3xl text-[#8B0000]">VS</span>
              </motion.div>
            </div>

            {/* Mobile VS */}
            <div className="md:hidden text-center py-2">
              <span className="inline-block font-bangers text-2xl bg-[#FFD700] px-6 py-2 rounded-full border-4 border-[#8B0000]">VS</span>
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
                  <img src={selectedB.img} alt={selectedB.name} className="absolute inset-0 w-full h-full object-cover opacity-90" />
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

          {/* Character Grid */}
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
                  <img src={fighter.img} alt={fighter.name} className="absolute inset-0 w-full h-full object-cover" />
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
              
              {/* Use Your Imagination Card */}
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

          {/* Battle Mode Selection */}
          {canGenerate && (
            <div className="mt-6 space-y-4">
              <h3 className="font-bangers text-2xl text-center text-[#FFD700]">⚔️ CHOOSE YOUR BATTLE MODE</h3>
              
              <div className="grid sm:grid-cols-3 gap-4">
                <button onClick={() => setBattleMode('standard')} className={`p-4 rounded-xl border-3 transition-all ${battleMode === 'standard' ? 'bg-green-600 border-green-800 scale-105 shadow-xl' : 'bg-gray-700 border-gray-600 hover:border-green-500'}`}>
                  <div className="text-4xl mb-2">📖</div>
                  <div className="font-bangers text-xl text-white">CLASSIC</div>
                  <div className="text-sm text-white/80">Epic battle story</div>
                </button>

                <button onClick={() => setBattleMode('cyoa')} className={`p-4 rounded-xl border-3 transition-all ${battleMode === 'cyoa' ? 'bg-purple-600 border-purple-800 scale-105 shadow-xl' : 'bg-gray-700 border-gray-600 hover:border-purple-500'}`}>
                  <div className="text-4xl mb-2">🎮</div>
                  <div className="font-bangers text-xl text-white">INTERACTIVE</div>
                  <div className="text-sm text-white/80">YOU decide!</div>
                </button>

                <button onClick={() => setBattleMode('tournament')} className={`p-4 rounded-xl border-3 transition-all ${battleMode === 'tournament' ? 'bg-orange-600 border-orange-800 scale-105 shadow-xl' : 'bg-gray-700 border-gray-600 hover:border-orange-500'}`}>
                  <div className="text-4xl mb-2">🏆</div>
                  <div className="font-bangers text-xl text-white">TOURNAMENT</div>
                  <div className="text-sm text-white/80">8-fighter bracket</div>
                </button>
              </div>

              <div className="text-center">
                <button onClick={handleGenerate} disabled={loading} className="px-12 py-4 rounded-xl font-bangers text-3xl bg-[#FFD700] text-[#8B0000] border-4 border-[#8B5A2B] shadow-xl hover:bg-yellow-300 hover:scale-105 transition-all disabled:opacity-50">
                  {loading ? '⏳ CREATING...' : '📖 CREATE BOOK!'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* What's Inside */}
      <section className="py-8 px-4 bg-black/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-bangers text-3xl text-[#FFD700] text-center mb-6" style={{ textShadow: '3px 3px 0 #000' }}>📚 WHAT'S INSIDE?</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { icon: '🌍', title: 'HABITAT', color: '#4CAF50' },
              { icon: '🔬', title: 'FACTS', color: '#2196F3' },
              { icon: '📊', title: 'STATS', color: '#FF9800' },
              { icon: '⚔️', title: 'BATTLE', color: '#f44336' },
            ].map((f) => (
              <div key={f.title} className="bg-[#f5f5dc] rounded-xl p-4 text-center border-4" style={{ borderColor: f.color }}>
                <div className="text-5xl mb-2">{f.icon}</div>
                <h3 className="font-bangers text-xl" style={{ color: f.color }}>{f.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-[#0d1f0d] text-center">
        <p className="text-white/50 text-sm">Made with ❤️ for animal fans</p>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap');
        .font-bangers { font-family: 'Bangers', cursive; }
        .font-comic { font-family: 'Comic Neue', cursive; }
      `}</style>
    </main>
  );
}
