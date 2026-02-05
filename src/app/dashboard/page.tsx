'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Dashboard redirects to homepage - the homepage IS the app
export default function DashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center font-comic" 
      style={{ background: 'linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)' }}>
      <div className="text-[#FFD700] text-2xl animate-pulse">Loading...</div>
    </main>
  );
}
