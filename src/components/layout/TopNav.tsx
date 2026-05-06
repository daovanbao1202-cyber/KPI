'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Target, Database, LayoutDashboard, FileText, 
  Activity, Users, Settings, UserCircle, 
  HelpCircle, Network, LogOut, ChevronDown,
  LayoutGrid, Share2, Menu, X
} from 'lucide-react';
import { useKPI } from '@/context/KPIContext';
import NotificationBell from './NotificationBell';
import UserProfileModal from './UserProfileModal';

const mainNav = [
  { name: 'KPIs', href: '/dashboard/kpis', icon: Target, roles: ['Admin'] },
  { name: 'Data', href: '/dashboard/data', icon: Database, roles: ['Admin', 'Manager', 'User'] },
  { name: 'Dashboards', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'User'] },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText, roles: ['Admin', 'Manager'] },
  { name: 'Analytics', href: '/dashboard/analytics', icon: Activity, roles: ['Admin', 'Manager', 'User'] },
  { name: 'Users', href: '/dashboard/users', icon: Users, roles: ['Admin'] },
  { name: 'Org Chart', href: '/dashboard/org-chart', icon: Network, roles: ['Admin', 'Manager', 'User'] },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    currentUser, logout, users, 
    viewLevel, setViewLevel, 
    viewFilter, setViewFilter,
    userSettings, updateUserSettings
  } = useKPI();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [modalType, setModalType] = useState<'profile' | 'settings' | null>(null);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredNav = mainNav.filter(item => 
    !currentUser || item.roles.includes(currentUser.role)
  );

  return (
    <div className="flex flex-col shrink-0 w-full z-30 shadow-sm relative">
      {/* Top White Bar */}
      <div className="h-14 bg-white flex items-center justify-between px-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             className="p-1 text-gray-500 hover:bg-gray-100 rounded-md lg:hidden"
           >
             {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
           </button>
           <Link href="/" className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" title="Back to Home">
             <div className="relative w-7 h-7 rounded-full bg-[#82aecd] mr-2.5 overflow-hidden flex-shrink-0">
               <div className="absolute top-[33%] left-0 w-full h-[2px] bg-white"></div>
               <div className="absolute top-[66%] left-0 w-full h-[2px] bg-white"></div>
               <div className="absolute top-0 left-1/2 w-[2px] h-full bg-white -translate-x-1/2"></div>
             </div>
             <span className="text-[18px] sm:text-[20px] text-[#1e293b] tracking-wide font-serif truncate max-w-[120px] sm:max-w-none">DAEKHON VINA</span>
           </Link>
        </div>
        
        <div className="flex items-center gap-5">
          {/* Theme Toggle Switch */}
          <div className="flex items-center gap-3 mr-2">
            <span className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-widest hidden sm:block">Theme</span>
            <button 
              onClick={() => updateUserSettings({ theme: userSettings.theme === 'light' ? 'dark' : 'light' })}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${userSettings.theme === 'dark' ? 'bg-[#555cf8]' : 'bg-[#e2e8f0]'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 transform ${userSettings.theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

          {/* Moved View Selectors here */}
          {pathname === '/dashboard' && (
            <div className="hidden lg:flex items-center gap-4 mr-4">
               {viewLevel === 'Individual' && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">Select User:</span>
                  <div className="relative">
                    <select 
                      value={viewFilter}
                      onChange={(e) => setViewFilter(Number(e.target.value))}
                      disabled={currentUser?.role === 'User'}
                      className="appearance-none bg-[#f8fafc] border border-gray-200 rounded-lg px-4 py-1.5 pr-8 text-sm font-bold text-[#555cf8] focus:outline-none focus:ring-1 focus:ring-[#555cf8]/20 transition-all cursor-pointer min-w-[180px] disabled:opacity-75"
                    >
                      {users
                        .filter(u => {
                          if (currentUser?.role === 'Admin') return true;
                          if (currentUser?.role === 'Manager') return u.department === currentUser?.department;
                          return u.id === currentUser?.id;
                        })
                        .map(u => (
                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.position})</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
              <div className="h-4 w-px bg-gray-200"></div>
              <div className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">
                Viewing: <span className="text-[#555cf8] ml-1">
                  {viewLevel === 'Company' ? 'ALL ORGANIZATION' : (typeof viewFilter === 'number' ? users.find(u => u.id === viewFilter)?.firstName + ' ' + users.find(u => u.id === viewFilter)?.lastName : viewFilter)}
                </span>
              </div>
            </div>
          )}

          <button className="text-xs font-bold text-orange-500 border border-orange-200 px-4 py-1.5 rounded-md hover:bg-orange-50 transition-colors hidden sm:block">Update Plan</button>
          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
          
          <NotificationBell />

          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors"
            >
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-gray-200 object-cover" alt="Avatar" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <UserCircle size={20} />
                </div>
              )}
              <div className="flex flex-col items-start hidden md:flex">
                <span className="text-[13px] font-bold text-gray-800 leading-none mb-1">{currentUser?.firstName} {currentUser?.lastName}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{currentUser?.role}</span>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                <div className="absolute top-12 right-0 w-56 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-gray-50 mb-1">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Account</p>
                    <p className="text-xs text-gray-600 truncate">{currentUser?.email}</p>
                  </div>
                  <button 
                    onClick={() => { setModalType('profile'); setIsProfileOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left transition-colors"
                  >
                    <UserCircle size={16} className="text-gray-400" /> My Profile
                  </button>
                  <button 
                    onClick={() => { setModalType('settings'); setIsProfileOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left transition-colors"
                  >
                    <Settings size={16} className="text-gray-400" /> Account Settings
                  </button>
                  <div className="h-px bg-gray-50 my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors font-medium"
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Purple Navigation Bar (Desktop Only) */}
      <div className="h-12 bg-[#555cf8] px-6 hidden lg:flex items-center justify-between">
        <nav className="flex items-center gap-2 h-full">
          {filteredNav.map((item) => {
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard' 
              : pathname?.startsWith(item.href);
              
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 h-full text-[13px] font-medium transition-colors border-b-2 ${
                  isActive 
                    ? 'text-white border-white bg-white/10' 
                    : 'text-[#c7c9fe] border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="flex items-center gap-3">
           <HelpCircle size={18} className="text-[#c7c9fe] hover:text-white cursor-pointer" />
           
           <div className="relative group h-full flex items-center">
             <button className="h-full px-3 flex items-center gap-1.5 transition-colors group-hover:bg-[#4349d8] text-white">
               <Settings size={20} className="text-white" />
               <ChevronDown size={14} className="opacity-70 transition-transform duration-300 group-hover:rotate-180" strokeWidth={3} />
             </button>
             
             {/* Hover Dropdown */}
             <div className="absolute top-full right-0 w-60 pt-0 hidden group-hover:block z-50 animate-in fade-in duration-200">
               <div className="bg-[#4349d8] shadow-2xl overflow-hidden rounded-bl-xl rounded-br-xl border-t border-white/5">
                 <Link href="/dashboard/groups" className="flex items-center gap-4 px-6 py-4 text-white hover:bg-white/10 transition-colors group/item">
                    <Users size={22} className="opacity-90 group-hover/item:scale-110 transition-transform" />
                    <span className="text-[16px] font-bold tracking-tight">Groups</span>
                 </Link>
                 <Link href="/dashboard/integrations" className="flex items-center gap-4 px-6 py-4 text-white hover:bg-white/10 transition-colors group/item">
                    <Network size={22} className="opacity-90 group-hover/item:scale-110 transition-transform" />
                    <span className="text-[16px] font-bold tracking-tight">Integrations</span>
                 </Link>
                 <Link href="/dashboard/account-settings" className="flex items-center gap-4 px-6 py-4 text-white hover:bg-white/10 transition-colors group/item">
                    <Settings size={22} className="opacity-90 group-hover/item:scale-110 transition-transform" />
                    <span className="text-[16px] font-bold tracking-tight">Settings</span>
                 </Link>
                 <Link href="/dashboard/pricing" className="flex items-center gap-4 px-6 py-4 text-white hover:bg-white/10 transition-colors group/item">
                    <LayoutGrid size={22} className="opacity-90 group-hover/item:scale-110 transition-transform" />
                    <span className="text-[16px] font-bold tracking-tight">Subscribe</span>
                 </Link>
               </div>
             </div>
           </div>
        </div>
      </div>
      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[90] lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed top-14 left-0 bottom-0 w-72 bg-white z-[100] border-r border-gray-100 shadow-2xl lg:hidden flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-widest">Navigation</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {filteredNav.map((item) => {
                const isActive = item.href === '/dashboard' 
                  ? pathname === '/dashboard' 
                  : pathname?.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive 
                        ? 'bg-[#555cf8]/10 text-[#555cf8]' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-100 bg-gray-50">
               <div className="flex items-center gap-3 mb-4 px-2">
                 {currentUser?.avatar ? (
                   <img src={currentUser.avatar} className="w-10 h-10 rounded-full border border-gray-200" alt="Avatar" />
                 ) : (
                   <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                     <UserCircle size={24} />
                   </div>
                 )}
                 <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">{currentUser?.firstName} {currentUser?.lastName}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{currentUser?.role}</span>
                 </div>
               </div>
               <button 
                 onClick={handleLogout}
                 className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-100 transition-all"
               >
                 <LogOut size={18} /> Log Out
               </button>
            </div>
          </div>
        </>
      )}

      <UserProfileModal 
        isOpen={!!modalType} 
        onClose={() => setModalType(null)} 
        type={modalType || 'profile'} 
      />
    </div>
  );
}
