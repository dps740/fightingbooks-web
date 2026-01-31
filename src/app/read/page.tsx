'use client';

import { useState, useEffect, useRef, Suspense, forwardRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const HTMLFlipBook = dynamic(
  () => import('react-pageflip').then((mod) => mod.default || mod),
  { 
    ssr: false,
    loading: () => <div className="text-white text-center p-8">Loading book...</div>
  }
);
import { ChevronLeft, ChevronRight, Download, Home, Volume2, VolumeX, Swords, RotateCcw } from 'lucide-react';

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

// Page component for the flip book
const Page = forwardRef<HTMLDivElement, { page: BookPage; pageNumber: number; onChoice?: (choice: Choice) => void; generatingChoice?: boolean }>(
  ({ page, pageNumber, onChoice, generatingChoice }, ref) => {
    const isChoicePage = page?.type === 'choice' && page.choices && page.choices.length > 0;
    
    // Dark theme backgrounds
    const bgClass = {
      cover: 'bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]',
      intro: 'bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]',
      stats: 'bg-[#0a0a0a]',
      battle: 'bg-gradient-to-br from-[#1a0a0a] to-[#0a0a0a]',
      choice: 'bg-gradient-to-br from-[#1a1a2a] to-[#0a0a0a]',
      victory: 'bg-gradient-to-br from-[#1a1a0a] to-[#0a0a0a]',
    }[page?.type] || 'bg-[#0a0a0a]';

    // Border accents
    const borderClass = {
      cover: 'border-[#d4af37]',
      intro: 'border-[#3a3a3a]',
      stats: 'border-[#d4af37]',
      battle: 'border-[#c41e3a]',
      choice: 'border-[#1e4fc4]',
      victory: 'border-[#d4af37]',
    }[page?.type] || 'border-[#2a2a2a]';

    return (
      <div ref={ref} className={`page ${bgClass} relative overflow-hidden border-2 ${borderClass}`} data-density="hard">
        {/* Page content */}
        <div className="relative z-10 h-full flex flex-col p-6 text-white">
          {/* Icon for page type */}
          <div className="text-center mb-4">
            <span className="text-5xl">
              {page?.type === 'cover' && '⚔️'}
              {page?.type === 'intro' && '📋'}
              {page?.type === 'stats' && '📊'}
              {page?.type === 'battle' && '💥'}
              {page?.type === 'choice' && '🤔'}
              {page?.type === 'victory' && '🏆'}
            </span>
          </div>
          
          {/* Title */}
          <h2 className={`font-black mb-4 text-center uppercase tracking-wide ${
            page?.type === 'cover' ? 'text-3xl text-[#d4af37]' : 
            page?.type === 'victory' ? 'text-2xl text-[#d4af37]' : 
            'text-xl text-white'
          }`}>
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
              <p className="text-center text-[#d4af37] text-sm font-bold uppercase tracking-wider mb-3">
                You Decide
              </p>
              {page.choices?.map((choice) => (
                <button
                  key={choice.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChoice(choice);
                  }}
                  className="w-full p-3 bg-[#1a1a1a] border border-[#3a3a3a] text-left text-sm font-medium hover:border-[#d4af37] hover:bg-[#2a2a2a] transition-all flex items-center gap-2"
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
              <p className="text-[#d4af37] text-sm mt-2">Creating next scene...</p>
            </div>
          )}

          {/* Page number */}
          <div className="mt-4 text-center text-gray-600 text-sm font-mono">
            {pageNumber}
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

  const playFlipSound = () => {
    if (soundEnabled && typeof window !== 'undefined') {
      const audio = new Audio('/sounds/page-flip.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
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
      if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
        setPages(data.pages);
      } else {
        console.error('Invalid pages data:', data);
        setPages([{
          id: 'error',
          type: 'cover',
          title: 'Error',
          content: '<p>Something went wrong loading your book. Please try again!</p>',
        }]);
      }
    } catch (error) {
      console.error('Failed to load book:', error);
      setPages([{
        id: 'error',
        type: 'cover',
        title: 'Error',
        content: '<p>Something went wrong loading your book. Please try again!</p>',
      }]);
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
      
      setPages([...pages, ...data.pages]);
      
      if (data.pages.some((p: BookPage) => p.type === 'victory')) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
      
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
    alert('PDF download coming soon!');
  };

  const isVictoryPage = pages[currentPage]?.type === 'victory';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
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
          <p className="text-white text-xl font-bold uppercase tracking-wider">Loading Battle...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Confetti effect on victory */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
                y: -20,
                rotate: 0,
                opacity: 1
              }}
              animate={{ 
                y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 20,
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
      <header className="bg-[#141414] border-b border-[#2a2a2a] px-4 py-3 relative z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline text-sm uppercase tracking-wider">Back</span>
          </button>
          
          <div className="flex items-center gap-3 text-lg font-black">
            <span className="text-[#c41e3a]">{animalA.toUpperCase()}</span>
            <span className="text-[#d4af37]">VS</span>
            <span className="text-[#1e4fc4]">{animalB.toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <span className="text-gray-600 text-sm font-mono">
              {currentPage + 1}/{pages.length}
            </span>
          </div>
        </div>
      </header>

      {/* Book Container */}
      <main className="flex items-center justify-center py-8 px-4 min-h-[calc(100vh-120px)]">
        <div className="relative">
          {/* Book shadow */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-black/60 blur-xl rounded-full" />
          
          {/* Flip Book */}
          {pages.length > 0 && (
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
          )}
        </div>
      </main>

      {/* Navigation Controls */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#141414] border border-[#2a2a2a] px-6 py-3 z-20">
        <motion.button
          onClick={flipPrev}
          disabled={currentPage === 0}
          className={`p-2 transition-all ${
            currentPage === 0 ? 'text-gray-700' : 'text-gray-400 hover:text-white'
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
              className={`w-2 h-2 transition-all ${
                i === currentPage ? 'bg-[#d4af37] scale-125' : 'bg-[#3a3a3a]'
              }`}
            />
          ))}
          {pages.length > 10 && <span className="text-gray-600 text-xs">...</span>}
        </div>

        <motion.button
          onClick={flipNext}
          disabled={currentPage >= pages.length - 1}
          className={`p-2 transition-all ${
            currentPage >= pages.length - 1 ? 'text-gray-700' : 'text-gray-400 hover:text-white'
          }`}
          whileHover={currentPage < pages.length - 1 ? { scale: 1.1 } : {}}
          whileTap={currentPage < pages.length - 1 ? { scale: 0.9 } : {}}
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>

        {isVictoryPage && (
          <>
            <div className="w-px h-6 bg-[#3a3a3a]" />
            <motion.button
              onClick={downloadPDF}
              className="flex items-center gap-2 bg-gradient-to-b from-[#c41e3a] to-[#9a1830] border border-[#d4af37] text-white px-4 py-2 font-bold uppercase text-sm tracking-wider"
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
          box-shadow: inset 0 0 30px rgba(0,0,0,0.5);
        }
        .book-shadow {
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.8));
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl font-bold uppercase tracking-wider">Loading...</div>
      </div>
    }>
      <BookReader />
    </Suspense>
  );
}
