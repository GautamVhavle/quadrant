import { describe, expect, it } from 'vitest';
import {
  addTask,
  countTasks,
  completedRecently,
  isOverdue,
  makeTask,
  moveTask,
  parseBoard,
  removeTask,
  renameTask,
  reorderTask,
  serializeBoard,
  setDueDate,
  toggleTask,
  totals,
} from '../src/lib/taskLogic';
import type { Task } from '../src/lib/types';

const NOW = new Date('2026-03-10T09:00:00Z').getTime();

function task(id: string, quadrant: Task['quadrant'] = 'do', done = false, extra: Partial<Task> = {}): Task {
  return {
    id,
    title: `Task ${id}`,
    quadrant,
    done,
    createdAt: NOW,
    ...(done ? { completedAt: NOW } : {}),
    ...extra,
  };
}

describe('addTask', () => {
  it('appends a trimmed task with the chosen quadrant', () => {
    const next = addTask([], '   Book the venue  ', 'schedule', 'new-1', NOW);
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ id: 'new-1', title: 'Book the venue', quadrant: 'schedule', done: false });
  });

  it('ignores whitespace only input', () => {
    expect(addTask([], '   ', 'do', 'x', NOW)).toEqual([]);
  });

  it('clamps very long titles', () => {
    const next = addTask([], 'a'.repeat(400), 'do', 'x', NOW);
    expect(next[0].title).toHaveLength(240);
  });

  it('does not mutate the input array', () => {
    const original: Task[] = [];
    addTask(original, 'One', 'do', 'x', NOW);
    expect(original).toHaveLength(0);
  });
});

describe('toggleTask', () => {
  it('marks done and stamps completedAt', () => {
    const [next] = toggleTask([task('a')], 'a', NOW + 1000);
    expect(next.done).toBe(true);
    expect(next.completedAt).toBe(NOW + 1000);
  });

  it('clears completedAt when reopened', () => {
    const [next] = toggleTask([task('a', 'do', true)], 'a', NOW + 5000);
    expect(next.done).toBe(false);
    expect(next.completedAt).toBeUndefined();
  });

  it('leaves other tasks untouched', () => {
    const next = toggleTask([task('a'), task('b')], 'a');
    expect(next[1]).toEqual(task('b'));
  });
});

describe('moveTask and removeTask', () => {
  it('moves a task to another quadrant', () => {
    const [next] = moveTask([task('a', 'do')], 'a', 'delegate');
    expect(next.quadrant).toBe('delegate');
  });

  it('keeps completion state when moving', () => {
    const [next] = moveTask([task('a', 'do', true)], 'a', 'delete');
    expect(next).toMatchObject({ quadrant: 'delete', done: true });
  });

  it('removes only the target task', () => {
    expect(removeTask([task('a'), task('b')], 'a')).toEqual([task('b')]);
  });
});

describe('renameTask and setDueDate', () => {
  it('renames when the value is meaningful', () => {
    const [next] = renameTask([task('a')], 'a', '  Sharper title ');
    expect(next.title).toBe('Sharper title');
  });

  it('rejects an empty rename', () => {
    expect(renameTask([task('a')], 'a', '   ')[0].title).toBe('Task a');
  });

  it('sets and clears a due date', () => {
    const withDue = setDueDate([task('a')], 'a', '2026-04-01');
    expect(withDue[0].due).toBe('2026-04-01');
    const cleared = setDueDate(withDue, 'a', '');
    expect(cleared[0].due).toBeUndefined();
  });
});

