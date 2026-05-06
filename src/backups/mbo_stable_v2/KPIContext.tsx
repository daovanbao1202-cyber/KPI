'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase, isOnline } from '@/lib/supabase';

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
  password?: string;
  assignedGroups?: Record<string, string>; // { [groupId]: itemId }
}

export interface UserTarget {
  id: string;
  kpiId: string;
  userId: number;
  targetValue: number;
  dateKey?: string;
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
  offset?: number;
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
  visibleKpiDefs: KPIDefinition[];
  addKPIDefinition: (kpi: Omit<KPIDefinition, 'id'>) => string;
  updateKPIDefinition: (id: string, kpi: Partial<KPIDefinition>) => void;
  deleteKPIDefinition: (id: string) => void;

  // Cascading Core
  loggedInUserId: number;
  setLoggedInUserId: (id: number) => void;
  viewLevel: 'Company' | 'Department' | 'Individual' | 'MBO';
  setViewLevel: (level: 'Company' | 'Department' | 'Individual' | 'MBO') => void;
  viewFilter: string | number; // Department name or User ID
  setViewFilter: (filter: string | number) => void;
  userTargets: UserTarget[];
  userActuals: UserActual[];
  addActual: (actual: Omit<UserActual, 'id'>) => void;
  updateUserActual: (kpiId: string, userId: number, date: string, val: number) => void;
  setTarget: (kpiId: string, userId: number, val: number, dateKey?: string) => void;
  
  // Auth
  currentUser: User | null;
  login: (email: string, password?: string) => Promise<boolean>;
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
  saveToDisk: () => Promise<void>;
  loadFromDisk: () => Promise<void>;
  importData: (data: any) => void;

