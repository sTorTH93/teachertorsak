'use client';

import React, { useState } from 'react';
import { X, Settings, KeyRound, Save } from 'lucide-react';
import SubjectsEditor from './SubjectsEditor';
import { Classroom } from '@/types';

interface EditClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom;
  onSave: (updated: Classroom) => void;
}

export default function EditClassroomModal({
  isOpen,
  onClose,
  classroom,
  onSave,
}: EditClassroomModalProps) {
  const [name, setName] = useState(classroom.name);
  const [subjects, setSubjects] = useState<string[]>(classroom.subjects);
  const [teacherName, setTeacherName] = useState(classroom.teacherName);
  const [teacherPin, setTeacherPin] = useState(classroom.teacherPin);
  const [repPin, setRepPin] = useState(classroom.repPin);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || subjects.length === 0 || !teacherName.trim()) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    onSave({
      ...classroom,
      name: name.trim(),
      subject: subjects[0],
      subjects,
      teacherName: teacherName.trim(),
      teacherPin: teacherPin.trim() || '1234',
      repPin: repPin.trim() || '5678',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-base">
            <Settings className="w-5 h-5 text-blue-600" /> แก้ไขข้อมูลห้องเรียน
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              ห้องเรียน <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <SubjectsEditor value={subjects} onChange={setSubjects} locked={[...new Set(classroom.assignments.map(a => a.subject || classroom.subject))]} />

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              ครูผู้สอน <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" /> รหัส PIN ประจำห้อง
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">PIN คุณครู</label>
                <input
                  type="text"
                  maxLength={6}
                  value={teacherPin}
                  onChange={(e) => setTeacherPin(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm font-mono text-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">PIN ตัวแทนห้อง</label>
                <input
                  type="text"
                  maxLength={6}
                  value={repPin}
                  onChange={(e) => setRepPin(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm font-mono text-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20"
            >
              <Save className="w-4 h-4" /> บันทึกการเปลี่ยนแปลง
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
