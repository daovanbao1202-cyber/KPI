'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Filter, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NO_KPI, NO_KPI_COLOR, kpiVisual } from '@/lib/kpi-colors';

/**
 * Month calendar for task assignments.
 *
 * Each task is a bar running from its start date to its due date, so a glance
 * shows what overlaps and where a week is overloaded.
 *
 * Bars are coloured by KPI rather than by status: every task belongs to one, so
 * the KPI is what distinguishes bars from each other on a crowded week. Status
 * is still readable — finished work is struck through and faded.
 */

export interface CalendarTask {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'review' | 'done';
  startDate: string | null;
  dueDate: string | null;
  assigneeId: number | null;
  kpiId: string | null;
}

export interface CalendarKpi {
  id: string;
  name: string;
  icon?: string;
}

const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const STATUS_LABEL: Record<CalendarTask['status'], string> = {
  todo: 'Chưa bắt đầu',
  doing: 'Đang làm',
  review: 'Chờ duyệt',
  done: 'Hoàn thành',
};

const BAR_HEIGHT = 22;
const BAR_GAP = 4;

/** Local-date key, avoiding the UTC shift that toISOString introduces. */
function toKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

interface Segment {
  task: CalendarTask;
  startIndex: number;
  span: number;
  continuesLeft: boolean;
  continuesRight: boolean;
  lane: number;
}

/**
 * Places each task on the first row where it does not collide, the way a
 * calendar stacks overlapping events.
 */
function layoutWeek(tasks: CalendarTask[], weekStart: Date): Segment[] {
  const weekStartKey = toKey(weekStart);
  const weekEndKey = toKey(addDays(weekStart, 6));

  const segments: Omit<Segment, 'lane'>[] = [];

  for (const task of tasks) {
    // A task with only one date still deserves a mark on that day.
    const start = task.startDate || task.dueDate;
    const end = task.dueDate || task.startDate;
    if (!start || !end) continue;

    const from = start <= end ? start : end;
    const to = start <= end ? end : start;
    if (to < weekStartKey || from > weekEndKey) continue;

    const clampedFrom = from < weekStartKey ? weekStartKey : from;
    const clampedTo = to > weekEndKey ? weekEndKey : to;

    let startIndex = 0;
    let endIndex = 0;
    for (let i = 0; i < 7; i++) {
      const key = toKey(addDays(weekStart, i));
      if (key === clampedFrom) startIndex = i;
      if (key === clampedTo) endIndex = i;
    }

    segments.push({
      task,
      startIndex,
      span: Math.max(1, endIndex - startIndex + 1),
      continuesLeft: from < weekStartKey,
      continuesRight: to > weekEndKey,
    });
  }

  segments.sort((a, b) => a.startIndex - b.startIndex || b.span - a.span);

  const laneEnds: number[] = [];
  return segments.map((segment) => {
    let lane = laneEnds.findIndex((end) => end < segment.startIndex);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = segment.startIndex + segment.span - 1;
    return { ...segment, lane };
  });
}

