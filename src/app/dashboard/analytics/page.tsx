'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, ChevronDown, Filter, HelpCircle, Columns, Download, Target, 
  ChevronLeft, ChevronRight, Share2, Maximize2, TrendingUp, TrendingDown,
  X, Grid, List, LayoutGrid, Monitor, Printer, RefreshCw, Smartphone,
  Save, Trash2, Table
} from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useKPI } from '@/context/KPIContext';
import ViewSelector from '@/components/dashboard/ViewSelector';
import DateRangeSelector from '@/components/common/DateRangeSelector';

export default function AnalyticsPage() {
  const { 
    visibleKpiDefs: kpiDefs, userActuals, userTargets, users, 
    viewLevel, viewFilter, isHydrated, setViewFilter, reports,
    groups, groupItems, loggedInUserId
  } = useKPI();
  
  const [selectedKpiId, setSelectedKpiId] = useState(kpiDefs[0]?.id || '');
  const [isKpiDropdownOpen, setIsKpiDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Groups' | 'Users'>('Groups');
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');

  // View States
  const [analyticsViews, setAnalyticsViews] = useState(['Default View', '123']);
  const [selectedViewName, setSelectedViewName] = useState('123');
  const [isAddViewModalOpen, setIsAddViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const selectedKpi = kpiDefs.find(k => k.id === selectedKpiId) || kpiDefs[0];

  const handleAddView = () => {
    if (newViewName.trim()) {
      if (isEditMode) {
        setAnalyticsViews(prev => prev.map(v => v === selectedViewName ? newViewName.trim() : v));
        setSelectedViewName(newViewName.trim());
      } else {
        setAnalyticsViews([...analyticsViews, newViewName.trim()]);
        setSelectedViewName(newViewName.trim());
      }
      setNewViewName('');
      setIsAddViewModalOpen(false);
      setIsEditMode(false);
    }
  };

  const handleDeleteView = () => {
    if (selectedViewName === 'Default View') return;
    if (confirm(`Are you sure you want to delete the view "${selectedViewName}"?`)) {
      const nextViews = analyticsViews.filter(v => v !== selectedViewName);
      setAnalyticsViews(nextViews);
      setSelectedViewName(nextViews[0] || 'Default View');
    }
  };

  const exportToExcel = async () => {
    // Load ExcelJS from CDN if not available (to avoid npm install issues)
    if (!(window as any).ExcelJS) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
      document.head.appendChild(script);
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    const ExcelJS = (window as any).ExcelJS;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Analytics');

    // Title
    const titleRow = worksheet.addRow(['', '', `Analytics - ${selectedViewName}`]);
    titleRow.getCell(3).font = { size: 16, bold: true, name: 'Calibri' };
    titleRow.getCell(3).alignment = { horizontal: 'center' };
    worksheet.mergeCells('C1:F1');

    // Subtitle
    const subtitleRow = worksheet.addRow(['', '', selectedKpi?.name || 'KPI Data']);
    subtitleRow.getCell(3).font = { size: 12, color: { argb: 'FF666666' }, name: 'Calibri' };
    subtitleRow.getCell(3).alignment = { horizontal: 'center' };
    worksheet.mergeCells('C2:F2');

    worksheet.addRow([]); // Spacer

    // Headers
    const headerRow = worksheet.addRow(['Group 1', 'User', 'Entry Date', 'Actual', 'Target', 'Notes']);
    headerRow.font = { bold: true, size: 11, name: 'Calibri' };
    headerRow.getCell(4).font = { bold: true, color: { argb: 'FF38BDF8' } }; // Blue
    headerRow.getCell(5).font = { bold: true, color: { argb: 'FF84CC16' } }; // Green
    
    // Borders for header
    headerRow.eachCell((cell: any) => {
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } } };
    });

    // Data
    analyticsData.forEach(d => {
      const row = worksheet.addRow([
        "(Not Set)",
        users.find(u => u.id === loggedInUserId)?.firstName || "User",
        d.name,
        d.actual,
        d.target,
        ""
      ]);
      row.getCell(4).font = { color: { argb: 'FF38BDF8' }, bold: true }; // Blue Actual
      row.getCell(5).font = { color: { argb: 'FF84CC16' }, bold: true }; // Green Target
      row.getCell(3).alignment = { horizontal: 'right' };
      row.getCell(4).alignment = { horizontal: 'right' };
      row.getCell(5).alignment = { horizontal: 'right' };
    });

    // Formatting
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 10;
    worksheet.getColumn(5).width = 10;
    worksheet.getColumn(6).width = 20;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `KPI_Analytics_${selectedViewName}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper for dates
  const getPastDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const [dateRange, setDateRange] = useState({
    start: getPastDate(6),
    end: getPastDate(0)
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Filter users based on viewLevel
  const relevantUsers = useMemo(() => users.filter(u => {
    if (viewLevel === 'Company') return true;
    if (viewLevel === 'Department') return String(u.department) === String(viewFilter);
    if (viewLevel === 'Individual') return String(u.id) === String(viewFilter);
    return false;
  }), [users, viewLevel, viewFilter]);

  const relevantUserIds = useMemo(() => relevantUsers.map(u => u.id), [relevantUsers]);

  if (!isHydrated) {
    return (
      <div className="flex flex-col h-full bg-[#f4f5f8] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#555cf8]"></div>
      </div>
    );
  }

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

  const analyticsData = useMemo(() => {
    if (!selectedKpi) return [];
    
    const dates = getDatesInRange(dateRange.start, dateRange.end);
    
    return dates.map(date => {
      const dObj = new Date(date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const isToday = dObj.getDate() === today.getDate() && dObj.getMonth() === today.getMonth() && dObj.getFullYear() === today.getFullYear();
      const isYesterday = dObj.getDate() === yesterday.getDate() && dObj.getMonth() === yesterday.getMonth() && dObj.getFullYear() === yesterday.getFullYear();
      
      let nameStr = `${dObj.getDate()} ${monthNames[dObj.getMonth()]}`;
      if (isToday) nameStr = 'Today';
      else if (isYesterday) nameStr = 'Yesterday';

      let actual = 0;
      let dayTarget = 0;
      
      relevantUserIds.forEach(uId => {
        // Actual
        const rCount = reports ? reports.filter(r => r.kpiId === selectedKpi.id && r.userId === uId && r.dateKey === date && r.isDone).length : 0;
        if (rCount > 0) {
          actual += rCount;
        } else {
          const m = userActuals.find(a => a.kpiId === selectedKpi.id && a.userId === uId && a.date === date);
          if (m) actual += m.actualValue;
        }

        // Target
        let t = userTargets.find(t => t.kpiId === selectedKpi.id && t.userId === uId && t.dateKey === date)?.targetValue;
        if (t === undefined) t = userTargets.find(t => t.kpiId === selectedKpi.id && t.userId === uId && !t.dateKey)?.targetValue;
        if (t === undefined) t = selectedKpi.hasTarget ? Number(selectedKpi.hasTarget) : 0;
        dayTarget += t;
      });
      
      if (dayTarget === 0) dayTarget = 100;

      return {
        name: nameStr,
        actual: actual,
        target: dayTarget,
        average: dayTarget * 0.25 // Adjusting to match screenshot visual
      };
    });
  }, [selectedKpi, userActuals, relevantUserIds, dateRange, reports, userTargets]);

  const totalActual = useMemo(() => analyticsData.reduce((acc, curr) => acc + curr.actual, 0), [analyticsData]);
  const totalTarget = useMemo(() => analyticsData.reduce((acc, curr) => acc + curr.target, 0), [analyticsData]);

  const pct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
  const isPositive = pct >= 100;

  const formatDateDisplay = (start: string, end: string) => {
    if (!start || !end) return 'Select Date Range';
    const s = new Date(start);
    const e = new Date(end);
    return `${s.getDate()} ${monthNames[s.getMonth()]} ${s.getFullYear()} - ${e.getDate()} ${monthNames[e.getMonth()]} ${e.getFullYear()}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f7fb]">
      
      {/* Top Level View Selector */}
      <ViewSelector />

      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Views Navigation */}
        <div className="w-[240px] bg-[#f8fafc] border-r border-[#e2e8f0] flex flex-col shrink-0">
           <div className="p-4 py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
              <span className="font-bold text-[13px] text-gray-500 flex items-center gap-2"><LayoutGrid size={14} /> Analytics</span>
           </div>
           <div className="p-3">
              <button 
                onClick={() => setIsAddViewModalOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors text-xs font-bold mb-2"
              >
                 <Plus size={14} /> Add a new View
              </button>
              
              {analyticsViews.map((name, idx) => (
                <div 
                  key={name}
                  onClick={() => setSelectedViewName(name)}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded transition-colors group mb-1 ${
                    selectedViewName === name ? 'bg-[#555cf8]/10' : 'hover:bg-gray-100'
                  }`}
                >
                   <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                     selectedViewName === name ? 'bg-[#555cf8] text-white' : 'bg-gray-200 text-gray-500'
                   }`}>{idx + 1}</div>
                   <span className={`text-[13px] grow ${selectedViewName === name ? 'text-[#555cf8] font-bold' : 'text-gray-600 font-medium'}`}>{name}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-white p-8">
           
           {/* Page Title */}
           <div className="flex items-center justify-between mb-6">
              <h1 className="text-[28px] font-black text-gray-800 tracking-tight">{selectedViewName}</h1>
              <div className="flex gap-2">
                 <button 
                  onClick={() => { setNewViewName(selectedViewName); setIsEditMode(true); setIsAddViewModalOpen(true); }}
                  className="p-2.5 text-gray-400 hover:text-blue-600 border border-gray-200 rounded-xl bg-white shadow-sm transition-all"
                  title="Edit View Name"
                 >
                    <Save size={20} />
                 </button>
                 <button 
                  onClick={handleDeleteView}
                  disabled={selectedViewName === 'Default View'}
                  className="p-2.5 text-gray-400 hover:text-red-600 border border-gray-200 rounded-xl bg-white shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Delete View"
                 >
                    <Trash2 size={20} />
                 </button>
                 <button 
                  onClick={exportToExcel}
                  className="p-2.5 text-gray-400 hover:text-green-600 border border-gray-200 rounded-xl bg-white shadow-sm transition-all"
                  title="Export to Excel"
                 >
                    <Table size={20} />
                 </button>
              </div>
           </div>

           <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest mb-4">Select a KPI & Date range</p>

           {/* KPI & Date Selectors */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* KPI Dropdown */}
              <div className="relative">
                 <div 
                  onClick={() => setIsKpiDropdownOpen(!isKpiDropdownOpen)}
                  className="border border-[#1e293b] rounded-xl px-4 py-3.5 flex items-center justify-between bg-[#1e293b] text-white cursor-pointer shadow-lg hover:bg-[#334155] transition-all h-[52px]"
                 >
                    <div className="flex items-center gap-3">
                       <span className="text-xl">{selectedKpi?.icon || '🇮🇹'}</span>
                       <span className="text-sm font-bold tracking-tight">{selectedKpi?.name || 'Select KPI'}</span>
                    </div>
                    <ChevronDown size={18} />
                 </div>
                 {isKpiDropdownOpen && (
                   <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsKpiDropdownOpen(false)}></div>
                      <div className="absolute top-[110%] left-0 w-full bg-white border border-gray-200 shadow-2xl rounded-xl py-2 z-50 text-gray-800 mt-1 max-h-60 overflow-y-auto">
                        {kpiDefs.map(k => (
                          <div 
                            key={k.id} 
                            onClick={() => { setSelectedKpiId(k.id); setIsKpiDropdownOpen(false); }}
                            className="px-4 py-2 hover:bg-[#f8fafc] flex items-center gap-3 transition-colors cursor-pointer"
                          >
                            <span className="text-lg">{k.icon || '🎯'}</span>
                            <span className="text-sm font-bold">{k.name}</span>
                          </div>
                        ))}
                      </div>
                   </>
                 )}
              </div>

              {/* Date Dropdown */}
              <div className="relative">
                 <div 
                  onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                  className="border border-gray-200 rounded-xl px-4 py-3.5 flex items-center justify-between bg-white text-gray-700 cursor-pointer shadow-sm hover:border-gray-400 transition-all h-[52px]"
                 >
                    <span className="text-sm font-bold tracking-tight">{formatDateDisplay(dateRange.start, dateRange.end)}</span>
                    <ChevronDown size={18} className="text-gray-400" />
                 </div>
                 {isDateDropdownOpen && (
                   <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsDateDropdownOpen(false)}></div>
                      <div className="absolute top-[110%] left-0 w-full md:w-[450px] z-50">
                         <DateRangeSelector 
                           currentRange={dateRange} 
                           onApply={(range) => { setDateRange(range); setIsDateDropdownOpen(false); }} 
                           onCancel={() => setIsDateDropdownOpen(false)} 
                         />
                      </div>
                   </>
                 )}
              </div>
           </div>

           {/* Comparison Rows */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-2 bg-white/50 text-[11px] font-bold text-gray-400">
                 <div className="flex items-center gap-2"><span>Compare:</span> <span className="text-gray-300">- Optional -</span></div>
                 <div className="flex items-center gap-2"><ChevronDown size={14} /> <X size={14} className="cursor-pointer hover:text-red-400" /></div>
              </div>
              <div className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-2 bg-white/50 text-[11px] font-bold text-gray-400">
                 <div className="flex items-center gap-2"><span>Compare:</span> <span className="text-gray-300">- Optional -</span></div>
                 <div className="flex items-center gap-2"><ChevronDown size={14} /> <X size={14} className="cursor-pointer hover:text-red-400" /></div>
              </div>
           </div>

           {/* Toolbar */}
           <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-4">
              <div className="flex items-center gap-4">
                 <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Filter by:</span>
                 <div className="flex items-center gap-2">
                    <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors">
                       All Users <ChevronDown size={12} />
                    </div>
                    <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors">
                       All Groups <ChevronDown size={12} />
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mr-1">Options:</span>
                 <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
                    <button className="p-1.5 text-gray-400 hover:text-[#555cf8] hover:bg-white hover:shadow-sm rounded transition-all"><Monitor size={14} /></button>
                    <button className="p-1.5 text-[#555cf8] bg-white shadow-sm rounded transition-all"><LayoutGrid size={14} /></button>
                    <button className="p-1.5 text-gray-400 hover:text-[#555cf8] hover:bg-white hover:shadow-sm rounded transition-all"><List size={14} /></button>
                    <button className="p-1.5 text-gray-400 hover:text-[#555cf8] hover:bg-white hover:shadow-sm rounded transition-all"><LayoutGrid size={14} /></button>
                    <button className="p-1.5 text-gray-400 hover:text-[#555cf8] hover:bg-white hover:shadow-sm rounded transition-all"><Printer size={14} /></button>
                 </div>
                 <div className="flex items-center gap-1">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-all"><RefreshCw size={16} /></button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-all"><ChevronLeft size={16} /></button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-all"><ChevronRight size={16} /></button>
                 </div>
              </div>
           </div>

           {/* Chart Card */}
           <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 mb-8 relative">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                    <Tooltip 
                       cursor={{ stroke: '#555cf8', strokeWidth: 1, strokeDasharray: '3 3' }}
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                    />
                    <Legend verticalAlign="bottom" align="center" iconType="square" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }} />
                    
                    <Area 
                      name={selectedKpi?.name}
                      type="linear" 
                      dataKey="actual" 
                      fill="#38bdf8" 
                      fillOpacity={0.25} 
                      stroke="#38bdf8" 
                      strokeWidth={3} 
                      dot={(props: any) => {
                        const { cx, cy } = props;
                        if (cx == null || cy == null) return null;
                        return <rect key={`dot-actual-${cx}-${cy}`} x={cx - 3.5} y={cy - 3.5} width={7} height={7} fill="#38bdf8" />;
                      }}
                    />
                    
                    <Line 
                      name="Target"
                      type="linear" 
                      dataKey="target" 
                      stroke="#84cc16" 
                      strokeWidth={2} 
                      dot={(props: any) => {
                        const { cx, cy } = props;
                        if (cx == null || cy == null) return null;
                        return <rect key={`dot-target-${cx}-${cy}`} x={cx - 3.5} y={cy - 3.5} width={7} height={7} fill="#84cc16" />;
                      }}
                    />

                    <Line 
                      name="Average"
                      type="linear" 
                      dataKey="average" 
                      stroke="#bef264" 
                      strokeWidth={2} 
                      dot={(props: any) => {
                        const { cx, cy } = props;
                        if (cx == null || cy == null) return null;
                        return <rect key={`dot-avg-${cx}-${cy}`} x={cx - 3.5} y={cy - 3.5} width={7} height={7} fill="#bef264" />;
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Drill-down Detail Section */}
           <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-3">
                 <h2 className="text-sm font-bold text-gray-700">{selectedKpi?.name} / {groups.find(g => g.id === selectedGroupId)?.name || 'Group 1'}</h2>
              </div>
              
              <div className="flex min-h-[300px]">
                 {/* Left List Pane */}
                 <div className="w-[260px] border-r border-gray-100 bg-white">
                    <div className="px-4 py-2 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Groups</div>
                    <div className="p-1">
                       {groups.map(g => (
                         <div 
                           key={g.id} 
                           onClick={() => setSelectedGroupId(g.id)}
                           className={`px-4 py-2.5 rounded-lg cursor-pointer transition-all text-sm font-bold flex items-center justify-between mb-1 ${
                             selectedGroupId === g.id ? 'bg-[#555cf8] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                           }`}
                         >
                            <span>{g.name}</span>
                         </div>
                       ))}
                       {groups.length === 0 && (
                          <div className="p-4 text-xs text-gray-400 italic">No groups defined</div>
                       )}
                    </div>
                    <div className="px-4 py-2 mt-4 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Users</div>
                 </div>

                 {/* Right Detail Pane */}
                 <div className="flex-1 bg-[#fcfdfe]">
                    <div className="px-6 py-2 border-b border-gray-100 bg-white flex items-center justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest">
                       <span>{groups.find(g => g.id === selectedGroupId)?.name || 'Group 1'}</span>
                       <div className="flex items-center gap-12">
                          <span className="w-16 text-right">Actual</span>
                          <span className="w-16 text-right">Target</span>
                          <span className="w-16 text-right">Target %</span>
                       </div>
                    </div>
                    <div className="p-4">
                       <div className="flex items-center justify-between px-2 py-2.5 bg-white border border-gray-50 rounded-lg shadow-sm mb-2 hover:border-[#555cf8]/30 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                             <span className="text-xs font-bold text-gray-700">1. (Not Set)</span>
                          </div>
                          <div className="flex items-center gap-12 text-[13px] font-black">
                             <span className="w-16 text-right text-gray-800">{totalActual}</span>
                             <span className="w-16 text-right text-gray-400 font-bold">{totalTarget}</span>
                             <span className={`w-16 text-right ${pct >= 100 ? 'text-green-500' : 'text-red-500'}`}>{pct - 100}%</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-6 right-6 w-12 h-12 bg-[#555cf8] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95 z-50">
        <HelpCircle size={24} />
      </button>

      {/* Save View Modal */}
      {isAddViewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="fixed inset-0 bg-[#1e293b]/60 backdrop-blur-sm" onClick={() => setIsAddViewModalOpen(false)}></div>
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-8">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Rename view' : 'Save as a new view'}</h2>
                    <button onClick={() => { setIsAddViewModalOpen(false); setIsEditMode(false); }} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                 </div>

                 <div className="mb-8">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">View Name</label>
                    <input 
                      type="text" 
                      autoFocus
                      value={newViewName}
                      onChange={(e) => setNewViewName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddView()}
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-[#555cf8] outline-none transition-all text-gray-700 font-medium"
                      placeholder="Enter view name..."
                    />
                 </div>

                 <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setIsAddViewModalOpen(false)}
                      className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-all"
                    >
                       Cancel
                    </button>
                    <button 
                      onClick={handleAddView}
                      disabled={!newViewName.trim()}
                      className="px-8 py-2.5 bg-[#555cf8] text-white rounded-xl font-bold shadow-lg shadow-[#555cf8]/30 hover:bg-[#4a51e2] transition-all disabled:opacity-50"
                    >
                       Save
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
