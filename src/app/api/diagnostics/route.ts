import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-server';
import { isOnline, supabase } from '@/lib/supabase';
import { hasServiceRole, queryWithFallback, supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

/**
 * Admin-only configuration check.
 *
 * Exists to answer one question safely: does SUPABASE_SERVICE_ROLE_KEY actually
 * work? Enabling RLS while it does not would lock the application out of its
 * own database, and every other code path hides the problem by falling back to
 * the anon key.
 *
 * Reports status only — never the key values themselves.
 */

async function probe(client: typeof supabase): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await client.from('users').select('id').limit(1);
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (thrown) {
    return { ok: false, error: (thrown as Error).message };
  }
}

const COUNTED_TABLES = [
  'users',
  'kpi_definitions',
  'user_actuals',
  'user_targets',
  'kpi_reports',
  'dashboard_charts',
  'kpi_groups',
  'kpi_group_items',
];

/** Row counts straight from the database, to compare against what the UI shows. */
async function rowCounts(): Promise<Record<string, number | string>> {
  const entries = await Promise.all(
    COUNTED_TABLES.map(async (table) => {
      const { count, error } = await queryWithFallback<null>((client) =>
        client.from(table).select('*', { count: 'exact', head: true }) as unknown as PromiseLike<{
          data: null;
          error: { message: string } | null;
          count: number | null;
        }>
      ).then((result) => result as { error: { message: string } | null; count?: number | null });

      return [table, error ? `LỖI: ${error.message}` : (count ?? 0)] as const;
    })
  );

  return Object.fromEntries(entries);
}

export async function GET() {
  const { error } = await requireSession('Admin');
  if (error) return error;

  if (!isOnline) {
    return NextResponse.json({
      supabaseConfigured: false,
      readyForRls: false,
      ketLuan: 'Supabase chưa được cấu hình cho môi trường này.',
    });
  }

  // Deliberately no fallback here: we want the service-role result on its own.
  const serviceRole = hasServiceRole ? await probe(supabaseAdmin) : { ok: false, error: 'not set' };
  const anon = await probe(supabase);

  const readyForRls = hasServiceRole && serviceRole.ok;

  return NextResponse.json({
    // Which build is actually serving. Testing against a stale deployment has
    // repeatedly looked like a bug that was already fixed.
    build: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? 'local',
    },
    soDongTrongDatabase: await rowCounts(),
    supabaseConfigured: true,
    serviceRoleKeyPresent: hasServiceRole,
    serviceRoleWorks: serviceRole.ok,
    serviceRoleError: serviceRole.error,
    anonWorks: anon.ok,
    readyForRls,
    ketLuan: readyForRls
      ? 'Khoá service_role hợp lệ. An toàn để bật RLS.'
      : hasServiceRole
        ? 'Khoá service_role bị từ chối. KHÔNG bật RLS cho tới khi sửa xong.'
        : 'Chưa đặt SUPABASE_SERVICE_ROLE_KEY. KHÔNG bật RLS.',
  });
}
