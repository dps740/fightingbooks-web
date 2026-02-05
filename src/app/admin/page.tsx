'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_KEY = 'fightingbooks-admin-2024';
const CACHE_SECRET = 'fightingbooks-admin-2026';
const ADMIN_EMAILS = ['david.smith@epsilon-three.com'];

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
  const [activeTab, setActiveTab] = useState<'books' | 'cyoa'>('books');
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
      const response = await fetch('/api/admin/delete-book', {
        headers: { 'Authorization': `Bearer ${CACHE_SECRET}` },
      });
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
      const response = await fetch('/api/admin/cyoa-cache', {
        headers: { 'Authorization': `Bearer ${CACHE_SECRET}` },
      });
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
          'Authorization': `Bearer ${CACHE_SECRET}`,
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
          'Authorization': `Bearer ${CACHE_SECRET}`,
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

  // Regenerate a specific CYOA image
  const regenerateCyoaImage = async (matchupKey: string, pathKey: string, imageId: string) => {
    setCyoaImageLoading(`${pathKey}-${imageId}`);
    setCyoaImageResult(null);

    try {
      const response = await fetch('/api/admin/cyoa-cache', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${CACHE_SECRET}`,
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
          adminKey: ADMIN_KEY,
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
    }
  }, [activeTab]);

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

        {/* Instructions */}
        <div className="text-white/60 text-sm mt-8 bg-[#1a1a2e] border-2 border-[#FFD700]/30 rounded-lg p-6">
          <h3 className="font-bangers text-lg text-[#FFD700] mb-3">How it works:</h3>
          <ul className="list-disc list-inside space-y-2">
            <li><strong className="text-white/80">Standard Books:</strong> Cached JSON + PDF for each matchup</li>
            <li><strong className="text-white/80">CYOA Paths:</strong> 27 possible paths per matchup (3 choices × 3 gates)</li>
            <li>Paths fill in as users play - each unique path is cached on first playthrough</li>
            <li><span className="text-green-500">Green</span> = cached, <span className="text-white/30">Gray</span> = not yet generated</li>
            <li>Delete gates to regenerate choices; delete paths to regenerate outcomes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
