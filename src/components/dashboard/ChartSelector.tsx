'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ChartIcons = {
  column: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4V20H21" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6" y="14" width="3" height="6" fill="#38BDF8" />
      <rect x="11" y="8" width="3" height="12" fill="#38BDF8" />
      <rect x="16" y="11" width="3" height="9" fill="#38BDF8" />
    </svg>
  ),
  line: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4V20H21" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 15L12 9L18 13" stroke="#84CC16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="15" r="2" fill="#84CC16" />
      <circle cx="12" cy="9" r="2" fill="#84CC16" />
      <circle cx="18" cy="13" r="2" fill="#84CC16" />
    </svg>
  ),
  single: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 20L9 16L15 20L21 16" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="3" cy="20" r="1.5" fill="#38BDF8" />
      <circle cx="9" cy="16" r="1.5" fill="#38BDF8" />
      <circle cx="15" cy="20" r="1.5" fill="#38BDF8" />
      <circle cx="21" cy="16" r="1.5" fill="#38BDF8" />
      <path d="M6 11V4M6 4L3 7M6 4L9 7" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="13" y="10" fill="#84CC16" fontSize="12" fontWeight="bold" fontFamily="sans-serif">8</text>
    </svg>
  ),
  stacked: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4V20H21" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="16" width="3" height="4" fill="#38BDF8" />
      <rect x="5" y="11" width="3" height="5" fill="#E2E8F0" />
      <rect x="5" y="7" width="3" height="4" fill="#84CC16" />
      
      <rect x="11" y="15" width="3" height="5" fill="#38BDF8" />
      <rect x="11" y="10" width="3" height="5" fill="#E2E8F0" />
      <rect x="11" y="6" width="3" height="4" fill="#84CC16" />
      
      <rect x="17" y="17" width="3" height="3" fill="#38BDF8" />
      <rect x="17" y="12" width="3" height="5" fill="#E2E8F0" />
      <rect x="17" y="8" width="3" height="4" fill="#84CC16" />
    </svg>
  ),
  multiSeries: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9L9 14L15 8L21 16" stroke="#84CC16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="3" cy="9" r="1.5" fill="#84CC16" />
      <circle cx="9" cy="14" r="1.5" fill="#84CC16" />
      <circle cx="15" cy="8" r="1.5" fill="#84CC16" />
      <circle cx="21" cy="16" r="1.5" fill="#84CC16" />

      <path d="M3 15L9 9L15 13L21 6" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="3" cy="15" r="1.5" fill="#38BDF8" />
      <circle cx="9" cy="9" r="1.5" fill="#38BDF8" />
      <circle cx="15" cy="13" r="1.5" fill="#38BDF8" />
      <circle cx="21" cy="6" r="1.5" fill="#38BDF8" />

      <path d="M3 20L9 18L15 17L21 19" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="3" cy="20" r="1.5" fill="#CBD5E1" />
      <circle cx="9" cy="18" r="1.5" fill="#CBD5E1" />
      <circle cx="15" cy="17" r="1.5" fill="#CBD5E1" />
      <circle cx="21" cy="19" r="1.5" fill="#CBD5E1" />
    </svg>
  ),
  bar: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4V20H21" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="10" width="2" height="10" fill="#38BDF8" />
      <rect x="8" y="14" width="2" height="6" fill="#38BDF8" />
      <rect x="14" y="8" width="2" height="12" fill="#84CC16" />
      <rect x="17" y="13" width="2" height="7" fill="#84CC16" />
    </svg>
  ),
  multiPie: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4V20H21" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="15" width="2.5" height="5" fill="#EF4444" />
      <rect x="9" y="8" width="2.5" height="12" fill="#38BDF8" />
      <rect x="13" y="14" width="2.5" height="6" fill="#EF4444" />
      <rect x="17" y="9" width="2.5" height="11" fill="#38BDF8" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="#84CC16" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  ragColumn: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4V20H21" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="15" width="3" height="5" fill="#EF4444" />
      <rect x="11" y="8" width="3" height="12" fill="#FBBF24" />
      <rect x="17" y="11" width="3" height="9" fill="#84CC16" />
    </svg>
  ),
  pie: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" stroke="#CBD5E1" strokeWidth="4" fill="none" />
      <path d="M12 4A8 8 0 0 1 20 12" stroke="#38BDF8" strokeWidth="4" fill="none" />
    </svg>
  ),
  donut: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#38BDF8" />
      <path d="M12 12L22 12A10 10 0 0 0 12 2Z" fill="#84CC16" />
      <path d="M12 12L2 12A10 10 0 0 0 12 2Z" fill="#CBD5E1" stroke="#CBD5E1" strokeWidth="0.5" />
    </svg>
  ),
  gauge: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 16C4 11.5817 7.58172 8 12 8C16.4183 8 20 11.5817 20 16" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
      <path d="M4 16C4 13 5.5 10.5 8 9.5" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
      <text x="12" y="21" fill="#84CC16" fontSize="7" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">100</text>
    </svg>
  ),
  gaugeMid: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 16C4 11.5817 7.58172 8 12 8" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 8C16.4183 8 20 11.5817 20 16" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
      <path d="M10 16A2 2 0 0 1 14 16Z" fill="#CBD5E1" />
      <path d="M12 12L12 8" stroke="#84CC16" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="12,5 9,8 15,8" fill="#84CC16" />
      <text x="12" y="21" fill="#94A3B8" fontSize="7" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">100</text>
    </svg>
  ),
  gaugeHigh: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 16C4 13 5 10.5 7.5 9.2" stroke="#84CC16" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M7.5 9.2C9 8.4 10.5 8 12 8C13.5 8 15 8.4 16.5 9.2" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M16.5 9.2C19 10.5 20 13 20 16" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M10 16A2 2 0 0 1 14 16Z" fill="#CBD5E1" />
      <path d="M12 13L12 9" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      <text x="12" y="21" fill="#94A3B8" fontSize="7" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">100</text>
    </svg>
  ),
  report: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#CBD5E1" strokeWidth="1.5" />
      <text x="5" y="14" fill="#38BDF8" fontSize="12" fontWeight="bold" fontFamily="sans-serif">T</text>
      <line x1="11" y1="8" x2="19" y2="8" stroke="#84CC16" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="12" x2="19" y2="12" stroke="#84CC16" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="16" x2="17" y2="16" stroke="#84CC16" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  book: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5L12 8L21 5V19L12 22L3 19V5Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="12" y1="8" x2="12" y2="22" stroke="#CBD5E1" strokeWidth="1.5" />
      <rect x="5" y="9" width="3" height="3" fill="#84CC16" />
      <rect x="5" y="13" width="3" height="3" fill="#38BDF8" />
      <rect x="5" y="17" width="3" height="1" fill="#CBD5E1" />
      <line x1="14" y1="10" x2="19" y2="10" stroke="#CBD5E1" strokeWidth="1.5" />
      <line x1="14" y1="14" x2="18" y2="14" stroke="#CBD5E1" strokeWidth="1.5" />
    </svg>
  )
};

