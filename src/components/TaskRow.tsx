import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { CheckIcon, CloseIcon, GripIcon } from './Icons';
import { QUADRANTS, type QuadrantId, type Task } from '../lib/types';
import { isOverdue } from '../lib/taskLogic';

interface TaskRowProps {
  task: Task;
  accent: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggle: (id: string) => void;
  onMove: (id: string, quadrant: QuadrantId) => void;
  onReorder: (id: string, direction: -1 | 1) => void;
  onRename: (id: string, title: string) => void;
  onSetDue: (id: string, due?: string) => void;
  onRemove: (id: string) => void;
}

function formatDue(due: string): string {
  const date = new Date(`${due}T12:00:00`);
  if (Number.isNaN(date.getTime())) return due;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function TaskRow({
  task,
  accent,
  canMoveUp,
  canMoveDown,
  onToggle,
  onMove,
  onReorder,
  onRename,
  onSetDue,
  onRemove,
}: TaskRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [dragging, setDragging] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MENU_WIDTH = 232;
  const MENU_HEIGHT = 372;

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    function onScrollOrResize() {
      setMenuOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [menuOpen]);

  /** Fixed positioning keeps the menu clear of panel overflow and viewport edges. */
  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(window.innerWidth - MENU_WIDTH - 8, Math.max(8, rect.right - MENU_WIDTH));
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < MENU_HEIGHT + 16
        ? Math.max(8, Math.min(window.innerHeight - MENU_HEIGHT - 8, rect.top - MENU_HEIGHT - 6))
        : rect.bottom + 6;
    setMenuPos({ top, left });
    setMenuOpen(true);
  }

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commitRename() {
    const next = draft.trim();
    if (next && next !== task.title) onRename(task.id, next);
    else setDraft(task.title);
    setEditing(false);
  }

  const overdue = isOverdue(task);

  return (
    <li
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', task.id);
        event.dataTransfer.effectAllowed = 'move';
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={cn(
        'group relative -mx-3 flex items-start gap-2.5 rounded-field px-3 py-2 transition-colors duration-150 ease-calm hover:bg-canvas',
        dragging && 'task-dragging',
      )}
    >
      <span
        className="mt-[7px] hidden shrink-0 cursor-grab text-faint opacity-40 transition-opacity duration-150 group-hover:opacity-100 [@media(pointer:coarse)]:hidden sm:block"
        aria-hidden="true"
      >
        <GripIcon className="h-3.5 w-3.5" />
      </span>

      <label className="relative -my-2 -ml-2 mt-[-2px] flex cursor-pointer items-center py-2 pl-2 pr-0.5">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggle(task.id)}
          className="sr-only-input"
          aria-label={`Mark "${task.title}" as ${task.done ? 'not done' : 'done'}`}
        />
        <span
          className={cn(
            'flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-all duration-150 ease-calm',
            task.done ? 'border-transparent text-white' : 'border-line-strong bg-surface hover:border-current',
          )}
          style={task.done ? { backgroundColor: accent } : { color: accent }}
        >
          <CheckIcon className={cn('h-3 w-3 transition-opacity', task.done ? 'opacity-100' : 'opacity-0')} />
        </span>
      </label>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitRename();
              if (event.key === 'Escape') {
                setDraft(task.title);
                setEditing(false);
              }
            }}
            className="w-full rounded-[4px] border border-line bg-surface px-1.5 py-0.5 text-[15px] leading-6 outline-none"
            maxLength={240}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(task.title);
              setEditing(true);
            }}
            className={cn(
              'block w-full text-left text-[15px] leading-6 transition-colors duration-150',
              task.done ? 'text-faint line-through' : 'text-ink',
            )}
            title="Rename task"
          >
            {task.title}
          </button>
        )}

        {task.due && !task.done && (
          <span
            className={cn(
              'mt-0.5 inline-flex items-center gap-1 text-[11.5px] tabular-nums',
              overdue ? 'font-medium text-q1' : 'text-faint',
            )}
          >
            {overdue ? 'Overdue' : 'Due'} {formatDue(task.due)}
          </span>
        )}
      </div>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={`Options for "${task.title}"`}
          className="mt-0.5 -mr-1 rounded-[6px] px-2 py-2 text-faint opacity-60 transition hover:bg-surface hover:text-ink hover:opacity-100 focus-visible:opacity-100"
        >
          <span aria-hidden="true" className="block leading-none tracking-[0.1em]">
            ···
          </span>
        </button>

        {menuOpen && menuPos && (
          <div
            role="menu"
            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, width: MENU_WIDTH }}
            className="z-50 overflow-y-auto rounded-control border border-line bg-surface p-1 shadow-[0_18px_40px_-24px_rgba(20,26,23,0.55)]"
          >
            <p className="px-2.5 py-1.5 text-[11px] font-medium text-faint">Move to</p>
            {QUADRANTS.map((quadrant) => (
              <button
                key={quadrant.id}
                type="button"
                role="menuitem"
                disabled={quadrant.id === task.quadrant}
                onClick={() => {
                  onMove(task.id, quadrant.id);
                  setMenuOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-[5px] px-2.5 py-2 text-left text-[13px] transition',
                  quadrant.id === task.quadrant ? 'cursor-default text-faint' : 'text-ink hover:bg-canvas',
                )}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--${quadrant.colorVar})` }}
                  aria-hidden="true"
                />
                <span className="flex-1">{quadrant.name}</span>
                {quadrant.id === task.quadrant && <span className="text-[11px]">current</span>}
              </button>
            ))}

            <div className="my-1 h-px bg-line" />
            <p className="px-2.5 py-1.5 text-[11px] font-medium text-faint">Order in this area</p>
            <div className="flex gap-1 px-1 pb-1">
              <button
                type="button"
                role="menuitem"
                disabled={!canMoveUp}
                onClick={() => {
                  onReorder(task.id, -1);
                  setMenuOpen(false);
                }}
                className="flex-1 rounded-[5px] border border-line px-2 py-1.5 text-[12.5px] text-ink transition hover:bg-canvas disabled:cursor-not-allowed disabled:text-faint disabled:hover:bg-transparent"
              >
                Move up
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!canMoveDown}
                onClick={() => {
                  onReorder(task.id, 1);
                  setMenuOpen(false);
                }}
                className="flex-1 rounded-[5px] border border-line px-2 py-1.5 text-[12.5px] text-ink transition hover:bg-canvas disabled:cursor-not-allowed disabled:text-faint disabled:hover:bg-transparent"
              >
                Move down
              </button>
            </div>

            <div className="my-1 h-px bg-line" />
            <label className="block px-2.5 py-1.5 text-[11px] font-medium text-faint" htmlFor={`due-${task.id}`}>
              Due date
            </label>
            <div className="flex items-center gap-1 px-1 pb-1">
              <input
                id={`due-${task.id}`}
                type="date"
                value={task.due ?? ''}
                onChange={(event) => onSetDue(task.id, event.target.value || undefined)}
                className="min-w-0 flex-1 rounded-[5px] border border-line bg-surface px-2 py-1.5 text-[12.5px] text-ink"
              />
              {task.due && (
                <button
                  type="button"
                  onClick={() => onSetDue(task.id, undefined)}
                  className="shrink-0 rounded-[5px] border border-line px-2 py-1.5 text-[12px] text-soft transition hover:bg-canvas hover:text-ink"
                  aria-label="Clear due date"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="my-1 h-px bg-line" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onRemove(task.id);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-2 text-left text-[13px] text-q1 transition hover:bg-q1t"
            >
              <CloseIcon className="h-3.5 w-3.5" />
              Delete task
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
