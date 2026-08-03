import { isOnline } from './supabase';
import { queryWithFallback } from './supabase-admin';

/**
 * Server-side access to every KPI table.
 *
 * These queries used to run in the browser with the anon key, which meant the
 * key shipped in the JS bundle could read and write the entire database. All of
 * it now goes through Route Handlers behind a session check, so RLS can be
 * locked down (see supabase/schema.sql).
 */

type Row = Record<string, unknown>;

/** The snapshot shape the client works with — camelCase, same as KPIContext. */
export interface KPISnapshot {
  users: Row[];
  kpiDefs: Row[];
  userActuals: Row[];
  userTargets: Row[];
  dashboardCharts: Row[];
  reports: Row[];
  customColumns: string[] | null;
  hiddenCols: string[] | null;
}

export const DELETABLE_TABLES = ['users', 'kpi_definitions', 'kpi_reports'] as const;
export type DeletableTable = (typeof DELETABLE_TABLES)[number];

/** Set if the kpi_definitions table predates the sheet_type column. */
let sheetTypeColumnMissing = false;

const num = (value: unknown) => Number(value ?? 0);

// --- row mappers -------------------------------------------------------------

const userFromRow = (r: Row) => ({
  id: num(r.id),
  firstName: r.first_name ?? '',
  lastName: r.last_name ?? '',
  email: r.email ?? '',
  role: r.role ?? 'User',
  department: r.department ?? '',
  position: r.position ?? '',
  avatar: r.avatar ?? undefined,
});

const userToRow = (u: Row) => ({
  id: u.id,
  first_name: u.firstName,
  last_name: u.lastName,
  email: u.email,
  role: u.role,
  department: u.department,
  position: u.position,
  avatar: u.avatar,
});

const kpiFromRow = (r: Row) => ({
  id: r.id,
  name: r.name,
  unit: r.unit,
  description: r.description,
  icon: r.icon,
  frequency: r.frequency,
  format: r.format,
  direction: r.direction,
  category: r.category,
  aggregation: r.aggregation,
  thresholds: r.thresholds,
  workingDays: r.working_days,
  formula: r.formula,
  calculateThisTarget: r.calculate_this_target,
  hasTarget: r.has_target,
  customValues: r.custom_values ?? {},
  sheetType: r.sheet_type ?? 'MBO',
});

const kpiToRow = (k: Row) => ({
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
  has_target: k.hasTarget,
  custom_values: k.customValues,
  // Previously omitted, so a KPI's MBO / ACTION_PLAN sheet was lost on every
  // cloud round-trip.
  sheet_type: k.sheetType ?? 'MBO',
});

const actualFromRow = (r: Row) => ({
  id: r.id,
  kpiId: r.kpi_id,
  userId: num(r.user_id),
  date: r.date,
  actualValue: num(r.actual_value),
});

const actualToRow = (a: Row) => ({
  id: a.id,
  kpi_id: a.kpiId,
  user_id: a.userId,
  date: a.date,
  actual_value: a.actualValue,
});

const targetFromRow = (r: Row) => ({
  id: r.id,
  kpiId: r.kpi_id,
  userId: num(r.user_id),
  dateKey: r.date_key,
  targetValue: num(r.target_value),
});

const targetToRow = (t: Row) => ({
  id: t.id,
  kpi_id: t.kpiId,
  user_id: t.userId,
  date_key: t.dateKey,
  target_value: t.targetValue,
});

const chartFromRow = (r: Row) => ({
  id: r.id,
  type: r.type,
  kpiId: r.kpi_id,
  kpiIds: r.kpi_ids,
  title: r.title,
  dateRange: r.date_range,
});

const reportFromRow = (r: Row) => ({
  id: r.id,
  kpiId: r.kpi_id,
  userId: num(r.user_id),
  dateKey: r.date_key,
  month: r.month,
  customer: r.customer,
  type: r.type,
  reportName: r.report_name,
  picId: num(r.pic_id),
  url: r.url,
  status: r.status,
  date: r.date,
  note: r.note,
  isDone: r.is_done,
});

const reportToRow = (r: Row) => ({
  id: r.id,
  kpi_id: r.kpiId,
  user_id: r.userId,
  date_key: r.dateKey,
  month: r.month,
  customer: r.customer,
  type: r.type,
  report_name: r.reportName,
  pic_id: r.picId,
  url: r.url,
  status: r.status,
  date: r.date,
  note: r.note,
  is_done: r.isDone,
});

