'use client';

import { useState, useEffect, Suspense } from 'react';
import DataGrid from '@/components/data-entry/DataGrid';
import { UserCircle, ChevronDown, LayoutGrid, Download, Repeat } from 'lucide-react';
import { useKPI } from '@/context/KPIContext';
import { useSearchParams } from 'next/navigation';

type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

function DataEntryContent() {
  const { loggedInUserId, users, setLoggedInUserId, kpiDefs } = useKPI();
  const searchParams = useSearchParams();
  const freqParam = searchParams.get('frequency') as Frequency;
  const kpiIdParam = searchParams.get('kpiId');
  
  const isValidFrequency = ['daily', 'weekly', 'monthly', 'yearly'].includes(freqParam);

  // Derived from the URL rather than synced into state through an effect,
  // which avoided a cascading extra render.
  const [overrideFrequency, setOverrideFrequency] = useState<Frequency | null>(null);
  const frequency: Frequency = overrideFrequency ?? (isValidFrequency ? freqParam : 'daily');
  const setFrequency = (next: Frequency) => setOverrideFrequency(next);

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const currentUser = users.find(u => u.id === loggedInUserId);


  const tabs: { id: Frequency; label: string; count: string }[] = (['daily', 'weekly', 'monthly', 'yearly'] as Frequency[]).map(f => ({
    id: f,
    label: f.charAt(0).toUpperCase() + f.slice(1),
    count: kpiDefs.filter(k => (k.frequency || 'Daily').toLowerCase() === f).length.toString().padStart(2, '0')
  }));

  return (
    <div className="flex flex-col h-full bg-[#f4f5f8] pb-10">
      <div className="bg-white px-6 py-2 border-b border-gray-100 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-100 transition-colors text-[13px]"
            >
              {currentUser?.avatar ? <img src={currentUser.avatar} alt="" className="w-5 h-5 rounded-full object-cover" /> : <UserCircle size={20} className="text-gray-400" />}
              {currentUser ? `${currentUser?.firstName} ${currentUser?.lastName}` : 'Unknown User'} 
              <span className="text-[10px] bg-[#555cf8] text-white px-1.5 py-0.5 rounded-md ml-1">{currentUser?.role}</span>
              <ChevronDown size={14} className="text-gray-400 ml-1" />
            </button>
            
            {isUserDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUserDropdownOpen(false)}></div>
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 shadow-xl rounded-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[400px] overflow-y-auto">
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Data Entry User</span>
                  </div>
                  {users.map(u => (
                    <button 
                      key={u.id}
                      onClick={() => {
                        setLoggedInUserId(u.id);
                        setIsUserDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 transition-colors ${loggedInUserId === u.id ? 'bg-blue-50/50 relative' : ''}`}
                    >
                      {loggedInUserId === u.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#555cf8]"></div>}
                      {u.avatar ? <img src={u.avatar} alt="" className="w-7 h-7 rounded-full object-cover shadow-sm border border-gray-100" /> : <UserCircle size={28} className="text-gray-400" />}
                      <div className="flex flex-col">
                         <span className="text-[13px] font-bold text-gray-700 leading-tight">{u.firstName} {u.lastName}</span>
                         <span className="text-[10px] text-gray-400">{u.role} - {u.position}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-gray-600 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 bg-white text-[13px] font-medium">
            <LayoutGrid size={14} /> Learn <ChevronDown size={14} />
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>
          <div className="flex gap-1 text-gray-400">
            <div className="p-1 rounded bg-gray-100 text-gray-600 cursor-pointer border border-gray-200"><LayoutGrid size={16} /></div>
            <div className="p-1 hover:text-gray-600 cursor-pointer"><Download size={16} /></div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 flex items-center gap-2">
        <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100">
          {tabs.map(tab => {
            const isActive = frequency === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFrequency(tab.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-bold transition-colors ${isActive ? 'bg-[#555cf8] text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
              >
                {tab.label} 
                <span className={`${isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-500'} px-1.5 py-0.5 rounded-full text-[10px] leading-none`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 flex-1 flex flex-col min-h-0">
        <DataGrid frequency={frequency} highlightKpiId={kpiIdParam || undefined} />
      </div>
      
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#555cf8] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#4a51e2] transition-colors z-50">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      </button>
    </div>
  );
}

export default function DataEntryPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <DataEntryContent />
    </Suspense>
  );
}
