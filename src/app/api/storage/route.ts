import { NextResponse } from 'next/server';
import { DATA_FILE, isLocalStoreWritable, readLocalData, writeJsonFile } from '@/lib/local-store';
import { requireSession } from '@/lib/auth-server';

export const runtime = 'nodejs';

/**
 * Local JSON snapshot used for development and offline work.
 *
 * Supabase is the source of truth in production; on a serverless host the
 * filesystem is read-only, so writes report 503 rather than failing silently
 * as they previously did.
 */

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const data = await readLocalData();
  if (!data) {
    return NextResponse.json({ error: 'No local data found' }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  if (!isLocalStoreWritable()) {
    return NextResponse.json(
      {
        error: 'Bộ nhớ tệp cục bộ không khả dụng trên môi trường này. Dữ liệu được lưu qua Supabase.',
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const written = await writeJsonFile(DATA_FILE, body);
    if (!written) {
      return NextResponse.json({ error: 'Không ghi được tệp dữ liệu.' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (writeError) {
    return NextResponse.json({ error: (writeError as Error).message }, { status: 500 });
  }
}
