import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession, type SessionPayload } from './session';

/** Reads and validates the session cookie inside a Route Handler. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/**
 * Guards a Route Handler. Returns either the session or a ready-to-return
 * error response, so handlers stay a single `if` statement.
 */
export async function requireSession(
  role?: 'Admin' | 'Manager'
): Promise<{ session: SessionPayload; error: null } | { session: null; error: NextResponse }> {
  const session = await getSession();

  if (!session) {
    return { session: null, error: NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 }) };
  }

  if (role === 'Admin' && session.role !== 'Admin') {
    return {
      session: null,
      error: NextResponse.json({ error: 'Chỉ Admin mới thực hiện được thao tác này.' }, { status: 403 }),
    };
  }

  if (role === 'Manager' && session.role !== 'Admin' && session.role !== 'Manager') {
    return {
      session: null,
      error: NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này.' }, { status: 403 }),
    };
  }

  return { session, error: null };
}
