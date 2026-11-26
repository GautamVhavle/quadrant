import { describe, expect, it } from 'vitest';
import { addTask, makeTask, parseBoard, serializeBoard, MAX_NOTES } from '../lib/taskLogic';

const NOW = 1_700_000_000_000;

describe('task details captured in the add dialog', () => {
  it('keeps a note and a due date', () => {
    const [task] = addTask([], 'Send the proposal', 'do', 'id-1', NOW, {
      notes: ' Meera wants the numbers first ',
      due: '2026-12-01',
    });

    expect(task).toMatchObject({
      title: 'Send the proposal',
      quadrant: 'do',
      notes: 'Meera wants the numbers first',
      due: '2026-12-01',
    });
  });

  it('treats a blank note as no note', () => {
    const [task] = addTask([], 'Send the proposal', 'do', 'id-1', NOW, { notes: '   ', due: '' });
    expect(task.notes).toBeUndefined();
    expect(task.due).toBeUndefined();
  });

  it('keeps the note short enough to read in a row', () => {
    const [task] = addTask([], 'T', 'do', 'id-1', NOW, { notes: 'n'.repeat(MAX_NOTES + 200) });
    expect(task.notes).toHaveLength(MAX_NOTES);
  });

  it('still works with no details at all', () => {
    expect(makeTask('Write it', 'do', 'id-1', NOW)).toMatchObject({ due: undefined, notes: undefined });
  });

  it('round trips through export and import', () => {
    const tasks = addTask([], 'Draft the plan', 'schedule', 'id-1', NOW, {
      notes: 'Two pages, no appendix',
      due: '2026-11-30',
    });

    const parsed = parseBoard(serializeBoard(tasks));
    expect(parsed?.[0]).toMatchObject({ notes: 'Two pages, no appendix', due: '2026-11-30' });
  });

  it('imports an older board that has no notes field', () => {
    const legacy = JSON.stringify({
      app: 'quadrant',
      version: 1,
      tasks: [{ id: 'a', title: 'Old task', quadrant: 'do', done: false, createdAt: NOW }],
    });

    const parsed = parseBoard(legacy);
    expect(parsed?.[0].title).toBe('Old task');
    expect(parsed?.[0].notes).toBeUndefined();
  });

  it('rejects a board whose notes field is not text', () => {
    const broken = JSON.stringify({
      tasks: [{ id: 'a', title: 'Bad', quadrant: 'do', done: false, createdAt: NOW, notes: 42 }],
    });

    expect(parseBoard(broken)).toBeNull();
  });
});
