'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, CalendarDays, CheckCircle2, Inbox, LayoutGrid, List, ListChecks, Plus, Trash2, X,
} from 'lucide-react';
import { useKPI } from '@/context/KPIContext';

type TaskStatus = 'todo' | 'doing' | 'review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high';

interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: number | null;
  kpiId: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  dueDate: string | null;
  progress: number;
  createdBy: number | null;
  position: number;
}

const COLUMNS: { id: TaskStatus; label: string; accent: string }[] = [
  { id: 'todo', label: 'Chưa bắt đầu', accent: 'bg-slate-400' },
  { id: 'doing', label: 'Đang làm', accent: 'bg-blue-500' },
  { id: 'review', label: 'Chờ duyệt', accent: 'bg-amber-500' },
  { id: 'done', label: 'Hoàn thành', accent: 'bg-emerald-500' },
];

const PRIORITIES: { id: TaskPriority; label: string; className: string }[] = [
  { id: 'high', label: 'Cao', className: 'bg-rose-50 text-rose-600 border-rose-200' },
  { id: 'medium', label: 'Trung bình', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'low', label: 'Thấp', className: 'bg-slate-50 text-slate-500 border-slate-200' },
];

const emptyDraft = {
  title: '',
  description: '',
  assigneeId: '' as number | '',
  kpiId: '',
  status: 'todo' as TaskStatus,
  priority: 'medium' as TaskPriority,
  startDate: '',
  dueDate: '',
  progress: 0,
};

