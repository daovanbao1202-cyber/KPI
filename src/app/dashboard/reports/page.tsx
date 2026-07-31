'use client';

import { useState, useMemo } from 'react';
import { 
  FileText, ChevronDown, ChevronUp, Plus, 
  Eye, TrendingUp, TrendingDown, X, SlidersHorizontal,
  Table, FileDown, Trash2, Share2, HelpCircle, Trophy, Medal, Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useKPI } from '@/context/KPIContext';
import { useEffect } from 'react';
import * as XLSX from 'xlsx';
import { ResponsiveContainer, ComposedChart, Area, Line } from 'recharts';
import DateRangeSelector from '@/components/common/DateRangeSelector';
import ViewSelector from '@/components/dashboard/ViewSelector';

const getDatesInRange = (startDate: string, endDate: string) => {
  const dates = [];
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const current = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  let count = 0;
  while (current <= end && count < 365) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
    count++;
  }
  return dates;
};

const isKeyInPeriod = (key: string, start: string, end: string) => {
  if (!key) return false;
  // If weekly (W-YYYY-MM-DD)
  if (key.startsWith('W-')) {
    const datePart = key.substring(2);
    return datePart >= start && datePart <= end;
  }
  // If daily (YYYY-MM-DD)
  if (key.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return key >= start && key <= end;
  }
  // If monthly (YYYY-MM)
  if (key.match(/^\d{4}-\d{2}$/)) {
    return key >= start.substring(0, 7) && key <= end.substring(0, 7);
  }
  // If yearly (YYYY)
  if (key.match(/^\d{4}$/)) {
    return key >= start.substring(0, 4) && key <= end.substring(0, 4);
  }
  return false;
};

