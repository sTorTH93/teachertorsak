'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Calendar, FileText, CheckCircle2, Clock, Award } from 'lucide-react';
import { Classroom, Assignment } from '@/types';

interface AssignmentsManagerViewProps {
  classroom: Classroom;
  onUpdateClassroom: (updated: Classroom) => void;
  userRole: 'TEACHER' | 'REP' | 'GUEST';
}

export default function AssignmentsManagerView({
  classroom,
  onUpdateClassroom,
  userRole,
}: AssignmentsManagerViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore] = useState('10');
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return d.toISOString().slice(0, 16); // format: YYYY-MM-DDTHH:mm
  });

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('กรุณากรอกชื่องาน');
      return;
    }

    const newAssignment: Assignment = {
      id: `asn-${Date.now()}`,
      classroomId: classroom.id,
      title: title.trim(),
      description: description.trim() || undefined,
      maxScore: parseFloat(maxScore) || 10,
      deadline: new Date(deadlineDate).toISOString(),
      createdAt: new Date().toISOString(),
    };

    onUpdateClassroom({
      ...classroom,
      assignments: [...classroom.assignments, newAssignment],
    });

    setTitle('');
    setDescription('');
    setMaxScore('10');
    setShowAddModal(false);
  };

  const handleDeleteAssignment = (id: string, title: string) => {
    if (userRole !== 'TEACHER') {
      alert('เฉพาะคุณครูเท่านั้นที่มีสิทธิ์ลบงาน');
      return;
    }
    if (!confirm(`คุณต้องการลบงาน "${title}" ใช่หรือไม่? ข้อมูลคะแนนของงานนี้จะถูกลบไปด้วย`)) return;

    const filteredAssignments = classroom.assignments.filter((a) => a.id !== id);
    const updatedSubmissions = { ...classroom.submissions };

    // clean up submissions
    Object.keys(updatedSubmissions).forEach((key) => {
      if (key.startsWith(`${id}_`)) {
        delete updatedSubmissions[key];
      }
    });

    onUpdateClassroom({
      ...classroom,
      assignments: filteredAssignments,
      submissions: updatedSubmissions,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">รายการงานทั้งหมด ({classroom.assignments.length} งาน)</h3>
          <p className="text-xs text-zinc-500">สร้าง กำหนดคะแนนเต็ม และวันหมดเขตสำหรับแต่ละงาน</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> เพิ่มงานใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classroom.assignments.map((assignment, index) => {
          // calculate completion
          let submittedCount = 0;
          classroom.students.forEach((s) => {
            const sub = classroom.submissions[`${assignment.id}_${s.id}`];
            if (sub?.status === 'SUBMITTED' || sub?.status === 'LATE') submittedCount++;
          });
          const total = classroom.students.length;
          const percentage = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

          const isExpired = new Date().getTime() > new Date(assignment.deadline).getTime();

          return (
            <div
              key={assignment.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm leading-snug">
                      {assignment.title}
                    </h4>
                    {assignment.description && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{assignment.description}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                  title="ลบงานนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> คะแนนเต็ม {assignment.maxScore} คะแนน
                </span>

                <span
                  className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 ${
                    isExpired
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {isExpired ? 'หมดเขตแล้ว' : 'ส่งได้ถึง'}:{' '}
                  {new Date(assignment.deadline).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                  <span className="flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> ส่งแล้ว {submittedCount} / {total} คน
                  </span>
                  <span className="font-bold">{percentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">เพิ่มงานใหม่</h3>
            <p className="text-xs text-zinc-500 mb-4">มอบหมายงานให้นักเรียนในห้องนี้</p>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  ชื่องาน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น แบบฝึกหัดที่ 2.3 หน้า 50"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  รายละเอียด / คำสั่ง (ถ้ามี)
                </label>
                <textarea
                  rows={2}
                  placeholder="เช่น ทำลงสมุดแล้วนำมาส่งท้ายคาบ"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    คะแนนเต็ม <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    กำหนดส่ง (วันและเวลา)
                  </label>
                  <input
                    type="datetime-local"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md shadow-blue-500/20"
                >
                  บันทึกงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
