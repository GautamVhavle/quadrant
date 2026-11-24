import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadTasks, saveTasks } from './storage';
import { uid } from './utils';
import * as logic from './taskLogic';
import type { QuadrantId, Task } from './types';

export interface TaskStore {
  tasks: Task[];
  add: (title: string, quadrant: QuadrantId) => void;
  toggle: (id: string) => void;
  move: (id: string, quadrant: QuadrantId) => void;
  reorder: (id: string, direction: -1 | 1) => void;
  rename: (id: string, title: string) => void;
  setDue: (id: string, due?: string) => void;
  remove: (id: string) => void;
  restore: (tasks: Task[]) => void;
  clearDone: () => Task[];
  replaceAll: (tasks: Task[]) => void;
  counts: logic.Counts;
  total: { open: number; done: number };
}

export function useTasks(): TaskStore {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const add = useCallback((title: string, quadrant: QuadrantId) => {
    setTasks((prev) => logic.addTask(prev, title, quadrant, uid()));
  }, []);

  const toggle = useCallback((id: string) => {
    setTasks((prev) => logic.toggleTask(prev, id));
  }, []);

  const move = useCallback((id: string, quadrant: QuadrantId) => {
    setTasks((prev) => logic.moveTask(prev, id, quadrant));
  }, []);

  const reorder = useCallback((id: string, direction: -1 | 1) => {
    setTasks((prev) => logic.reorderTask(prev, id, direction));
  }, []);

  const rename = useCallback((id: string, title: string) => {
    setTasks((prev) => logic.renameTask(prev, id, title));
  }, []);

  const setDue = useCallback((id: string, due?: string) => {
    setTasks((prev) => logic.setDueDate(prev, id, due));
  }, []);

  const remove = useCallback((id: string) => {
    setTasks((prev) => logic.removeTask(prev, id));
  }, []);

  const restore = useCallback((restored: Task[]) => {
    setTasks((prev) => {
      const known = new Set(prev.map((task) => task.id));
      const additions = restored.filter((task) => !known.has(task.id));
      return additions.length ? [...additions, ...prev] : prev;
    });
  }, []);

  const clearDone = useCallback((): Task[] => {
    const removed = tasks.filter((task) => task.done);
    if (removed.length) setTasks((prev) => prev.filter((task) => !task.done));
    return removed;
  }, [tasks]);

  const replaceAll = useCallback((next: Task[]) => {
    setTasks(next);
  }, []);

  const counts = useMemo(() => logic.countTasks(tasks), [tasks]);
  const total = useMemo(() => logic.totals(tasks), [tasks]);

  return {
    tasks,
    add,
    toggle,
    move,
    reorder,
    rename,
    setDue,
    remove,
    restore,
    clearDone,
    replaceAll,
    counts,
    total,
  };
}
