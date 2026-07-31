'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ChevronDown, HelpCircle, Search, Edit2, UserCircle, Play, X, UserCheck, BarChart2, CheckCircle2, Upload, Eye, EyeOff } from 'lucide-react';
import { useKPI, User } from '@/context/KPIContext';
import { compressImageToDataUrl } from '@/lib/image';

const DEPARTMENTS = ["Admin & Kế Toán", "Sale", "AE", "FAE1", "FAE2", "PM", "Management"];
const POSITIONS = ["CEO", "Team Leader", "Leader", "Staff/Engineer"];

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser, currentUser, groups, groupItems, saveToDisk } = useKPI();
  const router = useRouter();
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);

  /**
   * Passwords are set through the auth API so they are hashed server-side.
   * Returns an error message, or null on success.
   */
  const setUserPassword = async (targetUserId: number, newPassword: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, newPassword }),
      });
      const payload = await res.json();
      return res.ok ? null : payload.error || 'Không đặt được mật khẩu.';
    } catch {
      return 'Không kết nối được tới máy chủ.';
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role !== 'Admin') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '', 
    role: 'User' as 'Admin' | 'Manager' | 'User', 
    department: 'Sale', 
    position: 'Staff/Engineer', 
    avatar: '',
    assignedGroups: {} as Record<string, string>
  });
  
  const [editForm, setEditForm] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '',
    department: '', 
    position: '', 
    avatar: '',
    password: '',
    assignedGroups: {} as Record<string, string>
  });

  const handleOpenEdit = (user: User) => {
    setEditForm({ 
       firstName: user.firstName, 
       lastName: user.lastName, 
       email: user.email || '',
       department: user.department || 'Sale', 
       position: user.position || 'Staff/Engineer', 
       avatar: user.avatar || '',
       // Never populated from state: the hash lives server-side only. A value
       // here means "set this as the new password".
       password: '',
       assignedGroups: user.assignedGroups || {}
    });
    setEditingUser(user);
    setIsChangingPassword(false);
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa user này không? / Are you sure you want to delete this user?")) {
      await deleteUser(userId);
      setEditingUser(null);
    }
  };

  const handleGroupAssignmentChange = (groupId: string, itemId: string) => {
    setEditForm(prev => ({
      ...prev,
      assignedGroups: {
        ...prev.assignedGroups,
        [groupId]: itemId
      }
    }));
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Downscale before storing: full-resolution base64 avatars were the bulk
    // of the saved payload.
    const avatar = await compressImageToDataUrl(file);
    if (isEdit) {
      setEditForm(prev => ({ ...prev, avatar }));
    } else {
      setAddForm(prev => ({ ...prev, avatar }));
    }
  };

  const handleSaveAdd = async () => {
    const newId = addUser({
      firstName: addForm.firstName,
      lastName: addForm.lastName,
      email: addForm.email,
      role: addForm.role as 'Admin' | 'Manager' | 'User',
      department: addForm.department,
      position: addForm.position,
      avatar: addForm.avatar || `https://i.pravatar.cc/150?u=${Math.random()}`,
      assignedGroups: addForm.assignedGroups
    });

    if (addForm.password) {
      // Sync the row first so the server can attach the hash to an existing user.
      await saveToDisk();
      const failure = await setUserPassword(newId, addForm.password);
      setPasswordNotice(
        failure
          ? `Đã tạo user nhưng chưa đặt được mật khẩu: ${failure}`
          : 'Đã tạo user và đặt mật khẩu thành công.'
      );
    }

    setIsAddModalOpen(false);
    setAddForm({ 
      firstName: '', 
      lastName: '', 
      email: '', 
      password: '', 
      role: 'User' as 'Admin' | 'Manager' | 'User', 
      department: 'Sale', 
      position: 'Staff/Engineer', 
      avatar: '',
      assignedGroups: {}
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    updateUser(editingUser.id, {
       firstName: editForm.firstName,
       lastName: editForm.lastName,
       email: editForm.email,
       department: editForm.department,
       position: editForm.position,
       avatar: editForm.avatar || editingUser.avatar,
       assignedGroups: editForm.assignedGroups
    });

    // A non-empty field means the Admin is resetting this user's password.
    if (editForm.password) {
      const failure = await setUserPassword(editingUser.id, editForm.password);
      setPasswordNotice(failure ?? 'Đã đặt lại mật khẩu thành công.');
    }

    setEditingUser(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f5f8] pb-10">

      {passwordNotice && (
        <div className="mx-6 mt-4 flex items-start justify-between gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <span>{passwordNotice}</span>
          <button
            type="button"
            onClick={() => setPasswordNotice(null)}
            className="shrink-0 text-blue-500 hover:text-blue-700"
            aria-label="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white px-6 py-2 border-b border-gray-100 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-4 relative">
           <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1.5 text-gray-600 font-medium bg-gray-50 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-100 text-[13px]">
             <Plus size={14} /> Add a User <ChevronDown size={14} />
           </button>
           
           <div className="group relative">
             <button className="flex items-center gap-1 text-gray-600 font-medium hover:text-gray-800 text-[13px]">
               More Options <ChevronDown size={14} />
             </button>
             <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-100 shadow-lg rounded py-1 hidden group-hover:block z-50">
                <Link href="/dashboard/groups" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Manage Groups</Link>
             </div>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-gray-600 border border-transparent px-3 py-1.5 rounded hover:bg-gray-50 text-[13px] font-medium">
            Learn <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col min-h-0">
        
        {/* Hero Banner */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 mb-6 flex justify-between items-start shrink-0 relative overflow-hidden">
           <div className="max-w-xl z-10">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Creating and Managing Users</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                 Manage who can view or edit your KPIs, dashboards, and reports. Assign roles and permissions to keep your data secure and organized.
              </p>
              <div className="flex items-center gap-6">
                 <button className="flex items-center gap-2 text-[13px] font-medium text-gray-700 hover:text-[#555cf8]"><Plus size={16} /> Adding Users</button>
                 <button className="flex items-center gap-2 text-[13px] font-medium text-gray-700 hover:text-[#555cf8]"><UserCheck size={16} /> Managing Roles</button>
                 <button className="flex items-center gap-2 text-[13px] font-medium text-gray-700 hover:text-[#555cf8]"><BarChart2 size={16} /> Data Users</button>
                 <button className="flex items-center gap-2 text-[13px] font-medium text-gray-700 hover:text-[#555cf8]"><CheckCircle2 size={16} /> Inviting Users</button>
              </div>
           </div>

           <div className="w-[300px] h-[140px] bg-gradient-to-br from-[#6a6ff8] to-[#4044c9] rounded-lg relative overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner cursor-pointer group z-10">
              <div className="absolute top-2 right-2 text-white/50 hover:text-white"><X size={14} /></div>
              <div className="text-white text-xl font-medium absolute left-6">Adding<br/>Users</div>
              <div className="w-14 h-14 bg-[#1a1f3c] text-white rounded-full flex items-center justify-center pl-1 group-hover:scale-110 transition-transform">
                 <Play fill="currentColor" size={24} />
              </div>
              <div className="absolute bottom-6 right-6 bg-white w-24 h-12 rounded shadow-lg overflow-hidden flex flex-col items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-gray-500 font-bold mb-1">Users</span>
                <span className="text-xs font-bold text-gray-800">Demo</span>
              </div>
           </div>
           
           <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent z-0 pointer-events-none"></div>
        </div>

        {/* Table Area */}
        <div className="bg-white border border-gray-100 rounded shadow-sm flex flex-col flex-1 overflow-hidden">
           
           {/* Section Tabs & Search */}
           <div className="px-6 border-b border-gray-100 flex items-center justify-between bg-white pt-2">
              <div className="flex items-center gap-6 h-full">
                 <div className="text-[13px] font-bold text-gray-800 border-b-2 border-gray-800 py-3 cursor-pointer">Active Users</div>
                 <div className="text-[13px] font-medium text-gray-500 hover:text-gray-800 py-3 cursor-pointer">Data Users</div>
              </div>
              
              <div className="relative w-64 pb-2">
                 <Search size={16} className="absolute left-3 top-[35%] -translate-y-1/2 text-gray-400" />
                 <input type="text" className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-[#555cf8] transition-colors" />
              </div>
           </div>

           {/* Table */}
           <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                 <thead>
                    <tr className="bg-white border-b border-gray-100 text-[11px] font-bold text-gray-800 uppercase tracking-wide">
                       <th className="p-3 pl-6 w-12"></th>
                       <th className="p-3 w-16 text-center">ID ↕</th>
                       <th className="p-3">User info ↕</th>
                       <th className="p-3">Department ↕</th>
                       <th className="p-3 text-center">Type ↕</th>
                       <th className="p-3 text-center">Assign</th>
                       <th className="p-3 text-center">Stats</th>
                       <th className="p-3 text-center">Active</th>
                       <th className="p-3 w-16 text-center">⋮ ˅</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 text-[13px]">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                         <td className="p-3 pl-6 text-center">
                            <Edit2 size={14} className="text-gray-300 group-hover:text-gray-500 cursor-pointer hover:text-[#555cf8]" onClick={() => handleOpenEdit(user)} />
                         </td>
                         <td className="p-3 text-center font-medium text-gray-500">{user.id}</td>
                         <td className="p-3 flex items-center gap-3">
                            {user.avatar ? <img className="w-9 h-9 object-cover rounded-full border border-gray-200" src={user.avatar} alt={user.firstName} /> : <UserCircle size={36} className="text-gray-400" />}
                            <div>
                               <span className="font-bold text-gray-800 block">{user.firstName} {user.lastName}</span>
                               <span className="text-gray-500 text-[11px]">{user.email}</span>
                            </div>
                         </td>
                         <td className="p-3 text-gray-600">
                            <span className="font-medium text-gray-800 block">{user.department || '-'}</span>
                            <span className="text-[11px] text-gray-500 inline-flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded-sm">{user.position || '-'}</span>
                         </td>
                         <td className="p-3 text-center text-gray-600 font-medium">{user.role}</td>
                         <td className="p-3 flex justify-center mt-2.5">
                            <div className="bg-[#6b7280] text-white px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 w-max">
                               <span className="w-3 h-3 bg-white/20 rounded-full flex items-center justify-center">✓</span> KPIs
                            </div>
                         </td>
                         <td className="p-3 text-center">
                            <BarChart2 size={16} className="text-gray-400 mx-auto mt-2" />
                         </td>
                         <td className="p-3 text-center">
                            <button className="bg-[#949bb2] hover:bg-[#6b7280] text-white px-3 py-1 rounded-full text-[11px] font-semibold transition-colors w-16 mt-2">
                                Lock
                            </button>
                         </td>
                         <td className="p-3 text-center text-gray-300 font-bold">...</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-[#384252]/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto">
             <div className="flex justify-between items-start p-6 pb-2">
                <div className="flex items-center gap-3">
                   <h2 className="text-[22px] font-bold text-[#1e293b]">Edit this User</h2>
                </div>
                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
             </div>
             
             <div className="p-6">
                <div className="flex items-center gap-6 mb-8 mt-2">
                   <label className="flex items-center gap-4 cursor-pointer group bg-gray-50 border border-gray-100 pr-4 rounded-full transition-colors hover:bg-gray-100">
                     <div className="relative">
                        {editForm.avatar ? <img className="w-16 h-16 rounded-full border border-gray-200 object-cover shadow-sm" src={editForm.avatar} alt="avatar" /> : <UserCircle size={64} className="text-gray-300 bg-white rounded-full" strokeWidth={1} />}
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <Upload size={20} className="text-white" />
                        </div>
                     </div>
                     <span className="text-[13px] font-bold text-[#555cf8] tracking-wide">Update Photo from PC</span>
                     <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, true)} />
                   </label>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                   <div>
                     <label className="block text-[13px] font-bold text-[#334155] mb-2">First name</label>
                     <input type="text" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#555cf8] transition-all bg-[#f8fafc]" />
                   </div>
                   <div>
                     <label className="block text-[13px] font-bold text-[#334155] mb-2">Last name</label>
                     <input type="text" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#555cf8] transition-all bg-[#f8fafc]" />
                   </div>
                   <div>
                     <label className="block text-[13px] font-bold text-[#334155] mb-2">Department</label>
                     <select value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#555cf8] bg-[#f8fafc]">
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block text-[13px] font-bold text-[#334155] mb-2">Position</label>
                     <select value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#555cf8] bg-[#f8fafc]">
                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                     </select>
                   </div>
                   <div className="col-span-2">
                     <label className="block text-[13px] font-bold text-[#334155] mb-2">Email Address</label>
                     <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#555cf8] transition-all bg-[#f8fafc]" />
                   </div>
                   <div className="col-span-2">
                     <label className="block text-[13px] font-bold text-[#334155] mb-2">Password</label>
                     {!isChangingPassword ? (
                        <div className="flex items-center gap-3">
                          {/* Hashes are never sent to the browser, so there is
                              nothing to reveal here any more. */}
                          <div className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500">
                            Mật khẩu được mã hoá và lưu trên máy chủ
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsChangingPassword(true)}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors border border-gray-200"
                          >
                            Đặt lại mật khẩu
                          </button>
                        </div>
                     ) : (
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <input 
                              type={showEditPassword ? "text" : "password"} 
                              value={editForm.password || ''} 
                              onChange={e => setEditForm({...editForm, password: e.target.value})} 
                              placeholder="Nhập mật khẩu mới..." 
                              className="w-full border border-[#555cf8] rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#555cf8] transition-all bg-white" 
                              autoFocus
                            />
                            <button 
                              type="button"
                              onClick={() => setShowEditPassword(!showEditPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setIsChangingPassword(false)}
                            className="px-4 py-2 bg-[#555cf8] hover:bg-[#4044c9] text-white text-sm font-medium rounded-md transition-colors"
                          >
                            Xác nhận
                          </button>
                        </div>
                     )}
                   </div>
                </div>

                {/* NEW ASSIGNMENT SECTION */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                   <h3 className="text-[17px] font-bold text-[#555cf8] mb-1 flex items-center gap-2">
                     Assign user to data groups <HelpCircle size={16} className="text-[#555cf8]/60" />
                   </h3>
                   <div className="grid grid-cols-2 gap-x-12 gap-y-6 mt-6">
                      {groups.map(group => (
                        <div key={group.id}>
                          <label className="block text-[13px] font-bold text-[#334155] mb-2">{group.name}</label>
                          <select 
                            value={editForm.assignedGroups[group.id] || ''} 
                            onChange={e => handleGroupAssignmentChange(group.id, e.target.value)}
                            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#555cf8] bg-[#f8fafc]"
                          >
                             <option value="">(Not set)</option>
                             {groupItems.filter(item => item.groupId === group.id).map(item => (
                               <option key={item.id} value={item.id}>{item.name}</option>
                             ))}
                          </select>
                        </div>
                      ))}
                      {groups.length === 0 && (
                        <div className="col-span-2 py-4 px-6 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-center">
                           <p className="text-sm text-gray-500">No data groups available. Go to <Link href="/dashboard/groups" className="text-[#555cf8] hover:underline font-bold">Groups</Link> to create some.</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>

              <div className="bg-white p-6 pt-2 flex justify-between items-center rounded-b-lg border-t border-gray-50 mt-4">
                 <div>
                    {currentUser?.role === 'Admin' && (
                       <button 
                          onClick={() => handleDeleteUser(editingUser.id)}
                          className="px-6 py-2.5 rounded-md font-bold text-white bg-red-500 hover:bg-red-600 transition-colors text-sm shadow-sm"
                       >
                          Xóa User / Delete User
                       </button>
                    )}
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => setEditingUser(null)} className="px-6 py-2 rounded-md font-medium text-white bg-[#cbd5e1] hover:bg-[#94a3b8] transition-colors text-sm shadow-sm">Cancel</button>
                    <button onClick={handleSaveEdit} className="px-6 py-2 rounded-md font-medium text-white bg-[#666cf8] hover:bg-[#555cf8] transition-colors text-sm shadow-sm">Save</button>
                 </div>
              </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#384252]/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
             <div className="flex justify-between items-start p-6 pb-2 sticky top-0 bg-white z-10 border-b border-transparent">
                <div className="flex items-center gap-3">
                   <h2 className="text-[22px] font-bold text-[#1e293b]">Add New User</h2>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
             </div>
             
             <div className="p-6">
                <div className="flex items-center gap-6 mb-8 mt-2">
                   <label className="flex items-center gap-4 cursor-pointer group bg-gray-50 border border-gray-100 pr-4 rounded-full transition-colors hover:bg-gray-100">
                     <div className="relative">
                        {addForm.avatar ? <img className="w-16 h-16 rounded-full border border-gray-200 object-cover shadow-sm" src={addForm.avatar} alt="avatar" /> : <UserCircle size={64} className="text-gray-300 bg-white rounded-full" strokeWidth={1} />}
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <Upload size={20} className="text-white" />
                        </div>
                     </div>
                     <span className="text-[13px] font-bold text-[#555cf8] tracking-wide">Upload Photo from PC</span>
                     <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, false)} />
                   </label>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                   <div>
                     <label className="block text-[13px] font-bold text-[#334155] mb-2">First name</label>
                     <input type="text" value={addForm.firstName} onChange={e => setAddForm({...addForm, firstName: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#555cf8] transition-all bg-[#f8fafc]" />
                   </div>
                   <div>
                     <label className="block text-[13px] font-bold text-[#334155] mb-2">Last name</label>
                     <input type="text" value={addForm.lastName} onChange={e => setAddForm({...addForm, lastName: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#555cf8] transition-all bg-[#f8fafc]" />
                   </div>
                   <div>
                     <label className="block text-[13px] font-bold text-[#334155] mb-2">Email</label>
                     <input type="email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#555cf8] transition-all bg-[#f8fafc]" />
                   </div>
                   <div>
                     <label className="block text-[13px] font-bold text-[#334155] mb-2">Password</label>
                     <div className="relative">
                       <input 
                         type={showAddPassword ? "text" : "password"} 
                         value={addForm.password} 
                         onChange={e => setAddForm({...addForm, password: e.target.value})} 
                         className="w-full border border-gray-200 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[#555cf8] transition-all bg-[#f8fafc]" 
                       />
                       <button 
                         type="button"
                         onClick={() => setShowAddPassword(!showAddPassword)}
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                       >
                         {showAddPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                       </button>
                     </div>
                   </div>
                   
                   {/* NEW FIELDS: Department and Position */}
                   <div>
                     <label className="block text-[13px] font-bold text-[#334155] mb-2">Department</label>
                     <select value={addForm.department} onChange={e => setAddForm({...addForm, department: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#555cf8] bg-[#f8fafc]">
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block text-[13px] font-bold text-[#334155] mb-2">Position</label>
                     <select value={addForm.position} onChange={e => setAddForm({...addForm, position: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#555cf8] bg-[#f8fafc]">
                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                     </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-6">
                   <div>
                     <h3 className="text-[17px] font-normal text-[#555cf8] mb-4">Role</h3>
                     <div className="space-y-3">
                        {['User', 'Manager', 'Admin'].map(r => (
                          <label key={r} className="flex items-center gap-3 cursor-pointer group">
                             <div className="relative flex items-center justify-center">
                               <input type="radio" name="role" value={r} checked={addForm.role === r} onChange={() => setAddForm({...addForm, role: r as 'Admin' | 'Manager' | 'User'})} className="peer appearance-none w-5 h-5 border border-gray-300 rounded-full checked:border-[#0ea5e9] transition-colors" />
                               {addForm.role === r && <div className="absolute w-2.5 h-2.5 bg-[#0ea5e9] rounded-full pointer-events-none"></div>}
                             </div>
                             <span className="text-[13px] text-[#334155] font-medium">{r}</span>
                          </label>
                        ))}
                     </div>
                   </div>
                </div>
             </div>

             <div className="bg-white p-6 pt-2 flex justify-end gap-3 sticky bottom-0 border-t border-transparent">
                <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 rounded-md font-medium text-white bg-[#cbd5e1] hover:bg-[#94a3b8] transition-colors text-sm shadow-sm">Cancel</button>
                <button onClick={handleSaveAdd} className="px-6 py-2 rounded-md font-medium text-white bg-[#666cf8] hover:bg-[#555cf8] transition-colors text-sm shadow-sm">Save</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
