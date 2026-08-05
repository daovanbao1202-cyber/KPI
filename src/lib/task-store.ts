import { isOnline } from './supabase';
import { queryWithFallback } from './supabase-admin';

/**
 * Server-side access to task assignments.
 *
 * Kept apart from kpi-store because tasks have their own authorization rules:
 * managers assign them, and the person assigned may only move their own along.
 */

type Row = Record<string, unknown>;

export const TASK_STATUSES = ['todo', 'doing', 'review', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
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

/** Fields the assignee may change on their own task. */
export const ASSIGNEE_EDITABLE_FIELDS = ['status', 'progress'] as const;

const str = (value: unknown, fallback = '') =>
  value === null || value === undefined ? fallback : String(value);

const numOrNull = (value: unknown) =>
  value === null || value === undefined || value === '' ? null : Number(value);

export function normalizeStatus(value: unknown): TaskStatus {
  const candidate = str(value, 'todo') as TaskStatus;
  return TASK_STATUSES.includes(candidate) ? candidate : 'todo';
}

export function normalizePriority(value: unknown): TaskPriority {
  const candidate = str(value, 'medium') as TaskPriority;
  return TASK_PRIORITIES.includes(candidate) ? candidate : 'medium';
}

/** Clamped so a stray value cannot produce a progress bar past 100%. */
export function normalizeProgress(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, Math.round(parsed)));
}

const fromRow = (r: Row): Task => ({
  id: str(r.id),
  title: str(r.title),
  description: str(r.description),
  assigneeId: numOrNull(r.assignee_id),
  kpiId: r.kpi_id ? str(r.kpi_id) : null,
  status: normalizeStatus(r.status),
  priority: normalizePriority(r.priority),
  startDate: r.start_date ? str(r.start_date) : null,
  dueDate: r.due_date ? str(r.due_date) : null,
  progress: normalizeProgress(r.progress),
  createdBy: numOrNull(r.created_by),
  position: Number(r.position ?? 0),
});

const toRow = (t: Partial<Task>) => ({
  id: t.id,
  title: t.title,
  description: t.description ?? '',
  assignee_id: t.assigneeId ?? null,
  kpi_id: t.kpiId || null,
  status: normalizeStatus(t.status),
  priority: normalizePriority(t.priority),
  start_date: t.startDate || null,
  due_date: t.dueDate || null,
  progress: normalizeProgress(t.progress),
  created_by: t.createdBy ?? null,
  position: t.position ?? 0,
});

export async function listTasks(): Promise<Task[]> {
  if (!isOnline) return [];

  const { data, error } = await queryWithFallback<Row[]>((client) =>
    client.from('tasks').select('*').order('position', { ascending: true }) as unknown as PromiseLike<{
      data: Row[] | null;
      error: { message: string } | null;
    }>
  );

  if (error) {
    console.error('Failed to read tasks', error);
    return [];
  }
  return (data ?? []).map(fromRow);
}

export async function findTask(id: string): Promise<Task | null> {
  if (!isOnline) return null;

  const { data, error } = await queryWithFallback<Row[]>((client) =>
    client.from('tasks').select('*').eq('id', id).limit(1) as unknown as PromiseLike<{
      data: Row[] | null;
      error: { message: string } | null;
    }>
  );

  if (error || !data || data.length === 0) return null;
  return fromRow(data[0]);
}

export async function upsertTasks(tasks: Partial<Task>[]): Promise<string | null> {
  if (!isOnline) return 'Supabase chưa được cấu hình.';
  if (tasks.length === 0) return null;

  const { error } = await queryWithFallback((client) =>
    client.from('tasks').upsert(tasks.map(toRow))
  );

  if (error) {
    console.error('Failed to write tasks', error);
    return error.message;
  }
  return null;
}

export async function deleteTask(id: string): Promise<string | null> {
  if (!isOnline) return 'Supabase chưa được cấu hình.';

  const { error } = await queryWithFallback((client) => client.from('tasks').delete().eq('id', id));
  if (error) {
    console.error('Failed to delete task', error);
    return error.message;
  }
  return null;
}