const CHART_TYPES = [
  { 
    id: 'column', 
    name: 'Column Chart', 
    title: 'Column chart with a single KPI', 
    description: 'Represent actual vs target performance over time for a selected KPI using vertical columns.',
    icon: ChartIcons.column 
  },
  { 
    id: 'line', 
    name: 'Line Chart', 
    title: 'Line chart with a single KPI', 
    description: 'Track changes of a selected KPI over continuous time intervals.',
    icon: ChartIcons.line 
  },
  { 
    id: 'single', 
    name: 'Trend / Single KPI', 
    title: 'Trend / Single KPI', 
    description: 'Show a single prominent KPI value, target progress, and its sparkline trend.',
    icon: ChartIcons.single 
  },
  { 
    id: 'stacked', 
    name: 'Stacked Column', 
    title: 'Stacked column chart', 
    description: 'Compare multiple KPIs or actual values stacked in vertical bars over time.',
    icon: ChartIcons.stacked 
  },
  { 
    id: 'multi-series', 
    name: 'Multi-series Line', 
    title: 'Multi-series line chart', 
    description: 'Compare the progression lines of multiple KPIs simultaneously.',
    icon: ChartIcons.multiSeries 
  },
  { 
    id: 'bar', 
    name: 'Dual-column Chart', 
    title: 'Dual-column chart', 
    description: 'Display dual actual vs target metrics side-by-side.',
    icon: ChartIcons.bar 
  },
  { 
    // Was id 'multi-pie' under this name, so picking "Three-column Chart" drew
    // a pie. The label describes what people want; the renderer now matches it.
    id: 'grouped-column',
    name: 'Three-column Chart',
    title: 'Three-column chart',
    description: 'Compare actual values across three dimensions side-by-side.',
    icon: ChartIcons.stacked
  },
  {
    id: 'multi-pie',
    name: 'Multi-KPI Pie',
    title: 'Multi-KPI pie chart',
    description: 'Show the share each KPI contributes to the total, as one pie.',
    icon: ChartIcons.multiPie
  },
  { 
    id: 'rag-column', 
    name: 'RAG Column Chart', 
    title: 'RAG Column Chart', 
    description: 'Visualize actual values colored by Red-Amber-Green status relative to targets.',
    icon: ChartIcons.ragColumn 
  },
  { 
    id: 'pie', 
    name: 'Donut Chart', 
    title: 'Donut chart with a single KPI', 
    description: 'Show proportion breakdown of a KPI across individuals or departments.',
    icon: ChartIcons.pie 
  },
  { 
    id: 'donut', 
    name: 'Pie Chart', 
    title: 'Pie chart with a single KPI', 
    description: 'Represent a Single KPI across multiple groups or users as a percentage.',
    icon: ChartIcons.donut 
  },
  { 
    id: 'gauge', 
    name: 'Progress Gauge', 
    title: 'Progress Gauge', 
    description: 'Show overall target progress on a circular speedometer scale from 0 to 100%.',
    icon: ChartIcons.gauge 
  },
  { 
    id: 'gauge-mid', 
    name: 'Pointer Gauge', 
    title: 'Pointer Gauge', 
    description: 'Track current KPI actuals on a pointer needle dial centered at target.',
    icon: ChartIcons.gaugeMid 
  },
  { 
    id: 'gauge-high', 
    name: 'RAG Gauge', 
    title: 'RAG Gauge', 
    description: 'Display KPI performance color-coded in Red, Amber, and Green gauge arcs.',
    icon: ChartIcons.gaugeHigh 
  },
  { 
    id: 'report', 
    name: 'Table Card', 
    title: 'Table Card', 
    description: 'Render actual values in a clean, structured tabular grid for quick reference.',
    icon: ChartIcons.report 
  },
  // 'book' (Report Booklet) was offered here but no renderer was ever written
  // for it, so picking it produced an empty card. Removed until it exists.
  { 
    id: 'kpiList', 
    name: 'KPI List', 
    title: 'KPI List Summary', 
    description: 'Compare all KPIs actuals vs targets side-by-side with sparkline trends.',
    icon: ChartIcons.book 
  },
];