export default function ReportsPage() {
  const [showCustomize, setShowCustomize] = useState(false);
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false);
  const getPastDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };
  const [dateRange, setDateRange] = useState({ start: getPastDate(7), end: getPastDate(0) });
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const { visibleKpiDefs: kpiDefs, userActuals, userTargets, users, viewLevel, viewFilter, currentUser, reports } = useKPI();
  const router = useRouter();

  useEffect(() => {
    // Allow all users to access Reports, but they will only see their own assigned KPIs
  }, [currentUser, router]);
  
  const relevantUserIds = useMemo(() => {
    if (currentUser && !['Admin', 'Manager'].includes(currentUser.role)) {
      return [currentUser.id];
    }
    return users
      .filter(u => {
        if (viewLevel === 'Company') return true;
        if (viewLevel === 'Department') return u.department === viewFilter;
        if (viewLevel === 'Individual') return u.id === viewFilter;
        return false;
      })
      .map(u => u.id);
  }, [users, viewLevel, viewFilter, currentUser]);

  const reportData = useMemo(() => {
    const dates = getDatesInRange(dateRange.start, dateRange.end);

    return kpiDefs.map((kpi, index) => {
      let actual = 0;
      let targetVal = 0;

      // Only iterate over dates if the KPI is Daily. If Weekly/Monthly, 
      // we might just need to fetch all actuals in the period.
      // But to satisfy "sum of the days", we process Daily frequency by iterating days.
      if (!kpi.frequency || kpi.frequency.toLowerCase() === 'daily') {
        dates.forEach(date => {
          relevantUserIds.forEach(uId => {
            // Actual
            const rCount = reports ? reports.filter(r => r.kpiId === kpi.id && r.userId === uId && r.dateKey === date && r.isDone).length : 0;
            if (rCount > 0) {
              actual += rCount;
            } else {
              const m = userActuals.find(a => a.kpiId === kpi.id && a.userId === uId && a.date === date);
              if (m) actual += m.actualValue;
            }

            // Target
            let periodTarget = userTargets.find(t => t.kpiId === kpi.id && t.userId === uId && t.dateKey === date)?.targetValue;
            if (periodTarget === undefined) {
              periodTarget = userTargets.find(t => t.kpiId === kpi.id && t.userId === uId && !t.dateKey)?.targetValue;
            }
            if (periodTarget === undefined) {
              periodTarget = Number(kpi.hasTarget) || 0;
            }
            targetVal += periodTarget;
          });
        });
      } else {
        // For non-daily KPIs, we filter by the date/dateKey using our generic matching helper.
        const relevantManual = userActuals.filter(a => 
          a.kpiId === kpi.id && 
          relevantUserIds.includes(a.userId) &&
          isKeyInPeriod(a.date, dateRange.start, dateRange.end)
        );
        const relevantReports = reports ? reports.filter(r => 
          r.kpiId === kpi.id && 
          relevantUserIds.includes(r.userId) && 
          r.isDone &&
          isKeyInPeriod(r.dateKey, dateRange.start, dateRange.end)
        ) : [];
        
        const userDateSet = new Set([
          ...relevantManual.map(a => `${a.userId}|${a.date}`),
          ...relevantReports.map(r => `${r.userId}|${r.dateKey}`)
        ]);

        userDateSet.forEach(ud => {
          const [uIdStr, dateKey] = ud.split('|');
          const uId = Number(uIdStr);
          const rCount = relevantReports.filter(r => r.userId === uId && r.dateKey === dateKey).length;
          if (rCount > 0) {
            actual += rCount;
          } else {
            const m = relevantManual.find(a => a.userId === uId && a.date === dateKey);
            if (m) actual += m.actualValue;
          }
          
          let periodTarget = userTargets.find(t => t.kpiId === kpi.id && t.userId === uId && t.dateKey === dateKey)?.targetValue;
          if (periodTarget === undefined) {
            periodTarget = userTargets.find(t => t.kpiId === kpi.id && t.userId === uId && !t.dateKey)?.targetValue;
          }
          if (periodTarget === undefined) {
            periodTarget = Number(kpi.hasTarget) || 0;
          }
          targetVal += periodTarget;
        });

        // If targetVal is still 0 (no actuals to trigger target sum), fallback to base target
        if (targetVal === 0 && userDateSet.size === 0) {
           relevantUserIds.forEach(uId => {
              let t = userTargets.find(t => t.kpiId === kpi.id && t.userId === uId && !t.dateKey)?.targetValue;
              if (t === undefined) t = Number(kpi.hasTarget) || 0;
              targetVal += t;
           });
        }
      }

      // Generate sparkline/trend data using a fixed 7-month historical range for beautiful rendering
      const todayDateObj = new Date(2026, 4, 30);
      const trendDates = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(todayDateObj);
        d.setMonth(d.getMonth() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        trendDates.push(`${y}-${m}`);
      }

      const history = trendDates.map(date => {
        let val = 0;
        relevantUserIds.forEach(uId => {
          const rCount = reports ? reports.filter(r => r.kpiId === kpi.id && r.userId === uId && r.dateKey === date && r.isDone).length : 0;
          if (rCount > 0) {
            val += rCount;
          } else {
            const m = userActuals.find(a => a.kpiId === kpi.id && a.userId === uId && (a.date === date || a.date.startsWith(date)));
            if (m) val += m.actualValue;
          }
        });
        
        let periodTarget = userTargets
          .filter(t => t.kpiId === kpi.id && relevantUserIds.includes(t.userId))
          .reduce((acc, curr) => acc + curr.targetValue, 0);
        
        if (periodTarget === 0 && kpi.hasTarget) {
          periodTarget = Number(kpi.hasTarget);
        }
        if (periodTarget === 0) {
          periodTarget = 5;
        }

        return {
          actual: val,
          target: periodTarget
        };
      });

      // Default fallback
      if (targetVal === 0) targetVal = 100;

      const rawPct = (actual / targetVal) * 100;
      const pct = Math.round(rawPct);
      const diffPct = Math.round(((actual - targetVal) / targetVal) * 100);
      const isPositive = actual >= targetVal;

      return {
        ...kpi,
        index: index + 1,
        actual,
        target: targetVal,
        pct,
        diffPct: Math.abs(diffPct),
        isPositive,
        trend: isPositive ? 'up' : 'down',
        history
      };
    });
  }, [kpiDefs, userActuals, userTargets, relevantUserIds, reports, dateRange]);

  // ===== TOP 5 PERFORMERS LEADERBOARD =====
  const leaderboardData = useMemo(() => {
    const dates = getDatesInRange(dateRange.start, dateRange.end);
    
    // For a real leaderboard, we show top performers in the scope.
    // If viewLevel is Department, limit to that department.
    // Otherwise (Company or Individual level), show the company-wide Top 5.
    const leaderboardUsers = users.filter(u => {
      if (viewLevel === 'Department' && u.department !== viewFilter) return false;
      // Keep user only if they are assigned a KPI in kpiDefs with target > 0
      return userTargets.some(t => t.userId === u.id && kpiDefs.some(k => k.id === t.kpiId) && t.targetValue > 0);
    });

    const scoreMap: Record<number, { actual: number; target: number }> = {};

    leaderboardUsers.forEach(u => {
      let actualSum = 0;
      let targetSum = 0;

      kpiDefs.forEach(kpi => {
        if (!kpi.frequency || kpi.frequency.toLowerCase() === 'daily') {
          dates.forEach(date => {
            // Actual
            const rCount = reports ? reports.filter(r => r.kpiId === kpi.id && r.userId === u.id && r.dateKey === date && r.isDone).length : 0;
            if (rCount > 0) {
              actualSum += rCount;
            } else {
              const m = userActuals.find(a => a.kpiId === kpi.id && a.userId === u.id && a.date === date);
              if (m) actualSum += m.actualValue;
            }

            // Target
            let periodTarget = userTargets.find(t => t.kpiId === kpi.id && t.userId === u.id && t.dateKey === date)?.targetValue;
            if (periodTarget === undefined) {
              periodTarget = userTargets.find(t => t.kpiId === kpi.id && t.userId === u.id && !t.dateKey)?.targetValue;
            }
            if (periodTarget === undefined) {
              periodTarget = Number(kpi.hasTarget) || 0;
            }
            targetSum += periodTarget;
          });
        } else {
          // For non-daily KPIs (Weekly/Monthly/Yearly)
          // We filter by checking if the date/dateKey matches the dateRange using our matching helper.
          const relevantManual = userActuals.filter(a => 
            a.kpiId === kpi.id && 
            a.userId === u.id &&
            isKeyInPeriod(a.date, dateRange.start, dateRange.end)
          );
          
          const relevantReports = reports ? reports.filter(r => 
            r.kpiId === kpi.id && 
            r.userId === u.id && 
            r.isDone &&
            isKeyInPeriod(r.dateKey, dateRange.start, dateRange.end)
          ) : [];

          const userDateSet = new Set([
            ...relevantManual.map(a => a.date),
            ...relevantReports.map(r => r.dateKey)
          ]);

          let kpiActual = 0;
          let kpiTarget = 0;

          userDateSet.forEach(dateKey => {
            const rCount = relevantReports.filter(r => r.dateKey === dateKey).length;
            if (rCount > 0) {
              kpiActual += rCount;
            } else {
              const m = relevantManual.find(a => a.date === dateKey);
              if (m) kpiActual += m.actualValue;
            }
            
            let periodTarget = userTargets.find(t => t.kpiId === kpi.id && t.userId === u.id && t.dateKey === dateKey)?.targetValue;
            if (periodTarget === undefined) {
              periodTarget = userTargets.find(t => t.kpiId === kpi.id && t.userId === u.id && !t.dateKey)?.targetValue;
            }
            if (periodTarget === undefined) {
              periodTarget = Number(kpi.hasTarget) || 0;
            }
            kpiTarget += periodTarget;
          });

          // Fallback to base target if target is still 0
          if (kpiTarget === 0 && userDateSet.size === 0) {
            let t = userTargets.find(t => t.kpiId === kpi.id && t.userId === u.id && !t.dateKey)?.targetValue;
            if (t === undefined) t = Number(kpi.hasTarget) || 0;
            kpiTarget = t;
          }

          actualSum += kpiActual;
          targetSum += kpiTarget;
        }
      });

      if (targetSum === 0) targetSum = 100;
      scoreMap[u.id] = { actual: actualSum, target: targetSum };
    });

    return leaderboardUsers
      .map(u => {
        const actual = scoreMap[u.id]?.actual ?? 0;
        const target = scoreMap[u.id]?.target ?? 100;
        const pct = Math.min((actual / target) * 100, 999);
        return {
          ...u,
          actual,
          target,
          pct,
        };
      })
      .sort((a, b) => {
        if (b.pct !== a.pct) {
          return b.pct - a.pct;
        }
        return b.actual - a.actual;
      });
  }, [users, viewLevel, viewFilter, kpiDefs, userActuals, userTargets, reports, dateRange]);

  const exportExcelStyle = () => {
    try {
      const now = new Date();
      const timestamp = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const exportDateRange = `${dateRange.start} to ${dateRange.end}`;

      // 1. Prepare data rows starting from Row 4 (0-indexed: 3)
      const headers = [
        "KPI ID", "KPI Name", "KPI Description", "Frequency", "Direction", "Actual", "Target", "Compare Actual", "Compare Target"
      ];

      const dataRows = reportData.map(item => [
        item.id,
        item.name,
        item.description || '',
        item.frequency,
        item.direction === 'Up' ? 'Up' : 'Down',
        item.actual,
        item.target,
        '', // Compare Actual
        ''  // Compare Target
      ]);

      // 2. Create AOA (Array of Arrays)
      const aoa = [
        ["", "", "", "", "Top_Performing_KPIs"], // Row 1
        ["", "", "", "", exportDateRange],             // Row 2
        [],                                       // Row 3 (Empty)
        headers,                                  // Row 4
        ...dataRows,                              // Data rows
        [],                                       // Empty row
        [`Report generated on the ${timestamp}`] // Footer
      ];

      // 3. Create Workbook and Worksheet
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "KPI results");

      // 4. Set column widths for better "format" similarity
      ws['!cols'] = [
        { wch: 8 },  // A (Empty in screenshot usually if it starts at B, but here ID is B)
        { wch: 8 },  // KPI ID
        { wch: 20 }, // KPI Name
        { wch: 25 }, // KPI Description
        { wch: 12 }, // Frequency
        { wch: 10 }, // Direction
        { wch: 10 }, // Actual
        { wch: 10 }, // Target
        { wch: 15 }, // Compare Actual
        { wch: 15 }  // Compare Target
      ];

      // 5. Save file
      const fileName = `Top_Performing_KPIs_${now.toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error("Excel Styled Export Error:", err);
      alert("Lỗi khi xuất File Excel formatted.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex bg-[#f4f7fb] min-h-screen text-gray-700 font-sans overflow-hidden">
      
      {/* Sidebar - Hidden on mobile, shown on medium screens and up */}
      <div className="hidden md:flex w-[280px] bg-white border-r border-gray-200 flex flex-col shrink-0 h-[calc(100vh-64px)] overflow-y-auto no-print">
        <div className="p-4 py-3.5 flex items-center gap-2 mb-2">
          <FileText size={20} className="text-gray-400" />
          <span className="font-semibold text-[15px] text-gray-600">Reports</span>
        </div>

        <div className="px-3">
          <div className="flex items-center justify-between bg-[#f8fafc] rounded-md px-3 py-2 text-[12px] font-bold text-gray-400 mb-1 cursor-pointer">
            Standard Reports <ChevronDown size={14} />
          </div>
          
          <div className="space-y-0.5">
            {[
              'Top Performing KPIs', 'Worst Performing KPIs', 'Multiple KPIs', 
              'Multiple KPIs Breakdown', 'Multiple KPIs Pivot', 'KPI Performance', 
              'User KPIs', 'Data Entries By KPI', 'Data Entries By User', 'All Data Entries'
            ].map((name, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-md cursor-pointer transition-colors ${i === 0 ? 'bg-[#555cf8] text-white font-bold' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-white text-[#555cf8]' : 'bg-gray-100'}`}>
                  {i + 1}
                </div>
                <span className="truncate">{name}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between bg-[#f8fafc] rounded-md px-3 py-2 text-[12px] font-bold text-gray-400 mt-6 mb-2 cursor-pointer">
            Your Reports <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#f4f7fb]">
        
        <ViewSelector />
        
        {/* Top Header */}
        <div className="bg-white px-6 py-2 border-b border-gray-200 flex items-center justify-between shrink-0 no-print">
          <button className="flex items-center gap-1.5 text-gray-600 font-bold hover:text-gray-800 text-[12px] border border-gray-200 bg-white px-3 py-1.5 rounded-full transition-all shadow-sm active:scale-95">
            <Plus size={16} className="text-[#555cf8]" /> Add a New Report
          </button>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 bg-white text-[13px] font-medium transition-colors">
              <Eye size={14} /> Learn <ChevronDown size={14} />
            </button>
          </div>
        </div>

        <div className="p-3 md:p-6 print-padding">
          
          <div className="mb-6 flex items-center justify-between no-print">
            <button 
              onClick={() => setShowCustomize(!showCustomize)}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-1.5 text-[12px] font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
            >
              <SlidersHorizontal size={14} className="text-gray-400" /> Customize
            </button>

            <div className="flex items-center gap-1 bg-white rounded border border-gray-200 p-1 shadow-sm overflow-x-auto no-scrollbar">
              <button 
                onClick={exportExcelStyle} 
                className="p-1 px-[7px] hover:bg-gray-100 rounded text-gray-400 hover:text-[#555cf8] transition-colors" 
                title="Xuất file Excel theo định dạng"
                type="button"
              >
                <Table size={18} />
              </button>
              <button 
                onClick={handlePrint} 
                className="p-1 px-[7px] hover:bg-gray-100 rounded text-gray-400 hover:text-[#555cf8] transition-colors" 
                title="Xuất file PDF"
                type="button"
              >
                <FileDown size={18} />
              </button>
            </div>
          </div>

          {/* Actual Report Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-10 min-h-[500px] print-no-shadow print-no-border overflow-hidden">
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 no-print gap-4">
               <div>
                 <h2 className="text-[24px] font-medium text-gray-800 mb-1">Top Performing KPIs</h2>
                 <p className="text-[12px] font-medium text-gray-400 uppercase tracking-wider">
                   {dateRange.start} - {dateRange.end}
                 </p>
               </div>
               <div className="relative no-print">
                  <div 
                    onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 flex items-center justify-between bg-white text-gray-700 cursor-pointer shadow-sm hover:border-gray-400 transition-all w-full md:min-w-[320px]"
                  >
                     <span className="text-sm font-bold tracking-tight">
                       {new Date(dateRange.start).toLocaleDateString('vi-VN')} - {new Date(dateRange.end).toLocaleDateString('vi-VN')}
                     </span>
                     <ChevronDown size={18} className="text-gray-400 ml-2" />
                  </div>
                  {isDateDropdownOpen && (
                    <>
                       <div className="fixed inset-0 z-40" onClick={() => setIsDateDropdownOpen(false)}></div>
                       <div className="absolute top-[110%] right-0 z-50 shadow-2xl bg-white rounded-2xl overflow-hidden border border-gray-100">
                          <DateRangeSelector
                            currentRange={dateRange}
                            onApply={(res) => { setDateRange(res); setIsDateDropdownOpen(false); }}
                            onCancel={() => setIsDateDropdownOpen(false)}
                          />
                       </div>
                    </>
                  )}
               </div>
             </div>
             
             {/* Print-only header */}
             <div className="hidden print:block mb-8">
               <h2 className="text-[24px] font-medium text-gray-800 mb-1">Top Performing KPIs</h2>
               <p className="text-[12px] font-medium text-gray-400 uppercase tracking-wider">{dateRange.start} - {dateRange.end}</p>
             </div>

             <div className="overflow-x-auto no-scrollbar">
               <table className="w-full text-left min-w-[800px]">
                  <thead>
                     <tr className="text-[12px] font-bold text-gray-400 border-b-2 border-transparent uppercase">
                        <th className="pb-6 w-12 text-print-black"></th>
                        <th className="pb-6 text-print-black"></th>
                        <th className="pb-6 text-center text-print-black">Frequency</th>
                        <th className="pb-6 text-right pr-8 text-[#38bdf8] text-print-blue">Actual</th>
                        <th className="pb-6 text-right pr-6 text-[#84cc16] text-print-green">Target</th>
                        <th className="pb-6 text-center w-28 text-print-black">Target %</th>
                        <th className="pb-6 text-right w-24 text-print-black">Trend</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {reportData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="py-5">
                              <div className="w-7 h-7 bg-[#f1f5f9] rounded text-[12px] font-bold text-gray-400 flex items-center justify-center print-bg-light">{item.index}</div>
                           </td>
                           <td className="py-5">
                              <div className="flex items-center gap-3">
                                 <span className="text-xl">{item.icon || '🎯'}</span>
                                 <span className="font-bold text-[14px] text-gray-700">{item.name}</span>
                              </div>
                           </td>
                           <td className="py-5 text-center text-gray-400 text-[13px] font-medium">{item.frequency}</td>
                           <td className="py-5 text-right pr-8 font-bold text-[14px] text-[#38bdf8] text-print-blue">{item.actual.toLocaleString()}</td>
                           <td className="py-5 text-right pr-6 font-bold text-[14px] text-[#84cc16] text-print-green">{item.target.toLocaleString()}</td>
                           <td className="py-5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                 {!item.isPositive && (
                                   <svg width="14" height="18" viewBox="0 0 12 16" className="shrink-0">
                                     <path d="M6 16L0 9H4V0H8V9H12L6 16Z" fill="#b91c1c" />
                                   </svg>
                                 )}
                                 {item.isPositive && item.diffPct > 0 && (
                                   <svg width="14" height="18" viewBox="0 0 12 16" className="shrink-0 rotate-180">
                                     <path d="M6 16L0 9H4V0H8V9H12L6 16Z" fill="#15803d" />
                                   </svg>
                                 )}
                                 <span className={`text-[24px] font-medium leading-none ${!item.isPositive ? 'text-[#b91c1c]' : (item.diffPct === 0 ? 'text-gray-700' : 'text-[#15803d]')}`}>
                                   {item.isPositive ? `${item.diffPct}%` : `-${item.diffPct}%`}
                                 </span>
                              </div>
                           </td>
                           <td className="py-5 text-right">
                               <div className="inline-block w-[130px] h-[40px] pl-4 overflow-hidden">
                                  <ResponsiveContainer width="100%" height="100%">
                                     <ComposedChart data={item.history} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                                        <defs>
                                          <linearGradient id={`grad-report-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                                          </linearGradient>
                                        </defs>
                                        <Area 
                                          type="linear" 
                                          dataKey="actual" 
                                          stroke="#38bdf8" 
                                          strokeWidth={1.5}
                                          fill={`url(#grad-report-${item.id})`}
                                          dot={(props: any) => {
                                            const { cx, cy } = props;
                                            if (cx == null || cy == null) return null;
                                            return <rect key={`dot-${cx}-${cy}`} x={cx - 1.5} y={cy - 1.5} width={3} height={3} fill="#38bdf8" />;
                                          }}
                                          isAnimationActive={false}
                                        />
                                        <Line 
                                          type="linear" 
                                          dataKey="target" 
                                          stroke="#84cc16" 
                                          strokeWidth={1} 
                                          activeDot={false}
                                          dot={(props: any) => {
                                            const { cx, cy } = props;
                                            if (cx == null || cy == null) return null;
                                            return <rect key={`tdot-${cx}-${cy}`} x={cx - 1.5} y={cy - 1.5} width={3} height={3} fill="#84cc16" />;
                                          }}
                                          isAnimationActive={false}
                                        />
                                     </ComposedChart>
                                  </ResponsiveContainer>
                               </div>
                            </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             </div>
          </div>

          <div className="bg-[#f0f2f6] rounded-b-lg border-x border-b border-gray-200 px-6 py-3 flex items-center justify-between -mt-px relative z-10 no-print">
             <div className="flex items-center gap-2 text-[13px] font-bold text-gray-500">
                <span>Page</span>
                <div className="relative">
                   <select className="appearance-none bg-white border border-gray-300 rounded-md px-3 pr-6 py-0.5 outline-none font-bold shadow-sm">
                      <option>1</option>
                   </select>
                   <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <span>of 1</span>
             </div>
             <div className="flex items-center gap-1 text-[12px] font-bold text-gray-400">
                <span className="mr-2 uppercase tracking-widest text-[10px]">Per Page</span>
                <button className="px-2 py-0.5 rounded hover:bg-gray-200 transition-colors">10</button>
                <button className="px-2 py-0.5 rounded bg-white text-gray-700 shadow-sm border border-gray-200">25</button>
                <button className="px-2 py-0.5 rounded hover:bg-gray-200 transition-colors">50</button>
             </div>
          </div>

          {/* ===== TOP 5 KPI PERFORMERS LEADERBOARD ===== */}
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#f97316] flex items-center justify-center shadow-md">
                  <Trophy size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-800">Top 5 KPI Performers</h3>
                  <p className="text-[12px] text-gray-400 font-medium">{dateRange.start} &mdash; {dateRange.end}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Leaderboard</span>
            </div>
            {/* Leaderboard Table Headers */}
            {leaderboardData.length > 0 && (
              <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                <div className="w-7 text-center">Rank</div>
                <div className="w-8 text-center">Badge</div>
                <div className="flex-1 min-w-0">Member Info</div>
                <div className="w-24 text-right text-[#38bdf8] font-black">Actual</div>
                <div className="w-24 text-right text-[#84cc16] font-black">Target</div>
                <div className="w-24 text-right text-gray-700 font-black">Target %</div>
              </div>
            )}

            {/* Leaderboard rows */}
            <div className="divide-y divide-gray-50">
              {leaderboardData.length === 0 ?
                <div className="py-16 flex flex-col items-center gap-2 text-gray-300">
                  <Trophy size={36} />
                  <span className="text-[13px] font-medium">Chưa có dữ liệu thành viên</span>
                </div>
              : (showAllLeaderboard ? leaderboardData : leaderboardData.slice(0, 5)).map((member, i) => {
                /* Badge config */
                const badges = [
                  { label: 'Kim cương', emoji: '💎', bg: 'from-[#a5f3fc] to-[#818cf8]', ring: 'ring-[#818cf8]', text: '#818cf8' },
                  { label: 'Vàng',      emoji: '🥇', bg: 'from-[#fde68a] to-[#f59e0b]', ring: 'ring-[#f59e0b]', text: '#f59e0b' },
                  { label: 'Bạc',       emoji: '🥈', bg: 'from-[#e2e8f0] to-[#94a3b8]', ring: 'ring-[#94a3b8]', text: '#94a3b8' },
                  { label: 'Đồng',      emoji: '🥉', bg: 'from-[#fed7aa] to-[#ea580c]', ring: 'ring-[#ea580c]', text: '#ea580c' },
                  { label: 'Sắt',       emoji: '🏅', bg: 'from-[#f1f5f9] to-[#64748b]', ring: 'ring-[#64748b]', text: '#64748b' },
                ];
                const badge = badges[i] || { label: 'Thành viên', emoji: '👤', bg: 'from-[#f1f5f9] to-[#64748b]', ring: 'ring-gray-200', text: '#64748b' };

                /* Avatar color based on index */
                const avatarColors = [
                  'from-[#818cf8] to-[#a5f3fc]',
                  'from-[#f59e0b] to-[#fde68a]',
                  'from-[#94a3b8] to-[#e2e8f0]',
                  'from-[#ea580c] to-[#fed7aa]',
                  'from-[#64748b] to-[#cbd5e1]',
                ];
                const avatarColor = avatarColors[i] || 'from-gray-400 to-gray-200';

                const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'User';

                const initials = (memberName || 'U')
                  .split(' ')
                  .filter(Boolean)
                  .slice(-2)
                  .map((w: string) => w[0])
                  .join('')
                  .toUpperCase();

                const barColor = i === 0 ? '#818cf8' : i === 1 ? '#f59e0b' : i === 2 ? '#94a3b8' : i === 3 ? '#ea580c' : i === 4 ? '#64748b' : '#94a3b8';
                const pctCapped = Math.min(member.pct, 100);

                return (
                  <div key={member.id}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50/70 ${
                      i === 0 ? 'bg-gradient-to-r from-[#f5f3ff]/60 to-white' : ''
                    }`}
                  >
                    {/* Rank number */}
                    <div className="w-7 text-center">
                      <span className={`text-[15px] font-black ${
                        i === 0 ? 'text-[#818cf8]' : i === 1 ? 'text-[#f59e0b]' : i === 2 ? 'text-[#94a3b8]' : 'text-gray-400'
                      }`}>{i + 1}</span>
                    </div>

                    {/* Badge icon */}
                    <div className="text-[22px] select-none w-8 text-center" title={badge.label}>
                      {badge.emoji}
                    </div>

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {member.avatar ? (
                        <img 
                          src={member.avatar} 
                          alt={memberName} 
                          className={`w-11 h-11 rounded-full object-cover shadow-md ring-2 ${
                            i === 0 ? 'ring-[#818cf8]/40' : i === 1 ? 'ring-[#f59e0b]/40' : i === 2 ? 'ring-[#94a3b8]/40' : 'ring-gray-200'
                          }`}
                        />
                      ) : (
                        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColors[i]} flex items-center justify-center text-white font-black text-[14px] shadow-md ring-2 ${
                          i === 0 ? 'ring-[#818cf8]/40' : i === 1 ? 'ring-[#f59e0b]/40' : i === 2 ? 'ring-[#94a3b8]/40' : 'ring-gray-200'
                        }`}>
                          {initials || '?'}
                        </div>
                      )}
                      {/* Crown for #1 */}
                      {i === 0 && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[16px]">👑</span>
                      )}
                    </div>

                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[14px] text-gray-800 truncate">{memberName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full`}
                          style={{ background: barColor + '22', color: barColor }}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-gray-400 font-medium truncate">
                          🏢 {(member as any).department || 'Chưa có bộ phận'}
                        </span>
                        <span className="text-gray-200">·</span>
                        <span className="text-[11px] text-gray-400 font-medium capitalize">{(member as any).role || 'User'}</span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-[200px]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pctCapped}%`, background: barColor }}
                        />
                      </div>
                    </div>

                    {/* Columns for Actual, Target, and % */}
                    <div className="w-24 text-right font-extrabold text-[15px] text-[#38bdf8]">
                      {member.actual.toLocaleString()}
                    </div>
                    
                    <div className="w-24 text-right font-extrabold text-[15px] text-[#84cc16]">
                      {member.target.toLocaleString()}
                    </div>

                    <div className="w-24 text-right flex items-center justify-end gap-1">
                      {member.pct > 100 ? (
                        <svg width="10" height="12" viewBox="0 0 12 16" className="shrink-0 rotate-180">
                          <path d="M6 16L0 9H4V0H8V9H12L6 16Z" fill="#15803d" />
                        </svg>
                      ) : member.pct < 100 && member.pct > 0 ? (
                        <svg width="10" height="12" viewBox="0 0 12 16" className="shrink-0">
                          <path d="M6 16L0 9H4V0H8V9H12L6 16Z" fill="#b91c1c" />
                        </svg>
                      ) : null}
                      <span className="text-[16px] font-black" style={{ color: barColor }}>
                        {member.pct === 0 ? '0%' : (member.pct % 1 === 0 ? `${member.pct}%` : `${member.pct.toFixed(2)}%`)}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
            
            {/* Show All / Hide button */}
            {leaderboardData.length > 5 && (
              <div className="px-6 py-4 flex justify-center border-t border-gray-50 no-print">
                <button
                  onClick={() => setShowAllLeaderboard(!showAllLeaderboard)}
                  className="flex items-center gap-2 text-[13px] font-black text-[#555cf8] hover:text-[#4a51e2] bg-[#555cf8]/5 hover:bg-[#555cf8]/10 px-6 py-2.5 rounded-full transition-all active:scale-95 shadow-sm"
                >
                  {showAllLeaderboard ? (
                    <>Thu gọn <ChevronUp size={16} /></>
                  ) : (
                    <>Hiển thị tất cả ({leaderboardData.length}) <ChevronDown size={16} /></>
                  )}
                </button>
              </div>
            )}

            {/* Footer note */}
            {leaderboardData.length > 0 &&
              <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100">
                <p className="text-[11px] text-gray-400 font-medium text-center">
                  {"💡 Xếp hạng dựa trên tỉ lệ hoàn thành KPI (Actual / Target × 100%) trong kỳ được chọn"}
                </p>
              </div>
            }
          </div>

        </div>
      </div>
    </div>
  );
}
