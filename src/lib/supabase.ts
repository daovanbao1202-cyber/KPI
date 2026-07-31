import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isOnline = !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL';

if (!isOnline) {
  console.warn('Supabase is not configured or configured with dummy values. Running in OFFLINE mode.');
}

// Khởi tạo an toàn: nếu offline, sử dụng URL và key dummy để tránh crash lúc load module
const finalUrl = isOnline ? supabaseUrl : 'https://placeholder-co-db-does-not-exist.supabase.co';
const finalKey = isOnline ? supabaseAnonKey : 'dummy-anon-key';

export const supabase = createClient(finalUrl, finalKey);
