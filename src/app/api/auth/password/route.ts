import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { findUserByEmail, saveUserPassword } from '@/lib/server-users';
import { hashPassword, validatePasswordStrength, verifyPassword } from '@/lib/password';

export const runtime = 'nodejs';

/**
 * Handles all three password flows:
 *
 *  1. First-time setup  — account has no credential yet; email + newPassword.
 *  2. Self change       — signed in; currentPassword + newPassword.
 *  3. Admin reset       — signed in as Admin; targetUserId + newPassword.
 *
 * The old self-service "forgot password" flow is deliberately gone: it let
 * anyone reset any account by typing that person's email address.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  }

  const newPassword = String(body.newPassword ?? '');
  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) {
    return NextResponse.json({ error: strengthError }, { status: 400 });
  }

  const session = await getSession();

  // 3. Admin resetting somebody else's password.
  if (body.targetUserId !== undefined) {
    if (!session || session.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Chỉ Admin mới đặt lại được mật khẩu của người khác.' },
        { status: 403 }
      );
    }
    try {
      await saveUserPassword(Number(body.targetUserId), await hashPassword(newPassword));
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // 1. First-time setup for an account that has never had a password.
  if (!session) {
    const email = String(body.email ?? '');
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Email không tồn tại trong hệ thống.' }, { status: 404 });
    }
    if (user.passwordHash) {
      return NextResponse.json(
        { error: 'Tài khoản đã có mật khẩu. Vui lòng đăng nhập hoặc liên hệ Admin để đặt lại.' },
        { status: 409 }
      );
    }
    try {
      await saveUserPassword(user.id, await hashPassword(newPassword));
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // 2. Signed-in user changing their own password.
  const user = await findUserByEmail(session.email);
  if (!user) {
    return NextResponse.json({ error: 'Không tìm thấy tài khoản.' }, { status: 404 });
  }

  const currentPassword = String(body.currentPassword ?? '');
  if (user.passwordHash && !(await verifyPassword(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: 'Mật khẩu hiện tại không chính xác.' }, { status: 401 });
  }

  try {
    await saveUserPassword(user.id, await hashPassword(newPassword));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
