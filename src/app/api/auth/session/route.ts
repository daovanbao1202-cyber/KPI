import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { findUserByEmail } from '@/lib/server-users';

export const runtime = 'nodejs';

/**
 * Returns the signed-in user for the current cookie. The client uses this as
 * the authority on identity and role instead of trusting localStorage.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await findUserByEmail(session.email);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const { passwordHash: _passwordHash, ...rest } = user;
  return NextResponse.json({ user: rest });
}
