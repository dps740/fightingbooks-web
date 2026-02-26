'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_EMAILS = ['david.smith@epsilon-three.com', 'davidpatricksmith@hotmail.com'];

const PAGE_OPTIONS = [
  { id: 'cover', label: '📕 Cover' },
  { id: 'battle-1', label: '⚔️ Battle 1' },
  { id: 'battle-2', label: '⚔️ Battle 2' },
  { id: 'battle-3', label: '⚔️ Battle 3' },
  { id: 'battle-4', label: '⚔️ Battle 4' },
  { id: 'battle-5', label: '⚔️ Battle 5' },
  { id: 'victory', label: '🏆 Victory' },
];

// All 27 possible CYOA paths
const ALL_PATHS = [
  'A-A-A', 'A-A-B', 'A-A-N',
  'A-B-A', 'A-B-B', 'A-B-N',
  'A-N-A', 'A-N-B', 'A-N-N',
  'B-A-A', 'B-A-B', 'B-A-N',
  'B-B-A', 'B-B-B', 'B-B-N',
  'B-N-A', 'B-N-B', 'B-N-N',
  'N-A-A', 'N-A-B', 'N-A-N',
  'N-B-A', 'N-B-B', 'N-B-N',
  'N-N-A', 'N-N-B', 'N-N-N',
];

interface CachedBook {
  name: string;
  size: number;
  uploaded: string;
}

interface CyoaMatchup {
  key: string;
  animalA: string;
  animalB: string;
  hasGates: boolean;
  paths: { path: string; url: string; size: number; uploaded: string }[];
  pathCount: number;
  totalPaths: number;
}

interface CacheData {
  books: CachedBook[];
  pdfs: CachedBook[];
  counts: { books: number; pdfs: number };
}

interface CyoaData {
  matchups: CyoaMatchup[];
  totalMatchups: number;
  totalPaths: number;
}

