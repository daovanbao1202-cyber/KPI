'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { useKPI } from '@/context/KPIContext';
import TopNav from './TopNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isHydrated, isAuthResolved, saveError } = useKPI();
  const router = useRouter();

  // Readiness is derived, not stored, so no extra render is triggered.
  const isReady = isHydrated && isAuthResolved && !!currentUser;

  useEffect(() => {
    // Wait for the server to confirm the session; localStorage is no longer
    // trusted as proof of identity.
    if (!isHydrated || !isAuthResolved) return;
    if (!currentUser) router.push('/login');
  }, [currentUser, router, isHydrated, isAuthResolved]);

  if (!isReady) {
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

      {/* A failed save must never pass unnoticed again: reports went missing
          for months behind a console warning nobody was reading. */}
      {saveError && (
        <div className="shrink-0 bg-red-600 text-white px-6 py-2.5 text-sm font-medium flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            Dữ liệu chưa lưu được lên máy chủ — hãy chụp màn hình này và báo quản trị viên. Chi tiết: {saveError}
          </span>
        </div>
      )}

      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-[1600px] mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
