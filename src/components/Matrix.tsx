import { cn } from '../lib/utils';
import { QuadrantPanel } from './QuadrantPanel';
import { QUADRANTS, type QuadrantId, type Task } from '../lib/types';
import { ArrowRightIcon, ArrowUpIcon } from './Icons';

interface MatrixProps {
  tasks: Task[];
  onAdd: (title: string, quadrant: QuadrantId) => void;
  onToggle: (id: string) => void;
  onMove: (id: string, quadrant: QuadrantId) => void;
  onRename: (id: string, title: string) => void;
  onRemove: (id: string) => void;
}

/** Desktop keeps the true 2x2 geometry; the stacked mobile view reads in priority order. */
const CELL_CLASS: Record<QuadrantId, string> = {
  do: 'max-md:order-1 border-b',
  schedule: 'max-md:order-2 border-b md:border-r',
  delegate: 'max-md:order-3 border-b md:border-b-0',
  delete: 'max-md:order-4 md:border-r',
};

export function Matrix({ tasks, onAdd, onToggle, onMove, onRename, onRemove }: MatrixProps) {
  return (
    <div className="relative mt-4">
      <div
        className="pointer-events-none absolute -left-7 top-0 hidden h-full flex-col items-center justify-center gap-2 lg:flex"
        aria-hidden="true"
      >
        <ArrowUpIcon className="h-3.5 w-3.5 text-soft" />
        <span
          className="whitespace-nowrap text-[11px] font-semibold tracking-[0.16em] text-soft"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          IMPORTANCE
        </span>
      </div>

      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-[12.5px] text-faint">Drag a task into another area to reclassify it.</p>
        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] text-soft">
          URGENCY
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </p>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-line-strong bg-surface">
        <div className="flex flex-col md:grid md:grid-cols-2">
          {QUADRANTS.map((meta) => (
            <div key={meta.id} className={cn('flex flex-col border-line-strong', CELL_CLASS[meta.id])}>
              <QuadrantPanel
                meta={meta}
                tasks={tasks.filter((task) => task.quadrant === meta.id)}
                onAdd={onAdd}
                onToggle={onToggle}
                onMove={onMove}
                onRename={onRename}
                onRemove={onRemove}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
