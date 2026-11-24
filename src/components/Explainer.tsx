import { QUADRANTS } from '../lib/types';
import type { ReactNode } from 'react';

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-[26px] leading-[1.15] sm:text-[30px]">{children}</h2>;
}

function Divider() {
  return <div className="my-12 h-px bg-line sm:my-16" />;
}

export function Explainer() {
  return (
    <section id="why" className="mt-20 scroll-mt-8 sm:mt-28">
      <div className="max-w-prose">
        <p className="text-[13px] font-medium text-q1">The idea</p>
        <SectionTitle>
          Urgency and importance are different things, and almost every task list treats them as one.
        </SectionTitle>

        <div className="mt-6 space-y-5 text-[16.5px] leading-[1.7] text-soft">
          <p>
            An urgent task demands an answer now. An important task moves something forward that you actually
            care about. They overlap often enough that we stop noticing the difference, which is how a full
            inbox can feel like a productive day.
          </p>
          <p>
            The four-quadrant method separates the two questions. Is this urgent? Is this important? Two
            questions, four answers, four very different responses. It is usually credited to Dwight
            Eisenhower, who was known for insisting that urgent work is rarely important and important work is
            rarely urgent. Stephen Covey later made it the backbone of his time management material, which is
            why the grid is now everywhere.
          </p>
        </div>

        <blockquote className="mt-8 border-l-2 border-q1 pl-5">
          <p className="font-display text-[21px] leading-[1.45] tracking-[-0.015em] text-ink sm:text-[23px]">
            “I have two kinds of problems, the urgent and the important. The urgent are not important, and the
            important are never urgent.”
          </p>
          <footer className="mt-2 text-[13px] text-faint">
            Attributed to Dwight D. Eisenhower, 1954 address to the World Council of Churches
          </footer>
        </blockquote>
      </div>

      <Divider />

      <div className="max-w-prose">
        <SectionTitle>What each quadrant is really asking</SectionTitle>
        <p className="mt-4 text-[16.5px] leading-[1.7] text-soft">
          Sorting a task is not filing it. Each quadrant carries instructions about how the work should be
          treated, and the point of the board is to make you follow them.
        </p>
      </div>

      <dl className="mt-8 grid gap-6 sm:grid-cols-2">
        {QUADRANTS.map((quadrant) => (
          <div key={quadrant.id} className="border-t-2 pt-4" style={{ borderColor: `var(--${quadrant.colorVar})` }}>
            <dt className="flex items-baseline gap-2">
              <h3 className="text-[18px] leading-tight">{quadrant.name}</h3>
              <span className="text-[12.5px] text-faint">{quadrant.axis}</span>
            </dt>
            <dd className="mt-2 max-w-[46ch] text-[14.5px] leading-[1.65] text-soft">
              {quadrant.id === 'do' &&
                'Capacity is the constraint here, not effort. Work in this quadrant is real and overdue, so it gets handled now and then it leaves. A board with everything in this quadrant is a board that has stopped making decisions.'}
              {quadrant.id === 'schedule' &&
                'This is where the compounding work lives: the strategy, the training, the relationship, the system that prevents next month’s emergencies. It has no deadline pressing on it, which is exactly why it needs a calendar entry rather than good intentions.'}
              {quadrant.id === 'delegate' &&
                'The work genuinely needs doing soon, but it does not need you specifically. Hand it off, trade it, or give it a fixed short slot. Left unattended, this quadrant quietly consumes the time you planned to spend on the quadrant above it.'}
              {quadrant.id === 'delete' &&
                'Some items exist because they were once added, not because they matter. Deleting them is not avoidance, it is the same act as deciding. Few people regret the busywork they removed.'}
            </dd>
          </div>
        ))}
      </dl>

      <Divider />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div>
          <SectionTitle>Why this is worth doing at all</SectionTitle>
          <div className="mt-5 space-y-5 text-[16px] leading-[1.7] text-soft">
            <p>
              A flat list gives you one instruction: more. More items, more urgency, more scrolling. It has no
              opinion about what deserves the next hour, so the loudest item wins by default.
            </p>
            <p>
              The quadrants force a judgement while the choice is still cheap. Deciding that something belongs in
              Drop takes two seconds and saves you from carrying it around for a week.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-t border-line pt-4">
            <h3 className="text-[17px]">It matches how attention actually fails</h3>
            <p className="mt-2 text-[14.5px] leading-[1.65] text-soft">
              Urgency is easy to feel and importance is not, so urgency wins ties unless something intervenes.
              Writing the two axes down is that intervention.
            </p>
          </div>
          <div className="border-t border-line pt-4">
            <h3 className="text-[17px]">It turns a backlog into a small set of decisions</h3>
            <p className="mt-2 text-[14.5px] leading-[1.65] text-soft">
              Four destinations is few enough to keep in your head. Once everything is sorted, the question
              changes from “what should I do” to “is this the right quadrant”, which is a much easier question to
              answer honestly.
            </p>
          </div>
          <div className="border-t border-line pt-4">
            <h3 className="text-[17px]">It makes trade-offs visible</h3>
            <p className="mt-2 text-[14.5px] leading-[1.65] text-soft">
              When the top-left quadrant is empty and the top-right quadrant is full, you are not disorganised,
              you are reactive. The board shows that in one glance, which is often the only push needed to
              schedule something that matters.
            </p>
          </div>
        </div>
      </div>

      <Divider />

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <SectionTitle>Using it without turning it into a ritual</SectionTitle>
          <ol className="mt-5 space-y-4">
            {[
              {
                title: 'Empty your head first',
                body: 'Add everything in one pass without sorting. Categorising while remembering is how items get lost.',
              },
              {
                title: 'Sort in one sweep',
                body: 'Ask urgent, then important, then drop it into a quadrant. If you hesitate for more than a few seconds, it is probably Schedule.',
              },
              {
                title: 'Do one thing from Do now',
                body: 'Then protect a block for Schedule. These two quadrants are where the day is actually won.',
              },
              {
                title: 'Clear Drop without guilt',
                body: 'Delete, or admit it is a someday item and remove it from the board entirely.',
              },
            ].map((step, index) => (
              <li key={step.title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-strong text-[12px] font-medium tabular-nums text-soft">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-[15.5px] leading-snug">{step.title}</h3>
                  <p className="mt-1 text-[14px] leading-[1.6] text-soft">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <SectionTitle>Where it stops being useful</SectionTitle>
          <div className="mt-5 space-y-4 text-[14.5px] leading-[1.65] text-soft">
            <p>
              This is a decision heuristic, not a measurement. Nothing here is scored or validated; it is a way of
              asking two questions before you spend an hour. Treat it as a lens, not a metric.
            </p>
            <p>
              It also has a well known failure mode: people park almost everything in Do now because being busy
              feels like being valuable, and the grid quietly becomes a normal to-do list with extra colour.
            </p>
            <p>
              Finally, it says nothing about sequence, effort, or dependencies. It will not tell you that two
              important tasks conflict, and it will not plan a project. Use it to choose, then use a calendar to
              commit.
            </p>
            <p className="text-ink">
              The honest measure of the method is not how full the board is. It is whether the top-left quadrant
              has something real in it this week.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