export default function TasksPage() {
  const { users, kpiDefs, currentUser } = useKPI();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'table' | 'board'>('table');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all' | 'overdue'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const canManage = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error || 'Không tải được danh sách công việc.');
        return;
      }
      const payload = await res.json();
      setTasks(payload.tasks ?? []);
      setError(null);
    } catch {
      setError('Không kết nối được tới máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Unread count for the Inbox row in the sidebar.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const items = await res.json();
        setUnreadCount(Array.isArray(items) ? items.filter((n: { is_read?: boolean }) => !n.is_read).length : 0);
      } catch {
        // The sidebar simply shows no badge if this fails.
      }
    })();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const overdue = (t: Task) => !!t.dueDate && t.status !== 'done' && t.dueDate < today;

  const scopedTasks = useMemo(
    () => (scope === 'mine' ? tasks.filter(t => t.assigneeId === currentUser?.id) : tasks),
    [tasks, scope, currentUser]
  );

  const visibleTasks = useMemo(() => {
    if (statusFilter === 'all') return scopedTasks;
    if (statusFilter === 'overdue') return scopedTasks.filter(overdue);
    return scopedTasks.filter(t => t.status === statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedTasks, statusFilter, today]);

  const counts = useMemo(() => ({
    all: scopedTasks.length,
    todo: scopedTasks.filter(t => t.status === 'todo').length,
    doing: scopedTasks.filter(t => t.status === 'doing').length,
    review: scopedTasks.filter(t => t.status === 'review').length,
    done: scopedTasks.filter(t => t.status === 'done').length,
    overdue: scopedTasks.filter(overdue).length,
    // Average completion across the scope, which is what "tiến độ" means here.
    progress: scopedTasks.length
      ? Math.round(scopedTasks.reduce((sum, t) => sum + t.progress, 0) / scopedTasks.length)
      : 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [scopedTasks, today]);

  const userName = (id: number | null) => {
    const user = users.find(u => u.id === id);
    return user ? `${user.firstName} ${user.lastName}` : 'Chưa giao';
  };

  const kpiName = (id: string | null) => {
    if (!id) return null;
    const kpi = kpiDefs.find(k => k.id === id);
    // The KPI may have been deleted; say so rather than showing a raw id.
    return kpi ? kpi.name : 'KPI đã xoá';
  };

  /** Anyone may move their own task; managers may move anyone's. */
  const mayUpdate = (task: Task) => canManage || task.assigneeId === currentUser?.id;

  const patchTask = async (id: string, changes: Partial<Task>) => {
    const previous = tasks;
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...changes } : t)));

    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...changes }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error || 'Không lưu được thay đổi.');
        setTasks(previous); // Put the row back rather than showing a lie.
        return;
      }
      setError(null);
    } catch {
      setError('Không kết nối được tới máy chủ.');
      setTasks(previous);
    }
  };

  const createTask = async () => {
    if (!draft.title.trim()) {
      setError('Tên công việc không được để trống.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          assigneeId: draft.assigneeId === '' ? null : Number(draft.assigneeId),
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error || 'Không tạo được công việc.');
        return;
      }
      setTasks(prev => [...prev, payload.task]);
      setDraft(emptyDraft);
      setIsFormOpen(false);
      setError(null);
    } catch {
      setError('Không kết nối được tới máy chủ.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeTask = async (id: string) => {
    if (!confirm('Xoá công việc này?')) return;
    const previous = tasks;
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      const res = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error || 'Không xoá được.');
        setTasks(previous);
      }
    } catch {
      setError('Không kết nối được tới máy chủ.');
      setTasks(previous);
    }
  };

  const handleDropInColumn = (status: TaskStatus) => {
    const task = tasks.find(t => t.id === draggingId);
    setDraggingId(null);
    setDragOverColumn(null);
    if (!task || task.status === status) return;

    if (!mayUpdate(task)) {
      setError('Bạn chỉ cập nhật được công việc được giao cho mình.');
      return;
    }
    // Reaching "done" by dragging should also complete the progress bar.
    patchTask(task.id, { status, ...(status === 'done' ? { progress: 100 } : {}) });
  };

  const isOverdue = (task: Task) =>
    !!task.dueDate && task.status !== 'done' && task.dueDate < new Date().toISOString().slice(0, 10);

  return (
    <div className="flex min-h-full bg-slate-50 dark:bg-slate-950">
      <TaskSidebar
        currentUser={currentUser}
        scope={scope}
        setScope={setScope}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        counts={counts}
        unreadCount={unreadCount}
        canManage={canManage}
      />

      <div className="flex-1 overflow-y-auto pb-16 min-w-0">
      <div className="px-8 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-brand-primary font-bold text-sm mb-2 uppercase tracking-[0.2em]">
              <List size={14} /> Giao việc
            </div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Nhiệm vụ cá nhân
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
              {canManage
                ? 'Bạn có thể tạo, giao và xoá công việc.'
                : 'Bạn có thể cập nhật trạng thái và tiến độ công việc của mình.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setView('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                  view === 'table' ? 'bg-brand-primary text-white' : 'text-slate-500'
                }`}
              >
                <List size={15} /> Bảng
              </button>
              <button
                onClick={() => setView('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                  view === 'board' ? 'bg-brand-primary text-white' : 'text-slate-500'
                }`}
              >
                <LayoutGrid size={15} /> Kanban
              </button>
            </div>

            {canManage && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-sm shadow-md hover:opacity-90"
              >
                <Plus size={16} /> Giao việc mới
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X size={16} />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="py-24 text-center text-slate-400">Đang tải...</div>
        ) : visibleTasks.length === 0 ? (
          <div className="py-24 text-center">
            <CheckCircle2 size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-400 font-medium">Chưa có công việc nào.</p>
          </div>
        ) : view === 'table' ? (
          <TaskTable
            tasks={visibleTasks}
            userName={userName}
            kpiName={kpiName}
            mayUpdate={mayUpdate}
            canManage={canManage}
            isOverdue={isOverdue}
            onPatch={patchTask}
            onRemove={removeTask}
          />
        ) : (
          <TaskBoard
            tasks={visibleTasks}
            userName={userName}
            isOverdue={isOverdue}
            draggingId={draggingId}
            dragOverColumn={dragOverColumn}
            onDragStart={setDraggingId}
            onDragOverColumn={setDragOverColumn}
            onDrop={handleDropInColumn}
          />
        )}
      </div>
      </div>

      {isFormOpen && (
        <TaskForm
          draft={draft}
          setDraft={setDraft}
          users={users}
          kpiDefs={kpiDefs}
          isSaving={isSaving}
          onCancel={() => {
            setIsFormOpen(false);
            setDraft(emptyDraft);
          }}
          onSubmit={createTask}
        />
      )}
    </div>
  );
}

interface SidebarCounts {
  all: number;
  todo: number;
  doing: number;
  review: number;
  done: number;
  overdue: number;
  progress: number;
}

/**
 * Left rail modelled on Wrike's: who you are, what is waiting for you, and how
 * far along the work is. Each row is a filter rather than decoration.
 */
