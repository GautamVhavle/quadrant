import { isQuadrantId, type Task } from './types';
import { parseBoard, serializeBoard } from './taskLogic';

const TASKS_KEY = 'quadrant.tasks.v1';
const THEME_KEY = 'quadrant.theme.v1';
const FOCUS_KEY = 'quadrant.focus.v1';

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

/** Downloads the board as JSON so it can move between browsers or machines. */
export function exportBoard(tasks: Task[]): void {
  const blob = new Blob([serializeBoard(tasks)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `quadrant-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function readBoardFile(file: File): Promise<Task[] | null> {
  return parseBoard(await file.text());
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

export function loadFocus(): boolean {
  try {
    return localStorage.getItem(FOCUS_KEY) === 'on';
  } catch {
    return false;
  }
}

export function saveFocus(on: boolean): void {
  try {
    localStorage.setItem(FOCUS_KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}
