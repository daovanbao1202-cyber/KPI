'use client';

import MBOSheet from '@/components/dashboard/MBOSheet';
import ViewSelector from '@/components/dashboard/ViewSelector';

export default function ActionPlanPage() {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50">
      <ViewSelector />
      
      <div className="p-3 md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-black text-slate-800 tracking-tight">2026년 목표달성 Action Plan</h1>
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">Tỷ lệ đạt mục tiêu năm / Performance Management</p>
          </div>
          <div className="px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Year: 2026</span>
          </div>
        </div>

        <MBOSheet type="ACTION_PLAN" />
      </div>
    </div>
  );
}
