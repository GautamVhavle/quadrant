'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckIcon, CloseIcon, GripIcon } from './Icons';
import { QUADRANTS, type QuadrantId, type Task } from '@/lib/types';
import { isOverdue } from '@/lib/taskLogic';

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

const MENU_WIDTH = 244;
const MENU_HEIGHT = 404;

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
  const reduce = useReducedMotion();

  /** Fixed positioning keeps the menu clear of panel overflow and viewport edges. */
  const place = useCallback(() => {
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
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    function reposition() {
      place();
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [menuOpen, place]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function openMenu() {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    place();
  }

  function commitRename() {
    const next = draft.trim();
    if (next && next !== task.title) onRename(task.id, next);
    else setDraft(task.title);
    setEditing(false);
  }

  const overdue = isOverdue(task);

  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0 }}
      transition={{ type: 'spring', stiffness: 480, damping: 40 }}
      draggable
      onDragStart={(event) => {
        const drag = event as unknown as DragEvent;
        drag.dataTransfer?.setData('text/plain', task.id);
        if (drag.dataTransfer) drag.dataTransfer.effectAllowed = 'move';
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={cn(
        'group relative flex items-start gap-2 rounded-[14px] px-2 py-2 transition-colors duration-200 ease-calm hover:bg-white/45 dark:hover:bg-white/5',
        dragging && 'opacity-40',
      )}
    >
      <span
        className="mt-[9px] hidden shrink-0 cursor-grab text-faint opacity-30 transition-opacity duration-200 group-hover:opacity-90 lg:block"
        aria-hidden="true"
      >
        <GripIcon className="h-4 w-4" />
      </span>

      <label className="relative -my-2 flex cursor-pointer items-center py-2 pl-0.5 pr-1">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggle(task.id)}
          className="sr-only-input"
          aria-label={`Mark "${task.title}" as ${task.done ? 'not done' : 'done'}`}
        />
        <span
          className={cn(
            'flex h-[20px] w-[20px] items-center justify-center rounded-[7px] border transition-all duration-200 ease-calm',
            task.done ? 'border-transparent text-white' : 'border-[color:var(--line)] bg-white/60 dark:bg-white/10',
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
            className="w-full rounded-[10px] border border-[color:var(--line)] bg-white/70 px-2 py-1 text-[15px] leading-6 outline-none dark:bg-white/10"
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
              'mt-1 inline-flex items-center gap-1 text-[11.5px] tabular-nums',
              overdue ? 'font-medium' : 'text-faint',
            )}
            style={overdue ? { color: accent } : undefined}
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
          className="flex h-10 w-10 items-center justify-center rounded-[10px] text-faint transition hover:bg-white/60 hover:text-ink dark:hover:bg-white/10"
        >
          <span aria-hidden="true" className="block leading-none tracking-[0.1em]">
            ···
          </span>
        </button>

        {menuOpen && menuPos && (
          <div
            role="menu"
            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, width: MENU_WIDTH }}
            className="glass-strong thin-scroll z-[70] max-h-[70vh] overflow-y-auto rounded-glass p-1.5 text-[13px]"
          >
            <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">Move to</p>
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
                  'flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition',
                  quadrant.id === task.quadrant ? 'cursor-default text-faint' : 'text-ink hover:bg-white/60 dark:hover:bg-white/10',
                )}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--${quadrant.colorVar})` }}
                  aria-hidden="true"
                />
                <span className="flex-1">{quadrant.name}</span>
                {quadrant.id === task.quadrant && <span className="text-[11px]">here</span>}
              </button>
            ))}

            <div className="my-1.5 h-px bg-[color:var(--line)]" />
            <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">Order</p>
            <div className="flex gap-1.5 px-1 pb-1">
              <button
                type="button"
                role="menuitem"
                disabled={!canMoveUp}
                onClick={() => {
                  onReorder(task.id, -1);
                  setMenuOpen(false);
                }}
                className="flex-1 rounded-[10px] border border-[color:var(--line)] px-2 py-2 text-[12.5px] text-ink transition hover:bg-white/60 disabled:cursor-not-allowed disabled:text-faint dark:hover:bg-white/10"
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
                className="flex-1 rounded-[10px] border border-[color:var(--line)] px-2 py-2 text-[12.5px] text-ink transition hover:bg-white/60 disabled:cursor-not-allowed disabled:text-faint dark:hover:bg-white/10"
              >
                Move down
              </button>
            </div>

            <div className="my-1.5 h-px bg-[color:var(--line)]" />
            <label
              className="block px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint"
              htmlFor={`due-${task.id}`}
            >
              Due date
            </label>
            <div className="flex items-center gap-1.5 px-1 pb-1">
              <input
                id={`due-${task.id}`}
                type="date"
                value={task.due ?? ''}
                onChange={(event) => onSetDue(task.id, event.target.value || undefined)}
                className="min-w-0 flex-1 rounded-[10px] border border-[color:var(--line)] bg-white/70 px-2 py-2 text-[12.5px] text-ink dark:bg-white/10"
              />
              {task.due && (
                <button
                  type="button"
                  onClick={() => onSetDue(task.id, undefined)}
                  className="shrink-0 rounded-[10px] border border-[color:var(--line)] px-2 py-2 text-[12px] text-soft transition hover:bg-white/60 hover:text-ink dark:hover:bg-white/10"
                  aria-label="Clear due date"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="my-1.5 h-px bg-[color:var(--line)]" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onRemove(task.id);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-q1 transition hover:bg-q1t"
            >
              <CloseIcon className="h-3.5 w-3.5" />
              Delete task
            </button>
          </div>
        )}
      </div>
    </motion.li>
  );
}