interface ChartSelectorProps {
  onSelect: (type: string) => void;
  onOpen: () => void;
  isOpen: boolean;
}

export default function ChartSelector({ onSelect, onOpen, isOpen }: ChartSelectorProps) {
  const [hoveredChartId, setHoveredChartId] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-0 w-full mb-10 overflow-visible relative z-30">
      {/* Central Pill Button */}
      <button 
        onClick={onOpen}
        className="z-10 flex items-center gap-2.5 px-6 py-2 bg-slate-50 border border-slate-100 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all font-medium text-sm shadow-sm"
      >
        <span className="text-xl font-light">+</span> Add a chart
      </button>

      {/* Horizontal Colored Icon Bar */}
      <div className={`w-full transition-all duration-500 ease-in-out relative ${isOpen ? 'max-h-[500px] opacity-100 translate-y-0 mt-4 overflow-visible z-50' : 'max-h-0 opacity-0 -translate-y-4 overflow-hidden z-0'}`}>
        <div className="bg-white/40 backdrop-blur-sm border-t border-b border-slate-50 py-5 px-8 flex flex-wrap items-center justify-center gap-6 relative overflow-visible">
          {CHART_TYPES.map((chart, idx) => {
            const isHovered = hoveredChartId === chart.id;
            return (
              <div 
                key={chart.id} 
                className="relative overflow-visible"
                onMouseEnter={() => setHoveredChartId(chart.id)}
                onMouseLeave={() => setHoveredChartId(null)}
              >
                <button
                  onClick={() => onSelect(chart.id)}
                  className={`flex flex-col items-center justify-center p-3 transition-all min-w-[48px] h-[48px] z-50 relative ${
                    isHovered 
                      ? 'bg-[#1e293b] text-white rounded-t-2xl shadow-lg scale-105' 
                      : 'hover:bg-white rounded-xl hover:shadow-md hover:scale-105 active:scale-95'
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    <chart.icon />
                  </div>
                </button>
                
                {/* Premium Seamless Dark Slate Tooltip */}
                {isHovered && (
                  <div 
                    className={`absolute top-[47px] bg-[#1e293b] text-white p-5 shadow-2xl z-40 -mt-[1px] flex flex-col gap-1.5 w-[280px] text-left transition-all duration-200 animate-in fade-in slide-in-from-top-1 ${
                      idx > 8 
                        ? 'right-0 rounded-l-2xl rounded-b-2xl' 
                        : 'left-0 rounded-r-2xl rounded-b-2xl'
                    }`}
                  >
                    <div className="text-sm font-bold text-white tracking-tight leading-snug">
                      {chart.title}
                    </div>
                    <div className="text-slate-300 text-[11px] leading-relaxed mt-1 font-medium">
                      {chart.description}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="w-px h-6 bg-slate-200 ml-2"></div>
          
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronDown size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