describe('reorderTask', () => {
  const board = [task('a'), task('b'), task('c')];

  it('swaps with the neighbour above', () => {
    const next = reorderTask(board, 'b', -1);
    expect(next.map((item) => item.id)).toEqual(['b', 'a', 'c']);
  });

  it('swaps with the neighbour below', () => {
    const next = reorderTask(board, 'b', 1);
    expect(next.map((item) => item.id)).toEqual(['a', 'c', 'b']);
  });

  it('does nothing at the top boundary', () => {
    expect(reorderTask(board, 'a', -1).map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('does nothing at the bottom boundary', () => {
    expect(reorderTask(board, 'c', 1).map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('does not reorder across quadrants', () => {
    const mixed = [task('a', 'do'), task('b', 'schedule')];
    expect(reorderTask(mixed, 'a', 1).map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('does not reorder across completion state', () => {
    const mixed = [task('a', 'do', false), task('b', 'do', true)];
    expect(reorderTask(mixed, 'a', 1).map((item) => item.id)).toEqual(['a', 'b']);
  });
});

describe('counts and totals', () => {
  const board = [
    task('a', 'do'),
    task('b', 'do', true),
    task('c', 'schedule'),
    task('d', 'delete'),
    task('e', 'delegate', true),
  ];

  it('counts open and done per quadrant', () => {
    const counts = countTasks(board);
    expect(counts.do).toEqual({ open: 1, done: 1 });
    expect(counts.schedule).toEqual({ open: 1, done: 0 });
    expect(counts.delegate).toEqual({ open: 0, done: 1 });
    expect(counts.delete).toEqual({ open: 1, done: 0 });
  });

  it('totals the board', () => {
    expect(totals(board)).toEqual({ open: 3, done: 2 });
  });

  it('returns zeroes for an empty board', () => {
    expect(totals([])).toEqual({ open: 0, done: 0 });
    expect(countTasks([]).do).toEqual({ open: 0, done: 0 });
  });
});

describe('completedRecently', () => {
  it('counts completions inside the last seven days only', () => {
    const board = [
      task('a', 'do', true, { completedAt: NOW - 1000 }),
      task('b', 'schedule', true, { completedAt: NOW - 6 * 24 * 60 * 60 * 1000 }),
      task('c', 'do', true, { completedAt: NOW - 9 * 24 * 60 * 60 * 1000 }),
      task('d', 'do', false),
    ];
    const result = completedRecently(board, NOW);
    expect(result.total).toBe(2);
    expect(result.byQuadrant.do.done).toBe(1);
    expect(result.byQuadrant.schedule.done).toBe(1);
  });

  it('ignores completions with no timestamp', () => {
    const board = [{ ...task('a', 'do', true), completedAt: undefined }];
    expect(completedRecently(board, NOW).total).toBe(0);
  });
});

describe('isOverdue', () => {
  it('flags a past due date on an open task', () => {
    expect(isOverdue(task('a', 'do', false, { due: '2026-03-01' }), new Date('2026-03-10T09:00:00Z'))).toBe(true);
  });

  it('ignores today and future dates', () => {
    expect(isOverdue(task('a', 'do', false, { due: '2026-03-10' }), new Date('2026-03-10T09:00:00Z'))).toBe(false);
    expect(isOverdue(task('a', 'do', false, { due: '2026-04-01' }), new Date('2026-03-10T09:00:00Z'))).toBe(false);
  });

  it('ignores completed tasks and tasks without a date', () => {
    expect(isOverdue(task('a', 'do', true, { due: '2020-01-01' }))).toBe(false);
    expect(isOverdue(task('a', 'do', false))).toBe(false);
  });
});

describe('board serialisation', () => {
  const board = [task('a'), task('b', 'schedule', true)];

  it('round trips through export and import', () => {
    expect(parseBoard(serializeBoard(board))).toEqual(board);
  });

  it('accepts a bare array', () => {
    expect(parseBoard(JSON.stringify(board))).toEqual(board);
  });

  it('rejects invalid JSON', () => {
    expect(parseBoard('not json')).toBeNull();
  });

  it('rejects a payload that is not a list', () => {
    expect(parseBoard(JSON.stringify({ hello: 'world' }))).toBeNull();
  });

  it('rejects entries with an unknown quadrant', () => {
    expect(parseBoard(JSON.stringify([{ ...task('a'), quadrant: 'someday' }]))).toBeNull();
  });

  it('rejects entries missing required fields', () => {
    expect(parseBoard(JSON.stringify([{ id: 'a', title: 'x' }]))).toBeNull();
  });
});

describe('makeTask', () => {
  it('creates a task without a due date by default', () => {
    expect(makeTask('Write it', 'do', 'id-1', NOW)).toMatchObject({ due: undefined, done: false });
  });
});
