'use client';
import { useState } from 'react';
import { DEFAULT_SUBJECTS } from '@/lib/classrooms';

export default function SubjectsEditor({ value, onChange, locked = [] }: { value: string[]; onChange: (value: string[]) => void; locked?: string[] }) {
  const [custom, setCustom] = useState('');
  const options = [...new Set([...DEFAULT_SUBJECTS, ...value])];
  const add = () => {
    const subject = custom.trim();
    if (subject) { onChange([...new Set([...value, subject])]); setCustom(''); }
  };
  return <fieldset className="space-y-2">
    <legend className="text-xs font-semibold mb-2">รายวิชา (เลือกได้หลายวิชา) *</legend>
    <div className="flex flex-wrap gap-2">{options.map(subject => <label key={subject} className="flex items-center gap-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2">
      <input type="checkbox" checked={value.includes(subject)} disabled={locked.includes(subject)} onChange={e => onChange(e.target.checked ? [...value, subject] : value.filter(s => s !== subject))} />{subject}
    </label>)}</div>
    <div className="flex gap-2"><input aria-label="ชื่อวิชาใหม่" value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="พิมพ์ชื่อวิชาเพิ่มเติม" className="min-w-0 flex-1 px-3 py-2 text-sm border rounded-xl bg-white dark:bg-zinc-800" /><button type="button" onClick={add} disabled={!custom.trim()} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs disabled:opacity-40">เพิ่มวิชา</button></div>
    {locked.length > 0 && <p className="text-xs text-zinc-500">วิชาที่มีงานอยู่จะนำออกได้หลังลบงานในวิชานั้นแล้ว</p>}
  </fieldset>;
}
