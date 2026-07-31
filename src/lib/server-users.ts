import { isOnline } from './supabase';
import { supabaseAdmin } from './supabase-admin';
import { DATA_FILE, readLocalData, writeJsonFile } from './local-store';

/**
 * Server-side user lookup for authentication.
 *
 * Credentials never travel to the browser: only this module and the auth route
 * handlers read `passwordHash`.
 */

export interface ServerUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Admin' | 'Manager' | 'User';
  department: string;
  position: string;
  passwordHash?: string;
}

/** Shape of a row as it arrives from Supabase or the local JSON file. */
type UserRow = Record<string, string | number | boolean | null | undefined>;

/** Set once we learn the Supabase `users` table has no `password_hash` column. */
let passwordColumnMissing = false;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Coerces a loosely-typed column value to a string. */
function str(value: UserRow[string], fallback = ''): string {
  return value === null || value === undefined ? fallback : String(value);
}

function toRole(value: UserRow[string]): ServerUser['role'] {
  const role = str(value, 'User');
  return role === 'Admin' || role === 'Manager' ? role : 'User';
}

function fromSupabaseRow(row: UserRow): ServerUser {
  return {
    id: Number(row.id),
    firstName: str(row.first_name),
    lastName: str(row.last_name),
    email: str(row.email),
    role: toRole(row.role),
    department: str(row.department),
    position: str(row.position),
    passwordHash: row.password_hash ? str(row.password_hash) : undefined,
  };
}

function fromLocalRecord(record: UserRow): ServerUser {
  // `password` is the legacy plaintext field; `passwordHash` is the new one.
  const credential = record.passwordHash ?? record.password;

  return {
    id: Number(record.id),
    firstName: str(record.firstName),
    lastName: str(record.lastName),
    email: str(record.email),
    role: toRole(record.role),
    department: str(record.department),
    position: str(record.position),
    passwordHash: credential ? str(credential) : undefined,
  };
}

async function readLocalUsers(): Promise<ServerUser[]> {
  const data = await readLocalData();
  const users = (data?.users as UserRow[]) || [];
  return users.map(fromLocalRecord);
}

export async function findUserByEmail(email: string): Promise<ServerUser | null> {
  const target = normalizeEmail(email);

  if (isOnline) {
    const columns = passwordColumnMissing
      ? 'id, first_name, last_name, email, role, department, position'
      : 'id, first_name, last_name, email, role, department, position, password_hash';

    const { data, error } = await supabaseAdmin.from('users').select(columns);

    if (error) {
      // Undefined column -> the SQL migration has not been applied yet.
      if (/password_hash/i.test(error.message)) {
        passwordColumnMissing = true;
        return findUserByEmail(email);
      }
      console.error('Supabase user lookup failed', error);
    } else if (data) {
      const rows = data as unknown as UserRow[];
      const match = rows.find((row) => normalizeEmail(String(row.email ?? '')) === target);
      if (match) {
        const user = fromSupabaseRow(match);
        // Fall back to the local file for credentials while the column is absent.
        if (!user.passwordHash) {
          const local = (await readLocalUsers()).find((u) => normalizeEmail(u.email) === target);
          if (local?.passwordHash) user.passwordHash = local.passwordHash;
        }
        return user;
      }
    }
  }

  return (await readLocalUsers()).find((u) => normalizeEmail(u.email) === target) ?? null;
}

export async function listUsers(): Promise<ServerUser[]> {
  if (isOnline) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email, role, department, position');
    if (!error && data) return (data as UserRow[]).map(fromSupabaseRow);
    if (error) console.error('Supabase user listing failed', error);
  }
  return readLocalUsers();
}

/** Persists a new password hash to every store that is available. */
export async function saveUserPassword(userId: number, passwordHash: string): Promise<void> {
  let persisted = false;

  if (isOnline && !passwordColumnMissing) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', userId);

    if (error) {
      if (/password_hash/i.test(error.message)) {
        passwordColumnMissing = true;
        console.error(
          'The users.password_hash column is missing. Run supabase/schema.sql, ' +
            'otherwise passwords cannot be stored in the cloud.'
        );
      } else {
        console.error('Failed to persist password to Supabase', error);
      }
    } else {
      persisted = true;
    }
  }

  const data = await readLocalData();
  if (data && Array.isArray(data.users)) {
    data.users = (data.users as UserRow[]).map((user) =>
      Number(user.id) === userId
        ? { ...user, passwordHash, password: undefined }
        : user
    );
    if (await writeJsonFile(DATA_FILE, data)) persisted = true;
  }

  if (!persisted) {
    throw new Error(
      'Không lưu được mật khẩu: Supabase chưa có cột password_hash và hệ thống tệp không ghi được.'
    );
  }
}
