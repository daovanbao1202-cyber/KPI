'use client';

import { useKPI } from '@/context/KPIContext';
import { LayoutDashboard, Users, User, ChevronDown } from 'lucide-react';
import { useEffect, useMemo } from 'react';

export default function ViewSelector() {
  const { 
    viewLevel, setViewLevel, 
    viewFilter, setViewFilter, 
    users, currentUser
  } = useKPI();

  const departments = useMemo(() => {
    return Array.from(new Set(users.map(u => u.department).filter(Boolean))).sort();
  }, [users]);
  
  const userRole = currentUser?.role || 'User';

  useEffect(() => {
    if (!currentUser) return;

    if (userRole === 'User') {
      if (viewLevel !== 'Individual' || String(viewFilter) !== String(currentUser.id)) {
        setViewLevel('Individual');
        setViewFilter(currentUser.id);
      }
    } else if (userRole === 'Manager' && viewLevel === 'Company') {
      setViewLevel('Department');
      setViewFilter(currentUser.department || 'Unassigned');
    }
  }, [userRole, currentUser?.id, viewLevel, viewFilter]); // Stable dependencies

  const handleLevelChange = (level: 'Company' | 'Department' | 'Individual') => {
    if (userRole === 'User' && (level !== 'Individual')) return;
    if (userRole === 'Manager' && level === 'Company') return;

    setViewLevel(level);
    if (level === 'Company') setViewFilter('All');
    if (level === 'Department') setViewFilter(currentUser?.department || departments[0] || 'Unassigned');
    if (level === 'Individual') setViewFilter(currentUser?.id || 1);
  };

  return (
    <div className="px-6 py-2 flex items-center z-30">
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
        {userRole === 'Admin' && (
          <button 
            onClick={() => handleLevelChange('Company')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewLevel === 'Company' ? 'bg-white text-[#555cf8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutDashboard size={14} /> Company
          </button>
        )}
        
        {(userRole === 'Admin' || userRole === 'Manager') && (
          <button 
            onClick={() => handleLevelChange('Department')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewLevel === 'Department' ? 'bg-white text-[#555cf8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Users size={14} /> Department
          </button>
        )}

        <button 
          onClick={() => handleLevelChange('Individual')}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewLevel === 'Individual' ? 'bg-white text-[#555cf8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <User size={14} /> Individual
        </button>

      </div>
      
      {viewLevel !== 'Company' && userRole !== 'User' && (
        <div className="ml-6 flex items-center gap-3">
          <span className="text-[11px] font-black uppercase text-gray-500 whitespace-nowrap">
            {viewLevel === 'Department' ? 'Chọn bộ phận:' : 'Chọn nhân viên:'}
          </span>
          <div className="relative group min-w-[160px]">
            <select 
              value={String(viewFilter)}
              onChange={(e) => {
                const val = e.target.value;
                const isIndividual = viewLevel === 'Individual';
                setViewFilter(isIndividual ? Number(val) : val);
              }}
              className="w-full bg-white text-gray-700 pl-4 pr-10 py-1.5 rounded-lg border border-gray-200 text-[12px] font-bold shadow-sm cursor-pointer hover:border-gray-300 outline-none transition-all focus:ring-2 focus:ring-[#555cf8]/20"
            >
              {viewLevel === 'Department' ? (
                departments.map(dept => (
                  <option key={String(dept)} value={String(dept)}>{String(dept)}</option>
                ))
              ) : (
                users.map(u => (
                  <option key={String(u.id)} value={String(u.id)}>{u.firstName} {u.lastName} ({u.department || 'N/A'})</option>
                ))
              )}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
