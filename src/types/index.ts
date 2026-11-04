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
  subject: string; // e.g. "คณิตศาสตร์พื้นฐาน"
  teacherName: string;
  teacherPin: string; // PIN for teacher (edit/delete)
  repPin: string; // PIN for class rep (check only)
  students: Student[];
  assignments: Assignment[];
  submissions: Record<string, Submission>; // key is `${assignmentId}_${studentId}`
  createdAt: string;
}

export type UserRole = 'GUEST' | 'REP' | 'TEACHER';
