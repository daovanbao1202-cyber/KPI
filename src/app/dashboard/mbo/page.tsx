'use client';

import MBOSheet from '@/components/dashboard/MBOSheet';
import ViewSelector from '@/components/dashboard/ViewSelector';

export default function MBOPage() {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#f4f7fb]">
      <ViewSelector />
      
      <div className="p-3 md:p-6">
        <div className="mb-6">
          <h1 className="text-[28px] font-black text-gray-800 tracking-tight">MBO Platform</h1>
          <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest">Management by Objectives & Strategy Alignment</p>
        </div>

        <MBOSheet />
      </div>
    </div>
  );
}
