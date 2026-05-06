'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRange {
  start: string;
  end: string;
}

interface DateRangeSelectorProps {
  currentRange?: DateRange;
  onApply?: (range: DateRange) => void;
  onCancel?: () => void;
}

export default function DateRangeSelector({ currentRange, onApply, onCancel }: DateRangeSelectorProps) {
  const [rangeType, setRangeType] = useState<'relative' | 'custom'>('custom');
  const [startDate, setStartDate] = useState(currentRange?.start || '');
  const [endDate, setEndDate] = useState(currentRange?.end || '');

  const handleApply = () => {
    if (onApply && startDate && endDate) {
      onApply({ start: startDate, end: endDate });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 max-w-[600px] w-full font-sans">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-[22px] font-bold text-[#ff0000]">Date Range</h2>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-[18px] font-bold text-[#4a5568] mb-5">Last Updated</h3>

        {/* Radio Options */}
        <div className="flex gap-4 mb-5">
          <label 
            className={`flex-1 flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-[3px] ${
              rangeType === 'relative' 
                ? 'border-[#ffcc00]' 
                : 'border-transparent hover:bg-gray-50'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              rangeType === 'relative' ? 'border-[#ff0000]' : 'border-gray-300'
            }`}>
              {rangeType === 'relative' && <div className="w-2.5 h-2.5 bg-[#ff0000] rounded-full" />}
            </div>
            <input 
              type="radio" 
              name="rangeType" 
              className="hidden" 
              checked={rangeType === 'relative'} 
              onChange={() => setRangeType('relative')} 
            />
            <span className="text-[#4a5568] text-[15px] font-medium">Relative Date Range</span>
          </label>

          <label 
            className={`flex-1 flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-[3px] ${
              rangeType === 'custom' 
                ? 'border-[#ffcc00]' 
                : 'border-transparent hover:bg-gray-50'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              rangeType === 'custom' ? 'border-[#ff0000]' : 'border-gray-300'
            }`}>
              {rangeType === 'custom' && <div className="w-2.5 h-2.5 bg-[#ff0000] rounded-full" />}
            </div>
            <input 
              type="radio" 
              name="rangeType" 
              className="hidden" 
              checked={rangeType === 'custom'} 
              onChange={() => setRangeType('custom')} 
            />
            <span className="text-[#4a5568] text-[15px] font-medium">Custom Date Range</span>
          </label>
        </div>

        {/* Date Inputs */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative group cursor-pointer">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-md py-3.5 px-4 text-gray-700 placeholder-[#cbd5e0] focus:outline-none focus:border-gray-300 cursor-pointer text-[15px]"
            />
            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-500 transition-colors pointer-events-none" size={20} strokeWidth={2} />
          </div>
          <div className="flex-1 relative group cursor-pointer">
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-200 rounded-md py-3.5 px-4 text-gray-700 placeholder-[#cbd5e0] focus:outline-none focus:border-gray-300 cursor-pointer text-[15px]"
            />
            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-500 transition-colors pointer-events-none" size={20} strokeWidth={2} />
          </div>
        </div>

        {/* Advanced Options Accordion */}
        <div className="border border-gray-200 rounded-md p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group">
          <span className="text-[#4a5568] font-bold text-[16px]">Advanced Date Options</span>
          <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 bg-white group-hover:border-gray-300 transition-colors">
            <ChevronDown size={18} strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-end gap-6 bg-white rounded-b-xl">
        <button onClick={onCancel} className="text-[#718096] font-bold text-[16px] hover:text-[#4a5568] transition-colors">
          Cancel
        </button>
        <button onClick={handleApply} className="bg-[#ff0000] hover:bg-[#e60000] text-white font-bold text-[16px] px-8 py-3 rounded-md transition-colors shadow-sm">
          Done
        </button>
      </div>
    </div>
  );
}
