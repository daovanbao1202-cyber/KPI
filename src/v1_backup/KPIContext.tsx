'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// --- Interfaces ---

export interface Thresholds {
  red: string;
  amberSmall: string;
  amberLarge: string;
  green: string;
}

export interface KPIDefinition {
  id: string;
  name: string;
  unit: string;
  description?: string;
  icon?: string;
  frequency?: string;
  format?: string;
  direction?: 'Up' | 'Down';
  category?: string;
  aggregation?: string;
  thresholds?: Thresholds;
  workingDays?: string[];
  formula?: string;
  calculateThisTarget?: boolean;
  hasTarget?: string; 
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Admin' | 'Manager' | 'User';
  department: string;
  position: string;
  avatar?: string;
  assignedGroups?: Record<string, string>; // { [groupId]: itemId }
}

export interface UserTarget {
  id: string;
  kpiId: string;
  userId: number;
  targetValue: number;
}

export interface UserActual {
  id: string;
  kpiId: string;
  userId: number;
  date: string; // 'YYYY-MM-DD'
  actualValue: number;
}

export interface DashboardChart {
  id: string;
  type: string;
  kpiId?: string;
  kpiIds?: string[]; // For multi-KPI charts
  title: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface Group {
  id: string;
  name: string;
}

export interface GroupItem {
  id: string;
  groupId: string;
  name: string;
}

export interface KPIReport {
  id: string;
  kpiId: string;
  userId: number;
  dateKey: string; // Linking to the period (e.g. '2026-04')
  month: string;
  customer: string;
  type: string;
  reportName: string;
  picId: number;
  url: string;
  status: string;
  date: string;
  note: string;
  isDone: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  enable2FA: boolean;
  emailNotifications: boolean;
  language: string;
  timezone: string;
}

export type ActualsMap = Record<string, string>;

interface KPIContextType {
  // Legacy
  actuals: ActualsMap;
  updateActual: (key: string, val: string) => void;
  target: number;
  
  // Users
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: number, user: Partial<User>) => void;

  // KPIs
  kpiDefs: KPIDefinition[];
  addKPIDefinition: (kpi: Omit<KPIDefinition, 'id'>) => void;
  updateKPIDefinition: (id: string, kpi: Partial<KPIDefinition>) => void;
  deleteKPIDefinition: (id: string) => void;

  // Cascading Core
  loggedInUserId: number;
  setLoggedInUserId: (id: number) => void;
  viewLevel: 'Company' | 'Department' | 'Individual';
  setViewLevel: (level: 'Company' | 'Department' | 'Individual') => void;
  viewFilter: string | number; // Department name or User ID
  setViewFilter: (filter: string | number) => void;
  userTargets: UserTarget[];
  userActuals: UserActual[];
  addActual: (actual: Omit<UserActual, 'id'>) => void;
  updateUserActual: (kpiId: string, userId: number, date: string, val: number) => void;
  setTarget: (kpiId: string, userId: number, val: number) => void;
  
  // Auth
  currentUser: User | null;
  login: (email: string) => Promise<boolean>;
  logout: () => void;

  // Dashboards
  dashboardCharts: DashboardChart[];
  addDashboardChart: (chart: Omit<DashboardChart, 'id'>) => void;
  removeDashboardChart: (id: string) => void;

  // Groups
  groups: Group[];
  groupItems: GroupItem[];
  addGroup: (name: string) => void;
  updateGroup: (id: string, name: string) => void;
  deleteGroup: (id: string) => void;
  addGroupItem: (groupId: string, name: string) => void;
  updateGroupItem: (id: string, name: string) => void;
  deleteGroupItem: (id: string) => void;

  // Reports
  reports: KPIReport[];
  addReport: (report: Omit<KPIReport, 'id'>) => void;
  updateReport: (id: string, report: Partial<KPIReport>) => void;
  deleteReport: (id: string) => void;

  // Settings
  userSettings: UserSettings;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  
  isHydrated: boolean;
}

