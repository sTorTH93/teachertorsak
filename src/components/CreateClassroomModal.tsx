'use client';

import React, { useState } from 'react';
import { X, Users, KeyRound, Sparkles } from 'lucide-react';
import { Classroom, Student } from '@/types';

interface CreateClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (classroom: Classroom) => void;
}

export default function CreateClassroomModal({ isOpen, onClose, onCreated }: CreateClassroomModalProps) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherPin, setTeacherPin] = useState('1234');
  const [repPin, setRepPin] = useState('5678');
  const [rawStudentList, setRawStudentList] = useState('');

  if (!isOpen) return null;

  const handleParseAndCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !teacherName.trim()) {
      alert('กรุณากรอกชื่อห้องเรียน วิชา และชื่อครูผู้สอนให้ครบถ้วน');
      return;
    }

    // Parse students from textarea
    const lines = rawStudentList
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const students: Student[] = lines.map((line, index) => {
      // Check if line starts with number e.g. "1 สมชาย" or "1. สมชาย"
      const match = line.match(/^(\d+)[\.\s\-]+(.+)$/);
      if (match) {
        return {
          id: `std-${Date.now()}-${index + 1}`,
          studentNumber: parseInt(match[1], 10),
          name: match[2].trim(),
        };
      }
      return {
        id: `std-${Date.now()}-${index + 1}`,
        studentNumber: index + 1,
        name: line,
      };
    });

    // If no students pasted, create default 5 placeholder students
    const finalStudents =
      students.length > 0
        ? students
        : [
            { id: `std-${Date.now()}-1`, studentNumber: 1, name: 'นักเรียนเลขที่ 1' },
            { id: `std-${Date.now()}-2`, studentNumber: 2, name: 'นักเรียนเลขที่ 2' },
            { id: `std-${Date.now()}-3`, studentNumber: 3, name: 'นักเรียนเลขที่ 3' },
          ];

    const newClassroom: Classroom = {
      id: `cls-${Date.now()}`,
      name: name.trim(),
      subject: subject.trim(),
      teacherName: teacherName.trim(),
      teacherPin: teacherPin.trim() || '1234',
      repPin: repPin.trim() || '5678',
      createdAt: new Date().toISOString(),
      students: finalStudents,
      assignments: [
        {
          id: `asn-${Date.now()}-1`,
          classroomId: `cls-${Date.now()}`,
          title: 'งานที่ 1: แบบฝึกหัดในชั้นเรียน',
          description: 'เช็คการส่งงานในคาบเรียน',
          maxScore: 10,
          deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          createdAt: new Date().toISOString(),
        },
      ],
      submissions: {},
    };

    onCreated(newClassroom);
    onClose();
  };

  const handleSampleStudents = () => {
    setRawStudentList(`1 นายกิตติศักดิ์ เจริญพร (กิต)
2 นายจิรายุ สมบูรณ์ (เจมส์)
3 นายณัฐพล ศรีสุวรรณ (ณัฐ)
4 นางสาวธนภรณ์ รัตนวิชัย (พราว)
5 นางสาวนภัสสร แสงทอง (ฟ้า)
6 นางสาวปรียาภรณ์ มณีโชติ (ปิ่น)
7 นายวรเมธ คงสมุทร (นนท์)
8 นางสาวอภิชญา บุญรักษา (ไอซ์)`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">สร้างห้องเรียนใหม่</h2>
            <p className="text-xs text-zinc-500">กำหนดห้องเรียน วิชา และรายชื่อนักเรียนสำหรับเช็คงาน</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleParseAndCreate} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                ห้องเรียน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น ม.4/2, ม.5/1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                วิชา <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น คณิตศาสตร์, วิทยาการคำนวณ"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              ชื่อคุณครูผู้สอน <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น ครูสมศรี มุ่งมั่น"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Security PINs */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <KeyRound className="w-4 h-4 text-blue-600" /> รหัส PIN ประจำห้อง (ไม่ต้องสมัครสมาชิก)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">PIN คุณครู (แก้ไข/ลบงาน)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={teacherPin}
                  onChange={(e) => setTeacherPin(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono text-center tracking-widest focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">PIN ตัวแทนห้อง (เช็คงานอย่างเดียว)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={repPin}
                  onChange={(e) => setRepPin(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono text-center tracking-widest focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Student Names Paste Box */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> รายชื่อนักเรียน (วางรายชื่อจาก Excel หรือพิมพ์บรรทัดละคน)
              </label>
              <button
                type="button"
                onClick={handleSampleStudents}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> เติมตัวอย่าง 8 คน
              </button>
            </div>
            <textarea
              rows={5}
              placeholder="1 นายสมชาย ใจดี&#10;2 นายสมศักดิ์ ขยันยิ่ง&#10;3 นางสาวสมหญิง ตั้งใจ"
              value={rawStudentList}
              onChange={(e) => setRawStudentList(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              * สามารถคัดลอกจาก Excel วางได้ทันที ระบบจะใส่เลขที่ให้อัตโนมัติ (แก้ไขเพิ่มเติมภายหลังได้)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md shadow-blue-500/20"
            >
              สร้างห้องเรียน & เริ่มเช็คงาน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
