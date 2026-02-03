'use client';

import { useState } from 'react';

const ADMIN_KEY = 'fightingbooks-admin-2024';

const PAGE_OPTIONS = [
  { id: 'cover', label: '📕 Cover' },
  { id: 'battle-1', label: '⚔️ Battle 1 - Confrontation' },
  { id: 'battle-2', label: '⚔️ Battle 2 - First Strike' },
  { id: 'battle-3', label: '⚔️ Battle 3 - Counter Attack' },
  { id: 'battle-4', label: '⚔️ Battle 4 - Intense Combat' },
  { id: 'battle-5', label: '⚔️ Battle 5 - Decisive Moment' },
  { id: 'victory', label: '🏆 Victory' },
];

export default function AdminPage() {
  const [animalA, setAnimalA] = useState('');
  const [animalB, setAnimalB] = useState('');
  const [selectedPage, setSelectedPage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

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

    // Open the book with regenerate flag
    window.open(`/read?a=${encodeURIComponent(animalA)}&b=${encodeURIComponent(animalB)}&regenerate=true`, '_blank');
  };

  const viewBook = () => {
    if (!animalA || !animalB) {
      setError('Please fill in both animals');
      return;
    }
    window.open(`/read?a=${encodeURIComponent(animalA)}&b=${encodeURIComponent(animalB)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🔧 FightingBooks Admin</h1>
        <p className="text-gray-400 mb-8">Regenerate individual images for cached books</p>

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

        {/* Instructions */}
        <div className="text-gray-500 text-sm">
          <h3 className="font-bold mb-2">How it works:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Enter the two animals (must match an existing cached book)</li>
            <li>Click "View Book" to see current images</li>
            <li>If an image is bad, select that page and click regenerate</li>
            <li>New image replaces the old one in the cache</li>
            <li>Refresh the book to see the update</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