const defaultDashboardCharts: DashboardChart[] = [
  { id: 'default-1', type: 'bar', kpiId: 'kpi-rev', title: 'Revenue Performance', dateRange: { start: '2026-04-01', end: '2026-04-08' } },
  { id: 'default-2', type: 'pie', kpiId: 'kpi-meet', title: 'Meeting Distribution', dateRange: { start: '2026-04-01', end: '2026-04-08' } },
];


const defaultUsers: User[] = [
  { id: 1, firstName: 'Bảo', lastName: 'Đào Văn', email: 'daovanbao1202@gmail.com', role: 'Admin', department: 'Management', position: 'CEO', avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: 2, firstName: 'Trang', lastName: 'Nguyễn', email: 'trang@example.com', role: 'Manager', department: 'Admin & Kế Toán', position: 'Team Leader', avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: 3, firstName: 'Hùng', lastName: 'Lê', email: 'hung@example.com', role: 'User', department: 'Sale', position: 'Staff/Engineer', avatar: 'https://i.pravatar.cc/150?img=12' },
  { id: 4, firstName: 'Linh', lastName: 'Trần', email: 'linh@example.com', role: 'User', department: 'Sale', position: 'Staff/Engineer', avatar: 'https://i.pravatar.cc/150?u=4' },
  { id: 5, firstName: 'Minh', lastName: 'Phạm', email: 'minh@example.com', role: 'User', department: 'AE', position: 'Staff/Engineer', avatar: 'https://i.pravatar.cc/150?u=5' },
  { id: 6, firstName: 'Thành', lastName: 'Nguyễn', email: 'thanh@example.com', role: 'User', department: 'FAE', position: 'Engineer', avatar: 'https://i.pravatar.cc/150?u=6' },
  { id: 7, firstName: 'Cường', lastName: 'Lê', email: 'cuong@example.com', role: 'User', department: 'FAE', position: 'Engineer', avatar: 'https://i.pravatar.cc/150?u=7' }
];

const defaultKpis: KPIDefinition[] = [
  { 
    id: 'kpi-rev', 
    name: 'Doanh Thu Chốt Deal', 
    unit: 'USD', 
    icon: '💰',
    frequency: 'Monthly',
    format: '$1,234',
    direction: 'Up',
    hasTarget: '1000',
    thresholds: { red: '0', amberSmall: '50', amberLarge: '80', green: '100' }
  },
  { 
    id: 'kpi-meet', 
    name: 'Số Cuộc Họp Khách Hàng', 
    unit: 'Meetings', 
    icon: '🤝',
    frequency: 'Weekly',
    format: '1,234',
    direction: 'Up',
    hasTarget: '5',
  },
];

const defaultTargets: UserTarget[] = [
  { id: 'tgt-1', kpiId: 'kpi-rev', userId: 1, targetValue: 1000 },
];

// Helper for dates
const getPastDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const defaultUserActuals: UserActual[] = [
  { id: 'a1', kpiId: 'kpi-rev', userId: 1, date: getPastDate(0), actualValue: 450 },
  { id: 'a2', kpiId: 'kpi-rev', userId: 1, date: getPastDate(1), actualValue: 320 },
  { id: 'a3', kpiId: 'kpi-rev', userId: 1, date: getPastDate(2), actualValue: 600 },
  { id: 'a4', kpiId: 'kpi-rev', userId: 1, date: getPastDate(3), actualValue: 200 },
  { id: 'a5', kpiId: 'kpi-rev', userId: 1, date: getPastDate(4), actualValue: 150 },
];

const KPIContext = createContext<KPIContextType | undefined>(undefined);

