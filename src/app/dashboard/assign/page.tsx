'use client';

import { useState } from 'react';
import { useKPI } from '@/context/KPIContext';
import { Target, User, Plus, Trash2, Edit2, Search, Filter } from 'lucide-react';

export default function AssignKPIsPage() {
  const { users, kpiDefs, userTargets, setTarget } = useKPI();
  
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedKpiId, setSelectedKpiId] = useState<string>('');
  const [targetValue, setTargetValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId === '' || !selectedKpiId || !targetValue) {
      alert('Vui lòng chọn đầy đủ thông tin');
      return;
    }

    setTarget(selectedKpiId, selectedUserId as number, parseFloat(targetValue));
    
    // Reset form
    if (!isEditing) {
      setTargetValue('');
    }
    setIsEditing(false);
  };

  const currentAssignments = userTargets.map(tgt => {
    const user = users.find(u => u.id === tgt.userId);
    const kpi = kpiDefs.find(k => k.id === tgt.kpiId);
    return {
      ...tgt,
      userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
      kpiName: kpi ? kpi.name : 'Unknown KPI',
      kpiIcon: kpi ? kpi.icon : '🎯',
      kpiUnit: kpi ? kpi.unit : ''
    };
  });

  return (
    <div className="flex flex-col h-full bg-[#f4f5f8] p-6 gap-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Target className="text-[#555cf8]" size={28} />
          Assign KPIs to Users
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-0">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Plus size={20} className="text-[#555cf8]" />
            {isEditing ? 'Edit Assignment' : 'New Assignment'}
          </h2>
          
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select User</label>
              <div className="relative">
                <select 
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#555cf8]/20 transition-all"
                  disabled={isEditing}
                >
                  <option value="">Select a user...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.position})</option>
                  ))}
                </select>
                <User size={16} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select KPI</label>
              <div className="relative">
                <select 
                  value={selectedKpiId}
                  onChange={(e) => setSelectedKpiId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#555cf8]/20 transition-all"
                  disabled={isEditing}
                >
                  <option value="">Select a KPI...</option>
                  {kpiDefs.map(k => (
                    <option key={k.id} value={k.id}>{k.icon} {k.name} ({k.frequency})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Value</label>
              <div className="relative">
                <input 
                  type="number"
                  placeholder="0.00"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#555cf8]/20 transition-all text-right font-bold"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Value</span>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#555cf8] hover:bg-[#4a51e2] text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 mt-2"
            >
              {isEditing ? 'Update Target' : 'Assign Target'}
            </button>
            
            {isEditing && (
              <button 
                type="button"
                onClick={() => { setIsEditing(false); setSelectedUserId(''); setSelectedKpiId(''); setTargetValue(''); }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-lg transition-all mt-2"
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* Existing Assignments Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
            <h2 className="text-lg font-bold text-gray-800">Current Assignments</h2>
            <div className="relative w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search assignments..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {currentAssignments.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <Target size={48} className="text-gray-200 mb-4" />
                <h3 className="text-lg font-bold text-gray-500">No Assignments Yet</h3>
                <p className="text-gray-400 max-w-sm mt-1">Start assigning KPIs to your team members by using the form on the left.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4 pl-6">User</th>
                    <th className="p-4">KPI</th>
                    <th className="p-4 text-right">Target Value</th>
                    <th className="p-4 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[13px]">
                  {currentAssignments.map((tgt) => (
                    <tr key={tgt.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-gray-800">{tgt.userName}</div>
                        <div className="text-[11px] text-gray-500">User ID: {tgt.userId}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="text-lg">{tgt.kpiIcon}</span>
                          <span className="font-medium">{tgt.kpiName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-bold text-[#555cf8] tabular-nums">
                        {tgt.targetValue.toLocaleString()} <span className="text-[11px] text-gray-400 font-normal ml-1">{tgt.kpiUnit}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => {
                              setSelectedUserId(tgt.userId);
                              setSelectedKpiId(tgt.kpiId);
                              setTargetValue(tgt.targetValue.toString());
                              setIsEditing(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
