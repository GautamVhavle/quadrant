import { useState } from 'react';
import { cn } from '../lib/utils';
import { CheckIcon, PlusIcon } from './Icons';
import { QUADRANT_BY_ID, type QuadrantId } from '../lib/types';

interface ComposerProps {
  onAdd: (title: string, quadrant: QuadrantId) => void;
}

/** Order here is priority order, so the shortcuts read 1 to 4 the way people scan the board. */
const ORDER: QuadrantId[] = ['do', 'schedule', 'delegate', 'delete'];

export function Composer({ onAdd }: ComposerProps) {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState<QuadrantId>('do');

  function submit() {
    if (!title.trim()) return;
    onAdd(title, target);
    setTitle('');
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="mt-7 w-full max-w-[660px] lg:mt-0 lg:max-w-none"
    >
      <div className="flex items-center gap-2 rounded-control border border-line-strong bg-surface px-2 py-1.5 shadow-[0_1px_0_rgba(20,26,23,0.05)] transition-colors focus-within:border-q2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setTitle('');
            const index = Number(event.key);
            if (index >= 1 && index <= 4) {
              event.preventDefault();
              setTarget(ORDER[index - 1]);
            }
          }}
          placeholder="Add the first thing on your mind"
          aria-label="New task"
          maxLength={240}
          className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-[15.5px] placeholder:text-faint focus:outline-none"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-[6px] bg-ink px-3 py-2 text-[13.5px] font-medium text-canvas transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-1.5">
        <span className="text-[12.5px] text-soft sm:mr-0.5">Put it in</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {ORDER.map((id, index) => {
            const quadrant = QUADRANT_BY_ID[id];
            const active = quadrant.id === target;
            return (
              <button
                key={quadrant.id}
                type="button"
                onClick={() => setTarget(quadrant.id)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-1.5 rounded-pill border px-2.5 py-1.5 text-[12.5px] transition-colors duration-150 sm:py-1',
                  active ? 'font-medium text-ink' : 'border-line bg-surface text-soft hover:text-ink',
                )}
                style={
                  active
                    ? {
                        backgroundColor: `var(--${quadrant.tintVar})`,
                        borderColor: `var(--${quadrant.colorVar})`,
                      }
                    : undefined
                }
              >
                <span
                  className="flex h-[11px] w-[11px] items-center justify-center rounded-full border"
                  style={{
                    backgroundColor: active ? `var(--${quadrant.colorVar})` : 'transparent',
                    borderColor: `var(--${quadrant.colorVar})`,
                  }}
                  aria-hidden="true"
                >
                  {active && <CheckIcon className="h-[7px] w-[7px] text-white" strokeWidth={3.5} />}
                </span>
                {quadrant.name}
                <kbd
                  className={cn(
                    'ml-0.5 rounded-[4px] border px-1 text-[10.5px] font-semibold leading-[15px]',
                    active ? 'border-line-strong text-soft' : 'border-line text-faint',
                  )}
                >
                  {index + 1}
                </kbd>
              </button>
            );
          })}
        </div>
      </div>
    </form>
  );
}
