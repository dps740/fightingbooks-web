'use client';

import { useState, useEffect } from 'react';

const ADMIN_KEY = 'fightingbooks-admin-2024';
const CACHE_SECRET = 'fightingbooks-admin-2026';

const PAGE_OPTIONS = [
  { id: 'cover', label: '📕 Cover' },
  { id: 'battle-1', label: '⚔️ Battle 1 - Confrontation' },
  { id: 'battle-2', label: '⚔️ Battle 2 - First Strike' },
  { id: 'battle-3', label: '⚔️ Battle 3 - Counter Attack' },
  { id: 'battle-4', label: '⚔️ Battle 4 - Intense Combat' },
  { id: 'battle-5', label: '⚔️ Battle 5 - Decisive Moment' },
  { id: 'victory', label: '🏆 Victory' },
];

interface CachedBook {
  name: string;
  size: number;
  uploaded: string;
}

// Parse book name to get animal names
function parseBookName(name: string): { animalA: string; animalB: string } | null {
  const parts = name.replace('-neutral', '').split('-vs-');
  if (parts.length !== 2) return null;
  return {
    animalA: parts[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    animalB: parts[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  };
}

interface CacheData {
  books: CachedBook[];
  pdfs: CachedBook[];
  counts: { books: number; pdfs: number };
}

export default function AdminPage() {
  const [animalA, setAnimalA] = useState('');
  const [animalB, setAnimalB] = useState('');
  const [selectedPage, setSelectedPage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  // Cache management state
  const [cacheData, setCacheData] = useState<CacheData | null>(null);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [cacheError, setCacheError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'images' | 'cache'>('cache');
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [regenLoading, setRegenLoading] = useState<string | null>(null);
  const [regenResult, setRegenResult] = useState<{bookName: string; pageId: string; success: boolean; message: string} | null>(null);

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

  // Delete a cached book
  const deleteBook = async (bookName: string, deleteImages: boolean = false) => {
    // Parse book name: "lion-vs-tiger-neutral" -> animalA: "lion", animalB: "tiger"
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
        body: JSON.stringify({
          animalA: a,
          animalB: b,
          deleteImages,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete');
      
      // Reload cache
      await loadCache();
    } catch (err) {
      setCacheError(err instanceof Error ? err.message : 'Failed to delete book');
    }
    setDeleteLoading(null);
  };

  // Regenerate image for a book from cache view
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
    if (activeTab === 'cache') {
      loadCache();
    }
  }, [activeTab]);

  const regenerateImage = async () => {
    if (!animalA || !animalB || !selectedPage) {
      setError('Please fill in both animals and select a page');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/admin/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalA,
          animalB,
          pageId: selectedPage,
          adminKey: ADMIN_KEY,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to regenerate');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Network error - please try again');
    }

    setLoading(false);
  };

  const regenerateAll = async () => {
    if (!animalA || !animalB) {
      setError('Please fill in both animals');
      return;
    }
    window.open(`/read?a=${encodeURIComponent(animalA)}&b=${encodeURIComponent(animalB)}&regenerate=true`, '_blank');
  };

  const viewBook = () => {
    if (!animalA || !animalB) {
      setError('Please fill in both animals');
      return;
    }
    window.open(`/read?a=${encodeURIComponent(animalA)}&b=${encodeURIComponent(animalB)}`, '_blank');
  };

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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🔧 FightingBooks Admin</h1>
        <p className="text-gray-400 mb-6">Manage cached books and regenerate images</p>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('images')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'images'
                ? 'bg-yellow-600 text-black'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            🎨 Image Regeneration
          </button>
          <button
            onClick={() => setActiveTab('cache')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'cache'
                ? 'bg-yellow-600 text-black'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            📚 Cache Management
          </button>
        </div>

        {/* Image Regeneration Tab */}
        {activeTab === 'images' && (
          <>
            {/* Animal Inputs */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Animal A</label>
                <input
                  type="text"
                  value={animalA}
                  onChange={(e) => setAnimalA(e.target.value)}
                  placeholder="e.g., Lion"
                  className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Animal B</label>
                <input
                  type="text"
                  value={animalB}
                  onChange={(e) => setAnimalB(e.target.value)}
                  placeholder="e.g., Tiger"
                  className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:border-yellow-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={viewBook}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition"
              >
                👁️ View Book
              </button>
              <button
                onClick={regenerateAll}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded font-medium transition"
              >
                🔄 Regenerate ALL Images
              </button>
            </div>

            {/* Single Image Regeneration */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Regenerate Single Image</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Page</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAGE_OPTIONS.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => setSelectedPage(page.id)}
                      className={`px-4 py-3 rounded text-left transition ${
                        selectedPage === page.id
                          ? 'bg-yellow-600 text-black font-bold'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {page.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={regenerateImage}
                disabled={loading || !selectedPage}
                className={`w-full py-3 rounded font-bold text-lg transition ${
                  loading || !selectedPage
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? '⏳ Regenerating...' : `🎨 Regenerate ${selectedPage || 'Selected'} Image`}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
                <p className="text-red-300">❌ {error}</p>
              </div>
            )}

            {/* Success Result */}
            {result && (
              <div className="bg-green-900/50 border border-green-500 rounded-lg p-4 mb-6">
                <p className="text-green-300 font-bold mb-4">✅ {result.message}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Old Image:</p>
                    <img 
                      src={result.oldImageUrl} 
                      alt="Old" 
                      className="w-full rounded border border-gray-600"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">New Image:</p>
                    <img 
                      src={result.newImageUrl} 
                      alt="New" 
                      className="w-full rounded border border-green-500"
                    />
                  </div>
                </div>
                
                <button
                  onClick={viewBook}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition"
                >
                  👁️ View Updated Book
                </button>
              </div>
            )}
          </>
        )}

        {/* Cache Management Tab */}
        {activeTab === 'cache' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">📚 Cached Books</h2>
              <button
                onClick={loadCache}
                disabled={cacheLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition disabled:opacity-50"
              >
                {cacheLoading ? '⏳ Loading...' : '🔄 Refresh'}
              </button>
            </div>

            {cacheError && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-4">
                <p className="text-red-300">❌ {cacheError}</p>
              </div>
            )}

            {cacheData && (
              <>
                <div className="mb-4 text-gray-400">
                  Total: {cacheData.counts.books} books, {cacheData.counts.pdfs} PDFs
                </div>

                {cacheData.books.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No cached books found</p>
                ) : (
                  <div className="space-y-3">
                    {cacheData.books.map((book) => (
                      <div key={book.name} className="bg-gray-700 rounded-lg overflow-hidden">
                        {/* Main row */}
                        <div className="flex items-center justify-between p-4">
                          <div className="flex-1 cursor-pointer" onClick={() => setExpandedBook(expandedBook === book.name ? null : book.name)}>
                            <p className="font-medium text-lg">{formatBookName(book.name)}</p>
                            <p className="text-sm text-gray-400">
                              {formatSize(book.size)} • {formatDate(book.uploaded)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setExpandedBook(expandedBook === book.name ? null : book.name)}
                              className={`px-3 py-2 rounded text-sm transition ${expandedBook === book.name ? 'bg-yellow-600 text-black' : 'bg-gray-600 hover:bg-gray-500'}`}
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
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition"
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
                              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm transition"
                            >
                              🎮 CYOA
                            </button>
                            <button
                              onClick={() => deleteBook(book.name, false)}
                              disabled={deleteLoading === book.name}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition disabled:opacity-50"
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
                          <div className="border-t border-gray-600 p-4 bg-gray-800">
                            <p className="text-sm text-gray-400 mb-3">🎨 Regenerate individual images:</p>
                            <div className="grid grid-cols-4 gap-2">
                              {PAGE_OPTIONS.map((page) => (
                                <button
                                  key={page.id}
                                  onClick={() => regenerateImageForBook(book.name, page.id)}
                                  disabled={regenLoading === `${book.name}-${page.id}`}
                                  className={`px-3 py-2 rounded text-sm transition ${
                                    regenLoading === `${book.name}-${page.id}`
                                      ? 'bg-yellow-600 text-black'
                                      : regenResult?.bookName === book.name && regenResult?.pageId === page.id
                                        ? regenResult.success ? 'bg-green-600' : 'bg-red-600'
                                        : 'bg-gray-600 hover:bg-gray-500'
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
                            <div className="mt-3 pt-3 border-t border-gray-700">
                              <button
                                onClick={() => {
                                  const parts = book.name.replace('-neutral', '').split('-vs-');
                                  if (parts.length === 2) {
                                    window.open(`/read?a=${parts[0]}&b=${parts[1]}&regenerate=true`, '_blank');
                                  }
                                }}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm transition"
                              >
                                🔄 Regenerate ALL Images
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

            {!cacheData && !cacheLoading && !cacheError && (
              <p className="text-gray-500 text-center py-8">Click Refresh to load cached books</p>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-gray-500 text-sm mt-8">
          <h3 className="font-bold mb-2">How it works:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Image Regeneration:</strong> Fix bad images in existing books</li>
            <li><strong>Cache Management:</strong> View all cached books, delete ones with issues</li>
            <li>🗑️ Delete removes book JSON + PDF (keeps images)</li>
            <li>💥 Delete + Images removes everything for that matchup</li>
            <li>Deleted books regenerate fresh on next visit</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
