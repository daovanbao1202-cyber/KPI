'use client';

import { useState } from 'react';
import { BarGraph, KPIDonutChart, GaugeChart, LineGraph, SingleKPI, StackedKpiGraph, MultipleKpiSeries, RagColumnGraph, MultiKpiPieChart, KPIList } from '@/components/dashboard/Charts';
import { Target, TrendingDown, TrendingUp, Plus, LayoutDashboard, ChevronDown, List, Eye, Maximize2, Trash2, PieChart, Network, LineChart, BarChart, Target as GaugeIcon, BarChart2, Users, AlertCircle } from 'lucide-react';
import { useKPI, DashboardChart } from '@/context/KPIContext';
import ViewSelector from '@/components/dashboard/ViewSelector';
import ChartSelector from '@/components/dashboard/ChartSelector';
import ChartModal from '@/components/dashboard/ChartModal';


import { findUnderperformingUsers } from '@/lib/alerts';

export default function DashboardsPage() {
  const {
    visibleKpiDefs: kpiDefs, currentUser, viewLevel, viewFilter, users,
    dashboardCharts, addDashboardChart, removeDashboardChart, userActuals, userTargets, saveToDisk
  } = useKPI();
  
  const [isChartSelectorOpen, setIsChartSelectorOpen] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<string | null>(null);
  const [isSendingAlerts, setIsSendingAlerts] = useState(false);
  const [alertStatus, setAlertStatus] = useState<string | null>(null);

  const handleSelectChartType = (type: string) => {
    setSelectedChartType(type);
    setIsChartSelectorOpen(false);
  };

  /**
   * Warns users whose actual completion is under 80%. Performance is computed
   * from real actuals and targets, and the email is sent by the server.
   */
  const handleSendAlerts = async () => {
    setIsSendingAlerts(true);
    setAlertStatus('Đang phân tích hiệu suất...');

    const underperforming = findUnderperformingUsers(users, kpiDefs, userActuals, userTargets);

    if (underperforming.length === 0) {
      setAlertStatus('Không có ai dưới ngưỡng 80%.');
      setTimeout(() => {
        setIsSendingAlerts(false);
        setAlertStatus(null);
      }, 3000);
      return;
    }

    setAlertStatus(`Đang gửi cho ${underperforming.length} người...`);

    try {
      const res = await fetch('/api/notifications/check-kpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: underperforming.map(({ user }) => user.id),
          title: 'Cảnh báo hiệu suất KPI',
          message:
            'Hệ thống ghi nhận mức hoàn thành KPI của bạn đang dưới 80% so với chỉ tiêu. ' +
            'Vui lòng rà soát và cập nhật kết quả công việc.',
        }),
      });
      const payload = await res.json();

      setAlertStatus(
        res.ok
          ? `Đã gửi cảnh báo cho ${underperforming.length} người.`
          : payload.error || 'Gửi cảnh báo không thành công.'
      );
    } catch {
      setAlertStatus('Không kết nối được tới máy chủ.');
    }

    setTimeout(() => {
      setIsSendingAlerts(false);
      setAlertStatus(null);
    }, 3000);
  };

  const currentViewName = viewLevel === 'Company' 
    ? 'All Organization' 
    : (typeof viewFilter === 'number' ? users.find(u => u.id === viewFilter)?.firstName + ' ' + users.find(u => u.id === viewFilter)?.lastName : viewFilter);

  const handleSaveChart = (config: { kpiId?: string; kpiIds?: string[]; title: string; dateRange: { start: string; end: string } }) => {
    if (selectedChartType) {
      addDashboardChart({
        type: selectedChartType,
        ...config
      });
      setSelectedChartType(null);
      setTimeout(() => saveToDisk(), 100);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-20">
      
      <ViewSelector />

      {/* Premium Header Summary */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
           <div className="animate-in slide-in-from-left duration-700">
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm mb-2 uppercase tracking-[0.2em]">
                 <LayoutDashboard size={14} /> Global Overview
              </div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight mb-2">
                Hello, {currentUser?.firstName}! 👋
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                You are currently viewing <span className="text-brand-primary font-bold">“{currentViewName}”</span> performance.
              </p>
           </div>
           
           <div className="flex items-center gap-3 animate-in slide-in-from-right duration-700">
              {currentUser?.role === 'Admin' && (
                <button 
                  onClick={handleSendAlerts}
                  disabled={isSendingAlerts}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold shadow-lg transition-all ${isSendingAlerts ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
                >
                  <AlertCircle size={18} className={isSendingAlerts ? 'animate-pulse' : ''} /> 
                  {isSendingAlerts ? alertStatus : 'Send Warning Emails'}
                </button>
              )}
           </div>
        </div>

        {/* Dashboard Content Toggle */}
        <>
            <ChartSelector 
              onSelect={handleSelectChartType} 
              onOpen={() => setIsChartSelectorOpen(!isChartSelectorOpen)}
              isOpen={isChartSelectorOpen}
            />

            {selectedChartType && (
              <ChartModal 
                type={selectedChartType} 
                onClose={() => setSelectedChartType(null)} 
                onSave={handleSaveChart} 
              />
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
               {[
                 { label: 'Active KPIs', value: kpiDefs.length, icon: Target, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                 { label: 'Total Users', value: users.length, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
                 { label: 'Data Points', value: userActuals.length, icon: BarChart2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                 { label: 'Health Score', value: '94%', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
               ].map((stat, i) => (
                 <div key={i} className="glass-card p-4 rounded-3xl flex items-center gap-4 interactive-hover border-white/40">
                    <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner`}>
                       <stat.icon size={24} />
                    </div>
                    <div>
                       <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">{stat.label}</div>
                       <div className="text-xl font-black text-slate-800 dark:text-white">{stat.value}</div>
                    </div>
                 </div>
               ))}
            </div>

            {/* Main Chart Grid */}
            <div className="">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-min">
                
                {dashboardCharts.map((chart, index) => {
                  const kpi = kpiDefs.find(k => k.id === chart.kpiId);
                  const isFullWidth = ['bar', 'column', 'line', 'multi-series', 'stacked', 'rag-column', 'kpiList'].includes(chart.type);
                  
                  return (
                    <div 
                      key={chart.id} 
                      className={`${isFullWidth ? 'lg:col-span-2' : ''} glass-card rounded-[2.5rem] p-8 relative group interactive-hover border-white/50 animate-in fade-in slide-in-from-bottom-8 duration-500`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-brand-primary shadow-sm border border-white/40 dark:border-slate-700/50">
                              {(chart.type === 'column' || chart.type === 'bar' || chart.type === 'rag-column') && <BarChart2 size={24} />}
                              {chart.type === 'line' && <LineChart size={24} />}
                              {chart.type === 'single' && <TrendingUp size={24} />}
                              {chart.type === 'stacked' && <BarChart size={24} />}
                              {chart.type === 'multi-series' && <Network size={24} />}
                              {(chart.type === 'pie' || chart.type === 'multi-pie') && <PieChart size={24} />}
                              {chart.type === 'gauge' && <GaugeIcon size={24} />}
                              {chart.type === 'kpiList' && <List size={24} />}
                           </div>
                           <div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mb-1 uppercase tracking-[0.2em]">{chart.dateRange.start} - {chart.dateRange.end}</div>
                              <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{chart.title}</h2>
                           </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              removeDashboardChart(chart.id);
                              setTimeout(() => saveToDisk(), 100);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                            title="Delete Chart"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all">
                            <Maximize2 size={18} />
                          </button>
                        </div>
                      </div>

                      {!['stacked', 'multi-series', 'multi-pie', 'kpiList'].includes(chart.type) && kpi && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-6 border border-slate-100 dark:border-slate-700/50">
                          <span className="text-sm">{kpi.icon || '🎯'}</span>
                          <span className="font-bold text-slate-600 dark:text-slate-300 text-[11px] uppercase tracking-wider">{kpi.name}</span>
                        </div>
                      )}

                      <div className="min-h-[250px] flex items-center justify-center">
                        {(chart.type === 'column' || chart.type === 'bar') && <BarGraph kpiId={chart.kpiId} dateRange={chart.dateRange} />}
                        {chart.type === 'rag-column' && <RagColumnGraph kpiId={chart.kpiId} dateRange={chart.dateRange} />}
                        {chart.type === 'line' && <LineGraph kpiId={chart.kpiId} dateRange={chart.dateRange} />}
                        {chart.type === 'single' && <SingleKPI kpiId={chart.kpiId} dateRange={chart.dateRange} />}
                        {chart.type === 'stacked' && <StackedKpiGraph kpiIds={chart.kpiIds} dateRange={chart.dateRange} />}
                        {chart.type === 'multi-series' && <MultipleKpiSeries kpiIds={chart.kpiIds} dateRange={chart.dateRange} />}
                        {chart.type === 'pie' && <div className="w-full justify-center flex"><KPIDonutChart kpiId={chart.kpiId} dateRange={chart.dateRange} /></div>}
                        {chart.type === 'multi-pie' && <MultiKpiPieChart kpiIds={chart.kpiIds} dateRange={chart.dateRange} />}
                        {chart.type === 'gauge' && <div className="w-full mt-4"><GaugeChart kpiId={chart.kpiId} dateRange={chart.dateRange} /></div>}
                        {chart.type === 'kpiList' && <KPIList kpiIds={chart.kpiIds} dateRange={chart.dateRange} />}
                      </div>

                      <div className="absolute bottom-6 left-8 opacity-40 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 cursor-help group/sync">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover/sync:animate-ping"></div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover/sync:text-brand-primary">Real-time Sync</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {dashboardCharts.length === 0 && (
                  <div className="lg:col-span-3 py-32 glass-card rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-6 text-slate-300 dark:text-slate-700 animate-pulse">
                    <Plus size={64} strokeWidth={1} />
                    <div className="text-center group cursor-pointer" onClick={() => setIsChartSelectorOpen(true)}>
                      <p className="text-2xl font-black text-slate-400 dark:text-slate-600 mb-2">Build Your Intelligence</p>
                      <p className="text-sm font-medium hover:text-brand-primary transition-colors hover:underline underline-offset-4">Click “Add a chart” to start visualizing</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </>
      </div>
    </div>
  );
}

