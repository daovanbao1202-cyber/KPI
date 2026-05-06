'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Target, Calendar, ChevronLeft, ChevronRight, GripVertical, CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import { useKPI } from '@/context/KPIContext';
import ReportTableModal from './ReportTableModal';

interface DataGridProps {
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  highlightKpiId?: string;
}

export default function DataGrid({ frequency = 'daily', highlightKpiId }: DataGridProps) {
  const { loggedInUserId, kpiDefs, userTargets, userActuals, updateUserActual, reports, setTarget, currentUser, users } = useKPI();
  const highlightedRowRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeReportModal, setActiveReportModal] = useState<{ kpiId: string; dateKey: string; label: string } | null>(null);
  
  // Date State
  const [baseDate, setBaseDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    if (highlightKpiId && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightKpiId]);

  const generateDates = () => {
    const dates = [];
    const current = new Date(baseDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Number of columns to show
    let count = 7;
    if (frequency === 'monthly') count = 6;
    if (frequency === 'yearly') count = 5;

    // Shift back so baseDate is somewhere in the middle or at the end
    if (frequency === 'daily') current.setDate(current.getDate() - 3);
    else if (frequency === 'weekly') current.setDate(current.getDate() - 21);
    else if (frequency === 'monthly') current.setMonth(current.getMonth() - 5);
    else if (frequency === 'yearly') current.setFullYear(current.getFullYear() - 4);

    for (let i = 0; i < count; i++) {
      const d = new Date(current);
      const isToday = d.getTime() === today.getTime();
      
      let label = '';
      let key = '';

      if (frequency === 'daily') {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        label = isToday ? 'Today' : `${d.getDate().toString().padStart(2, '0')} ${monthNames[d.getMonth()]}`;
        key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
        current.setDate(current.getDate() + 1);
      } else if (frequency === 'weekly') {
        const monthStr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
        label = `Wk ${d.getDate()} ${monthStr}`;
        key = `W-${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
        current.setDate(current.getDate() + 7);
      } else if (frequency === 'monthly') {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`;
        const currentMonthIsToday = today.getMonth() === d.getMonth() && today.getFullYear() === d.getFullYear();
        if (currentMonthIsToday) label = 'This Month';
        current.setMonth(current.getMonth() + 1);
      } else if (frequency === 'yearly') {
        label = `${d.getFullYear()}`;
        key = `${d.getFullYear()}`;
        if (d.getFullYear() === today.getFullYear()) label = 'This Year';
        current.setFullYear(current.getFullYear() + 1);
      }

      dates.push({ label, key, isToday: frequency === 'daily' ? isToday : label === 'This Month' || label === 'This Year' });
    }
    return dates;
  };

  const dates = useMemo(generateDates, [baseDate, frequency]);

  const handlePrev = () => {
    setBaseDate(prev => {
      const d = new Date(prev);
      if (frequency === 'daily') d.setDate(d.getDate() - 1);
      if (frequency === 'weekly') d.setDate(d.getDate() - 7);
      if (frequency === 'monthly') d.setMonth(d.getMonth() - 1);
      if (frequency === 'yearly') d.setFullYear(d.getFullYear() - 1);
      return d;
    });
  };

  const handleNext = () => {
    setBaseDate(prev => {
      const d = new Date(prev);
      if (frequency === 'daily') d.setDate(d.getDate() + 1);
      if (frequency === 'weekly') d.setDate(d.getDate() + 7);
      if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
      if (frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
      return d;
    });
  };

  const resetToToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setBaseDate(d);
  };

  // If the admin is impersonating another user via Switch User Demo, they should see that user's specific data
  const isRealAdmin = currentUser?.role === 'Admin' && currentUser.id === loggedInUserId;

  // LINK: Filter kpiDefs by the active tab's frequency
  const kpisForThisTab = kpiDefs.filter(k => 
    (k.frequency || 'Daily').toLowerCase() === frequency.toLowerCase()
  );
  
  // Transform to a viewable format
  const allRows = kpisForThisTab.map(def => {
    // Find target assigned specifically to this user, fallback to global hasTarget
    const userTgt = userTargets.find(t => t.kpiId === def.id && t.userId === loggedInUserId)?.targetValue;
    const finalTarget = userTgt !== undefined ? userTgt : (def.hasTarget || '0');
    
    return {
      kpiId: def.id,
      name: def.name,
      unit: def.unit || '',
      icon: def.icon || '🎯',
      target: finalTarget,
      globalTarget: def.hasTarget || '0',
      isAssigned: userTgt !== undefined && Number(userTgt) > 0
    };
  });

  // If Admin, show all. If regular user, show only explicitly assigned KPIs (target > 0)
  const rows = isRealAdmin ? allRows : allRows.filter(r => r.isAssigned);

  const handleValChange = (kpiId: string, dateKey: string, val: string) => {
    const numVal = parseFloat(val);
    if (!isNaN(numVal)) {
      updateUserActual(kpiId, loggedInUserId, dateKey, numVal);
    } else if (val === '') {
      updateUserActual(kpiId, loggedInUserId, dateKey, 0);
    }
  };

  const getActualVal = (kpiId: string, date: string) => {
    if (isRealAdmin) {
      let total = 0;
      users.forEach(u => {
        const reportCount = reports ? reports.filter(r => r.kpiId === kpiId && r.userId === u.id && r.dateKey === date && r.isDone).length : 0;
        if (reportCount > 0) {
          total += reportCount;
        } else {
          const a = userActuals.find(a => a.kpiId === kpiId && a.userId === u.id && a.date === date);
          if (a) total += a.actualValue;
        }
      });
      return total;
    }

    // 1. Calculate from reports (ONLY COUNT DONE REPORTS as per request)
    const reportCount = reports ? reports.filter(r => r.kpiId === kpiId && r.userId === loggedInUserId && r.dateKey === date && r.isDone).length : 0;
    if (reportCount > 0) return reportCount;

    // 2. Fallback to manual entry if no reports exist yet
    const a = userActuals.find(a => a.kpiId === kpiId && a.userId === loggedInUserId && a.date === date);
    return a ? a.actualValue : 0;
  };

  const handleSave = () => {
    // Data is already saved in context/localStorage, but we provide visual feedback
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
      
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <select className="appearance-none bg-white border border-gray-200 rounded pl-3 pr-8 py-1.5 text-sm font-bold text-gray-700 focus:outline-none focus:border-[#555cf8] shadow-sm">
              <option>My Assigned KPIs ({frequency.toUpperCase()})</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </div>
          </div>
          <span className="text-xs text-gray-400 font-medium">Entering data as: User {loggedInUserId}</span>
        </div>

        {/* Date paginator header */}
        <div className="flex items-center gap-2">
          <button onClick={resetToToday} title="Go to Current" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded shadow-sm transition-colors">
            <Calendar size={14} /> Current
          </button>
          <div className="flex bg-white rounded overflow-hidden shadow-sm border border-gray-200">
            <button onClick={handlePrev} className="px-2 py-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-200">
              <ChevronLeft size={16} />
            </button>
            <button onClick={handleNext} className="px-2 py-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-x-auto min-h-[300px]">
        <div className="min-w-max">
        
          {/* Header Row for exact alignment with columns */}
          <div className="flex border-b border-gray-200 bg-gray-100/50 text-gray-500 uppercase text-[11px] font-black tracking-wider">
            {/* Placeholder for Left Info Column */}
            <div className="w-[350px] shrink-0 border-r border-gray-200"></div>
            
            {/* Data Columns Header */}
            <div className="flex flex-1">
              {dates.map((d) => (
                <div 
                  key={d.key} 
                  className={`px-4 py-2.5 flex-1 min-w-[120px] text-center border-l border-gray-200 first:border-l-0 ${
                    d.isToday ? 'bg-[#555cf8] text-white shadow-sm' : ''
                  }`}
                >
                  {d.label}
                </div>
              ))}
            </div>
          </div>
          {rows.length === 0 && (
             <div className="p-16 flex flex-col items-center justify-center text-center">
                <Target size={48} className="text-gray-200 mb-4" />
                <h3 className="text-lg font-bold text-gray-600 mb-2">No {frequency} KPIs Found</h3>
                <p className="text-gray-400 max-w-sm">There are no KPIs currently defined with a {frequency} frequency. Update your KPI definitions to see them here.</p>
             </div>
          )}

          {rows.map(row => {
            const isHighlighted = row.kpiId === highlightKpiId;
            return (
              <div 
                key={row.kpiId} 
                ref={isHighlighted ? highlightedRowRef : null}
                className={`flex border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${
                  isHighlighted ? 'bg-blue-50 ring-2 ring-blue-500/20 z-10' : ''
                }`}
              >
              
              {/* Left Info Column */}
              <div className="w-[350px] p-4 py-5 flex items-center shrink-0 border-r border-gray-50">
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical size={16} className="text-gray-300 cursor-grab" />
                  <span className="text-2xl pt-1 shadow-sm">{row.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-gray-800">{row.name}</span>
                    <span className="text-[11px] text-gray-400 mt-0.5 font-medium">Unit: <span className="text-gray-600 bg-gray-100 px-1 rounded">{row.unit}</span></span>
                  </div>
                </div>
                {/* Labels Actual/Target */}
                <div className="flex flex-col gap-2 text-xs font-bold text-right w-16">
                  <span className="text-[#38bdf8] h-8 flex items-center justify-end">Actual</span>
                  <span className="text-[#84cc16] h-8 flex items-center justify-end">Target</span>
                </div>
              </div>

              {/* Data Columns */}
              <div className="flex flex-1">
                {dates.map((d) => {
                  const isToday = d.isToday;
                  const currentActual = getActualVal(row.kpiId, d.key);
                  
                  let displayTarget = 0;
                  if (isRealAdmin) {
                    let totalTgt = 0;
                    users.forEach(u => {
                       let pt = userTargets.find(t => t.kpiId === row.kpiId && t.userId === u.id && t.dateKey === d.key)?.targetValue;
                       if (pt === undefined) pt = userTargets.find(t => t.kpiId === row.kpiId && t.userId === u.id && !t.dateKey)?.targetValue;
                       if (pt !== undefined) totalTgt += pt;
                    });
                    if (totalTgt === 0 && row.globalTarget) totalTgt = Number(row.globalTarget) || 0;
                    displayTarget = totalTgt;
                  } else {
                    const periodTarget = userTargets.find(t => t.kpiId === row.kpiId && t.userId === loggedInUserId && t.dateKey === d.key)?.targetValue;
                    displayTarget = periodTarget !== undefined ? periodTarget : Number(row.target);
                  }

                  return (
                    <div key={d.key} className={`flex flex-col gap-2 p-4 py-5 border-l border-gray-50 flex-1 min-w-[120px] ${isToday ? 'bg-blue-50/20' : ''}`}>
                      <button 
                        onClick={() => !isRealAdmin && setActiveReportModal({ kpiId: row.kpiId, dateKey: d.key, label: d.label })}
                        className={`group h-8 w-full border rounded px-3 flex items-center justify-end text-sm font-bold transition-all shadow-inner relative overflow-hidden ${
                          isToday ? 'border-[#38bdf8]/60 text-[#0ea5e9] bg-white ring-1 ring-[#38bdf8]/20' : 'border-[#cbd5e1] text-gray-700 bg-white hover:border-[#38bdf8]'
                        } ${isRealAdmin ? 'cursor-default opacity-80' : ''}`}
                      >
                        {currentActual}
                        {!isRealAdmin && (
                          <div className="absolute inset-y-0 left-0 w-8 bg-gray-50 border-r border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#555cf8] group-hover:bg-blue-50 transition-colors">
                             <FileText size={12} />
                          </div>
                        )}
                      </button>
                      <input
                        type="number"
                        value={displayTarget}
                        onChange={(e) => {
                          if (isRealAdmin) return;
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setTarget(row.kpiId, loggedInUserId, val, d.key);
                        }}
                        readOnly={isRealAdmin}
                        className={`h-8 w-full border border-[#84cc16]/30 rounded bg-[#84cc16]/10 text-right px-3 text-sm font-bold text-[#65a30d] focus:outline-none focus:ring-1 focus:ring-[#84cc16]/50 placeholder-[#84cc16]/50 ${isRealAdmin ? 'opacity-80 cursor-not-allowed' : ''}`}
                        placeholder="0"
                      />
                    </div>
                  );
                })}
              </div>

            </div>
          )})}
        </div>
      </div>
      
      {/* Save Button Area */}
      <div className="p-6 flex flex-col items-center gap-4 bg-gray-50 border-t border-gray-100">
        <button 
          onClick={handleSave}
          className="bg-[#666cff] hover:bg-[#555cf8] text-white font-bold tracking-wide px-10 py-2.5 rounded shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Save Entries
        </button>
        
        {isSaved && (
          <div className="flex items-center gap-2 text-green-600 font-bold text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CheckCircle2 size={16} /> Data saved successfully to local storage!
          </div>
        )}
      </div>

      {activeReportModal && (
        <ReportTableModal 
          kpiId={activeReportModal.kpiId} 
          dateKey={activeReportModal.dateKey} 
          label={activeReportModal.label}
          onClose={() => setActiveReportModal(null)}
        />
      )}
    </div>
  );
}
