'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKPI } from '@/context/KPIContext';
import TopNav from './TopNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useKPI();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check local storage directly for faster initial check if needed, 
    // but KPIContext handles it. We just need to wait for context to hydratate from localStorage.
    const savedUser = localStorage.getItem('kpi_current_user');
    if (!savedUser && !currentUser) {
      router.push('/login');
    } else {
      setIsReady(true);
    }
  }, [currentUser, router]);

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f4f5f8] overflow-hidden font-sans">
      <TopNav />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
