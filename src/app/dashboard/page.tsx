'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Download, Plus, LogOut, CreditCard, BookOpen } from 'lucide-react';

interface Book {
  id: string;
  animalA: string;
  animalB: string;
  winner: string;
  pdfUrl: string;
  createdAt: string;
}

interface User {
  email: string;
  credits: number;
  books: Book[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user data
    fetch('/api/user')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(data => setUser(data))
      .catch(() => router.push('/signup'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleBuyCredits = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: 5 }), // Buy 5 credits
      });
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading...</div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My FightingBooks</h1>
              <p className="text-gray-500">{user.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-xl">
                <span className="text-orange-800 font-bold">
                  💰 {user.credits} {user.credits === 1 ? 'credit' : 'credits'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-green-400 to-green-600 text-white p-6 rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-transform"
          >
            <Plus className="w-10 h-10" />
            <div className="text-left">
              <div className="text-xl font-bold">Create New Book</div>
              <div className="text-green-100">Uses 1 credit</div>
            </div>
          </button>

          <button
            onClick={handleBuyCredits}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-transform"
          >
            <CreditCard className="w-10 h-10" />
            <div className="text-left">
              <div className="text-xl font-bold">Buy Credits</div>
              <div className="text-purple-100">5 books for $5</div>
            </div>
          </button>
        </div>

        {/* Book History */}
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            My Books
          </h2>

          {user.books.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No books yet! Create your first battle.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {user.books.map((book) => (
                <div 
                  key={book.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div>
                    <div className="font-bold text-gray-800">
                      {book.animalA} vs {book.animalB}
                    </div>
                    <div className="text-sm text-gray-500">
                      Winner: {book.winner} • {new Date(book.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <a
                    href={book.pdfUrl}
                    download
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
