'use client';

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ChartIcons = {
  column: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="14" width="4" height="7" rx="1" fill="#38BDF8" />
      <rect x="10" y="8" width="4" height="13" rx="1" fill="#38BDF8" />
      <rect x="17" y="12" width="4" height="9" rx="1" fill="#38BDF8" />
      <path d="M2 22H22" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  line: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 18L8 13L13 16L21 6" stroke="#84CC16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="3" cy="18" r="2" fill="#84CC16" />
      <circle cx="8" cy="13" r="2" fill="#84CC16" />
      <circle cx="13" cy="16" r="2" fill="#84CC16" />
      <circle cx="21" cy="6" r="2" fill="#84CC16" />
      <path d="M2 22H22" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  single: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 20L9 14L13 17L21 9" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 9H21V13" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6L14 3L16 6" fill="#84CC16" />
      <text x="17" y="6" fill="#84CC16" fontSize="10" fontWeight="900" fontFamily="sans-serif">8</text>
    </svg>
  ),
  stacked: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="16" width="4" height="5" fill="#38BDF8" />
      <rect x="4" y="12" width="4" height="4" fill="#84CC16" />
      <rect x="11" y="14" width="4" height="7" fill="#38BDF8" />
      <rect x="11" y="8" width="4" height="6" fill="#A855F7" />
      <rect x="18" y="15" width="4" height="6" fill="#38BDF8" />
      <rect x="18" y="11" width="4" height="4" fill="#FACC15" />
    </svg>
  ),
  multiSeries: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 15L9 9L15 13L21 7" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 19L9 13L15 17L21 11" stroke="#84CC16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  ),
  bar: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="14" height="4" rx="1" fill="#38BDF8" />
      <rect x="3" y="11" width="18" height="4" rx="1" fill="#38BDF8" />
      <rect x="3" y="18" width="10" height="4" rx="1" fill="#38BDF8" />
    </svg>
  ),
  ragColumn: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="12" width="4" height="9" rx="1" fill="#EF4444" />
      <rect x="11" y="6" width="4" height="15" rx="1" fill="#F59E0B" />
      <rect x="18" y="10" width="4" height="11" rx="1" fill="#84CC16" />
    </svg>
  ),
  pie: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12H12V2Z" fill="#38BDF8" />
      <path d="M13 2.05V11H21.95C21.45 6.05 17.95 2.55 13 2.05Z" fill="#CBD5E1" />
    </svg>
  ),
  multiPie: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#E2E8F0" strokeWidth="4" />
      <path d="M12 2C17.5228 2 22 6.47715 22 12" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
      <path d="M12 22C6.47715 22 2 17.5228 2 12" stroke="#84CC16" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  gauge: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 17C2 11.4772 6.47715 7 12 7C17.5228 7 22 11.4772 22 17" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
      <path d="M2 17C2 14.2386 3.11929 11.7386 4.92893 9.92893" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
      <text x="12" y="21" fill="#CBD5E1" fontSize="6" textAnchor="middle" fontWeight="bold">100</text>
    </svg>
  ),
  gaugeMid: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 17C2 11.4772 6.47715 7 12 7C17.5228 7 22 11.4772 22 17" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
      <path d="M2 17C2 11.4772 6.47715 7 12 7" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
      <text x="12" y="21" fill="#CBD5E1" fontSize="6" textAnchor="middle" fontWeight="bold">100</text>
      <path d="M12 11L12 15" stroke="#84CC16" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  gaugeHigh: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 17C2 11.4772 6.47715 7 12 7C17.5228 7 22 11.4772 22 17" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
      <path d="M2 17C2 11.4772 6.47715 7 12 7C17.5228 7 22 11.4772 22 17" stroke="url(#gauge-grad)" strokeWidth="4" strokeLinecap="round" />
      <defs>
        <linearGradient id="gauge-grad" x1="2" y1="17" x2="22" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#84CC16" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#EF4444" />
        </linearGradient>
      </defs>
      <text x="12" y="21" fill="#CBD5E1" fontSize="6" textAnchor="middle" fontWeight="bold">100</text>
    </svg>
  ),
  report: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#CBD5E1" strokeWidth="2" />
      <path d="M7 8H17" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 12H13" stroke="#84CC16" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 16H17" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  book: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20" stroke="#CBD5E1" strokeWidth="2" />
      <path d="M6.5 2H20V22H6.5C5.11929 22 4 20.8807 4 19.5V4.5C4 3.11929 5.11929 2 6.5 2Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
      <path d="M9 7H15" stroke="#38BDF8" strokeWidth="2" />
      <path d="M9 11H13" stroke="#84CC16" strokeWidth="2" />
    </svg>
  )
};

