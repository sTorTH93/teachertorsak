export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'LATE' | 'NOT_SUBMITTED';

export interface Student {
  id: string;
  studentNumber: number;
  name: string;
  nickname?: string;
}

export interface Assignment {
  id: string;
  classroomId: string;
  title: string;
  description?: string;
  maxScore: number;
  deadline: string; // ISO string
  createdAt: string;
  subject?: string; // which subject this assignment belongs to
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  score: number | null;
  note?: string;
  checkedBy?: string;
  updatedAt: string;
}

export interface Classroom {
  id: string;
  name: string; // e.g. "ม.4/2"
  subject: string; // legacy single subject (kept for backward compat)
  subjects: string[]; // multiple subjects e.g. ["วิทยาการคำนวณ", "คอมพิวเตอร์", "การออกแบบ"]
  teacherName: string;
  teacherPin: string; // PIN for teacher (edit/delete)
  repPin: string; // PIN for class rep (check only)
  students: Student[];
  assignments: Assignment[];
  submissions: Record<string, Submission>; // key is `${assignmentId}_${studentId}`
  createdAt: string;
  sortOrder?: number; // custom sort order for drag-reorder
}

export type UserRole = 'GUEST' | 'REP' | 'TEACHER';
