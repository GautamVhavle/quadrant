'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { QUESTIONS, type AnswerKey, type TriageAnswers, type Verdict } from '@/lib/triage';
import { QUADRANT_BY_ID, PRIORITY_ORDER, type QuadrantId } from '@/lib/types';
import { AlertIcon, CheckIcon, CloseIcon, SparkIcon } from './Icons';

type Phase = 'asking' | 'thinking' | 'verdict' | 'problem';

interface TriageSheetProps {
  task: string;
  onClose: () => void;
  onAccept: (title: string, quadrant: QuadrantId) => void;
}

interface Problem {
  kind: 'rate-limit' | 'network' | 'invalid';
  message: string;
}

const emptyAnswers: TriageAnswers = { q1: false, q2: false, q3: false, q4: false };

export function TriageSheet({ task, onClose, onAccept }: TriageSheetProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<TriageAnswers>(emptyAnswers);
  const [phase, setPhase] = useState<Phase>('asking');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [choice, setChoice] = useState<QuadrantId | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);

  const sheetRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();

  const question = QUESTIONS[step];
  const answeredCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);

  const submit = useCallback(
    async (finalAnswers: TriageAnswers) => {
      setPhase('thinking');
      const startedAt = Date.now();
      try {
        const response = await fetch('/api/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task, answers: finalAnswers }),
        });

        if (response.status === 429) {
          const payload = (await response.json().catch(() => ({}))) as { retryAfter?: number };
          setProblem({
            kind: 'rate-limit',
            message: `That is a lot of sorting at once. Try again in ${
              payload.retryAfter && payload.retryAfter > 60
                ? `${Math.ceil(payload.retryAfter / 60)} minutes`
                : `${payload.retryAfter ?? 60} seconds`
            }, or place the task yourself.`,
          });
          setPhase('problem');
          return;
        }

        if (!response.ok) {
          setProblem({ kind: 'network', message: 'The sorter did not answer. Place the task yourself and keep going.' });
          setPhase('problem');
          return;
        }

        const payload = (await response.json()) as { verdict?: Verdict };
        if (!payload.verdict) {
          setProblem({ kind: 'invalid', message: 'That answer could not be read. Place the task yourself.' });
          setPhase('problem');
          return;
        }

        // A short floor keeps the transition from flashing on fast responses.
        const elapsed = Date.now() - startedAt;
        if (elapsed < 520) await new Promise((resolve) => setTimeout(resolve, 520 - elapsed));

        setVerdict(payload.verdict);
        setChoice(payload.verdict.quadrant);
        setPhase('verdict');
      } catch {
        setProblem({ kind: 'network', message: 'No connection to the sorter. Place the task yourself.' });
        setPhase('problem');
      }
    },
    [task],
  );

  const answer = useCallback(
    (value: boolean) => {
      if (phase !== 'asking') return;
      const key = question.id as AnswerKey;
      const next = { ...answers, [key]: value };
      setAnswers(next);
      if (step < QUESTIONS.length - 1) {
        setDirection(1);
        setStep(step + 1);
      } else {
        void submit(next);
      }
    },
    [answers, phase, question, step, submit],
  );

  const back = useCallback(() => {
    if (phase !== 'asking' || step === 0) return;
    setDirection(-1);
    setStep(step - 1);
  }, [phase, step]);

  useEffect(() => {
    primaryRef.current?.focus();
  }, [phase, step]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (phase === 'asking') {
        const yes = event.key === 'y' || event.key === 'Y' || event.key === '1';
        const no = event.key === 'n' || event.key === 'N' || event.key === '2';
        if (yes || no) {
          event.preventDefault();
          answer(yes);
          return;
        }
        if (event.key === 'ArrowLeft' || event.key === 'Backspace') {
          event.preventDefault();
          back();
        }
      }
      if (phase === 'verdict' && event.key === 'Enter' && choice) {
        event.preventDefault();
        onAccept(verdict?.title || task, choice);
      }
      if (event.key === 'Tab') {
        const nodes = sheetRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input, [href], [tabindex]:not([tabindex="-1"])',
        );
        if (!nodes || nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [answer, back, choice, onAccept, onClose, phase, task, verdict]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const sheetMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 40, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 24, scale: 0.98 },
      };

  const slotMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: direction * 28 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: direction * -28 },
      };

  const chosenMeta = choice ? QUADRANT_BY_ID[choice] : null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <motion.button
        type="button"
        aria-label="Close the sorter"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 cursor-default bg-[color:var(--ink)]/25 backdrop-blur-[3px] dark:bg-black/50"
      />

      <motion.div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="triage-title"
        {...sheetMotion}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="glass-strong glass-sheen relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-sheet sm:max-w-[560px] sm:rounded-sheet"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[color:var(--line)] sm:hidden" aria-hidden="true" />

        <div className="flex items-start justify-between gap-3 px-5 pb-1 pt-3 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
              <SparkIcon className="h-3.5 w-3.5" />
              {phase === 'asking' ? `Question ${step + 1} of ${QUESTIONS.length}` : 'Four questions answered'}
            </p>
            <p id="triage-title" className="mt-1.5 truncate text-[13px] text-soft">
              {task}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-faint transition hover:bg-white/60 hover:text-ink dark:hover:bg-white/10"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* step dots */}
        <div className="flex items-center gap-1.5 px-5 pb-1 sm:px-6" aria-hidden="true">
          {QUESTIONS.map((item, index) => {
            const active = phase === 'asking' && index === step;
            const complete = phase !== 'asking' || index < step;
            return (
              <motion.span
                key={item.id}
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                className={cn(
                  'h-1.5 rounded-full',
                  active ? 'w-6 bg-ink' : complete ? 'w-1.5 bg-ink/60' : 'w-1.5 bg-[color:var(--line)]',
                )}
              />
            );
          })}
        </div>

        <div className="thin-scroll min-h-[268px] flex-1 overflow-y-auto px-5 pb-2 pt-4 sm:px-6">
          <AnimatePresence mode="wait" initial={false}>
            {phase === 'asking' && (
              <motion.div key={`q-${step}`} {...slotMotion} transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}>
                <h2 className="max-w-[22ch] text-[26px] leading-[1.12] tracking-[-0.03em] sm:text-[30px]">
                  {question.text}
                </h2>
                <p className="mt-2.5 text-[13px] text-faint">{question.hint}</p>

                <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                  <button
                    ref={primaryRef}
                    type="button"
                    onClick={() => answer(true)}
                    className="group flex h-[52px] flex-1 items-center justify-between rounded-control bg-ink px-4 text-[15px] font-medium text-canvas transition active:scale-[0.99] sm:h-12"
                  >
                    <span>Yes</span>
                    <kbd className="rounded-[6px] border border-white/25 px-1.5 text-[11px] font-semibold text-canvas/70">
                      Y
                    </kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => answer(false)}
                    className="group flex h-[52px] flex-1 items-center justify-between rounded-control border border-[color:var(--line)] bg-white/55 px-4 text-[15px] font-medium text-ink transition hover:bg-white/75 active:scale-[0.99] dark:bg-white/10 dark:hover:bg-white/15 sm:h-12"
                  >
                    <span>No</span>
                    <kbd className="rounded-[6px] border border-[color:var(--line)] px-1.5 text-[11px] font-semibold text-faint">
                      N
                    </kbd>
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={back}
                    disabled={step === 0}
                    className="text-[12.5px] text-soft transition hover:text-ink disabled:cursor-not-allowed disabled:text-faint"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-[12.5px] text-soft underline decoration-[color:var(--line)] underline-offset-4 transition hover:text-ink hover:decoration-current"
                  >
                    Place it myself instead
                  </button>
                </div>
              </motion.div>
            )}

            {phase === 'thinking' && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[240px] flex-col justify-center"
              >
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-q2 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-q2" />
                  </span>
                  <p className="text-[15px] text-soft">Reading your four answers…</p>
                </div>
                <div className="mt-5 space-y-2">
                  {[0, 1, 2].map((line) => (
                    <div
                      key={line}
                      className="h-3 animate-pulse rounded-full bg-[color:var(--line)]"
                      style={{ width: `${[86, 68, 44][line]}%`, animationDelay: `${line * 120}ms` }}
                    />
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {QUESTIONS.map((item) => (
                    <span
                      key={item.id}
                      className={cn(
                        'rounded-pill px-2.5 py-1 text-[11.5px]',
                        answers[item.id] ? 'bg-ink text-canvas' : 'bg-white/60 text-soft dark:bg-white/10',
                      )}
                    >
                      {item.label}: {answers[item.id] ? 'yes' : 'no'}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === 'problem' && problem && (
              <motion.div
                key="problem"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[240px] flex-col justify-center"
              >
                <div className="flex items-start gap-2.5 rounded-control bg-q1t p-3.5">
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-q1" />
                  <p className="text-[14px] leading-[1.5] text-ink">{problem.message}</p>
                </div>
                <p className="mt-3 text-[12.5px] text-faint">
                  The board never needs the sorter to work. Pick a quadrant and move on.
                </p>
              </motion.div>
            )}

            {phase === 'verdict' && verdict && chosenMeta && (
              <motion.div
                key="verdict"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24 }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
                    style={{ backgroundColor: `var(--${chosenMeta.tintVar})`, color: `var(--${chosenMeta.colorVar})` }}
                  >
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                      {verdict.source === 'model' ? 'The sorter says' : 'Rule based estimate'}
                    </p>
                    <h2 className="mt-1 text-[24px] leading-tight tracking-[-0.02em]" style={{ color: `var(--${chosenMeta.colorVar})` }}>
                      {chosenMeta.name}
                    </h2>
                  </div>
                </div>

                <p className="mt-3 text-[15px] leading-[1.55] text-ink">{verdict.title || task}</p>
                <p className="mt-2 text-[13.5px] leading-[1.55] text-soft">{verdict.reason}</p>

                <div className="mt-4 flex items-center gap-2.5">
                  <div className="h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-[color:var(--line)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(verdict.confidence * 100)}%` }}
                      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: `var(--${chosenMeta.colorVar})` }}
                    />
                  </div>
                  <span className="text-[11.5px] tabular-nums text-faint">
                    {Math.round(verdict.confidence * 100)}% confident
                  </span>
                </div>

                {verdict.mode === 'offline' && (
                  <p className="mt-3 rounded-[12px] bg-white/55 px-3 py-2 text-[12px] leading-[1.5] text-soft dark:bg-white/10">
                    No model key is configured, so this came from the four answer rule. The reasoning is the same
                    rule the model is given.
                  </p>
                )}
                {verdict.mode === 'online' && verdict.source === 'heuristic' && (
                  <p className="mt-3 rounded-[12px] bg-white/55 px-3 py-2 text-[12px] leading-[1.5] text-soft dark:bg-white/10">
                    The model did not answer in time, so the four answer rule decided this one.
                  </p>
                )}

                <div className="mt-4">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">Not convinced?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRIORITY_ORDER.map((id) => {
                      const meta = QUADRANT_BY_ID[id];
                      const active = choice === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setChoice(id)}
                          aria-pressed={active}
                          className={cn(
                            'flex items-center gap-1.5 rounded-pill border px-2.5 py-1.5 text-[12.5px] transition',
                            active
                              ? 'border-transparent text-white'
                              : 'border-[color:var(--line)] bg-white/55 text-soft hover:text-ink dark:bg-white/10',
                          )}
                          style={
                            active
                              ? { backgroundColor: `var(--${meta.colorVar})` }
                              : undefined
                          }
                        >
                          {!active && (
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: `var(--${meta.colorVar})` }}
                              aria-hidden="true"
                            />
                          )}
                          {meta.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="mt-3 text-[12px] text-faint">
                  {answeredCount} of {QUESTIONS.length} answers pointed the same way. You always have the last word.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="safe-bottom border-t border-[color:var(--line)] bg-white/35 px-5 py-3 dark:bg-white/5 sm:px-6">
          {phase === 'verdict' && chosenMeta ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-12 shrink-0 rounded-control px-3 text-[13.5px] font-medium text-soft transition hover:text-ink"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => onAccept(verdict?.title || task, choice ?? verdict!.quadrant)}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-control text-[14.5px] font-semibold text-white transition active:scale-[0.99]"
                style={{ backgroundColor: `var(--${chosenMeta.colorVar})` }}
              >
                Add to {chosenMeta.name}
              </button>
            </div>
          ) : (
            <p className="text-center text-[11.5px] text-faint">
              {phase === 'asking'
                ? 'Answer with the keys Y and N, or tap. Escape closes.'
                : phase === 'thinking'
                  ? 'Usually a second or two.'
                  : 'Pick a quadrant above, or close and place it yourself.'}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
