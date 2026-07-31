import { NextResponse } from 'next/server';
import { supabase, isOnline } from '@/lib/supabase';
import { NOTIFICATIONS_FILE, readJsonFile, writeJsonFile } from '@/lib/local-store';
import { requireSession } from '@/lib/auth-server';

export const runtime = 'nodejs';

interface StoredNotification {
  id?: string;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at?: string;
}

/** Notifications for the signed-in user only — the id no longer comes from the query string. */
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  try {
    if (isOnline) {
      const { data, error: dbError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.uid)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      return NextResponse.json(data ?? []);
    }

    const all = await readJsonFile<StoredNotification[]>(NOTIFICATIONS_FILE, []);
    return NextResponse.json(all.filter((item) => item.user_id === session.uid));
  } catch (dbError) {
    return NextResponse.json({ error: (dbError as Error).message }, { status: 500 });
  }
}

/** Marks one notification, or all of the caller's notifications, as read. */
export async function PATCH(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  try {
    const { id, all } = await request.json();

    if (!all && !id) {
      return NextResponse.json({ error: 'Thiếu tham số id hoặc all.' }, { status: 400 });
    }

    if (isOnline) {
      const query = supabase.from('notifications').update({ is_read: true }).eq('user_id', session.uid);
      const { error: dbError } = all ? await query : await query.eq('id', id);
      if (dbError) throw dbError;
      return NextResponse.json({ success: true });
    }

    const stored = await readJsonFile<StoredNotification[]>(NOTIFICATIONS_FILE, []);
    const updated = stored.map((item) => {
      // Scoped to the caller so one user cannot mutate another's notifications.
      if (item.user_id !== session.uid) return item;
      if (all || item.id === id) return { ...item, is_read: true };
      return item;
    });

    if (!(await writeJsonFile(NOTIFICATIONS_FILE, updated))) {
      return NextResponse.json(
        { error: 'Hệ thống tệp ở chế độ chỉ đọc. Hãy cấu hình Supabase để lưu thông báo.' },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (dbError) {
    return NextResponse.json({ error: (dbError as Error).message }, { status: 500 });
  }
}