export function KPIProvider({ children }: { children: React.ReactNode }) {
  const [actuals, setActuals] = useState<ActualsMap>({});
  const updateActual = (key: string, val: string) => {
    setActuals(prev => ({ ...prev, [key]: val }));
  };

  const [users, setUsers] = useState<User[]>(defaultUsers);
  const [kpiDefs, setKpiDefs] = useState<KPIDefinition[]>(defaultKpis);
  const [userTargets, setUserTargets] = useState<UserTarget[]>(defaultTargets);
  const [userActuals, setUserActuals] = useState<UserActual[]>(defaultUserActuals);
  const [loggedInUserId, setLoggedInUserId] = useState<number>(1);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewLevel, setViewLevel] = useState<'Company' | 'Department' | 'Individual'>('Individual');
  const [viewFilter, setViewFilter] = useState<string | number>(1); 
  const [dashboardCharts, setDashboardCharts] = useState<DashboardChart[]>(defaultDashboardCharts);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupItems, setGroupItems] = useState<GroupItem[]>([]);
  const [reports, setReports] = useState<KPIReport[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    theme: 'light',
    enable2FA: false,
    emailNotifications: true,
    language: 'Tiếng Việt',
    timezone: '(GMT+07:00) Bangkok, Hanoi'
  });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const safeParse = (key: string, fallback: any) => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return fallback;
        const parsed = JSON.parse(item);
        if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
        return parsed;
      } catch (e) {
        console.error(`Error parsing localStorage key "${key}":`, e);
        return fallback;
      }
    };

    setKpiDefs(safeParse('kpi_defs_v4', defaultKpis));
    setUserActuals(safeParse('user_actuals_v4', defaultUserActuals));
    setUserTargets(safeParse('user_targets_v4', defaultTargets));
    setDashboardCharts(safeParse('dashboard_charts_v1', defaultDashboardCharts));
    setGroupItems(safeParse('kpi_group_items_v1', []));
    setUsers(safeParse('kpi_users_v1', defaultUsers));
    setReports(safeParse('kpi_reports_v1', []));
    setUserSettings(safeParse('kpi_user_settings_v1', {
      theme: 'light',
      enable2FA: false,
      emailNotifications: true,
      language: 'Tiếng Việt',
      timezone: '(GMT+07:00) Bangkok, Hanoi'
    }));
    setIsHydrated(true);

    const savedUser = localStorage.getItem('kpi_current_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u && typeof u === 'object') {
          setCurrentUser(u);
          setLoggedInUserId(u.id);
        }
      } catch (e) {}
    }

    const savedViewLevel = localStorage.getItem('kpi_view_level');
    if (savedViewLevel) setViewLevel(savedViewLevel as any);

    const savedViewFilter = localStorage.getItem('kpi_view_filter');
    if (savedViewFilter) {
      try {
        const f = JSON.parse(savedViewFilter);
        setViewFilter(f);
      } catch (e) {
        setViewFilter(savedViewFilter);
      }
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('kpi_defs_v4', JSON.stringify(kpiDefs));
  }, [kpiDefs, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('user_actuals_v4', JSON.stringify(userActuals));
  }, [userActuals, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('user_targets_v4', JSON.stringify(userTargets));
  }, [userTargets, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('dashboard_charts_v1', JSON.stringify(dashboardCharts));
  }, [dashboardCharts, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('kpi_groups_v1', JSON.stringify(groups));
  }, [groups, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('kpi_group_items_v1', JSON.stringify(groupItems));
  }, [groupItems, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('kpi_reports_v1', JSON.stringify(reports));
  }, [reports, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('kpi_user_settings_v1', JSON.stringify(userSettings));
    
    // Apply Dark Mode class to HTML tag
    if (userSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [userSettings, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (currentUser) {
      localStorage.setItem('kpi_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('kpi_current_user');
    }
  }, [currentUser, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('kpi_users_v1', JSON.stringify(users));
  }, [users, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('kpi_view_level', viewLevel);
  }, [viewLevel, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('kpi_view_filter', JSON.stringify(viewFilter));
  }, [viewFilter, isHydrated]);

  const addUser = (user: Omit<User, 'id'>) => {
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    setUsers([...users, { ...user, id: newId }]);
  };

  const updateUser = (id: number, u: Partial<User>) => {
    setUsers(prev => {
      const updatedUsers = prev.map(item => item.id === id ? { ...item, ...u } as User : item);
      
      // Also update currentUser if it's the same person
      if (currentUser && currentUser.id === id) {
        const updatedMe = updatedUsers.find(user => user.id === id);
        if (updatedMe) setCurrentUser(updatedMe);
      }
      
      return updatedUsers;
    });
  };

  const addKPIDefinition = (kpi: Omit<KPIDefinition, 'id'>) => {
    const newId = `kpi-${Date.now()}`;
    setKpiDefs([...kpiDefs, { ...kpi, id: newId }]);
  };

  const updateKPIDefinition = (id: string, kpi: Partial<KPIDefinition>) => {
    setKpiDefs(prev => prev.map(item => item.id === id ? { ...item, ...kpi } as KPIDefinition : item));
  };

  const deleteKPIDefinition = (id: string) => {
    setKpiDefs(prev => prev.filter(item => item.id !== id));
  };

  const addActual = (actual: Omit<UserActual, 'id'>) => {
    const newId = `act-${Date.now()}`;
    setUserActuals([...userActuals, { ...actual, id: newId }]);
  };

  const updateUserActual = (kpiId: string, userId: number, date: string, val: number) => {
    setUserActuals(prev => {
      const existingIdx = prev.findIndex(a => a.kpiId === kpiId && a.userId === userId && a.date === date);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], actualValue: val };
        return next;
      }
      return [...prev, { id: `act-${Date.now()}-${Math.random()}`, kpiId, userId, date, actualValue: val }];
    });
  };

  const setTarget = (kpiId: string, userId: number, val: number) => {
    setUserTargets(prev => {
      const existingIdx = prev.findIndex(t => t.kpiId === kpiId && t.userId === userId);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], targetValue: val };
        return next;
      }
      return [...prev, { id: `tgt-${Date.now()}`, kpiId, userId, targetValue: val }];
    });
  };

  const login = async (email: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setLoggedInUserId(user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('kpi_current_user');
  };

  const addDashboardChart = (chart: Omit<DashboardChart, 'id'>) => {
    const newId = `chart-${Date.now()}`;
    setDashboardCharts([...dashboardCharts, { ...chart, id: newId }]);
  };

  const removeDashboardChart = (id: string) => {
    setDashboardCharts(dashboardCharts.filter(c => c.id !== id));
  };

  const addGroup = (name: string) => {
    setGroups([...groups, { id: `grp-${Date.now()}`, name }]);
  };

  const updateGroup = (id: string, name: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g));
  };

  const deleteGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    setGroupItems(prev => prev.filter(gi => gi.groupId !== id));
  };

  const addGroupItem = (groupId: string, name: string) => {
    setGroupItems([...groupItems, { id: `gi-${Date.now()}`, groupId, name }]);
  };

  const updateGroupItem = (id: string, name: string) => {
    setGroupItems(prev => prev.map(gi => gi.id === id ? { ...gi, name } : gi));
  };

  const deleteGroupItem = (id: string) => {
    setGroupItems(prev => prev.filter(gi => gi.id !== id));
  };

  const addReport = (report: Omit<KPIReport, 'id'>) => {
    const newReport = { ...report, id: `rep-${Date.now()}` };
    setReports(prev => [...prev, newReport]);
  };

  const updateReport = (id: string, report: Partial<KPIReport>) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...report } : r));
  };

  const deleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const updateUserSettings = (s: Partial<UserSettings>) => {
    setUserSettings(prev => ({ ...prev, ...s }));
  };

  return (
    <KPIContext.Provider value={{
      actuals, updateActual, target: 100,
      users, addUser, updateUser,
      kpiDefs, addKPIDefinition, updateKPIDefinition, deleteKPIDefinition,
      loggedInUserId, setLoggedInUserId,
      viewLevel, setViewLevel,
      viewFilter, setViewFilter,
      userTargets, userActuals, addActual, updateUserActual, setTarget,
      currentUser, login, logout,
      dashboardCharts, addDashboardChart, removeDashboardChart,
      groups, groupItems, addGroup, updateGroup, deleteGroup, addGroupItem, updateGroupItem, deleteGroupItem,
      reports, addReport, updateReport, deleteReport,
      userSettings, updateUserSettings,
      isHydrated
    }}>
      {children}
    </KPIContext.Provider>
  );
}

export function useKPI() {
  const context = useContext(KPIContext);
  if (context === undefined) {
    throw new Error('useKPI must be used within a KPIProvider');
  }
  return context;
}
