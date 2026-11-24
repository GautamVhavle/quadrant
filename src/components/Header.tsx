import { cn } from '../lib/utils';
import { MonitorIcon, MoonIcon, SunIcon } from './Icons';
import type { ThemeChoice } from '../lib/storage';

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
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-page items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5 rounded-[6px]">
          <span className="grid grid-cols-2 gap-[2px]" aria-hidden="true">
            <span className="h-[7px] w-[7px] rounded-[1.5px] bg-q2" />
            <span className="h-[7px] w-[7px] rounded-[1.5px] bg-q1" />
            <span className="h-[7px] w-[7px] rounded-[1.5px] bg-q4 opacity-60" />
            <span className="h-[7px] w-[7px] rounded-[1.5px] bg-q3 opacity-60" />
          </span>
          <span className="font-display text-[17px] font-semibold tracking-[-0.03em]">Quadrant</span>
        </a>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <a
            href="#why"
            className="hidden rounded-[6px] px-2 py-1 text-[13px] text-soft transition hover:text-ink sm:block"
          >
            Why this works
          </a>

          <div
            role="radiogroup"
            aria-label="Colour theme"
            className="flex items-center gap-0.5 rounded-pill border border-line bg-surface p-0.5"
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
                  'flex h-9 w-9 items-center justify-center rounded-pill transition-colors duration-150',
                  theme === value ? 'bg-canvas text-ink' : 'text-faint hover:text-soft',
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
