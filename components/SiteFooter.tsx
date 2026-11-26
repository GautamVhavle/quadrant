import { GitHubIcon, HeartIcon } from './Icons';

export default function SiteFooter() {
  return (
    <footer className="px-3 pb-8 pt-4 sm:px-6 sm:pb-12">
      <div className="mx-auto max-w-page">
        <div className="glass rounded-glass overflow-hidden">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid grid-cols-2 gap-[3px]" aria-hidden="true">
                  <span className="h-2 w-2 rounded-[2px] bg-q2" />
                  <span className="h-2 w-2 rounded-[2px] bg-q1" />
                  <span className="h-2 w-2 rounded-[2px] bg-q4" />
                  <span className="h-2 w-2 rounded-[2px] bg-q3" />
                </span>
                <p className="font-display text-[17px] font-semibold tracking-[-0.03em]">Quadrant</p>
              </div>
              <p className="mt-3 max-w-[42ch] text-[13.5px] leading-[1.6] text-soft">
                A four-quadrant task board that makes you decide what actually matters. Three questions, no account,
                and every decision can be overruled.
              </p>
              <p className="mt-4 flex items-center gap-2 rounded-pill border border-[color:var(--line)] px-3 py-1.5 text-[12px] text-faint">
                <span className="h-1.5 w-1.5 rounded-full bg-q2" aria-hidden="true" />
                Your board stays in this browser. Export it any time.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Read</p>
                <ul className="mt-3 space-y-2.5 text-[13.5px]">
                  <li>
                    <a href="#decides" className="text-soft transition hover:text-ink">
                      How the questions decide
                    </a>
                  </li>
                  <li>
                    <a href="#why" className="text-soft transition hover:text-ink">
                      Why the matrix works
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/GautamVhavle/quadrant"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-soft transition hover:text-ink"
                    >
                      <GitHubIcon className="h-3.5 w-3.5" />
                      Source on GitHub
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Built by</p>
                <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[13.5px] text-soft">
                  Made with
                  <HeartIcon className="h-3.5 w-3.5 text-q1" aria-label="love" />
                  by
                  <a
                    href="https://gautamvhavle.xyz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-ink underline decoration-[color:var(--line)] decoration-1 underline-offset-4 transition hover:decoration-current"
                  >
                    Gautam Vhavle
                  </a>
                </p>
                <a
                  href="https://gautamvhavle.xyz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] text-faint transition hover:text-ink"
                >
                  gautamvhavle.xyz
                  <span aria-hidden="true">&#8599;</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-[color:var(--line)] px-6 py-3.5 text-[11.5px] text-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>Released under the MIT licence.</p>
            <p>Eisenhower called it urgent versus important. This is one reading of it.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
