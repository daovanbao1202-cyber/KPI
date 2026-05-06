'use client';

import React from 'react';
import { useKPI } from '@/context/KPIContext';
import { TrendingUp, AlertCircle, CheckCircle2, Award, Zap, ChevronRight } from 'lucide-react';

export default function MBOSheet() {
  const { kpiDefs, viewFilter, setViewFilter, users, userActuals, userTargets, addKPIDefinition } = useKPI();
  const [selectedDept, setSelectedDept] = React.useState('ALL');

  const handleAddNewRow = () => {
    addKPIDefinition({
      name: 'NEW STRATEGIC KPI',
      unit: 'Units',
      category: perspectiveOptions[0],
      description: 'Strategic Goal',
      hasTarget: '100',
    });
  };

  const departments = ['ALL', ...Array.from(new Set(users.map(u => u.department).filter(Boolean))).sort()];

  const perspectiveOptions = [
    "재무 Finance/Tài chính",
    "고객 Customer/Khách hàng",
    "프로세스 Process/Quy trình",
    "학습과성장 Learn & Development/Học hỏi và Phát triển",
    "전사 Company-Wide/Quy định công ty"
  ];

  // Manual inputs state
  const [manualInputs, setManualInputs] = React.useState<Record<string, { perspective: string, csf: string, kpi: string }>>({});

  const handleManualChange = (kpiId: string, field: 'perspective' | 'csf' | 'kpi', value: string) => {
    setManualInputs(prev => ({
      ...prev,
      [kpiId]: {
        ...(prev[kpiId] || { perspective: perspectiveOptions[0], csf: '', kpi: '' }),
        [field]: value
      }
    }));
  };

  // Dynamic MBO Data calculation
  const getAggregatedData = () => {
    return kpiDefs.map(kpi => {
      // Filter users based on selected department if needed
      const filteredUsers = selectedDept === 'ALL' 
        ? users 
        : users.filter(u => u.department.toUpperCase() === selectedDept.toUpperCase());
      
      const userIds = filteredUsers.map(u => u.id);

      // Aggregate This Year (Current Month/Total)
      const thisYearActual = userActuals
        .filter(a => a.kpiId === kpi.id && userIds.includes(a.userId))
        .reduce((sum, curr) => sum + curr.actualValue, 0);

      // Aggregate Targets (Plan)
      const planValue = userTargets
        .filter(t => t.kpiId === kpi.id && userIds.includes(t.userId))
        .reduce((sum, curr) => sum + curr.targetValue, 0) || Number(kpi.hasTarget) || 100;

      // Completion Percentage
      const completion = (thisYearActual / planValue) * 100;

      const manual = manualInputs[kpi.id] || { 
        perspective: kpi.category || perspectiveOptions[0], 
        csf: kpi.description || '', 
        kpi: kpi.name 
      };

      return {
        id: kpi.id,
        category: manual.perspective,
        csf: manual.csf,
        kpiName: manual.kpi,
        kpiId: kpi.id,
        weight: '10%', // Placeholder weight
        plan: planValue.toLocaleString() + ' ' + kpi.unit,
        lastYear: (planValue * 0.85).toLocaleString() + ' ' + kpi.unit, // Mocked as 85% of plan
        thisYear: thisYearActual.toLocaleString() + ' ' + kpi.unit,
        formula: kpi.formula || 'Sum of actuals / Target',
        scores: { S: '120%↑', A: '105%↑', B: '100%↑', C: '90%↑', D: '80%↓' },
        actual: isNaN(completion) ? 0 : parseFloat(completion.toFixed(1)),
      };
    });
  };

  const mboData = getAggregatedData();

  const getGrade = (val: number) => {
    if (val >= 110) return { label: 'S', color: 'bg-indigo-500 text-white' };
    if (val >= 100) return { label: 'A', color: 'bg-blue-500 text-white' };
    if (val >= 90) return { label: 'B', color: 'bg-emerald-500 text-white' };
    if (val >= 80) return { label: 'C', color: 'bg-amber-500 text-white' };
    return { label: 'D', color: 'bg-rose-500 text-white' };
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* MBO Header with Department Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-6 glass-card px-6 py-3 rounded-2xl border-white/40">
           <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Chọn Bộ Phận:</span>
              <div className="relative">
                <select 
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="appearance-none bg-slate-900 text-white px-6 py-2 pr-10 rounded-xl font-black text-sm border-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer shadow-xl uppercase tracking-tight"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
              </div>
           </div>
           <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
           <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Fiscal Year: <span className="text-slate-800 dark:text-white">2026</span></div>
        </div>

        <div className="flex items-center gap-4">
           {/* Summary badges */}
           <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[11px] font-black text-emerald-600 uppercase tracking-tighter">Status: On Track</span>
           </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-6 rounded-[2rem] border-white/40">
           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total MBO Score</div>
           <div className="text-4xl font-black text-slate-800 dark:text-white flex items-baseline gap-2">
              95.2 <span className="text-sm font-bold text-emerald-500">pts</span>
           </div>
        </div>
        <div className="glass-card p-6 rounded-[2rem] border-white/40">
           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Average Grade</div>
           <div className="flex items-center gap-3 mt-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30">A</div>
              <div className="text-sm font-bold text-slate-600 dark:text-slate-300">High Performer</div>
           </div>
        </div>
        <div className="glass-card p-6 rounded-[2rem] border-white/40 lg:col-span-2 flex items-center justify-between">
           <div className="flex flex-col">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Completion Progress</div>
              <div className="flex items-center gap-4">
                 <div className="w-48 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '84%' }}></div>
                 </div>
                 <span className="text-xl font-black text-slate-800 dark:text-white">84%</span>
              </div>
           </div>
           <div className="flex -space-x-3">
              {[1,2,3,4,5].map(i => (
                <img key={i} className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-800" src={`https://i.pravatar.cc/150?u=${i+20}`} alt="" />
              ))}
           </div>
        </div>
      </div>

      {/* MBO Sheet Table */}
      <div className="glass-card rounded-[3rem] overflow-hidden border-white/50 shadow-2xl shadow-slate-200/50 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[1500px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                <th className="w-64 px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">관 점 / Hạng Mục</th>
                <th className="w-80 px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">전략과제 (CSF) / Nhiệm vụ</th>
                <th className="w-80 px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">핵심성과지표 (KPI) / Chỉ số</th>
                <th className="w-24 px-4 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Weight</th>
                <th className="w-32 px-4 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Plan (Mục tiêu)</th>
                <th className="w-32 px-4 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Result Last Year</th>
                <th className="w-32 px-4 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Result This Year</th>
                <th className="w-48 px-4 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Criterion (S-D)</th>
                <th className="w-24 px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {mboData.map((item, idx) => {
                const grade = getGrade(item.actual);
                return (
                  <tr key={idx} className="group hover:bg-white/60 dark:hover:bg-slate-800/40 transition-all duration-300">
                    <td className="px-8 py-6">
                       <select 
                         value={item.category}
                         onChange={(e) => handleManualChange(item.id, 'perspective', e.target.value)}
                         className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-brand-primary"
                       >
                         {perspectiveOptions.map(opt => (
                           <option key={opt} value={opt}>{opt}</option>
                         ))}
                       </select>
                    </td>
                    <td className="px-8 py-6">
                       <textarea 
                         value={item.csf}
                         onChange={(e) => handleManualChange(item.id, 'csf', e.target.value)}
                         placeholder="Nhập nhiệm vụ chiến lược..."
                         className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-800 dark:text-slate-200 resize-none overflow-hidden h-10 p-0"
                       />
                    </td>
                    <td className="px-8 py-6">
                       <textarea 
                         value={item.kpiName}
                         onChange={(e) => handleManualChange(item.id, 'kpi', e.target.value)}
                         placeholder="Nhập chỉ số KPI..."
                         className="w-full bg-transparent border-none focus:ring-0 text-sm font-black text-slate-800 dark:text-white uppercase leading-tight resize-none overflow-hidden h-10 p-0"
                       />
                    </td>
                    <td className="px-4 py-6 text-center">
                      <span className="px-3 py-1.5 bg-slate-100/50 dark:bg-slate-800 text-[11px] font-black text-slate-500 dark:text-slate-400 rounded-lg">
                        {item.weight}
                      </span>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <span className="text-sm font-black text-slate-800 dark:text-white">{item.plan}</span>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <span className="text-sm font-bold text-slate-400">{item.lastYear}</span>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                         <span className="text-sm font-black text-brand-primary">{item.thisYear}</span>
                         <span className={`text-[9px] font-black ${item.actual >= 100 ? 'text-emerald-500' : 'text-rose-400'}`}>({item.actual}%)</span>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center justify-center gap-3 text-[9px] font-black">
                        <div className="flex flex-col items-center">
                           <span className="text-indigo-500 mb-0.5">S</span>
                           <span className="text-slate-400">{item.scores.S}</span>
                        </div>
                        <div className="w-px h-6 bg-slate-100 dark:bg-slate-700"></div>
                        <div className="flex flex-col items-center">
                           <span className="text-rose-400 mb-0.5">D</span>
                           <span className="text-slate-400">{item.scores.D}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className={`w-10 h-10 rounded-2xl ${grade.color} inline-flex items-center justify-center font-black text-lg shadow-xl shadow-current/10 border-2 border-white/20`}>
                        {grade.label}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {/* Add Row Button Row */}
              <tr className="border-t border-slate-50 dark:border-slate-800">
                <td colSpan={9} className="px-8 py-4">
                  <button 
                    onClick={handleAddNewRow}
                    className="flex items-center gap-2 text-slate-400 hover:text-brand-primary transition-colors text-sm font-bold group"
                  >
                    <div className="w-5 h-5 rounded-md border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:border-brand-primary">
                      <span className="text-xs font-black">+</span>
                    </div>
                    Trang mới
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Footer Summary */}
        <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
           <div className="flex items-center gap-6">
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Weight</span>
                 <span className="text-lg font-black text-slate-800 dark:text-white">100%</span>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Achievement</span>
                 <span className="text-lg font-black text-emerald-500">104.2%</span>
              </div>
           </div>
           
           <button className="flex items-center gap-2 px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold text-sm interactive-hover">
              Download PDF Report
           </button>
        </div>
      </div>
    </div>
  );
}
