'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
// No Supabase client here: the browser reaches the database only through
// /api/data, so the anon key never has to leave the server.

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
  customValues?: Record<string, string>; // { [columnName]: value }
  sheetType?: 'MBO' | 'ACTION_PLAN';
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

/** Result of a sign-in attempt. Credentials are verified server-side. */
export type LoginResult =
  | { status: 'ok' }
  | { status: 'needs-password-setup'; email: string }
  | { status: 'error'; message: string };

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
}

export type ActualsMap = Record<string, string>;

interface KPIContextType {
  // Legacy
  actuals: ActualsMap;
  updateActual: (key: string, val: string) => void;
  target: number;
  
  // Users
  users: User[];
  /** Returns the id assigned to the new user. */
  addUser: (user: Omit<User, 'id'>) => number;
  updateUser: (id: number, user: Partial<User>) => void;
  deleteUser: (id: number) => Promise<void>;

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
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;

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
  /** True once the server has been asked who the current user is. */
  isAuthResolved: boolean;
  /** Message describing why the last cloud save failed, if it did. */
  saveError: string | null;
  saveToDisk: () => Promise<void>;
  loadFromDisk: () => Promise<void>;
  importData: (data: any) => void;
  
  // MBO UI Persistence
  customColumns: string[];
  setCustomColumns: (cols: string[]) => void;
  hiddenCols: string[];
  setHiddenCols: (cols: string[]) => void;
  duplicateKpis: (fromType: 'MBO' | 'ACTION_PLAN', toType: 'MBO' | 'ACTION_PLAN') => void;
  renameCustomColumn: (oldName: string, newName: string) => void;
  isLoadingCloud: boolean;
}

const defaultDashboardCharts: DashboardChart[] = [];


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
  /** True once the session cookie has been checked with the server. */
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  /** Set when the last cloud save failed, so the UI can say so. */
  const [saveError, setSaveError] = useState<string | null>(null);
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const isLoadingRef = React.useRef(false);

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

    setKpiDefs(
      safeParse('kpi_defs_v4', defaultKpis).filter((k: any) => k.name && k.name.trim() !== '')
    );
    setCustomColumns(prev => {
      const saved = safeParse('mbo_custom_cols_v1', []);
      const required = ["전략과제(CSF)/NHIỆM VỤ CHIẾN LƯỢC", "CSF - YẾU TỐ THÀNH CÔNG CỐT LÕI", "핵심성과지표 (KPI)/CHỈ SỐ HIỆU QUẢ CỐT LÕI"];
      const missing = required.filter(r => !saved.includes(r));
      return [...saved, ...missing];
    });
    setUserActuals(safeParse('user_actuals_v4', defaultUserActuals));
    setUserTargets(safeParse('user_targets_v4', defaultTargets));
    setDashboardCharts(safeParse('dashboard_charts_v1', defaultDashboardCharts));
    // `kpi_groups_v1` was written on every change but never read back, so groups
    // disappeared on reload while their items survived.
    setGroups(safeParse('kpi_groups_v1', []));
    setGroupItems(safeParse('kpi_group_items_v1', []));
    setUsers(safeParse('kpi_users_v1', defaultUsers));
    setReports(safeParse('kpi_reports_v1', []));
    setHiddenCols(safeParse('mbo_hidden_cols_v1', []));
    setUserSettings(safeParse('kpi_user_settings_v1', {
      theme: 'light',
      enable2FA: false,
      emailNotifications: true,
      language: 'Tiếng Việt',
      timezone: '(GMT+07:00) Bangkok, Hanoi'
    }));
    setIsHydrated(true);

    // Identity is never read from localStorage: a forged entry there used to be
    // enough to impersonate an Admin. The signed session cookie is the authority.
    try {
      localStorage.removeItem('kpi_current_user');
    } catch {}

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

const safeLocalStorageSet = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`LocalStorage write failed or quota exceeded for key "${key}":`, e);
  }
};

/**
 * Writes the local JSON snapshot. On a read-only (serverless) filesystem the
 * endpoint answers 503; remember that and stop retrying on every save.
 */
let localSnapshotUnavailable = false;

/**
 * Persists the snapshot to Supabase via the server.
 *
 * Returns a human-readable problem, or null on success. Reporting this matters:
 * the previous version logged a console warning and carried on, so months of
 * KPI reports were silently never written to the cloud.
 */
const saveToCloud = async (snapshot: unknown): Promise<string | null> => {
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });

    // 503 means this environment has no cloud configured, which is expected.
    if (res.status === 503) return null;

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      const detail = Array.isArray(payload.errors)
        ? payload.errors.join('; ')
        : payload.error || `HTTP ${res.status}`;
      console.error('Cloud save failed', payload);
      return detail;
    }

    return null;
  } catch (e) {
    console.warn('Cloud save request failed', e);
    return 'Không kết nối được tới máy chủ.';
  }
};

