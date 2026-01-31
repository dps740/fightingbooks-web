'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import VersusScreen from './VersusScreen';

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
  const [showVersusScreen, setShowVersusScreen] = useState(true);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [generatingChoice, setGeneratingChoice] = useState(false);
  const [choicesMade, setChoicesMade] = useState<string[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const animalA = searchParams.get('a') || 'Lion';
  const animalB = searchParams.get('b') || 'Tiger';
  const mode = searchParams.get('mode') || 'standard';
  const environment = searchParams.get('env') || 'neutral';

  const handleVersusComplete = useCallback(() => {
    setShowVersusScreen(false);
  }, []);

  useEffect(() => { 
    // Only start loading after VS screen completes
    if (!showVersusScreen) {
      loadBook(); 
    }
  }, [showVersusScreen]);

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
        setPages([{ id: 'error', type: 'cover', title: 'Error', content: '<p>Failed to load book.</p>' }]);
      }
    } catch (error) {
      setPages([{ id: 'error', type: 'cover', title: 'Error', content: '<p>Failed to load book.</p>' }]);
    }
    setLoading(false);
  };

  const handleChoice = async (choice: Choice) => {
    setGeneratingChoice(true);
    try {
      const response = await fetch('/api/book/choice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animalA, animalB, choiceId: choice.id, choiceText: choice.text, previousChoices: choicesMade, currentPage: pages[currentPage] }),
      });
      const data = await response.json();
      if (data.pages) { setPages([...pages, ...data.pages]); goToPage(currentPage + 1); }
    } catch (error) { console.error(error); }
    setGeneratingChoice(false);
  };

  const goToPage = (i: number) => { if (i >= 0 && i < pages.length) { setDirection(i > currentPage ? 1 : -1); setCurrentPage(i); } };
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'ArrowRight' || e.key === ' ') nextPage(); if (e.key === 'ArrowLeft') prevPage(); if (e.key === 'Escape') router.push('/'); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [currentPage, pages.length]);

  const page = pages[currentPage];
  const backgrounds = ['bg-green', 'bg-gold', 'bg-blue', 'bg-coral', 'bg-purple'];
  const getBg = (i: number, type: string) => {
    if (type === 'cover') return 'cover-page';
    if (type === 'victory') return 'victory-page';
    if (type === 'battle') return 'battle-page';
    if (type === 'stats') return 'bg-gold';
    return backgrounds[i % backgrounds.length];
  };

  // Show VS screen first
  if (showVersusScreen) {
    return (
      <VersusScreen 
        fighterA={animalA} 
        fighterB={animalB} 
        onComplete={handleVersusComplete} 
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center font-comic">
        <div className="text-center">
          <motion.div animate={{ rotateY: [0, 360] }} transition={{ repeat: Infinity, duration: 2 }} className="text-9xl mb-8">📖</motion.div>
          <p className="text-white text-3xl font-bold">Creating your battle book...</p>
          <p className="text-white/70 text-xl mt-2">This takes about 30 seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex flex-col items-center justify-center p-4 font-comic">
      {/* Navigation */}
      <div className="nav-buttons mb-4">
        <button onClick={prevPage} disabled={currentPage === 0} className="nav-btn">◀ Previous</button>
        <span className="page-indicator">Page {currentPage + 1} of {pages.length}</span>
        <button onClick={nextPage} disabled={currentPage >= pages.length - 1} className="nav-btn">Next ▶</button>
      </div>

      {/* Book */}
      <div className="book-container">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentPage}
            initial={{ rotateY: direction > 0 ? 90 : -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: direction > 0 ? -90 : 90, opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformOrigin: direction > 0 ? 'left center' : 'right center' }}
            className={`page ${getBg(currentPage, page?.type || 'intro')}`}
          >
            {/* COVER PAGE */}
            {page?.type === 'cover' && (
              <>
                <div className="cover-banner">WHO WOULD WIN?</div>
                <h1 className="cover-title">{page.title}</h1>
                <div className="cover-image-container">
                  {page.imageUrl && <img src={page.imageUrl} alt={page.title} className="cover-image" />}
                </div>
              </>
            )}

            {/* VICTORY PAGE */}
            {page?.type === 'victory' && (
              <>
                <h2 className="page-title victory-title">🏆 THE WINNER! 🏆</h2>
                {page.imageUrl && <img src={page.imageUrl} alt="Winner" className="victory-image" />}
                <div className="page-content" dangerouslySetInnerHTML={{ __html: page.content }} />
              </>
            )}

            {/* STATS PAGE */}
            {page?.type === 'stats' && (
              <>
                <h2 className="page-title">📊 {page.title}</h2>
                {page.imageUrl && <img src={page.imageUrl} alt={page.title} className="stats-hero-image" />}
                <div className="page-content" dangerouslySetInnerHTML={{ __html: page.content }} />
              </>
            )}

            {/* INTRO / FACTS PAGES */}
            {(page?.type === 'intro') && (
              <>
                <h2 className="page-title">{page.title}</h2>
                <div className={`page-content-wrapper ${page.imageUrl ? 'side-by-side' : ''}`}>
                  <div className="page-content-text">
                    <div className="page-content" dangerouslySetInnerHTML={{ __html: page.content }} />
                  </div>
                  {page.imageUrl && (
                    <div className="page-image-side">
                      <img src={page.imageUrl} alt={page.title} className="page-image-integrated" />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* BATTLE PAGES */}
            {page?.type === 'battle' && (
              <>
                {page.imageUrl && <div className="battle-bg-image" style={{ backgroundImage: `url(${page.imageUrl})` }} />}
                <h2 className="page-title">{page.title}</h2>
                <div className="page-content battle-content" dangerouslySetInnerHTML={{ __html: page.content }} />
              </>
            )}

            {/* CHOICE PAGE */}
            {page?.type === 'choice' && (
              <>
                <h2 className="page-title">{page.title}</h2>
                <div className="page-content" dangerouslySetInnerHTML={{ __html: page.content }} />
                {!generatingChoice && page.choices && (
                  <div className="choices-container">
                    <p className="choices-header">⚡ YOU DECIDE! ⚡</p>
                    {page.choices.map((c) => (
                      <button key={c.id} onClick={() => handleChoice(c)} className="choice-btn">
                        <span className="choice-emoji">{c.emoji}</span> {c.text}
                      </button>
                    ))}
                  </div>
                )}
                {generatingChoice && (
                  <div className="generating">
                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>⏳</motion.span>
                    <p>Creating next scene...</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Page Dots */}
      <div className="page-dots">
        {pages.map((_, i) => (
          <button key={i} onClick={() => goToPage(i)} className={`dot ${i === currentPage ? 'active' : ''}`} />
        ))}
      </div>

      {/* Exit & Report buttons */}
      <button onClick={() => router.push('/')} className="exit-btn">
        <Home className="w-5 h-5" /> Exit Book
      </button>
      
      <button 
        onClick={() => setShowReportModal(true)} 
        className="report-btn"
        title="Report inappropriate content"
      >
        🚩 Report
      </button>

      {/* Report Modal */}
      {showReportModal && (
        <div className="report-modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            {reportSubmitted ? (
              <>
                <h3>✅ Thank you!</h3>
                <p>Your report has been submitted. We'll review it soon.</p>
                <button onClick={() => { setShowReportModal(false); setReportSubmitted(false); }} className="report-close-btn">
                  Close
                </button>
              </>
            ) : (
              <>
                <h3>🚩 Report Content</h3>
                <p>Is there something wrong with this book?</p>
                <div className="report-options">
                  {['Inappropriate content', 'Offensive images', 'Factual errors', 'Other issue'].map((reason) => (
                    <button
                      key={reason}
                      onClick={async () => {
                        await fetch('/api/report', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ animalA, animalB, reason }),
                        });
                        setReportSubmitted(true);
                      }}
                      className="report-option-btn"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowReportModal(false)} className="report-cancel-btn">
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* STYLES - Matching the PDF exactly */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap');
        
        .font-comic { font-family: 'Comic Neue', cursive; }
        
        .book-container {
          position: relative;
          width: 100%;
          max-width: 800px;
          height: 600px;
          perspective: 2000px;
        }
        
        .page {
          position: absolute;
          width: 100%;
          height: 100%;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          padding: 30px;
          overflow: auto;
          backface-visibility: hidden;
        }
        
        /* Backgrounds */
        .bg-green { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); }
        .bg-gold { background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%); }
        .bg-blue { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); }
        .bg-coral { background: linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%); }
        .bg-purple { background: linear-gradient(135deg, #ede7f6 0%, #d1c4e9 100%); }
        
        /* Cover Page */
        .cover-page {
          background: linear-gradient(135deg, #0077be 0%, #005a8c 100%) !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 30px !important;
        }
        
        .cover-banner {
          font-family: 'Bangers', cursive;
          font-size: 2.5em;
          color: #ff0000;
          background: #ffeb3b;
          padding: 12px 30px;
          border: 4px solid #ff0000;
          border-radius: 8px;
          text-shadow: 2px 2px 0px rgba(0,0,0,0.3);
          letter-spacing: 2px;
          margin-bottom: 20px;
          box-shadow: 0 6px 15px rgba(0,0,0,0.4);
        }
        
        .cover-title {
          font-family: 'Bangers', cursive;
          font-size: 2em;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.6);
          text-align: center;
          letter-spacing: 2px;
          margin-bottom: 15px;
        }
        
        .cover-image-container { flex: 1; display: flex; align-items: center; justify-content: center; }
        .cover-image { max-width: 100%; max-height: 350px; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.5); }
        
        /* Victory Page */
        .victory-page {
          background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%) !important;
          text-align: center;
        }
        .victory-title { color: #c62828 !important; font-size: 2.5em !important; }
        .victory-image { max-width: 80%; max-height: 250px; border-radius: 12px; margin: 20px auto; box-shadow: 0 8px 20px rgba(0,0,0,0.4); }
        
        /* Page Title */
        .page-title {
          font-family: 'Bangers', cursive;
          font-size: 2em;
          color: #ff5722;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
          margin-bottom: 20px;
          text-align: center;
          letter-spacing: 2px;
        }
        
        /* Side-by-side layout */
        .page-content-wrapper.side-by-side {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }
        .page-content-text { flex: 1; }
        .page-image-side { flex: 0 0 45%; }
        .page-image-integrated { width: 100%; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        
        /* Stats page */
        .stats-hero-image { width: 100%; max-height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 15px; }
        
        /* Battle pages */
        .battle-page { position: relative; }
        .battle-bg-image {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-size: cover;
          background-position: center;
          z-index: 0;
          border-radius: 10px;
        }
        .battle-page .page-title, .battle-page .page-content {
          position: relative;
          z-index: 1;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        }
        .battle-content {
          background: rgba(0,0,0,0.6);
          padding: 15px;
          border-radius: 10px;
        }
        
        /* Content styling */
        .page-content {
          font-size: 1.05em;
          line-height: 1.6;
          color: #222;
        }
        .page-content p {
          margin-bottom: 10px;
          background: rgba(255,255,255,0.7);
          padding: 8px 12px;
          border-radius: 6px;
          border-left: 4px solid #ff5722;
        }
        .page-content strong { color: #c62828; }
        .page-content ul { list-style: none; padding: 0; margin: 10px 0; }
        .page-content li {
          background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 8px;
          font-weight: bold;
          box-shadow: 0 3px 8px rgba(0,0,0,0.2);
        }
        .page-content table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
        .page-content th, .page-content td { padding: 10px; border: 1px solid #ddd; }
        
        /* Navigation */
        .nav-buttons { display: flex; gap: 20px; align-items: center; }
        .nav-btn {
          background: #ff5722;
          color: white;
          border: none;
          padding: 12px 25px;
          font-size: 1.1em;
          font-family: 'Bangers', cursive;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-btn:hover:not(:disabled) { background: #e64a19; transform: scale(1.05); }
        .nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .page-indicator { color: white; font-size: 1.2em; font-family: 'Bangers', cursive; letter-spacing: 1px; }
        
        .page-dots { display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; justify-content: center; }
        .dot { width: 12px; height: 12px; border-radius: 50%; background: rgba(255,255,255,0.3); border: none; cursor: pointer; transition: all 0.2s; }
        .dot.active { background: #ffeb3b; transform: scale(1.3); }
        .dot:hover { background: rgba(255,255,255,0.6); }
        
        .exit-btn {
          position: fixed;
          top: 20px;
          left: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.1);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 50px;
          cursor: pointer;
          font-family: 'Comic Neue', cursive;
          transition: all 0.2s;
        }
        .exit-btn:hover { background: rgba(255,255,255,0.2); }
        
        /* Choices */
        .choices-container { margin-top: 20px; }
        .choices-header { font-family: 'Bangers', cursive; font-size: 1.5em; color: #9c27b0; text-align: center; margin-bottom: 15px; }
        .choice-btn {
          display: block;
          width: 100%;
          padding: 15px;
          margin-bottom: 10px;
          background: linear-gradient(135deg, #9c27b0, #7b1fa2);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1.1em;
          font-family: 'Comic Neue', cursive;
          font-weight: bold;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }
        .choice-btn:hover { transform: translateX(5px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        .choice-emoji { font-size: 1.3em; margin-right: 10px; }
        
        .generating { text-align: center; margin-top: 20px; color: #9c27b0; font-size: 1.2em; }
        .generating span { display: inline-block; font-size: 3em; }
        
        /* Report button and modal */
        .report-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(255,255,255,0.1);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 50px;
          cursor: pointer;
          font-family: 'Comic Neue', cursive;
          font-size: 0.9em;
          transition: all 0.2s;
        }
        .report-btn:hover { background: rgba(255,100,100,0.3); }
        
        .report-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .report-modal {
          background: white;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          text-align: center;
        }
        
        .report-modal h3 {
          font-family: 'Bangers', cursive;
          font-size: 1.5em;
          color: #333;
          margin-bottom: 10px;
        }
        
        .report-modal p {
          color: #666;
          margin-bottom: 20px;
        }
        
        .report-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .report-option-btn {
          padding: 12px;
          background: #f0f0f0;
          border: 2px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Comic Neue', cursive;
          font-weight: bold;
          transition: all 0.2s;
        }
        
        .report-option-btn:hover {
          background: #ff6b6b;
          color: white;
          border-color: #ff6b6b;
        }
        
        .report-cancel-btn {
          padding: 10px 20px;
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-family: 'Comic Neue', cursive;
        }
        
        .report-close-btn {
          padding: 12px 24px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Comic Neue', cursive;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}

export default function ReadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center"><p className="text-white text-3xl">Loading...</p></div>}>
      <BookReader />
    </Suspense>
  );
}
