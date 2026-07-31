'use client';

import { useState, useEffect } from 'react';
import { X, Upload, UserCircle, Shield, Bell, Moon, Sun, Globe, Mail, Key, HardDrive, Download, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useKPI, User } from '@/context/KPIContext';
import { compressImageToDataUrl } from '@/lib/image';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'profile' | 'settings';
}

const DEPARTMENTS = ["Admin & Kế Toán", "Sale", "AE", "FAE1", "FAE2", "PM", "Management"];
const POSITIONS = ["CEO", "Team Leader", "Leader", "Staff/Engineer"];

export default function UserProfileModal({ isOpen, onClose, type }: UserProfileModalProps) {
  const { currentUser, updateUser, userSettings, updateUserSettings, kpiDefs, userActuals, userTargets, dashboardCharts, groups, groupItems, users, reports, importData, saveToDisk, loadFromDisk } = useKPI();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'data'>(type as any);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    department: '',
    position: '',
    avatar: ''
  });

  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    setActiveTab(type);
  }, [type]);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        department: currentUser.department || 'Sale',
        position: currentUser.position || 'Staff/Engineer',
        avatar: currentUser.avatar || ''
      });
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (currentUser) {
      updateUser(currentUser.id, formData);
      onClose();
    }
  };

  /** The server verifies the current password and stores the new hash. */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentUser) return;

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Mật khẩu mới không trùng khớp / New passwords do not match.');
      return;
    }

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = await res.json();

      if (!res.ok) {
        setPasswordError(payload.error || 'Không đổi được mật khẩu.');
        return;
      }

      setPasswordSuccess('Mật khẩu đã được thay đổi thành công! / Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch {
      setPasswordError('Không kết nối được tới máy chủ.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Downscale before storing to keep the saved payload small.
    const avatar = await compressImageToDataUrl(file);
    setFormData(prev => ({ ...prev, avatar }));
  };

  return (
    <div className="fixed inset-0 bg-[#384252]/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
           <div className="flex items-center gap-4">
              <div className="p-2 bg-[#555cf8]/10 rounded-lg text-[#555cf8]">
                 {activeTab === 'profile' ? <UserCircle size={24} /> : <Shield size={24} />}
              </div>
              <div>
                 <h2 className="text-xl font-bold text-gray-800">{activeTab === 'profile' ? 'My Profile' : 'Account Settings'}</h2>
                 <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Personal Account Access</p>
              </div>
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
           {/* Sidebar Tabs */}
           <div className="w-64 bg-gray-50 border-r border-gray-100 p-6 flex flex-col gap-2">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white text-[#555cf8] shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <UserCircle size={18} /> Basic Info
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-white text-[#555cf8] shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <Shield size={18} /> Security & Settings
              </button>
              <button 
                onClick={() => setActiveTab('data')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'data' ? 'bg-white text-[#555cf8] shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <HardDrive size={18} /> Data Management
              </button>
              <div className="mt-auto pt-6 border-t border-gray-200">
                 <div className="flex items-center gap-3 px-4">
                    <img src={currentUser?.avatar} className="w-8 h-8 rounded-full border border-gray-200 object-cover" alt="" />
                    <div className="flex flex-col">
                       <span className="text-[11px] font-bold text-gray-800 leading-none">{currentUser?.firstName}</span>
                       <span className="text-[10px] text-gray-400 font-bold uppercase">{currentUser?.role}</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Content Area */}
           <div className="flex-1 overflow-y-auto p-8 bg-white">
              {activeTab === 'profile' ? (
                <div className="max-w-xl animate-in slide-in-from-right-4 duration-300">
                   {/* Avatar Upload */}
                   <div className="flex items-center gap-6 mb-10">
                      <div className="relative group">
                         {formData.avatar ? (
                           <img src={formData.avatar} className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover" alt="avatar" />
                         ) : (
                           <div className="w-24 h-24 rounded-full bg-blue-50 border-4 border-white shadow-lg flex items-center justify-center text-[#555cf8]">
                              <UserCircle size={48} strokeWidth={1} />
                           </div>
                         )}
                         <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Upload className="text-white" size={24} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                         </label>
                      </div>
                      <div>
                         <h3 className="font-bold text-gray-800">Your Avatar</h3>
                         <p className="text-xs text-gray-400 mb-2">JPG, GIF or PNG. Max size 2MB</p>
                         <label className="text-[11px] font-bold text-[#555cf8] hover:underline cursor-pointer">Update Photo from PC</label>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6 mb-8">
                      <div>
                        <label className="block text-[13px] font-bold text-gray-700 mb-2">First Name</label>
                        <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#555cf8] transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-gray-700 mb-2">Last Name</label>
                        <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#555cf8] transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-gray-700 mb-2">Department</label>
                        <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#555cf8] transition-colors">
                           {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-gray-700 mb-2">Position</label>
                        <select value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#555cf8] transition-colors">
                           {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                   </div>
                </div>
              ) : activeTab === 'settings' ? (
                <div className="max-w-xl animate-in slide-in-from-right-4 duration-300 space-y-8">
                   {/* Visual Settings */}
                   <section>
                      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Moon size={16} className="text-gray-400" /> Interface Preference
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                         <div 
                           onClick={() => updateUserSettings({ theme: 'light' })}
                           className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col gap-3 transition-all ${userSettings.theme === 'light' ? 'border-[#555cf8] bg-white shadow-md' : 'border-transparent bg-gray-50 opacity-60'}`}
                         >
                            <div className="flex justify-between items-center">
                               <Sun size={20} className={userSettings.theme === 'light' ? 'text-orange-400' : 'text-gray-400'} />
                               <div className={`w-4 h-4 rounded-full border-4 ${userSettings.theme === 'light' ? 'border-[#555cf8] bg-white' : 'border-gray-300 bg-white'}`}></div>
                            </div>
                            <span className={`text-sm font-bold ${userSettings.theme === 'light' ? 'text-gray-800' : 'text-gray-400'}`}>Light Mode</span>
                         </div>
                         <div 
                           onClick={() => updateUserSettings({ theme: 'dark' })}
                           className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col gap-3 transition-all ${userSettings.theme === 'dark' ? 'border-[#555cf8] bg-white shadow-md' : 'border-transparent bg-gray-50 opacity-60'}`}
                         >
                            <div className="flex justify-between items-center">
                               <Moon size={20} className={userSettings.theme === 'dark' ? 'text-blue-500' : 'text-gray-400'} />
                               <div className={`w-4 h-4 rounded-full border-4 ${userSettings.theme === 'dark' ? 'border-[#555cf8] bg-white' : 'border-gray-300 bg-white'}`}></div>
                            </div>
                            <span className={`text-sm font-bold ${userSettings.theme === 'dark' ? 'text-gray-800' : 'text-gray-400'}`}>Dark Mode</span>
                         </div>
                      </div>
                   </section>

                   {/* Security Settings */}
                   <section>
                      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Shield size={16} className="text-gray-400" /> Account Security
                      </h3>
                      <div className="space-y-3">
                         <div 
                           onClick={() => updateUserSettings({ enable2FA: !userSettings.enable2FA })}
                           className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                         >
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                  <Key size={16} />
                                </div>
                               <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-800 uppercase tracking-tighter">Two-Factor Authentication</span>
                                  <span className="text-[11px] text-gray-400">Add an extra layer of security to your account</span>
                               </div>
                            </div>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${userSettings.enable2FA ? 'bg-[#555cf8]' : 'bg-gray-200'}`}>
                               <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${userSettings.enable2FA ? 'right-1' : 'left-1'}`}></div>
                            </div>
                         </div>
                         <div 
                           onClick={() => updateUserSettings({ emailNotifications: !userSettings.emailNotifications })}
                           className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                         >
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                  <Mail size={16} />
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-800 uppercase tracking-tighter">Email Notifications</span>
                                  <span className="text-[11px] text-gray-400">Receive KPI alerts and updates via email</span>
                               </div>
                            </div>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${userSettings.emailNotifications ? 'bg-[#555cf8]' : 'bg-gray-200'}`}>
                               <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${userSettings.emailNotifications ? 'right-1' : 'left-1'}`}></div>
                            </div>
                         </div>
                      </div>
                   </section>

                   {/* Change Password */}
                   <section className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100/80">
                      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Key size={16} className="text-gray-400" /> Thay đổi mật khẩu / Change Password
                      </h3>
                      
                      {passwordError && (
                         <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>{passwordError}</span>
                         </div>
                      )}

                      {passwordSuccess && (
                         <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-2.5 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 size={14} className="shrink-0" />
                            <span>{passwordSuccess}</span>
                         </div>
                      )}

                      <form onSubmit={handleChangePassword} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                               <label className="block text-xs font-bold text-gray-600 mb-1.5">Mật khẩu hiện tại / Current Password</label>
                               <input 
                                  type="password" 
                                  required
                                  value={currentPassword}
                                  onChange={e => setCurrentPassword(e.target.value)}
                                  placeholder="••••••••" 
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#555cf8] transition-colors" 
                               />
                            </div>
                            <div>
                               <label className="block text-xs font-bold text-gray-600 mb-1.5">Mật khẩu mới / New Password</label>
                               <input 
                                  type="password" 
                                  required
                                  value={newPassword}
                                  onChange={e => setNewPassword(e.target.value)}
                                  placeholder="••••••••" 
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#555cf8] transition-colors" 
                               />
                            </div>
                            <div>
                               <label className="block text-xs font-bold text-gray-600 mb-1.5">Xác nhận mật khẩu / Confirm Password</label>
                               <input 
                                  type="password" 
                                  required
                                  value={confirmNewPassword}
                                  onChange={e => setConfirmNewPassword(e.target.value)}
                                  placeholder="••••••••" 
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#555cf8] transition-colors" 
                               />
                            </div>
                         </div>
                         <button 
                            type="submit"
                            className="bg-[#555cf8] hover:bg-[#4a51e2] text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
                         >
                            Update Password
                         </button>
                      </form>
                   </section>

                   <section>
                      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Globe size={16} className="text-gray-400" /> Localization
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                         <select 
                           value={userSettings.language}
                           onChange={e => updateUserSettings({ language: e.target.value })}
                           className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none"
                         >
                            <option>Tiếng Việt</option>
                            <option>English</option>
                            <option>日本語</option>
                         </select>
                         <select 
                           value={userSettings.timezone}
                           onChange={e => updateUserSettings({ timezone: e.target.value })}
                           className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none"
                         >
                            <option>(GMT+07:00) Bangkok, Hanoi</option>
                            <option>(GMT-08:00) Pacific Time</option>
                         </select>
                      </div>
                   </section>
                </div>
              ) : (
                <div className="max-w-xl animate-in slide-in-from-right-4 duration-300 space-y-8">
                   <section>
                      <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <HardDrive size={16} className="text-emerald-500" /> Storage Persistence
                      </h3>
                      <p className="text-xs text-gray-400 mb-6 font-medium uppercase tracking-wider">Ensure your data survives machine resets</p>
                      
                      <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl mb-8">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                  <RefreshCw size={20} className="animate-spin-slow" />
                               </div>
                               <div>
                                  <span className="text-sm font-black text-slate-800 block">Autosave to Disk</span>
                                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Status: Connected & Active</span>
                               </div>
                            </div>
                            <button 
                              onClick={async () => {
                                setIsSaving(true);
                                await saveToDisk();
                                setTimeout(() => setIsSaving(false), 1000);
                              }}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isSaving ? 'bg-emerald-200 text-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'}`}
                            >
                              {isSaving ? 'Saving...' : 'Sync Now'}
                            </button>
                         </div>
                         <p className="text-xs text-slate-500 leading-relaxed italic">
                           Your data is automatically synchronized to a <b>data.json</b> file in your project folder every time you make a change. This ensures it stays safe even if you reset your browser or computer.
                         </p>
                      </div>
                   </section>

                   <section>
                      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Download size={16} className="text-blue-500" /> Manual Backups
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                         <button 
                           onClick={() => {
                             const data = { kpiDefs, userActuals, userTargets, dashboardCharts, groups, groupItems, users, reports, userSettings };
                             const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                             const url = URL.createObjectURL(blob);
                             const a = document.createElement('a');
                             a.href = url;
                             a.download = `kpi_backup_${new Date().toISOString().split('T')[0]}.json`;
                             a.click();
                           }}
                           className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                         >
                            <Download size={24} className="text-slate-300 group-hover:text-blue-500 mb-3" />
                            <span className="text-sm font-bold text-slate-600 group-hover:text-blue-700">Export Config</span>
                            <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Download JSON</span>
                         </button>

                         <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-orange-400 hover:bg-orange-50/50 transition-all group cursor-pointer">
                            <RefreshCw size={24} className="text-slate-300 group-hover:text-orange-500 mb-3" />
                            <span className="text-sm font-bold text-slate-600 group-hover:text-orange-700">Import Config</span>
                            <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Upload JSON</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept=".json" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    try {
                                      const data = JSON.parse(event.target?.result as string);
                                      importData(data);
                                      alert('Data imported successfully!');
                                    } catch (err) {
                                      alert('Invalid JSON file');
                                    }
                                  };
                                  reader.readAsText(file);
                                }
                              }} 
                            />
                         </label>
                      </div>
                   </section>

                   <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                      <div className="flex gap-4">
                         <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                         <div>
                            <h4 className="text-sm font-bold text-amber-800 mb-1">Warning: Cloud Sync (Firebase) Not Configured</h4>
                            <p className="text-xs text-amber-700 leading-relaxed">
                               Your data is currently only being saved locally on this machine. To enable true cloud sync across multiple devices, please provide your Firebase API keys in the <b>.env.local</b> file.
                            </p>
                         </div>
                      </div>
                   </section>
                </div>
              )}
           </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
           <button onClick={onClose} className="px-8 py-2.5 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-colors">Cancel</button>
           <button onClick={handleSave} className="px-8 py-2.5 rounded-xl font-bold bg-[#555cf8] text-white hover:bg-[#4a51e2] shadow-lg shadow-[#555cf8]/20 transition-all active:scale-95">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
