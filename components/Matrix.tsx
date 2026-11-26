'use client';

import { cn } from '@/lib/utils';
import { QuadrantPanel } from './QuadrantPanel';
import { QUADRANTS, type QuadrantId, type Task } from '@/lib/types';
import { ArrowRightIcon, ArrowUpIcon } from './Icons';

interface MatrixProps {
  tasks: Task[];
  focus: boolean;
  onAdd: (title: string, quadrant: QuadrantId) => void;
  onToggle: (id: string) => void;
  onMove: (id: string, quadrant: QuadrantId) => void;
  onReorder: (id: string, direction: -1 | 1) => void;
  onRename: (id: string, title: string) => void;
  onSetDue: (id: string, due?: string) => void;
  onRemove: (id: string) => void;
}

/** Desktop keeps the true 2x2 geometry; the stacked mobile view reads in priority order. */
const CELL_CLASS: Record<QuadrantId, string> = {
  do: 'max-md:order-1 border-b',
  schedule: 'max-md:order-2 border-b md:border-r',
  delegate: 'max-md:order-3 border-b md:border-b-0',
  delete: 'max-md:order-4 md:border-r',
};

export function Matrix({ tasks, focus, onAdd, onToggle, onMove, onReorder, onRename, onSetDue, onRemove }: MatrixProps) {
  const visible = QUADRANTS.filter((meta) => !focus || meta.id === 'do' || meta.id === 'schedule');

  return (
    <div className="relative mt-3 sm:mt-4">
      <div className="mb-2 flex items-center justify-between gap-3 px-0.5">
        <p className="text-[12px] text-soft sm:text-[12.5px]">
          <span className="hidden [@media(pointer:coarse)]:inline">Use a task menu to move it between areas.</span>
          <span className="[@media(pointer:coarse)]:hidden">Drag a task into another area to reclassify it.</span>
        </p>
        <p className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.16em] text-soft">
          URGENCY
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </p>
      </div>

      <div className="relative">
        <div
          className="absolute -left-6 top-0 hidden h-full flex-col items-center justify-center gap-2 lg:flex"
          aria-hidden="true"
        >
          <ArrowUpIcon className="h-3.5 w-3.5 text-soft" />
          <span
            className="whitespace-nowrap text-[10.5px] font-semibold tracking-[0.16em] text-soft"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            IMPORTANCE
          </span>
        </div>

        <div className="glass glass-sheen overflow-hidden rounded-glass">
          <div className={cn('flex flex-col md:grid', focus ? 'md:grid-cols-1' : 'md:grid-cols-2')}>
            {visible.map((meta) => (
              <div
                key={meta.id}
                className={cn('flex flex-col border-[color:var(--line)]', focus ? 'border-b last:border-b-0' : CELL_CLASS[meta.id])}
              >
                <QuadrantPanel
                  meta={meta}
                  tasks={tasks.filter((task) => task.quadrant === meta.id)}
                  onAdd={onAdd}
                  onToggle={onToggle}
                  onMove={onMove}
                  onReorder={onReorder}
                  onRename={onRename}
                  onSetDue={onSetDue}
                  onRemove={onRemove}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {focus && (
        <p className="mt-2 text-[12px] text-faint">
          Focus hides Delegate and Drop. Those tasks are kept, just out of sight.
        </p>
      )}
    </div>
  );
}
