const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => { if (!(name in dependencies)) throw Error(name); return dependencies[name]; }, console, ...globals });
  return exports;
}
const model = load('src/lib/classrooms.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const base = { id: 'a', name: 'A', subject: 'เดิม', teacherName: 'ครู', teacherPin: '1', repPin: '2', createdAt: '2026-01-01', students: [], assignments: [{ id: 'old', maxScore: 10 }], submissions: { old_s: { score: 8 } } };
test('legacy assignments and scores survive normalization and subject changes', () => {
  const c = model.normalizeClassroom({ ...base, subjects: ['เดิม', 'ใหม่'], assignments: [...base.assignments, { id: 'new', subject: 'ใหม่', maxScore: 20 }] });
  assert.deepEqual(plain(c.subjects), ['เดิม', 'ใหม่']);
  assert.equal(c.assignments[0].subject, 'เดิม');
  const view = model.classroomForSubject(c, 'ใหม่');
  assert.deepEqual(plain(view.assignments.map(a => a.id)), ['new']);
  assert.equal(view.assignments.reduce((n,a) => n + a.maxScore, 0), 20);
  const added = model.mergeSubjectClassroom(c, { ...view, assignments: [...view.assignments, { id: 'added' }] }, 'ใหม่');
  assert.equal(added.assignments.length, 3);
  assert.equal(added.assignments.find(a => a.id === 'added').subject, 'ใหม่');
  const deleted = model.mergeSubjectClassroom(added, { ...view, assignments: [] }, 'ใหม่');
  assert.deepEqual(plain(deleted.assignments.map(a => a.id)), ['old']);
  assert.equal(deleted.submissions.old_s.score, 8);
  assert.ok(model.normalizeClassroom({ ...c, subjects: ['ใหม่'], subject: 'ใหม่' }).subjects.includes('เดิม'));
});
test('reorder survives local reload and cloud roundtrip; failed saves remain retryable', async () => {
  const cache = new Map(); let rows = []; let fail = false; let writes = 0;
  const client = { from: () => ({
    upsert: async payload => { writes++; if(fail) return { error: { message: 'offline' } }; rows = (Array.isArray(payload) ? payload : [payload]).map(plain); return { error: null }; },
    select: () => ({ order: async () => ({ data: rows, error: null }) })
  }) };
  const storage = load('src/lib/storage.ts', { './classrooms': model, './supabase': { getSupabase: () => client } }, { window: {}, localStorage: { getItem: k => cache.get(k), setItem: (k,v) => cache.set(k,v) } });
  storage.saveClassrooms([model.normalizeClassroom(base), model.normalizeClassroom({ ...base, id: 'b', subjects: ['เดิม','ใหม่'] })]);
  await storage.reorderClassrooms(['b','a']);
  assert.equal(writes, 1);
  assert.deepEqual(plain(storage.getClassrooms().map(c => c.id)), ['b','a']);
  assert.equal(rows[0].data.sortOrder, 0);
  assert.deepEqual(rows[0].data.subjects, ['เดิม','ใหม่']);
  cache.clear(); rows.reverse();
  assert.deepEqual(plain((await storage.syncFromCloud()).map(c => c.id)), ['b','a']);
  assert.equal(storage.getClassrooms()[0].assignments[0].subject, 'เดิม');
  fail = true;
  await assert.rejects(storage.reorderClassrooms(['a','b']), /offline/);
  assert.deepEqual(plain(storage.getClassrooms().map(c => c.id)), ['a','b']);
  fail = false;
  await storage.reorderClassrooms(storage.getClassrooms().map(c => c.id));
  assert.equal(rows[0].id, 'a');
  await assert.rejects(storage.reorderClassrooms(['a','a']));
});