const CHART_TYPES = [
  { id: 'column', name: 'Column', icon: ChartIcons.column },
  { id: 'line', name: 'Line', icon: ChartIcons.line },
  { id: 'single', name: 'Single KPI', icon: ChartIcons.single },
  { id: 'stacked', name: 'Stacked', icon: ChartIcons.stacked },
  { id: 'multi-series', name: 'Multi-Series', icon: ChartIcons.multiSeries },
  { id: 'bar', name: 'Bar', icon: ChartIcons.bar },
  { id: 'rag-column', name: 'RAG Column', icon: ChartIcons.ragColumn },
  { id: 'pie', name: 'Pie', icon: ChartIcons.pie },
  { id: 'multi-pie', name: 'Multi-Pie', icon: ChartIcons.multiPie },
  { id: 'gauge', name: 'Gauge Low', icon: ChartIcons.gauge },
  { id: 'gauge-mid', name: 'Gauge Mid', icon: ChartIcons.gaugeMid },
  { id: 'gauge-high', name: 'Gauge High', icon: ChartIcons.gaugeHigh },
  { id: 'report', name: 'Report', icon: ChartIcons.report },
  { id: 'book', name: 'Library', icon: ChartIcons.book },
];

interface ChartSelectorProps {
  onSelect: (type: string) => void;
  onOpen: () => void;
  isOpen: boolean;
}

export default function ChartSelector({ onSelect, onOpen, isOpen }: ChartSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-0 w-full mb-10 overflow-hidden">
      {/* Central Pill Button */}
      <button 
        onClick={onOpen}
        className="z-10 flex items-center gap-2.5 px-6 py-2 bg-slate-50 border border-slate-100 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all font-medium text-sm shadow-sm"
      >
        <span className="text-xl font-light">+</span> Add a chart
      </button>

      {/* Horizontal Colored Icon Bar */}
      <div className={`w-full transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[120px] opacity-100 translate-y-0 mt-4' : 'max-h-0 opacity-0 -translate-y-4 overflow-hidden'}`}>
        <div className="bg-white/40 backdrop-blur-sm border-t border-b border-slate-50 py-5 px-8 flex items-center justify-center gap-10 overflow-x-auto no-scrollbar">
          {CHART_TYPES.map((chart) => (
            <button
              key={chart.id}
              onClick={() => onSelect(chart.id)}
              className="flex flex-col items-center justify-center p-2 hover:bg-white rounded-xl transition-all hover:shadow-md hover:scale-110 active:scale-95 group min-w-[32px]"
              title={chart.name}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <chart.icon />
              </div>
            </button>
          ))}
          
          <div className="w-px h-6 bg-slate-200 ml-2"></div>
          
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronDown size={18} />
          </button>
        </div>
        
        {/* Pointer Up */}
        <div className="flex justify-center -mt-1">
           <div className="w-32 h-6 bg-white/40 backdrop-blur-sm rounded-b-2xl flex items-center justify-center border-b border-l border-r border-slate-50">
              <ChevronUp size={14} className="text-slate-400" />
           </div>
        </div>
      </div>
    </div>
  );
}
