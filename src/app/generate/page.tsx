'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Download, Sparkles, RefreshCw, Home, Crown } from 'lucide-react';

type GenerationStatus = 'starting' | 'generating_content' | 'generating_images' | 'rendering_pdf' | 'complete' | 'error';

interface GenerationState {
  status: GenerationStatus;
  progress: number;
  message: string;
  pdfUrl?: string;
  winner?: string;
  error?: string;
}

const STATUS_MESSAGES: Record<GenerationStatus, string> = {
  starting: '🚀 Starting up the battle arena...',
  generating_content: '📝 Writing the epic story...',
  generating_images: '🎨 Creating illustrations...',
  rendering_pdf: '📖 Assembling your book...',
  complete: '✅ Your book is ready!',
  error: '❌ Something went wrong',
};

function GenerateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<GenerationState>({
    status: 'starting',
    progress: 0,
    message: STATUS_MESSAGES.starting,
  });
  const [hasStarted, setHasStarted] = useState(false);

  const animalA = searchParams.get('a') || '';
  const animalB = searchParams.get('b') || '';
  const environment = searchParams.get('env') || 'random';

  useEffect(() => {
    if (!animalA || !animalB) {
      router.push('/');
      return;
    }

    if (hasStarted) return;
    setHasStarted(true);

    const generate = async () => {
      try {
        // Start generation
        setState({ status: 'generating_content', progress: 10, message: STATUS_MESSAGES.generating_content });
        
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ animalA, animalB, environment }),
        });

        if (!response.ok) {
          throw new Error('Generation failed');
        }

        // Stream progress updates
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split('\n').filter(Boolean);
            
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.status) {
                  setState({
                    status: data.status,
                    progress: data.progress || 0,
                    message: data.message || STATUS_MESSAGES[data.status as GenerationStatus],
                    pdfUrl: data.pdfUrl,
                    winner: data.winner,
                  });
                }
              } catch {
                // Ignore parse errors for partial data
              }
            }
          }
        }
      } catch (error) {
        setState({
          status: 'error',
          progress: 0,
          message: 'Generation failed. Please try again.',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    generate();
  }, [animalA, animalB, environment, router, hasStarted]);

  const isComplete = state.status === 'complete';
  const isError = state.status === 'error';

  return (
    <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 text-center">
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {animalA} vs {animalB}
            </h1>
            <p className="text-gray-500">
              {environment === 'random' ? 'Random Arena' : environment.charAt(0).toUpperCase() + environment.slice(1)}
            </p>
          </div>

          {/* Progress */}
          {!isComplete && !isError && (
            <div className="mb-8">
              <div className="flex justify-center mb-6">
                <div className="animate-bounce text-6xl">
                  {state.status === 'generating_content' && '📝'}
                  {state.status === 'generating_images' && '🎨'}
                  {state.status === 'rendering_pdf' && '📖'}
                  {state.status === 'starting' && '🚀'}
                </div>
              </div>
              <p className="text-xl text-gray-700 mb-4">{state.message}</p>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
              <p className="mt-2 text-gray-500">{state.progress}% complete</p>
            </div>
          )}

          {/* Complete State */}
          {isComplete && (
            <div className="mb-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Your Book is Ready!</h2>
              {state.winner && (
                <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full mb-6">
                  <Crown className="w-5 h-5" />
                  Winner: {state.winner}
                </div>
              )}
              
              {state.pdfUrl && (
                <div className="space-y-4">
                  {/* PDF Preview would go here */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50">
                    <p className="text-gray-500 mb-4">📖 15-page illustrated battle book</p>
                    <a
                      href={state.pdfUrl}
                      download={`${animalA}_vs_${animalB}.pdf`}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-green-400 to-green-600 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:scale-105 transition-transform"
                    >
                      <Download className="w-6 h-6" />
                      Download PDF
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="mb-8">
              <div className="text-6xl mb-4">😅</div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Oops!</h2>
              <p className="text-gray-600 mb-4">{state.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200"
            >
              <Home className="w-5 h-5" />
              New Battle
            </button>
            {isComplete && (
              <button
                onClick={() => router.push('/signup')}
                className="inline-flex items-center gap-2 bg-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-600"
              >
                <Sparkles className="w-5 h-5" />
                Create More ($1/book)
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </main>
    }>
      <GenerateContent />
    </Suspense>
  );
}
