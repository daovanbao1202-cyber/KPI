'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, Edit2, Trash2, Plus, BookOpen } from 'lucide-react';

interface GroupItem {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  items: GroupItem[];
  isExpanded: boolean;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([
    {
      id: 'g1',
      name: 'Group 1',
      isExpanded: true,
      items: [
        { id: 'i1', name: 'Group Item 1' }
      ]
    }
  ]);

  const toggleGroup = (groupId: string) => {
    setGroups(groups.map(g => g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g));
  };

  const addGroup = () => {
    const newGroup: Group = {
      id: `g${Date.now()}`,
      name: `New Group ${groups.length + 1}`,
      isExpanded: true,
      items: []
    };
    setGroups([...groups, newGroup]);
  };

  const addItemToGroup = (groupId: string) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          items: [...g.items, { id: `i${Date.now()}`, name: `New Group Item ${g.items.length + 1}` }]
        };
      }
      return g;
    }));
  };

  const deleteGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const deleteItem = (groupId: string, itemId: string) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return { ...g, items: g.items.filter(i => i.id !== itemId) };
      }
      return g;
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f5fa] overflow-y-auto pb-20">
      
      {/* Top Banner */}
      <div className="bg-white border-b border-gray-100 p-8 pt-10 pb-12">
         <div className="max-w-5xl mx-auto pl-2">
            <h1 className="text-[17px] font-bold text-[#1e293b] mb-4">Groups</h1>
            <p className="text-[14px] text-gray-600 max-w-lg leading-relaxed mb-6">
               Organize your KPIs and users into logical groups—by department, team, or project—to keep your workspace tidy and focused.
            </p>
            <button className="flex items-center gap-2 text-[13px] font-bold text-[#334155] hover:text-[#555cf8] transition-colors">
               <BookOpen size={16} className="text-gray-400" /> Creating Groups
            </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto w-full pt-16">
         <div className="flex items-center justify-center gap-4 mb-8">
            <h2 className="text-3xl font-bold text-[#1e293b]">Your Groups</h2>
            <button onClick={addGroup} className="flex items-center gap-1.5 bg-[#e2e8f0]/80 hover:bg-[#cbd5e1] text-[#475569] px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors">
               <Plus size={14} /> Add a Group
            </button>
         </div>

         {/* Groups List */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-100 max-w-2xl mx-auto p-4 mb-20 min-h-[150px]">
            {groups.length === 0 && (
               <div className="p-8 text-center text-gray-400 text-sm">No groups created yet. Click "Add a Group" to start.</div>
            )}
            
            {groups.map((group) => (
               <div key={group.id} className="mb-2">
                  <div className="flex items-center justify-between p-3 px-4 rounded hover:bg-gray-50 transition-colors group">
                     <div className="flex items-center gap-3 cursor-pointer select-none flex-1" onClick={() => toggleGroup(group.id)}>
                        <div className="text-gray-400">
                           {group.isExpanded ? <ChevronUp size={16} strokeWidth={2.5} /> : <ChevronDown size={16} strokeWidth={2.5} />}
                        </div>
                        <span className="font-bold text-[14px] text-[#1e293b]">{group.name}</span>
                     </div>
                     <div className="flex items-center gap-6 text-[#94a3b8] opacity-100 transition-opacity">
                        <Edit2 size={16} className="hover:text-gray-600 cursor-pointer" />
                        <Trash2 size={16} className="hover:text-red-500 cursor-pointer" onClick={() => deleteGroup(group.id)} />
                     </div>
                  </div>

                  {group.isExpanded && (
                     <div className="space-y-1">
                        {group.items.map(item => (
                           <div key={item.id} className="flex items-center justify-between p-3 px-4 bg-[#f4f5f9] rounded-md mx-2 mb-2 group/item">
                              <span className="text-[13px] text-[#475569] font-medium">{item.name}</span>
                              <div className="flex items-center gap-6 text-[#94a3b8] opacity-100 transition-opacity">
                                 <Edit2 size={16} className="hover:text-gray-600 cursor-pointer" />
                                 <Trash2 size={16} className="hover:text-red-500 cursor-pointer" onClick={() => deleteItem(group.id, item.id)} />
                              </div>
                           </div>
                        ))}
                        
                        <div className="pt-1 pb-2 pl-4">
                           <button onClick={() => addItemToGroup(group.id)} className="flex items-center gap-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#64748b] hover:text-[#334155] px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors">
                              <Plus size={14} strokeWidth={2.5} /> Add item
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
