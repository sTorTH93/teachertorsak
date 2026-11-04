import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// SQL schema generator script that user can run in Supabase SQL Editor
export const SUPABASE_SETUP_SQL = `-- รันคำสั่งนี้ใน Supabase SQL Editor เพื่อสร้างตารางสำหรับระบบเช็คงาน

-- 1. ตารางห้องเรียน
CREATE TABLE IF NOT EXISTS classrooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  teacher_pin TEXT NOT NULL DEFAULT '1234',
  rep_pin TEXT NOT NULL DEFAULT '5678',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. เปิดใช้งาน Realtime (ถ้าต้องการซิงค์สดระหว่างครูกับตัวแทน)
ALTER PUBLICATION supabase_realtime ADD TABLE classrooms;

-- 3. กำหนดสิทธิ์ RLS ให้เข้าถึงได้
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write" ON classrooms FOR ALL USING (true) WITH CHECK (true);
`;
