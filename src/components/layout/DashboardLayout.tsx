'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKPI } from '@/context/KPIContext';
import TopNav from './TopNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isHydrated } = useKPI();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    
    // Check local storage directly for faster initial check if needed
    const savedUser = localStorage.getItem('kpi_current_user');
    if (!savedUser && !currentUser) {
      router.push('/login');
    } else {
      setIsReady(true);
    }
  }, [currentUser, router, isHydrated]);

  if (!isReady || !isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-brand-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 bg-brand-primary/10 rounded-full animate-pulse"></div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">K-Pulse Platform</h2>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-[0.2em] animate-pulse">Synchronizing Data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-500">
      <TopNav />
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-[1600px] mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
