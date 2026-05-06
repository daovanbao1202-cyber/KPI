'use client';

import { useState, useEffect } from 'react';
import { UserCircle, ChevronDown, Search, Target, Plus, Trash2, Edit2, HelpCircle, X, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useKPI, KPIDefinition, Thresholds } from '@/context/KPIContext';

const KPI_ICONS = [
  '🎯', '🎧', '💳', '🔗', '🧮', '💵', '📋', '👤', '🔄', '📈', '➕', '🧰',
  '🚧', '🚚', '🕒', '🇺🇸', '🇬🇧', '🇦🇺', '🇪🇺', '🇨🇳', '🇫🇷', '🇮🇪', '🇨🇦', '🇩🇪',
  '🇪🇸', '🇮🇳', '🇳🇬', '🇯🇵', '🇧🇷', '🔔', '🛒', '👥', '📊', '📦', '↔️', '📉', '👨‍👩‍👧‍👦'
];

export default function KPIsPage() {
  const { kpiDefs, addKPIDefinition, updateKPIDefinition, deleteKPIDefinition, userTargets, currentUser, users, setTarget } = useKPI();
  const router = useRouter();
  
  useEffect(() => {
    if (currentUser && currentUser.role !== 'Admin') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [editingKpiId, setEditingKpiId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [frequency, setFrequency] = useState('Daily');
  const [format, setFormat] = useState('1,234');
  
  // More Options State
  const [hasTarget, setHasTarget] = useState('');
  const [direction, setDirection] = useState<'Up' | 'Down'>('Up');
  const [category, setCategory] = useState('Default');
  const [aggregation, setAggregation] = useState('Sum Total');
  const [thresholds, setThresholds] = useState<Thresholds>({
    red: '', amberSmall: '', amberLarge: '', green: ''
  });
  const [workingDays, setWorkingDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [assignedUsers, setAssignedUsers] = useState<{userId: number, target: string}[]>([]);

  // Formula State
  const [formula, setFormula] = useState('');
  const [calculateThisTarget, setCalculateThisTarget] = useState(false);

  // Reset form helper
  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedIcon('🎯');
    setFrequency('Daily');
    setFormat('1,234');
    setIsMoreOptionsOpen(false);
    setIsFormulaOpen(false);
    setHasTarget('');
    setDirection('Up');
    setCategory('Default');
    setAggregation('Sum Total');
    setThresholds({ red: '', amberSmall: '', amberLarge: '', green: '' });
    setWorkingDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    setFormula('');
    setCalculateThisTarget(false);
    setEditingKpiId(null);
    setAssignedUsers([]);
  };

  // Open modal for editing
  const handleEdit = (kpi: KPIDefinition) => {
    setEditingKpiId(kpi.id);
    setName(kpi.name);
    setDescription(kpi.description || '');
    setSelectedIcon(kpi.icon || '🎯');
    setFrequency(kpi.frequency || 'Daily');
    setFormat(kpi.format || '1,234');
    setDirection(kpi.direction || 'Up');
    setCategory(kpi.category || 'Default');
    setAggregation(kpi.aggregation || 'Sum Total');
    if (kpi.thresholds) setThresholds(kpi.thresholds);
    if (kpi.workingDays) setWorkingDays(kpi.workingDays);
    setFormula(kpi.formula || '');
    setHasTarget(kpi.hasTarget || '');
    setCalculateThisTarget(!!kpi.calculateThisTarget);
    
    // Populate specific users assigned to this KPI.
    const targets = userTargets.filter(t => t.kpiId === kpi.id);
    setAssignedUsers(targets.map(t => ({ userId: t.userId, target: t.targetValue.toString() })));

    setIsAddModalOpen(true);
  };

  const handleSave = () => {
    const kpiData = {
      name,
      unit: format === '$1,234' ? 'USD' : format === '12.34%' ? '%' : 'Units',
      description,
      icon: selectedIcon,
      frequency,
      format,
      direction,
      category,
      aggregation,
      thresholds,
      workingDays,
      formula,
      calculateThisTarget,
      hasTarget
    };

    let kpiId = editingKpiId;
    if (editingKpiId) {
      updateKPIDefinition(editingKpiId, kpiData);
    } else {
      kpiId = addKPIDefinition(kpiData);
    }
    
    if (kpiId) {
      users.forEach(u => {
        const assigned = assignedUsers.find(au => au.userId === u.id);
        if (assigned) {
           setTarget(kpiId, u.id, parseFloat(assigned.target) || 0);
        } else {
           const previous = userTargets.find(t => t.kpiId === kpiId && t.userId === u.id);
           if (previous) {
              setTarget(kpiId, u.id, 0); // Remove assignment by setting to 0
           }
        }
      });
    }
    
    setIsAddModalOpen(false);
    resetForm();
  };

  const toggleDay = (day: string) => {
    setWorkingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f5f8] pb-10 relative">
      
      {/* Top Header */}
      <div className="bg-white px-6 py-2.5 border-b border-gray-100 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-6">
           <button onClick={() => { resetForm(); setIsAddModalOpen(true); }} className="flex items-center gap-1.5 text-gray-600 font-medium hover:text-gray-800 text-[13px] bg-gray-50 border border-gray-200 px-3 py-1.5 rounded transition-colors hover:bg-gray-100">
             <Plus size={14} /> Add a KPI
           </button>
           <button className="flex items-center gap-1.5 text-gray-600 font-medium hover:text-gray-800 text-[13px]">
             <Target size={14} className="text-[#555cf8]" /> Generate KPIs
           </button>
           <button className="flex items-center gap-1 text-gray-600 font-medium hover:text-gray-800 text-[13px]">
             More Options <ChevronDown size={14} />
           </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-gray-600 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 bg-white text-[13px] font-medium">
            Learn <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col min-h-0">
        <div className="bg-white border border-gray-100 rounded shadow-sm flex flex-col h-full overflow-hidden">
           <div className="bg-[#f4f8fe] px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <span className="text-[13px] text-gray-500 font-medium">Category:</span>
                 <select className="bg-white border border-gray-200 text-sm font-medium text-gray-800 rounded px-3 py-1.5 focus:outline-none min-w-[200px]">
                    <option>Default</option>
                 </select>
                 <span className="text-gray-400 font-bold ml-2">⋮</span>
                 <ChevronDown size={14} className="text-gray-400" />
              </div>
              <div className="relative w-80">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input type="text" className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none shadow-sm" />
              </div>
           </div>

           <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                 <thead>
                    <tr className="bg-white border-b border-gray-100 text-[11px] font-bold text-gray-800 uppercase tracking-wide">
                       <th className="p-3 pl-4 w-10"></th>
                       <th className="p-3 w-16 text-center">ID ↕</th>
                       <th className="p-3">Name ↕</th>
                       <th className="p-3 text-center">Type</th>
                       <th className="p-3 text-center">Assign</th>
                       <th className="p-3 text-center">Frequency</th>
                       <th className="p-3 text-center">Format</th>
                       <th className="p-3 text-center">Direction</th>
                       <th className="p-3 text-center">Target</th>
                       <th className="p-3 text-center">Entries</th>
                       <th className="p-3 w-20 text-center">⋮ ˅</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 text-[13px]">
                    {kpiDefs.map((kpi, idx) => {
                      let tgt = userTargets.filter(t => t.kpiId === kpi.id).reduce((acc, curr) => acc + curr.targetValue, 0);
                      if (tgt === 0 && kpi.hasTarget) {
                        tgt = Number(kpi.hasTarget);
                      }
                      
                      return (
                        <tr key={kpi.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="p-3 pl-4 text-center">
                              <Edit2 
                                onClick={() => handleEdit(kpi)} 
                                size={14} 
                                className="text-gray-300 group-hover:text-blue-500 cursor-pointer transition-colors" 
                              />
                          </td>
                          <td className="p-3 text-center font-medium text-gray-500">{idx + 1}</td>
                          <td className="p-3 flex items-center gap-3">
                              <span className="text-2xl leading-none">{kpi.icon || '🎯'}</span>
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-800 text-sm">{kpi.name}</span>
                                <span className="text-[11px] text-gray-400 mt-0.5">{kpi.description || 'No description'}</span>
                              </div>
                          </td>
                          <td className="p-3 text-center">
                              <div className="inline-flex p-1 bg-gray-100 rounded-full text-gray-500"><UserCircle size={14} /></div>
                          </td>
                          <td className="p-3 flex justify-center">
                              <div className="bg-[#6b7280] text-white px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 w-max">
                                <span className="w-3 h-3 bg-white/20 rounded-full flex items-center justify-center">✓</span> Users
                              </div>
                          </td>
                          <td className="p-3 text-center text-gray-600 font-medium">{kpi.frequency}</td>
                          <td className="p-3 text-center text-gray-600 font-medium">{kpi.format}</td>
                          <td className="p-3 text-center text-gray-600 font-medium">{kpi.direction}</td>
                          <td className="p-3 text-center font-bold text-gray-800">{tgt}</td>
                          <td className="p-3 text-center">
                              <button 
                                onClick={() => {
                                  const freq = (kpi.frequency || 'Daily').toLowerCase();
                                  router.push(`/dashboard/data?frequency=${freq}&kpiId=${kpi.id}`);
                                }}
                                className="bg-[#7885a0] hover:bg-[#6b7280] text-white px-3 py-1 rounded-full text-xs font-semibold transition-colors shadow-sm"
                              >
                                Add Data
                              </button>
                          </td>
                          <td className="p-3 flex justify-center">
                              <div className="flex items-center gap-3">
                                <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300" />
                                <Trash2 onClick={() => deleteKPIDefinition(kpi.id)} size={14} className="text-gray-300 hover:text-red-500 cursor-pointer" />
                              </div>
                          </td>
                        </tr>
                      );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
      
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#555cf8] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#4a51e2] transition-colors z-30">
        <HelpCircle size={24} fill="currentColor" className="text-[#555cf8] text-white" />
      </button>

      {/* Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#384252]/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[650px] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
             <div className="flex justify-between items-start p-8 pb-6 sticky top-0 bg-white z-20">
                <div className="flex items-end gap-3">
                   <h2 className="text-2xl font-bold text-[#1e293b] leading-none">
                    {editingKpiId ? 'Edit this KPI' : 'Add a KPI'}
                   </h2>
                   <Link href="#" className="text-[13px] text-[#555cf8] hover:underline flex items-center gap-1 mb-0.5">Learn more <span className="text-[10px] opacity-75">↗</span></Link>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} strokeWidth={2} /></button>
             </div>
             
             <div className="px-8 pb-8">
                <div className="flex gap-2 mb-5 relative">
                   <input 
                    type="text" 
                    placeholder="Give your KPI a name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-md px-4 py-3 text-[14px] font-medium text-gray-700 focus:outline-none focus:border-[#555cf8] bg-[#f8fafc]" 
                   />
                   
                   <div className="relative">
                      <button 
                        onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                        className={`h-[46px] px-3 border border-gray-200 rounded-md flex items-center gap-2 bg-[#f8fafc] w-[68px] justify-between z-20`}
                      >
                         <span className="text-xl pt-1">{selectedIcon}</span>
                         <ChevronDown size={14} className="text-gray-600" />
                      </button>
                      
                      {isIconPickerOpen && (
                        <>
                           <div className="fixed inset-0 z-30" onClick={() => setIsIconPickerOpen(false)}></div>
                           <div className="absolute top-12 right-0 mt-1 w-56 bg-white border border-gray-200 shadow-xl rounded-md p-3 z-50 grid grid-cols-6 gap-1">
                              {KPI_ICONS.map((icon, i) => (
                                 <button 
                                   key={i} 
                                   onClick={() => { setSelectedIcon(icon); setIsIconPickerOpen(false); }}
                                   className="text-[20px] hover:bg-gray-50 rounded p-1 transition-all"
                                 >
                                   {icon}
                                 </button>
                              ))}
                           </div>
                        </>
                      )}
                   </div>
                </div>

                <div className="mb-6">
                   <input 
                    type="text" 
                    placeholder="Add a description (optional)" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-[14px] font-medium text-gray-700 focus:outline-none focus:border-[#555cf8] bg-[#f8fafc]" 
                   />
                </div>

                <div className="flex gap-6 mb-8 pt-2">
                   <div className="flex-1">
                      <span className="block text-[12px] font-bold text-[#334155] mb-2">When will this KPI be entered?</span>
                      <div className="flex gap-2 items-center">
                         <select 
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value)}
                          className="flex-1 appearance-none border border-gray-200 rounded-md px-4 py-2.5 text-sm font-medium text-gray-800 bg-[#f8fafc] focus:outline-none focus:border-[#555cf8]"
                         >
                            <option>Daily</option><option>Weekly</option><option>Monthly</option>
                         </select>
                         <HelpCircle size={18} className="text-[#a5b4fc]" />
                      </div>
                   </div>
                   <div className="flex-1">
                      <span className="block text-[12px] font-bold text-[#334155] mb-2">What is the Format?</span>
                      <div className="flex gap-2 items-center">
                         <select 
                          value={format}
                          onChange={(e) => setFormat(e.target.value)}
                          className="flex-1 appearance-none border border-gray-200 rounded-md px-4 py-2.5 text-sm font-medium text-gray-800 bg-[#f8fafc] focus:outline-none focus:border-[#555cf8]"
                         >
                            <option>1,234</option><option>$1,234</option><option>12.34%</option>
                         </select>
                         <HelpCircle size={18} className="text-[#a5b4fc]" />
                      </div>
                   </div>
                </div>

                <div className="space-y-4 mb-6 relative z-10">
                   <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                      <div 
                        onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
                        className={`bg-[#eef5fe] px-5 py-4 flex justify-between items-center cursor-pointer hover:bg-[#e2effd] transition-colors`}
                      >
                         <div className="flex items-center gap-3">
                            {isMoreOptionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            <span className="text-[14px] font-bold text-[#1e293b]">More Options</span>
                         </div>
                      </div>
                      {isMoreOptionsOpen && (
                        <div className="p-6 bg-white border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
                           <div className="grid grid-cols-2 gap-8 mb-8">
                              <div><span className="block text-[13px] font-bold text-[#334155] mb-3">Does the KPI have a target?</span>
                                 <div className="flex items-center gap-2"><input type="text" value={hasTarget} onChange={e => setHasTarget(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 bg-[#f8fafc] focus:outline-none text-sm" /><HelpCircle size={18} className="text-[#a5b4fc]" /></div>
                              </div>
                              <div><span className="block text-[13px] font-bold text-[#334155] mb-3">Which direction is best?</span>
                                 <select value={direction} onChange={e => setDirection(e.target.value as 'Up'|'Down')} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-[#f8fafc] text-sm appearance-none"><option>Up</option><option>Down</option></select>
                              </div>
                           </div>
                           <div className="mb-8">
                              <div className="flex items-center justify-between mb-3">
                                <span className="block text-[13px] font-bold text-[#334155]">Assign to specific users?</span>
                                <span className="text-[11px] text-gray-400">Check to assign, then set individual target</span>
                              </div>
                              <div className="border border-gray-200 rounded-lg bg-[#f8fafc] max-h-48 overflow-y-auto p-2">
                                {users.map(u => {
                                  const assigned = assignedUsers.find(au => au.userId === u.id);
                                  const isChecked = !!assigned;
                                  return (
                                    <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded transition-colors">
                                      <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setAssignedUsers([...assignedUsers, { userId: u.id, target: hasTarget || '' }]);
                                          } else {
                                            setAssignedUsers(assignedUsers.filter(au => au.userId !== u.id));
                                          }
                                        }}
                                        className="w-4 h-4 text-[#555cf8] rounded border-gray-300 focus:ring-[#555cf8]"
                                      />
                                      <span className="text-sm font-medium text-gray-700 flex-1">{u.firstName} {u.lastName} <span className="text-gray-400 text-xs">({u.position})</span></span>
                                      {isChecked && (
                                        <input 
                                          type="text" 
                                          value={assigned.target}
                                          onChange={(e) => {
                                            setAssignedUsers(assignedUsers.map(au => au.userId === u.id ? { ...au, target: e.target.value } : au));
                                          }}
                                          placeholder="Target..."
                                          className="w-24 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#555cf8] bg-white shadow-sm"
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                           </div>
                           <div className="mb-8">
                              <span className="block text-[13px] font-bold text-[#334155] mb-4">What are your RAG thresholds?</span>
                              <div className="grid grid-cols-4 gap-4">
                                 <input type="text" value={thresholds.red} onChange={e => setThresholds({...thresholds, red: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#f8fafc] text-center" />
                                 <input type="text" value={thresholds.amberSmall} onChange={e => setThresholds({...thresholds, amberSmall: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#f8fafc] text-center" />
                                 <input type="text" value={thresholds.amberLarge} onChange={e => setThresholds({...thresholds, amberLarge: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#f8fafc] text-center" />
                                 <input type="text" value={thresholds.green} onChange={e => setThresholds({...thresholds, green: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#f8fafc] text-center" />
                              </div>
                           </div>
                           <div><span className="block text-[13px] font-bold text-[#334155] mb-4">What is your working week?</span>
                               <div className="flex gap-2">
                                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                     <button key={day} onClick={() => toggleDay(day)} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${workingDays.includes(day) ? 'bg-[#555cf8] text-white' : 'bg-[#f0f2f5] text-gray-500'}`}>{day}</button>
                                  ))}
                               </div>
                           </div>
                        </div>
                      )}
                   </div>
                   <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                      <div onClick={() => setIsFormulaOpen(!isFormulaOpen)} className="bg-[#eef5fe] px-5 py-4 flex justify-between items-center cursor-pointer hover:bg-[#e2effd] transition-colors">
                         <div className="flex items-center gap-3">{isFormulaOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}<span className="text-[14px] font-bold text-[#1e293b]">Create a formula</span></div>
                      </div>
                      {isFormulaOpen && (
                        <div className="p-6 bg-white border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
                           <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                              {['+', '-', '*', '/', '(', ')'].map(op => (
                                <button key={op} onClick={() => setFormula(f => f + op)} className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors">
                                  {op}
                                </button>
                              ))}
                              <div className="h-8 w-px bg-gray-200 mx-1"></div>
                              <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 whitespace-nowrap">Insert KPI Field</button>
                           </div>
                           <textarea value={formula} onChange={e => setFormula(e.target.value)} className="w-full h-32 border border-blue-100 rounded-xl bg-[#f8fbff] p-4 text-sm focus:outline-none mb-6 shadow-inner resize-none border-dashed" placeholder="Write your formula here. Example: [Sales] * [Rate]" />
                        </div>
                      )}
                   </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-50 relative z-10">
                   <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 rounded-md font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors text-[13px]">Cancel</button>
                   <button onClick={handleSave} className="px-8 py-2.5 rounded-md font-semibold text-white bg-[#555cf8] hover:bg-[#4a51e2] transition-colors text-[13px]">Save Change</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
