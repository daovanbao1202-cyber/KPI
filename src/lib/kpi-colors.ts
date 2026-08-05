/**
 * One colour per KPI, shared by every view.
 *
 * Assigned by the KPI's position in the list rather than hashing its name, so a
 * KPI keeps its colour when renamed and the palette stays evenly spread. Kept
 * here rather than inside one view so the calendar, the board and the table
 * cannot drift into showing the same KPI in different colours.
 */

export interface KpiColor {
  /** Filled bar or chip: background, border and text together. */
  bar: string;
  /** Solid swatch for dots and checkboxes. */
  dot: string;
  /** Faint tint for a card accent. */
  soft: string;
}

const PALETTE: KpiColor[] = [
  { bar: 'bg-emerald-100 border-emerald-400 text-emerald-900', dot: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-700' },
  { bar: 'bg-sky-100 border-sky-400 text-sky-900', dot: 'bg-sky-500', soft: 'bg-sky-50 text-sky-700' },
  { bar: 'bg-violet-100 border-violet-400 text-violet-900', dot: 'bg-violet-500', soft: 'bg-violet-50 text-violet-700' },
  { bar: 'bg-amber-100 border-amber-400 text-amber-900', dot: 'bg-amber-500', soft: 'bg-amber-50 text-amber-700' },
  { bar: 'bg-rose-100 border-rose-400 text-rose-900', dot: 'bg-rose-500', soft: 'bg-rose-50 text-rose-700' },
  { bar: 'bg-teal-100 border-teal-400 text-teal-900', dot: 'bg-teal-500', soft: 'bg-teal-50 text-teal-700' },
  { bar: 'bg-indigo-100 border-indigo-400 text-indigo-900', dot: 'bg-indigo-500', soft: 'bg-indigo-50 text-indigo-700' },
  { bar: 'bg-orange-100 border-orange-400 text-orange-900', dot: 'bg-orange-500', soft: 'bg-orange-50 text-orange-700' },
  { bar: 'bg-lime-100 border-lime-400 text-lime-900', dot: 'bg-lime-500', soft: 'bg-lime-50 text-lime-700' },
  { bar: 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-900', dot: 'bg-fuchsia-500', soft: 'bg-fuchsia-50 text-fuchsia-700' },
];

/** Used for tasks with no KPI attached. */
export const NO_KPI_COLOR: KpiColor = {
  bar: 'bg-slate-100 border-slate-300 text-slate-700',
  dot: 'bg-slate-400',
  soft: 'bg-slate-50 text-slate-500',
};

export const NO_KPI = '__none__';

export interface KpiLike {
  id: string;
  name: string;
  icon?: string;
}

/** Colour, icon and name for a KPI id, given the full KPI list for ordering. */
export function kpiVisual(kpiId: string | null | undefined, kpis: KpiLike[]) {
  const index = kpis.findIndex((k) => k.id === kpiId);
  if (index === -1) {
    return { color: NO_KPI_COLOR, icon: '—', name: kpiId ? 'KPI đã xoá' : 'Không gắn KPI' };
  }
  return {
    color: PALETTE[index % PALETTE.length],
    icon: kpis[index].icon || '🎯',
    name: kpis[index].name,
  };
}
