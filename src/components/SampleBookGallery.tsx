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
          📖 TRY A FREE BOOK
        </h2>
        <p className="text-white/70 text-center mb-6">
          Tap to read the full book instantly — no signup needed!
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SAMPLE_BOOKS.map((book, i) => (
            <motion.a
              key={i}
              href={`/read?a=${encodeURIComponent(book.animalA)}&b=${encodeURIComponent(book.animalB)}&env=neutral&mode=standard`}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className={`relative rounded-xl overflow-hidden border-3 ${book.border} shadow-xl cursor-pointer group`}
            >
              {/* Background — split image of both animals */}
              <div className={`bg-gradient-to-br ${book.color} aspect-[3/4] relative`}>
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
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                {/* Center VS badge */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-[#FFD700] w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-3 border-[#8B0000] shadow-lg">
                    <span className="font-bangers text-sm sm:text-lg text-[#8B0000]">VS</span>
                  </div>
                </div>
                {/* Bottom text */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="font-bangers text-white text-sm sm:text-base text-center leading-tight" style={{ textShadow: '2px 2px 0 #000' }}>
                    {book.animalA.toUpperCase()} VS {book.animalB.toUpperCase()}
                  </p>
                  <p className="text-[#FFD700] text-xs text-center mt-1">{book.label}</p>
                </div>
              </div>
              {/* Read button on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <span className="bg-[#FFD700] text-[#8B0000] font-bangers px-4 py-2 rounded-lg text-lg shadow-xl">
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
