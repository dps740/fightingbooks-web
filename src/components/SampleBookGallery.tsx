'use client';

import { motion } from 'framer-motion';

const SAMPLE_BOOKS = [
  {
    animalA: 'Lion',
    animalB: 'Tiger',
    label: '⭐ Fan Favorite',
    color: 'from-red-900 to-orange-900',
    border: 'border-red-500',
  },
  {
    animalA: 'Gorilla',
    animalB: 'Grizzly Bear',
    label: '🥊 Heavyweight Clash',
    color: 'from-green-900 to-emerald-900',
    border: 'border-green-500',
  },
  {
    animalA: 'Great White Shark',
    animalB: 'Orca',
    label: '🌊 Ocean Showdown',
    color: 'from-blue-900 to-cyan-900',
    border: 'border-blue-500',
  },
  {
    animalA: 'Polar Bear',
    animalB: 'Crocodile',
    label: '❄️ Apex Predators',
    color: 'from-gray-800 to-slate-900',
    border: 'border-gray-400',
  },
];

function getImagePath(name: string) {
  return `/fighters/${name.toLowerCase().replace(/ /g, '-')}.jpg`;
}

export default function SampleBookGallery() {
  return (
    <section className="py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-bangers text-3xl sm:text-4xl text-[#FFD700] text-center mb-2" style={{ textShadow: '3px 3px 0 #000' }}>
          TRY A FREE BOOK
        </h2>
        <p className="text-white/70 text-center mb-6">
          Tap to read the full book instantly — no signup needed!
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {SAMPLE_BOOKS.map((book, i) => (
            <motion.a
              key={i}
              href={`/read?a=${encodeURIComponent(book.animalA)}&b=${encodeURIComponent(book.animalB)}&env=neutral&mode=standard`}
              whileHover={{ rotateY: -5, scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.98 }}
              className="relative cursor-pointer group block"
              style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
            >
              {/* Book body with spine and pages */}
              <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
                {/* Spine — left edge gold bar */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-sm z-20"
                  style={{ 
                    background: 'linear-gradient(180deg, #FFD700 0%, #B8860B 50%, #FFD700 100%)',
                    boxShadow: '2px 0 4px rgba(0,0,0,0.4)',
                  }}
                />
                
                {/* Page edges — right side */}
                <div 
                  className="absolute right-0 top-[3px] bottom-[3px] w-[5px] z-10"
                  style={{ 
                    background: 'repeating-linear-gradient(180deg, #f5f0e6 0px, #e8e0d0 1px, #f5f0e6 2px)',
                    boxShadow: '-1px 0 3px rgba(0,0,0,0.2)',
                    borderRadius: '0 2px 2px 0',
                  }}
                />

                {/* Main cover */}
                <div 
                  className={`relative overflow-hidden rounded-sm aspect-[3/4] ${book.border}`}
                  style={{ 
                    borderWidth: '3px',
                    boxShadow: '4px 4px 12px rgba(0,0,0,0.5), -1px -1px 3px rgba(0,0,0,0.2), inset 0 0 20px rgba(0,0,0,0.3)',
                    marginLeft: '6px',
                  }}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${book.color}`} />
                  
                  {/* Animal A (left) */}
                  <div className="absolute inset-0 w-1/2 overflow-hidden">
                    <img 
                      src={getImagePath(book.animalA)} 
                      alt={book.animalA} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  {/* Animal B (right) */}
                  <div className="absolute inset-0 left-1/2 overflow-hidden">
                    <img 
                      src={getImagePath(book.animalB)} 
                      alt={book.animalB} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  
                  {/* Dark vignette overlay for "printed" feel */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />
                  
                  {/* Top banner — series title */}
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent pt-2 pb-6 px-2">
                    <p className="text-[#FFD700] text-[10px] sm:text-xs font-bold text-center tracking-widest uppercase" style={{ textShadow: '1px 1px 2px #000' }}>
                      Who Would Win?
                    </p>
                  </div>
                  
                  {/* FREE ribbon — top right corner */}
                  <div className="absolute top-0 right-0 z-30 overflow-hidden w-20 h-20">
                    <div 
                      className="absolute top-[10px] right-[-28px] w-[110px] text-center rotate-45 font-bangers text-sm tracking-wider py-[2px]"
                      style={{ 
                        background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                        color: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        textShadow: '1px 1px 1px rgba(0,0,0,0.3)',
                      }}
                    >
                      FREE
                    </div>
                  </div>

                  {/* Center VS badge — embossed look */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                      className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center"
                      style={{ 
                        background: 'radial-gradient(circle at 30% 30%, #FFE44D, #FFD700, #B8860B)',
                        border: '3px solid #8B0000',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.4)',
                      }}
                    >
                      <span className="font-bangers text-sm sm:text-lg text-[#8B0000]" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.3)' }}>VS</span>
                    </div>
                  </div>
                  
                  {/* Bottom text — printed title feel */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p 
                      className="font-bangers text-white text-sm sm:text-base text-center leading-tight"
                      style={{ textShadow: '2px 2px 0 #000, 0 0 10px rgba(0,0,0,0.8)' }}
                    >
                      {book.animalA.toUpperCase()} VS {book.animalB.toUpperCase()}
                    </p>
                    <p className="text-[#FFD700] text-xs text-center mt-1 font-bold" style={{ textShadow: '1px 1px 2px #000' }}>
                      {book.label}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Hover overlay — read button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30" style={{ marginLeft: '6px' }}>
                <span className="bg-[#FFD700] text-[#8B0000] font-bangers px-4 py-2 rounded-lg text-lg shadow-xl border-2 border-[#8B0000]">
                  READ FREE →
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
