'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SparkIcon } from './Icons';
import { PRIORITY_ORDER, QUADRANT_BY_ID, type QuadrantId } from '@/lib/types';

interface ComposerProps {
  onSubmitTriage: (title: string) => void;
  onPlaceDirect: (title: string, quadrant: QuadrantId) => void;
}

export function Composer({ onSubmitTriage, onPlaceDirect }: ComposerProps) {
  const [title, setTitle] = useState('');

  function sortIt() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmitTriage(trimmed);
    setTitle('');
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        sortIt();
      }}
      className="mt-6 w-full sm:mt-7"
    >
      <div className="glass glass-sheen flex items-center gap-2 rounded-glass p-1.5 pl-4 transition-shadow duration-300 focus-within:shadow-lift">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setTitle('');
            const index = Number(event.key);
            if (index >= 1 && index <= 4 && title.trim()) {
              event.preventDefault();
              onPlaceDirect(title.trim(), PRIORITY_ORDER[index - 1]);
              setTitle('');
            }
          }}
          placeholder="What is on your mind?"
          aria-label="New task"
          maxLength={240}
          className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-[15.5px] placeholder:text-faint focus:outline-none"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-control bg-ink px-3.5 text-[13.5px] font-semibold text-canvas transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <SparkIcon className="h-4 w-4" />
          Sort it
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 px-1 sm:flex-row sm:items-start">
        <span className="shrink-0 pt-1 text-[12px] text-faint">Or place it yourself</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRIORITY_ORDER.map((id, index) => {
            const meta = QUADRANT_BY_ID[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (title.trim()) {
                    onPlaceDirect(title.trim(), id);
                    setTitle('');
                  }
                }}
                disabled={!title.trim()}
                title={title.trim() ? `Place in ${meta.name}` : 'Type a task first'}
                className={cn(
                  'flex items-center gap-1.5 rounded-pill border border-[color:var(--line)] bg-white/50 px-2.5 py-1.5 text-[12.5px] text-soft transition',
                  'hover:bg-white/80 hover:text-ink disabled:cursor-not-allowed disabled:opacity-55 dark:bg-white/5 dark:hover:bg-white/10',
                )}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: `var(--${meta.colorVar})` }}
                  aria-hidden="true"
                />
                {meta.name}
                <kbd className="rounded-[5px] border border-[color:var(--line)] px-1 text-[10px] font-semibold leading-[15px] text-faint">
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
