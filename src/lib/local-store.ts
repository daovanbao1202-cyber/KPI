import fs from 'fs/promises';
import path from 'path';

/**
 * Local JSON file store, used only as a development convenience and offline
 * fallback. Supabase is the source of truth whenever it is configured.
 *
 * Serverless filesystems (Vercel) are read-only, so writes are disabled there
 * instead of failing silently the way they used to.
 */

/** Overridable so the paths are no longer hardcoded to one developer's D: drive. */
export const DATA_FILE = process.env.KPI_DATA_FILE || path.join(process.cwd(), 'data.json');
export const NOTIFICATIONS_FILE =
  process.env.KPI_NOTIFICATIONS_FILE || path.join(process.cwd(), 'notifications.json');

/** Optional secondary copy, e.g. a synced drive. Unset by default. */
const BACKUP_FILE = process.env.KPI_BACKUP_FILE;

/** False on Vercel and in production, where the filesystem is not writable. */
export function isLocalStoreWritable(): boolean {
  return !process.env.VERCEL && process.env.NODE_ENV !== 'production';
}

export async function readJsonFile<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

/**
 * Writes JSON to the local store. Returns false (without throwing) when the
 * filesystem is read-only, so callers can report the truth to the user.
 */
export async function writeJsonFile(file: string, value: unknown): Promise<boolean> {
  if (!isLocalStoreWritable()) return false;

  const serialized = JSON.stringify(value, null, 2);
  try {
    await fs.writeFile(file, serialized, 'utf-8');
  } catch (error) {
    console.error(`Failed to write local store at ${file}`, error);
    return false;
  }

  if (BACKUP_FILE && file === DATA_FILE) {
    try {
      await fs.mkdir(path.dirname(BACKUP_FILE), { recursive: true });
      await fs.writeFile(BACKUP_FILE, serialized, 'utf-8');
    } catch {
      console.warn(`Backup copy at ${BACKUP_FILE} could not be written.`);
    }
  }

  return true;
}

export async function readLocalData(): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
  } catch {
    return null;
  }
}