  // MBO UI Persistence
  customColumns: string[];
  setCustomColumns: (cols: string[]) => void;
  hiddenCols: string[];
  setHiddenCols: (cols: string[]) => void;
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
  const [viewLevel, setViewLevel] = useState<'Company' | 'Department' | 'Individual' | 'MBO'>('Individual');
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
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);

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
    setCustomColumns(safeParse('mbo_custom_cols_v1', []));
    setHiddenCols(safeParse('mbo_hidden_cols_v1', []));
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

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('mbo_custom_cols_v1', JSON.stringify(customColumns));
  }, [customColumns, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('mbo_hidden_cols_v1', JSON.stringify(hiddenCols));
  }, [hiddenCols, isHydrated]);

  const saveToDisk = async () => {
    try {
      const data = {
        kpiDefs,
        userActuals,
        userTargets,
        dashboardCharts,
        groups,
        groupItems,
        users,
        reports,
        userSettings,
        customColumns,
        hiddenCols
      };

      // 1. Save individual small keys to LocalStorage for fast hydration
      const safeSave = (key: string, val: any) => {
        try {
          localStorage.setItem(key, JSON.stringify(val));
        } catch (e) {
          console.warn(`LocalStorage quota exceeded for key: ${key}`);
        }
      };

      safeSave('kpi_defs_v4', kpiDefs);
      safeSave('user_actuals_v4', userActuals);
      safeSave('user_targets_v4', userTargets);
      safeSave('dashboard_charts_v1', dashboardCharts);
      safeSave('kpi_group_items_v1', groupItems);
      safeSave('kpi_users_v1', users);
      safeSave('kpi_reports_v1', reports);
      safeSave('kpi_user_settings_v1', userSettings);
      
      if (currentUser) {
        safeSave('kpi_current_user', currentUser);
      }

      // 2. Save full data object to local file system (No 5MB limit here)
      await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      // Save to Online Database if configured
      if (isOnline) {
        console.log('Saving to Supabase...');
        // Users
        await supabase.from('users').upsert(users.map(u => ({
          id: u.id,
          first_name: u.firstName,
          last_name: u.lastName,
          email: u.email,
          role: u.role,
          department: u.department,
          position: u.position,
          avatar: u.avatar
        })));

        // KPI Definitions
        await supabase.from('kpi_definitions').upsert(kpiDefs.map(k => ({
          id: k.id,
          name: k.name,
          unit: k.unit,
          description: k.description,
          icon: k.icon,
          frequency: k.frequency,
          format: k.format,
          direction: k.direction,
          category: k.category,
          aggregation: k.aggregation,
          thresholds: k.thresholds,
          working_days: k.workingDays,
          formula: k.formula,
          calculate_this_target: k.calculateThisTarget,
          has_target: k.hasTarget
        })));

        // Actuals
        await supabase.from('user_actuals').upsert(userActuals.map(a => ({
          id: a.id,
          kpi_id: a.kpiId,
          user_id: a.userId,
          date: a.date,
          actual_value: a.actualValue
        })));

        // Targets
        await supabase.from('user_targets').upsert(userTargets.map(t => ({
          id: t.id,
          kpi_id: t.kpiId,
          user_id: t.userId,
          date_key: t.dateKey,
          target_value: t.targetValue
        })));

        // Charts
        await supabase.from('dashboard_charts').upsert(dashboardCharts.map(c => ({
          id: c.id,
          type: c.type,
          kpi_id: c.kpiId,
          kpi_ids: c.kpiIds,
          title: c.title,
          date_range: c.dateRange
        })));
      }

      console.log('Data saved successfully');
    } catch (e) {
      console.error('Failed to save data', e);
    }
  };

  const loadFromDisk = async () => {
    try {
      // 1. Try Online Database first
      if (isOnline) {
        console.log('Loading from Supabase...');
        const [
          { data: dbUsers },
          { data: dbKpis },
          { data: dbActuals },
          { data: dbTargets },
          { data: dbCharts }
        ] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('kpi_definitions').select('*'),
          supabase.from('user_actuals').select('*'),
          supabase.from('user_targets').select('*'),
          supabase.from('dashboard_charts').select('*')
        ]);

        if (dbUsers && dbUsers.length > 0) {
          setUsers(dbUsers.map(u => ({
            id: Number(u.id),
            firstName: u.first_name,
            lastName: u.last_name,
            email: u.email,
            role: u.role,
            department: u.department,
            position: u.position,
            avatar: u.avatar
          })));
        }

        if (dbKpis && dbKpis.length > 0) {
          setKpiDefs(dbKpis.map(k => ({
            id: k.id,
            name: k.name,
            unit: k.unit,
            description: k.description,
            icon: k.icon,
            frequency: k.frequency,
            format: k.format,
            direction: k.direction,
            category: k.category,
            aggregation: k.aggregation,
            thresholds: k.thresholds,
            workingDays: k.working_days,
            formula: k.formula,
            calculateThisTarget: k.calculate_this_target,
            hasTarget: k.has_target
          })));
        }

        if (dbActuals) {
          setUserActuals(dbActuals.map(a => ({
            id: a.id,
            kpiId: a.kpi_id,
            userId: Number(a.user_id),
            date: a.date,
            actualValue: Number(a.actual_value)
          })));
        }

        if (dbTargets) {
          setUserTargets(dbTargets.map(t => ({
            id: t.id,
            kpiId: t.kpi_id,
            userId: Number(t.user_id),
            dateKey: t.date_key,
            targetValue: Number(t.target_value)
          })));
        }

        if (dbCharts) {
          setDashboardCharts(dbCharts.map(c => ({
            id: c.id,
            type: c.type,
            kpiId: c.kpi_id,
            kpiIds: c.kpi_ids,
            title: c.title,
            dateRange: c.date_range
          })));
        }
        
        console.log('Online data loaded');
        return;
      }

      // 2. Fallback to Local Disk
      const res = await fetch('/api/storage');
      if (res.ok) {
        const data = await res.json();
        if (data.kpiDefs) setKpiDefs(data.kpiDefs);
        if (data.userActuals) setUserActuals(data.userActuals);
        if (data.userTargets) setUserTargets(data.userTargets);
        if (data.dashboardCharts) setDashboardCharts(data.dashboardCharts);
        if (data.groups) setGroups(data.groups);
        if (data.groupItems) setGroupItems(data.groupItems);
        if (data.users) setUsers(data.users);
        if (data.reports) setReports(data.reports);
        if (data.userSettings) setUserSettings(data.userSettings);
        if (data.customColumns) setCustomColumns(data.customColumns);
        if (data.hiddenCols) setHiddenCols(data.hiddenCols);
        console.log('Local data loaded');
      }
    } catch (e) {
      console.warn('Failed to load data', e);
    }
  };

  // Auto-save to disk periodically or on hydration
  useEffect(() => {
    if (isHydrated) {
      const timer = setTimeout(() => {
        saveToDisk();
      }, 2000); // Debounce save to disk
      return () => clearTimeout(timer);
    }
  }, [kpiDefs, userActuals, userTargets, dashboardCharts, groups, groupItems, users, reports, userSettings, isHydrated]);

  useEffect(() => {
    // Also try to load from disk on start
    loadFromDisk();
  }, []);

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

  const visibleKpiDefs = useMemo(() => {
    const isRealAdmin = currentUser?.role === 'Admin';
    if (isRealAdmin) return kpiDefs;
    
    return kpiDefs.filter(def => {
      const uId = currentUser?.id;
      if (!uId) return false;
      const userTgt = userTargets.find(t => t.kpiId === def.id && t.userId === uId)?.targetValue;
      return userTgt !== undefined && Number(userTgt) > 0;
    });
  }, [kpiDefs, userTargets, currentUser]);

  const addKPIDefinition = (kpi: Omit<KPIDefinition, 'id'>) => {
    const newId = `kpi-${Date.now()}`;
    setKpiDefs(prev => [...prev, { ...kpi, id: newId }]);
    return newId;
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

  const setTarget = (kpiId: string, userId: number, val: number, dateKey?: string) => {
    setUserTargets(prev => {
      const existingIdx = prev.findIndex(t => t.kpiId === kpiId && t.userId === userId && t.dateKey === dateKey);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], targetValue: val };
        return next;
      }
      return [...prev, { id: `tgt-${Date.now()}-${Math.random()}`, kpiId, userId, targetValue: val, dateKey }];
    });
  };

  const login = async (email: string, password?: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === trimmedEmail);
    if (user) {
      const expectedPassword = user.password || '';
      const providedPassword = password || '';
      
      // If a password is set for the user, require it to match.
      // If the user has no password, any password (or no password) works for now,
      // but if we want to be strict, we could require empty password if expected is empty.
      // Let's just say if expectedPassword is set, they must match.
      if (expectedPassword && expectedPassword !== providedPassword) {
        return false;
      }
      
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

  const importData = (data: any) => {
    if (data.kpiDefs) setKpiDefs(data.kpiDefs);
    if (data.userActuals) setUserActuals(data.userActuals);
    if (data.userTargets) setUserTargets(data.userTargets);
    if (data.dashboardCharts) setDashboardCharts(data.dashboardCharts);
    if (data.groups) setGroups(data.groups);
    if (data.groupItems) setGroupItems(data.groupItems);
    if (data.users) setUsers(data.users);
    if (data.reports) setReports(data.reports);
    if (data.userSettings) setUserSettings(data.userSettings);
  };

  return (
    <KPIContext.Provider value={{
      actuals, updateActual, target: 100,
      users, addUser, updateUser,
      kpiDefs, visibleKpiDefs, addKPIDefinition, updateKPIDefinition, deleteKPIDefinition,
      loggedInUserId, setLoggedInUserId,
      viewLevel, setViewLevel,
      viewFilter, setViewFilter,
      userTargets, userActuals, addActual, updateUserActual, setTarget,
      currentUser, login, logout,
      dashboardCharts, addDashboardChart, removeDashboardChart,
      groups, groupItems, addGroup, updateGroup, deleteGroup, addGroupItem, updateGroupItem, deleteGroupItem,
      reports, addReport, updateReport, deleteReport,
      userSettings, updateUserSettings,
      isHydrated, saveToDisk, loadFromDisk, importData,
      customColumns, setCustomColumns, hiddenCols, setHiddenCols
    }}>
      {children}
    </KPIContext.Provider>
  );
}

export const useKPI = () => {
  const context = useContext(KPIContext);
  if (context === undefined) {
    throw new Error('useKPI must be used within a KPIProvider');
  }
  return context;
};