// --- reads -------------------------------------------------------------------

async function selectAll(table: string, columns = '*'): Promise<Row[]> {
  const { data, error } = await queryWithFallback<Row[]>((client) =>
    client.from(table).select(columns) as unknown as PromiseLike<{
      data: Row[] | null;
      error: { message: string } | null;
    }>
  );
  if (error) {
    console.error(`Failed to read ${table}`, error);
    return [];
  }
  return data ?? [];
}

export async function loadAll(): Promise<KPISnapshot | null> {
  if (!isOnline) return null;

  const [users, kpis, actuals, targets, charts, reports, settings] = await Promise.all([
    // Explicit columns: password_hash must never leave the server.
    selectAll('users', 'id, first_name, last_name, email, role, department, position, avatar'),
    selectAll('kpi_definitions'),
    selectAll('user_actuals'),
    selectAll('user_targets'),
    selectAll('dashboard_charts'),
    selectAll('kpi_reports'),
    selectAll('app_settings'),
  ]);

  const global = settings.find((s) => s.id === 'global_mbo_settings');

  return {
    users: users.map(userFromRow),
    kpiDefs: kpis.filter((k) => String(k.name ?? '').trim() !== '').map(kpiFromRow),
    userActuals: actuals.map(actualFromRow),
    userTargets: targets.map(targetFromRow),
    dashboardCharts: charts.map(chartFromRow),
    reports: reports.map(reportFromRow),
    customColumns: (global?.custom_columns as string[]) ?? null,
    hiddenCols: (global?.hidden_cols as string[]) ?? null,
  };
}

// --- writes ------------------------------------------------------------------

async function upsert(table: string, rows: Row[]): Promise<string | null> {
  if (rows.length === 0) return null;
  const { error } = await queryWithFallback((client) => client.from(table).upsert(rows));
  if (error) {
    console.error(`Failed to write ${table}`, error);
    return `${table}: ${error.message}`;
  }
  return null;
}

/** Returns a list of per-table error messages; empty means everything saved. */
export async function saveAll(snapshot: Partial<KPISnapshot>): Promise<string[]> {
  if (!isOnline) return ['Supabase chưa được cấu hình.'];

  const errors: string[] = [];
  const push = (message: string | null) => {
    if (message) errors.push(message);
  };

  if (snapshot.users) push(await upsert('users', snapshot.users.map(userToRow)));

  if (snapshot.kpiDefs) {
    const rows = snapshot.kpiDefs
      .filter((k) => String(k.name ?? '').trim() !== '')
      .map(kpiToRow);

    if (sheetTypeColumnMissing) {
      push(await upsert('kpi_definitions', rows.map(({ sheet_type: _drop, ...rest }) => rest)));
    } else {
      const failure = await upsert('kpi_definitions', rows);
      if (failure && /sheet_type/i.test(failure)) {
        // Older table without the column: drop it and retry once.
        sheetTypeColumnMissing = true;
        console.warn('kpi_definitions.sheet_type is missing; saving without it.');
        push(await upsert('kpi_definitions', rows.map(({ sheet_type: _drop, ...rest }) => rest)));
      } else {
        push(failure);
      }
    }
  }

  if (snapshot.userActuals) push(await upsert('user_actuals', snapshot.userActuals.map(actualToRow)));
  if (snapshot.userTargets) push(await upsert('user_targets', snapshot.userTargets.map(targetToRow)));
  if (snapshot.reports) push(await upsert('kpi_reports', snapshot.reports.map(reportToRow)));

  if (snapshot.customColumns || snapshot.hiddenCols) {
    push(
      await upsert('app_settings', [
        {
          id: 'global_mbo_settings',
          custom_columns: snapshot.customColumns ?? [],
          hidden_cols: snapshot.hiddenCols ?? [],
          updated_at: new Date().toISOString(),
        },
      ])
    );
  }

  return errors;
}

export async function deleteRow(table: DeletableTable, id: string | number): Promise<string | null> {
  if (!isOnline) return 'Supabase chưa được cấu hình.';

  const { error } = await queryWithFallback((client) => client.from(table).delete().eq('id', id));
  if (error) {
    console.error(`Failed to delete from ${table}`, error);
    return error.message;
  }
  return null;
}
