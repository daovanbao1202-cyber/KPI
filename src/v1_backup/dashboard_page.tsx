'use client';

import { useState } from 'react';
import { BarGraph, KPIDonutChart, GaugeChart, LineGraph, SingleKPI, StackedKpiGraph, MultipleKpiSeries, RagColumnGraph, MultiKpiPieChart } from '@/components/dashboard/Charts';
import { Target, TrendingDown, TrendingUp, Plus, LayoutDashboard, ChevronDown, List, Eye, Maximize2, Trash2, PieChart, Network, LineChart, BarChart, Target as GaugeIcon, BarChart2 } from 'lucide-react';
import { useKPI, DashboardChart } from '@/context/KPIContext';
import ViewSelector from '@/components/dashboard/ViewSelector';
import ChartSelector from '@/components/dashboard/ChartSelector';
import ChartModal from '@/components/dashboard/ChartModal';

export default function DashboardsPage() {
  const { 
    kpiDefs, users, viewLevel, viewFilter, 
    dashboardCharts, addDashboardChart, removeDashboardChart 
  } = useKPI();
  
  const [isChartSelectorOpen, setIsChartSelectorOpen] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<string | null>(null);

  const handleSelectChartType = (type: string) => {
    setSelectedChartType(type);
    setIsChartSelectorOpen(false);
  };

  const handleSaveChart = (config: { kpiId?: string; kpiIds?: string[]; title: string; dateRange: { start: string; end: string } }) => {
    if (selectedChartType) {
      addDashboardChart({
        type: selectedChartType,
        ...config
      });
      setSelectedChartType(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f5f8] pb-10">
      
      <ViewSelector />

      {/* Action Bar */}
      <div className="bg-white px-6 py-2 border-b border-gray-100 flex items-center justify-between text-sm shadow-sm z-20 sticky top-14">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
            Dashboard <ChevronDown size={14} />
          </button>
          <button className="text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-200 p-1 rounded transition-colors">
            <Plus size={16} />
          </button>
        </div>

        <button 
          onClick={() => setIsChartSelectorOpen(!isChartSelectorOpen)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full border transition-all font-bold shadow-sm ${isChartSelectorOpen ? 'bg-[#555cf8] text-white border-[#555cf8]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
        >
          <Plus size={16} /> Add a chart
        </button>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-gray-600 border border-transparent px-3 py-1.5 rounded-md hover:bg-gray-50 font-medium">
            <LayoutDashboard size={14} /> Learn <ChevronDown size={14} />
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>
          <div className="flex gap-1 text-gray-400">
            <div className="p-1 rounded bg-gray-100 text-[#555cf8] cursor-pointer"><LayoutDashboard size={18} /></div>
            <div className="p-1 hover:text-gray-600 cursor-pointer hover:bg-gray-50"><List size={18} /></div>
          </div>
        </div>
      </div>

      {isChartSelectorOpen && (
        <ChartSelector 
          onSelect={handleSelectChartType} 
          onClose={() => setIsChartSelectorOpen(false)} 
        />
      )}

      {selectedChartType && (
        <ChartModal 
          type={selectedChartType} 
          onClose={() => setSelectedChartType(null)} 
          onSave={handleSaveChart} 
        />
      )}

      {/* Main Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
          
          {dashboardCharts.map((chart) => {
            const kpi = kpiDefs.find(k => k.id === chart.kpiId);
            const isFullWidth = ['bar', 'column', 'line', 'multi-series', 'stacked', 'rag-column'].includes(chart.type);
            
            return (
              <div 
                key={chart.id} 
                className={`${isFullWidth ? 'lg:col-span-2' : ''} bg-white rounded-xl shadow-sm border border-gray-50 p-6 relative group hover:shadow-md transition-shadow`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#555cf8]">
                        {(chart.type === 'column' || chart.type === 'bar' || chart.type === 'rag-column') && <BarChart2 size={18} />}
                        {chart.type === 'line' && <LineChart size={18} />}
                        {chart.type === 'single' && <TrendingUp size={18} />}
                        {chart.type === 'stacked' && <BarChart size={18} />}
                        {chart.type === 'multi-series' && <Network size={18} />}
                        {(chart.type === 'pie' || chart.type === 'multi-pie') && <PieChart size={18} />}
                        {chart.type === 'gauge' && <GaugeIcon size={18} />}
                     </div>
                     <div>
                        <div className="text-[10px] text-gray-400 font-bold mb-0.5 uppercase tracking-widest">{chart.dateRange.start} - {chart.dateRange.end}</div>
                        <h2 className="text-[15px] font-bold text-gray-800">{chart.title}</h2>
                     </div>
                  </div>
                  <div className="flex gap-1 text-gray-300">
                    <button 
                      onClick={() => removeDashboardChart(chart.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                    <Maximize2 size={16} className="cursor-pointer hover:text-gray-600 p-1" />
                    <ChevronDown size={16} className="cursor-pointer hover:text-gray-600 p-1" />
                  </div>
                </div>

                {!['stacked', 'multi-series', 'multi-pie'].includes(chart.type) && kpi && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">{kpi.icon || '🎯'}</span>
                    <span className="font-bold text-gray-700 text-xs">{kpi.name}</span>
                  </div>
                )}

                <div className="min-h-[220px] flex items-center justify-center">
                  {(chart.type === 'column' || chart.type === 'bar') && <BarGraph kpiId={chart.kpiId} />}
                  {chart.type === 'rag-column' && <RagColumnGraph kpiId={chart.kpiId} />}
                  {chart.type === 'line' && <LineGraph kpiId={chart.kpiId} />}
                  {chart.type === 'single' && <SingleKPI kpiId={chart.kpiId} />}
                  {chart.type === 'stacked' && <StackedKpiGraph kpiIds={chart.kpiIds} />}
                  {chart.type === 'multi-series' && <MultipleKpiSeries kpiIds={chart.kpiIds} />}
                  {chart.type === 'pie' && <div className="w-full justify-center flex"><KPIDonutChart kpiId={chart.kpiId} /></div>}
                  {chart.type === 'multi-pie' && <MultiKpiPieChart kpiIds={chart.kpiIds} />}
                  {chart.type === 'gauge' && <div className="w-full mt-4"><GaugeChart kpiId={chart.kpiId} /></div>}
                </div>

                <div className="absolute bottom-4 left-4 text-gray-300 hover:text-[#555cf8] cursor-pointer transition-colors">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Connect Data</span>
                  </div>
                </div>
              </div>
            );
          })}

          {dashboardCharts.length === 0 && (
            <div className="lg:col-span-3 py-20 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-4 text-gray-400">
              <Plus size={48} />
              <div className="text-center">
                <p className="text-lg font-bold">No charts added yet</p>
                <p className="text-sm">Click "Add a chart" to start building your dashboard</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
