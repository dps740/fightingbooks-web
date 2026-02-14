'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import VersusScreen from './VersusScreen';
import { generatePdfClientSide, downloadPdf } from '@/lib/clientPdfGenerator';
import { useTier } from '@/lib/useTier';

interface AnimalStats {
  strength: number;
  speed: number;
  weapons: number;
  defense: number;
}

interface BookPage {
  id: string;
  type: 'cover' | 'intro' | 'stats' | 'battle' | 'choice' | 'victory';
  title: string;
  content: string;
  imageUrl?: string;
  choices?: Choice[];
  gateNumber?: number;
  animalAPortrait?: string;
  animalBPortrait?: string;
  stats?: {
    animalA: AnimalStats;
    animalB: AnimalStats;
  };
}

interface Choice {
  id: string;
  text: string;
  emoji: string;
  favors?: string;
  outcome?: string;
}

function BookReader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tierData = useTier();
  const [showVersusScreen, setShowVersusScreen] = useState(true);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [generatingChoice, setGeneratingChoice] = useState(false);
  const [choicesMade, setChoicesMade] = useState<Map<number, number>>(new Map()); // Map of gateNumber → choiceIndex
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [flaggedImages, setFlaggedImages] = useState<Set<string>>(new Set());
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });
  const [cyoaScore, setCyoaScore] = useState({ A: 0, B: 0 });
  const [cyoaPath, setCyoaPath] = useState(''); // Tracks choices: '' → 'A' → 'A-B' → 'A-B-N'
  const [showChoiceOverlay, setShowChoiceOverlay] = useState(false);
  const [selectedChoiceText, setSelectedChoiceText] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cyoaGatesLoading, setCyoaGatesLoading] = useState(false);
  const [cyoaGatesReady, setCyoaGatesReady] = useState(false);
  const MAX_AUTO_RETRIES = 2;

  const animalA = searchParams.get('a') || 'Lion';
  const animalB = searchParams.get('b') || 'Tiger';
  const mode = searchParams.get('mode') || 'standard';
  const environment = searchParams.get('env') || 'neutral';
  const forceRegenerate = searchParams.get('regenerate') === 'true';

  const handleVersusComplete = useCallback(() => {
    setShowVersusScreen(false);
  }, []);

  // Book is ready when pages are loaded
  const bookReady = pages.length > 0;

  // Start loading book data immediately (parallel with VS animation)
  useEffect(() => { 
    loadBook(); 
  }, [animalA, animalB, mode, environment]);

  // Load CYOA gates separately once the standard book is loaded
  const loadCyoaGates = async () => {
    if (mode !== 'cyoa' || cyoaGatesReady || cyoaGatesLoading) return;
    setCyoaGatesLoading(true);
    console.log('[CYOA] Loading gates in background...');
    
    try {
      const response = await fetch('/api/book/gates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animalA, animalB, forceRegenerate }),
      });
      const data = await response.json();
      
      if (response.ok && data.gatePage) {
        // Insert gate page after stats page
        setPages(prev => {
          const statsIndex = prev.findIndex(p => p.type === 'stats');
          if (statsIndex === -1) return [...prev, data.gatePage];
          const newPages = [...prev];
          newPages.splice(statsIndex + 1, 0, data.gatePage);
          return newPages;
        });
        setCyoaGatesReady(true);
        console.log('[CYOA] Gate 1 injected after stats page');
      } else {
        console.error('[CYOA] Gates load failed:', data.error);
      }
    } catch (error) {
      console.error('[CYOA] Gates fetch error:', error);
    }
    setCyoaGatesLoading(false);
  };

  const loadBook = async (attempt = 0) => {
    setLoadError(null);
    if (attempt > 0) {
      setLoading(true);
      setPages([]);
    }
    
    try {
      // Always request standard mode — CYOA gates load separately
      const response = await fetch('/api/book/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animalA, animalB, mode, environment, forceRegenerate }),
      });
      const data = await response.json();
      
      // Handle error responses from the API
      if (!response.ok) {
        if (data.code === 'SIGNUP_REQUIRED') {
          router.push(`/signup?redirect=/read?a=${encodeURIComponent(animalA)}&b=${encodeURIComponent(animalB)}&mode=${mode}&message=signup_for_adventure`);
          return;
        } else if (data.code === 'TIER_REQUIRED' || data.code === 'CYOA_TIER_REQUIRED') {
          setPages([{ 
            id: 'tier-required', 
            type: 'cover', 
            title: 'Upgrade Required', 
            content: `<p style="font-size: 1.2em; margin-bottom: 20px;">${data.message}</p><p><a href="/account" style="color: #d4af37; text-decoration: underline;">Upgrade your account</a> to access this content!</p>` 
          }]);
          setLoading(false);
          return;
        }
        // Server error — auto-retry (partial cache may help on retry)
        if (attempt < MAX_AUTO_RETRIES) {
          console.log(`Book generation failed (attempt ${attempt + 1}), retrying...`);
          setRetryCount(attempt + 1);
          await new Promise(r => setTimeout(r, 2000));
          return loadBook(attempt + 1);
        }
        setLoadError(data.message || 'Failed to generate book');
        setLoading(false);
        return;
      }
      
      if (data.pages?.length > 0) {
        let bookPages = data.pages;
        // In CYOA mode, strip standard battle/victory pages
        // They'll be replaced by CYOA choices + AI-generated outcomes
        if (mode === 'cyoa') {
          bookPages = bookPages.filter((p: BookPage) => 
            p.type !== 'battle' && p.type !== 'victory'
          );
        }
        setPages(bookPages);
        setLoadError(null);
        // Fire off CYOA gates in background if needed
        if (mode === 'cyoa') {
          // Small delay so book renders first, then gates load
          setTimeout(() => loadCyoaGates(), 100);
        }
      } else {
        if (attempt < MAX_AUTO_RETRIES) {
          console.log(`Empty book response (attempt ${attempt + 1}), retrying...`);
          setRetryCount(attempt + 1);
          await new Promise(r => setTimeout(r, 2000));
          return loadBook(attempt + 1);
        }
        setLoadError('Book generation timed out');
      }
    } catch (error) {
      if (attempt < MAX_AUTO_RETRIES) {
        console.log(`Book fetch error (attempt ${attempt + 1}), retrying...`);
        setRetryCount(attempt + 1);
        await new Promise(r => setTimeout(r, 2000));
        return loadBook(attempt + 1);
      }
      setLoadError('Connection error — please check your internet and try again');
    }
    setLoading(false);
  };

  const handleRetry = () => {
    setRetryCount(0);
    setLoadError(null);
    setLoading(true);
    setPages([]);
    setCyoaGatesReady(false);
    setCyoaGatesLoading(false);
    setShowVersusScreen(false);
    loadBook(0);
  };

  const handleChoice = async (choice: Choice, choiceIndex: number) => {
    const currentPageData = pages[currentPage];
    const gateNumber = currentPageData.gateNumber || 1;
    
    // Track which choice was made for this specific gate
    const newChoicesMade = new Map(choicesMade);
    newChoicesMade.set(gateNumber, choiceIndex);
    setChoicesMade(newChoicesMade);
    
    // Show overlay with chosen text
    setSelectedChoiceText(choice.text);
    setShowChoiceOverlay(true);
    
    // Wait 1.5 seconds before proceeding
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowChoiceOverlay(false);
    
    setGeneratingChoice(true);
    try {
      // Extract Tale of the Tape stats from pages if available
      const statsPage = pages.find(p => p.type === 'stats');
      let taleOfTheTape = undefined;
      if (statsPage && statsPage.stats) {
        taleOfTheTape = {
          animalA: statsPage.stats.animalA || { strength: 50, speed: 50, weapons: 50, defense: 50 },
          animalB: statsPage.stats.animalB || { strength: 50, speed: 50, weapons: 50, defense: 50 },
        };
      }
      
      const response = await fetch('/api/book/choice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalA,
          animalB,
          choiceIndex,
          gateNumber: currentPageData.gateNumber || 1,
          choiceFavors: choice.favors || 'neutral',
          choiceOutcome: choice.outcome || 'The battle continues!',
          currentScore: cyoaScore,
          currentPath: cyoaPath, // Send current path for caching
          allPages: pages,
          taleOfTheTape,
        }),
      });
      const data = await response.json();
      
      if (data.pages) {
        // Update score and path
        if (data.score) {
          setCyoaScore(data.score);
        }
        if (data.newPath) {
          setCyoaPath(data.newPath);
        }
        
        // Insert new pages right AFTER current page (not at end)
        const newPages = [...pages];
        newPages.splice(currentPage + 1, 0, ...data.pages);
        setPages(newPages);
        setGeneratingChoice(false);
        
        // Auto-advance to the outcome page after state has settled
        // Use requestAnimationFrame to ensure React has rendered the new pages
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            goToPage(currentPage + 1);
          });
        });
      }
    } catch (error) {
      console.error(error);
      setGeneratingChoice(false);
    }
  };

  // Flag a specific image for review
  const flagImage = async (pageId: string, imageUrl: string) => {
    const key = `${animalA}-${animalB}-${pageId}`;
    if (flaggedImages.has(key)) return;
    
    setFlaggedImages(prev => new Set(prev).add(key));
    try {
      await fetch('/api/report-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animalA, animalB, pageId, imageUrl }),
      });
    } catch (e) {
      console.error('Flag image error:', e);
    }
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

  // Show VS screen first (book loads in parallel)
  if (showVersusScreen) {
    return (
      <VersusScreen 
        fighterA={animalA} 
        fighterB={animalB} 
        bookReady={bookReady}
        onComplete={handleVersusComplete} 
      />
    );
  }

  // Error state with retry button
  if (loadError && pages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center font-comic">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-8xl mb-6">⚡</div>
          <h2 className="text-white text-3xl font-bold mb-4" style={{ fontFamily: "'Bangers', cursive", letterSpacing: '2px' }}>
            Book Generation Timed Out
          </h2>
          <p className="text-white/70 text-lg mb-2">
            New matchups take a moment to create for the first time.
          </p>
          <p className="text-white/50 text-base mb-8">
            Good news — progress was saved! Retrying should be much faster.
          </p>
          <button
            onClick={handleRetry}
            className="px-8 py-4 text-xl font-bold text-white rounded-full cursor-pointer transition-all hover:scale-105"
            style={{
              fontFamily: "'Bangers', cursive",
              letterSpacing: '2px',
              background: 'linear-gradient(135deg, #ff5722 0%, #e64a19 100%)',
              border: 'none',
              boxShadow: '0 4px 15px rgba(255, 87, 34, 0.4)',
            }}
          >
            🔄 Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="block mx-auto mt-4 text-white/50 hover:text-white/80 transition-colors bg-transparent border-none cursor-pointer text-base"
            style={{ fontFamily: "'Comic Neue', cursive" }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Only show loading if VS is done but book data isn't ready yet
  if (pages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center font-comic">
        <div className="text-center">
          <motion.div animate={{ rotateY: [0, 360] }} transition={{ repeat: Infinity, duration: 2 }} className="text-9xl mb-8">📖</motion.div>
          <p className="text-white text-3xl font-bold">Creating your battle book...</p>
          <p className="text-white/70 text-xl mt-2">
            {retryCount > 0 
              ? `Almost there — finishing up (attempt ${retryCount + 1})...` 
              : 'This takes about 30 seconds'}
          </p>
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
      <div className="book-container" style={{ perspective: '2000px' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentPage}
            initial={{ 
              rotateY: direction > 0 ? 90 : -90, 
              opacity: 0,
              scale: 0.95,
              boxShadow: direction > 0 
                ? '-20px 0 40px rgba(0,0,0,0.4)' 
                : '20px 0 40px rgba(0,0,0,0.4)'
            }}
            animate={{ 
              rotateY: 0, 
              opacity: 1,
              scale: 1,
              boxShadow: '0 5px 30px rgba(0,0,0,0.3)'
            }}
            exit={{ 
              rotateY: direction > 0 ? -90 : 90, 
              opacity: 0,
              scale: 0.95,
              boxShadow: direction > 0 
                ? '20px 0 40px rgba(0,0,0,0.4)' 
                : '-20px 0 40px rgba(0,0,0,0.4)'
            }}
            transition={{ 
              duration: 0.5,
              ease: [0.4, 0, 0.2, 1]
            }}
            style={{ 
              transformOrigin: direction > 0 ? 'left center' : 'right center',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden'
            }}
            className={`page ${getBg(currentPage, page?.type || 'intro')}`}
          >
            {/* COVER PAGE */}
            {page?.type === 'cover' && (
              <>
                <div className="cover-banner">WHO WOULD WIN?</div>
                <h1 className="cover-title">{page.title}</h1>
                <div className="cover-image-container" style={{ position: 'relative' }}>
                  {page.imageUrl && <img src={page.imageUrl} alt={page.title} className="cover-image" />}
                  {page.imageUrl && (
                    <button
                      onClick={(e) => { e.stopPropagation(); flagImage('cover', page.imageUrl!); }}
                      className={`image-flag-btn ${flaggedImages.has(`${animalA}-${animalB}-cover`) ? 'flagged' : ''}`}
                      title={flaggedImages.has(`${animalA}-${animalB}-cover`) ? 'Flagged for review' : 'Flag image for review'}
                    >
                      {flaggedImages.has(`${animalA}-${animalB}-cover`) ? '✅' : '🚩'}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* VICTORY PAGE */}
            {page?.type === 'victory' && (
              <>
                {page.imageUrl && <div className="victory-bg-image" style={{ backgroundImage: `url(${page.imageUrl})` }} />}
                {page.imageUrl && (
                  <button
                    onClick={(e) => { e.stopPropagation(); flagImage('victory', page.imageUrl!); }}
                    className={`image-flag-btn ${flaggedImages.has(`${animalA}-${animalB}-victory`) ? 'flagged' : ''}`}
                    title={flaggedImages.has(`${animalA}-${animalB}-victory`) ? 'Flagged for review' : 'Flag image for review'}
                  >
                    {flaggedImages.has(`${animalA}-${animalB}-victory`) ? '✅' : '🚩'}
                  </button>
                )}
                <div className="page-content" dangerouslySetInnerHTML={{ __html: page.content }} />
                
                {/* Tournament Winner Selection */}
                {searchParams.get('tournament') === 'true' && (
                  <div className="tournament-decision-section">
                    <div className="decision-banner">YOU DECIDE!</div>
                    <p className="decision-question">Who should advance to the next round?</p>
                    <div className="decision-fighters">
                      <button 
                        onClick={() => {
                          const tournamentState = JSON.parse(localStorage.getItem('tournament') || '{}');
                          tournamentState.lastWinner = animalA;
                          localStorage.setItem('tournament', JSON.stringify(tournamentState));
                          router.push('/tournament/bracket');
                        }}
                        className="decision-fighter-btn"
                      >
                        <img 
                          src={`/fighters/${animalA?.toLowerCase().replace(/ /g, '-')}.jpg`} 
                          alt={animalA || ''} 
                          className="decision-fighter-img"
                        />
                        <span className="decision-fighter-name">{animalA?.toUpperCase()}</span>
                      </button>
                      <div className="decision-or">OR</div>
                      <button 
                        onClick={() => {
                          const tournamentState = JSON.parse(localStorage.getItem('tournament') || '{}');
                          tournamentState.lastWinner = animalB;
                          localStorage.setItem('tournament', JSON.stringify(tournamentState));
                          router.push('/tournament/bracket');
                        }}
                        className="decision-fighter-btn"
                      >
                        <img 
                          src={`/fighters/${animalB?.toLowerCase().replace(/ /g, '-')}.jpg`} 
                          alt={animalB || ''} 
                          className="decision-fighter-img"
                        />
                        <span className="decision-fighter-name">{animalB?.toUpperCase()}</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Download Options - Only show if NOT tournament mode */}
                {searchParams.get('tournament') !== 'true' && (
                  <div className="download-section">
                  <h3 className="download-title">📥 Download Your Book</h3>
                  <div className="download-buttons">
                    <button 
                      onClick={async () => {
                        if (pdfGenerating) return;
                        setPdfGenerating(true);
                        setPdfProgress({ current: 0, total: pages.length });
                        try {
                          const winner = pages.find(p => p.type === 'victory')?.content?.match(/victory-name[^>]*>([^<]+)/)?.[1] || animalA;
                          const blob = await generatePdfClientSide({
                            animalA,
                            animalB,
                            pages,
                            winner,
                            onProgress: (current, total) => setPdfProgress({ current, total }),
                          });
                          downloadPdf(blob, `${animalA}_vs_${animalB}.pdf`);
                        } catch (e) {
                          console.error('PDF generation failed:', e);
                          alert('Failed to generate PDF. Please try again.');
                        } finally {
                          setPdfGenerating(false);
                        }
                      }}
                      className="download-btn download-pdf"
                      disabled={pdfGenerating}
                    >
                      {pdfGenerating ? `📄 Generating... (${pdfProgress.current}/${pdfProgress.total})` : '📄 Download PDF'}
                    </button>
                  </div>
                  <p className="download-note">Save your book to read offline or print!</p>
                </div>
                )}
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

            {/* EDU / FACTS PAGES - "Who Would Win?" style */}
            {(page?.type === 'intro') && (
              <>
                {page.imageUrl && (
                  <div className="edu-image-hero">
                    <img src={page.imageUrl} alt={page.title} className="edu-hero-img" />
                  </div>
                )}
                <div className="edu-content-bottom">
                  <h2 className="edu-title">{page.title}</h2>
                  <div className="page-content edu-content" dangerouslySetInnerHTML={{ __html: page.content }} />
                </div>
              </>
            )}

            {/* BATTLE PAGES */}
            {page?.type === 'battle' && (
              <>
                {page.imageUrl && <div className="battle-bg-image" style={{ backgroundImage: `url(${page.imageUrl})` }} />}
                {page.imageUrl && (
                  <button
                    onClick={(e) => { e.stopPropagation(); flagImage(page.id, page.imageUrl!); }}
                    className={`image-flag-btn ${flaggedImages.has(`${animalA}-${animalB}-${page.id}`) ? 'flagged' : ''}`}
                    title={flaggedImages.has(`${animalA}-${animalB}-${page.id}`) ? 'Flagged for review' : 'Flag image for review'}
                  >
                    {flaggedImages.has(`${animalA}-${animalB}-${page.id}`) ? '✅' : '🚩'}
                  </button>
                )}
                <h2 className="page-title">{page.title}</h2>
                <div className="page-content battle-content" dangerouslySetInnerHTML={{ __html: page.content }} />
              </>
            )}

            {/* CHOICE PAGE - CYOA Redesign */}
            {page?.type === 'choice' && (
              <div className="cyoa-decision-page">
                {/* Dark dramatic background */}
                {page.imageUrl && (
                  <div className="cyoa-bg-image" style={{ backgroundImage: `url(${page.imageUrl})` }} />
                )}
                <div className="cyoa-bg-overlay" />
                
                {/* VS Header with animal portraits */}
                <div className="cyoa-vs-header">
                  {page.animalAPortrait && (
                    <div className="cyoa-fighter-portrait">
                      <img src={page.animalAPortrait} alt={animalA} />
                      <p className="fighter-name">{animalA}</p>
                    </div>
                  )}
                  <div className="cyoa-vs-badge">⚡VS⚡</div>
                  {page.animalBPortrait && (
                    <div className="cyoa-fighter-portrait">
                      <img src={page.animalBPortrait} alt={animalB} />
                      <p className="fighter-name">{animalB}</p>
                    </div>
                  )}
                </div>

                {/* Decision header */}
                {/* Dynamic contextual title from AI */}
                <h2 className="cyoa-gate-title">⚔️ {page.title} ⚔️</h2>

                {/* Introduction text */}
                <div className="cyoa-intro-box" dangerouslySetInnerHTML={{ __html: page.content }} />

                {/* Choice cards */}
                {!generatingChoice && !showChoiceOverlay && page.choices && (
                  <div className="cyoa-choices-grid">
                    {page.choices.map((c, index) => {
                      const gateNumber = page.gateNumber || 1;
                      const isSelected = choicesMade.get(gateNumber) === index;
                      return (
                        <motion.button
                          key={index}
                          onClick={() => !isSelected && handleChoice(c, index)}
                          className={`cyoa-choice-card ${isSelected ? 'choice-selected' : ''}`}
                          whileHover={!isSelected ? { scale: 1.05 } : {}}
                          whileTap={!isSelected ? { scale: 0.95 } : {}}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          disabled={isSelected}
                        >
                          <span className="choice-card-icon">{c.emoji}</span>
                          <p className="choice-card-text">{c.text}</p>
                          {isSelected && <span className="choice-selected-badge">✓ YOUR CHOICE</span>}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Choice overlay - "You chose..." */}
                {showChoiceOverlay && (
                  <motion.div
                    className="choice-overlay"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="overlay-label">You chose:</p>
                    <p className="overlay-choice">{selectedChoiceText}</p>
                  </motion.div>
                )}

                {/* Generating next scene - Prominent animated loading */}
                {generatingChoice && !showChoiceOverlay && (
                  <motion.div
                    className="cyoa-loading-overlay"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      className="loading-spinner"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    >
                      ⚔️
                    </motion.div>
                    <motion.p
                      className="loading-text"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      The battle unfolds...
                    </motion.p>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky Upgrade CTA — only for non-paid users */}
      {tierData.tier !== 'member' && tierData.tier !== 'ultimate' && !tierData.loading && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-[#1a1a2e] via-[#2d1a4e] to-[#1a1a2e] border-t-2 border-[#FFD700] py-3 px-4 flex items-center justify-between">
          <p className="text-white text-sm">
            🔥 <span className="font-bold text-[#FFD700]">Want more?</span> Unlock all 47 animals, Adventure mode & Tournaments!
          </p>
          <a
            href="/#create"
            className="flex-shrink-0 ml-4 px-4 py-2 bg-[#FFD700] text-black font-bangers rounded-lg hover:bg-yellow-300 transition-all text-sm"
          >
            👑 Full Access — $4.99
          </a>
        </div>
      )}

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
          min-height: 500px;
          height: auto;
          perspective: 2000px;
          transform-style: preserve-3d;
        }
        
        @media (max-width: 768px) {
          .book-container {
            min-height: 400px;
          }
        }
        
        .page {
          position: relative;
          width: 100%;
          min-height: 500px;
          background: linear-gradient(to right, #f8f6f1 0%, #fffef9 5%, #fffef9 95%, #f5f3ee 100%);
          border-radius: 3px 10px 10px 3px;
          box-shadow: 
            0 0 5px rgba(0,0,0,0.1),
            0 5px 15px rgba(0,0,0,0.2),
            inset -2px 0 5px rgba(0,0,0,0.05),
            inset 3px 0 10px rgba(0,0,0,0.03);
          padding: 20px;
          overflow: auto;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }
        
        .page::before {
          content: '';
          position: absolute;
          left: 0;
          top: 5%;
          bottom: 5%;
          width: 3px;
          background: linear-gradient(to right, rgba(0,0,0,0.15), transparent);
          border-radius: 0 2px 2px 0;
        }
        
        @media (max-width: 768px) {
          .page {
            padding: 15px;
            min-height: auto;
            border-radius: 8px;
          }
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
          text-align: center;
          white-space: nowrap;
        }
        
        @media (max-width: 480px) {
          .cover-banner {
            font-size: 1.8em;
            padding: 10px 20px;
            letter-spacing: 1px;
          }
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
        
        /* Victory Page - matches battle page dramatic style */
        .victory-page {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          min-height: 500px;
          background: #1a1a1a !important;
        }
        .victory-title { 
          display: none;
        }
        .victory-bg-image {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-size: cover;
          background-position: center top;
          z-index: 0;
          border-radius: 10px;
        }
        .victory-overlay {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 20px;
          background: linear-gradient(transparent 0%, rgba(0,0,0,0.8) 100%);
          margin: 0 -20px;
          padding-top: 300px;
        }
        .victory-label {
          font-family: 'Bangers', cursive;
          font-size: 1.5em;
          color: #d4af37;
          letter-spacing: 4px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
          margin-bottom: 5px;
        }
        .victory-name {
          font-family: 'Bangers', cursive;
          font-size: 3.5em;
          color: #fff;
          text-shadow: 3px 3px 6px rgba(0,0,0,0.9);
          letter-spacing: 3px;
        }
        .victory-note {
          position: relative;
          z-index: 1;
          background: rgba(0,0,0,0.85);
          padding: 15px 20px;
          margin: 0 -20px -20px -20px;
          border-radius: 0 0 10px 10px;
        }
        .victory-note p {
          color: #ccc !important;
          font-size: 0.9em;
          line-height: 1.5;
          font-style: italic;
          margin: 0;
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }
        
        /* Tournament Decision Selection - Book Style */
        .tournament-decision-section {
          position: relative;
          z-index: 2;
          margin-top: 20px;
          padding: 25px;
          background: linear-gradient(135deg, #f5f5dc 0%, #fff8e1 100%);
          border-radius: 12px;
          border: 4px solid #ff5722;
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .decision-banner {
          font-family: 'Bangers', cursive;
          font-size: 2.5em;
          color: #ff0000;
          background: #ffeb3b;
          padding: 8px 30px;
          border: 4px solid #ff0000;
          border-radius: 8px;
          text-shadow: 2px 2px 0px rgba(0,0,0,0.3);
          letter-spacing: 3px;
          text-align: center;
          margin: 0 auto 15px;
          display: inline-block;
          width: 100%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .decision-question {
          font-family: 'Comic Neue', cursive;
          font-size: 1.3em;
          color: #333;
          text-align: center;
          margin-bottom: 20px;
          font-weight: bold;
        }
        .decision-fighters {
          display: flex;
          gap: 20px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }
        .decision-fighter-btn {
          background: white;
          border: 4px solid #333;
          border-radius: 12px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          min-width: 140px;
        }
        .decision-fighter-btn:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 8px 20px rgba(0,0,0,0.4);
          border-color: #ff5722;
        }
        .decision-fighter-img {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #333;
        }
        .decision-fighter-name {
          font-family: 'Bangers', cursive;
          font-size: 1.2em;
          color: #333;
          letter-spacing: 1px;
        }
        .decision-or {
          font-family: 'Bangers', cursive;
          font-size: 1.5em;
          color: #666;
        }
        
        /* Download Section */
        .download-section {
          position: relative;
          z-index: 2;
          margin-top: 20px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          border: 3px solid #d4af37;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .download-title {
          font-family: 'Bangers', cursive;
          font-size: 1.8em;
          color: #d4af37;
          margin-bottom: 15px;
          text-align: center;
        }
        .download-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .download-btn {
          padding: 15px 30px;
          font-size: 1.1em;
          font-family: 'Comic Neue', cursive;
          font-weight: bold;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .download-pdf {
          background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
          color: white;
        }
        .download-pdf:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.3);
        }
        .download-note {
          text-align: center;
          margin-top: 10px;
          font-size: 0.9em;
          color: #666;
          font-style: italic;
        }
        
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
        
        /* EDUCATIONAL PAGES - "Who Would Win?" Style */
        .edu-image-hero {
          width: 100%;
          height: 65%;
          min-height: 320px;
          overflow: hidden;
          border-radius: 10px 10px 0 0;
          margin: -20px -20px 0 -20px;
          position: relative;
        }
        .edu-hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
        }
        .edu-content-bottom {
          position: relative;
          background: linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 20%);
          padding: 15px 20px 20px;
          margin: -40px 0 0 0;
          border-radius: 15px 15px 0 0;
          z-index: 1;
        }
        .edu-title {
          font-family: 'Bangers', cursive;
          font-size: 2.5em;
          color: #ff5722;
          text-shadow: 3px 3px 0px #ffd54f, 4px 4px 8px rgba(0,0,0,0.3);
          margin-bottom: 15px;
          text-align: center;
          letter-spacing: 2px;
          line-height: 1.1;
        }
        .edu-content {
          font-size: 1.1em;
        }
        
        /* DID YOU KNOW boxes */
        .did-you-know {
          background: linear-gradient(135deg, #ffeb3b 0%, #ffc107 100%);
          border: 4px solid #ff5722;
          border-radius: 12px;
          padding: 15px;
          margin: 15px 0;
          box-shadow: 0 6px 15px rgba(0,0,0,0.3);
          position: relative;
        }
        .did-you-know::before {
          content: '💡 DID YOU KNOW?';
          display: block;
          font-family: 'Bangers', cursive;
          font-size: 1.5em;
          color: #ff5722;
          text-shadow: 2px 2px 0px white;
          margin-bottom: 8px;
          letter-spacing: 2px;
        }
        .did-you-know p {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          color: #1a1a1a !important;
          font-weight: bold;
          font-size: 1.05em;
          line-height: 1.4;
        }
        
        /* THINK ABOUT IT boxes */
        .think-about-it {
          background: linear-gradient(135deg, #81d4fa 0%, #4fc3f7 100%);
          border: 4px solid #0277bd;
          border-radius: 12px;
          padding: 15px;
          margin: 15px 0;
          box-shadow: 0 6px 15px rgba(0,0,0,0.3);
        }
        .think-about-it::before {
          content: '🤔 THINK ABOUT IT!';
          display: block;
          font-family: 'Bangers', cursive;
          font-size: 1.5em;
          color: #0277bd;
          text-shadow: 2px 2px 0px white;
          margin-bottom: 8px;
          letter-spacing: 2px;
        }
        .think-about-it p {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          color: #1a1a1a !important;
          font-weight: bold;
          font-size: 1.05em;
          font-style: italic;
        }
        
        /* SIZE COMPARISON boxes */
        .size-compare {
          background: linear-gradient(135deg, #a5d6a7 0%, #81c784 100%);
          border: 4px solid #2e7d32;
          border-radius: 12px;
          padding: 15px;
          margin: 15px 0;
          box-shadow: 0 6px 15px rgba(0,0,0,0.3);
          text-align: center;
        }
        .size-compare .size-emoji {
          font-size: 3em;
          display: block;
          margin-bottom: 10px;
        }
        .size-compare p {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          color: #1a1a1a !important;
          font-weight: bold;
          font-size: 1.2em;
        }
        
        /* WEAPON/DEFENSE highlight boxes */
        .weapon-box {
          background: linear-gradient(135deg, #ef5350 0%, #e53935 100%);
          border: 4px solid #b71c1c;
          border-radius: 12px;
          padding: 12px;
          margin: 10px 0;
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .weapon-box::before {
          content: '⚔️ WEAPON: ';
          font-family: 'Bangers', cursive;
          font-size: 1.2em;
          letter-spacing: 1px;
        }
        .defense-box {
          background: linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%);
          border: 4px solid #0d47a1;
          border-radius: 12px;
          padding: 12px;
          margin: 10px 0;
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .defense-box::before {
          content: '🛡️ DEFENSE: ';
          font-family: 'Bangers', cursive;
          font-size: 1.2em;
          letter-spacing: 1px;
        }
        .weapon-box p, .defense-box p {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          display: inline;
          font-weight: bold;
          font-size: 1.1em;
        }
        
        /* Visual stat bars */
        .stat-bar-container {
          margin: 20px 0;
        }
        .stat-bar-label {
          font-family: 'Bangers', cursive;
          font-size: 1.3em;
          color: #ff5722;
          margin-bottom: 5px;
          letter-spacing: 1px;
        }
        .stat-note {
          font-size: 0.9em;
          color: #333;
          font-style: italic;
          margin: 5px 0 10px 0;
          text-align: center;
          background: rgba(255,215,0,0.2);
          padding: 5px 10px;
          border-radius: 8px;
          border-left: 3px solid #FFD700;
        }
        .stat-bar {
          width: 100%;
          height: 30px;
          background: #e0e0e0;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.2);
          position: relative;
        }
        .stat-bar-fill {
          height: 100%;
          background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 10px;
          font-weight: bold;
          color: white;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          transition: width 0.5s ease;
        }
        
        /* Habitat icons */
        .habitat-badge {
          display: inline-block;
          background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
          color: white;
          padding: 8px 15px;
          border-radius: 20px;
          font-weight: bold;
          margin: 5px;
          border: 3px solid #2e7d32;
          box-shadow: 0 3px 8px rgba(0,0,0,0.2);
          font-size: 0.95em;
        }
        .habitat-badge::before {
          content: '🌍 ';
          font-size: 1.2em;
        }
        
        /* Mobile responsive adjustments */
        @media (max-width: 768px) {
          .edu-image-hero {
            height: 55%;
            min-height: 250px;
          }
          .edu-title {
            font-size: 1.8em;
          }
          .edu-content {
            font-size: 1em;
          }
          .did-you-know::before,
          .think-about-it::before {
            font-size: 1.2em;
          }
          .size-compare .size-emoji {
            font-size: 2.5em;
          }
          .stat-bar-label {
            font-size: 1.1em;
          }
        }
        
        /* Stats page */
        .stats-hero-image { width: 100%; max-height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 15px; }
        
        /* Battle pages - text at bottom, image prominent */
        .battle-page { 
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          min-height: 500px;
        }
        .battle-bg-image {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-size: cover;
          background-position: center top;
          z-index: 0;
          border-radius: 10px;
        }
        .battle-page .page-title {
          position: relative;
          z-index: 1;
          color: white;
          text-shadow: 3px 3px 6px rgba(0,0,0,0.9);
          font-size: 1.5em;
          margin-bottom: 10px;
        }
        .battle-page .page-title:empty {
          display: none;
        }
        .battle-content {
          position: relative;
          z-index: 1;
          background: linear-gradient(transparent 0%, transparent 85%, rgba(0,0,0,0.7) 95%, rgba(0,0,0,0.9) 100%);
          padding: 420px 20px 12px 20px;
          border-radius: 0 0 10px 10px;
          margin: 0 -20px -20px -20px;
          color: white;
        }
        
        @media (max-width: 768px) {
          .battle-content {
            padding-top: 350px;
            background: linear-gradient(transparent 0%, transparent 82%, rgba(0,0,0,0.7) 92%, rgba(0,0,0,0.9) 100%);
          }
        }
        .battle-content p {
          background: rgba(255,255,255,0.1) !important;
          color: white !important;
          border-left-color: #ffd700 !important;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          font-size: 0.95em;
          line-height: 1.4;
          padding: 6px 10px !important;
          margin-bottom: 0 !important;
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
        .image-flag-btn {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          opacity: 0.4;
          z-index: 10;
          padding: 0;
        }
        .image-flag-btn:hover {
          opacity: 1;
          background: rgba(255,50,50,0.6);
          transform: scale(1.1);
        }
        .image-flag-btn.flagged {
          opacity: 0.8;
          background: rgba(50,200,50,0.4);
          cursor: default;
        }
        .battle-page { position: relative; }
        
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
        
        /* Mobile responsive fixes for button overlaps */
        @media (max-width: 640px) {
          .nav-buttons {
            flex-direction: row;
            gap: 8px;
            padding: 0 60px;
          }
          .nav-btn {
            padding: 8px 14px;
            font-size: 0.9em;
          }
          .page-indicator {
            font-size: 0.9em;
            white-space: nowrap;
          }
          .exit-btn {
            top: 10px;
            left: 10px;
            padding: 8px 12px;
            font-size: 0.85em;
          }
          .exit-btn span:last-child {
            display: none;
          }
          .report-btn {
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            font-size: 0.85em;
          }
        }
        
        @media (max-width: 480px) {
          .nav-buttons {
            gap: 5px;
            padding: 0 50px;
          }
          .nav-btn {
            padding: 6px 10px;
            font-size: 0.8em;
          }
          .page-indicator {
            font-size: 0.75em;
          }
          .exit-btn, .report-btn {
            padding: 6px 10px;
            font-size: 0.75em;
          }
        }

        /* CYOA REDESIGN STYLES */
        
        .cyoa-decision-page {
          position: relative;
          width: 100%;
          min-height: 600px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 30px 20px;
          overflow: hidden;
        }
        
        .cyoa-bg-image {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-size: cover;
          background-position: center;
          filter: blur(3px);
          z-index: 0;
        }
        
        .cyoa-bg-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(26, 26, 46, 0.92) 0%, rgba(22, 33, 62, 0.95) 100%);
          z-index: 1;
        }
        
        .cyoa-vs-header {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 30px;
          margin-bottom: 20px;
        }
        
        .cyoa-fighter-portrait {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .cyoa-fighter-portrait img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid rgba(212, 175, 55, 0.8);
          object-fit: cover;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        }
        
        .cyoa-fighter-portrait .fighter-name {
          font-family: 'Bangers', cursive;
          font-size: 1.1em;
          color: #d4af37;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
          margin: 0;
        }
        
        .cyoa-vs-badge {
          font-family: 'Bangers', cursive;
          font-size: 2em;
          color: #ff0000;
          background: #ffeb3b;
          padding: 8px 20px;
          border: 3px solid #ff0000;
          border-radius: 8px;
          text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        }
        
        .cyoa-gate-title {
          position: relative;
          z-index: 2;
          font-family: 'Bangers', cursive;
          font-size: 2.5em;
          color: #d4af37;
          text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.9);
          text-align: center;
          margin: 10px 0 5px;
          letter-spacing: 2px;
        }
        
        .cyoa-decision-number {
          position: relative;
          z-index: 2;
          font-family: 'Comic Neue', cursive;
          font-size: 1.2em;
          color: rgba(255, 255, 255, 0.8);
          text-align: center;
          margin: 0 0 20px;
        }
        
        .cyoa-intro-box {
          position: relative;
          z-index: 2;
          background: rgba(0, 0, 0, 0.6);
          border: 2px solid rgba(212, 175, 55, 0.4);
          border-radius: 12px;
          padding: 15px 25px;
          margin-bottom: 30px;
          max-width: 600px;
        }
        
        .cyoa-intro-box p {
          color: white;
          font-size: 1.1em;
          margin: 0;
          text-align: center;
          line-height: 1.6;
        }
        
        .decision-intro {
          color: white !important;
          font-weight: bold;
          font-size: 1.2em !important;
        }
        
        .cyoa-choices-grid {
          position: relative;
          z-index: 2;
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 900px;
          margin-top: 20px;
        }
        
        .cyoa-choice-card {
          background: linear-gradient(135deg, #4a1a6b 0%, #2d1b4e 100%);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 25px 20px;
          min-width: 200px;
          max-width: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        }
        
        .cyoa-choice-card:hover {
          transform: scale(1.05);
          box-shadow: 0 0 30px rgba(255, 200, 0, 0.5);
          border-color: gold;
        }
        
        .cyoa-choice-card.choice-selected {
          border-color: #ff3333;
          box-shadow: 0 0 25px rgba(255, 50, 50, 0.7), 0 0 50px rgba(255, 50, 50, 0.4);
          cursor: default;
          position: relative;
        }
        
        .cyoa-choice-card.choice-selected:hover {
          transform: none;
          box-shadow: 0 0 25px rgba(255, 50, 50, 0.7), 0 0 50px rgba(255, 50, 50, 0.4);
          border-color: #ff3333;
        }
        
        .choice-selected-badge {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          background: #ff3333;
          color: white;
          font-size: 0.7rem;
          font-weight: bold;
          padding: 4px 12px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .choice-card-icon {
          font-size: 3rem;
          line-height: 1;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .choice-card-text {
          color: white;
          font-family: 'Comic Neue', cursive;
          font-size: 1.1em;
          font-weight: bold;
          text-align: center;
          margin: 0;
          line-height: 1.4;
        }
        
        .choice-overlay {
          position: relative;
          z-index: 3;
          background: rgba(0, 0, 0, 0.9);
          border: 3px solid gold;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 8px 30px rgba(212, 175, 55, 0.5);
          max-width: 500px;
        }
        
        .cyoa-loading-overlay {
          position: relative;
          z-index: 3;
          background: linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.98) 100%);
          border: 4px solid #d4af37;
          border-radius: 20px;
          padding: 60px 40px;
          text-align: center;
          box-shadow: 
            0 0 40px rgba(212, 175, 55, 0.6),
            0 0 80px rgba(212, 175, 55, 0.3),
            inset 0 0 60px rgba(212, 175, 55, 0.1);
          max-width: 500px;
          min-height: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 30px;
        }
        
        .loading-spinner {
          font-size: 5rem;
          filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.8));
        }
        
        .loading-text {
          font-family: 'Bangers', cursive;
          font-size: 2em;
          color: #d4af37;
          text-shadow: 
            0 0 10px rgba(212, 175, 55, 0.8),
            2px 2px 4px rgba(0, 0, 0, 0.8);
          letter-spacing: 2px;
          margin: 0;
        }
        
        .overlay-label {
          font-family: 'Bangers', cursive;
          font-size: 1.8em;
          color: #d4af37;
          margin: 0 0 15px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        }
        
        .overlay-choice {
          font-family: 'Comic Neue', cursive;
          font-size: 1.3em;
          color: white;
          font-weight: bold;
          margin: 0;
          line-height: 1.5;
        }
        
        .outcome-text {
          font-size: 1.2em;
          line-height: 1.8;
          color: #333;
        }
        
        .cyoa-results {
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid gold;
          border-radius: 12px;
          padding: 20px;
          margin-top: 20px;
        }
        
        .results-title {
          font-family: 'Bangers', cursive;
          font-size: 1.5em;
          color: #d4af37;
          text-align: center;
          margin: 0 0 15px;
        }
        
        .score-reveal {
          display: flex;
          gap: 30px;
          justify-content: center;
          margin-bottom: 15px;
        }
        
        .score-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .score-animal {
          font-family: 'Comic Neue', cursive;
          font-size: 1.2em;
          font-weight: bold;
          color: white;
        }
        
        .score-value {
          font-family: 'Bangers', cursive;
          font-size: 2em;
          color: #d4af37;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        }
        
        .results-note {
          font-family: 'Comic Neue', cursive;
          color: rgba(255, 255, 255, 0.8);
          text-align: center;
          font-size: 0.95em;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .cyoa-gate-title {
            font-size: 1.8em;
          }
          
          .cyoa-vs-header {
            gap: 15px;
          }
          
          .cyoa-fighter-portrait img {
            width: 60px;
            height: 60px;
          }
          
          .cyoa-vs-badge {
            font-size: 1.5em;
            padding: 6px 15px;
          }
          
          .cyoa-choices-grid {
            gap: 15px;
          }
          
          .cyoa-choice-card {
            min-width: 150px;
            max-width: 180px;
            padding: 20px 15px;
          }
          
          .choice-card-icon {
            font-size: 2.5rem;
          }
          
          .choice-card-text {
            font-size: 1em;
          }
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
