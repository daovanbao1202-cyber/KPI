'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useKPI } from '@/context/KPIContext';
import { 
  TrendingUp, Download, Plus, Target,
  Filter, Calendar, ChevronDown, 
  DollarSign, Users, Settings, GraduationCap, Building2,
  Briefcase, Activity, Rocket, Zap, Trash2, X, FileSpreadsheet,
  Save, RotateCcw, CheckCircle2, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal';

const iconList = [
  { id: 'target', icon: <Target size={14} />, color: 'text-rose-500', bg: 'bg-rose-50', label: 'Target' },
  { id: 'money', icon: <DollarSign size={14} />, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Finance' },
  { id: 'users', icon: <Users size={14} />, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Customer' },
  { id: 'settings', icon: <Settings size={14} />, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Process' },
  { id: 'grow', icon: <TrendingUp size={14} />, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Growth' },
  { id: 'rocket', icon: <Rocket size={14} />, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Project' },
  { id: 'zap', icon: <Zap size={14} />, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Action' },
  { id: 'briefcase', icon: <Briefcase size={14} />, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Work' }
];

const perspectiveStyles: Record<string, { icon: any, bgColor: string, rowColor: string, textColor: string }> = {
  "재무 Finance/Tài chính": { icon: <DollarSign size={16} className="text-emerald-600" />, bgColor: "bg-emerald-100", rowColor: "bg-emerald-50/40", textColor: "text-emerald-800" },
  "고객 Customer/Khách hàng": { icon: <Users size={16} className="text-blue-600" />, bgColor: "bg-blue-100", rowColor: "bg-blue-50/40", textColor: "text-blue-800" },
  "프로세스 Process/Quy trình": { icon: <Settings size={16} className="text-amber-600" />, bgColor: "bg-amber-100", rowColor: "bg-amber-50/40", textColor: "text-amber-800" },
  "학습과성장 Learn & Development/Học hỏi và Phát triển": { icon: <GraduationCap size={16} className="text-indigo-600" />, bgColor: "bg-indigo-100", rowColor: "bg-indigo-50/40", textColor: "text-indigo-800" },
  "전사 Company-Wide/Quy định công ty": { icon: <Building2 size={16} className="text-rose-600" />, bgColor: "bg-rose-100", rowColor: "bg-rose-50/40", textColor: "text-rose-800" },
  "CHƯA PHÂN LOẠI": { icon: <Activity size={16} className="text-gray-600" />, bgColor: "bg-gray-100", rowColor: "bg-gray-50/50", textColor: "text-gray-800" }
};

function HeaderInput({ value, onRename }: { value: string, onRename: (n: string) => void }) {
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <input 
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        if (localValue.trim() && localValue !== value) {
          onRename(localValue.toUpperCase().trim());
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="flex-1 bg-transparent border-none text-center font-black tracking-wider text-white focus:ring-1 focus:ring-white/30 rounded px-1 min-w-0"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export default function MBOSheet({ type = 'MBO' }: { type?: 'MBO' | 'ACTION_PLAN' }) {
  const { 
    kpiDefs, users, userActuals, userTargets, 
    addKPIDefinition, updateKPIDefinition, deleteKPIDefinition,
    saveToDisk, loadFromDisk,
    customColumns, setCustomColumns,
    hiddenCols, setHiddenCols,
    duplicateKpis, renameCustomColumn,
    viewLevel, viewFilter, setViewFilter,
    isLoadingCloud
  } = useKPI();

  const [activeIconPicker, setActiveIconPicker] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedColKey, setSelectedColKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [kpiToDelete, setKpiToDelete] = useState<string | null>(null);

  // Column Resizing State
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    stt: 50,
    csf: 320,
    kpi: 250,
    weight: 80,
    target: 100,
    actual: 100,
    percent: 100,
    grade: 80,
    note: 250
  });

  const resizingCol = useRef<{ key: string, startX: number, startWidth: number } | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle Global Clicks to clear selection
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isHeader = target.closest('th');
      if (!isHeader) {
        setSelectedColKey(null);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  const perspectiveOptions = Object.keys(perspectiveStyles).filter(opt => opt !== "CHƯA PHÂN LOẠI");

  const handleMouseDown = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    resizingCol.current = {
      key,
      startX: e.pageX,
      startWidth: colWidths[key] || 150
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    // Toggling a class instead of mutating body.style keeps the React
    // Compiler's immutability check happy.
    document.body.classList.add('cursor-col-resize');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingCol.current) return;
    const { key, startX, startWidth } = resizingCol.current;
    const delta = e.pageX - startX;
    setColWidths(prev => ({
      ...prev,
      [key]: Math.max(50, startWidth + delta)
    }));
  };

  const handleMouseUp = () => {
    resizingCol.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.classList.remove('cursor-col-resize');
  };

  const handleAddColumn = () => {
    const colName = prompt('Nhập tên cột mới:');
    if (colName) {
      const key = `custom-${customColumns.length}`;
      setCustomColumns([...customColumns, colName.toUpperCase()]);
      setColWidths(prev => ({ ...prev, [key]: 150 }));
    }
  };

  const handleDeleteColumn = (key: string, index?: number) => {
    if (confirm('Xóa/Ẩn cột này?')) {
      if (key.startsWith('custom-') && index !== undefined) {
        const newCols = [...customColumns];
        newCols.splice(index, 1);
        setCustomColumns(newCols);
      } else {
        setHiddenCols([...hiddenCols, key]);
      }
      setSelectedColKey(null);
    }
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    await saveToDisk();
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleBack = async () => {
    if (confirm('Bạn có muốn hủy bỏ các thay đổi chưa lưu và quay lại dữ liệu cũ?')) {
      await loadFromDisk();
      window.location.reload();
    }
  };

  const getAggregatedData = () => {
    // Filter by sheet type
    const filteredKpis = kpiDefs.filter(k => {
      // For backwards compatibility, if sheetType is missing, assume MBO
      if (!k.sheetType) return type === 'MBO';
      return k.sheetType === type;
    });

    // Determine users to include based on global filter
    const filteredUsers = users.filter(u => {
      if (viewLevel === 'Company') return true;
      if (viewLevel === 'Department') return u.department === viewFilter;
      if (viewLevel === 'Individual') return u.id === Number(viewFilter);
      return true;
    });

    const userIds = filteredUsers.map(u => u.id);

    return filteredKpis.map(kpi => {
      const actual = userActuals.filter(a => a.kpiId === kpi.id && userIds.includes(a.userId)).reduce((sum, curr) => sum + curr.actualValue, 0);
      const plan = userTargets.filter(t => t.kpiId === kpi.id && userIds.includes(t.userId)).reduce((sum, curr) => sum + curr.targetValue, 0) || Number(kpi.hasTarget) || 100;
      
      // Map category to a valid perspective or "CHƯA PHÂN LOẠI"
      let displayCategory = kpi.category || "CHƯA PHÂN LOẠI";
      if (!perspectiveStyles[displayCategory]) {
        displayCategory = "CHƯA PHÂN LOẠI";
      }

      return { 
        id: kpi.id, 
        category: displayCategory, 
        csf: kpi.description || 'Nhiệm vụ chiến lược...', 
        kpiName: kpi.name, 
        weight: 10, 
        plan, 
        actualVal: actual, 
        completion: isNaN(actual / plan) ? 0 : parseFloat(((actual / plan) * 100).toFixed(1)), 
        unit: kpi.unit, 
        iconId: kpi.icon || 'target',
        customValues: kpi.customValues || {} 
      };
    });
  };

  const mboData = getAggregatedData();
  const groupedData = [...perspectiveOptions, "CHƯA PHÂN LOẠI"].map(perspective => {
    const items = mboData.filter(item => item.category === perspective);
    const totalActual = items.reduce((sum, i) => sum + i.actualVal, 0);
    const totalPlan = items.reduce((sum, i) => sum + i.plan, 0);
    const avgCompletion = items.length > 0 ? (items.reduce((sum, i) => sum + i.completion, 0) / items.length).toFixed(1) : 0;
    return { name: perspective, items, totalActual, totalPlan, avgCompletion };
  }).filter(group => group.items.length > 0);

  const overallCompletion = mboData.length > 0 ? (mboData.reduce((sum, item) => sum + item.completion, 0) / mboData.length).toFixed(1) : 0;

  const handleExportExcel = () => {
    const exportData: any[] = [];
    groupedData.forEach(group => {
      exportData.push({ 
        "Hạng mục / CSF": group.name.toUpperCase(), 
        "KPI / Chỉ tiêu": "", 
        "Đơn vị": "", 
        "Mục tiêu": group.totalPlan, 
        "Thực tế": group.totalActual, 
        "% Hoàn thành": group.avgCompletion + "%" 
      });
      group.items.forEach(i => {
        exportData.push({ 
          "Hạng mục / CSF": i.csf, 
          "KPI / Chỉ tiêu": i.kpiName, 
          "Đơn vị": i.unit, 
          "Mục tiêu": i.plan, 
          "Thực tế": i.actualVal, 
          "% Hoàn thành": i.completion + "%" 
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type);
    
    // Use highly compatible array type + Blob to avoid file corruption on modern browsers/WPS
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_Report_2026_${new Date().getTime()}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const allStandardCols = [
    { key: 'stt', label: 'STT' },
    { key: 'csf', label: type === 'ACTION_PLAN' ? 'HẠNG MỤC / HÀNH ĐỘNG (ACTION)' : 'HẠNG MỤC / CHIẾN LƯỢC (CSF)' },
    { key: 'kpi', label: type === 'ACTION_PLAN' ? 'CHỈ TIÊU / KẾ HOẠCH' : 'CHỈ SỐ KPI / ĐƠN VỊ' },
    { key: 'weight', label: 'TRỌNG SỐ' },
    { key: 'target', label: 'MỤC TIÊU' },
    { key: 'actual', label: 'THỰC TẾ' },
    { key: 'percent', label: '% HOÀN THÀNH' },
    { key: 'grade', label: 'XẾP LOẠI' }
  ].filter(c => !hiddenCols.includes(c.key));

  const sheetTitle = type === 'ACTION_PLAN' 
    ? '2026년 목표달성 Action Plan/Tỷ lệ đạt mục tiêu năm'
    : 'BẢNG QUẢN TRỊ MỤC TIÊU CHIẾN LƯỢC (MBO) - 2026';

  const headerBg = type === 'ACTION_PLAN' ? 'bg-[#1e293b]' : 'bg-[#003366]';
  const headerBorder = type === 'ACTION_PLAN' ? 'border-slate-800' : 'border-[#002244]';

  return (
    <div ref={sheetRef} className="flex flex-col gap-0 pb-20 font-sans shadow-2xl border border-gray-200 rounded-lg overflow-hidden select-none" onClick={() => { setActiveIconPicker(null); setSelectedRowId(null); }}>
      
      <div className={`${headerBg} py-3 px-6 text-center border-b ${headerBorder} flex items-center justify-between`}>
        <div className="w-40 flex items-center gap-2">
           <button onClick={(e) => { e.stopPropagation(); handleBack(); }} className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded transition-all border border-white/20">
              <RotateCcw size={14} /> QUAY LẠI
           </button>
        </div>
        <h1 className="text-white text-lg font-black uppercase tracking-[0.3em] flex-1 text-center">{sheetTitle}</h1>
        <div className="w-40 flex items-center justify-end gap-2">
           <button 
             onClick={(e) => { e.stopPropagation(); handleManualSave(); }} 
             className={`flex items-center gap-2 px-4 py-1.5 ${saveSuccess ? 'bg-emerald-500' : 'bg-emerald-600 hover:bg-emerald-700'} text-white text-[10px] font-bold rounded transition-all shadow-lg transform active:scale-95`}
             disabled={isSaving}
           >
              {isSaving ? <Activity size={14} className="animate-spin" /> : (saveSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />)}
              {isSaving ? 'ĐANG LƯU...' : (saveSuccess ? 'ĐÃ LƯU!' : 'LƯU THAY ĐỔI')}
           </button>
        </div>
      </div>

      <div className="bg-white p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded text-[11px] font-bold text-gray-600">
              <Filter size={12} />
              <span>CHẾ ĐỘ XEM: {viewLevel.toUpperCase()}</span>
           </div>
           {viewLevel === 'Department' && (
             <div className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded border border-blue-100">
               BỘ PHẬN: {String(viewFilter).toUpperCase()}
             </div>
           )}
           {viewLevel === 'Individual' && (
             <div className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded border border-indigo-100">
               NHÂN VIÊN: {users.find(u => u.id === Number(viewFilter))?.firstName || ''} {users.find(u => u.id === Number(viewFilter))?.lastName || ''}
             </div>
           )}
        </div>
        <div className="flex items-center gap-2">
           <button onClick={(e) => { e.stopPropagation(); addKPIDefinition({ name: '', unit: '', hasTarget: '100', category: '', sheetType: type }); }} className={`px-4 py-1.5 ${type === 'ACTION_PLAN' ? 'bg-slate-700 hover:bg-slate-800' : 'bg-indigo-600 hover:bg-indigo-700'} text-white text-[11px] font-bold rounded transition-all flex items-center gap-2 shadow-sm`}>
              <Plus size={14} /> THÊM DÒNG
           </button>
           <button onClick={(e) => { e.stopPropagation(); handleAddColumn(); }} className="px-4 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm">
              <Plus size={14} /> THÊM CỘT
           </button>
           {type === 'ACTION_PLAN' && mboData.length === 0 && (
             <button 
               onClick={(e) => { e.stopPropagation(); duplicateKpis('MBO', 'ACTION_PLAN'); }} 
               className="px-4 py-1.5 bg-amber-500 text-white text-[11px] font-bold rounded hover:bg-amber-600 transition-all flex items-center gap-2 shadow-sm animate-bounce"
             >
                <Rocket size={14} /> SAO CHÉP TỪ MBO
             </button>
           )}
           <button onClick={(e) => { e.stopPropagation(); handleExportExcel(); }} className="px-4 py-1.5 bg-slate-600 text-white text-[11px] font-bold rounded hover:bg-slate-700 transition-all flex items-center gap-2 shadow-md">
              <FileSpreadsheet size={14} /> XUẤT EXCEL
           </button>
           {hiddenCols.length > 0 && (
             <button onClick={(e) => { e.stopPropagation(); setHiddenCols([]); }} className="px-4 py-1.5 bg-gray-500 text-white text-[11px] font-bold rounded hover:bg-gray-600 transition-all shadow-sm">
                HIỆN LẠI CỘT
             </button>
           )}
        </div>
      </div>

      <div className="overflow-x-auto bg-white scrollbar-thin scrollbar-thumb-gray-300 relative min-h-[400px]">
        {isLoadingCloud && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center flex-col gap-3">
             <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-indigo-600 font-bold text-sm animate-pulse uppercase tracking-widest">Đang tải dữ liệu từ Đám mây...</p>
          </div>
        )}
        <table className="table-fixed text-[12px] border-collapse" style={{ width: 'max-content' }}>
          <thead>
            <tr className={`${type === 'ACTION_PLAN' ? 'bg-slate-700' : 'bg-[#336699]'} text-white h-12`}>
              {allStandardCols.filter(col => !hiddenCols.includes(col.key)).map(col => (
                <th 
                  key={col.key} 
                  style={{ width: colWidths[col.key] || 150 }}
                  className={`border ${type === 'ACTION_PLAN' ? 'border-slate-800' : 'border-[#224466]'} text-center cursor-pointer uppercase transition-all relative ${selectedColKey === col.key ? (type === 'ACTION_PLAN' ? 'bg-slate-900' : 'bg-[#002244]') + ' shadow-[inset_0_0_0_2px_rgba(255,255,255,0.3)]' : (type === 'ACTION_PLAN' ? 'hover:bg-slate-800' : 'hover:bg-[#4477aa]')}`}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setSelectedColKey(col.key); 
                    setSelectedRowId(null);
                  }}
                >
                   <div className="flex items-center justify-center gap-2 px-2 truncate">
                      {col.label}
                      {selectedColKey === col.key && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(col.key); }} className="bg-rose-600 text-white p-1 rounded hover:bg-rose-700"><Trash2 size={12} /></button>
                      )}
                   </div>
                   <div onMouseDown={(e) => handleMouseDown(col.key, e)} className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400 z-10" />
                </th>
              ))}
              {customColumns.map((col, i) => {
                const key = `custom-${i}`;
                return (
                  <th 
                    key={key} 
                    style={{ width: colWidths[key] || 150 }}
                    className={`border ${type === 'ACTION_PLAN' ? 'border-slate-800' : 'border-[#224466]'} text-center px-2 uppercase cursor-pointer transition-all relative ${selectedColKey === key ? (type === 'ACTION_PLAN' ? 'bg-slate-900' : 'bg-[#002244]') + ' shadow-[inset_0_0_0_2px_rgba(255,255,255,0.5)]' : (type === 'ACTION_PLAN' ? 'hover:bg-slate-800' : 'hover:bg-[#4477aa]')}`}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setSelectedColKey(key); 
                      setSelectedRowId(null); 
                    }}
                  >
                    <div className="flex items-center justify-between gap-1 h-full py-1">
                        <HeaderInput 
                          value={col} 
                          onRename={(newName) => renameCustomColumn(col, newName)} 
                        />
                        {selectedColKey === key && (
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn(key, i); }} className="bg-rose-600 text-white p-1 rounded hover:bg-rose-700 shrink-0"><Trash2 size={12} /></button>
                        )}
                    </div>
                    <div onMouseDown={(e) => handleMouseDown(key, e)} className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400 z-10" />
                  </th>
                );
              })}
              {!hiddenCols.includes('note') && (
                <th 
                  style={{ width: colWidths['note'] || 250 }}
                  className={`border ${type === 'ACTION_PLAN' ? 'border-slate-800' : 'border-[#224466]'} px-4 text-left cursor-pointer uppercase transition-all relative ${selectedColKey === 'note' ? (type === 'ACTION_PLAN' ? 'bg-slate-900' : 'bg-[#002244]') + ' shadow-[inset_0_0_0_2px_rgba(255,255,255,0.3)]' : (type === 'ACTION_PLAN' ? 'hover:bg-slate-800' : 'hover:bg-[#4477aa]')}`}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setSelectedColKey('note'); 
                    setSelectedRowId(null); 
                  }}
                >
                  <div className="flex items-center justify-between">
                     GHI CHÚ
                     {selectedColKey === 'note' && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn('note'); }} className="bg-rose-600 text-white p-1 rounded"><Trash2 size={12} /></button>
                      )}
                  </div>
                  <div onMouseDown={(e) => handleMouseDown('note', e)} className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400 z-10" />
                </th>
              )}
              {/* Dedicated Actions Column */}
              <th 
                style={{ width: 60 }}
                className={`border ${type === 'ACTION_PLAN' ? 'border-slate-800' : 'border-[#224466]'} text-center uppercase text-white font-bold bg-rose-950/40`}
              >
                HÀNH ĐỘNG
              </th>
            </tr>
          </thead>
          <tbody>
            {groupedData.map((group, groupIdx) => {
              const style = perspectiveStyles[group.name];
              return (
                <React.Fragment key={groupIdx}>
                  <tr className={`${style.bgColor} font-black ${style.textColor}`}>
                    {allStandardCols.map(c => (
                       <td key={c.key} className={`border border-gray-300 py-2 truncate ${c.key === 'stt' ? 'text-center' : c.key === 'target' || c.key === 'actual' ? 'text-right px-4' : 'px-4'} ${selectedColKey === c.key ? 'bg-white/40' : ''}`}>
                          {c.key === 'csf' ? group.name : c.key === 'weight' ? '100%' : c.key === 'target' ? group.totalPlan.toLocaleString() : c.key === 'actual' ? group.totalActual.toLocaleString() : c.key === 'percent' ? group.avgCompletion + '%' : ''}
                       </td>
                    ))}
                    {customColumns.map((_, i) => (
                      <td key={i} className={`border border-gray-300 ${selectedColKey === `custom-${i}` ? 'bg-white/40' : 'opacity-20'}`}></td>
                    ))}
                    {!hiddenCols.includes('note') && <td className={`border border-gray-300 ${selectedColKey === 'note' ? 'bg-white/40' : ''}`}></td>}
                    {/* Actions Column Spacer */}
                    <td className="border border-gray-300"></td>
                  </tr>

                  {group.items.map((item, itemIdx) => {
                    const currentIcon = iconList.find(i => i.id === item.iconId) || iconList[0];
                    return (
                      <tr 
                        key={item.id} 
                        className={`${style.rowColor} hover:brightness-95 transition-all cursor-pointer ${selectedRowId === item.id ? 'bg-blue-100/60 ring-2 ring-inset ring-blue-500' : ''}`}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedRowId(item.id); 
                        }}
                      >
                        {allStandardCols.map(c => (
                          <td key={c.key} className={`border border-gray-200 py-1 ${c.key === 'stt' ? 'text-center text-gray-400' : 'px-4'} ${selectedColKey === c.key ? 'bg-blue-600/10 border-x-2 border-blue-500' : ''}`}>
                             {c.key === 'stt' && (itemIdx + 1)}
                             {c.key === 'csf' && (
                               <div className="flex flex-col gap-1 w-full overflow-hidden py-1">
                                  <div className="flex items-center gap-2">
                                     <div className="relative shrink-0">
                                        <button onClick={(e) => { e.stopPropagation(); setActiveIconPicker(activeIconPicker === item.id ? null : item.id); }} className={`w-7 h-7 rounded-lg ${currentIcon.bg} flex items-center justify-center ${currentIcon.color} border border-gray-200 shadow-sm`}>{currentIcon.icon}</button>
                                        {activeIconPicker === item.id && (
                                          <div className="fixed z-[9999] mt-2 bg-white shadow-2xl border border-gray-200 rounded-xl p-3 grid grid-cols-4 gap-2 w-40 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                                             {iconList.map(icon => (
                                               <button key={icon.id} onClick={() => { updateKPIDefinition(item.id, { icon: icon.id }); setActiveIconPicker(null); }} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${icon.bg} ${icon.color} hover:scale-110 shadow-sm border ${item.iconId === icon.id ? 'ring-2 ring-blue-400' : 'border-gray-100'}`}>{icon.icon}</button>
                                             ))}
                                          </div>
                                        )}
                                     </div>
                                     <select 
                                       value={item.category === "CHƯA PHÂN LOẠI" ? "" : item.category} 
                                       onChange={(e) => updateKPIDefinition(item.id, { category: e.target.value })} 
                                       onClick={(e) => e.stopPropagation()} 
                                       className={`flex-1 bg-gray-50 border-none px-2 py-0.5 rounded text-[10px] font-bold focus:ring-0 cursor-pointer uppercase truncate ${!item.category || item.category === "CHƯA PHÂN LOẠI" ? 'text-gray-400 italic' : 'text-gray-700'}`}
                                     >
                                       <option value="">-- PHÂN LOẠI --</option>
                                       {perspectiveOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                     </select>
                                  </div>
                                  <textarea 
                                    value={item.csf === 'Nhiệm vụ chiến lược...' ? '' : item.csf} 
                                    placeholder={type === 'ACTION_PLAN' ? "Nhập kế hoạch hành động..." : "Nhập nhiệm vụ chiến lược (CSF)..."} 
                                    onChange={(e) => {
                                       updateKPIDefinition(item.id, { description: e.target.value });
                                       e.target.style.height = 'auto';
                                       e.target.style.height = e.target.scrollHeight + 'px';
                                    }} 
                                    onFocus={(e) => {
                                       e.target.style.height = 'auto';
                                       e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    className="w-full bg-transparent border-none p-0 text-[11px] font-medium text-gray-600 focus:ring-0 placeholder:text-gray-300 placeholder:italic resize-none overflow-hidden leading-tight min-h-[20px]" 
                                  />
                               </div>
                             )}
                             {c.key === 'kpi' && (
                               <div className="flex flex-col">
                                 <textarea 
                                   value={item.kpiName} 
                                   placeholder={type === 'ACTION_PLAN' ? "Chỉ tiêu cụ thể..." : "Tên KPI..."} 
                                   onChange={(e) => {
                                      updateKPIDefinition(item.id, { name: e.target.value });
                                      e.target.style.height = 'auto';
                                      e.target.style.height = e.target.scrollHeight + 'px';
                                   }} 
                                   onFocus={(e) => {
                                      e.target.style.height = 'auto';
                                      e.target.style.height = e.target.scrollHeight + 'px';
                                   }}
                                   className={`w-full bg-transparent border-none p-0 text-[12px] font-bold ${type === 'ACTION_PLAN' ? 'text-slate-800' : 'text-[#003366]'} focus:ring-0 placeholder:text-gray-300 placeholder:italic resize-none overflow-hidden leading-tight min-h-[24px]`} 
                                 />
                                 <input 
                                   type="text" 
                                   value={item.unit} 
                                   placeholder="Đơn vị..." 
                                   onChange={(e) => updateKPIDefinition(item.id, { unit: e.target.value })} 
                                   className="bg-transparent border-none p-0 text-[10px] text-gray-400 focus:ring-0 placeholder:text-gray-200" 
                                 />
                               </div>
                             )}
                             {c.key === 'weight' && <span className="font-bold">{item.weight}%</span>}
                             {c.key === 'target' && <span className="font-mono font-bold">{item.plan.toLocaleString()}</span>}
                             {c.key === 'actual' && <span className={`font-mono font-bold ${type === 'ACTION_PLAN' ? 'text-slate-700' : 'text-indigo-700'}`}>{item.actualVal.toLocaleString()}</span>}
                             {c.key === 'percent' && <span className={`font-black ${item.completion >= 100 ? 'text-emerald-700' : 'text-rose-600'}`}>{item.completion}%</span>}
                             {c.key === 'grade' && <div className={`w-6 h-6 mx-auto rounded flex items-center justify-center font-black text-[10px] border shadow-sm ${item.completion >= 100 ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white'}`}>{item.completion >= 100 ? 'A' : 'B'}</div>}
                          </td>
                        ))}
                        {customColumns.map((col, i) => {
                          const key = `custom-${i}`;
                          const customVals = (item as any).customValues || {};
                          return (
                            <td key={key} className={`border border-gray-200 px-2 text-center transition-colors ${selectedColKey === key ? 'bg-blue-600/10 border-x-2 border-blue-500 font-bold' : ''}`}>
                               <textarea 
                                 value={customVals[col] || ''}
                                 className="w-full bg-transparent border-none text-center focus:ring-0 text-[11px] font-bold resize-none overflow-hidden leading-tight py-1 min-h-[24px]" 
                                 placeholder="..." 
                                 onChange={(e) => {
                                    updateKPIDefinition(item.id, { 
                                      customValues: { ...customVals, [col]: e.target.value } 
                                    });
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                 }}
                                 onFocus={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                 }}
                               />
                            </td>
                          );
                        })}
                        {!hiddenCols.includes('note') && (
                          <td className={`border border-gray-200 px-4 py-2 ${selectedColKey === 'note' ? 'bg-blue-600/10 border-x-2 border-blue-500' : ''}`}>
                             <span className="text-gray-500 italic text-[11px] truncate shrink">Cần cải thiện tiến độ.</span>
                          </td>
                        )}
                        {/* Dedicated Actions Column Cell */}
                        <td className="border border-gray-200 text-center py-2 shrink-0">
                           <button 
                             onClick={(e) => { 
                               e.stopPropagation(); 
                               setKpiToDelete(item.id);
                               setShowDeleteModal(true);
                             }} 
                             className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-md transition-all inline-flex items-center justify-center border border-transparent hover:border-rose-100 shadow-sm bg-white"
                             title="Xóa dòng này / Delete this row"
                           >
                             <Trash2 size={15} />
                           </button>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}

            <tr className={`${type === 'ACTION_PLAN' ? 'bg-slate-800' : 'bg-[#003366]'} text-white font-black text-center h-12`}>
              <td className={`border ${type === 'ACTION_PLAN' ? 'border-slate-900' : 'border-[#002244]'}`} colSpan={allStandardCols.findIndex(c => c.key === 'weight')}>TỔNG CỘNG HỆ THỐNG</td>
              {allStandardCols.map(c => {
                if (['weight', 'target', 'actual', 'percent', 'grade'].includes(c.key)) {
                  return <td key={c.key} className={`border ${type === 'ACTION_PLAN' ? 'border-slate-900' : 'border-[#002244]'} ${c.key === 'target' || c.key === 'actual' ? 'text-right px-4' : ''} ${selectedColKey === c.key ? 'brightness-150 border-x-2 border-white' : ''}`}>
                    {c.key === 'weight' ? '100%' : c.key === 'target' ? mboData.reduce((sum, i) => sum + i.plan, 0).toLocaleString() : c.key === 'actual' ? mboData.reduce((sum, i) => sum + i.actualVal, 0).toLocaleString() : c.key === 'percent' ? overallCompletion + '%' : 'A'}
                  </td>
                }
                return null;
              })}
              {customColumns.map((_, i) => <td key={i} className={`border ${type === 'ACTION_PLAN' ? 'border-slate-900' : 'border-[#002244]'} bg-[#002244] ${selectedColKey === `custom-${i}` ? 'brightness-150 border-x-2 border-white' : ''}`}></td>)}
              {!hiddenCols.includes('note') && <td className={`border ${type === 'ACTION_PLAN' ? 'border-slate-900' : 'border-[#002244]'} px-4 text-[10px] text-gray-400 font-normal ${selectedColKey === 'note' ? 'brightness-150' : ''}`}>Cập nhật: {new Date().toLocaleDateString()}</td>}
              {/* Actions Column Spacer */}
              <td className={`border ${type === 'ACTION_PLAN' ? 'border-slate-900' : 'border-[#002244]'}`}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setKpiToDelete(null);
        }}
        onConfirm={() => {
          if (kpiToDelete) {
            deleteKPIDefinition(kpiToDelete);
          }
        }}
      />
    </div>
  );
}
