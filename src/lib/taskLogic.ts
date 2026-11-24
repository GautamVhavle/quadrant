import { isQuadrantId, type QuadrantId, type Task } from './types';

export const MAX_TITLE = 240;

export type Counts = Record<QuadrantId, { open: number; done: number }>;

function emptyCounts(): Counts {
  return {
    do: { open: 0, done: 0 },
    schedule: { open: 0, done: 0 },
    delegate: { open: 0, done: 0 },
    delete: { open: 0, done: 0 },
  };
}

export function makeTask(
  title: string,
  quadrant: QuadrantId,
  id: string,
  now = Date.now(),
  due?: string,
): Task {
  return { id, title: title.trim().slice(0, MAX_TITLE), quadrant, done: false, createdAt: now, due };
}

export function addTask(tasks: Task[], title: string, quadrant: QuadrantId, id: string, now = Date.now()): Task[] {
  if (!title.trim()) return tasks;
  return [...tasks, makeTask(title, quadrant, id, now)];
}

export function toggleTask(tasks: Task[], id: string, now = Date.now()): Task[] {
  return tasks.map((task) =>
    task.id === id ? { ...task, done: !task.done, completedAt: task.done ? undefined : now } : task,
  );
}

export function moveTask(tasks: Task[], id: string, quadrant: QuadrantId): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, quadrant } : task));
}

export function renameTask(tasks: Task[], id: string, title: string): Task[] {
  const next = title.trim();
  if (!next) return tasks;
  return tasks.map((task) => (task.id === id ? { ...task, title: next.slice(0, MAX_TITLE) } : task));
}

export function setDueDate(tasks: Task[], id: string, due?: string): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, due: due || undefined } : task));
}

export function removeTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((task) => task.id !== id);
}

/** Swaps a task with its visible neighbour inside the same quadrant and completion state. */
export function reorderTask(tasks: Task[], id: string, direction: -1 | 1): Task[] {
  const target = tasks.find((task) => task.id === id);
  if (!target) return tasks;

  const siblings = tasks.filter((task) => task.quadrant === target.quadrant && task.done === target.done);
  const position = siblings.findIndex((task) => task.id === id);
  const neighbour = siblings[position + direction];
  if (!neighbour) return tasks;

  const a = tasks.findIndex((task) => task.id === id);
  const b = tasks.findIndex((task) => task.id === neighbour.id);
  const next = [...tasks];
  next[a] = tasks[b];
  next[b] = tasks[a];
  return next;
}

export function countTasks(tasks: Task[]): Counts {
  const counts = emptyCounts();
  for (const task of tasks) {
    if (task.done) counts[task.quadrant].done += 1;
    else counts[task.quadrant].open += 1;
  }
  return counts;
}

export function totals(tasks: Task[]): { open: number; done: number } {
  let open = 0;
  let done = 0;
  for (const task of tasks) {
    if (task.done) done += 1;
    else open += 1;
  }
  return { open, done };
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function completedRecently(tasks: Task[], now = Date.now()): { total: number; byQuadrant: Counts } {
  const byQuadrant = emptyCounts();
  let total = 0;
  for (const task of tasks) {
    if (!task.done || !task.completedAt) continue;
    if (now - task.completedAt > WEEK_MS) continue;
    total += 1;
    byQuadrant[task.quadrant].done += 1;
  }
  return { total, byQuadrant };
}

export function isOverdue(task: Task, today = new Date()): boolean {
  if (!task.due || task.done) return false;
  const due = new Date(`${task.due}T23:59:59`);
  return due.getTime() < today.getTime();
}

function isValidTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.quadrant === 'string' &&
    isQuadrantId(candidate.quadrant) &&
    typeof candidate.done === 'boolean' &&
    typeof candidate.createdAt === 'number' &&
    (candidate.due === undefined || typeof candidate.due === 'string') &&
    (candidate.completedAt === undefined || typeof candidate.completedAt === 'number')
  );
}

export function parseBoard(raw: string): Task[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : (parsed as { tasks?: unknown })?.tasks;
    if (!Array.isArray(list)) return null;
    const tasks = list.filter(isValidTask);
    return tasks.length === list.length ? tasks : null;
  } catch {
    return null;
  }
}

export function serializeBoard(tasks: Task[]): string {
  return JSON.stringify({ app: 'quadrant', version: 1, exportedAt: new Date().toISOString(), tasks }, null, 2);
}
