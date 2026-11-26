import type { ReactNode } from 'react';
import { PRIORITY_ORDER, QUADRANTS } from '@/lib/types';

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-[26px] leading-[1.12] tracking-[-0.025em] sm:text-[31px]">{children}</h2>;
}

function Divider() {
  return <div className="my-12 h-px bg-[color:var(--line)] sm:my-16" />;
}

export default function Explainer() {
  return (
    <section id="why" className="mx-auto max-w-page scroll-mt-20 px-3 pb-16 sm:px-6 sm:pb-24">
      <div className="border-t border-[color:var(--line)] pt-12 sm:pt-16">
        <div className="max-w-prose px-1">
          <p className="text-[12.5px] font-semibold tracking-[0.12em] text-q1">THE IDEA</p>
          <div className="mt-3">
            <SectionTitle>
              Urgency and importance are different things, and almost every task list treats them as one.
            </SectionTitle>
          </div>

          <div className="mt-6 space-y-5 text-[16px] leading-[1.7] text-soft">
            <p>
              An urgent task demands an answer now. An important task moves something forward that you actually care
              about. They overlap often enough that we stop noticing the difference, which is how a full inbox can
              feel like a productive day.
            </p>
            <p>
              Four questions replace that guesswork. Two of them check whether the task is genuinely time bound, one
              checks whether it moves something you would defend, and the last asks whether it needs you at all. Your
              answers give two axes, and two axes give four very different instructions.
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

        <div className="max-w-prose px-1">
          <SectionTitle>What each quadrant is really asking</SectionTitle>
          <p className="mt-4 text-[16px] leading-[1.7] text-soft">
            Sorting a task is not filing it. Each quadrant carries an instruction about how the work should be
            treated, and the point of the board is to make you follow it.
          </p>
        </div>

        <dl className="mt-7 grid gap-5 sm:grid-cols-2">
          {QUADRANTS.map((quadrant) => (
            <div
              key={quadrant.id}
              className="glass rounded-glass p-4 sm:p-5"
              style={{ backgroundColor: `var(--${quadrant.tintVar})` }}
            >
              <dt className="flex items-baseline gap-2">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--${quadrant.colorVar})` }}
                  aria-hidden="true"
                />
                <h3 className="text-[18px] leading-tight">{quadrant.name}</h3>
                <span className="text-[12px] text-faint">{quadrant.axis}</span>
              </dt>
              <dd className="mt-2 text-[14px] leading-[1.6] text-soft">
                {quadrant.id === 'do' &&
                  'Capacity is the constraint here, not effort. Work in this quadrant is real and overdue, so it gets handled now and then it leaves. A board with everything in this quadrant has stopped making decisions.'}
                {quadrant.id === 'schedule' &&
                  'The compounding work lives here: the strategy, the training, the relationship, the system that prevents next month’s emergencies. It has no deadline pressing on it, which is why it needs a calendar entry rather than good intentions.'}
                {quadrant.id === 'delegate' &&
                  'The work genuinely needs doing soon, but it does not need you specifically. Hand it off, trade it, or give it a fixed short slot. Left alone, this quadrant eats the time you planned for the one above it.'}
                {quadrant.id === 'delete' &&
                  'Some items exist because they were once added, not because they matter. Deleting them is not avoidance, it is the same act as deciding. Few people regret the busywork they removed.'}
              </dd>
            </div>
          ))}
        </dl>

        <Divider />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="px-1">
            <SectionTitle>Why this is worth doing at all</SectionTitle>
            <div className="mt-5 space-y-5 text-[16px] leading-[1.7] text-soft">
              <p>
                A flat list gives you one instruction: more. More items, more urgency, more scrolling. It has no
                opinion about what deserves the next hour, so the loudest item wins by default.
              </p>
              <p>
                Four questions force a judgement while the choice is still cheap. Deciding that something belongs in
                Drop takes seconds and saves you from carrying it around for a week.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {[
              {
                title: 'It matches how attention fails',
                body: 'Urgency is easy to feel and importance is not, so urgency wins ties unless something intervenes. Writing the two axes down is that intervention.',
              },
              {
                title: 'It turns a backlog into four decisions',
                body: 'Four destinations is few enough to keep in your head. Once everything is sorted, the question changes from what should I do to is this the right quadrant, which is easier to answer honestly.',
              },
              {
                title: 'It makes trade-offs visible',
                body: 'When Schedule is empty and Do now is full, you are not disorganised, you are reactive. The board shows that in one glance.',
              },
            ].map((item) => (
              <div key={item.title} className="glass rounded-glass p-4">
                <h3 className="text-[16.5px]">{item.title}</h3>
                <p className="mt-1.5 text-[14px] leading-[1.6] text-soft">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="px-1">
            <SectionTitle>Using it without turning it into a ritual</SectionTitle>
            <ol className="mt-5 space-y-4">
              {[
                {
                  title: 'Empty your head first',
                  body: 'Add everything in one pass. Sorting while remembering is how items get lost.',
                },
                {
                  title: 'Answer the four questions honestly',
                  body: 'The answers are for you, not for a score. If you hesitate, the task is probably Schedule.',
                },
                {
                  title: 'Do one thing from Do now',
                  body: 'Then protect a block for Schedule. Those two areas are where the day is actually won.',
                },
                {
                  title: 'Clear Drop without guilt',
                  body: 'Delete it, or admit it is a someday item and take it off the board entirely.',
                },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-3.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[color:var(--line)] text-[12px] font-medium tabular-nums text-soft">
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

          <div className="px-1">
            <SectionTitle>Where it stops being useful</SectionTitle>
            <div className="mt-5 space-y-4 text-[14.5px] leading-[1.65] text-soft">
              <p>
                This is a decision heuristic, not a measurement. Nothing here is scored or validated. It is a way of
                asking two questions before you spend an hour.
              </p>
              <p>
                It has a well known failure mode: people park almost everything in Do now because being busy feels
                valuable, and the grid becomes a normal to-do list with extra colour.
              </p>
              <p>
                It also says nothing about sequence, effort, or dependencies. It will not tell you that two important
                tasks conflict. Use it to choose, then use a calendar to commit.
              </p>
              <p className="text-ink">
                The honest measure is not how full the board is. It is whether Schedule has something real in it this
                week.
              </p>
            </div>

            <div className="glass mt-6 rounded-glass p-4">
              <p className="text-[12px] font-semibold tracking-[0.08em] text-faint">THE FOUR ANSWERS MAP LIKE THIS</p>
              <ul className="mt-2.5 space-y-1.5 text-[13.5px] text-soft">
                {PRIORITY_ORDER.map((id) => {
                  const meta = QUADRANTS.find((quadrant) => quadrant.id === id)!;
                  return (
                    <li key={id} className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: `var(--${meta.colorVar})` }}
                        aria-hidden="true"
                      />
                      <span className="font-medium text-ink">{meta.name}</span>
                      <span className="text-faint">{meta.axis.toLowerCase()}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
