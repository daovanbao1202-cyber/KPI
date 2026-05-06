'use client';

import { useState } from 'react';
import { useKPI } from '@/context/KPIContext';
import { 
  Users, Plus, Edit2, Trash2, 
  ChevronDown, ChevronUp, PlayCircle, 
  ExternalLink, X 
} from 'lucide-react';

export default function GroupsPage() {
  const { 
    groups, groupItems, 
    addGroup, updateGroup, deleteGroup, 
    addGroupItem, updateGroupItem, deleteGroupItem 
  } = useKPI();

  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  const [addingItemToGroupId, setAddingItemToGroupId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');

  const [showBanner, setShowBanner] = useState(true);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim());
      setNewGroupName('');
      setIsAddGroupOpen(false);
    }
  };

  const handleUpdateGroup = (id: string) => {
    if (editingGroupName.trim()) {
      updateGroup(id, editingGroupName.trim());
      setEditingGroupId(null);
    }
  };

  const handleAddItem = (groupId: string) => {
    if (newItemName.trim()) {
      addGroupItem(groupId, newItemName.trim());
      setNewItemName('');
      setAddingItemToGroupId(null);
      // Ensure group is expanded
      setExpandedGroups(prev => ({ ...prev, [groupId]: true }));
    }
  };

  const handleUpdateItem = (id: string) => {
    if (editingItemName.trim()) {
      updateGroupItem(id, editingItemName.trim());
      setEditingItemId(null);
    }
  };

  return (
    <div className="min-h-full bg-[#f8fafc] pb-20 font-sans">
      {/* Header Banner */}
      {showBanner && (
        <div className="bg-white border-b border-gray-100 px-8 py-8 relative">
          <button 
            onClick={() => setShowBanner(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#1e293b] mb-2 flex items-center gap-2">
                Groups
              </h1>
              <p className="text-[#64748b] text-[15px] leading-relaxed max-w-2xl mb-4 text-justify">
                Organize your KPIs and users into logical groups—by department, team, or project—to keep your workspace tidy and focused.
              </p>
              <a href="#" className="flex items-center gap-1.5 text-[#555cf8] text-[14px] font-bold hover:underline">
                <ExternalLink size={14} /> Creating Groups
              </a>
            </div>
            
            <div className="relative group cursor-pointer w-full md:w-[320px] aspect-video rounded-xl overflow-hidden shadow-xl border-4 border-white">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800" 
                alt="Creating Groups Video"
                className="w-full h-full object-cover grayscale-[0.2]"
              />
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-3">
                 <div className="bg-white/20 backdrop-blur-md p-3 rounded-full group-hover:scale-110 transition-transform">
                    <PlayCircle size={48} className="text-white fill-white/20" />
                 </div>
                 <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                    <span className="text-white text-xs font-bold tracking-widest uppercase">Creating Groups</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex items-center justify-center gap-4 mb-12">
          <h2 className="text-3xl font-black text-[#1e293b] tracking-tight">Your Groups</h2>
          <button 
            onClick={() => setIsAddGroupOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 text-[#3b82f6] text-[13px] font-bold rounded-full hover:bg-blue-100 transition-all border border-blue-100"
          >
            <Plus size={16} /> Add a Group
          </button>
        </div>

        {/* Add Group Modal/Form */}
        {isAddGroupOpen && (
          <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-blue-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">New Group Name</h3>
            <div className="flex gap-3">
              <input 
                autoFocus
                type="text" 
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Ex: Engineering Team"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#555cf8]/20 focus:border-[#555cf8] text-sm font-medium"
              />
              <button 
                onClick={handleAddGroup}
                className="px-6 py-3 bg-[#555cf8] text-white rounded-xl text-sm font-bold hover:bg-[#4a51e2] shadow-md transition-all"
              >
                Create Group
              </button>
              <button 
                onClick={() => setIsAddGroupOpen(false)}
                className="px-6 py-3 bg-gray-50 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-50 group">
                <div className="flex items-center gap-3 flex-1">
                  <button 
                    onClick={() => toggleGroup(group.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {expandedGroups[group.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  
                  {editingGroupId === group.id ? (
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                      <input 
                        autoFocus
                        type="text" 
                        value={editingGroupName}
                        onChange={(e) => setEditingGroupName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#555cf8] text-sm font-bold focus:outline-none"
                      />
                      <button onClick={() => handleUpdateGroup(group.id)} className="text-[#555cf8] font-bold text-xs uppercase hover:underline">Save</button>
                    </div>
                  ) : (
                    <span 
                      className="text-[15px] font-extrabold text-[#1e293b] cursor-pointer"
                      onClick={() => toggleGroup(group.id)}
                    >
                      {group.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingGroupId(group.id);
                      setEditingGroupName(group.name);
                    }}
                    className="p-2 text-gray-400 hover:text-[#555cf8] hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteGroup(group.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50/50 space-y-2">
                {expandedGroups[group.id] && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300 mb-4">
                    {groupItems.filter(item => item.groupId === group.id).map(item => (
                      <div key={item.id} className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100 group/item hover:border-blue-100 transition-all">
                        <div className="flex-1">
                          {editingItemId === item.id ? (
                            <div className="flex items-center gap-2">
                              <input 
                                autoFocus
                                type="text" 
                                value={editingItemName}
                                onChange={(e) => setEditingItemName(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-[#555cf8] text-sm focus:outline-none"
                              />
                              <button onClick={() => handleUpdateItem(item.id)} className="text-[#555cf8] font-bold text-xs uppercase hover:underline">Save</button>
                            </div>
                          ) : (
                            <span className="text-sm font-medium text-[#475569]">{item.name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingItemId(item.id);
                              setEditingItemName(item.name);
                            }}
                            className="p-1.5 text-gray-400 hover:text-[#555cf8] rounded-md transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => deleteGroupItem(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-md transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {addingItemToGroupId === group.id ? (
                  <div className="flex gap-2 p-2 bg-white rounded-xl border border-[#555cf8]/30 animate-in fade-in duration-200">
                    <input 
                      autoFocus
                      type="text" 
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Item name..."
                      className="flex-1 px-3 py-2 text-sm focus:outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddItem(group.id)}
                    />
                    <button 
                      onClick={() => handleAddItem(group.id)}
                      className="px-4 py-2 bg-[#555cf8] text-white text-xs font-bold rounded-lg hover:bg-[#4a51e2]"
                    >
                      Add
                    </button>
                    <button 
                      onClick={() => setAddingItemToGroupId(null)}
                      className="px-4 py-2 text-gray-400 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setAddingItemToGroupId(group.id);
                      setExpandedGroups(prev => ({ ...prev, [group.id]: true }));
                    }}
                    className="w-full py-2 flex items-center justify-center gap-1.5 text-[#555cf8]/60 hover:text-[#555cf8] hover:bg-white rounded-xl transition-all border border-dashed border-gray-200 hover:border-[#555cf8]/30 text-[13px] font-bold"
                  >
                    <Plus size={14} /> Add item
                  </button>
                )}
              </div>
            </div>
          ))}

          {groups.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <Users size={24} className="text-gray-300" />
               </div>
               <p className="text-[#64748b] font-medium">No groups created yet.</p>
               <button 
                 onClick={() => setIsAddGroupOpen(true)}
                 className="mt-4 text-[#555cf8] font-bold hover:underline text-sm"
               >
                 Create your first group
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
