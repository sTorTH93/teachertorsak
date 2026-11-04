'use client';

import React, { useState } from 'react';
import { KeyRound, ShieldCheck, UserCheck, Eye, X } from 'lucide-react';
import { Classroom } from '@/types';

interface PinAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom;
  onSuccess: (role: 'TEACHER' | 'REP') => void;
}

export default function PinAuthModal({
  isOpen,
  onClose,
  classroom,
  onSuccess,
}: PinAuthModalProps) {
  const [targetRole, setTargetRole] = useState<'TEACHER' | 'REP'>('REP');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetRole === 'TEACHER') {
      if (pin === classroom.teacherPin) {
        onSuccess('TEACHER');
        onClose();
      } else {
        setError(true);
      }
    } else {
      if (pin === classroom.repPin || pin === classroom.teacherPin) {
        onSuccess('REP');
        onClose();
      } else {
        setError(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
            <KeyRound className="w-5 h-5 text-blue-600" /> ยืนยันสิทธิ์เข้าห้องเรียน
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 mb-4">
          <button
            type="button"
            onClick={() => {
              setTargetRole('REP');
              setError(false);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              targetRole === 'REP'
                ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm'
                : 'text-zinc-500'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> ตัวแทนห้อง
          </button>
          <button
            type="button"
            onClick={() => {
              setTargetRole('TEACHER');
              setError(false);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              targetRole === 'TEACHER'
                ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm'
                : 'text-zinc-500'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> คุณครูผู้สอน
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 text-center">
              กรอกรหัส PIN ({targetRole === 'TEACHER' ? 'รหัสคุณครู' : 'รหัสตัวแทนห้อง'})
            </label>
            <input
              type="password"
              maxLength={6}
              autoFocus
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              className="w-full text-center text-2xl font-mono tracking-[0.5em] px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && (
              <p className="text-xs text-rose-500 text-center mt-2 font-medium">
                รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง
              </p>
            )}
            <p className="text-[11px] text-zinc-400 text-center mt-2">
              (ค่าเริ่มต้นสำหรับห้องทดสอบ: ครูคือ 1234, ตัวแทนคือ 5678)
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs text-zinc-600 hover:bg-zinc-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20"
            >
              เข้าใช้งาน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
