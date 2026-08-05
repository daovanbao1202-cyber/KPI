'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity, ClipboardList, Database, FileText, LayoutDashboard, LayoutGrid, MoreHorizontal,
  Network, Rocket, Target, Users, X,
} from 'lucide-react';
import { useKPI } from '@/context/KPIContext';

/**
 * Bottom tab bar for phones — the thing that most makes a web app feel like an
 * installed one, and reachable by thumb, unlike a menu in the top corner.
 *
 * Four destinations plus an overflow sheet. Hidden from lg upwards, where the
 * full navigation bar is already on screen.
 */

interface NavItem {
  name: string;
  href: string;
  icon: typeof Target;
  roles: string[];
}

const PRIMARY: NavItem[] = [
  { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'User'] },
  { name: 'Nhập liệu', href: '/dashboard/data', icon: Database, roles: ['Admin', 'Manager', 'User'] },
  { name: 'Giao việc', href: '/dashboard/tasks', icon: ClipboardList, roles: ['Admin', 'Manager', 'User'] },
  { name: 'MBO', href: '/dashboard/mbo', icon: LayoutGrid, roles: ['Admin', 'Manager', 'User'] },
];

const OVERFLOW: NavItem[] = [
  { name: 'KPIs', href: '/dashboard/kpis', icon: Target, roles: ['Admin'] },
  { name: 'Báo cáo', href: '/dashboard/reports', icon: FileText, roles: ['Admin', 'Manager'] },
  { name: 'Phân tích', href: '/dashboard/analytics', icon: Activity, roles: ['Admin', 'Manager', 'User'] },
  { name: 'ACTION/PLAN', href: '/dashboard/action-plan', icon: Rocket, roles: ['Admin', 'Manager', 'User'] },
  { name: 'Nhân sự', href: '/dashboard/users', icon: Users, roles: ['Admin'] },
  { name: 'Sơ đồ tổ chức', href: '/dashboard/org-chart', icon: Network, roles: ['Admin', 'Manager', 'User'] },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const { currentUser } = useKPI();
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);

  const allowed = (item: NavItem) => !currentUser || item.roles.includes(currentUser.role);

  const primary = PRIMARY.filter(allowed);
  const overflow = OVERFLOW.filter(allowed);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <>
      {isOverflowOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 z-[95] lg:hidden"
            onClick={() => setIsOverflowOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[96] lg:hidden bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-200 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span className="font-black text-slate-800 dark:text-white">Thêm</span>
              <button
                onClick={() => setIsOverflowOpen(false)}
                className="p-2 -mr-2 text-slate-400"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 px-4 pb-6">
              {overflow.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOverflowOpen(false)}
                    className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition-colors ${
                      isActive(item.href)
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800'
                    }`}
                  >
                    <Icon size={22} />
                    <span className="text-[11px] font-bold text-center leading-tight">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-[90] lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch">
          {primary.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                // 56px tall: comfortably above the 44px minimum touch target.
                className={`flex-1 flex flex-col items-center justify-center gap-1 h-14 ${
                  active ? 'text-brand-primary' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] ${active ? 'font-black' : 'font-medium'}`}>{item.name}</span>
              </Link>
            );
          })}

          {overflow.length > 0 && (
            <button
              onClick={() => setIsOverflowOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-14 text-slate-400 dark:text-slate-500"
            >
              <MoreHorizontal size={20} />
              <span className="text-[10px] font-medium">Thêm</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
