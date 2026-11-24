import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { CheckIcon, CloseIcon, GripIcon } from './Icons';
import { QUADRANTS, type QuadrantId, type Task } from '../lib/types';

interface TaskRowProps {
  task: Task;
  accent: string;
  onToggle: (id: string) => void;
  onMove: (id: string, quadrant: QuadrantId) => void;
  onRename: (id: string, title: string) => void;
  onRemove: (id: string) => void;
}

export function TaskRow({ task, accent, onToggle, onMove, onRename, onRemove }: TaskRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [dragging, setDragging] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

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
        className="mt-[7px] hidden shrink-0 cursor-grab text-faint opacity-40 transition-opacity duration-150 group-hover:opacity-100 sm:block"
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
          className="min-w-0 flex-1 rounded-[4px] border border-line bg-surface px-1.5 py-0.5 text-[15px] leading-6 outline-none"
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
            'min-w-0 flex-1 text-left text-[15px] leading-6 transition-colors duration-150',
            task.done ? 'text-faint line-through' : 'text-ink',
          )}
          title="Rename task"
        >
          {task.title}
        </button>
      )}

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={`Options for "${task.title}"`}
          className="mt-0.5 -mr-1 rounded-[6px] px-2 py-2 text-faint opacity-60 transition hover:bg-surface hover:text-ink hover:opacity-100 focus-visible:opacity-100"
        >
          <span aria-hidden="true" className="block leading-none tracking-[0.1em]">
            ···
          </span>
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-control border border-line bg-surface p-1 shadow-[0_18px_40px_-24px_rgba(20,26,23,0.55)]"
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
                  quadrant.id === task.quadrant
                    ? 'cursor-default text-faint'
                    : 'text-ink hover:bg-canvas',
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
