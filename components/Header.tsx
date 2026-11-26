'use client';

import { cn } from '@/lib/utils';
import { MonitorIcon, MoonIcon, SunIcon } from './Icons';
import type { ThemeChoice } from '@/lib/storage';

interface HeaderProps {
  theme: ThemeChoice;
  onThemeChange: (theme: ThemeChoice) => void;
}

const THEMES: Array<{ value: ThemeChoice; label: string; Icon: typeof SunIcon }> = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
];

export function Header({ theme, onThemeChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
      {/* Masks content scrolling through the gap above the bar. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-px bottom-0 bg-[color:var(--canvas)]/88 backdrop-blur-[6px]"
        style={{
          maskImage: 'linear-gradient(to bottom, black 58%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 58%, transparent 100%)',
        }}
      />
      <div className="glass relative mx-auto flex max-w-page items-center justify-between gap-3 rounded-pill px-3 py-2 sm:px-4">
        <a href="#top" className="flex items-center gap-2.5 rounded-pill py-1 pl-1 pr-2">
          <span className="grid grid-cols-2 gap-[2.5px]" aria-hidden="true">
            <span className="h-[7px] w-[7px] rounded-[2px] bg-q2" />
            <span className="h-[7px] w-[7px] rounded-[2px] bg-q1" />
            <span className="h-[7px] w-[7px] rounded-[2px] bg-q4 opacity-70" />
            <span className="h-[7px] w-[7px] rounded-[2px] bg-q3 opacity-70" />
          </span>
          <span className="font-display text-[16px] font-semibold tracking-[-0.03em] sm:text-[17px]">Quadrant</span>
        </a>

        <div className="flex items-center gap-1 sm:gap-2">
          <a
            href="#why"
            className="hidden rounded-pill px-2.5 py-1.5 text-[12.5px] text-soft transition hover:text-ink sm:block"
          >
            Why it works
          </a>
          <div
            role="radiogroup"
            aria-label="Colour theme"
            className="flex items-center gap-0.5 rounded-pill border border-[color:var(--line)] bg-white/40 p-0.5 dark:bg-white/5"
          >
            {THEMES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                aria-label={label}
                title={label}
                onClick={() => onThemeChange(value)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-pill transition-colors duration-200',
                  theme === value ? 'bg-canvas text-ink shadow-sm' : 'text-faint hover:text-soft',
                )}
              >
                <Icon className="h-[15px] w-[15px]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
