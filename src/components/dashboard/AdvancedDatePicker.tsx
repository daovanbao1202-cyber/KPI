'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DateRange {
  start: string;
  end: string;
}

interface AdvancedDatePickerProps {
  currentRange: DateRange;
  onApply: (range: DateRange) => void;
}

export default function AdvancedDatePicker({ currentRange, onApply }: AdvancedDatePickerProps) {
  const [range, setRange] = useState<DateRange>(currentRange);
  const [isRolling, setIsRolling] = useState(true);

  // Quick select logic
  const handleQuickSelect = (type: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'Today') {
      // both today
    } else if (type === 'Yesterday') {
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
    } else if (type === 'Week to date') {
      const day = today.getDay();
      start.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    } else if (type === 'Month to date') {
      start.setDate(1);
    }

    setRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

  const days = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
  const month1 = Array.from({ length: 30 }, (_, i) => i + 1);
  const month2 = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="bg-[#384252] text-white rounded-xl shadow-2xl p-6 w-[700px] border border-gray-600 animate-in slide-in-from-top-4 duration-300">
      <div className="flex gap-8">
        {/* Left Column: Quick Select */}
        <div className="w-48 space-y-2">
          {['Today', 'Yesterday', 'Week to date', 'Month to date'].map((label) => (
            <button
              key={label}
              onClick={() => handleQuickSelect(label)}
              className="w-full py-2.5 px-4 bg-[#4b5563]/50 hover:bg-[#4b5563] text-sm font-bold rounded text-center transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Custom period select</h3>
            <div className="flex gap-2">
               <div className="flex items-center bg-[#4b5563]/50 rounded overflow-hidden">
                 <span className="px-3 py-1.5 text-xs text-gray-400 font-bold border-r border-gray-600">Present</span>
                 <input type="number" defaultValue={1} className="w-10 bg-transparent text-center text-sm border-none focus:ring-0" />
                 <select className="bg-transparent text-xs font-bold px-2 py-1.5 border-none focus:ring-0">
                   <option>- Select -</option>
                 </select>
               </div>
               <div className="flex items-center bg-[#4b5563]/50 rounded overflow-hidden">
                 <span className="px-3 py-1.5 text-xs text-gray-400 font-bold border-r border-gray-600">Previous</span>
                 <input type="number" defaultValue={1} className="w-10 bg-transparent text-center text-sm border-none focus:ring-0" />
                 <select className="bg-transparent text-xs font-bold px-2 py-1.5 border-none focus:ring-0">
                   <option>- Select -</option>
                 </select>
               </div>
            </div>
          </div>

          {/* Calendars */}
          <div className="grid grid-cols-2 gap-8">
            {/* April */}
            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                 <ChevronLeft size={18} className="text-gray-400 cursor-pointer hover:text-white" />
                 <span className="text-sm font-bold uppercase tracking-widest">April 2026</span>
                 <ChevronRight size={18} className="text-gray-400 cursor-pointer hover:text-white" />
               </div>
               <div className="grid grid-cols-7 text-center gap-y-2">
                 {days.map(d => <span key={d} className="text-[10px] font-bold text-gray-500 mb-2">{d}</span>)}
                 {[30, 31].map(d => <span key={`p-${d}`} className="text-xs text-gray-700 font-medium">{d}</span>)}
                 {month1.map(d => (
                   <div key={d} className={`text-xs font-medium py-1.5 cursor-pointer hover:bg-blue-500 rounded transition-colors ${d >= 2 && d <= 8 ? 'bg-[#555cf8] text-white' : 'text-gray-300'}`}>
                     {d}
                   </div>
                 ))}
               </div>
            </div>

            {/* May */}
            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                 <ChevronLeft size={18} className="text-gray-400 cursor-pointer hover:text-white" />
                 <span className="text-sm font-bold uppercase tracking-widest">May 2026</span>
                 <ChevronRight size={18} className="text-gray-400 cursor-pointer hover:text-white" />
               </div>
               <div className="grid grid-cols-7 text-center gap-y-2">
                 {days.map(d => <span key={d} className="text-[10px] font-bold text-gray-500 mb-2">{d}</span>)}
                 {[27, 28, 29, 30].map(d => <span key={`p-${d}`} className="text-xs text-gray-700 font-medium">{d}</span>)}
                 {month2.map(d => (
                   <div key={d} className="text-xs font-medium py-1.5 text-gray-300 cursor-pointer hover:bg-blue-500 rounded transition-colors">
                     {d}
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-600 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div 
                 onClick={() => setIsRolling(!isRolling)}
                 className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${isRolling ? 'bg-[#555cf8]' : 'bg-gray-600'}`}
               >
                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isRolling ? 'right-1' : 'left-1'}`} />
               </div>
               <span className="text-sm font-bold text-gray-400">Rolling Period</span>
            </div>
            <button
              onClick={() => onApply(range)}
              className="px-6 py-2.5 bg-[#555cf8] hover:bg-[#4044c9] text-white text-sm font-bold rounded shadow-lg transition-all"
            >
              Apply date range
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
