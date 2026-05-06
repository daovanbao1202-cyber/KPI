'use client';

import { useState } from 'react';
import { X, Plus, Trash2, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { useKPI, KPIReport } from '@/context/KPIContext';

interface ReportTableModalProps {
  kpiId: string;
  dateKey: string;
  label: string;
  onClose: () => void;
}

export default function ReportTableModal({ kpiId, dateKey, label, onClose }: ReportTableModalProps) {
  const { kpiDefs, currentUser, reports, addReport, updateReport, deleteReport, users } = useKPI();
  
  const kpi = kpiDefs.find(k => k.id === kpiId);
  const periodReports = reports.filter(r => r.kpiId === kpiId && r.dateKey === dateKey);

  const handleAddRow = () => {
    addReport({
      kpiId,
      userId: currentUser?.id || 1,
      dateKey,
      month: label,
      customer: '',
      type: 'Demo',
      reportName: '',
      picId: currentUser?.id || 1,
      url: '',
      status: 'Not yet',
      date: new Date().toISOString().split('T')[0],
      note: '',
      isDone: false
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-7xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#555cf8]/10 flex items-center justify-center text-[#555cf8]">
              <span className="text-xl">{kpi?.icon || '📊'}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">REPORT / DEMO / JOB</h2>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">{kpi?.name} — {label}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={handleAddRow}
               className="flex items-center gap-2 bg-[#555cf8] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#4a51e2] transition-colors shadow-sm"
             >
               <Plus size={16} /> Add Report
             </button>
             <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
               <X size={20} />
             </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          <table className="w-full border-collapse text-[13px]">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-100">
                <th className="p-3 text-left w-24">MONTH</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left w-24">Type</th>
                <th className="p-3 text-left">Report Name</th>
                <th className="p-3 text-left">P.I.C</th>
                <th className="p-3 text-left">Google URL</th>
                <th className="p-3 text-left w-28">Status</th>
                <th className="p-3 text-left w-32">Date</th>
                <th className="p-3 text-left">Note</th>
                <th className="p-3 text-center w-20">Done</th>
                <th className="p-3 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {periodReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-3 text-gray-400 italic">{report.month}</td>
                  <td className="p-3">
                    <input 
                      type="text" 
                      value={report.customer} 
                      onChange={e => updateReport(report.id, { customer: e.target.value })}
                      placeholder="Customer name..."
                      className="w-full bg-transparent border-b border-transparent focus:border-[#555cf8] focus:outline-none py-1"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <select 
                      value={report.type}
                      onChange={e => updateReport(report.id, { type: e.target.value })}
                      className="bg-green-50 text-green-700 text-[11px] font-bold px-2 py-1 rounded focus:outline-none"
                    >
                      <option>Demo</option>
                      <option>Job</option>
                      <option>Report</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <input 
                      type="text" 
                      value={report.reportName} 
                      onChange={e => updateReport(report.id, { reportName: e.target.value })}
                      placeholder="Enter report details..."
                      className="w-full bg-transparent border-b border-transparent focus:border-[#555cf8] focus:outline-none py-1 font-medium"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                       <img className="w-6 h-6 rounded-full border border-gray-200" src={users.find(u => u.id === report.picId)?.avatar} alt="" />
                       <span className="text-gray-600 font-medium whitespace-nowrap">{users.find(u => u.id === report.picId)?.firstName}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={report.url} 
                        onChange={e => updateReport(report.id, { url: e.target.value })}
                        placeholder="Paste link here..."
                        className="flex-1 bg-transparent border-b border-transparent focus:border-[#555cf8] focus:outline-none py-1 text-blue-500 underline"
                      />
                      {report.url && (
                        <a href={report.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#555cf8]">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${report.status === 'Done' ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`}></div>
                      <select 
                        value={report.status}
                        onChange={e => updateReport(report.id, { status: e.target.value, isDone: e.target.value === 'Done' })}
                        className={`text-[11px] font-bold px-2 py-1 rounded focus:outline-none ${report.status === 'Done' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}
                      >
                        <option>Not yet</option>
                        <option>Done</option>
                        <option>In Progress</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-3">
                    <input 
                      type="date" 
                      value={report.date}
                      onChange={e => updateReport(report.id, { date: e.target.value })}
                      className="bg-transparent text-gray-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-3">
                    <input 
                      type="text" 
                      value={report.note} 
                      onChange={e => updateReport(report.id, { note: e.target.value })}
                      placeholder="..."
                      className="w-full bg-transparent border-b border-transparent focus:border-[#555cf8] focus:outline-none py-1 italic text-red-500/70"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input 
                      type="checkbox" 
                      checked={report.isDone}
                      onChange={e => updateReport(report.id, { isDone: e.target.checked, status: e.target.checked ? 'Done' : 'Not yet' })}
                      className="w-4 h-4 rounded text-[#555cf8] focus:ring-[#555cf8]"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => deleteReport(report.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {periodReports.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-gray-300">
                       <AlertCircle size={48} strokeWidth={1} />
                       <div className="flex flex-col gap-1">
                          <p className="text-lg font-bold">No reports yet</p>
                          <p className="text-sm">Click "Add Report" to create your first report for this period.</p>
                       </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between font-bold text-gray-800">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Reports:</span>
                 <span className="text-xl">{periodReports.length}</span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Done:</span>
                 <span className="text-xl text-green-600">{periodReports.filter(r => r.isDone).length}</span>
              </div>
           </div>
           
           <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
              <span className="text-[#38bdf8] text-sm uppercase tracking-tighter">Current Actual Value:</span>
              <span className="text-2xl text-[#38bdf8]">{periodReports.filter(r => r.isDone).length}</span>
           </div>
        </div>
      </div>
    </div>
  );
}
