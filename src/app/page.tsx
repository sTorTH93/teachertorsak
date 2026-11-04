'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Plus,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  Trash2,
  Search,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  FileSpreadsheet,
  Lock,
  LockOpen,
  Eye,
  X,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import CreateClassroomModal from '@/components/CreateClassroomModal';
import { Classroom } from '@/types';
import {
  getClassrooms,
  saveClassrooms,
  deleteClassroom,
  syncFromCloud,
  subscribeToClassrooms,
  setupRealtimeSync,
} from '@/lib/storage';

// ---- Admin PIN (master password for homepage management) ----
// Change this PIN to whatever you like
const ADMIN_PIN = '399100';

// ---- Admin PIN Modal ----
function AdminPinModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      onSuccess();
      onClose();
    } else {
      setError('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่');
      setPin('');
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5 border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">โหมดครู</h2>
              <p className="text-xs text-zinc-500">กรอก PIN เพื่อเข้าสู่โหมดจัดการ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              รหัส PIN ครู
            </label>
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              placeholder="••••"
              className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 text-center">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pin.length === 0}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-bold transition-all"
          >
            เข้าสู่โหมดครู
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400">
          นักเรียนสามารถดูรายชื่อห้องและเข้าเช็คงานได้โดยไม่ต้องกรอก PIN
        </p>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function HomePage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setClassrooms(getClassrooms());

    // 1. Fetch latest from cloud
    syncFromCloud().then((cloudData) => {
      if (cloudData) {
        setClassrooms(cloudData);
      }
    });

    // 2. Subscribe to internal state updates
    const unsubscribeLocal = subscribeToClassrooms((updated) => {
      setClassrooms(updated);
    });

    // 3. Subscribe to Supabase Realtime changes
    const unsubscribeCloud = setupRealtimeSync();

    return () => {
      unsubscribeLocal();
      unsubscribeCloud();
    };
  }, []);

  const handleCreated = (newClass: Classroom) => {
    const updated = [newClass, ...classrooms];
    setClassrooms(updated);
    saveClassrooms(updated);
  };

  const handleDelete = (id: string, name: string, pin: string) => {
    const inputPin = prompt(`กรุณากรอก PIN คุณครูเพื่อยืนยันการลบห้อง "${name}":`);
    if (inputPin === null) return;
    if (inputPin !== pin) {
      alert('รหัส PIN คุณครูไม่ถูกต้อง ไม่สามารถลบได้');
      return;
    }
    deleteClassroom(id);
    setClassrooms(classrooms.filter((c) => c.id !== id));
  };

  const filtered = classrooms.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase()) ||
      c.teacherName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white p-6 sm:p-10 shadow-xl overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
            <BookOpen className="w-96 h-96 -mr-20" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> ใช้งานง่ายในชั่วโมงเรียน • เปิดใช้ได้ทันที
              </div>
              {/* Mode Badge */}
              {isAdminMode ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/25 text-amber-200 text-xs font-semibold border border-amber-300/30">
                  <LockOpen className="w-3 h-3" /> โหมดครู (จัดการ)
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-100 text-xs font-semibold border border-white/20">
                  <Eye className="w-3 h-3" /> โหมดนักเรียน (อ่านอย่างเดียว)
                </div>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              ระบบเช็คงานนักเรียนในชั่วโมงเรียน
            </h1>
            <p className="text-sm sm:text-base text-blue-100 font-normal leading-relaxed">
              ช่วยให้คุณครูหรือตัวแทนห้อง เช็คสถานะการส่งงาน (ส่งแล้ว, ส่งช้า, ไม่ส่ง)
              พร้อมให้คะแนนและคำนวณเกรดอัตโนมัติ รวดเร็ว ภายในไม่กี่คลิก
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              {/* Admin Mode: show create + logout */}
              {isAdminMode ? (
                <>
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 text-sm font-bold shadow-lg shadow-black/10 transition-all hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" /> สร้างห้องเรียนใหม่
                  </button>
                  <button
                    onClick={() => setIsAdminMode(false)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold transition-all border border-white/25"
                  >
                    <Lock className="w-4 h-4" /> ออกจากโหมดครู
                  </button>
                </>
              ) : (
                /* Student Mode: show unlock button */
                <button
                  onClick={() => setIsPinModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold transition-all border border-white/25"
                >
                  <Lock className="w-4 h-4" /> สำหรับครู (กรอก PIN)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">เช็คสถานะ 3 แบบ</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                ส่งแล้ว (ตรงเวลา), ส่งช้ากว่ากำหนด, และไม่ส่ง พร้อมบันทึกคะแนนรายบุคคล
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">ครูหรือตัวแทนห้องเช็คได้</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                ใช้รหัส PIN แยกสิทธิ์ สะดวกเมื่อให้หัวหน้าห้องช่วยเช็คงานแทนในคาบ
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">สมุดคะแนน & Export Excel</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                คำนวณคะแนนรวมและร้อยละอัตโนมัติ ส่งออกเป็นไฟล์ CSV รองรับภาษาไทยสมบูรณ์
              </p>
            </div>
          </div>
        </div>

        {/* Classroom List Header & Search */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" /> ห้องเรียนทั้งหมด ({classrooms.length} ห้อง)
              </h2>
              <p className="text-xs text-zinc-500">เลือกห้องเรียนเพื่อเริ่มเช็คงานหรือดูคะแนน</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="ค้นหาห้อง, วิชา, ครู..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>

              {/* Only show "สร้างห้องใหม่" button in admin mode */}
              {isAdminMode && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> สร้างห้องใหม่
                </button>
              )}

              {/* Admin lock/unlock toggle button (small, discreet) */}
              {!isAdminMode && (
                <button
                  onClick={() => setIsPinModalOpen(true)}
                  title="โหมดครู"
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-400 hover:text-blue-600 hover:border-blue-400 transition-colors shadow-sm"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}

              {isAdminMode && (
                <button
                  onClick={() => setIsAdminMode(false)}
                  title="ออกจากโหมดครู"
                  className="p-2 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 text-amber-600 hover:bg-amber-100 transition-colors shadow-sm"
                >
                  <LockOpen className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          {!mounted ? (
            <div className="py-12 text-center text-xs text-zinc-400">กำลังโหลด...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 space-y-3">
              <BookOpen className="w-12 h-12 text-zinc-300 mx-auto" />
              <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">ยังไม่พบห้องเรียน</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {isAdminMode
                  ? 'คลิกปุ่ม "สร้างห้องเรียนใหม่" ด้านบนเพื่อเพิ่มวิชาและรายชื่อนักเรียน'
                  : 'ยังไม่มีห้องเรียนในระบบ หรือกำลังโหลดข้อมูล...'}
              </p>
              {isAdminMode && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl"
                >
                  <Plus className="w-4 h-4" /> สร้างห้องเรียนแรก
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((cls) => (
                <div
                  key={cls.id}
                  className="group bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
                          ห้อง {cls.name}
                        </span>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-2 line-clamp-1">
                          {cls.subject}
                        </h3>
                      </div>

                      {/* Delete button: only visible in admin mode */}
                      {isAdminMode && (
                        <button
                          onClick={() => handleDelete(cls.id, cls.name, cls.teacherPin)}
                          className="p-1.5 text-zinc-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="ลบห้องเรียน"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500">
                      ครูผู้สอน: <strong className="text-zinc-700 dark:text-zinc-300 font-medium">{cls.teacherName}</strong>
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span>นักเรียน {cls.students.length} คน</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <span>งานที่สั่ง {cls.assignments.length} งาน</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/classroom/${cls.id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-blue-600 text-white dark:bg-zinc-800 dark:hover:bg-blue-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all group-hover:shadow-md"
                  >
                    <span>เข้าห้องเพื่อเช็คงาน</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="py-6 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
        ClassCheck — ระบบเช็คงานในชั่วโมงเรียน • รองรับออนไลน์ข้ามอุปกรณ์ • จัดเก็บข้อมูลอัตโนมัติ
      </footer>

      {/* Create Classroom Modal */}
      <CreateClassroomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreated}
      />

      {/* Admin PIN Modal */}
      <AdminPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => setIsAdminMode(true)}
      />
    </div>
  );
}