export default function TaskCalendar({
  tasks,
  kpis,
  userName,
}: {
  tasks: CalendarTask[];
  kpis: CalendarKpi[];
  userName: (id: number | null) => string;
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [panelOpen, setPanelOpen] = useState(true);
  const [hiddenKpis, setHiddenKpis] = useState<Set<string>>(new Set());
  const [hiddenStatuses, setHiddenStatuses] = useState<Set<CalendarTask['status']>>(new Set());

  const todayKey = toKey(new Date());

  /** Only KPIs that actually have tasks, plus a bucket for unlinked ones. */
  const legend = useMemo(() => {
    const entries = kpis
      .map((kpi) => {
        const visual = kpiVisual(kpi.id, kpis);
        return {
          id: kpi.id,
          name: visual.name,
          icon: visual.icon,
          color: visual.color,
          count: tasks.filter((t) => t.kpiId === kpi.id).length,
        };
      })
      .filter((entry) => entry.count > 0);

    const unlinked = tasks.filter((t) => !t.kpiId).length;
    if (unlinked > 0) {
      entries.push({
        id: NO_KPI,
        name: 'Không gắn KPI',
        icon: '—',
        color: NO_KPI_COLOR,
        count: unlinked,
      });
    }
    return entries;
  }, [kpis, tasks]);

  const colorFor = (kpiId: string | null) =>
    legend.find((entry) => entry.id === (kpiId ?? NO_KPI))?.color ?? NO_KPI_COLOR;

  const iconFor = (kpiId: string | null) =>
    legend.find((entry) => entry.id === (kpiId ?? NO_KPI))?.icon ?? '🎯';

  const kpiNameFor = (kpiId: string | null) =>
    legend.find((entry) => entry.id === (kpiId ?? NO_KPI))?.name ?? '';

  const visible = useMemo(
    () =>
      tasks.filter(
        (task) => !hiddenKpis.has(task.kpiId ?? NO_KPI) && !hiddenStatuses.has(task.status)
      ),
    [tasks, hiddenKpis, hiddenStatuses]
  );

  const weeks = useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    // Back up to the Sunday on or before the 1st.
    const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());
    return Array.from({ length: 6 }, (_, week) => addDays(gridStart, week * 7));
  }, [cursor]);

  const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const undated = visible.filter((t) => !t.startDate && !t.dueDate);

  return (
    <div className="flex gap-4 items-start">
      {panelOpen ? (
        <aside className="hidden md:block w-56 shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200">
              <Filter size={14} /> Bộ lọc
            </span>
            <button
              onClick={() => setPanelOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 -mr-1"
              aria-label="Thu gọn bộ lọc"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="px-1 pb-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                KPI
              </span>
              <button
                onClick={() => setHiddenKpis(new Set())}
                className="text-[10px] font-bold text-brand-primary hover:underline"
              >
                Chọn hết
              </button>
            </div>

            {legend.length === 0 && (
              <p className="px-1 text-[11px] text-slate-400">Chưa có công việc nào.</p>
            )}

            {legend.map((entry) => {
              const on = !hiddenKpis.has(entry.id);
              return (
                <button
                  key={entry.id}
                  onClick={() => setHiddenKpis(toggle(hiddenKpis, entry.id))}
                  className="w-full flex items-center gap-2 px-1 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                >
                  <span
                    className={`w-4 h-4 shrink-0 rounded flex items-center justify-center border ${
                      on ? `${entry.color.dot} border-transparent` : 'border-slate-300 bg-white'
                    }`}
                  >
                    {on && (
                      <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none">
                        <path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm shrink-0">{entry.icon}</span>
                  <span className={`text-[12px] truncate ${on ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-400'}`}>
                    {entry.name}
                  </span>
                  <span className="ml-auto text-[11px] font-bold text-slate-400">{entry.count}</span>
                </button>
              );
            })}
          </div>

          <div className="px-3 py-3">
            <div className="px-1 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Trạng thái
            </div>
            {(Object.keys(STATUS_LABEL) as CalendarTask['status'][]).map((status) => {
              const on = !hiddenStatuses.has(status);
              const count = tasks.filter((t) => t.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setHiddenStatuses(toggle(hiddenStatuses, status))}
                  className="w-full flex items-center gap-2 px-1 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                >
                  <span
                    className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center ${
                      on ? 'bg-brand-primary border-transparent' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {on && (
                      <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none">
                        <path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-[12px] ${on ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-400'}`}>
                    {STATUS_LABEL[status]}
                  </span>
                  <span className="ml-auto text-[11px] font-bold text-slate-400">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>
      ) : (
        <button
          onClick={() => setPanelOpen(true)}
          className="hidden md:flex shrink-0 items-center justify-center w-10 h-10 mt-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600"
          aria-label="Mở bộ lọc"
        >
          <PanelLeftOpen size={16} />
        </button>
      )}

      <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Tháng trước"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => {
              const now = new Date();
              setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Hôm nay
          </button>

          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Tháng sau"
          >
            <ChevronRight size={18} />
          </button>

          <h3 className="ml-2 font-black text-slate-800 dark:text-white">
            Tháng {cursor.getMonth() + 1}, {cursor.getFullYear()}
          </h3>

          <span className="ml-auto text-[11px] font-bold text-slate-400">
            {visible.length}/{tasks.length} công việc
          </span>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400 text-center"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {weeks.map((weekStart, weekIndex) => {
              const segments = layoutWeek(visible, weekStart);
              const lanes = segments.reduce((max, s) => Math.max(max, s.lane + 1), 0);
              const bodyHeight = Math.max(64, lanes * (BAR_HEIGHT + BAR_GAP) + 8);

              return (
                <div key={weekIndex} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                  <div className="grid grid-cols-7">
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const day = addDays(weekStart, dayIndex);
                      const key = toKey(day);
                      const inMonth = day.getMonth() === cursor.getMonth();
                      const isToday = key === todayKey;

                      return (
                        <div
                          key={dayIndex}
                          className={`px-2 pt-2 border-r border-slate-50 dark:border-slate-800/60 last:border-r-0 ${
                            isToday ? 'bg-brand-primary/5' : ''
                          }`}
                        >
                          <span
                            className={`text-xs font-bold ${
                              isToday
                                ? 'text-brand-primary'
                                : inMonth
                                  ? 'text-slate-600 dark:text-slate-300'
                                  : 'text-slate-300 dark:text-slate-600'
                            }`}
                          >
                            {day.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bars float above the day cells so one can span several days. */}
                  <div className="relative" style={{ height: bodyHeight }}>
                    {segments.map((segment) => {
                      const color = colorFor(segment.task.kpiId);
                      const done = segment.task.status === 'done';

                      return (
                        <div
                          key={`${segment.task.id}-${weekIndex}`}
                          title={`${kpiNameFor(segment.task.kpiId)} — ${segment.task.title}\n${userName(
                            segment.task.assigneeId
                          )} · ${STATUS_LABEL[segment.task.status]}${
                            segment.task.dueDate ? ` · hạn ${segment.task.dueDate}` : ''
                          }`}
                          className={`absolute flex items-center gap-1 truncate text-[11px] font-bold px-2 border ${
                            color.bar
                          } ${done ? 'opacity-60' : ''} ${
                            segment.continuesLeft ? 'rounded-l-none' : 'rounded-l-md'
                          } ${segment.continuesRight ? 'rounded-r-none' : 'rounded-r-md'}`}
                          style={{
                            left: `calc(${(segment.startIndex / 7) * 100}% + 4px)`,
                            width: `calc(${(segment.span / 7) * 100}% - 8px)`,
                            top: segment.lane * (BAR_HEIGHT + BAR_GAP),
                            height: BAR_HEIGHT,
                          }}
                        >
                          {segment.continuesLeft ? (
                            <span className="shrink-0 opacity-60">‹</span>
                          ) : (
                            <>
                              <span className="shrink-0 leading-none">{iconFor(segment.task.kpiId)}</span>
                              {/* KPI name first, then the task. Lighter weight so
                                  the task title still reads as the subject. */}
                              <span className="shrink-0 max-w-[45%] truncate font-semibold opacity-75">
                                {kpiNameFor(segment.task.kpiId)}
                              </span>
                              <span className="shrink-0 opacity-40">·</span>
                            </>
                          )}

                          <span className={`truncate ${done ? 'line-through' : ''}`}>
                            {segment.task.title}
                          </span>

                          {segment.continuesRight && <span className="shrink-0 opacity-60">›</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {undated.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
            <p className="text-[11px] font-bold text-slate-500">
              {undated.length} công việc chưa có ngày nên không hiện trên lịch:{' '}
              <span className="font-medium text-slate-400">
                {undated.slice(0, 3).map((t) => t.title).join(', ')}
                {undated.length > 3 ? '…' : ''}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