function parseBookName(name: string): { animalA: string; animalB: string } | null {
  const parts = name.replace('-neutral', '').split('-vs-');
  if (parts.length !== 2) return null;
  return {
    animalA: parts[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    animalB: parts[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  };
}

export default function AdminPage() {
  const router = useRouter();
  
  // Admin auth state
  const [authChecking, setAuthChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Cache management state
  const [cacheData, setCacheData] = useState<CacheData | null>(null);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [cacheError, setCacheError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'books' | 'cyoa' | 'flagged' | 'add-animal'>('books');
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [regenLoading, setRegenLoading] = useState<string | null>(null);
  const [regenResult, setRegenResult] = useState<{bookName: string; pageId: string; success: boolean; message: string} | null>(null);
  
  // CYOA state
  const [cyoaData, setCyoaData] = useState<CyoaData | null>(null);
  const [cyoaLoading, setCyoaLoading] = useState(false);
  const [cyoaError, setCyoaError] = useState('');
  const [expandedMatchup, setExpandedMatchup] = useState<string | null>(null);
  const [cyoaDeleteLoading, setCyoaDeleteLoading] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [cyoaImageLoading, setCyoaImageLoading] = useState<string | null>(null);
  const [cyoaImageResult, setCyoaImageResult] = useState<{success: boolean; message: string} | null>(null);

  // Flagged images state
  interface ImageReport {
    id: string;
    animal_a: string;
    animal_b: string;
    page_id: string | null;
    image_url: string | null;
    reason: string;
    description: string | null;
    status: string;
    ai_assessment: string | null;
    resolution_action: string | null;
    resolution_notes: string | null;
    resolved_by: string | null;
    reported_at: string;
    resolved_at?: string;
  }
  const [flaggedReports, setFlaggedReports] = useState<ImageReport[]>([]);
  const [flaggedLoading, setFlaggedLoading] = useState(false);
  const [flaggedError, setFlaggedError] = useState('');
  const [flaggedFilter, setFlaggedFilter] = useState<'pending' | 'needs_human' | 'resolved' | 'auto_resolved' | 'dismissed'>('pending');
  const [flaggedRegenLoading, setFlaggedRegenLoading] = useState<string | null>(null);
  const [flaggedActionResult, setFlaggedActionResult] = useState<{id: string; success: boolean; message: string} | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  // Add Animal state
  const [addAnimalName, setAddAnimalName] = useState('');
  const [addAnimalCategory, setAddAnimalCategory] = useState<'real' | 'dinosaur' | 'fantasy'>('real');
  const [addAnimalLoading, setAddAnimalLoading] = useState(false);
  const [addAnimalStatus, setAddAnimalStatus] = useState('');
  const [addAnimalResult, setAddAnimalResult] = useState<{ success: boolean; message: string; animal?: { name: string; slug: string; images: Record<string, string> } } | null>(null);

  // Check admin auth on mount
  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch('/api/user/tier');
        const data = await response.json();
        
        if (data.isAuthenticated && data.email && ADMIN_EMAILS.includes(data.email.toLowerCase())) {
          setIsAdmin(true);
        } else {
          router.push('/');
        }
      } catch {
        router.push('/');
      }
      setAuthChecking(false);
    }
    checkAdmin();
  }, [router]);

  // Load cached books
  const loadCache = async () => {
    setCacheLoading(true);
    setCacheError('');
    try {
      const response = await fetch('/api/admin/delete-book');
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Failed to load cache');
      setCacheData(data);
    } catch (err) {
      setCacheError(err instanceof Error ? err.message : 'Failed to load cache');
    }
    setCacheLoading(false);
  };

  // Load CYOA cache
  const loadCyoa = async () => {
    setCyoaLoading(true);
    setCyoaError('');
    try {
      const response = await fetch('/api/admin/cyoa-cache');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load CYOA cache');
      setCyoaData(data);
    } catch (err) {
      setCyoaError(err instanceof Error ? err.message : 'Failed to load CYOA cache');
    }
    setCyoaLoading(false);
  };

  // Delete a cached book
  const deleteBook = async (bookName: string, deleteImages: boolean = false) => {
    const parts = bookName.replace('-neutral', '').split('-vs-');
    if (parts.length !== 2) {
      setCacheError('Invalid book name format');
      return;
    }

    const [a, b] = parts;
    setDeleteLoading(bookName);
    setCacheError('');

    try {
      const response = await fetch('/api/admin/delete-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ animalA: a, animalB: b, deleteImages }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete');
      await loadCache();
    } catch (err) {
      setCacheError(err instanceof Error ? err.message : 'Failed to delete book');
    }
    setDeleteLoading(null);
  };

  // Delete CYOA cache for a matchup
  const deleteCyoa = async (matchupKey: string, pathOnly: boolean = false, gatesOnly: boolean = false, specificPath?: string) => {
    setCyoaDeleteLoading(specificPath || matchupKey);
    setCyoaError('');

    try {
      const response = await fetch('/api/admin/cyoa-cache', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchupKey, pathOnly, gatesOnly, specificPath }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete');
      setSelectedPath(null);
      await loadCyoa();
    } catch (err) {
      setCyoaError(err instanceof Error ? err.message : 'Failed to delete CYOA cache');
    }
    setCyoaDeleteLoading(null);
  };

  // Load flagged image reports (from Supabase via /api/report)
  const loadFlaggedImages = async () => {
    setFlaggedLoading(true);
    setFlaggedError('');
    try {
      const response = await fetch(`/api/report?status=${flaggedFilter}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load reports');
      setFlaggedReports(data.reports || []);
    } catch (err) {
      setFlaggedError(err instanceof Error ? err.message : 'Failed to load flagged images');
    }
    setFlaggedLoading(false);
  };

  // Regenerate a flagged image and mark resolved
  const regenerateFlaggedImage = async (report: ImageReport) => {
    if (!report.page_id) {
      setFlaggedActionResult({ id: report.id, success: false, message: 'No page ID — cannot regenerate (general report)' });
      return;
    }
    setFlaggedRegenLoading(report.id);
    setFlaggedActionResult(null);

    try {
      const response = await fetch('/api/admin/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalA: report.animal_a.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          animalB: report.animal_b.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          pageId: report.page_id,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        // Mark report as resolved in Supabase
        await fetch('/api/report', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: report.id,
            status: 'resolved',
            resolution_action: 'regenerated',
            resolution_notes: adminNotes[report.id] || null,
            resolved_by: 'david',
          }),
        });
        setFlaggedActionResult({ id: report.id, success: true, message: 'Regenerated & resolved!' });
        await loadFlaggedImages();
      } else {
        setFlaggedActionResult({ id: report.id, success: false, message: data.error || 'Regeneration failed' });
      }
    } catch (err) {
      setFlaggedActionResult({ id: report.id, success: false, message: 'Network error' });
    }
    setFlaggedRegenLoading(null);
  };

  // Dismiss a flagged image (mark as not needing regen)
  const dismissFlaggedImage = async (reportId: string) => {
    try {
      await fetch('/api/report', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: reportId,
          status: 'dismissed',
          resolution_action: 'dismissed',
          resolution_notes: adminNotes[reportId] || null,
          resolved_by: 'david',
        }),
      });
      await loadFlaggedImages();
    } catch (err) {
      setFlaggedError('Failed to dismiss report');
    }
  };

  // Regenerate a specific CYOA image
  const regenerateCyoaImage = async (matchupKey: string, pathKey: string, imageId: string) => {
    setCyoaImageLoading(`${pathKey}-${imageId}`);
    setCyoaImageResult(null);

    try {
      const response = await fetch('/api/admin/cyoa-cache', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchupKey, path: pathKey, imageId }),
      });

      const data = await response.json();
      setCyoaImageResult({
        success: response.ok,
        message: response.ok ? `Regenerated ${imageId}!` : (data.error || 'Failed'),
      });
    } catch (err) {
      setCyoaImageResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network error',
      });
    }
    setCyoaImageLoading(null);
  };

  // Regenerate image for a book
  const regenerateImageForBook = async (bookName: string, pageId: string) => {
    const animals = parseBookName(bookName);
    if (!animals) return;

    setRegenLoading(`${bookName}-${pageId}`);
    setRegenResult(null);

    try {
      const response = await fetch('/api/admin/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalA: animals.animalA,
          animalB: animals.animalB,
          pageId,
        }),
      });

      const data = await response.json();
      setRegenResult({
        bookName,
        pageId,
        success: response.ok,
        message: response.ok ? 'Image regenerated!' : (data.error || 'Failed'),
      });
    } catch (err) {
      setRegenResult({
        bookName,
        pageId,
        success: false,
        message: 'Network error',
      });
    }
    setRegenLoading(null);
  };

  useEffect(() => {
    if (activeTab === 'books') {
      loadCache();
    } else if (activeTab === 'cyoa') {
      loadCyoa();
    } else if (activeTab === 'flagged') {
      loadFlaggedImages();
    }
  }, [activeTab, flaggedFilter]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBookName = (name: string) => {
    return name
      .replace('-neutral', '')
      .replace(/-vs-/g, ' vs ')
      .replace(/-/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Show loading while checking auth
  if (authChecking) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)' }}
      >
        <div className="text-[#FFD700] text-2xl font-bangers animate-pulse">Checking access...</div>
      </div>
    );
  }

  // Don't render if not admin (will redirect)
  if (!isAdmin) {
    return null;
  }

  return (
    <div 
      className="min-h-screen text-white p-8 font-comic"
      style={{ background: 'linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)' }}
    >
      <div className="max-w-5xl mx-auto">
        <h1 
          className="text-4xl font-bangers text-[#FFD700] mb-2"
          style={{ textShadow: '2px 2px 0 #000' }}
        >
          🔧 FightingBooks Admin
        </h1>
        <p className="text-white/70 mb-6">Manage cached books and CYOA paths</p>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('books')}
            className={`px-6 py-3 rounded-lg font-bangers text-lg transition-all border-2 ${
              activeTab === 'books'
                ? 'bg-[#FFD700] text-black border-[#FFD700]'
                : 'bg-[#1a1a2e] border-[#FFD700]/30 hover:border-[#FFD700]/50 text-white'
            }`}
          >
            📚 Standard Books
          </button>
          <button
            onClick={() => setActiveTab('cyoa')}
            className={`px-6 py-3 rounded-lg font-bangers text-lg transition-all border-2 ${
              activeTab === 'cyoa'
                ? 'bg-[#FFD700] text-black border-[#FFD700]'
                : 'bg-[#1a1a2e] border-[#FFD700]/30 hover:border-[#FFD700]/50 text-white'
            }`}
          >
            🎮 CYOA Paths
          </button>
          <button
            onClick={() => setActiveTab('flagged')}
            className={`px-6 py-3 rounded-lg font-bangers text-lg transition-all border-2 ${
              activeTab === 'flagged'
                ? 'bg-[#FFD700] text-black border-[#FFD700]'
                : 'bg-[#1a1a2e] border-[#FFD700]/30 hover:border-[#FFD700]/50 text-white'
            }`}
          >
            🚩 Flagged Images
          </button>
          <button
            onClick={() => setActiveTab('add-animal')}
            className={`px-6 py-3 rounded-lg font-bangers text-lg transition-all border-2 ${
              activeTab === 'add-animal'
                ? 'bg-[#FFD700] text-black border-[#FFD700]'
                : 'bg-[#1a1a2e] border-[#FFD700]/30 hover:border-[#FFD700]/50 text-white'
            }`}
          >
            🦁 Add Animal
          </button>
        </div>

        {/* Standard Books Tab */}
        {activeTab === 'books' && (
          <div className="bg-[#1a1a2e] border-4 border-[#FFD700] rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bangers text-[#FFD700]">📚 Cached Standard Books</h2>
              <button
                onClick={loadCache}
                disabled={cacheLoading}
                className="px-4 py-2 rounded font-bangers transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1e5a3d 0%, #2d7a4d 100%)', color: 'white' }}
              >
                {cacheLoading ? '⏳ Loading...' : '🔄 Refresh'}
              </button>
            </div>

            {cacheError && (
              <div className="bg-red-900/50 border-2 border-red-500 rounded-lg p-4 mb-4">
                <p className="text-red-300">❌ {cacheError}</p>
              </div>
            )}

            {cacheData && (
              <>
                <div className="mb-4 text-white/70">
                  Total: {cacheData.counts.books} books, {cacheData.counts.pdfs} PDFs
                </div>

                {cacheData.books.length === 0 ? (
                  <p className="text-white/50 text-center py-8">No cached books found</p>
                ) : (
                  <div className="space-y-3">
                    {cacheData.books.map((book) => (
                      <div key={book.name} className="bg-[#0d0d1a] border-2 border-[#FFD700]/30 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4">
                          <div className="flex-1 cursor-pointer" onClick={() => setExpandedBook(expandedBook === book.name ? null : book.name)}>
                            <p className="font-bangers text-lg text-[#FFD700]">{formatBookName(book.name)}</p>
                            <p className="text-sm text-white/60">
                              {formatSize(book.size)} • {formatDate(book.uploaded)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setExpandedBook(expandedBook === book.name ? null : book.name)}
                              className={`px-3 py-2 rounded text-sm transition border-2 ${expandedBook === book.name ? 'bg-[#FFD700] text-black border-[#FFD700]' : 'bg-[#1a1a2e] border-[#FFD700]/50 hover:border-[#FFD700]'}`}
                            >
                              🎨 Images
                            </button>
                            <button
                              onClick={() => {
                                const parts = book.name.replace('-neutral', '').split('-vs-');
                                if (parts.length === 2) {
                                  window.open(`/read?a=${parts[0]}&b=${parts[1]}`, '_blank');
                                }
                              }}
                              className="px-3 py-2 rounded text-sm transition"
                              style={{ background: 'linear-gradient(135deg, #1e5a3d 0%, #2d7a4d 100%)' }}
                            >
                              👁️ View
                            </button>
                            <button
                              onClick={() => {
                                const parts = book.name.replace('-neutral', '').split('-vs-');
                                if (parts.length === 2) {
                                  window.open(`/read?a=${parts[0]}&b=${parts[1]}&mode=cyoa`, '_blank');
                                }
                              }}
                              className="px-3 py-2 rounded text-sm transition"
                              style={{ background: 'linear-gradient(135deg, #5a1e3d 0%, #7a2d4d 100%)' }}
                            >
                              🎮 CYOA
                            </button>
                            <button
                              onClick={() => deleteBook(book.name, false)}
                              disabled={deleteLoading === book.name}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition disabled:opacity-50"
                              title="Delete book (keep images)"
                            >
                              {deleteLoading === book.name ? '⏳' : '🗑️'}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete ${formatBookName(book.name)} AND all its images?`)) {
                                  deleteBook(book.name, true);
                                }
                              }}
                              disabled={deleteLoading === book.name}
                              className="px-3 py-2 bg-red-800 hover:bg-red-900 rounded text-sm transition disabled:opacity-50"
                              title="Delete book + all images"
                            >
                              💥
                            </button>
                          </div>
                        </div>

                        {/* Expanded image regeneration panel */}
                        {expandedBook === book.name && (
                          <div className="border-t border-[#FFD700]/30 p-4 bg-[#0a0a15]">
                            <p className="text-sm text-white/70 mb-3">🎨 Regenerate individual images:</p>
                            <div className="grid grid-cols-4 gap-2">
                              {PAGE_OPTIONS.map((page) => (
                                <button
                                  key={page.id}
                                  onClick={() => regenerateImageForBook(book.name, page.id)}
                                  disabled={regenLoading === `${book.name}-${page.id}`}
                                  className={`px-3 py-2 rounded text-sm transition border-2 ${
                                    regenLoading === `${book.name}-${page.id}`
                                      ? 'bg-[#FFD700] text-black border-[#FFD700]'
                                      : regenResult?.bookName === book.name && regenResult?.pageId === page.id
                                        ? regenResult.success ? 'bg-green-600 border-green-500' : 'bg-red-600 border-red-500'
                                        : 'bg-[#1a1a2e] border-[#FFD700]/30 hover:border-[#FFD700]/50'
                                  }`}
                                >
                                  {regenLoading === `${book.name}-${page.id}` ? '⏳' : page.label}
                                </button>
                              ))}
                            </div>
                            {regenResult?.bookName === book.name && (
                              <p className={`mt-2 text-sm ${regenResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                {regenResult.success ? '✅' : '❌'} {regenResult.message} ({regenResult.pageId})
                              </p>
                            )}
                            <div className="mt-3 pt-3 border-t border-[#FFD700]/20">
                              <button
                                onClick={() => {
                                  const parts = book.name.replace('-neutral', '').split('-vs-');
                                  if (parts.length === 2) {
                                    window.open(`/read?a=${parts[0]}&b=${parts[1]}&regenerate=true`, '_blank');
                                  }
                                }}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm transition"
                              >
                                🔄 Regenerate ALL Images (opens new tab)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* CYOA Paths Tab */}
        {activeTab === 'cyoa' && (
          <div className="bg-[#1a1a2e] border-4 border-[#FFD700] rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bangers text-[#FFD700]">🎮 CYOA Path Coverage</h2>
              <button
                onClick={loadCyoa}
                disabled={cyoaLoading}
                className="px-4 py-2 rounded font-bangers transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1e5a3d 0%, #2d7a4d 100%)', color: 'white' }}
              >
                {cyoaLoading ? '⏳ Loading...' : '🔄 Refresh'}
              </button>
            </div>

            {cyoaError && (
              <div className="bg-red-900/50 border-2 border-red-500 rounded-lg p-4 mb-4">
                <p className="text-red-300">❌ {cyoaError}</p>
              </div>
            )}

            {cyoaData && (
              <>
                <div className="mb-4 text-white/70">
                  {cyoaData.totalMatchups} matchups with CYOA data • {cyoaData.totalPaths} total paths cached
                </div>

                {cyoaData.matchups.length === 0 ? (
                  <p className="text-white/50 text-center py-8">No CYOA data cached yet. Play through some CYOA books to start building the cache!</p>
                ) : (
                  <div className="space-y-4">
                    {cyoaData.matchups.map((matchup) => (
                      <div key={matchup.key} className="bg-[#0d0d1a] border-2 border-[#FFD700]/30 rounded-lg overflow-hidden">
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#1a1a2e]"
                          onClick={() => setExpandedMatchup(expandedMatchup === matchup.key ? null : matchup.key)}
                        >
                          <div className="flex-1">
                            <p className="font-bangers text-lg text-[#FFD700]">
                              {matchup.animalA} vs {matchup.animalB}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-white/60 mt-1">
                              <span className={matchup.hasGates ? 'text-green-400' : 'text-red-400'}>
                                {matchup.hasGates ? '✅ Gates' : '❌ No gates'}
                              </span>
                              <span>
                                📊 {matchup.pathCount}/27 paths ({Math.round(matchup.pathCount / 27 * 100)}%)
                              </span>
                            </div>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="w-32 mr-4">
                            <div className="h-2 bg-[#1a1a2e] border border-[#FFD700]/30 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  matchup.pathCount === 27 ? 'bg-green-500' : 
                                  matchup.pathCount > 13 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${(matchup.pathCount / 27) * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/read?a=${matchup.animalA}&b=${matchup.animalB}&mode=cyoa`, '_blank');
                              }}
                              className="px-3 py-2 rounded text-sm transition"
                              style={{ background: 'linear-gradient(135deg, #5a1e3d 0%, #7a2d4d 100%)' }}
                            >
                              ▶️ Play
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete ALL CYOA cache for ${matchup.animalA} vs ${matchup.animalB}?`)) {
                                  deleteCyoa(matchup.key, false);
                                }
                              }}
                              disabled={cyoaDeleteLoading === matchup.key}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition disabled:opacity-50"
                              title="Delete all CYOA cache"
                            >
                              {cyoaDeleteLoading === matchup.key ? '⏳' : '🗑️'}
                            </button>
                          </div>
                        </div>

                        {/* Expanded path grid */}
                        {expandedMatchup === matchup.key && (
                          <div className="border-t border-[#FFD700]/30 p-4 bg-[#0a0a15]">
                            <p className="text-sm text-white/70 mb-3">Click a cached path to manage it:</p>
                            <div className="grid grid-cols-9 gap-1">
                              {ALL_PATHS.map((path) => {
                                const cached = matchup.paths.find(p => p.path === path);
                                const isSelected = selectedPath === `${matchup.key}-${path}`;
                                return (
                                  <button
                                    key={path}
                                    onClick={() => cached && setSelectedPath(isSelected ? null : `${matchup.key}-${path}`)}
                                    disabled={!cached}
                                    className={`px-2 py-1 text-xs text-center rounded transition border ${
                                      isSelected
                                        ? 'bg-[#FFD700] text-black border-[#FFD700] ring-2 ring-[#FFD700]'
                                        : cached 
                                          ? 'bg-green-600 text-white hover:bg-green-500 cursor-pointer border-green-500' 
                                          : 'bg-[#1a1a2e] text-white/30 cursor-not-allowed border-white/10'
                                    }`}
                                    title={cached ? `Click to manage path ${path}` : 'Not cached'}
                                  >
                                    {path}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Selected path actions */}
                            {selectedPath?.startsWith(matchup.key) && (
                              <div className="mt-4 p-3 bg-[#1a1a2e] border-2 border-[#FFD700]/30 rounded-lg">
                                <p className="text-sm font-medium mb-3">
                                  🎯 Managing path: <span className="text-[#FFD700]">{selectedPath.replace(`${matchup.key}-`, '')}</span>
                                </p>
                                
                                {/* Regenerate images */}
                                <p className="text-xs text-white/60 mb-2">Regenerate specific image:</p>
                                <div className="flex gap-2 flex-wrap mb-3">
                                  {['outcome-1', 'outcome-2', 'outcome-3', 'victory'].map((imageId) => (
                                    <button
                                      key={imageId}
                                      onClick={() => regenerateCyoaImage(matchup.key, selectedPath.replace(`${matchup.key}-`, ''), imageId)}
                                      disabled={cyoaImageLoading === `${selectedPath.replace(`${matchup.key}-`, '')}-${imageId}`}
                                      className={`px-3 py-1 rounded text-xs transition border-2 ${
                                        cyoaImageLoading === `${selectedPath.replace(`${matchup.key}-`, '')}-${imageId}`
                                          ? 'bg-[#FFD700] text-black border-[#FFD700]'
                                          : 'bg-[#1e5a3d] hover:bg-[#2d7a4d] border-green-600'
                                      }`}
                                    >
                                      {cyoaImageLoading === `${selectedPath.replace(`${matchup.key}-`, '')}-${imageId}` ? '⏳' : `🎨 ${imageId}`}
                                    </button>
                                  ))}
                                </div>

                                {cyoaImageResult && (
                                  <p className={`text-xs mb-3 ${cyoaImageResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                    {cyoaImageResult.success ? '✅' : '❌'} {cyoaImageResult.message}
                                  </p>
                                )}

                                {/* Delete this path */}
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete path ${selectedPath.replace(`${matchup.key}-`, '')}?`)) {
                                      deleteCyoa(matchup.key, false, false, selectedPath.replace(`${matchup.key}-`, ''));
                                    }
                                  }}
                                  disabled={cyoaDeleteLoading === selectedPath.replace(`${matchup.key}-`, '')}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs transition disabled:opacity-50"
                                >
                                  {cyoaDeleteLoading === selectedPath.replace(`${matchup.key}-`, '') ? '⏳' : '🗑️ Delete This Path'}
                                </button>
                              </div>
                            )}
                            
                            <div className="mt-4 flex gap-2 flex-wrap">
                              <button
                                onClick={() => {
                                  if (confirm(`Delete only PATHS (keep gates) for ${matchup.animalA} vs ${matchup.animalB}?`)) {
                                    deleteCyoa(matchup.key, true);
                                  }
                                }}
                                disabled={cyoaDeleteLoading === matchup.key}
                                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm transition disabled:opacity-50"
                              >
                                🔄 Reset All Paths
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete only GATES (keep paths) for ${matchup.animalA} vs ${matchup.animalB}? This will regenerate decision choices.`)) {
                                    deleteCyoa(matchup.key, false, true);
                                  }
                                }}
                                disabled={cyoaDeleteLoading === matchup.key || !matchup.hasGates}
                                className="px-3 py-2 rounded text-sm transition disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #5a1e3d 0%, #7a2d4d 100%)' }}
                              >
                                🎲 Reset Gates Only
                              </button>
                            </div>
                            
                            <p className="text-xs text-white/50 mt-3">
                              Legend: A = favors {matchup.animalA}, B = favors {matchup.animalB}, N = neutral
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {!cyoaData && !cyoaLoading && !cyoaError && (
              <p className="text-white/50 text-center py-8">Click Refresh to load CYOA cache data</p>
            )}
          </div>
        )}

        {/* FLAGGED IMAGES / CONTENT REPORTS TAB */}
        {activeTab === 'flagged' && (
          <div className="bg-[#1a1a2e] border-4 border-[#FFD700] rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bangers text-[#FFD700]">🚩 Content Reports</h2>
              <div className="flex gap-2 flex-wrap">
                {(['pending', 'needs_human', 'auto_resolved', 'resolved', 'dismissed'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFlaggedFilter(f)}
                    className={`px-3 py-1 rounded font-comic text-sm transition border ${
                      flaggedFilter === f
                        ? 'bg-[#FFD700] text-black border-[#FFD700]'
                        : 'bg-transparent border-white/20 text-white/70 hover:border-white/40'
                    }`}
                  >
                    {f === 'pending' ? '⏳' : f === 'needs_human' ? '🤔' : f === 'auto_resolved' ? '🤖' : f === 'resolved' ? '✅' : '❌'} {f.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
                <button
                  onClick={loadFlaggedImages}
                  disabled={flaggedLoading}
                  className="px-4 py-1 rounded font-bangers transition disabled:opacity-50 ml-2"
                  style={{ background: 'linear-gradient(135deg, #1e5a3d 0%, #2d7a4d 100%)', color: 'white' }}
                >
                  {flaggedLoading ? '⏳' : '🔄'} Refresh
                </button>
              </div>
            </div>

            {flaggedError && (
              <div className="bg-red-500/20 border border-red-500 rounded p-3 mb-4 text-red-200">{flaggedError}</div>
            )}

            {flaggedReports.length === 0 && !flaggedLoading && (
              <p className="text-white/50 text-center py-12 text-lg">
                {flaggedFilter === 'pending' ? '🎉 No pending reports — everything looks good!' : `No ${flaggedFilter.replace('_', ' ')} reports`}
              </p>
            )}

            {flaggedLoading && (
              <p className="text-[#FFD700] text-center py-8 animate-pulse">Loading reports...</p>
            )}

            {/* Report cards */}
            <div className="space-y-4">
              {flaggedReports.map(report => {
                const matchupName = `${report.animal_a.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} vs ${report.animal_b.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
                const pageLabel = !report.page_id ? '📄 General'
                  : report.page_id === 'cover' ? '📕 Cover'
                  : report.page_id === 'victory' ? '🏆 Victory'
                  : report.page_id === 'stats' ? '📊 Stats'
                  : report.page_id === 'intro' ? '📖 Intro'
                  : report.page_id.startsWith('battle-') ? `⚔️ Battle ${report.page_id.replace('battle-', '')}`
                  : report.page_id.startsWith('outcome-') ? `🎬 Outcome ${report.page_id.replace('outcome-', '')}`
                  : `📄 ${report.page_id}`;

                const reasonLabel: Record<string, string> = {
                  'bad_anatomy': '🦴 Bad anatomy',
                  'wrong_animal': '🐾 Wrong animal',
                  'wrong_count': '🔢 Wrong count',
                  'offensive': '⚠️ Offensive',
                  'factual': '📚 Factual error',
                  'other': '❓ Other',
                  'Inappropriate content': '⚠️ Inappropriate',
                  'Offensive images': '⚠️ Offensive',
                  'Factual errors': '📚 Factual',
                  'Other issue': '❓ Other',
                };

                return (
                  <div key={report.id} className="bg-black/30 border border-white/10 rounded-lg overflow-hidden">
                    <div className="flex gap-4 p-4">
                      {/* Image thumbnail */}
                      {report.image_url ? (
                        <div className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden bg-black/50">
                          <img
                            src={report.image_url}
                            alt={`${matchupName} - ${report.page_id}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x150/1a1a1a/666?text=No+Image'; }}
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-32 h-24 rounded-lg bg-black/30 flex items-center justify-center text-white/30 text-sm">
                          No image
                        </div>
                      )}

                      {/* Report details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bangers text-[#FFD700] text-lg">{matchupName}</p>
                            <div className="flex items-center gap-3 text-sm mt-1">
                              <span className="text-white/70">{pageLabel}</span>
                              <span className="px-2 py-0.5 bg-white/10 rounded text-white/60 text-xs">
                                {reasonLabel[report.reason] || report.reason}
                              </span>
                            </div>
                          </div>
                          <span className="text-white/40 text-xs whitespace-nowrap">
                            {new Date(report.reported_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* User description */}
                        {report.description && (
                          <div className="mt-2 p-2 bg-white/5 rounded border-l-2 border-orange-400/50">
                            <p className="text-white/80 text-sm italic">&ldquo;{report.description}&rdquo;</p>
                          </div>
                        )}

                        {/* AI assessment (from cron) */}
                        {report.ai_assessment && (
                          <div className="mt-2 p-2 bg-blue-500/10 rounded border-l-2 border-blue-400/50">
                            <p className="text-xs text-blue-300/70 font-bold mb-1">🤖 Scout&apos;s Assessment:</p>
                            <p className="text-white/70 text-sm">{report.ai_assessment}</p>
                          </div>
                        )}

                        {/* Resolution info (for resolved/dismissed) */}
                        {(report.status === 'resolved' || report.status === 'auto_resolved' || report.status === 'dismissed') && (
                          <div className="mt-2 text-xs text-white/40">
                            {report.resolution_action && <span>Action: {report.resolution_action}</span>}
                            {report.resolved_by && <span className="ml-3">By: {report.resolved_by}</span>}
                            {report.resolution_notes && <span className="ml-3">Notes: {report.resolution_notes}</span>}
                          </div>
                        )}

                        {/* Action result */}
                        {flaggedActionResult?.id === report.id && (
                          <p className={`text-sm mt-2 ${flaggedActionResult.success ? 'text-green-400' : 'text-red-400'}`}>
                            {flaggedActionResult.message}
                          </p>
                        )}

                        {/* Action buttons (for pending or needs_human) */}
                        {(report.status === 'pending' || report.status === 'needs_human') && (
                          <div className="mt-3">
                            {/* Admin notes input */}
                            <input
                              type="text"
                              placeholder="Add notes (optional)..."
                              value={adminNotes[report.id] || ''}
                              onChange={(e) => setAdminNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                              className="w-full px-3 py-1.5 mb-2 bg-black/30 border border-white/10 rounded text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FFD700]/50"
                            />
                            <div className="flex gap-2">
                              {report.page_id && (
                                <button
                                  onClick={() => regenerateFlaggedImage(report)}
                                  disabled={flaggedRegenLoading === report.id}
                                  className="px-4 py-2 rounded font-bangers text-sm transition disabled:opacity-50"
                                  style={{ background: 'linear-gradient(135deg, #ff5722 0%, #e64a19 100%)', color: 'white' }}
                                >
                                  {flaggedRegenLoading === report.id ? '⏳ Regenerating...' : '🔄 Regenerate'}
                                </button>
                              )}
                              <button
                                onClick={() => dismissFlaggedImage(report.id)}
                                className="px-4 py-2 rounded font-comic text-sm bg-white/10 hover:bg-white/20 transition text-white/70"
                              >
                                ❌ Dismiss
                              </button>
                              <button
                                onClick={() => {
                                  const parts = report.animal_a.split('-');
                                  const a = parts.join('-');
                                  const b = report.animal_b.split('-').join('-');
                                  window.open(`/read?a=${a}&b=${b}`, '_blank');
                                }}
                                className="px-3 py-2 rounded text-sm transition"
                                style={{ background: 'linear-gradient(135deg, #1e5a3d 0%, #2d7a4d 100%)' }}
                              >
                                👁️ View Book
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Animal Tab */}
        {activeTab === 'add-animal' && (
          <div className="bg-[#1a1a2e] border-4 border-[#FFD700] rounded-lg p-6">
            <h2 className="text-2xl font-bangers text-[#FFD700] mb-6">🦁 Add Global Animal</h2>
            <p className="text-white/70 mb-6">Add a new animal to the global roster. This generates facts via GPT-4o-mini and 5 images via Grok Imagine.</p>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-white/80 text-sm font-bold mb-2">Animal Name</label>
                <input
                  type="text"
                  value={addAnimalName}
                  onChange={(e) => setAddAnimalName(e.target.value)}
                  placeholder="e.g., Wolverine, Komodo Dragon, Pegasus"
                  className="w-full px-4 py-3 bg-black/30 border-2 border-[#FFD700]/30 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#FFD700] text-lg"
                  disabled={addAnimalLoading}
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-bold mb-2">Category</label>
                <select
                  value={addAnimalCategory}
                  onChange={(e) => setAddAnimalCategory(e.target.value as 'real' | 'dinosaur' | 'fantasy')}
                  className="w-full px-4 py-3 bg-black/30 border-2 border-[#FFD700]/30 rounded-lg text-white focus:outline-none focus:border-[#FFD700] text-lg"
                  disabled={addAnimalLoading}
                >
                  <option value="real">🦁 Real Animal</option>
                  <option value="dinosaur">🦕 Dinosaur</option>
                  <option value="fantasy">🐉 Fantasy Creature</option>
                </select>
              </div>

              <button
                onClick={async () => {
                  if (!addAnimalName.trim()) return;
                  setAddAnimalLoading(true);
                  setAddAnimalStatus('Creating animal record...');
                  setAddAnimalResult(null);

                  try {
                    setAddAnimalStatus('Generating facts and images (this takes ~30-60 seconds)...');
                    const response = await fetch('/api/admin/add-animal', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: addAnimalName.trim(),
                        category: addAnimalCategory,
                      }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                      setAddAnimalResult({
                        success: true,
                        message: `✅ ${addAnimalName} added successfully!`,
                        animal: data.animal,
                      });
                      setAddAnimalName('');
                    } else {
                      setAddAnimalResult({
                        success: false,
                        message: `❌ ${data.error || 'Failed to add animal'}`,
                      });
                    }
                  } catch (err) {
                    setAddAnimalResult({
                      success: false,
                      message: `❌ Network error: ${err instanceof Error ? err.message : 'Unknown'}`,
                    });
                  }
                  setAddAnimalStatus('');
                  setAddAnimalLoading(false);
                }}
                disabled={addAnimalLoading || !addAnimalName.trim()}
                className="w-full px-6 py-4 rounded-lg font-bangers text-xl transition-all disabled:opacity-50"
                style={{ background: addAnimalLoading ? '#555' : 'linear-gradient(135deg, #1e5a3d 0%, #2d7a4d 100%)', color: 'white' }}
              >
                {addAnimalLoading ? '⏳ Generating...' : '🚀 Add Animal'}
              </button>
            </div>

            {/* Progress status */}
            {addAnimalStatus && (
              <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                <p className="text-blue-300 animate-pulse">⏳ {addAnimalStatus}</p>
              </div>
            )}

            {/* Result */}
            {addAnimalResult && (
              <div className={`mt-4 p-4 rounded-lg border ${addAnimalResult.success ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
                <p className={addAnimalResult.success ? 'text-green-300' : 'text-red-300'}>
                  {addAnimalResult.message}
                </p>
                {addAnimalResult.animal?.images && (
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {Object.entries(addAnimalResult.animal.images).map(([type, url]) => (
                      <div key={type} className="text-center">
                        <img
                          src={url}
                          alt={`${addAnimalResult.animal?.name} ${type}`}
                          className="w-full aspect-square object-cover rounded-lg border border-[#FFD700]/30"
                        />
                        <p className="text-xs text-white/50 mt-1">{type}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-white/60 text-sm mt-8 bg-[#1a1a2e] border-2 border-[#FFD700]/30 rounded-lg p-6">
          <h3 className="font-bangers text-lg text-[#FFD700] mb-3">How it works:</h3>
          <ul className="list-disc list-inside space-y-2">
            <li><strong className="text-white/80">Standard Books:</strong> Cached JSON + PDF for each matchup</li>
            <li><strong className="text-white/80">CYOA Paths:</strong> 27 possible paths per matchup (3 choices × 3 gates)</li>
            <li><strong className="text-white/80">Flagged Images:</strong> Users/you flag bad images from the reader → review + one-click regenerate here</li>
            <li>Paths fill in as users play - each unique path is cached on first playthrough</li>
            <li><span className="text-green-500">Green</span> = cached, <span className="text-white/30">Gray</span> = not yet generated</li>
            <li>Delete gates to regenerate choices; delete paths to regenerate outcomes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
