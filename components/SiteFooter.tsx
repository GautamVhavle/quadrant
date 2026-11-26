import { HeartIcon } from './Icons';

export default function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--line)] px-3 py-8 sm:px-6">
      <div className="mx-auto flex max-w-page flex-col items-center gap-3 text-[12.5px] text-faint sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center sm:text-left">
          Quadrant keeps your board in this browser only. Export it if you want a copy.
        </p>

        <p className="flex items-center gap-1.5">
          Made with
          <HeartIcon className="h-3.5 w-3.5 text-q1" aria-label="love" />
          by
          <a
            href="https://gautamvhavle.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink underline decoration-[color:var(--line)] decoration-1 underline-offset-4 transition hover:decoration-current"
          >
            Gautam Vhavle
          </a>
        </p>
      </div>
    </footer>
  );
}
