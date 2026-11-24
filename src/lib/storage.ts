import { isQuadrantId, type Task } from './types';

const TASKS_KEY = 'quadrant.tasks.v1';
const THEME_KEY = 'quadrant.theme.v1';

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.quadrant === 'string' &&
    isQuadrantId(candidate.quadrant) &&
    typeof candidate.done === 'boolean' &&
    typeof candidate.createdAt === 'number'
  );
}

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTask);
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {
    /* storage may be unavailable in private mode; the session still works */
  }
}

export type ThemeChoice = 'system' | 'light' | 'dark';

export function loadTheme(): ThemeChoice {
  try {
    const value = localStorage.getItem(THEME_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    /* ignore */
  }
  return 'system';
}

export function saveTheme(theme: ThemeChoice): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function applyTheme(theme: ThemeChoice): void {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}
