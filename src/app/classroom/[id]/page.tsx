'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Users,
  Settings,
  ShieldCheck,
  KeyRound,
  GraduationCap,
  Sparkles,
  Edit,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import AssignmentCheckerView from '@/components/AssignmentCheckerView';
import AssignmentsManagerView from '@/components/AssignmentsManagerView';
import GradebookReportView from '@/components/GradebookReportView';
import StudentsManagerView from '@/components/StudentsManagerView';
import PinAuthModal from '@/components/PinAuthModal';
import EditClassroomModal from '@/components/EditClassroomModal';
import { Classroom } from '@/types';
import {
  getClassroom,
  saveClassroom,
  syncFromCloud,
  subscribeToClassrooms,
  setupRealtimeSync,
} from '@/lib/storage';

export default function ClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params?.id as string;

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [activeTab, setActiveTab] = useState<'CHECK' | 'ASSIGNMENTS' | 'GRADEBOOK' | 'STUDENTS'>('CHECK');
  const [userRole, setUserRole] = useState<'TEACHER' | 'REP' | 'GUEST'>('TEACHER');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);

  useEffect(() => {
    if (!classroomId) return;
    const initial = getClassroom(classroomId);
    if (initial) {
      setClassroom(initial);
    }

    // 1. Fetch latest from cloud
    syncFromCloud().then(() => {
      const updated = getClassroom(classroomId);
      if (updated) {
        setClassroom(updated);
      }
    });

    // 2. Subscribe to local state changes
    const unsubscribeLocal = subscribeToClassrooms((classrooms) => {
      const match = classrooms.find((c) => c.id === classroomId);
      if (match) {
        setClassroom(match);
      }
    });

    // 3. Realtime Supabase changes
    const unsubscribeCloud = setupRealtimeSync();

    return () => {
      unsubscribeLocal();
      unsubscribeCloud();
    };
  }, [classroomId]);

  const handleUpdateClassroom = (updated: Classroom) => {
    setClassroom(updated);
    saveClassroom(updated);
  };

  const handleOpenEditClassModal = () => {
    if (userRole !== 'TEACHER') {
      alert('เฉพาะคุณครูเท่านั้นที่สามารถแก้ไขข้อมูลห้องเรียนได้');
      setShowPinModal(true);
      return;
    }
    setShowEditClassModal(true);
  };

  if (!classroom) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-zinc-500">กำลังโหลดห้องเรียน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <Navbar currentClassroomName={`${classroom.name} (${classroom.subject})`} role={userRole} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Navigation Breadcrumb & Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 shadow-sm"
              title="กลับหน้าหลัก"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  ห้อง {classroom.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-semibold">
                  {classroom.subject}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                <span>ครูผู้สอน: <strong className="text-zinc-700 dark:text-zinc-300">{classroom.teacherName}</strong></span>
                <span>•</span>
                <span>นักเรียน {classroom.students.length} คน</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenEditClassModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 shadow-sm"
              title="แก้ไขชื่อห้อง วิชา ครู และ PIN"
            >
              <Edit className="w-3.5 h-3.5 text-blue-600" />
              <span>แก้ไขข้อมูลห้องเรียน</span>
            </button>

            <button
              onClick={() => setShowPinModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>เปลี่ยนสิทธิ์ (ครู / ตัวแทน)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('CHECK')}
            className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'CHECK'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>เช็คงานในคาบเรียน</span>
          </button>

          <button
            onClick={() => setActiveTab('GRADEBOOK')}
            className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'GRADEBOOK'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>สมุดคะแนนรวม (Gradebook)</span>
          </button>

          <button
            onClick={() => setActiveTab('ASSIGNMENTS')}
            className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'ASSIGNMENTS'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>จัดการงาน ({classroom.assignments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('STUDENTS')}
            className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'STUDENTS'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>จัดการรายชื่อนักเรียน ({classroom.students.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'CHECK' && (
          <AssignmentCheckerView
            classroom={classroom}
            onUpdateClassroom={handleUpdateClassroom}
            userRole={userRole}
          />
        )}

        {activeTab === 'GRADEBOOK' && <GradebookReportView classroom={classroom} />}

        {activeTab === 'ASSIGNMENTS' && (
          <AssignmentsManagerView
            classroom={classroom}
            onUpdateClassroom={handleUpdateClassroom}
            userRole={userRole}
          />
        )}

        {activeTab === 'STUDENTS' && (
          <StudentsManagerView
            classroom={classroom}
            onUpdateClassroom={handleUpdateClassroom}
            userRole={userRole}
          />
        )}
      </main>

      {/* Role Change Modal */}
      <PinAuthModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        classroom={classroom}
        onSuccess={(role) => setUserRole(role)}
      />

      {/* Edit Classroom Modal */}
      <EditClassroomModal
        isOpen={showEditClassModal}
        onClose={() => setShowEditClassModal(false)}
        classroom={classroom}
        onSave={handleUpdateClassroom}
      />
    </div>
  );
}
