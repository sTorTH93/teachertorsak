'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Cloud,
  CheckCircle,
  Database,
  Shield,
  Sparkles,
  Link2,
  Trash2,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveCustomSupabase,
  clearCustomSupabase,
  SUPABASE_SETUP_SQL,
} from '@/lib/supabase';
import { syncFromCloud } from '@/lib/storage';

interface NavbarProps {
  currentClassroomName?: string;
  role?: string;
  onRoleChange?: (newRole: string) => void;
}

export default function Navbar({ currentClassroomName, role }: NavbarProps) {
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<{ url: string; key: string; isConfigured: boolean }>({
    url: '',
    key: '',
    isConfigured: false,
  });

  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const cur = getSupabaseConfig();
    setConfig(cur);
    setInputUrl(cur.url);
    setInputKey(cur.key);
  }, [showCloudModal]);

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      alert('กรุณากรอกทั้ง Project URL และ Anon Key');
      return;
    }

    saveCustomSupabase(inputUrl, inputKey);
    setConfig({ url: inputUrl, key: inputKey, isConfigured: true });

    setIsSyncing(true);
    setSyncMessage('กำลังทดสอบการเชื่อมต่อ...');
    const result = await syncFromCloud();
    setIsSyncing(false);

    if (result !== null) {
      setSyncMessage('✅ เชื่อมต่อฐานข้อมูลสำเร็จ! ข้อมูลทุกอุปกรณ์จะซิงค์กันแล้ว');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      setSyncMessage(
        '⚠️ เชื่อมต่อได้ แต่ยังไม่พบตาราง classrooms กรุณาอย่าลืมรันโค้ด SQL ด้านล่างใน Supabase ด้วยนะครับ'
      );
    }
  };

  const handleDisconnect = () => {
    if (!confirm('ต้องการยกเลิกการเชื่อมต่อฐานข้อมูลออนไลน์ในเครื่องนี้ใช่หรือไม่?')) return;
    clearCustomSupabase();
    setConfig({ url: '', key: '', isConfigured: false });
    setInputUrl('');
    setInputKey('');
    setSyncMessage(null);
    window.location.reload();
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncFromCloud();
    setIsSyncing(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  ClassCheck{' '}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">
                    ระบบเช็คงาน
                  </span>
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">เช็คงานในชั่วโมงเรียน & ให้คะแนนทันที</p>
              </div>
            </Link>

            {currentClassroomName && (
              <div className="hidden md:flex items-center gap-2 pl-4 border-l border-zinc-200 dark:border-zinc-800 text-sm">
                <span className="text-zinc-400">ห้อง:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                  {currentClassroomName}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {config.isConfigured && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="p-1.5 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="กดเพื่อซิงค์ข้อมูลล่าสุด"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            )}

            <button
              onClick={() => setShowCloudModal(true)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                config.isConfigured
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100'
              }`}
              title="ตั้งค่าเชื่อมต่อฐานข้อมูลออนไลน์หลายเครื่อง"
            >
              <Cloud className={`w-3.5 h-3.5 ${config.isConfigured ? 'text-emerald-600' : 'text-amber-600 animate-pulse'}`} />
              <span className="hidden sm:inline font-semibold">
                {config.isConfigured
                  ? '🟢 ซิงค์ข้อมูลข้ามเครื่องแล้ว'
                  : '⚠️ ข้อมูลยังอยู่แค่ในเครื่องนี้ (คลิกเพื่อลิงก์ข้ามเครื่อง)'}
              </span>
              <span className="sm:hidden font-semibold">
                {config.isConfigured ? 'ซิงค์แล้ว' : 'ตั้งค่าซิงค์'}
              </span>
            </button>

            {role && (
              <div className="flex items-center gap-1 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>{role === 'TEACHER' ? 'ครู' : 'ตัวแทนห้อง'}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Cloud Sync Setup Modal */}
      {showCloudModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                    เชื่อมต่อฐานข้อมูลออนไลน์ (Supabase)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    ทำให้ครูและตัวแทนห้องเปิดจากมือถือคนละเครื่อง แล้วเห็นข้อมูลตรงกันแบบเรียลไทม์
                  </p>
                </div>
              </div>
            </div>

            {/* Explanation box */}
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 leading-relaxed mb-4">
              <strong>ทำไมเปิดในมือถือคนละเครื่องแล้วไม่เห็นข้อมูลกัน?</strong>
              <p className="mt-1">
                เพราะปัจจุบันข้อมูลถูกบันทึกอยู่ในเบราว์เซอร์ของแต่ละเครื่องเท่านั้น (LocalStorage) เพื่อให้ทุกเครื่องลิงก์ข้อมูลกันได้ เพียงเชื่อมต่อกับฐานข้อมูลฟรีของ <strong>Supabase</strong> (ฟรีตลอดชีพ 500MB) ตาม 3 ขั้นตอนนี้ครับ
              </p>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-4 text-xs">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                <h4 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                  สร้างโปรเจกต์ฟรีบน Supabase
                </h4>
                <p className="text-zinc-600 dark:text-zinc-400">
                  ไปที่เว็บไซต์{' '}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    Supabase.com <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  (ล็อกอินด้วย GitHub ได้เลย) แล้วกด <strong>"New Project"</strong>
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                    สร้างตารางห้องเรียน (รันคำสั่ง SQL)
                  </h4>
                  <button
                    onClick={copySql}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : null}
                    {copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด SQL'}
                  </button>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                  ในโปรเจกต์ Supabase ไปที่เมนู <strong>SQL Editor</strong> ➔ วางโค้ดนี้ ➔ กด <strong>Run</strong>:
                </p>
                <pre className="text-[11px] p-2.5 rounded-lg bg-zinc-950 text-zinc-300 overflow-x-auto max-h-28 font-mono leading-tight">
                  {SUPABASE_SETUP_SQL}
                </pre>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                <h4 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                  นำ Project URL & Anon Key มาวางที่นี่
                </h4>
                <p className="text-zinc-500 mb-3">
                  (หาได้จากเมนู <strong>Project Settings</strong> ➔ <strong>API</strong> ใน Supabase)
                </p>

                <form onSubmit={handleSaveConfig} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Project URL (เช่น https://abcdefghijklm.supabase.co)
                    </label>
                    <input
                      type="url"
                      placeholder="https://xxxxxxxx.supabase.co"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Anon Public Key (eyJhbGciOi...)
                    </label>
                    <input
                      type="text"
                      placeholder="eyJhbGciOi..."
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  {syncMessage && (
                    <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-medium">
                      {syncMessage}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    {config.isConfigured ? (
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> ตัดการเชื่อมต่อ
                      </button>
                    ) : (
                      <span />
                    )}

                    <button
                      type="submit"
                      disabled={isSyncing}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      {isSyncing ? 'กำลังบันทึก...' : 'บันทึก & ซิงค์ข้อมูลเดี๋ยวนี้'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCloudModal(false)}
                className="px-4 py-2 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
