'use client';

import { useState } from 'react';
import { X, Calendar as CalendarIcon, ChevronDown, Check, Settings2, BarChart2, PieChart, Target as GaugeIcon, Trash2, LineChart, TrendingUp, BarChart, Network, List } from 'lucide-react';
import { useKPI, KPIDefinition } from '@/context/KPIContext';
import { BarGraph, KPIDonutChart, GaugeChart, LineGraph, SingleKPI, StackedKpiGraph, MultipleKpiSeries, GroupedKpiColumns, RagColumnGraph, MultiKpiPieChart, KPIList } from '@/components/dashboard/Charts';
import DateRangeSelector from '@/components/common/DateRangeSelector';

interface ChartModalProps {
  type: string;
  onClose: () => void;
  onSave: (chart: { kpiId?: string; kpiIds?: string[]; title: string; dateRange: { start: string; end: string } }) => void;
}

export default function ChartModal({ type, onClose, onSave }: ChartModalProps) {
  const { visibleKpiDefs: kpiDefs } = useKPI();
  const [selectedKpiId, setSelectedKpiId] = useState(kpiDefs[0]?.id || '');
  const [selectedKpiIds, setSelectedKpiIds] = useState<string[]>(kpiDefs.slice(0, 3).map(k => k.id));
  const [title, setTitle] = useState('');
  const getPastDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };
  const [dateRange, setDateRange] = useState({ start: getPastDate(7), end: getPastDate(0) });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isKpiDropdownOpen, setIsKpiDropdownOpen] = useState(false);

  const selectedKpi = kpiDefs.find(k => k.id === selectedKpiId);
  const isMultiKpi = ['stacked', 'grouped-column', 'multi-series', 'multi-pie', 'kpiList', 'report'].includes(type);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSave = () => {
    onSave({
      kpiId: isMultiKpi ? undefined : selectedKpiId,
      kpiIds: isMultiKpi ? selectedKpiIds : undefined,
      title: title || (isMultiKpi ? `Multi-KPI ${type} Graph` : `${type.replace('-', ' ').charAt(0).toUpperCase() + type.replace('-', ' ').slice(1)}: ${selectedKpi?.name || 'Chart'}`),
      dateRange
    });
  };

  const toggleKpiId = (id: string) => {
    if (selectedKpiIds.includes(id)) {
      setSelectedKpiIds(selectedKpiIds.filter(i => i !== id));
    } else {
      setSelectedKpiIds([...selectedKpiIds, id]);
    }
  };

  // Filter left side list by search term
  const filteredKpis = kpiDefs.filter(k => 
    k.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-[rgba(56,66,82,0.4)] z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#f8fafc]">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                {(type === 'bar' || type === 'column' || type === 'rag-column') && <BarChart2 size={18} />}
                {type === 'line' && <LineChart size={18} />}
                {type === 'single' && <TrendingUp size={18} />}
                {type === 'stacked' && <BarChart size={18} />}
                {type === 'multi-series' && <Network size={18} />}
                {(type === 'pie' || type === 'multi-pie') && <PieChart size={18} />}
                {type === 'gauge' && <GaugeIcon size={18} />}
                {type === 'kpiList' && <List size={18} />}
             </div>
             <h2 className="text-lg font-bold text-gray-800 tracking-tight">Edit {type === 'kpiList' ? 'Multiple KPIs' : type.replace('-', ' ')}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex">
          {/* Main Content */}
          <div className="flex-1 p-8 space-y-8 bg-gray-50 overflow-visible">
            
            {/* Step 1: Select KPI & Date Range */}
            <div className="overflow-visible relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold leading-none">1</div>
                <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">Select a KPI & a date range</h3>
              </div>

              <div className="flex gap-4 overflow-visible relative">
                {/* KPI Selector */}
                <div className="flex-1 overflow-visible relative">
                  {isMultiKpi ? (
                    <div className="relative overflow-visible">
                      <button 
                        onClick={() => setIsKpiDropdownOpen(!isKpiDropdownOpen)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-left text-sm font-bold text-gray-700 flex items-center justify-between shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <span>{selectedKpiIds.length} KPIs selected</span>
                        <ChevronDown size={16} className="text-gray-400" />
                      </button>
                      
                      {/* Premium Dual-Pane Multi-KPI Selector Panel */}
                      {isKpiDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-[600px] bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 z-[60] flex gap-6 min-h-[380px] animate-in fade-in slide-in-from-top-2 duration-200">
                          
                          {/* Left Panel: Available list & Search */}
                          <div className="w-[280px] flex flex-col">
                            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                              {selectedKpiIds.length} KPIs selected
                            </div>
                            
                            {/* Search bar */}
                            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 mb-4 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-indigo-500 transition-all">
                              <span className="text-slate-400">🔍</span>
                              <input 
                                type="text"
                                placeholder="Type to search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent border-none text-xs font-semibold text-slate-700 placeholder-slate-400 p-0 focus:ring-0 focus:outline-none"
                              />
                            </div>
                            
                            {/* Default list folder header */}
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg mb-2">
                              <span>+ Default</span>
                              <ChevronDown size={14} />
                            </div>
                            
                            {/* Scrollable list */}
                            <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[200px]">
                              {filteredKpis.map(kpi => {
                                const isAdded = selectedKpiIds.includes(kpi.id);
                                return (
                                  <div 
                                    key={kpi.id}
                                    onClick={() => toggleKpiId(kpi.id)}
                                    className={`flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer text-xs font-semibold text-slate-700 transition-colors ${
                                      isAdded ? 'bg-indigo-50 text-indigo-700' : ''
                                    }`}
                                  >
                                    <div className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center bg-white transition-all">
                                      {isAdded && <Check size={10} className="text-indigo-600 stroke-[3px]" />}
                                    </div>
                                    <span className="text-lg leading-none">{kpi.icon || '🎯'}</span>
                                    <span className="truncate">{kpi.name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Divider line */}
                          <div className="w-px bg-slate-100 my-1"></div>
                          
                          {/* Right Panel: Selected & Actions */}
                          <div className="flex-1 flex flex-col">
                            <div className="font-bold text-slate-800 text-sm mb-1">
                              Selected KPIs
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold mb-4 leading-normal">
                              Add and sort your KPIs in the list below before adding.
                            </div>
                            
                            {/* Scrollable selected list */}
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[190px]">
                              {selectedKpiIds.map(id => {
                                const kpi = kpiDefs.find(k => k.id === id);
                                if (!kpi) return null;
                                return (
                                  <div 
                                    key={id}
                                    className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700"
                                  >
                                    <div className="flex items-center gap-2.5 truncate">
                                      <span className="text-lg leading-none">{kpi.icon || '🎯'}</span>
                                      <span className="truncate">{kpi.name}</span>
                                    </div>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleKpiId(id);
                                      }}
                                      className="text-slate-400 hover:text-red-500 font-black text-sm px-1.5"
                                    >
                                      —
                                    </button>
                                  </div>
                                );
                              })}
                              
                              {selectedKpiIds.length === 0 && (
                                <div className="h-full flex items-center justify-center text-xs font-semibold text-slate-300">
                                  No KPIs selected
                                </div>
                              )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-auto pt-4 justify-end">
                              <button 
                                onClick={() => setSelectedKpiIds([])}
                                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[11px] font-bold rounded-lg transition-all"
                              >
                                clear
                              </button>
                              <button 
                                onClick={() => setIsKpiDropdownOpen(false)}
                                className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-md shadow-indigo-100"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                          
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedKpiId}
                        onChange={(e) => setSelectedKpiId(e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-10 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                      >
                        {kpiDefs.map(kpi => (
                          <option key={kpi.id} value={kpi.id}>{kpi.name}</option>
                        ))}
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-blue-500">
                         {selectedKpi?.icon || '🎯'}
                      </div>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  )}
                </div>

                {/* Date Range Selector */}
                <div className="flex-1 relative">
                  <button 
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-left text-sm font-bold text-gray-700 flex items-center justify-between shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center gap-2"><CalendarIcon size={16} className="text-gray-400" /> {dateRange.start} - {dateRange.end}</span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>
                  
                  {isDatePickerOpen && (
                    <div className="absolute top-1/2 left-0 mt-12 z-[200]">
                       <DateRangeSelector 
                         currentRange={dateRange}
                         onApply={(newRange) => {
                           setDateRange(newRange);
                           setIsDatePickerOpen(false);
                         }}
                         onCancel={() => setIsDatePickerOpen(false)}
                       />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Area */}
            <div className="bg-white border border-gray-100 rounded-xl p-8 flex flex-col min-h-[400px] shadow-sm relative">
                <div className="flex flex-col items-start gap-1 mb-6">
                  <span className="text-[10px] font-bold text-gray-400 px-2 py-0.5 bg-gray-50 rounded uppercase tracking-widest border border-gray-100">{dateRange.start} - {dateRange.end}</span>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter a name for this view"
                    className="text-[16px] font-bold text-gray-800 border-none bg-transparent focus:ring-0 w-full p-0"
                  />
                  {!isMultiKpi && (
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-xl">{selectedKpi?.icon || '🎯'}</span>
                       <span className="text-[13px] font-bold text-gray-600">{selectedKpi?.name}</span>
                    </div>
                  )}
                </div>

                {/* Real Component Preview */}
                <div className="flex-1 flex items-center justify-center">
                   {(type === 'column' || type === 'bar') && <BarGraph kpiId={selectedKpiId} dateRange={dateRange} />}
                   {type === 'rag-column' && <RagColumnGraph kpiId={selectedKpiId} dateRange={dateRange} />}
                   {type === 'line' && <LineGraph kpiId={selectedKpiId} dateRange={dateRange} />}
                   {type === 'single' && <SingleKPI kpiId={selectedKpiId} dateRange={dateRange} />}
                   {type === 'stacked' && <StackedKpiGraph kpiIds={selectedKpiIds} dateRange={dateRange} />}
                   {type === 'grouped-column' && <GroupedKpiColumns kpiIds={selectedKpiIds} dateRange={dateRange} />}
                   {type === 'multi-series' && <MultipleKpiSeries kpiIds={selectedKpiIds} dateRange={dateRange} />}
                   {(type === 'pie' || type === 'donut') && <KPIDonutChart kpiId={selectedKpiId} dateRange={dateRange} />}
                   {type === 'multi-pie' && <MultiKpiPieChart kpiIds={selectedKpiIds} dateRange={dateRange} />}
                   {(type === 'gauge' || type === 'gauge-mid' || type === 'gauge-high') && <GaugeChart kpiId={selectedKpiId} dateRange={dateRange} />}
                   {(type === 'kpiList' || type === 'report') && <KPIList kpiIds={selectedKpiIds} dateRange={dateRange} />}
                </div>
          </div>
        </div>

          {/* Sidebar Customizations */}
          <div className="w-72 bg-white border-l border-gray-100 flex flex-col">
             <div className="p-6 border-b border-gray-50">
               <div className="flex items-center gap-3">
                 <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold leading-none">2</div>
                 <h3 className="text-sm font-bold text-gray-700 uppercase tracking-tight">Customize</h3>
               </div>
             </div>

             <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {[
                  { name: 'Data filters', open: true, icon: Settings2 },
                  { name: 'View by', open: false, icon: ChevronDown },
                  { name: 'Display options', open: false, icon: ChevronDown },
                  { name: 'Colors & size', open: false, icon: ChevronDown },
                ].map((section, i) => (
                  <div key={i} className={`rounded-lg border border-gray-100 overflow-hidden ${section.open ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-white'}`}>
                    <button className="w-full flex items-center justify-between px-4 py-3 text-left">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${section.open ? 'text-gray-800' : 'text-gray-400'}`}>{section.name}</span>
                      <section.icon size={14} className={section.open ? 'text-blue-500' : 'text-gray-300'} />
                    </button>
                    {section.open && (
                      <div className="px-4 pb-4 space-y-3">
                         <div className="space-y-1.5">
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Users</p>
                           <button className="w-full flex items-center justify-between bg-white border border-gray-200 rounded px-2 py-2 text-[13px] text-gray-600 font-medium hover:border-blue-400 transition-colors">
                              All Users <ChevronDown size={12} />
                           </button>
                         </div>
                         <div className="space-y-1.5">
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Groups</p>
                           <button className="w-full flex items-center justify-between bg-white border border-gray-200 rounded px-2 py-2 text-[13px] text-gray-600 font-medium hover:border-blue-400 transition-colors">
                              All Groups <ChevronDown size={12} />
                           </button>
                         </div>
                      </div>
                    )}
                  </div>
                ))}
             </div>

             <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 text-sm font-bold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 px-4 py-2.5 bg-[#555cf8] hover:bg-[#4044c9] text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-200 active:scale-95 transition-all"
                >
                  Save
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

