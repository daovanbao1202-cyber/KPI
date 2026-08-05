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
  groups: Row[];
  groupItems: Row[];
  customColumns: string[] | null;
  hiddenCols: string[] | null;
}

export const DELETABLE_TABLES = [
  'users',
  'kpi_definitions',
  'kpi_reports',
  'dashboard_charts',
] as const;
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

const chartToRow = (c: Row, index: number) => ({
  id: c.id,
  type: c.type,
  kpi_id: c.kpiId,
  kpi_ids: c.kpiIds,
  title: c.title,
  date_range: c.dateRange,
  // Array order is the display order; without a column it is lost on reload.
  position: index,
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

/** Like selectAll, but sorted — falling back if the sort column is absent. */
async function selectAllOrdered(table: string, column: string): Promise<Row[]> {
  const { data, error } = await queryWithFallback<Row[]>((client) =>
    client.from(table).select('*').order(column, { ascending: true }) as unknown as PromiseLike<{
      data: Row[] | null;
      error: { message: string } | null;
    }>
  );

  if (error) {
    if (new RegExp(column, 'i').test(error.message)) return selectAll(table);
    console.error(`Failed to read ${table}`, error);
    return [];
  }
  return data ?? [];
}

export async function loadAll(): Promise<KPISnapshot | null> {
  if (!isOnline) return null;

  const [users, kpis, actuals, targets, charts, reports, settings, groups, groupItems] = await Promise.all([
    // Explicit columns: password_hash must never leave the server.
    selectAll('users', 'id, first_name, last_name, email, role, department, position, avatar'),
    selectAll('kpi_definitions'),
    selectAll('user_actuals'),
    selectAll('user_targets'),
    selectAllOrdered('dashboard_charts', 'position'),
    selectAll('kpi_reports'),
    selectAll('app_settings'),
    selectAll('kpi_groups'),
    selectAll('kpi_group_items'),
  ]);

  const global = settings.find((s) => s.id === 'global_mbo_settings');

  return {
    users: users.map(userFromRow),
    kpiDefs: kpis.filter((k) => String(k.name ?? '').trim() !== '').map(kpiFromRow),
    userActuals: actuals.map(actualFromRow),
    userTargets: targets.map(targetFromRow),
    dashboardCharts: charts.map(chartFromRow),
    reports: reports.map(reportFromRow),
    groups: groups.map((g) => ({ id: g.id, name: g.name })),
    groupItems: groupItems.map((g) => ({ id: g.id, groupId: g.group_id, name: g.name })),
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

/** Set once we learn dashboard_charts has no position column yet. */
let positionColumnMissing = false;

/**
 * Deletes every row of `table` whose id is not in `keep`.
 *
 * Saving only ever upserted, so anything the user removed lived on in the
 * database and returned on the next load. Callers pass the complete list they
 * are showing, and this makes the table match it.
 */
async function pruneMissing(table: string, keep: string[]): Promise<string | null> {
  const { error } = await queryWithFallback((client) => {
    const query = client.from(table).delete();
    // `not in ()` is invalid SQL, so an empty list means delete everything.
    return keep.length > 0
      ? query.not('id', 'in', `(${keep.map((id) => `"${id}"`).join(',')})`)
      : query.neq('id', '');
  });

  if (error) {
    console.error(`Failed to prune removed rows from ${table}`, error);
    return `${table}: ${error.message}`;
  }
  return null;
}

/** Deletes rows of `table` whose kpi_id no longer exists. */
async function pruneOrphansByKpi(table: string, keepKpiIds: string[]): Promise<string | null> {
  if (keepKpiIds.length === 0) return null;

  const { error } = await queryWithFallback((client) =>
    client
      .from(table)
      .delete()
      .not('kpi_id', 'in', `(${keepKpiIds.map((id) => `"${id}"`).join(',')})`)
  );

  if (error) {
    console.error(`Failed to prune orphans from ${table}`, error);
    return `${table}: ${error.message}`;
  }
  return null;
}

/**
 * Writes the chart list and removes any row no longer in it, so what the user
 * sees on the dashboard is exactly what the table holds.
 */
async function replaceCharts(charts: Row[]): Promise<string | null> {
  const rows = charts.map((chart, index) => {
    const row = chartToRow(chart, index) as Record<string, unknown>;
    if (positionColumnMissing) delete row.position;
    return row;
  });

  if (rows.length > 0) {
    let failure = await upsert('dashboard_charts', rows);

    // Older table without the ordering column: drop it and retry once.
    if (failure && /position/i.test(failure) && !positionColumnMissing) {
      positionColumnMissing = true;
      console.warn('dashboard_charts.position is missing; chart order will not persist.');
      failure = await upsert(
        'dashboard_charts',
        rows.map(({ position: _drop, ...rest }) => rest)
      );
    }
    if (failure) return failure;
  }

  return pruneMissing('dashboard_charts', charts.map((chart) => String(chart.id)));
}

/**
 * Returns a list of per-table error messages; empty means everything saved.
 *
 * `authoritative` names the collections whose submitted list is the complete
 * truth, so rows missing from it are deleted. Only explicit user saves set it —
 * a background save firing before data had loaded would otherwise empty tables.
 */
export async function saveAll(
  snapshot: Partial<KPISnapshot>,
  authoritative: string[] = []
): Promise<string[]> {
  if (!isOnline) return ['Supabase chưa được cấu hình.'];

  const errors: string[] = [];
  const push = (message: string | null) => {
    if (message) errors.push(message);
  };

  if (snapshot.users) push(await upsert('users', snapshot.users.map(userToRow)));

  // user_actuals.kpi_id and user_targets.kpi_id are foreign keys onto
  // kpi_definitions, so the order below is not cosmetic:
  //   1. write the surviving KPIs   (parents must exist before children)
  //   2. write measurements, skipping any whose KPI is gone
  //   3. delete orphaned measurements  (children before parents)
  //   4. delete the removed KPIs
  // Doing step 4 before step 2 made Postgres reject the entire save, so nothing
  // at all was stored.

  const keptKpis = snapshot.kpiDefs?.filter((k) => String(k.name ?? '').trim() !== '');
  const liveKpiIds = keptKpis ? new Set(keptKpis.map((k) => String(k.id))) : null;
  const referencesLiveKpi = (row: Row) => !liveKpiIds || liveKpiIds.has(String(row.kpiId));

  if (keptKpis) {
    const rows = keptKpis.map(kpiToRow);

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

  if (snapshot.userActuals) {
    push(await upsert('user_actuals', snapshot.userActuals.filter(referencesLiveKpi).map(actualToRow)));
  }
  if (snapshot.userTargets) {
    push(await upsert('user_targets', snapshot.userTargets.filter(referencesLiveKpi).map(targetToRow)));
  }
  if (snapshot.reports) {
    push(await upsert('kpi_reports', snapshot.reports.filter(referencesLiveKpi).map(reportToRow)));
  }

  // Steps 3 and 4: clear measurements belonging to removed KPIs, then remove
  // the KPIs themselves. Reversing these two violates the foreign keys.
  if (keptKpis && authoritative.includes('kpiDefs')) {
    const keep = keptKpis.map((k) => String(k.id));

    // Refuse to empty the table. An empty list here is far more likely to be a
    // client that has not finished loading than a deliberate wipe.
    if (keep.length === 0) {
      console.warn('Refusing to delete every KPI: the submitted list was empty.');
    } else {
      push(await pruneOrphansByKpi('user_targets', keep));
      push(await pruneOrphansByKpi('user_actuals', keep));
      push(await pruneOrphansByKpi('kpi_reports', keep));
      push(await pruneMissing('kpi_definitions', keep));
    }
  }

  if (snapshot.groups) {
    push(await upsert('kpi_groups', snapshot.groups.map((g) => ({ id: g.id, name: g.name }))));
    if (authoritative.includes('groups')) {
      push(await pruneMissing('kpi_groups', snapshot.groups.map((g) => String(g.id))));
    }
  }

  if (snapshot.groupItems) {
    push(
      await upsert(
        'kpi_group_items',
        snapshot.groupItems.map((g) => ({ id: g.id, group_id: g.groupId, name: g.name }))
      )
    );
    if (authoritative.includes('groups')) {
      push(await pruneMissing('kpi_group_items', snapshot.groupItems.map((g) => String(g.id))));
    }
  }

  // Charts use replace semantics, not upsert: the list the user sees is the
  // whole truth. Upserting alone left deleted charts in the table, and they
  // came back on the next load.
  if (snapshot.dashboardCharts) {
    push(await replaceCharts(snapshot.dashboardCharts));
  }

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
