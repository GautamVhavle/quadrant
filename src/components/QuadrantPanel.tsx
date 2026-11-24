import { useState } from 'react';
import { cn } from '../lib/utils';
import { PlusIcon } from './Icons';
import { TaskRow } from './TaskRow';
import type { QuadrantId, QuadrantMeta, Task } from '../lib/types';

interface QuadrantPanelProps {
  meta: QuadrantMeta;
  tasks: Task[];
  onAdd: (title: string, quadrant: QuadrantId) => void;
  onToggle: (id: string) => void;
  onMove: (id: string, quadrant: QuadrantId) => void;
  onRename: (id: string, title: string) => void;
  onRemove: (id: string) => void;
}

export function QuadrantPanel({ meta, tasks, onAdd, onToggle, onMove, onRename, onRemove }: QuadrantPanelProps) {
  const [draggingOver, setDraggingOver] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const accent = `var(--${meta.colorVar})`;
  const open = tasks.filter((task) => !task.done);
  const done = tasks.filter((task) => task.done);
  const sorted = [...open, ...done];

  function submit() {
    if (draft.trim()) {
      onAdd(draft, meta.id);
      setDraft('');
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
        'relative flex min-h-[196px] flex-col p-4 transition-colors duration-200 ease-calm sm:p-5',
        draggingOver && 'bg-surface',
      )}
      style={{ backgroundColor: draggingOver ? undefined : `var(--${meta.tintVar})` }}
    >
      {draggingOver && (
        <span
          className="pointer-events-none absolute inset-0 border-2 border-dashed"
          style={{ borderColor: accent }}
          aria-hidden="true"
        />
      )}

      <header className="mb-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} aria-hidden="true" />
          <h2 id={`quadrant-${meta.id}`} className="text-[17px] leading-tight">
            {meta.name}
          </h2>
          <span
            className="rounded-pill border border-line bg-surface px-1.5 text-[11px] font-semibold tabular-nums leading-[17px] text-soft"
            title={`${open.length} open ${open.length === 1 ? 'task' : 'tasks'}`}
          >
            {open.length}
          </span>
          {done.length > 0 && (
            <span className="text-[11px] tabular-nums text-faint">{done.length} done</span>
          )}
        </div>
        <p className="mt-1.5 text-[13px] font-medium" style={{ color: accent }}>
          {meta.axis}
        </p>
      </header>

      <p className="mb-3.5 max-w-[36ch] text-[13px] leading-[1.55] text-soft">{meta.blurb}</p>

      {sorted.length === 0 ? (
        <p className="mb-2 text-[13px] leading-[1.55] text-faint">{meta.empty}</p>
      ) : (
        <ul className="mb-1 flex flex-col gap-0.5">
          {sorted.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              accent={accent}
              onToggle={onToggle}
              onMove={onMove}
              onRename={onRename}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}

      <div className="mt-auto pt-2">
        {adding ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="flex items-center gap-2"
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
              className="min-w-0 flex-1 rounded-field border border-line bg-surface px-2.5 py-1.5 text-[14px] placeholder:text-faint focus:border-current focus:outline-none"
              style={{ color: 'var(--ink)' }}
            />
            <button
              type="submit"
              className="shrink-0 rounded-field px-2.5 py-1.5 text-[13px] font-medium text-white transition hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              Add
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 py-1 text-[13px] font-medium text-soft underline decoration-line decoration-1 underline-offset-4 transition hover:text-ink hover:decoration-current"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add task
          </button>
        )}
      </div>
    </section>
  );
}
