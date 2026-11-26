'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  QUESTIONS,
  QUESTION_ORDER,
  decide,
  nextQuestion,
  type DecisionAnswers,
  type DecisionQuestionId,
} from '@/lib/decision';
import { MAX_TITLE, MAX_NOTES, type TaskDetails } from '@/lib/taskLogic';
import { PRIORITY_ORDER, QUADRANT_BY_ID, type QuadrantId } from '@/lib/types';
import { CloseIcon, PlusIcon } from './Icons';

interface AddTaskDialogProps {
  initialTitle?: string;
  onClose: () => void;
  onAdd: (title: string, quadrant: QuadrantId, details: TaskDetails) => void;
}

const spring = { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.7 };

export function AddTaskDialog({ initialTitle = '', onClose, onAdd }: AddTaskDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState('');
  const [due, setDue] = useState('');
  const [answers, setAnswers] = useState<DecisionAnswers>({});
  const [override, setOverride] = useState<QuadrantId | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();

  const question = nextQuestion(answers);
  const decision = useMemo(() => decide(answers), [answers]);
  const quadrant = override ?? decision?.quadrant ?? null;
  const meta = quadrant ? QUADRANT_BY_ID[quadrant] : null;
  // Choosing an area by hand resolves the dialog immediately, even mid questions.
  const resolved = question === null || override !== null;

  const trail = useMemo(
    () => QUESTION_ORDER.filter((id) => answers[id] !== undefined),
    [answers],
  );

  const canAdd = title.trim().length > 0 && quadrant !== null;

  const answer = useCallback(
    (value: boolean) => {
      if (!question) return;
      setAnswers((prev) => ({ ...prev, [question]: value }));
      setOverride(null);
    },
    [question],
  );

  const clearFrom = useCallback((id: DecisionQuestionId) => {
    setAnswers((prev) => {
      const next = { ...prev };
      const from = QUESTION_ORDER.indexOf(id);
      for (const key of QUESTION_ORDER.slice(from)) delete next[key];
      return next;
    });
    setOverride(null);
  }, []);

  const undo = useCallback(() => {
    const last = [...trail].pop();
    if (last) clearFrom(last);
  }, [clearFrom, trail]);

  const submit = useCallback(() => {
    if (!canAdd) return;
    onAdd(title.trim(), quadrant as QuadrantId, { notes, due });
  }, [canAdd, due, notes, onAdd, quadrant, title]);

  useEffect(() => {
    const node = titleRef.current;
    if (node) {
      node.focus();
      const end = node.value.length;
      node.setSelectionRange(end, end);
    }
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input, textarea, [href], [tabindex]:not([tabindex="-1"])',
        );
        if (!nodes || nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }

      const target = event.target as HTMLElement | null;
      const typing = target ? /^(input|textarea)$/i.test(target.tagName) : false;
      if (typing) return;

      if (question && (event.key === 'y' || event.key === 'Y')) {
        event.preventDefault();
        answer(true);
        return;
      }
      if (question && (event.key === 'n' || event.key === 'N')) {
        event.preventDefault();
        answer(false);
        return;
      }
      if (event.key >= '1' && event.key <= '4') {
        event.preventDefault();
        setOverride(PRIORITY_ORDER[Number(event.key) - 1]);
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'Backspace') {
        event.preventDefault();
        undo();
        return;
      }
      if (event.key === 'Enter' && canAdd) {
        event.preventDefault();
        submit();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [answer, canAdd, onClose, question, submit, undo]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <motion.button
        type="button"
        aria-label="Close"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.24 }}
        className="absolute inset-0 cursor-default bg-[color:var(--scrim)] backdrop-blur-[6px]"
        tabIndex={-1}
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Add a task"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.99 }}
        transition={reduce ? { duration: 0.15 } : spring}
        className="glass-sheet relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[24px] sm:max-h-[88dvh] sm:max-w-[620px] sm:rounded-[24px]"
      >
        <header className="flex items-center justify-between gap-3 px-5 pb-1 pt-4 sm:px-6 sm:pt-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-faint">New task</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 flex h-9 w-9 items-center justify-center rounded-full text-faint transition hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-1 sm:px-6">
          <input
            ref={titleRef}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs doing?"
            aria-label="Task"
            maxLength={MAX_TITLE}
            className="w-full bg-transparent py-2 text-[21px] font-medium leading-snug tracking-[-0.02em] text-ink placeholder:text-faint focus:outline-none sm:text-[23px]"
          />

          <div className="mt-3 grid grid-cols-[112px_minmax(0,1fr)] gap-2.5 sm:grid-cols-[132px_minmax(0,1fr)]">
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">Due</span>
              <input
                type="date"
                value={due}
                onChange={(event) => setDue(event.target.value)}
                aria-label="Due date"
                className="field h-10 w-full px-2 text-[13px] text-ink"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">Note</span>
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional context you will want later"
                aria-label="Note"
                maxLength={MAX_NOTES}
                className="field h-10 w-full px-3 text-[13.5px] text-ink placeholder:text-faint"
              />
            </label>
          </div>

          <div className="mt-5 border-t border-[color:var(--line)] pt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-soft">
                {resolved ? (override ? 'Your choice' : 'Placed') : `Question ${trail.length + 1}`}
              </p>
              {!resolved && <span className="text-[11.5px] text-soft">Keys Y or N</span>}
            </div>

            <div className="relative mt-3 min-h-[176px] sm:min-h-[188px]">
              <AnimatePresence mode="wait" initial={false}>
                {question && !resolved ? (
                  <motion.div
                    key={question}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: reduce ? 0.12 : 0.26, ease: [0.22, 0.61, 0.36, 1] }}
                  >
                    <p className="text-[17px] font-medium leading-[1.4] tracking-[-0.01em] text-ink sm:text-[18px]">
                      {QUESTIONS[question].text}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-[1.5] text-soft">{QUESTIONS[question].why}</p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        aria-label="Yes"
                        onClick={() => answer(true)}
                        className="answer group"
                      >
                        <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                          Yes
                          <kbd className="ml-auto rounded-[5px] border border-[color:var(--line)] px-1 text-[10.5px] font-semibold leading-[16px] text-soft">
                            Y
                          </kbd>
                        </span>
                        <span className="mt-1 block text-left text-[12.5px] leading-[1.45] text-soft">
                          {QUESTIONS[question].yes}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label="No"
                        onClick={() => answer(false)}
                        className="answer group"
                      >
                        <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                          No
                          <kbd className="ml-auto rounded-[5px] border border-[color:var(--line)] px-1 text-[10.5px] font-semibold leading-[16px] text-soft">
                            N
                          </kbd>
                        </span>
                        <span className="mt-1 block text-left text-[12.5px] leading-[1.45] text-soft">
                          {QUESTIONS[question].no}
                        </span>
                      </button>
                    </div>

                    {trail.length > 0 && (
                      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                        {trail.map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => clearFrom(id)}
                            aria-label={`Change answer: ${QUESTIONS[id].short}`}
                            className="flex items-center gap-1.5 rounded-pill border border-[color:var(--line)] bg-white/50 px-2 py-1 text-[11.5px] text-soft transition hover:text-ink dark:bg-white/10"
                          >
                            {QUESTIONS[id].short.toLowerCase()}: {answers[id] ? 'yes' : 'no'}
                            <CloseIcon className="h-2.5 w-2.5 opacity-60" />
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={reduce ? { duration: 0.12 } : spring}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: `var(--${(meta ?? QUADRANT_BY_ID.do).colorVar})` }}
                        aria-hidden="true"
                      />
                      <p className="font-display text-[24px] font-semibold tracking-[-0.03em] text-ink">
                        {(meta ?? QUADRANT_BY_ID.do).name}
                      </p>
                      {decision && !override && (
                        <span
                          title="How strongly these answers point to one area"
                          className="ml-auto rounded-pill bg-black/[0.05] px-2 py-1 text-[11.5px] font-medium text-soft dark:bg-white/10"
                        >
                          {Math.round(decision.confidence * 100)}% confident
                        </span>
                      )}
                      {override && (
                        <span className="ml-auto rounded-pill bg-black/[0.05] px-2 py-1 text-[11.5px] font-medium text-soft dark:bg-white/10">
                          Your call
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-[13.5px] leading-[1.55] text-soft">
                      {override ? 'You chose this one, which always wins over the questions.' : decision?.reason}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {decision?.steps.map((step) => (
                        <span
                          key={step.question}
                          className="rounded-pill border border-[color:var(--line)] px-2 py-1 text-[11.5px] text-faint"
                        >
                          {QUESTIONS[step.question].short.toLowerCase()}: {step.answer ? 'yes' : 'no'}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (override && question) {
                          setOverride(null);
                          return;
                        }
                        setAnswers({});
                        setOverride(null);
                      }}
                      className="mt-3 text-[12.5px] font-medium text-soft underline decoration-[color:var(--line)] underline-offset-4 transition hover:text-ink hover:decoration-current"
                    >
                      {override && question ? 'Back to the questions' : 'Answer again'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[color:var(--line)] pt-3">
              <span className="mr-0.5 w-full text-[12px] text-soft sm:w-auto">Or place it in</span>
              {PRIORITY_ORDER.map((id, index) => {
                const option = QUADRANT_BY_ID[id];
                const active = quadrant === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-label={`Place in ${option.name}`}
                    aria-pressed={active}
                    onClick={() => setOverride(id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-pill border px-2.5 py-1.5 text-[12px] transition',
                      active
                        ? 'border-transparent font-medium'
                        : 'border-[color:var(--line)] text-soft hover:bg-white/70 hover:text-ink dark:hover:bg-white/10',
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: `color-mix(in srgb, var(--${option.colorVar}) 14%, transparent)`,
                            color: `var(--${option.colorVar})`,
                          }
                        : undefined
                    }
                  >
                    {!active && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: `var(--${option.colorVar})` }}
                        aria-hidden="true"
                      />
                    )}
                    {option.name}
                    <kbd className="rounded-[4px] border border-current px-1 text-[10px] font-semibold leading-[14px] opacity-70">
                      {index + 1}
                    </kbd>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="safe-bottom border-t border-[color:var(--line)] bg-white/40 px-5 py-3 dark:bg-white/5 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 shrink-0 rounded-control border border-[color:var(--line)] px-3.5 text-[13.5px] font-medium text-soft transition hover:bg-white/60 hover:text-ink dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canAdd}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-control text-[14.5px] font-semibold text-white transition active:scale-[0.995] disabled:cursor-not-allowed disabled:bg-black/[0.07] disabled:text-soft dark:disabled:bg-white/10"
              style={canAdd && meta ? { backgroundColor: `var(--${meta.colorVar})` } : undefined}
            >
              <PlusIcon className="h-4 w-4" />
              {meta ? `Add to ${meta.name}` : title.trim() ? 'Answer to add' : 'Add task'}
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
