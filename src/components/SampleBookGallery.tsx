'use client';

import { motion } from 'framer-motion';

const SAMPLE_BOOKS = [
  {
    animalA: 'Lion',
    animalB: 'Tiger',
    label: 'Fan Favorite',
    color: '#8B0000',
  },
  {
    animalA: 'Gorilla',
    animalB: 'Grizzly Bear',
    label: 'Heavyweight Clash',
    color: '#1a4d1a',
  },
  {
    animalA: 'Great White Shark',
    animalB: 'Orca',
    label: 'Ocean Showdown',
    color: '#0a3d6b',
  },
  {
    animalA: 'Polar Bear',
    animalB: 'Crocodile',
    label: 'Apex Predators',
    color: '#2d2d3d',
  },
];

function getImagePath(name: string) {
  return `/fighters/${name.toLowerCase().replace(/ /g, '-')}.jpg`;
}

export default function SampleBookGallery() {
  return (
    <section className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <p className="text-white/60 text-center text-sm mb-6 tracking-wide uppercase">
          No signup needed
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8">
          {SAMPLE_BOOKS.map((book, i) => (
            <motion.a
              key={i}
              href={`/read?a=${encodeURIComponent(book.animalA)}&b=${encodeURIComponent(book.animalB)}&env=neutral&mode=standard`}
              whileHover={{ y: -10, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative cursor-pointer group block"
            >
              {/* Book with 3D depth */}
              <div 
                className="relative"
                style={{
                  transformStyle: 'preserve-3d',
                  filter: 'drop-shadow(6px 8px 12px rgba(0,0,0,0.6))',
                }}
              >
                {/* Spine */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-[8px] z-20 rounded-l-[3px]"
                  style={{ 
                    background: `linear-gradient(90deg, ${book.color}, rgba(0,0,0,0.3))`,
                    boxShadow: '2px 0 4px rgba(0,0,0,0.3)',
                  }}
                />

                {/* Cover */}
                <div 
                  className="relative overflow-hidden rounded-[3px] ml-[8px]"
                  style={{ 
                    aspectRatio: '2/3',
                    border: `3px solid ${book.color}`,
                  }}
                >
                  {/* Animal A (left half) */}
                  <div className="absolute inset-0 w-1/2 overflow-hidden">
                    <img 
                      src={getImagePath(book.animalA)} 
                      alt={book.animalA} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Animal B (right half) */}
                  <div className="absolute inset-0 left-1/2 overflow-hidden">
                    <img 
                      src={getImagePath(book.animalB)} 
                      alt={book.animalB} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Gradient overlays for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />
                  
                  {/* Title area */}
                  <div className="absolute top-0 left-0 right-0 pt-3 pb-6 px-2 text-center">
                    <p className="text-[#FFD700] text-[9px] sm:text-[11px] font-bold tracking-[0.2em] uppercase" style={{ textShadow: '1px 1px 2px #000' }}>
                      Who Would Win?
                    </p>
                  </div>

                  {/* VS badge */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center"
                      style={{ 
                        background: 'linear-gradient(135deg, #FFE44D, #B8860B)',
                        border: '2px solid #8B0000',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                      }}
                    >
                      <span className="font-bangers text-xs sm:text-base text-[#8B0000]">VS</span>
                    </div>
                  </div>
                  
                  {/* Bottom — matchup title */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 text-center">
                    <p 
                      className="font-bangers text-white text-xs sm:text-sm leading-tight"
                      style={{ textShadow: '1px 1px 0 #000' }}
                    >
                      {book.animalA.toUpperCase()} VS {book.animalB.toUpperCase()}
                    </p>
                    <p className="text-white/60 text-[10px] sm:text-xs mt-0.5">
                      {book.label}
                    </p>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
