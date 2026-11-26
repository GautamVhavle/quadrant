import { QUESTIONS, QUESTION_ORDER } from '@/lib/decision';
import { QUADRANT_BY_ID } from '@/lib/types';

const OUTCOMES: Array<{ answers: string; quadrant: string }> = [
  { answers: 'Something breaks and it moves a goal', quadrant: 'do' },
  { answers: 'Something breaks, no goal, but only you can do it', quadrant: 'do' },
  { answers: 'Something breaks, no goal, and someone else could carry it', quadrant: 'delegate' },
  { answers: 'Nothing breaks, but it moves a goal', quadrant: 'schedule' },
  { answers: 'Nothing breaks, no goal, and someone else could carry it', quadrant: 'delegate' },
  { answers: 'Nothing breaks, no goal, and nobody else needs it', quadrant: 'delete' },
];

export default function DecisionExplainer() {
  return (
    <section
      id="decides"
      aria-label="How the questions decide"
      className="mx-auto max-w-page scroll-mt-24 px-3 py-14 sm:px-6 sm:py-20"
    >
      <div className="max-w-[62ch]">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-faint">The decision</p>
        <h2 className="mt-2.5 text-[28px] leading-[1.08] tracking-[-0.035em] sm:text-[36px]">
          Three questions, and the third one often never gets asked
        </h2>
        <p className="mt-3.5 text-[15px] leading-[1.65] text-soft sm:text-[15.5px]">
          Each question is only put to you when your answer can still change where the task lands. A task that breaks
          something next week and moves a real goal is placed in two questions. Only the ambiguous ones reach the
          third.
        </p>
        <p className="mt-2.5 text-[13.5px] leading-[1.6] text-faint">
          All of it runs in this browser. No model, no network request, no account.
        </p>
      </div>

      <ol className="mt-8 grid gap-3 lg:grid-cols-3 lg:gap-4">
        {QUESTION_ORDER.map((id, index) => {
          const question = QUESTIONS[id];
          return (
            <li key={id} className="glass glass-sheen rounded-glass p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-[color:var(--line)] text-[11.5px] font-semibold text-soft"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-faint">
                  {question.short}
                </p>
                {id === 'handoff' && (
                  <span className="ml-auto rounded-pill border border-[color:var(--line)] px-2 py-0.5 text-[10.5px] text-faint">
                    Sometimes skipped
                  </span>
                )}
              </div>

              <p className="mt-3 text-[15.5px] font-medium leading-[1.4] text-ink">{question.text}</p>
              <p className="mt-2 text-[12.5px] leading-[1.55] text-faint">{question.why}</p>

              <dl className="mt-3.5 space-y-2 border-t border-[color:var(--line)] pt-3">
                <div className="flex gap-2">
                  <dt className="w-8 shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-q2">Yes</dt>
                  <dd className="text-[12.5px] leading-[1.5] text-soft">{question.yes}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-8 shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-q1">No</dt>
                  <dd className="text-[12.5px] leading-[1.5] text-soft">{question.no}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-10">
        <div>
          <h3 className="text-[19px] tracking-[-0.02em] sm:text-[21px]">Where the answers land</h3>
          <p className="mt-2 text-[13.5px] leading-[1.6] text-soft">
            Every path ends in exactly one area. If two areas seem to fit, that is usually a sign the task is really two
            tasks, and splitting it is the better answer.
          </p>
          <p className="mt-3 text-[13.5px] leading-[1.6] text-faint">
            Nothing in the tree looks at effort, dependencies or sequence. It only asks what waiting would cost and
            whether the work is yours.
          </p>
        </div>

        <ul className="divide-y divide-[color:var(--line)] overflow-hidden rounded-glass border border-[color:var(--line)]">
          {OUTCOMES.map((row) => {
            const meta = QUADRANT_BY_ID[row.quadrant as keyof typeof QUADRANT_BY_ID];
            return (
              <li key={row.answers} className="flex items-center gap-3 bg-white/45 px-4 py-3 dark:bg-white/5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--${meta.colorVar})` }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 text-[13px] leading-[1.45] text-soft">{row.answers}</span>
                <span
                  className="shrink-0 rounded-pill px-2.5 py-1 text-[11.5px] font-semibold"
                  style={{
                    color: `var(--${meta.colorVar})`,
                    backgroundColor: `var(--${meta.tintVar})`,
                  }}
                >
                  {meta.name}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
