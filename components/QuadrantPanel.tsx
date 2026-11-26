'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PlusIcon } from './Icons';
import { TaskRow } from './TaskRow';
import type { QuadrantId, QuadrantMeta, Task } from '@/lib/types';

interface QuadrantPanelProps {
  meta: QuadrantMeta;
  tasks: Task[];
  compact?: boolean;
  onAdd: (title: string, quadrant: QuadrantId) => void;
  onToggle: (id: string) => void;
  onMove: (id: string, quadrant: QuadrantId) => void;
  onReorder: (id: string, direction: -1 | 1) => void;
  onRename: (id: string, title: string) => void;
  onSetDue: (id: string, due?: string) => void;
  onRemove: (id: string) => void;
}

const SCROLL_AFTER = 7;

export function QuadrantPanel({
  meta,
  tasks,
  compact = false,
  onAdd,
  onToggle,
  onMove,
  onReorder,
  onRename,
  onSetDue,
  onRemove,
}: QuadrantPanelProps) {
  const [draggingOver, setDraggingOver] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const accent = `var(--${meta.colorVar})`;
  const open = tasks.filter((task) => !task.done);
  const done = tasks.filter((task) => task.done);
  const sorted = [...open, ...done];
  const scrolls = sorted.length > SCROLL_AFTER;

  function submit() {
    if (draft.trim()) {
      onAdd(draft, meta.id);
      setDraft('');
      setAdding(false);
    }
  }

  return (
    <section
      aria-labelledby={`quadrant-${meta.id}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDraggingOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDraggingOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDraggingOver(false);
        const id = event.dataTransfer.getData('text/plain');
        if (id) onMove(id, meta.id);
      }}
      className={cn(
        'relative flex min-h-[168px] flex-col p-3.5 transition-colors duration-300 ease-calm sm:min-h-[188px] sm:p-4',
        draggingOver && 'bg-white/45 dark:bg-white/10',
      )}
      style={{ backgroundColor: draggingOver ? undefined : `var(--${meta.tintVar})` }}
    >
      {draggingOver && (
        <span
          className="pointer-events-none absolute inset-1 rounded-[16px] border-2 border-dashed"
          style={{ borderColor: accent }}
          aria-hidden="true"
        />
      )}

      <header className="mb-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} aria-hidden="true" />
          <h2 id={`quadrant-${meta.id}`} className="text-[16px] leading-tight tracking-[-0.01em] sm:text-[17px]">
            {meta.name}
          </h2>
          <span
            className="rounded-pill bg-white/70 px-1.5 text-[11px] font-semibold tabular-nums leading-[18px] text-soft dark:bg-white/10"
            title={`${open.length} open ${open.length === 1 ? 'task' : 'tasks'}`}
          >
            {open.length}
          </span>
          {done.length > 0 && <span className="text-[11px] tabular-nums text-faint">{done.length} done</span>}
        </div>
        <p className="mt-1 text-[12.5px] font-medium" style={{ color: accent }}>
          {meta.axis}
        </p>
      </header>

      {!compact && <p className="mb-3 max-w-[38ch] text-[12.5px] leading-[1.5] text-soft">{meta.blurb}</p>}

      {sorted.length === 0 ? (
        <p className="mb-1.5 text-[12.5px] leading-[1.5] text-faint">{meta.empty}</p>
      ) : (
        <div
          className={cn(
            'mb-1 -mx-1 px-1',
            scrolls && 'thin-scroll max-h-[17rem] overflow-y-auto overscroll-contain pr-1.5',
          )}
        >
          <ul className="flex flex-col gap-0.5">
            <AnimatePresence initial={false}>
              {sorted.map((task) => {
                const siblings = sorted.filter((item) => item.done === task.done);
                const position = siblings.findIndex((item) => item.id === task.id);
                return (
                  <TaskRow
                    key={task.id}
                    task={task}
                    accent={accent}
                    canMoveUp={position > 0}
                    canMoveDown={position >= 0 && position < siblings.length - 1}
                    onToggle={onToggle}
                    onMove={onMove}
                    onReorder={onReorder}
                    onRename={onRename}
                    onSetDue={onSetDue}
                    onRemove={onRemove}
                  />
                );
              })}
            </AnimatePresence>
          </ul>
        </div>
      )}

      <div className="mt-auto pt-1.5">
        <AnimatePresence initial={false} mode="wait">
          {adding ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setDraft('');
                    setAdding(false);
                  }
                }}
                placeholder="What belongs here?"
                aria-label={`New task in ${meta.name}`}
                maxLength={240}
                className="min-w-0 flex-1 rounded-[12px] border border-[color:var(--line)] bg-white/75 px-2.5 py-2 text-[14px] placeholder:text-faint focus:outline-none dark:bg-white/10"
              />
              <button
                type="submit"
                className="shrink-0 rounded-[12px] px-2.5 py-2 text-[13px] font-medium text-white transition hover:opacity-90"
                style={{ backgroundColor: accent }}
              >
                Add
              </button>
            </motion.form>
          ) : (
            <motion.button
              key="button"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 py-1.5 text-[12.5px] font-medium text-soft transition hover:text-ink"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add task
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
