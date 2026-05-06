'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Target, Database, BarChart3, Settings, Users, Network } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'KPIs', href: '/dashboard/kpis', icon: Target },
  { name: 'Assign KPIs', href: '/dashboard/assign', icon: Target },
  { name: 'Data Entry', href: '/dashboard/data', icon: Database },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Org Chart', href: '/dashboard/org-chart', icon: Network },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <span className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 bg-[#424cf3] rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold leading-none">K</span>
          </div>
          SimpleKPI
        </span>
      </div>
      
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-[#424cf3] bg-opacity-10 text-[#424cf3] font-medium' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-[#424cf3]' : 'text-gray-400'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
          <Settings size={20} className="text-gray-400" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
