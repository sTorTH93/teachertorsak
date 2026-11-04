import { Classroom } from '@/types';
import { normalizeClassroom, sortClassrooms } from './classrooms';
import { getSupabase } from './supabase';

const STORAGE_KEY = 'classroom_work_checker_data_v1';

export const INITIAL_CLASSROOMS: Classroom[] = [
  {
    id: 'cls-m4-1',
    name: 'ม.4/1',
    subject: 'คณิตศาสตร์เพิ่มเติม (ค31201)',
    subjects: ['คณิตศาสตร์เพิ่มเติม (ค31201)'],
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
        deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'asn-2',
        classroomId: 'cls-m4-1',
        title: 'การบ้าน: แผนภาพเวนน์-ออยเลอร์',
        description: 'วาดแผนภาพแสดงการดำเนินการของเซต A, B, C',
        maxScore: 15,
        deadline: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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

// In-memory callbacks for real-time sync across components
type SyncCallback = (classrooms: Classroom[]) => void;
const listeners = new Set<SyncCallback>();
let pendingCloudWrites = 0;
let localRevision = 0;

export function subscribeToClassrooms(callback: SyncCallback): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners(classrooms: Classroom[]) {
  listeners.forEach((fn) => {
    try {
      fn(classrooms);
    } catch (e) {
      console.error('Error notifying listener:', e);
    }
  });
}

// 1. Synchronous get from local cache
export function getClassrooms(): Classroom[] {
  if (typeof window === 'undefined') return sortClassrooms(INITIAL_CLASSROOMS);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CLASSROOMS));
      return sortClassrooms(INITIAL_CLASSROOMS);
    }
    return sortClassrooms(JSON.parse(raw));
  } catch (e) {
    console.error('Failed to load classrooms from storage', e);
    return sortClassrooms(INITIAL_CLASSROOMS);
  }
}

export function getClassroom(id: string): Classroom | null {
  const classrooms = getClassrooms();
  return classrooms.find((c) => c.id === id) || null;
}

// 2. Save locally
export function saveClassrooms(classrooms: Classroom[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sortClassrooms(classrooms)));
    notifyListeners(sortClassrooms(classrooms));
  } catch (e) {
    console.error('Failed to save classrooms to localStorage', e);
  }
}

// 3. Online Fetch from Supabase
export async function syncFromCloud(): Promise<Classroom[] | null> {
  const supabase = getSupabase();
  if (!supabase || pendingCloudWrites > 0) return null;
  const revision = localRevision;

  try {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return null;
    }

    if (pendingCloudWrites > 0 || revision !== localRevision) return null;
    if (data && data.length > 0) {
      const parsed: Classroom[] = data.map((row) => {
        const extraData = typeof row.data === 'object' ? row.data : {};
        return {
          id: row.id,
          name: row.name,
          subject: row.subject,
          subjects: extraData.subjects,
          sortOrder: extraData.sortOrder,
          teacherName: row.teacher_name,
          teacherPin: row.teacher_pin || '1234',
          repPin: row.rep_pin || '5678',
          createdAt: row.created_at || new Date().toISOString(),
          students: extraData.students || [],
          assignments: extraData.assignments || [],
          submissions: extraData.submissions || {},
        };
      });

      const sorted = sortClassrooms(parsed);
      saveClassrooms(sorted);
      return sorted;
    } else {
      // Cloud is empty, seed it with current local classrooms
      const local = getClassrooms();
      for (const cls of local) {
        await saveClassroomToCloud(cls);
      }
      return local;
    }
  } catch (e) {
    console.error('Failed to sync from cloud:', e);
    return null;
  }
}

// 4. Save single classroom (Local + Cloud)
export function saveClassroom(classroom: Classroom) {
  localRevision++;
  classroom = normalizeClassroom(classroom);
  const classrooms = getClassrooms();
  const index = classrooms.findIndex((c) => c.id === classroom.id);
  if (index >= 0) {
    classrooms[index] = classroom;
  } else {
    classrooms.push(classroom);
  }
  saveClassrooms(classrooms);

  // Background sync to cloud
  saveClassroomToCloud(classroom).catch((err) =>
    console.warn('Background cloud save failed:', err)
  );
}

// 5. Cloud Upsert
function cloudPayload(classroom: Classroom) {
  classroom = normalizeClassroom(classroom);
  return {
    id: classroom.id, name: classroom.name, subject: classroom.subject,
    teacher_name: classroom.teacherName, teacher_pin: classroom.teacherPin, rep_pin: classroom.repPin,
    data: { subjects: classroom.subjects, sortOrder: classroom.sortOrder, students: classroom.students, assignments: classroom.assignments, submissions: classroom.submissions },
    updated_at: new Date().toISOString(),
  };
}

export async function saveClassroomToCloud(classroom: Classroom) {
  const supabase = getSupabase();
  if (!supabase) return;

  pendingCloudWrites++;
  try {
    const { error } = await supabase.from('classrooms').upsert(cloudPayload(classroom));
    if (error) throw new Error(error.message);
  } finally { pendingCloudWrites--; }
}

// 6. Delete classroom (Local + Cloud)
export function deleteClassroom(id: string) {
  const classrooms = getClassrooms();
  const filtered = classrooms.filter((c) => c.id !== id);
  saveClassrooms(filtered);

  // Background delete on cloud
  const supabase = getSupabase();
  if (supabase) {
    supabase.from('classrooms').delete().eq('id', id).then();
  }
}

// 7. Setup Realtime Listener
export function setupRealtimeSync(): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel('public:classrooms')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'classrooms' },
      () => {
        // When any change happens in Supabase, refetch immediately
        syncFromCloud();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// One atomic upsert prevents realtime readers from observing a half-reordered list.
export async function reorderClassrooms(ids: string[]): Promise<void> {
  const current = getClassrooms();
  if (ids.length !== current.length || new Set(ids).size !== current.length || ids.some(id => !current.some(c => c.id === id))) throw new Error('รายการห้องเรียนเปลี่ยนไป กรุณาลองใหม่');
  const ordered = ids.map((id, sortOrder) => ({ ...current.find(c => c.id === id)!, sortOrder }));
  localRevision++;
  saveClassrooms(ordered);
  const supabase = getSupabase();
  if (!supabase) throw new Error('ยังไม่ได้ตั้งค่า Supabase');
  pendingCloudWrites++;
  try {
    const { error } = await supabase.from('classrooms').upsert(ordered.map(cloudPayload));
    if (error) throw new Error(error.message);
  } finally { pendingCloudWrites--; }
}
