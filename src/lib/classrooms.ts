import { Classroom } from '@/types';

export const DEFAULT_SUBJECTS = ['วิทยาการคำนวณ', 'คอมพิวเตอร์', 'การออกแบบ'];
export function normalizeClassroom(classroom: Classroom): Classroom {
  const legacySubject = classroom.subject?.trim() || classroom.subjects?.[0] || DEFAULT_SUBJECTS[0];
  const assignments = (classroom.assignments || []).map(a => ({ ...a, subject: a.subject?.trim() || legacySubject }));
  const subjects = [...new Set([...(classroom.subjects || []), legacySubject, ...assignments.map(a => a.subject)].map(s => s.trim()).filter(Boolean))];
  return { ...classroom, subject: subjects[0], subjects, assignments };
}
export function sortClassrooms(classrooms: Classroom[]): Classroom[] {
  return classrooms.map(normalizeClassroom).sort((a,b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}
export function classroomForSubject(classroom: Classroom, subject: string): Classroom {
  return { ...classroom, subject, assignments: classroom.assignments.filter(a => a.subject === subject) };
}
export function mergeSubjectClassroom(classroom: Classroom, updated: Classroom, subject: string): Classroom {
  return { ...classroom, submissions: updated.submissions, assignments: [...classroom.assignments.filter(a => a.subject !== subject), ...updated.assignments.map(a => ({ ...a, subject }))] };
}