function TaskSidebar({
  currentUser, scope, setScope, statusFilter, setStatusFilter, counts, unreadCount, canManage,
}: {
  currentUser: { firstName: string; lastName: string; role: string; avatar?: string } | null;
  scope: 'mine' | 'all';
  setScope: (next: 'mine' | 'all') => void;
  statusFilter: TaskStatus | 'all' | 'overdue';
  setStatusFilter: (next: TaskStatus | 'all' | 'overdue') => void;
  counts: SidebarCounts;
  unreadCount: number;
  canManage: boolean;
}) {
  const rows: { id: TaskStatus | 'all' | 'overdue'; label: string; count: number; dot?: string }[] = [
    { id: 'all', label: 'Tất cả', count: counts.all },
    { id: 'todo', label: 'Chưa bắt đầu', count: counts.todo, dot: 'bg-slate-400' },
    { id: 'doing', label: 'Đang làm', count: counts.doing, dot: 'bg-blue-500' },
    { id: 'review', label: 'Chờ duyệt', count: counts.review, dot: 'bg-amber-500' },
    { id: 'done', label: 'Hoàn thành', count: counts.done, dot: 'bg-emerald-500' },
  ];

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[#141c2b] text-slate-300">
      {/* Who you are */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        {currentUser?.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUser.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-black">
            {currentUser?.firstName?.charAt(0) ?? '?'}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-bold text-white text-sm truncate">
            {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Khách'}
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {currentUser?.role ?? ''}
          </div>
        </div>
      </div>

      {/* Inbox */}
      <div className="px-3 py-3 border-b border-white/5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
        >
          <Inbox size={16} />
          <span>Hộp thư</span>
          {unreadCount > 0 && (
            <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>

      {/* Scope: only managers have anyone else to look at */}
      {canManage && (
        <div className="px-3 pt-4 pb-2">
          <div className="flex bg-white/5 rounded-lg p-1">
            {(['mine', 'all'] as const).map(option => (
              <button
                key={option}
                onClick={() => setScope(option)}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  scope === option ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {option === 'mine' ? 'Của tôi' : 'Cả nhóm'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Task counts, each one a filter */}
      <div className="px-3 py-3">
        <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
          {scope === 'mine' ? 'Việc của tôi' : 'Việc cả nhóm'}
        </div>

        {rows.map(row => (
          <button
            key={row.id}
            onClick={() => setStatusFilter(row.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              statusFilter === row.id ? 'bg-white/10 text-white font-bold' : 'hover:bg-white/5'
            }`}
          >
            {row.dot ? <span className={`w-2 h-2 rounded-full ${row.dot}`} /> : <ListChecks size={15} />}
            <span className="truncate">{row.label}</span>
            <span className="ml-auto text-xs font-bold text-slate-400">{row.count}</span>
          </button>
        ))}

        {counts.overdue > 0 && (
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm transition-colors ${
              statusFilter === 'overdue' ? 'bg-red-500/20 text-red-300 font-bold' : 'text-red-400 hover:bg-red-500/10'
            }`}
          >
            <AlertCircle size={15} />
            <span>Quá hạn</span>
            <span className="ml-auto text-xs font-bold">{counts.overdue}</span>
          </button>
        )}
      </div>

      {/* Progress card, in the spot Wrike puts Quick start */}
      <div className="mt-auto p-4">
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="text-xs font-black text-white mb-1">Tiến độ chung</div>
          <p className="text-[11px] text-slate-400 mb-3">
            {counts.done}/{counts.all} việc đã hoàn thành
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  counts.progress >= 100 ? 'bg-emerald-500' : 'bg-brand-primary'
                }`}
                style={{ width: `${counts.progress}%` }}
              />
            </div>
            <span className="text-xs font-black text-white">{counts.progress}%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${value >= 100 ? 'bg-emerald-500' : 'bg-brand-primary'}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-bold text-slate-500 w-9 text-right">{value}%</span>
    </div>
  );
}

function TaskTable({
  tasks, userName, kpiName, mayUpdate, canManage, isOverdue, onPatch, onRemove,
}: {
  tasks: Task[];
  userName: (id: number | null) => string;
  kpiName: (id: string | null) => string | null;
  mayUpdate: (task: Task) => boolean;
  canManage: boolean;
  isOverdue: (task: Task) => boolean;
  onPatch: (id: string, changes: Partial<Task>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
            <th className="text-left font-bold px-5 py-3">Công việc</th>
            <th className="text-left font-bold px-5 py-3">Người làm</th>
            <th className="text-left font-bold px-5 py-3">KPI</th>
            <th className="text-left font-bold px-5 py-3">Trạng thái</th>
            <th className="text-left font-bold px-5 py-3">Ưu tiên</th>
            <th className="text-left font-bold px-5 py-3">Hạn</th>
            <th className="text-left font-bold px-5 py-3">Tiến độ</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => {
            const editable = mayUpdate(task);
            return (
              <tr key={task.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                <td className="px-5 py-3">
                  <div className="font-bold text-slate-800 dark:text-white">{task.title}</div>
                  {task.description && (
                    <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</div>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{userName(task.assigneeId)}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{kpiName(task.kpiId) ?? '—'}</td>
                <td className="px-5 py-3">
                  <select
                    value={task.status}
                    disabled={!editable}
                    onChange={e => onPatch(task.id, { status: e.target.value as TaskStatus })}
                    className="text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 disabled:opacity-60"
                  >
                    {COLUMNS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3">
                  {(() => {
                    const p = PRIORITIES.find(x => x.id === task.priority) ?? PRIORITIES[1];
                    return (
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full border ${p.className}`}>
                        {p.label}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-5 py-3">
                  {task.dueDate ? (
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue(task) ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                      <CalendarDays size={13} /> {task.dueDate}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {editable ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={task.progress}
                        onChange={e => onPatch(task.id, { progress: Number(e.target.value) })}
                        className="w-24"
                      />
                      <span className="text-xs font-bold text-slate-500 w-9">{task.progress}%</span>
                    </div>
                  ) : (
                    <ProgressBar value={task.progress} />
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  {canManage && (
                    <button
                      onClick={() => onRemove(task.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      title="Xoá"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TaskBoard({
  tasks, userName, isOverdue, draggingId, dragOverColumn, onDragStart, onDragOverColumn, onDrop,
}: {
  tasks: Task[];
  userName: (id: number | null) => string;
  isOverdue: (task: Task) => boolean;
  draggingId: string | null;
  dragOverColumn: TaskStatus | null;
  onDragStart: (id: string) => void;
  onDragOverColumn: (status: TaskStatus | null) => void;
  onDrop: (status: TaskStatus) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map(column => {
        const columnTasks = tasks.filter(t => t.status === column.id);
        return (
          <div
            key={column.id}
            onDragOver={e => { e.preventDefault(); onDragOverColumn(column.id); }}
            onDragLeave={() => onDragOverColumn(null)}
            onDrop={e => { e.preventDefault(); onDrop(column.id); }}
            className={`rounded-2xl border p-3 min-h-[240px] transition-colors ${
              dragOverColumn === column.id
                ? 'border-brand-primary bg-brand-primary/5'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2 px-2 pb-3">
              <span className={`w-2 h-2 rounded-full ${column.accent}`} />
              <h3 className="font-black text-sm text-slate-700 dark:text-slate-200">{column.label}</h3>
              <span className="ml-auto text-xs font-bold text-slate-400">{columnTasks.length}</span>
            </div>

            <div className="space-y-2">
              {columnTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => onDragStart(task.id)}
                  className={`rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3 cursor-grab active:cursor-grabbing ${
                    draggingId === task.id ? 'opacity-40' : ''
                  }`}
                >
                  <div className="font-bold text-sm text-slate-800 dark:text-white mb-1">{task.title}</div>
                  <div className="text-[11px] text-slate-500 mb-2">{userName(task.assigneeId)}</div>
                  {task.dueDate && (
                    <div className={`text-[11px] font-medium mb-2 ${isOverdue(task) ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                      Hạn: {task.dueDate}
                    </div>
                  )}
                  <ProgressBar value={task.progress} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskForm({
  draft, setDraft, users, kpiDefs, isSaving, onCancel, onSubmit,
}: {
  draft: typeof emptyDraft;
  setDraft: (next: typeof emptyDraft) => void;
  users: { id: number; firstName: string; lastName: string }[];
  kpiDefs: { id: string; name: string }[];
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const field = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-primary bg-white';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="font-black text-slate-800">Giao việc mới</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Tên công việc *</label>
            <input
              value={draft.title}
              onChange={e => setDraft({ ...draft, title: e.target.value })}
              placeholder="Ví dụ: Hoàn thiện bản vẽ thiết kế"
              className={field}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Mô tả</label>
            <textarea
              value={draft.description}
              onChange={e => setDraft({ ...draft, description: e.target.value })}
              rows={2}
              className={field}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Giao cho</label>
              <select
                value={draft.assigneeId}
                onChange={e => setDraft({ ...draft, assigneeId: e.target.value === '' ? '' : Number(e.target.value) })}
                className={field}
              >
                <option value="">— Chọn người —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Thuộc KPI</label>
              <select
                value={draft.kpiId}
                onChange={e => setDraft({ ...draft, kpiId: e.target.value })}
                className={field}
              >
                <option value="">— Không gắn —</option>
                {kpiDefs.map(k => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Trạng thái</label>
              <select
                value={draft.status}
                onChange={e => setDraft({ ...draft, status: e.target.value as TaskStatus })}
                className={field}
              >
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Ưu tiên</label>
              <select
                value={draft.priority}
                onChange={e => setDraft({ ...draft, priority: e.target.value as TaskPriority })}
                className={field}
              >
                {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Bắt đầu</label>
              <input
                type="date"
                value={draft.startDate}
                onChange={e => setDraft({ ...draft, startDate: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Hạn hoàn thành</label>
              <input
                type="date"
                value={draft.dueDate}
                onChange={e => setDraft({ ...draft, dueDate: e.target.value })}
                className={field}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100">
            Huỷ
          </button>
          <button
            onClick={onSubmit}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold shadow-md hover:opacity-90 disabled:opacity-60"
          >
            {isSaving ? 'Đang lưu...' : 'Giao việc'}
          </button>
        </div>
      </div>
    </div>
  );
}
