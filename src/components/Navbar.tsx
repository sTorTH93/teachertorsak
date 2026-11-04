'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Cloud, CheckCircle, Database, HelpCircle, Shield, Sparkles } from 'lucide-react';
import { isSupabaseConfigured, SUPABASE_SETUP_SQL } from '@/lib/supabase';

interface NavbarProps {
  currentClassroomName?: string;
  role?: string;
  onRoleChange?: (newRole: string) => void;
}

export default function Navbar({ currentClassroomName, role }: NavbarProps) {
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                  ClassCheck <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">ระบบเช็คงาน</span>
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
            <button
              onClick={() => setShowCloudModal(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
              title="ตั้งค่าเชื่อมต่อฐานข้อมูลออนไลน์"
            >
              <Cloud className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-500' : 'text-amber-500'}`} />
              <span className="hidden sm:inline">
                {isSupabaseConfigured ? 'ออนไลน์ (Supabase เชื่อมต่อแล้ว)' : 'โหมดบันทึกในเครื่อง (ออฟไลน์/ออนไลน์)'}
              </span>
              <span className="sm:hidden">ออนไลน์</span>
            </button>

            {role && (
              <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-full text-xs font-medium text-amber-800 dark:text-amber-300">
                <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{role === 'TEACHER' ? 'สิทธิ์: คุณครู' : 'สิทธิ์: ตัวแทนห้อง'}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Cloud Setup Modal */}
      {showCloudModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-4">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">การจัดเก็บข้อมูล & ออนไลน์</h3>
                <p className="text-xs text-zinc-500">ระบบสามารถใช้งานได้ 2 รูปแบบ</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> 1. บันทึกในเบราว์เซอร์อัตโนมัติ (พร้อมใช้ทันที)
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300/80 mt-1">
                  ระบบบันทึกข้อมูลนักเรียนและการเช็คงานลงในอุปกรณ์นี้ทันที แม้ไม่มีเน็ตก็เช็คงานได้ ข้อมูลไม่หายเมื่อรีเฟรช
                </p>
              </div>

              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/40">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" /> 2. ออนไลน์ข้ามเครื่อง (Supabase + Vercel)
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300/80 mt-1">
                  หากต้องการให้ครูและตัวแทนห้องเปิดเช็คจากมือถือคนละเครื่องพร้อมกัน เพียงใส่ <code>NEXT_PUBLIC_SUPABASE_URL</code> ในไฟล์ <code>.env.local</code> หรือ Vercel Settings
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">SQL สำหรับสร้างตารางบน Supabase:</span>
                  <button
                    onClick={copySql}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {copied ? 'คัดลอกเรียบร้อย!' : 'คัดลอกโค้ด SQL'}
                  </button>
                </div>
                <pre className="text-[11px] p-3 rounded-lg bg-zinc-950 text-zinc-300 overflow-x-auto max-h-36 font-mono">
                  {SUPABASE_SETUP_SQL}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowCloudModal(false)}
                className="px-4 py-2 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl hover:opacity-90 font-medium"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
