import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default project credentials for teachertorsak
export const DEFAULT_SUPABASE_URL = 'https://ubhlpsjyvowskrhenqvx.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_-soozKqDdiVoy0y27vl8Xw_Scqsr9Gc';

const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const SUPABASE_URL_KEY = 'classcheck_supabase_url';
export const SUPABASE_ANON_KEY = 'classcheck_supabase_key';

let cachedClient: SupabaseClient | null = null;
let cachedKey = '';

export function getSupabaseConfig(): { url: string; key: string; isConfigured: boolean } {
  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem(SUPABASE_URL_KEY);
    const localKey = localStorage.getItem(SUPABASE_ANON_KEY);
    if (localUrl && localKey) {
      return { url: localUrl, key: localKey, isConfigured: true };
    }
  }

  if (ENV_URL && ENV_KEY) {
    return { url: ENV_URL, key: ENV_KEY, isConfigured: true };
  }

  return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_ANON_KEY, isConfigured: true };
}

export function getSupabase(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  const currentKey = `${url}_${key}`;
  if (cachedClient && cachedKey === currentKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key);
    cachedKey = currentKey;
    return cachedClient;
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    return null;
  }
}

export function saveCustomSupabase(url: string, key: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  localStorage.setItem(SUPABASE_ANON_KEY, key.trim());
  cachedClient = null;
}

export function clearCustomSupabase() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SUPABASE_URL_KEY);
  localStorage.removeItem(SUPABASE_ANON_KEY);
  cachedClient = null;
}

export const SUPABASE_SETUP_SQL = `-- คัดลอกโค้ดนี้ไปรันใน Supabase -> SQL Editor เพื่อสร้างตารางห้องเรียนสำหรับแอป

CREATE TABLE IF NOT EXISTS classrooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  teacher_pin TEXT NOT NULL DEFAULT '1234',
  rep_pin TEXT NOT NULL DEFAULT '5678',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ปิดการจำกัดสิทธิ์ เพื่อให้ทุกคนในห้องเข้าถึงได้
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all" ON classrooms;
CREATE POLICY "Allow public all" ON classrooms FOR ALL USING (true) WITH CHECK (true);

-- เปิดใช้งาน Realtime ซิงค์ข้อมูลสดอัตโนมัติ
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'classrooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE classrooms;
  END IF;
END $$;
`;