/** Removes a single row through the server. */
const deleteFromCloud = async (table: string, id: string | number) => {
  try {
    const res = await fetch('/api/data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id }),
    });
    if (!res.ok && res.status !== 503) {
      console.error(`Cloud delete from ${table} failed`, await res.json().catch(() => ({})));
    }
  } catch (e) {
    console.warn('Cloud delete request failed', e);
  }
};

const saveLocalSnapshot = async (data: unknown) => {
  if (localSnapshotUnavailable) return;
  try {
    const res = await fetch('/api/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.status === 503) {
      localSnapshotUnavailable = true;
      console.info('Local file storage is unavailable here; using Supabase only.');
    }
  } catch (e) {
    console.warn('Local snapshot write failed', e);
  }
};

  useEffect(() => {
    if (!isHydrated) return;
    const cleanKpiDefs = kpiDefs.filter(k => k.name && k.name.trim() !== "");
    safeLocalStorageSet('kpi_defs_v4', JSON.stringify(cleanKpiDefs));
  }, [kpiDefs, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    safeLocalStorageSet('user_actuals_v4', JSON.stringify(userActuals));
  }, [userActuals, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    safeLocalStorageSet('user_targets_v4', JSON.stringify(userTargets));
  }, [userTargets, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    safeLocalStorageSet('dashboard_charts_v1', JSON.stringify(dashboardCharts));
  }, [dashboardCharts, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    safeLocalStorageSet('kpi_groups_v1', JSON.stringify(groups));
  }, [groups, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    safeLocalStorageSet('kpi_group_items_v1', JSON.stringify(groupItems));
  }, [groupItems, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    safeLocalStorageSet('kpi_reports_v1', JSON.stringify(reports));
  }, [reports, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    safeLocalStorageSet('kpi_user_settings_v1', JSON.stringify(userSettings));
    
    // Apply Dark Mode class to HTML tag
    if (userSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [userSettings, isHydrated]);

  // Restore identity from the signed session cookie rather than localStorage.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (!cancelled && res.ok) {
          const { user } = await res.json();
          if (user) {
            setCurrentUser(user);
            setLoggedInUserId(user.id);
          }
        }
      } catch {
        // Offline or server unreachable: stay signed out.
      } finally {
        if (!cancelled) setIsAuthResolved(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    safeLocalStorageSet('kpi_users_v1', JSON.stringify(users));
  }, [users, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    safeLocalStorageSet('kpi_view_level', viewLevel);
  }, [viewLevel, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    safeLocalStorageSet('kpi_view_filter', JSON.stringify(viewFilter));
  }, [viewFilter, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    safeLocalStorageSet('mbo_custom_cols_v1', JSON.stringify(customColumns));
  }, [customColumns, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    safeLocalStorageSet('mbo_hidden_cols_v1', JSON.stringify(hiddenCols));
  }, [hiddenCols, isHydrated]);

  const saveToDisk = async () => {
    try {
      const cleanKpiDefs = kpiDefs.filter(k => k.name && k.name.trim() !== "");
      const data = {
        kpiDefs: cleanKpiDefs,
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

      safeSave('kpi_defs_v4', cleanKpiDefs);
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

      // 2. Save the full snapshot to the local file system (no 5MB limit there).
      // Unavailable on serverless hosts, where Supabase is the only store.
      await saveLocalSnapshot(data);

      // 3. Save to the cloud through the server, and surface any failure.
      setSaveError(
        await saveToCloud({
          users,
          kpiDefs: cleanKpiDefs,
          userActuals,
          userTargets,
          reports,
          customColumns,
          hiddenCols,
        })
      );
    } catch (e) {
      console.error('Failed to save data', e);
    }
  };

  const loadFromDisk = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoadingCloud(true);
    try {
      // 1. Cloud first, through the server. The browser no longer holds a
      // database key of its own.
      const cloud = await fetch('/api/data');
      if (cloud.ok) {
        const data = await cloud.json();

        if (data.users?.length) setUsers(data.users);
        if (data.kpiDefs?.length) setKpiDefs(data.kpiDefs);
        if (data.userActuals) setUserActuals(data.userActuals);
        if (data.userTargets) setUserTargets(data.userTargets);
        if (data.dashboardCharts) setDashboardCharts(data.dashboardCharts);
        if (data.reports?.length) setReports(data.reports);
        if (data.customColumns) setCustomColumns(data.customColumns);
        if (data.hiddenCols) setHiddenCols(data.hiddenCols);

        // Supabase is the source of truth. Previously the local file was read
        // afterwards and overwrote everything that had just arrived from the
        // cloud, so whichever browser last wrote data.json silently won.
        return;
      }

      // 2. Offline only: fall back to the local disk snapshot.
      const res = await fetch('/api/storage');
      if (res.ok) {
        const data = await res.json();
        if (data.kpiDefs) {
          const cleanKpiDefs = data.kpiDefs.filter((k: any) => k.name && k.name.trim() !== "");
          setKpiDefs(cleanKpiDefs);
        }
        if (data.userActuals) {
          setUserActuals(data.userActuals);
        }
        if (data.userTargets) {
          setUserTargets(data.userTargets);
        }
        if (data.dashboardCharts) setDashboardCharts(data.dashboardCharts);
        if (data.groups) setGroups(data.groups);
        if (data.groupItems) setGroupItems(data.groupItems);
        if (data.users) setUsers(data.users);
        if (data.reports) setReports(data.reports);
        if (data.userSettings) setUserSettings(data.userSettings);
        if (data.customColumns) setCustomColumns(data.customColumns);
        if (data.hiddenCols) setHiddenCols(data.hiddenCols);
        console.log('Local data and settings merged');
      }
    } catch (e) {
      console.warn('Failed to load data', e);
    } finally {
      isLoadingRef.current = false;
      setIsLoadingCloud(false);
    }
  };

  // Auto-save to disk periodically or on hydration
  useEffect(() => {
    if (isHydrated && !isLoadingRef.current) {
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
    return newId;
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

  const deleteUser = async (id: number) => {
    const updatedUsers = users.filter(item => item.id !== id);
    setUsers(updatedUsers);
    
    await deleteFromCloud('users', id);
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

  const duplicateKpis = (fromType: 'MBO' | 'ACTION_PLAN', toType: 'MBO' | 'ACTION_PLAN') => {
    const kpisToCopy = kpiDefs.filter(k => (k.sheetType || 'MBO') === fromType);
    const copies = kpisToCopy.map(k => ({
      ...k,
      id: `kpi-${Date.now()}-${Math.random()}`,
      sheetType: toType
    }));
    setKpiDefs(prev => [...prev, ...copies]);
  };

  const renameCustomColumn = (oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;
    
    // 1. Update column list
    setCustomColumns(prev => prev.map(c => c === oldName ? newName : c));
    
    // 2. Migrate data in kpiDefs
    setKpiDefs(prev => prev.map(kpi => {
      if (!kpi.customValues || !kpi.customValues[oldName]) return kpi;
      
      const newValues = { ...kpi.customValues };
      newValues[newName] = newValues[oldName];
      delete newValues[oldName];
      
      return { ...kpi, customValues: newValues };
    }));
  };

  const deleteKPIDefinition = async (id: string) => {
    const updatedKpis = kpiDefs.filter(item => item.id !== id);
    setKpiDefs(updatedKpis);
    
    await deleteFromCloud('kpi_definitions', id);

    // Persist immediately to disk to prevent merge resurrection on page load
    try {
      const cleanKpis = updatedKpis.filter(k => k.name && k.name.trim() !== "");
      const data = {
        kpiDefs: cleanKpis,
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
      
      safeLocalStorageSet('kpi_defs_v4', JSON.stringify(cleanKpis));
      await saveLocalSnapshot(data);
    } catch (e) {
      console.error('Failed to save deleted KPI to disk', e);
    }
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

  /**
   * Credentials are verified by the server, which sets an httpOnly session
   * cookie. The client never sees or stores a password.
   */
  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await res.json();

      if (res.ok && payload.needsPasswordSetup) {
        return { status: 'needs-password-setup', email: payload.email };
      }

      if (!res.ok) {
        return { status: 'error', message: payload.error || 'Đăng nhập không thành công.' };
      }

      setCurrentUser(payload.user);
      setLoggedInUserId(payload.user.id);
      return { status: 'ok' };
    } catch {
      return { status: 'error', message: 'Không kết nối được tới máy chủ.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
    } catch {
      // Clearing local state below still signs the user out of this browser.
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem('kpi_current_user');
    } catch {}
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

  const deleteReport = async (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
    await deleteFromCloud('kpi_reports', id);
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
      users, addUser, updateUser, deleteUser,
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
      isHydrated, isAuthResolved, saveError, saveToDisk, loadFromDisk, importData,
      customColumns, setCustomColumns, hiddenCols, setHiddenCols, duplicateKpis, renameCustomColumn, isLoadingCloud
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
