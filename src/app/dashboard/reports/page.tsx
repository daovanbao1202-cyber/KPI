'use client';

import { useState, useMemo } from 'react';
import { 
  FileText, ChevronDown, ChevronUp, Plus, 
  Eye, TrendingUp, TrendingDown, X, SlidersHorizontal,
  Table, FileDown, Trash2, Share2, HelpCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useKPI } from '@/context/KPIContext';
import { useEffect } from 'react';
import * as XLSX from 'xlsx';
import { ResponsiveContainer, AreaChart, Area, Line } from 'recharts';
import DateRangeSelector from '@/components/common/DateRangeSelector';
import ViewSelector from '@/components/dashboard/ViewSelector';

const getDatesInRange = (startDate: string, endDate: string) => {
  const dates = [];
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  let current = new Date(sy, sm - 1, sd);
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

export default function ReportsPage() {
  const [showCustomize, setShowCustomize] = useState(false);
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
        // For non-daily KPIs, we just sum whatever is found that falls into this period roughly,
        // or just sum the global targets. To be safe and simple, we'll just sum what is in the DB 
        // that matches the relevant users, since dateKey might not be YYYY-MM-DD.
        const relevantManual = userActuals.filter(a => a.kpiId === kpi.id && relevantUserIds.includes(a.userId));
        const relevantReports = reports ? reports.filter(r => r.kpiId === kpi.id && relevantUserIds.includes(r.userId) && r.isDone) : [];
        
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

      const history = dates.map(date => {
        let dayActual = 0;
        let dayTarget = 0;
        relevantUserIds.forEach(uId => {
          // Actual
          const rCount = reports ? reports.filter(r => r.kpiId === kpi.id && r.userId === uId && r.dateKey === date && r.isDone).length : 0;
          if (rCount > 0) {
            dayActual += rCount;
          } else {
            const m = userActuals.find(a => a.kpiId === kpi.id && a.userId === uId && a.date === date);
            if (m) dayActual += m.actualValue;
          }

          // Target
          let dt = userTargets.find(t => t.kpiId === kpi.id && t.userId === uId && t.dateKey === date)?.targetValue;
          if (dt === undefined) dt = userTargets.find(t => t.kpiId === kpi.id && t.userId === uId && !t.dateKey)?.targetValue;
          if (dt === undefined) dt = Number(kpi.hasTarget) || 0;
          dayTarget += dt;
        });
        return { actual: dayActual, target: dayTarget };
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
      
      {/* Sidebar */}
      <div className="w-[280px] bg-white border-r border-gray-200 flex flex-col shrink-0 h-[calc(100vh-64px)] overflow-y-auto no-print">
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

        <div className="p-6 print-padding">
          
          <div className="mb-6 flex items-center justify-between no-print">
            <button 
              onClick={() => setShowCustomize(!showCustomize)}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-1.5 text-[12px] font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
            >
              <SlidersHorizontal size={14} className="text-gray-400" /> Customize
            </button>

            <div className="flex items-center gap-1 bg-white rounded border border-gray-200 p-1 shadow-sm">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10 min-h-[500px] print-no-shadow print-no-border">
             <div className="flex items-center justify-between mb-8 no-print">
               <div>
                 <h2 className="text-[24px] font-medium text-gray-800 mb-1">Top Performing KPIs</h2>
                 <p className="text-[12px] font-medium text-gray-400 uppercase tracking-wider">
                   {dateRange.start} - {dateRange.end}
                 </p>
               </div>
               <div className="relative no-print">
                  <div 
                    onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 flex items-center justify-between bg-white text-gray-700 cursor-pointer shadow-sm hover:border-gray-400 transition-all min-w-[320px]"
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

             <table className="w-full text-left">
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
                             <div className="inline-block w-[130px] h-[40px]">
                                <ResponsiveContainer width="100%" height="100%">
                                   <AreaChart data={item.history} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                                      <Area 
                                        type="linear" 
                                        dataKey="actual" 
                                        stroke="#1890ff" 
                                        fill="#91d5ff" 
                                        fillOpacity={0.5} 
                                        strokeWidth={1.5}
                                        dot={{ r: 1.2, fill: '#1890ff', strokeWidth: 0 }}
                                        isAnimationActive={false}
                                      />
                                      <Line 
                                        type="linear" 
                                        dataKey="target" 
                                        stroke="#72c040" 
                                        strokeWidth={1.2} 
                                        dot={{ r: 1.2, fill: '#72c040', strokeWidth: 0 }}
                                        isAnimationActive={false}
                                      />
                                   </AreaChart>
                                </ResponsiveContainer>
                             </div>
                          </td>
                      </tr>
                   ))}
                </tbody>
             </table>
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

        </div>
      </div>
      
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; }
          .print-padding { padding: 0 !important; }
          .print-no-shadow { box-shadow: none !important; }
          .print-no-border { border: none !important; }
          .text-print-black { color: black !important; }
          .text-print-blue { color: #38bdf8 !important; }
          .text-print-green { color: #84cc16 !important; }
          .text-print-red { color: #f43f5e !important; }
          .print-bg-light { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
          .print-fill-blue { fill: #bae6fd !important; opacity: 0.4 !important; -webkit-print-color-adjust: exact; }
          .print-stroke-blue { stroke: #38bdf8 !important; -webkit-print-color-adjust: exact; }
          .print-fill-red { fill: #fecaca !important; opacity: 0.4 !important; -webkit-print-color-adjust: exact; }
          .print-stroke-red { stroke: #f43f5e !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
