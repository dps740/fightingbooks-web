'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

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
          content: '<p>Failed to load book. Please try again.</p>',
        }]);
      }
    } catch (error) {
      setPages([{
        id: 'error',
        type: 'cover',
        title: 'Error', 
        content: '<p>Failed to load book. Please try again.</p>',
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

  // Colorful backgrounds like the Who Would Win books
  const backgrounds = [
    'from-green-200 to-green-300',    // Green
    'from-amber-100 to-amber-200',    // Gold  
    'from-blue-200 to-blue-300',      // Blue
    'from-pink-200 to-pink-300',      // Coral/Pink
    'from-purple-200 to-purple-300',  // Purple
  ];

  const getBackground = (index: number, type: string) => {
    if (type === 'cover') return 'from-orange-400 via-red-500 to-purple-600';
    if (type === 'victory') return 'from-yellow-300 via-amber-400 to-orange-500';
    if (type === 'battle') return 'from-red-300 to-orange-300';
    return backgrounds[index % backgrounds.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotateY: [0, 360] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="text-9xl mb-8"
          >
            📖
          </motion.div>
          <p className="text-white text-3xl font-bold font-comic">Creating your battle book...</p>
          <p className="text-white/70 text-xl mt-2">This takes about 30 seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Navigation Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-white/70 hover:text-white bg-white/10 px-4 py-2 rounded-full transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>Exit</span>
        </button>
        <div className="text-white text-lg font-bold">
          Page {currentPage + 1} of {pages.length}
        </div>
      </div>

      {/* Book Container */}
      <div className="relative w-full max-w-4xl" style={{ perspective: '2000px' }}>
        {/* Book Shadow */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-black/30 blur-xl transform translate-y-4" />
        
        {/* The Book */}
        <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden" style={{ minHeight: '70vh' }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentPage}
              initial={{ 
                rotateY: direction > 0 ? 90 : -90,
                opacity: 0,
              }}
              animate={{ 
                rotateY: 0,
                opacity: 1,
              }}
              exit={{ 
                rotateY: direction > 0 ? -90 : 90,
                opacity: 0,
              }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{ transformOrigin: direction > 0 ? 'left center' : 'right center' }}
              className={`w-full min-h-[70vh] bg-gradient-to-br ${getBackground(currentPage, page?.type || 'intro')} p-8 md:p-12`}
            >
              {/* Cover Page */}
              {page?.type === 'cover' && (
                <div className="h-full flex flex-col items-center justify-center text-center text-white">
                  <div className="bg-red-600 px-8 py-3 rounded-lg shadow-lg mb-6 transform -rotate-2">
                    <span className="font-bangers text-3xl md:text-5xl tracking-wider">WHO WOULD WIN?</span>
                  </div>
                  <h1 className="font-bangers text-4xl md:text-6xl mb-8 drop-shadow-lg">{page.title}</h1>
                  {page.imageUrl && (
                    <img 
                      src={page.imageUrl} 
                      alt={page.title}
                      className="max-w-full max-h-64 md:max-h-96 rounded-xl shadow-2xl border-4 border-white"
                    />
                  )}
                </div>
              )}

              {/* Victory Page */}
              {page?.type === 'victory' && (
                <div className="h-full flex flex-col items-center text-center">
                  <h1 className="font-bangers text-4xl md:text-6xl text-red-600 mb-4 drop-shadow-lg">🏆 THE WINNER! 🏆</h1>
                  {page.imageUrl && (
                    <img 
                      src={page.imageUrl} 
                      alt="Winner"
                      className="max-w-full max-h-48 md:max-h-64 rounded-xl shadow-xl border-4 border-yellow-400 mb-6"
                    />
                  )}
                  <div 
                    className="prose prose-lg max-w-none font-comic text-gray-800"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                  />
                </div>
              )}

              {/* Regular Pages */}
              {page?.type !== 'cover' && page?.type !== 'victory' && (
                <div className="h-full">
                  {/* Title */}
                  <h2 className="font-bangers text-3xl md:text-4xl text-orange-600 text-center mb-6 drop-shadow">
                    {page?.title}
                  </h2>

                  <div className={`flex flex-col ${page?.imageUrl ? 'md:flex-row' : ''} gap-6`}>
                    {/* Image */}
                    {page?.imageUrl && (
                      <div className="md:w-1/2 flex-shrink-0">
                        <img 
                          src={page.imageUrl} 
                          alt={page.title}
                          className="w-full rounded-xl shadow-xl border-4 border-white"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className={`${page?.imageUrl ? 'md:w-1/2' : 'w-full'}`}>
                      <div 
                        className="prose prose-lg max-w-none font-comic text-gray-800 book-content"
                        dangerouslySetInnerHTML={{ __html: page?.content || '' }}
                      />

                      {/* CYOA Choices */}
                      {page?.type === 'choice' && page.choices && !generatingChoice && (
                        <div className="mt-6 space-y-3">
                          <p className="font-bangers text-2xl text-purple-600 text-center">⚡ YOU DECIDE! ⚡</p>
                          {page.choices.map((choice) => (
                            <button
                              key={choice.id}
                              onClick={() => handleChoice(choice)}
                              className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-lg font-bold shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-3"
                            >
                              <span className="text-2xl">{choice.emoji}</span>
                              <span>{choice.text}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {generatingChoice && (
                        <div className="mt-6 text-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="text-5xl inline-block"
                          >
                            ⏳
                          </motion.div>
                          <p className="font-comic text-xl text-purple-600 mt-2">Creating next scene...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Page Navigation Buttons */}
          {currentPage > 0 && (
            <button
              onClick={prevPage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/90 hover:bg-white rounded-full shadow-xl flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all z-10"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          {currentPage < pages.length - 1 && (
            <button
              onClick={nextPage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/90 hover:bg-white rounded-full shadow-xl flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all z-10"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>
      </div>

      {/* Page Dots */}
      <div className="flex gap-2 mt-6 flex-wrap justify-center max-w-4xl">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => goToPage(i)}
            className={`w-4 h-4 rounded-full transition-all ${
              i === currentPage 
                ? 'bg-yellow-400 scale-125 shadow-lg' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap');
        
        .font-bangers {
          font-family: 'Bangers', cursive;
          letter-spacing: 2px;
        }
        
        .font-comic {
          font-family: 'Comic Neue', cursive;
        }
        
        .book-content p {
          background: rgba(255,255,255,0.7);
          padding: 8px 12px;
          border-radius: 8px;
          border-left: 4px solid #ff5722;
          margin-bottom: 12px;
        }
        
        .book-content strong {
          color: #c62828;
        }
        
        .book-content ul {
          list-style: none;
          padding: 0;
        }
        
        .book-content li {
          background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 8px;
          font-weight: bold;
          box-shadow: 0 3px 6px rgba(0,0,0,0.2);
        }
        
        .book-content table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .book-content td, .book-content th {
          padding: 8px;
          border: 2px solid #ffd54f;
          background: rgba(255,255,255,0.8);
        }
      `}</style>
    </div>
  );
}

export default function ReadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-3xl font-bold">Loading...</div>
      </div>
    }>
      <BookReader />
    </Suspense>
  );
}
