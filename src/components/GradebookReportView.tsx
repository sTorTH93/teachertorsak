'use client';

import React, { useMemo } from 'react';
import { Download, Printer, Award, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { Classroom } from '@/types';

interface GradebookReportViewProps {
  classroom: Classroom;
}

export default function GradebookReportView({ classroom }: GradebookReportViewProps) {
  // Total maximum score of all assignments
  const totalMaxScore = useMemo(() => {
    return classroom.assignments.reduce((sum, a) => sum + a.maxScore, 0);
  }, [classroom.assignments]);

  // Calculate student results
  const studentResults = useMemo(() => {
    return classroom.students.map((student) => {
      let earnedScore = 0;
      let submittedCount = 0;
      let lateCount = 0;
      let notSubmittedCount = 0;

      const assignmentScores: Record<string, { score: number | null; status: string }> = {};

      classroom.assignments.forEach((asn) => {
        const key = `${asn.id}_${student.id}`;
        const sub = classroom.submissions[key];

        if (sub) {
          if (sub.score !== null) {
            earnedScore += sub.score;
          }
          if (sub.status === 'SUBMITTED') submittedCount++;
          else if (sub.status === 'LATE') lateCount++;
          else if (sub.status === 'NOT_SUBMITTED') notSubmittedCount++;

          assignmentScores[asn.id] = {
            score: sub.score,
            status: sub.status,
          };
        } else {
          assignmentScores[asn.id] = {
            score: null,
            status: 'PENDING',
          };
        }
      });

      const percentage = totalMaxScore > 0 ? Math.round((earnedScore / totalMaxScore) * 100) : 0;

      return {
        student,
        earnedScore,
        percentage,
        submittedCount,
        lateCount,
        notSubmittedCount,
        assignmentScores,
      };
    });
  }, [classroom, totalMaxScore]);

  // Summary stats
  const classStats = useMemo(() => {
    if (studentResults.length === 0) return { avg: 0, max: 0, min: 0 };
    const scores = studentResults.map((r) => r.earnedScore);
    const avg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    return { avg, max, min };
  }, [studentResults]);

  // Export to CSV with UTF-8 BOM for Excel Thai language support
  const handleExportCSV = () => {
    const headers = [
      'เลขที่',
      'ชื่อ-สกุล',
      ...classroom.assignments.map((a) => `"${a.title} (${a.maxScore} คะแนน)"`),
      `"คะแนนรวม (${totalMaxScore})"`,
      'ร้อยละ (%)',
      'ส่งตรงเวลา (งาน)',
      'ส่งช้า (งาน)',
      'ไม่ส่ง (งาน)',
    ];

    const rows = studentResults.map((r) => {
      const scores = classroom.assignments.map((a) => {
        const item = r.assignmentScores[a.id];
        return item?.score !== null && item?.score !== undefined ? item.score : '-';
      });

      return [
        r.student.studentNumber,
        `"${r.student.name}"`,
        ...scores,
        r.earnedScore,
        `${r.percentage}%`,
        r.submittedCount,
        r.lateCount,
        r.notSubmittedCount,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `คะแนน_${classroom.name}_${classroom.subject}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">สมุดบันทึกคะแนน (Gradebook)</h3>
          <p className="text-xs text-zinc-500">สรุปคะแนนรวม และอัตราการส่งงานของนักเรียนทุกคน</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" /> ส่งออก Excel (CSV)
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 rounded-xl"
          >
            <Printer className="w-4 h-4" /> พิมพ์รายงาน
          </button>
        </div>
      </div>

      {/* Class Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-500">คะแนนเฉลี่ยทั้งห้อง</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {classStats.avg} <span className="text-xs font-normal text-zinc-400">/ {totalMaxScore}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-500">คะแนนสูงสุด</div>
            <div className="text-xl font-bold text-emerald-600">
              {classStats.max} <span className="text-xs font-normal text-zinc-400">/ {totalMaxScore}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-500">คะแนนต่ำสุด</div>
            <div className="text-xl font-bold text-amber-600">
              {classStats.min} <span className="text-xs font-normal text-zinc-400">/ {totalMaxScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gradebook Matrix Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase">
                <th className="py-3 px-3 w-12 text-center">เลขที่</th>
                <th className="py-3 px-4 min-w-[160px]">ชื่อ-สกุล</th>
                {classroom.assignments.map((asn) => (
                  <th key={asn.id} className="py-3 px-3 text-center min-w-[100px]">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1">{asn.title}</div>
                    <div className="text-[10px] text-zinc-400 font-normal">เต็ม {asn.maxScore}</div>
                  </th>
                ))}
                <th className="py-3 px-3 text-center w-24 bg-blue-50/50 dark:bg-blue-950/20 font-bold text-blue-700 dark:text-blue-300">
                  รวม ({totalMaxScore})
                </th>
                <th className="py-3 px-3 text-center w-20 bg-blue-50/50 dark:bg-blue-950/20 font-bold text-blue-700 dark:text-blue-300">
                  ร้อยละ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {studentResults.map((r) => (
                <tr key={r.student.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                  <td className="py-3 px-3 text-center font-bold text-zinc-600 dark:text-zinc-400">
                    {r.student.studentNumber}
                  </td>
                  <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                    {r.student.name}
                  </td>

                  {/* Individual Assignment Scores */}
                  {classroom.assignments.map((asn) => {
                    const item = r.assignmentScores[asn.id];
                    const score = item?.score;
                    const status = item?.status;

                    return (
                      <td key={asn.id} className="py-3 px-3 text-center font-mono">
                        {score !== null && score !== undefined ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-bold ${
                              status === 'SUBMITTED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : status === 'LATE'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : status === 'NOT_SUBMITTED'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            {score}
                          </span>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600">-</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Total score */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-sm bg-blue-50/30 dark:bg-blue-950/10 text-blue-700 dark:text-blue-300">
                    {r.earnedScore}
                  </td>

                  {/* Percentage */}
                  <td className="py-3 px-3 text-center font-bold bg-blue-50/30 dark:bg-blue-950/10">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                        r.percentage >= 80
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : r.percentage >= 50
                          ? 'text-zinc-700 dark:text-zinc-300'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {r.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
