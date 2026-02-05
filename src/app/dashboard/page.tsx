'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');

    if (success === 'true' && sessionId) {
      // Confirm the purchase and upgrade tier
      setStatus('Confirming your upgrade...');
      fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setStatus('Upgrade complete! Redirecting...');
          } else {
            setStatus('Redirecting...');
          }
          setTimeout(() => router.replace('/'), 1500);
        })
        .catch(() => {
          setTimeout(() => router.replace('/'), 1000);
        });
    } else {
      router.replace('/');
    }
  }, [router, searchParams]);

  return (
    <div className="text-center">
      <div className="text-[#FFD700] text-2xl animate-pulse font-bangers">{status}</div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen flex items-center justify-center font-comic"
      style={{ background: 'linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)' }}>
      <Suspense fallback={<div className="text-[#FFD700] text-2xl animate-pulse font-bangers">Loading...</div>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}
