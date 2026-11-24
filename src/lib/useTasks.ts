import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadTasks, saveTasks } from './storage';
import { uid } from './utils';
import type { QuadrantId, Task } from './types';

export interface TaskStore {
  tasks: Task[];
  add: (title: string, quadrant: QuadrantId) => void;
  toggle: (id: string) => void;
  move: (id: string, quadrant: QuadrantId) => void;
  rename: (id: string, title: string) => void;
  remove: (id: string) => void;
  restore: (task: Task) => void;
  clearDone: () => void;
  counts: Record<QuadrantId, { open: number; done: number }>;
  total: { open: number; done: number };
}

export function useTasks(): TaskStore {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const add = useCallback((title: string, quadrant: QuadrantId) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTasks((prev) => [
      ...prev,
      {
        id: uid(),
        title: trimmed.slice(0, 240),
        quadrant,
        done: false,
        createdAt: Date.now(),
      },
    ]);
  }, []);

  const toggle = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, done: !task.done, completedAt: task.done ? undefined : Date.now() }
          : task,
      ),
    );
  }, []);

  const move = useCallback((id: string, quadrant: QuadrantId) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, quadrant } : task)));
  }, []);

  const rename = useCallback((id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, title: trimmed.slice(0, 240) } : task)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const restore = useCallback((task: Task) => {
    setTasks((prev) => (prev.some((existing) => existing.id === task.id) ? prev : [...prev, task]));
  }, []);

  const clearDone = useCallback(() => {
    setTasks((prev) => prev.filter((task) => !task.done));
  }, []);

  const counts = useMemo(() => {
    const base: Record<QuadrantId, { open: number; done: number }> = {
      do: { open: 0, done: 0 },
      schedule: { open: 0, done: 0 },
      delegate: { open: 0, done: 0 },
      delete: { open: 0, done: 0 },
    };
    for (const task of tasks) {
      if (task.done) base[task.quadrant].done += 1;
      else base[task.quadrant].open += 1;
    }
    return base;
  }, [tasks]);

  const total = useMemo(() => {
    let open = 0;
    let done = 0;
    for (const task of tasks) {
      if (task.done) done += 1;
      else open += 1;
    }
    return { open, done };
  }, [tasks]);

  return { tasks, add, toggle, move, rename, remove, restore, clearDone, counts, total };
}
