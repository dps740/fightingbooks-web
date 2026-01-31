'use client';

import { useState, useEffect, useRef, Suspense, forwardRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const HTMLFlipBook = dynamic(() => import('react-pageflip'), { ssr: false });
import { ChevronLeft, ChevronRight, Download, Home, Volume2, VolumeX, Sparkles, Swords, RotateCcw } from 'lucide-react';

interface BookPage {
  id: string;
  type: 'cover' | 'intro' | 'stats' | 'battle' | 'choice' | 'victory';
  title: string;
  content: string;
  imageUrl?: string;
  choices?: Choice[];
}

interface Choice {
  id: string;
  text: string;
  emoji: string;
}

// Page component for the flip book - must use forwardRef
const Page = forwardRef<HTMLDivElement, { page: BookPage; pageNumber: number; onChoice?: (choice: Choice) => void; generatingChoice?: boolean }>(
  ({ page, pageNumber, onChoice, generatingChoice }, ref) => {
    const isChoicePage = page?.type === 'choice' && page.choices && page.choices.length > 0;
    
    // Different backgrounds for different page types
    const bgClass = {
      cover: 'bg-gradient-to-br from-orange-600 via-red-600 to-purple-700',
      intro: 'bg-gradient-to-br from-emerald-800 to-teal-900',
      stats: 'bg-gradient-to-br from-slate-800 to-zinc-900',
      battle: 'bg-gradient-to-br from-red-900 to-orange-900',
      choice: 'bg-gradient-to-br from-purple-900 to-pink-900',
      victory: 'bg-gradient-to-br from-yellow-600 to-amber-700',
    }[page?.type] || 'bg-gray-800';

    return (
      <div ref={ref} className={`page ${bgClass} relative overflow-hidden`} data-density="hard">
        {/* Page texture overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('/paper-texture.png')] pointer-events-none" />
        
        {/* Decorative corner flourishes */}
        <div className="absolute top-3 left-3 text-2xl opacity-30">✦</div>
        <div className="absolute top-3 right-3 text-2xl opacity-30">✦</div>
        <div className="absolute bottom-3 left-3 text-2xl opacity-30">✦</div>
        <div className="absolute bottom-3 right-3 text-2xl opacity-30">✦</div>
        
        {/* Page content */}
        <div className="relative z-10 h-full flex flex-col p-6 text-white">
          {/* Image area */}
          {page?.imageUrl && (
            <div className="flex-shrink-0 h-48 mb-4 rounded-xl overflow-hidden border-4 border-white/20 shadow-xl">
              <div className="w-full h-full bg-gray-700 flex items-center justify-center text-6xl">
                {page.type === 'cover' && '⚔️'}
                {page.type === 'intro' && '🦁'}
                {page.type === 'stats' && '📊'}
                {page.type === 'battle' && '💥'}
                {page.type === 'choice' && '🤔'}
                {page.type === 'victory' && '🏆'}
              </div>
            </div>
          )}
          
          {/* Title */}
          <h2 className={`font-bold mb-3 text-center ${page?.type === 'cover' ? 'text-3xl' : 'text-xl'}`}>
            {page?.title}
          </h2>
          
          {/* Content */}
          <div 
            className="flex-grow overflow-auto prose prose-invert prose-sm max-w-none text-white/90 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: page?.content || '' }}
          />

          {/* CYOA Choices */}
          {isChoicePage && !generatingChoice && onChoice && (
            <div className="mt-4 space-y-2">
              <p className="text-center text-yellow-300 text-sm font-semibold mb-2">
                ⚡ You decide! ⚡
              </p>
              {page.choices?.map((choice) => (
                <button
                  key={choice.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChoice(choice);
                  }}
                  className="w-full p-3 bg-white/10 backdrop-blur rounded-lg text-left text-sm font-medium hover:bg-white/20 transition-all flex items-center gap-2 border border-white/20"
                >
                  <span className="text-xl">{choice.emoji}</span>
                  <span className="flex-grow">{choice.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Generating indicator */}
          {generatingChoice && (
            <div className="mt-4 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="text-3xl inline-block"
              >
                ⏳
              </motion.div>
              <p className="text-yellow-300 text-sm mt-2">Creating next scene...</p>
            </div>
          )}

          {/* Page number */}
          <div className="mt-4 text-center text-white/40 text-sm">
            — {pageNumber} —
          </div>
        </div>
      </div>
    );
  }
);
Page.displayName = 'Page';

function BookReader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookRef = useRef<any>(null);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingChoice, setGeneratingChoice] = useState(false);
  const [choicesMade, setChoicesMade] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  const animalA = searchParams.get('a') || 'Lion';
  const animalB = searchParams.get('b') || 'Tiger';
  const mode = searchParams.get('mode') || 'standard';

  // Page flip sound
  const playFlipSound = () => {
    if (soundEnabled && typeof window !== 'undefined') {
      const audio = new Audio('/sounds/page-flip.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if sound doesn't exist
    }
  };

  useEffect(() => {
    loadBook();
  }, []);

  const loadBook = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/book/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animalA, animalB, mode }),
      });
      const data = await response.json();
      setPages(data.pages);
    } catch (error) {
      console.error('Failed to load book:', error);
    }
    setLoading(false);
  };

  const handleChoice = async (choice: Choice) => {
    setGeneratingChoice(true);
    setChoicesMade([...choicesMade, choice.id]);
    
    try {
      const response = await fetch('/api/book/choice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalA,
          animalB,
          choiceId: choice.id,
          choiceText: choice.text,
          previousChoices: choicesMade,
          currentPage: pages[currentPage],
        }),
      });
      const data = await response.json();
      
      // Add new pages
      setPages([...pages, ...data.pages]);
      
      // Check if we hit victory
      if (data.pages.some((p: BookPage) => p.type === 'victory')) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
      
      // Flip to next page
      setTimeout(() => {
        bookRef.current?.pageFlip().flipNext();
      }, 500);
    } catch (error) {
      console.error('Failed to generate choice:', error);
    }
    setGeneratingChoice(false);
  };

  const onFlip = (e: any) => {
    setCurrentPage(e.data);
    playFlipSound();
  };

  const flipNext = () => bookRef.current?.pageFlip().flipNext();
  const flipPrev = () => bookRef.current?.pageFlip().flipPrev();

  const downloadPDF = async () => {
    // TODO: Implement PDF compilation
    alert('PDF download coming soon! Your book will be compiled and downloaded.');
  };

  const isVictoryPage = pages[currentPage]?.type === 'victory';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotateY: [0, 180, 360] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="text-8xl mb-6"
          >
            📖
          </motion.div>
          <p className="text-white text-xl font-medium">Opening your book...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 relative overflow-hidden">
      {/* Confetti effect on victory */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: -20,
                rotate: 0,
                opacity: 1
              }}
              animate={{ 
                y: window.innerHeight + 20,
                rotate: Math.random() * 720,
                opacity: 0
              }}
              transition={{ 
                duration: Math.random() * 3 + 2,
                ease: 'linear',
                delay: Math.random() * 2
              }}
              className="absolute text-2xl"
              style={{ left: `${Math.random() * 100}%` }}
            >
              {['🎉', '⭐', '🏆', '✨', '🎊'][Math.floor(Math.random() * 5)]}
            </motion.div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-4 py-3 relative z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">Home</span>
          </button>
          
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="text-red-300">{animalA}</span>
            <Swords className="w-5 h-5 text-yellow-400" />
            <span className="text-blue-300">{animalB}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-white/70 hover:text-white transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <span className="text-white/50 text-sm">
              {currentPage + 1}/{pages.length}
            </span>
          </div>
        </div>
      </header>

      {/* Book Container */}
      <main className="flex items-center justify-center py-8 px-4 min-h-[calc(100vh-120px)]">
        <div className="relative">
          {/* Book shadow */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-black/40 blur-xl rounded-full" />
          
          {/* Flip Book */}
          <HTMLFlipBook
            ref={bookRef}
            width={350}
            height={500}
            size="stretch"
            minWidth={280}
            maxWidth={500}
            minHeight={400}
            maxHeight={700}
            showCover={true}
            mobileScrollSupport={true}
            onFlip={onFlip}
            className="book-shadow"
            style={{}}
            startPage={0}
            drawShadow={true}
            flippingTime={600}
            usePortrait={true}
            startZIndex={0}
            autoSize={true}
            maxShadowOpacity={0.5}
            showPageCorners={true}
            disableFlipByClick={false}
            useMouseEvents={true}
            swipeDistance={30}
            clickEventForward={true}
            renderOnlyPageLengthChange={false}
          >
            {pages.map((page, index) => (
              <Page 
                key={page.id} 
                page={page} 
                pageNumber={index + 1}
                onChoice={handleChoice}
                generatingChoice={generatingChoice}
              />
            ))}
          </HTMLFlipBook>
        </div>
      </main>

      {/* Navigation Controls */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-md rounded-full px-6 py-3 z-20">
        <motion.button
          onClick={flipPrev}
          disabled={currentPage === 0}
          className={`p-2 rounded-full transition-all ${
            currentPage === 0 ? 'text-white/30' : 'text-white hover:bg-white/20'
          }`}
          whileHover={currentPage > 0 ? { scale: 1.1 } : {}}
          whileTap={currentPage > 0 ? { scale: 0.9 } : {}}
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>

        <div className="flex gap-1">
          {pages.slice(0, 10).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentPage ? 'bg-yellow-400 scale-125' : 'bg-white/30'
              }`}
            />
          ))}
          {pages.length > 10 && <span className="text-white/50 text-xs">...</span>}
        </div>

        <motion.button
          onClick={flipNext}
          disabled={currentPage >= pages.length - 1}
          className={`p-2 rounded-full transition-all ${
            currentPage >= pages.length - 1 ? 'text-white/30' : 'text-white hover:bg-white/20'
          }`}
          whileHover={currentPage < pages.length - 1 ? { scale: 1.1 } : {}}
          whileTap={currentPage < pages.length - 1 ? { scale: 0.9 } : {}}
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>

        {isVictoryPage && (
          <>
            <div className="w-px h-6 bg-white/30" />
            <motion.button
              onClick={downloadPDF}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-4 h-4" />
              Download
            </motion.button>
          </>
        )}
      </div>

      <style jsx global>{`
        .page {
          background-size: cover;
          box-shadow: inset 0 0 30px rgba(0,0,0,0.3);
        }
        .book-shadow {
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.5));
        }
        .stf__parent {
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}

export default function ReadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading book...</div>
      </div>
    }>
      <BookReader />
    </Suspense>
  );
}
