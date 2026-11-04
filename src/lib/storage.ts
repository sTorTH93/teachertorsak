import { Classroom, Student, Assignment, Submission, SubmissionStatus } from '@/types';

const STORAGE_KEY = 'classroom_work_checker_data_v1';

export const INITIAL_CLASSROOMS: Classroom[] = [
  {
    id: 'cls-m4-1',
    name: 'ม.4/1',
    subject: 'คณิตศาสตร์เพิ่มเติม (ค31201)',
    teacherName: 'ครูสมชาย ใจดี',
    teacherPin: '1234',
    repPin: '5678',
    createdAt: new Date().toISOString(),
    students: [
      { id: 'std-1', studentNumber: 1, name: 'นายกิตติศักดิ์ เจริญพร', nickname: 'กิต' },
      { id: 'std-2', studentNumber: 2, name: 'นายจิรายุ สมบูรณ์', nickname: 'เจมส์' },
      { id: 'std-3', studentNumber: 3, name: 'นายณัฐพล ศรีสุวรรณ', nickname: 'ณัฐ' },
      { id: 'std-4', studentNumber: 4, name: 'นางสาวธนภรณ์ รัตนวิชัย', nickname: 'พราว' },
      { id: 'std-5', studentNumber: 5, name: 'นางสาวนภัสสร แสงทอง', nickname: 'ฟ้า' },
      { id: 'std-6', studentNumber: 6, name: 'นางสาวปรียาภรณ์ มณีโชติ', nickname: 'ปิ่น' },
      { id: 'std-7', studentNumber: 7, name: 'นายวรเมธ คงสมุทร', nickname: 'นนท์' },
      { id: 'std-8', studentNumber: 8, name: 'นางสาวอภิชญา บุญรักษา', nickname: 'ไอซ์' },
    ],
    assignments: [
      {
        id: 'asn-1',
        classroomId: 'cls-m4-1',
        title: 'ใบงานที่ 1: เซตและสมาชิกของเซต',
        description: 'ทำแบบฝึกหัดท้ายบทที่ 1 ข้อ 1-10 หน้า 18 ลงในสมุด',
        maxScore: 10,
        deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'asn-2',
        classroomId: 'cls-m4-1',
        title: 'การบ้าน: แผนภาพเวนน์-ออยเลอร์',
        description: 'วาดแผนภาพแสดงการดำเนินการของเซต A, B, C',
        maxScore: 15,
        deadline: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago (expired)
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
    ],
    submissions: {
      'asn-1_std-1': {
        id: 'sub-1',
        assignmentId: 'asn-1',
        studentId: 'std-1',
        status: 'SUBMITTED',
        score: 10,
        note: 'งานเรียบร้อยดีมาก',
        checkedBy: 'ครูสมชาย',
        updatedAt: new Date().toISOString(),
      },
      'asn-1_std-2': {
        id: 'sub-2',
        assignmentId: 'asn-1',
        studentId: 'std-2',
        status: 'LATE',
        score: 8,
        note: 'ส่งช้า 15 นาที',
        checkedBy: 'หัวหน้าห้อง',
        updatedAt: new Date().toISOString(),
      },
      'asn-1_std-3': {
        id: 'sub-3',
        assignmentId: 'asn-1',
        studentId: 'std-3',
        status: 'NOT_SUBMITTED',
        score: 0,
        note: 'ลืมเอาสมุดมา',
        checkedBy: 'หัวหน้าห้อง',
        updatedAt: new Date().toISOString(),
      },
    },
  },
];

export function getClassrooms(): Classroom[] {
  if (typeof window === 'undefined') return INITIAL_CLASSROOMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CLASSROOMS));
      return INITIAL_CLASSROOMS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load classrooms from storage', e);
    return INITIAL_CLASSROOMS;
  }
}

export function saveClassrooms(classrooms: Classroom[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classrooms));
  } catch (e) {
    console.error('Failed to save classrooms', e);
  }
}

export function getClassroom(id: string): Classroom | null {
  const classrooms = getClassrooms();
  return classrooms.find((c) => c.id === id) || null;
}

export function saveClassroom(classroom: Classroom) {
  const classrooms = getClassrooms();
  const index = classrooms.findIndex((c) => c.id === classroom.id);
  if (index >= 0) {
    classrooms[index] = classroom;
  } else {
    classrooms.push(classroom);
  }
  saveClassrooms(classrooms);
}

export function deleteClassroom(id: string) {
  const classrooms = getClassrooms();
  const filtered = classrooms.filter((c) => c.id !== id);
  saveClassrooms(filtered);
}
