import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByEmail, saveUserPassword, type ServerUser } from '@/lib/server-users';
import { hashPassword, needsRehash, verifyPassword } from '@/lib/password';
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/lib/session';

/** Runs on Node so scrypt from node:crypto is available. */
export const runtime = 'nodejs';

/** Strips the credential before the user object crosses to the browser. */
function publicUser(user: ServerUser) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function POST(request: Request) {
  let email = '';
  let password = '';

  try {
    const body = await request.json();
    email = String(body.email ?? '');
    password = String(body.password ?? '');
  } catch {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  }

  if (!email.trim()) {
    return NextResponse.json({ error: 'Vui lòng nhập email.' }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng.' }, { status: 401 });
  }

  // Accounts migrated from the old system have no credential yet. Rather than
  // letting them in on email alone (the previous behaviour), require setup.
  if (!user.passwordHash) {
    return NextResponse.json(
      {
        needsPasswordSetup: true,
        email: user.email,
        message: 'Tài khoản chưa có mật khẩu. Vui lòng đặt mật khẩu để tiếp tục.',
      },
      { status: 200 }
    );
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng.' }, { status: 401 });
  }

  // Transparently upgrade legacy plaintext credentials on successful login.
  if (needsRehash(user.passwordHash)) {
    try {
      await saveUserPassword(user.id, await hashPassword(password));
    } catch (error) {
      console.error('Could not upgrade legacy password hash', error);
    }
  }

  const token = await signSession({ uid: user.id, email: user.email, role: user.role });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());

  return NextResponse.json({ user: publicUser(user) });
}

export async function DELETE() {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return NextResponse.json({ success: true });
}
