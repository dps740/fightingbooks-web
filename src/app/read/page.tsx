'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home, X } from 'lucide-react';

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

function BookReader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pages, setPages] = useState<BookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [generatingChoice, setGeneratingChoice] = useState(false);
  const [choicesMade, setChoicesMade] = useState<string[]>([]);

  const animalA = searchParams.get('a') || 'Lion';
  const animalB = searchParams.get('b') || 'Tiger';
  const mode = searchParams.get('mode') || 'standard';
  const environment = searchParams.get('env') || 'neutral';

  useEffect(() => {
    loadBook();
  }, []);

  const loadBook = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/book/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animalA, animalB, mode, environment }),
      });
      const data = await response.json();
      if (data.pages?.length > 0) {
        setPages(data.pages);
      } else {
        setPages([{
          id: 'error',
          type: 'cover',
          title: 'Error',
          content: '<p class="text-center">Failed to load book. Please try again.</p>',
        }]);
      }
    } catch (error) {
      console.error('Failed to load book:', error);
      setPages([{
        id: 'error',
        type: 'cover',
        title: 'Error',
        content: '<p class="text-center">Failed to load book. Please try again.</p>',
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
          animalA, animalB, choiceId: choice.id, choiceText: choice.text,
          previousChoices: choicesMade, currentPage: pages[currentPage],
        }),
      });
      const data = await response.json();
      if (data.pages) {
        setPages([...pages, ...data.pages]);
        goToPage(currentPage + 1);
      }
    } catch (error) {
      console.error('Failed to generate choice:', error);
    }
    setGeneratingChoice(false);
  };

  const goToPage = (index: number) => {
    if (index < 0 || index >= pages.length) return;
    setDirection(index > currentPage ? 1 : -1);
    setCurrentPage(index);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextPage();
      if (e.key === 'ArrowLeft') prevPage();
      if (e.key === 'Escape') router.push('/');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPage, pages.length]);

  const page = pages[currentPage];

  // Page background based on type
  const getPageStyle = (type: string) => {
    const styles: Record<string, string> = {
      cover: 'from-[#8B0000] via-[#5c1010] to-[#2a0a0a]',
      intro: 'from-[#1a2a1a] via-[#0d1a0d] to-[#0a0a0a]',
      stats: 'from-[#1a1a2a] via-[#0d0d1a] to-[#0a0a0a]',
      battle: 'from-[#2a1a0a] via-[#1a0d0a] to-[#0a0a0a]',
      choice: 'from-[#1a1a3a] via-[#0d0d2a] to-[#0a0a0a]',
      victory: 'from-[#2a2a0a] via-[#1a1a0d] to-[#0a0a0a]',
    };
    return styles[type] || styles.intro;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotateY: [0, 360] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="text-8xl mb-8"
          >
            📖
          </motion.div>
          <p className="text-white text-2xl font-bold">Generating your battle book...</p>
          <p className="text-gray-500 mt-2">This takes about 30 seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-[#141414] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="hidden sm:inline">Exit</span>
        </button>
        
        <div className="text-lg font-black">
          <span className="text-[#c41e3a]">{animalA}</span>
          <span className="text-[#d4af37] mx-2">VS</span>
          <span className="text-[#1e4fc4]">{animalB}</span>
        </div>

        <div className="text-gray-500 text-sm font-mono">
          {currentPage + 1} / {pages.length}
        </div>
      </header>

      {/* Book Area */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
        <div className="relative w-full max-w-4xl aspect-[3/4] md:aspect-[4/3]">
          {/* Book Shadow */}
          <div className="absolute inset-0 bg-black/50 blur-3xl transform translate-y-8 scale-95" />
          
          {/* Book Container */}
          <div className="relative w-full h-full bg-[#1a1a1a] rounded-lg shadow-2xl overflow-hidden border border-[#3a3a3a]">
            {/* Page Content with Animation */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentPage}
                initial={{ 
                  x: direction > 0 ? '100%' : '-100%',
                  opacity: 0,
                  rotateY: direction > 0 ? -15 : 15
                }}
                animate={{ 
                  x: 0, 
                  opacity: 1,
                  rotateY: 0
                }}
                exit={{ 
                  x: direction > 0 ? '-100%' : '100%',
                  opacity: 0,
                  rotateY: direction > 0 ? 15 : -15
                }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className={`absolute inset-0 bg-gradient-to-br ${getPageStyle(page?.type || 'intro')}`}
              >
                {/* Page Inner Content */}
                <div className="h-full flex flex-col p-6 md:p-10 overflow-auto">
                  {/* Image */}
                  {page?.imageUrl && (
                    <div className="flex-shrink-0 mb-6 rounded-xl overflow-hidden border-2 border-[#d4af37]/30 shadow-xl">
                      <img 
                        src={page.imageUrl} 
                        alt={page.title}
                        className="w-full h-48 md:h-64 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Title */}
                  <h1 className={`font-black text-center mb-6 ${
                    page?.type === 'cover' 
                      ? 'text-4xl md:text-6xl text-[#d4af37] drop-shadow-lg' 
                      : page?.type === 'victory'
                      ? 'text-3xl md:text-5xl text-[#d4af37]'
                      : 'text-2xl md:text-3xl text-white'
                  }`}>
                    {page?.title}
                  </h1>

                  {/* Content */}
                  <div 
                    className="flex-grow prose prose-invert prose-lg max-w-none text-white/90"
                    style={{ fontSize: '1.1rem', lineHeight: '1.8' }}
                    dangerouslySetInnerHTML={{ __html: page?.content || '' }}
                  />

                  {/* CYOA Choices */}
                  {page?.type === 'choice' && page.choices && !generatingChoice && (
                    <div className="mt-6 space-y-3">
                      <p className="text-center text-[#d4af37] font-bold text-lg mb-4">
                        ⚡ CHOOSE YOUR PATH ⚡
                      </p>
                      {page.choices.map((choice) => (
                        <button
                          key={choice.id}
                          onClick={() => handleChoice(choice)}
                          className="w-full p-4 bg-[#1a1a1a]/80 border-2 border-[#d4af37]/50 rounded-xl text-left text-lg font-medium hover:border-[#d4af37] hover:bg-[#2a2a2a] transition-all flex items-center gap-3"
                        >
                          <span className="text-2xl">{choice.emoji}</span>
                          <span>{choice.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Generating indicator */}
                  {generatingChoice && (
                    <div className="mt-6 text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="text-4xl inline-block"
                      >
                        ⏳
                      </motion.div>
                      <p className="text-[#d4af37] mt-2">Generating next scene...</p>
                    </div>
                  )}
                </div>

                {/* Page decoration - corner flourishes */}
                <div className="absolute top-4 left-4 text-[#d4af37]/20 text-3xl">✦</div>
                <div className="absolute top-4 right-4 text-[#d4af37]/20 text-3xl">✦</div>
                <div className="absolute bottom-4 left-4 text-[#d4af37]/20 text-3xl">✦</div>
                <div className="absolute bottom-4 right-4 text-[#d4af37]/20 text-3xl">✦</div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {currentPage > 0 && (
              <button
                onClick={prevPage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all z-10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            {currentPage < pages.length - 1 && (
              <button
                onClick={nextPage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all z-10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Page Indicators */}
      <footer className="flex-shrink-0 bg-[#141414] border-t border-[#2a2a2a] px-4 py-3">
        <div className="flex justify-center gap-2 flex-wrap max-w-4xl mx-auto">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              className={`w-3 h-3 rounded-full transition-all ${
                i === currentPage 
                  ? 'bg-[#d4af37] scale-125' 
                  : 'bg-[#3a3a3a] hover:bg-[#5a5a5a]'
              }`}
            />
          ))}
        </div>
      </footer>
    </div>
  );
}

export default function ReadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    }>
      <BookReader />
    </Suspense>
  );
}
