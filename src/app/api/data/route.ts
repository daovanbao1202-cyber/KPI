import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-server';
import {
  DELETABLE_TABLES,
  deleteRow,
  loadAll,
  saveAll,
  type DeletableTable,
} from '@/lib/kpi-store';

export const runtime = 'nodejs';

/**
 * All KPI data access, behind a session check.
 *
 * The browser previously talked to Supabase directly with the anon key, which
 * ships in the JS bundle — anyone could read and write every table without
 * signing in.
 */

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const snapshot = await loadAll();
  if (!snapshot) {
    return NextResponse.json({ error: 'Supabase chưa được cấu hình.' }, { status: 503 });
  }
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  try {
    const snapshot = await request.json();
    const failures = await saveAll(snapshot);

    if (failures.length > 0) {
      return NextResponse.json({ success: false, errors: failures }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (saveError) {
    return NextResponse.json({ error: (saveError as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { table, id } = await request.json();

    if (!DELETABLE_TABLES.includes(table)) {
      return NextResponse.json({ error: 'Bảng không hợp lệ.' }, { status: 400 });
    }
    if (id === undefined || id === null || id === '') {
      return NextResponse.json({ error: 'Thiếu id.' }, { status: 400 });
    }

    // Removing people or KPI definitions is an Admin action; reports are not.
    const needsAdmin = table === 'users' || table === 'kpi_definitions';
    const { error } = await requireSession(needsAdmin ? 'Admin' : undefined);
    if (error) return error;

    const failure = await deleteRow(table as DeletableTable, id);
    if (failure) {
      return NextResponse.json({ error: failure }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (deleteError) {
    return NextResponse.json({ error: (deleteError as Error).message }, { status: 500 });
  }
}
