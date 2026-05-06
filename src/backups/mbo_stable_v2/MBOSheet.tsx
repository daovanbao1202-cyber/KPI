'use client';

import React, { useState, useEffect } from 'react';
import { useKPI } from '@/context/KPIContext';
import { 
  TrendingUp, Download, Plus, Target,
  Filter, Calendar, ChevronDown, 
  DollarSign, Users, Settings, GraduationCap, Building2,
  Briefcase, Activity, Rocket, Zap, Trash2, X, FileSpreadsheet,
  Save, RotateCcw, CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';

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

export default function MBOSheet() {
  const { 
    kpiDefs, users, userActuals, userTargets, 
    addKPIDefinition, updateKPIDefinition, deleteKPIDefinition,
    saveToDisk, loadFromDisk,
    customColumns, setCustomColumns,
    hiddenCols, setHiddenCols
  } = useKPI();

  const [selectedDept, setSelectedDept] = useState('ALL');
  const [activeIconPicker, setActiveIconPicker] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedColKey, setSelectedColKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const perspectiveOptions = Object.keys(perspectiveStyles).filter(opt => opt !== "CHƯA PHÂN LOẠI");

  const handleAddColumn = () => {
    const colName = prompt('Nhập tên cột mới:');
    if (colName) setCustomColumns([...customColumns, colName.toUpperCase()]);
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
      window.location.reload(); // Refresh to ensure all states are clean
    }
  };

  const getAggregatedData = () => {
    return kpiDefs.map(kpi => {
      const filteredUsers = selectedDept === 'ALL' ? users : users.filter(u => u.department.toUpperCase() === selectedDept.toUpperCase());
      const userIds = filteredUsers.map(u => u.id);
      const actual = userActuals.filter(a => a.kpiId === kpi.id && userIds.includes(a.userId)).reduce((sum, curr) => sum + curr.actualValue, 0);
      const plan = userTargets.filter(t => t.kpiId === kpi.id && userIds.includes(t.userId)).reduce((sum, curr) => sum + curr.targetValue, 0) || Number(kpi.hasTarget) || 100;
      return { id: kpi.id, category: kpi.category || "CHƯA PHÂN LOẠI", csf: kpi.description || 'Nhiệm vụ chiến lược...', kpiName: kpi.name, weight: 10, plan, actualVal: actual, completion: isNaN(actual / plan) ? 0 : parseFloat(((actual / plan) * 100).toFixed(1)), unit: kpi.unit, iconId: kpi.icon || 'target' };
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
      exportData.push({ "Hạng mục": group.name, "Mục tiêu": group.totalPlan, "Thực tế": group.totalActual, "%": group.avgCompletion });
      group.items.forEach(i => exportData.push({ "Hạng mục": i.csf, "KPI": i.kpiName, "Đơn vị": i.unit, "Mục tiêu": i.plan, "Thực tế": i.actualVal, "%": i.completion }));
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MBO");
    XLSX.writeFile(wb, `MBO_Report_2026_${new Date().getTime()}.xlsx`);
  };

  const allStandardCols = [
    { key: 'stt', label: 'STT', width: 'w-12' },
    { key: 'csf', label: 'HẠNG MỤC / CHIẾN LƯỢC (CSF)', width: 'w-80' },
    { key: 'kpi', label: 'CHỈ SỐ KPI / ĐƠN VỊ', width: 'w-64' },
    { key: 'weight', label: 'TRỌNG SỐ', width: 'w-24' },
    { key: 'target', label: 'MỤC TIÊU', width: 'w-32' },
    { key: 'actual', label: 'THỰC TẾ', width: 'w-32' },
    { key: 'percent', label: '% HOÀN THÀNH', width: 'w-32' },
    { key: 'grade', label: 'XẾP LOẠI', width: 'w-24' }
  ].filter(c => !hiddenCols.includes(c.key));

  return (
    <div className="flex flex-col gap-0 pb-20 font-sans shadow-2xl border border-gray-200 rounded-lg overflow-hidden" onClick={() => { setActiveIconPicker(null); setSelectedRowId(null); setSelectedColKey(null); }}>
      
      <div className="bg-[#003366] py-3 px-6 text-center border-b border-[#002244] flex items-center justify-between">
        <div className="w-40 flex items-center gap-2">
           <button onClick={(e) => { e.stopPropagation(); handleBack(); }} className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded transition-all border border-white/20">
              <RotateCcw size={14} /> QUAY LẠI
           </button>
        </div>
        <h1 className="text-white text-lg font-black uppercase tracking-[0.3em] flex-1 text-center">BẢNG QUẢN TRỊ MỤC TIÊU CHIẾN LƯỢC (MBO) - 2026</h1>
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
              <span>BỘ PHẬN: {selectedDept}</span>
           </div>
           <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} onClick={(e) => e.stopPropagation()} className="bg-gray-100 border border-gray-200 rounded px-2 py-1 text-[11px] font-bold focus:ring-0 cursor-pointer">
             {['ALL', ...Array.from(new Set(users.map(u => u.department).filter(Boolean))).sort()].map(dept => (
               <option key={dept} value={dept}>{dept}</option>
             ))}
           </select>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={(e) => { e.stopPropagation(); addKPIDefinition({ name: '', unit: '', hasTarget: '100', category: '' }); }} className="px-4 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm">
              <Plus size={14} /> THÊM DÒNG
           </button>
           <button onClick={(e) => { e.stopPropagation(); handleAddColumn(); }} className="px-4 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm">
              <Plus size={14} /> THÊM CỘT
           </button>
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

      <div className="overflow-x-auto bg-white">
        <table className="w-full text-[12px] border-collapse min-w-[1400px]">
          <thead>
            <tr className="bg-[#336699] text-white">
              {allStandardCols.map(col => (
                <th 
                  key={col.key} 
                  className={`border border-[#224466] ${col.width} py-3 text-center cursor-pointer uppercase transition-all relative ${selectedColKey === col.key ? 'bg-[#002244] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.3)]' : 'hover:bg-[#4477aa]'}`}
                  onClick={(e) => { e.stopPropagation(); setSelectedColKey(col.key); }}
                >
                   <div className="flex items-center justify-center gap-2">
                      {col.label}
                      {selectedColKey === col.key && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteColumn(col.key); }} 
                          className="bg-rose-600 text-white p-1.5 rounded-lg shadow-xl hover:bg-rose-700 transform scale-110"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                   </div>
                </th>
              ))}
              {customColumns.map((col, i) => (
                <th 
                  key={`custom-${i}`} 
                  className={`border border-[#224466] w-44 text-center px-4 uppercase cursor-pointer transition-all relative ${selectedColKey === `custom-${i}` ? 'bg-[#002244] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.5)]' : 'hover:bg-[#4477aa]'}`}
                  onClick={(e) => { e.stopPropagation(); setSelectedColKey(`custom-${i}`); }}
                >
                   <div className="flex items-center justify-between gap-2 h-full py-1">
                      <span className="flex-1 font-black tracking-wider">{col}</span>
                      {selectedColKey === `custom-${i}` && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteColumn(`custom-${i}`, i); }} 
                          className="bg-rose-600 text-white p-2 rounded-lg shadow-xl hover:bg-rose-700 transform scale-110 border border-rose-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                   </div>
                </th>
              ))}
              {!hiddenCols.includes('note') && (
                <th 
                  className={`border border-[#224466] w-64 px-4 text-left cursor-pointer uppercase transition-all relative ${selectedColKey === 'note' ? 'bg-[#002244] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.3)]' : 'hover:bg-[#4477aa]'}`}
                  onClick={(e) => { e.stopPropagation(); setSelectedColKey('note'); }}
                >
                  <div className="flex items-center justify-between">
                     GHI CHÚ / HÀNH ĐỘNG
                     {selectedColKey === 'note' && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteColumn('note'); }} className="bg-rose-600 text-white p-1.5 rounded-lg shadow-xl"><Trash2 size={14} /></button>
                     )}
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {groupedData.map((group, groupIdx) => {
              const style = perspectiveStyles[group.name];
              return (
                <React.Fragment key={groupIdx}>
                  <tr className={`${style.bgColor} font-black ${style.textColor}`}>
                    {allStandardCols.map(c => (
                       <td key={c.key} className={`border border-gray-300 py-2 ${c.key === 'stt' ? 'text-center' : c.key === 'target' || c.key === 'actual' ? 'text-right px-4' : 'px-4'} ${selectedColKey === c.key ? 'bg-white/40' : ''}`}>
                          {c.key === 'csf' ? group.name : c.key === 'weight' ? '100%' : c.key === 'target' ? group.totalPlan.toLocaleString() : c.key === 'actual' ? group.totalActual.toLocaleString() : c.key === 'percent' ? group.avgCompletion + '%' : ''}
                       </td>
                    ))}
                    {customColumns.map((_, i) => (
                      <td key={i} className={`border border-gray-300 ${selectedColKey === `custom-${i}` ? 'bg-white/40' : 'opacity-20'}`}></td>
                    ))}
                    {!hiddenCols.includes('note') && <td className={`border border-gray-300 ${selectedColKey === 'note' ? 'bg-white/40' : ''}`}></td>}
                  </tr>

                  {group.items.map((item, itemIdx) => {
                    const currentIcon = iconList.find(i => i.id === item.iconId) || iconList[0];
                    return (
                      <tr 
                        key={item.id} 
                        className={`${style.rowColor} hover:brightness-95 transition-all cursor-pointer ${selectedRowId === item.id ? 'bg-blue-100/60 ring-2 ring-inset ring-blue-500' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedRowId(item.id); }}
                      >
                        {allStandardCols.map(c => (
                          <td key={c.key} className={`border border-gray-200 py-2 ${c.key === 'stt' ? 'text-center text-gray-400' : 'px-4'} ${selectedColKey === c.key ? 'bg-blue-600/10 border-x-2 border-blue-500' : ''}`}>
                             {c.key === 'stt' && (itemIdx + 1)}
                             {c.key === 'csf' && (
                               <div className="flex items-center gap-2">
                                  <div className="relative">
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
                                    className={`flex-1 bg-transparent border-none p-0 text-[11px] font-bold focus:ring-0 cursor-pointer uppercase ${!item.category || item.category === "CHƯA PHÂN LOẠI" ? 'text-gray-400 italic' : 'text-gray-700'}`}
                                  >
                                    <option value="">-- Chọn hạng mục --</option>
                                    {perspectiveOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                               </div>
                             )}
                             {c.key === 'kpi' && (
                               <div className="flex flex-col">
                                 <input 
                                   type="text" 
                                   value={item.kpiName} 
                                   placeholder="Nhấn để nhập tên KPI..." 
                                   onChange={(e) => updateKPIDefinition(item.id, { name: e.target.value })} 
                                   onClick={(e) => e.stopPropagation()} 
                                   className="w-full bg-transparent border-none p-0 text-[12px] font-bold text-[#003366] focus:ring-0 placeholder:text-gray-300 placeholder:italic placeholder:font-normal" 
                                 />
                                 <input 
                                   type="text" 
                                   value={item.unit} 
                                   placeholder="Đơn vị..." 
                                   onChange={(e) => updateKPIDefinition(item.id, { unit: e.target.value })} 
                                   onClick={(e) => e.stopPropagation()} 
                                   className="bg-transparent border-none p-0 text-[10px] text-gray-400 focus:ring-0 placeholder:text-gray-200" 
                                 />
                               </div>
                             )}
                             {c.key === 'weight' && <span className="font-bold">{item.weight}%</span>}
                             {c.key === 'target' && <span className="font-mono font-bold">{item.plan.toLocaleString()}</span>}
                             {c.key === 'actual' && <span className="font-mono font-bold text-indigo-700">{item.actualVal.toLocaleString()}</span>}
                             {c.key === 'percent' && <span className={`font-black ${item.completion >= 100 ? 'text-emerald-700' : 'text-rose-600'}`}>{item.completion}%</span>}
                             {c.key === 'grade' && <div className={`w-6 h-6 mx-auto rounded flex items-center justify-center font-black text-[10px] border shadow-sm ${item.completion >= 100 ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white'}`}>{item.completion >= 100 ? 'A' : 'B'}</div>}
                          </td>
                        ))}
                        {customColumns.map((col, i) => (
                          <td key={i} className={`border border-gray-200 px-4 text-center transition-colors ${selectedColKey === `custom-${i}` ? 'bg-blue-600/10 border-x-2 border-blue-500 font-bold' : ''}`}>
                             <input type="text" className="w-full bg-transparent border-none text-center focus:ring-0 text-[11px] font-bold" placeholder="..." onClick={(e) => e.stopPropagation()} />
                          </td>
                        ))}
                        {!hiddenCols.includes('note') && (
                          <td className={`border border-gray-200 px-4 flex items-center justify-between ${selectedColKey === 'note' ? 'bg-blue-600/10 border-x-2 border-blue-500' : ''}`}>
                             <span className="text-gray-500 italic text-[11px]">{item.completion < 100 ? 'Cần cải thiện tiến độ.' : 'Duy trì phong độ.'}</span>
                             {selectedRowId === item.id && (
                               <button onClick={(e) => { e.stopPropagation(); if (confirm('Xóa dòng này?')) deleteKPIDefinition(item.id); }} className="text-rose-500 p-1.5 bg-rose-50 rounded-md hover:bg-rose-100 transition-all border border-rose-200 shadow-sm"><Trash2 size={16} /></button>
                             )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}

            <tr className="bg-[#003366] text-white font-black text-center">
              <td className="border border-[#002244] py-3" colSpan={allStandardCols.findIndex(c => c.key === 'weight')}>TỔNG CỘNG HỆ THỐNG</td>
              {allStandardCols.map(c => {
                if (['weight', 'target', 'actual', 'percent', 'grade'].includes(c.key)) {
                  return <td key={c.key} className={`border border-[#002244] ${c.key === 'target' || c.key === 'actual' ? 'text-right px-4' : ''} ${selectedColKey === c.key ? 'brightness-150 border-x-2 border-white' : ''}`}>
                    {c.key === 'weight' ? '100%' : c.key === 'target' ? mboData.reduce((sum, i) => sum + i.plan, 0).toLocaleString() : c.key === 'actual' ? mboData.reduce((sum, i) => sum + i.actualVal, 0).toLocaleString() : c.key === 'percent' ? overallCompletion + '%' : 'A'}
                  </td>
                }
                return null;
              })}
              {customColumns.map((_, i) => <td key={i} className={`border border-[#002244] bg-[#002244] ${selectedColKey === `custom-${i}` ? 'brightness-150 border-x-2 border-white' : ''}`}></td>)}
              {!hiddenCols.includes('note') && <td className={`border border-[#002244] px-4 text-[10px] text-gray-400 font-normal ${selectedColKey === 'note' ? 'brightness-150' : ''}`}>Cập nhật: {new Date().toLocaleDateString()}</td>}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
