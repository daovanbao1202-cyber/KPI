import { createClient } from '@supabase/supabase-js';
import { supabase, isOnline } from './supabase';

/**
 * Server-side Supabase client.
 *
 * Uses the service-role key when available, so `SELECT (password_hash)` can be
 * revoked from the `anon` role (see supabase/schema.sql) without breaking
 * sign-in. The service role bypasses RLS and must never reach the browser —
 * this module is imported only from Route Handlers.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const hasServiceRole = !!url && !!serviceRoleKey;

if (isOnline && !hasServiceRole) {
  console.warn(
    'SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to the anon key for ' +
      'server-side reads, which means users.password_hash must stay readable ' +
      'by the anon role. Set the service-role key to lock it down.'
  );
}

export const supabaseAdmin = hasServiceRole
  ? createClient(url, serviceRoleKey, { auth: { persistSession: false } })
  : supabase;
