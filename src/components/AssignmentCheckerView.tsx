'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Search,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  CheckCheck,
  UserCheck,
  Filter,
} from 'lucide-react';
import { Classroom, Assignment, SubmissionStatus, Submission } from '@/types';

interface AssignmentCheckerViewProps {
  classroom: Classroom;
  onUpdateClassroom: (updated: Classroom) => void;
  userRole: 'TEACHER' | 'REP' | 'GUEST';
}

export default function AssignmentCheckerView({
  classroom,
  onUpdateClassroom,
  userRole,
}: AssignmentCheckerViewProps) {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    classroom.assignments[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SubmissionStatus>('ALL');
  const [checkerName, setCheckerName] = useState(
    userRole === 'TEACHER' ? classroom.teacherName : 'ตัวแทนห้อง'
  );

  const currentAssignment = useMemo(() => {
    return classroom.assignments.find((a) => a.id === selectedAssignmentId);
  }, [classroom.assignments, selectedAssignmentId]);

  // Check if current assignment is past deadline
  const isPastDeadline = useMemo(() => {
    if (!currentAssignment?.deadline) return false;
    return new Date().getTime() > new Date(currentAssignment.deadline).getTime();
  }, [currentAssignment]);

  const deadlineFormatted = useMemo(() => {
    if (!currentAssignment?.deadline) return '-';
    try {
      const d = new Date(currentAssignment.deadline);
      return d.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return currentAssignment.deadline;
    }
  }, [currentAssignment]);

  // Calculate statistics for this assignment
  const stats = useMemo(() => {
    if (!currentAssignment) return { submitted: 0, late: 0, notSubmitted: 0, pending: 0, total: 0 };
    const total = classroom.students.length;
    let submitted = 0;
    let late = 0;
    let notSubmitted = 0;

    classroom.students.forEach((s) => {
      const key = `${currentAssignment.id}_${s.id}`;
      const sub = classroom.submissions[key];
      if (sub?.status === 'SUBMITTED') submitted++;
      else if (sub?.status === 'LATE') late++;
      else if (sub?.status === 'NOT_SUBMITTED') notSubmitted++;
    });

    const pending = total - (submitted + late + notSubmitted);
    return { submitted, late, notSubmitted, pending, total };
  }, [classroom, currentAssignment]);

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!currentAssignment) return [];
    return classroom.students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentNumber.toString().includes(searchQuery) ||
        (s.nickname && s.nickname.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;

      const key = `${currentAssignment.id}_${s.id}`;
      const sub = classroom.submissions[key];
      const status = sub?.status || 'PENDING';
      return status === statusFilter;
    });
  }, [classroom, currentAssignment, searchQuery, statusFilter]);

  // Handle single student status change
  const handleSetStatus = (studentId: string, status: SubmissionStatus) => {
    if (!currentAssignment) return;
    const key = `${currentAssignment.id}_${studentId}`;
    const existing = classroom.submissions[key];

    let newScore = existing?.score ?? null;

    // Automatic default score calculation
    if (status === 'SUBMITTED' && (newScore === null || newScore === 0)) {
      newScore = currentAssignment.maxScore;
    } else if (status === 'LATE' && (newScore === null || newScore === 0)) {
      // Default to 80% score rounded if late
      newScore = Math.max(0, Math.floor(currentAssignment.maxScore * 0.8));
    } else if (status === 'NOT_SUBMITTED') {
      newScore = 0;
    } else if (status === 'PENDING') {
      newScore = null;
    }

    const updatedSubmissions = {
      ...classroom.submissions,
      [key]: {
        id: existing?.id || `sub-${Date.now()}-${studentId}`,
        assignmentId: currentAssignment.id,
        studentId,
        status,
        score: newScore,
        note: existing?.note || (status === 'LATE' ? 'ส่งหลังเวลา' : ''),
        checkedBy: checkerName,
        updatedAt: new Date().toISOString(),
      },
    };

    onUpdateClassroom({
      ...classroom,
      submissions: updatedSubmissions,
    });
  };

  // Handle single student score change
  const handleScoreChange = (studentId: string, val: string) => {
    if (!currentAssignment) return;
    const key = `${currentAssignment.id}_${studentId}`;
    const existing = classroom.submissions[key];

    const numeric = val === '' ? null : Math.min(currentAssignment.maxScore, Math.max(0, parseFloat(val) || 0));

    const updatedSubmissions = {
      ...classroom.submissions,
      [key]: {
        id: existing?.id || `sub-${Date.now()}-${studentId}`,
        assignmentId: currentAssignment.id,
        studentId,
        status: existing?.status || 'SUBMITTED',
        score: numeric,
        note: existing?.note || '',
        checkedBy: checkerName,
        updatedAt: new Date().toISOString(),
      },
    };

    onUpdateClassroom({
      ...classroom,
      submissions: updatedSubmissions,
    });
  };

  // Handle single student note change
  const handleNoteChange = (studentId: string, note: string) => {
    if (!currentAssignment) return;
    const key = `${currentAssignment.id}_${studentId}`;
    const existing = classroom.submissions[key];

    const updatedSubmissions = {
      ...classroom.submissions,
      [key]: {
        id: existing?.id || `sub-${Date.now()}-${studentId}`,
        assignmentId: currentAssignment.id,
        studentId,
        status: existing?.status || 'PENDING',
        score: existing?.score ?? null,
        note,
        checkedBy: checkerName,
        updatedAt: new Date().toISOString(),
      },
    };

    onUpdateClassroom({
      ...classroom,
      submissions: updatedSubmissions,
    });
  };

  // Quick Action: Mark all students as submitted
  const handleMarkAllSubmitted = () => {
    if (!currentAssignment) return;
    if (!confirm('ต้องการเช็คว่า "ส่งแล้วทุกคน" สำหรับงานนี้ใช่หรือไม่?')) return;

    const newSubs = { ...classroom.submissions };
    classroom.students.forEach((s) => {
      const key = `${currentAssignment.id}_${s.id}`;
      newSubs[key] = {
        id: newSubs[key]?.id || `sub-${Date.now()}-${s.id}`,
        assignmentId: currentAssignment.id,
        studentId: s.id,
        status: 'SUBMITTED',
        score: currentAssignment.maxScore,
        note: '',
        checkedBy: checkerName,
        updatedAt: new Date().toISOString(),
      };
    });

    onUpdateClassroom({
      ...classroom,
      submissions: newSubs,
    });
  };

  // Quick Action: Mark remaining pending as not submitted
  const handleMarkRemainingNotSubmitted = () => {
    if (!currentAssignment) return;
    if (!confirm('ต้องการเปลี่ยนคนที่ "ยังไม่เช็ค" ทั้งหมดเป็น "ไม่ส่ง (0 คะแนน)" ใช่หรือไม่?')) return;

    const newSubs = { ...classroom.submissions };
    classroom.students.forEach((s) => {
      const key = `${currentAssignment.id}_${s.id}`;
      const current = newSubs[key];
      if (!current || current.status === 'PENDING') {
        newSubs[key] = {
          id: current?.id || `sub-${Date.now()}-${s.id}`,
          assignmentId: currentAssignment.id,
          studentId: s.id,
          status: 'NOT_SUBMITTED',
          score: 0,
          note: 'ไม่ส่งในคาบ',
          checkedBy: checkerName,
          updatedAt: new Date().toISOString(),
        };
      }
    });

    onUpdateClassroom({
      ...classroom,
      submissions: newSubs,
    });
  };

  // Reset checking for this assignment
  const handleResetAssignment = () => {
    if (!currentAssignment) return;
    if (!confirm('ต้องการล้างผลการเช็คงานทั้งหมดของงานนี้ใช่หรือไม่?')) return;

    const newSubs = { ...classroom.submissions };
    classroom.students.forEach((s) => {
      const key = `${currentAssignment.id}_${s.id}`;
      delete newSubs[key];
    });

    onUpdateClassroom({
      ...classroom,
      submissions: newSubs,
    });
  };

  if (classroom.assignments.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
        <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-3 opacity-60" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">ยังไม่มีงานที่มอบหมายในห้องนี้</h3>
        <p className="text-sm text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
          กรุณาสร้างงานใหม่ในแท็บ "จัดการงาน" ก่อนเริ่มเช็คการส่งงานของนักเรียน
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assignment Selector & Info Banner */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-zinc-500 mb-1">เลือกงานที่ต้องการเช็คในคาบนี้:</label>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="w-full md:max-w-md px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
            >
              {classroom.assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} (คะแนนเต็ม {a.maxScore} คะแนน)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500">ผู้ตรวจ:</span>
              <input
                type="text"
                value={checkerName}
                onChange={(e) => setCheckerName(e.target.value)}
                placeholder="ชื่อผู้ตรวจ"
                className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium w-32 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {currentAssignment && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                <span className="text-zinc-400">คะแนนเต็ม:</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold">
                  {currentAssignment.maxScore} คะแนน
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-400">กำหนดส่ง:</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{deadlineFormatted}</span>
                {isPastDeadline ? (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> เลยกำหนดส่งแล้ว
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-medium">
                    กำลังเปิดรับส่ง
                  </span>
                )}
              </div>
            </div>

            {currentAssignment.description && (
              <p className="text-zinc-500 italic max-w-xl truncate">{currentAssignment.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter(statusFilter === 'SUBMITTED' ? 'ALL' : 'SUBMITTED')}
          className={`p-3.5 rounded-2xl border transition-all text-left ${
            statusFilter === 'SUBMITTED'
              ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
              : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${statusFilter === 'SUBMITTED' ? 'text-emerald-100' : 'text-emerald-700 dark:text-emerald-400'}`}>
              ส่งแล้ว (ตรงเวลา)
            </span>
            <CheckCircle2 className={`w-4 h-4 ${statusFilter === 'SUBMITTED' ? 'text-white' : 'text-emerald-600'}`} />
          </div>
          <div className="mt-2 text-2xl font-bold flex items-baseline gap-1">
            <span>{stats.submitted}</span>
            <span className={`text-xs ${statusFilter === 'SUBMITTED' ? 'text-emerald-200' : 'text-zinc-400'}`}>
              / {stats.total} คน
            </span>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'LATE' ? 'ALL' : 'LATE')}
          className={`p-3.5 rounded-2xl border transition-all text-left ${
            statusFilter === 'LATE'
              ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
              : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 hover:bg-amber-100/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${statusFilter === 'LATE' ? 'text-amber-100' : 'text-amber-700 dark:text-amber-400'}`}>
              ส่งช้ากว่ากำหนด
            </span>
            <Clock className={`w-4 h-4 ${statusFilter === 'LATE' ? 'text-white' : 'text-amber-600'}`} />
          </div>
          <div className="mt-2 text-2xl font-bold flex items-baseline gap-1">
            <span>{stats.late}</span>
            <span className={`text-xs ${statusFilter === 'LATE' ? 'text-amber-200' : 'text-zinc-400'}`}>
              / {stats.total} คน
            </span>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'NOT_SUBMITTED' ? 'ALL' : 'NOT_SUBMITTED')}
          className={`p-3.5 rounded-2xl border transition-all text-left ${
            statusFilter === 'NOT_SUBMITTED'
              ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20'
              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 hover:bg-rose-100/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${statusFilter === 'NOT_SUBMITTED' ? 'text-rose-100' : 'text-rose-700 dark:text-rose-400'}`}>
              ไม่ส่งงาน
            </span>
            <XCircle className={`w-4 h-4 ${statusFilter === 'NOT_SUBMITTED' ? 'text-white' : 'text-rose-600'}`} />
          </div>
          <div className="mt-2 text-2xl font-bold flex items-baseline gap-1">
            <span>{stats.notSubmitted}</span>
            <span className={`text-xs ${statusFilter === 'NOT_SUBMITTED' ? 'text-rose-200' : 'text-zinc-400'}`}>
              / {stats.total} คน
            </span>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`p-3.5 rounded-2xl border transition-all text-left ${
            statusFilter === 'PENDING'
              ? 'bg-zinc-700 text-white border-zinc-800 shadow-md'
              : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${statusFilter === 'PENDING' ? 'text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'}`}>
              ยังไม่เช็ค (รอตรวจ)
            </span>
            <HelpCircle className={`w-4 h-4 ${statusFilter === 'PENDING' ? 'text-white' : 'text-zinc-400'}`} />
          </div>
          <div className="mt-2 text-2xl font-bold flex items-baseline gap-1">
            <span>{stats.pending}</span>
            <span className={`text-xs ${statusFilter === 'PENDING' ? 'text-zinc-300' : 'text-zinc-400'}`}>
              / {stats.total} คน
            </span>
          </div>
        </button>
      </div>

      {/* Action Controls & Fast Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่ หรือชื่อนักเรียน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {statusFilter !== 'ALL' && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center gap-1 hover:bg-zinc-200"
            >
              <Filter className="w-3 h-3" /> ล้างตัวกรอง
            </button>
          )}
        </div>

        {/* Quick Batch Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleMarkAllSubmitted}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm shadow-emerald-600/20"
            title="เช็คว่าทุกคนส่งแล้ว และใส่คะแนนเต็มให้อัตโนมัติ"
          >
            <CheckCheck className="w-3.5 h-3.5" /> เช็คส่งทุกคน
          </button>

          <button
            onClick={handleMarkRemainingNotSubmitted}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-zinc-700 dark:text-zinc-300 rounded-xl transition-all"
            title="คนที่ยังไม่เช็คทั้งหมด ปรับเป็นไม่ส่ง (0 คะแนน)"
          >
            <XCircle className="w-3.5 h-3.5" /> เช็คที่เหลือว่าไม่ส่ง
          </button>

          <button
            onClick={handleResetAssignment}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="ล้างผลการเช็คของงานนี้"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Student List for Checking */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16 text-center">เลขที่</th>
                <th className="py-3.5 px-4">ชื่อ-สกุล</th>
                <th className="py-3.5 px-4 text-center">สถานะการส่งงาน (คลิกเพื่อเปลี่ยน)</th>
                <th className="py-3.5 px-4 w-32 text-center">คะแนน</th>
                <th className="py-3.5 px-4 min-w-[180px]">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400 text-xs">
                    ไม่พบข้อมูลนักเรียนที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  if (!currentAssignment) return null;
                  const key = `${currentAssignment.id}_${student.id}`;
                  const sub: Submission | undefined = classroom.submissions[key];
                  const status: SubmissionStatus = sub?.status || 'PENDING';
                  const score = sub?.score ?? '';

                  return (
                    <tr
                      key={student.id}
                      className={`transition-colors ${
                        status === 'SUBMITTED'
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/10'
                          : status === 'LATE'
                          ? 'bg-amber-50/30 dark:bg-amber-950/10'
                          : status === 'NOT_SUBMITTED'
                          ? 'bg-rose-50/30 dark:bg-rose-950/10'
                          : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'
                      }`}
                    >
                      {/* Number */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold text-xs text-zinc-700 dark:text-zinc-300">
                          {student.studentNumber}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <span>{student.name}</span>
                          {student.nickname && (
                            <span className="text-xs font-normal text-zinc-400">({student.nickname})</span>
                          )}
                        </div>
                        {sub?.checkedBy && (
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <UserCheck className="w-3 h-3 text-zinc-400" /> ตรวจโดย: {sub.checkedBy}
                          </div>
                        )}
                      </td>

                      {/* Status Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 gap-1 border border-zinc-200/60 dark:border-zinc-700/60">
                          {/* Submitted */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'SUBMITTED')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              status === 'SUBMITTED'
                                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-bold'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ส่งแล้ว</span>
                          </button>

                          {/* Late */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'LATE')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              status === 'LATE'
                                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30 font-bold'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>ส่งช้า</span>
                          </button>

                          {/* Not Submitted */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'NOT_SUBMITTED')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              status === 'NOT_SUBMITTED'
                                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 font-bold'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>ไม่ส่ง</span>
                          </button>
                        </div>
                      </td>

                      {/* Score Input */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={currentAssignment.maxScore}
                            step={0.5}
                            value={score}
                            onChange={(e) => handleScoreChange(student.id, e.target.value)}
                            placeholder="-"
                            className={`w-16 px-2.5 py-1.5 text-center text-sm font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              status === 'SUBMITTED'
                                ? 'border-emerald-300 bg-white text-emerald-700 dark:bg-zinc-800 dark:text-emerald-300'
                                : status === 'LATE'
                                ? 'border-amber-300 bg-white text-amber-700 dark:bg-zinc-800 dark:text-amber-300'
                                : status === 'NOT_SUBMITTED'
                                ? 'border-rose-300 bg-white text-rose-700 dark:bg-zinc-800 dark:text-rose-300'
                                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700'
                            }`}
                          />
                          <span className="text-xs text-zinc-400 font-medium">/{currentAssignment.maxScore}</span>
                        </div>
                      </td>

                      {/* Note */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={sub?.note || ''}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          placeholder="เพิ่มโน้ต เช่น ลืมสมุด, ส่งช้า 15 นาที..."
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-transparent hover:border-zinc-200 focus:border-zinc-300 dark:hover:border-zinc-700 bg-transparent focus:bg-white dark:focus:bg-zinc-800 transition-colors"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
