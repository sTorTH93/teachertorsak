'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Users, ClipboardList, Sparkles } from 'lucide-react';
import { Classroom, Student } from '@/types';

interface StudentsManagerViewProps {
  classroom: Classroom;
  onUpdateClassroom: (updated: Classroom) => void;
  userRole: 'TEACHER' | 'REP' | 'GUEST';
}

export default function StudentsManagerView({
  classroom,
  onUpdateClassroom,
  userRole,
}: StudentsManagerViewProps) {
  const [newNumber, setNewNumber] = useState(
    (classroom.students.length > 0
      ? Math.max(...classroom.students.map((s) => s.studentNumber)) + 1
      : 1
    ).toString()
  );
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editNickname, setEditNickname] = useState('');

  // Batch paste state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchText, setBatchText] = useState('');

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      studentNumber: parseInt(newNumber, 10) || classroom.students.length + 1,
      name: newName.trim(),
      nickname: newNickname.trim() || undefined,
    };

    const updated = [...classroom.students, newStudent].sort(
      (a, b) => a.studentNumber - b.studentNumber
    );

    onUpdateClassroom({
      ...classroom,
      students: updated,
    });

    setNewName('');
    setNewNickname('');
    setNewNumber((newStudent.studentNumber + 1).toString());
  };

  const handleBatchImport = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = batchText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    let startNumber =
      classroom.students.length > 0
        ? Math.max(...classroom.students.map((s) => s.studentNumber)) + 1
        : 1;

    const parsed: Student[] = lines.map((line, idx) => {
      const match = line.match(/^(\d+)[\.\s\-]+(.+)$/);
      if (match) {
        return {
          id: `std-${Date.now()}-${idx}`,
          studentNumber: parseInt(match[1], 10),
          name: match[2].trim(),
        };
      }
      const num = startNumber++;
      return {
        id: `std-${Date.now()}-${idx}`,
        studentNumber: num,
        name: line,
      };
    });

    const updated = [...classroom.students, ...parsed].sort(
      (a, b) => a.studentNumber - b.studentNumber
    );

    onUpdateClassroom({
      ...classroom,
      students: updated,
    });

    setBatchText('');
    setShowBatchModal(false);
    setNewNumber((Math.max(...updated.map((s) => s.studentNumber)) + 1).toString());
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (userRole !== 'TEACHER') {
      alert('เฉพาะคุณครูเท่านั้นที่มีสิทธิ์ลบนักเรียน');
      return;
    }
    if (!confirm(`คุณต้องการลบ "${name}" ออกจากห้องเรียนใช่หรือไม่? ผลการส่งงานทั้งหมดของนักเรียนคนนี้จะถูกลบด้วย`)) return;

    const filtered = classroom.students.filter((s) => s.id !== id);

    // Clean up submissions for this student
    const updatedSubmissions = { ...classroom.submissions };
    Object.keys(updatedSubmissions).forEach((key) => {
      if (key.endsWith(`_${id}`)) {
        delete updatedSubmissions[key];
      }
    });

    onUpdateClassroom({
      ...classroom,
      students: filtered,
      submissions: updatedSubmissions,
    });
  };

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setEditName(student.name);
    setEditNumber(student.studentNumber.toString());
    setEditNickname(student.nickname || '');
  };

  const saveEdit = (id: string) => {
    const updated = classroom.students
      .map((s) => {
        if (s.id === id) {
          return {
            ...s,
            name: editName.trim(),
            studentNumber: parseInt(editNumber, 10) || s.studentNumber,
            nickname: editNickname.trim() || undefined,
          };
        }
        return s;
      })
      .sort((a, b) => a.studentNumber - b.studentNumber);

    onUpdateClassroom({
      ...classroom,
      students: updated,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            รายชื่อนักเรียน ({classroom.students.length} คน)
          </h3>
          <p className="text-xs text-zinc-500">จัดการเลขที่ เพิ่ม ลบ หรือแก้ไขรายชื่อนักเรียนในห้อง {classroom.name}</p>
        </div>

        <button
          onClick={() => setShowBatchModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-xl"
        >
          <ClipboardList className="w-4 h-4 text-blue-600" /> นำเข้ารายชื่อชุดใหญ่ (วางจาก Excel)
        </button>
      </div>

      {/* Add Single Student Form */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-3 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-blue-600" /> เพิ่มนักเรียนใหม่
        </h4>
        <form onSubmit={handleAddStudent} className="flex flex-wrap items-center gap-2">
          <div className="w-20">
            <input
              type="number"
              min={1}
              placeholder="เลขที่"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center font-bold focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="ชื่อ - สกุล (เช่น นายกิตติศักดิ์ เจริญพร)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="w-28">
            <input
              type="text"
              placeholder="ชื่อเล่น (ถ้ามี)"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> เพิ่มนักเรียน
          </button>
        </form>
      </div>

      {/* Student List Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase">
              <th className="py-3 px-4 w-16 text-center">เลขที่</th>
              <th className="py-3 px-4">ชื่อ - นามสกุล</th>
              <th className="py-3 px-4 w-32">ชื่อเล่น</th>
              <th className="py-3 px-4 w-28 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {classroom.students.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-zinc-400">
                  ยังไม่มีนักเรียนในห้องนี้
                </td>
              </tr>
            ) : (
              classroom.students.map((student) => {
                const isEditing = editingId === student.id;

                return (
                  <tr key={student.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                    <td className="py-2.5 px-4 text-center font-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editNumber}
                          onChange={(e) => setEditNumber(e.target.value)}
                          className="w-14 px-2 py-1 text-center border rounded-lg"
                        />
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold text-xs text-zinc-700 dark:text-zinc-300">
                          {student.studentNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2 py-1 border rounded-lg"
                        />
                      ) : (
                        student.name
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-500">
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="ชื่อเล่น"
                          value={editNickname}
                          onChange={(e) => setEditNickname(e.target.value)}
                          className="w-24 px-2 py-1 border rounded-lg text-xs"
                        />
                      ) : student.nickname ? (
                        `(${student.nickname})`
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(student.id)}
                              className="px-2 py-1 text-xs bg-emerald-600 text-white rounded-lg flex items-center gap-1"
                              title="บันทึก"
                            >
                              <Check className="w-3.5 h-3.5" /> บันทึก
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-zinc-400 hover:bg-zinc-100 rounded-lg"
                              title="ยกเลิก"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(student)}
                              className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                              title="แก้ไขชื่อ/เลขที่"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="ลบนักเรียน"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Batch Import Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-base">
                <ClipboardList className="w-5 h-5 text-blue-600" /> นำเข้ารายชื่อนักเรียนชุดใหญ่
              </div>
              <button onClick={() => setShowBatchModal(false)} className="p-1 text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBatchImport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  วางรายชื่อนักเรียน (จาก Excel หรือพิมพ์บรรทัดละคน)
                </label>
                <textarea
                  rows={6}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder="เช่น:&#10;1 นายสมชาย ใจดี&#10;2 นายสมศักดิ์ ขยันยิ่ง&#10;หรือแค่ชื่อ:&#10;นางสาวพิมพิลาไลย ทองสุข"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  * ข้อมูลจะถูกนำไปต่อท้ายรายชื่อเดิมโดยอัตโนมัติ
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 text-xs text-zinc-600 hover:bg-zinc-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20"
                >
                  เพิ่มรายชื่อทั้งหมด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
