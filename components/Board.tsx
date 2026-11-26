'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Header } from './Header';
import { AddTaskDialog } from './AddTaskDialog';
import { Matrix } from './Matrix';
import { Toast } from './Toast';
import { PlusIcon } from './Icons';
import { useTasks } from '@/lib/useTasks';
import {
  applyTheme,
  exportBoard,
  loadFocus,
  loadTheme,
  readBoardFile,
  saveFocus,
  saveTheme,
  type ThemeChoice,
} from '@/lib/storage';
import { completedRecently } from '@/lib/taskLogic';
import type { TaskDetails } from '@/lib/taskLogic';
import type { QuadrantId } from '@/lib/types';

interface ToastState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function Board() {
  const store = useTasks();
  const [theme, setTheme] = useState<ThemeChoice>('system');
  const [focus, setFocus] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [adding, setAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const hydrated = useRef(false);

  useEffect(() => {
    setTheme(loadTheme());
    setFocus(loadFocus());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!hydrated.current) return;
    saveFocus(focus);
  }, [focus]);

  // One shortcut for the main action, ignored while typing or while the dialog is up.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (adding || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;
      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        setAdding(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [adding]);

  const handleRemove = useCallback(
    (id: string) => {
      const task = store.tasks.find((item) => item.id === id) ?? null;
      store.remove(id);
      if (task) {
        setToast({ message: `Deleted “${task.title}”`, actionLabel: 'Undo', onAction: () => store.restore([task]) });
      }
    },
    [store],
  );

  const handleClearDone = useCallback(() => {
    const removed = store.clearDone();
    if (removed.length) {
      setToast({
        message: `Cleared ${removed.length} completed ${removed.length === 1 ? 'task' : 'tasks'}`,
        actionLabel: 'Undo',
        onAction: () => store.restore(removed),
      });
    }
  }, [store]);

  const handleImport = useCallback(
    async (file: File) => {
      const imported = await readBoardFile(file);
      if (!imported) {
        setToast({ message: 'That file is not a Quadrant board. Nothing changed.' });
        return;
      }
      store.replaceAll(imported);
      setToast({
        message: `Imported ${imported.length} ${imported.length === 1 ? 'task' : 'tasks'}, replacing this board`,
      });
    },
    [store],
  );

  const handleAdd = useCallback(
    (title: string, quadrant: QuadrantId, details: TaskDetails) => {
      store.add(title, quadrant, details);
      setAdding(false);
    },
    [store],
  );

  const started = store.total.open + store.total.done > 0;
  const week = completedRecently(store.tasks);

  return (
    <div id="top">
      <Header theme={theme} onThemeChange={setTheme} />

      <main className="mx-auto max-w-page px-3 pb-16 pt-6 sm:px-6 sm:pt-10">
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
          className="lg:grid lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)] lg:items-center lg:gap-12"
        >
          <div className="px-1">
            <h1 className="max-w-[18ch] text-[34px] leading-[1.02] tracking-[-0.04em] sm:text-[46px] lg:text-[52px]">
              Decide what actually matters
            </h1>
            <p className="mt-3 max-w-[46ch] text-[15px] leading-[1.6] text-soft sm:text-[15.5px]">
              Add a task, answer up to three questions, and the board places it on urgency and importance. You can
              always overrule it.
            </p>
          </div>

          <div className="mt-6 sm:mt-7">
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="glass glass-sheen group flex w-full items-center gap-2 rounded-glass p-1.5 pl-4 text-left transition-shadow duration-300 hover:shadow-lift"
            >
              <span className="min-w-0 flex-1 py-2.5 pl-1 text-[15.5px] text-faint">What needs doing?</span>
              <span className="flex h-11 shrink-0 items-center gap-1.5 rounded-control bg-ink px-3.5 text-[13.5px] font-semibold text-canvas transition group-active:scale-[0.99]">
                <PlusIcon className="h-4 w-4" />
                Add a task
              </span>
            </button>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 text-[12.5px] text-soft">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded-[5px] border border-[color:var(--line)] px-1 text-[10.5px] font-semibold leading-[16px]">
                  N
                </kbd>
                opens the dialog anywhere
              </span>
              <span className="h-3 w-px bg-[color:var(--line)]" aria-hidden="true" />
              <span>Answers are only ever yes or no</span>
              <span className="h-3 w-px bg-[color:var(--line)]" aria-hidden="true" />
              <a href="#decides" className="underline decoration-[color:var(--line)] underline-offset-4 hover:text-ink">
                How it decides
              </a>
            </div>
          </div>
        </motion.section>

        <div className="mt-6 flex flex-col gap-3 border-t border-[color:var(--line)] pt-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="px-1">
            <p className="text-[13px] text-soft">
              {started
                ? `${store.total.open} open · ${store.total.done} done`
                : 'Nothing sorted yet. Add one real task and answer honestly.'}
            </p>
            {week.total > 0 && (
              <p className="mt-0.5 text-[12px] text-faint">{week.total} completed in the last 7 days</p>
            )}
          </div>

          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-1 pb-0.5 sm:justify-end sm:overflow-visible">
            <button
              type="button"
              onClick={() => setFocus((value) => !value)}
              aria-pressed={focus}
              className={
                focus
                  ? 'shrink-0 rounded-pill border border-transparent bg-q2 px-3 py-1.5 text-[12.5px] font-semibold text-white'
                  : 'shrink-0 rounded-pill border border-[color:var(--line)] px-3 py-1.5 text-[12.5px] text-soft transition hover:bg-white/60 hover:text-ink dark:hover:bg-white/10'
              }
            >
              Focus
            </button>
            <span className="h-4 w-px shrink-0 bg-[color:var(--line)]" aria-hidden="true" />
            <button
              type="button"
              onClick={() => exportBoard(store.tasks)}
              disabled={!started}
              className="shrink-0 px-1.5 py-2 text-[12.5px] text-soft transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="shrink-0 px-1.5 py-2 text-[12.5px] text-soft transition hover:text-ink"
            >
              Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only-input"
              aria-label="Import a Quadrant board file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImport(file);
                event.target.value = '';
              }}
            />
            {store.total.done > 0 && (
              <>
                <span className="h-4 w-px shrink-0 bg-[color:var(--line)]" aria-hidden="true" />
                <button
                  type="button"
                  onClick={handleClearDone}
                  className="shrink-0 px-1.5 py-2 text-[12.5px] text-soft transition hover:text-q1"
                >
                  Clear completed
                </button>
              </>
            )}
          </div>
        </div>

        <Matrix
          tasks={store.tasks}
          focus={focus}
          onAdd={store.add}
          onToggle={store.toggle}
          onMove={store.move}
          onReorder={store.reorder}
          onRename={store.rename}
          onSetDue={store.setDue}
          onRemove={handleRemove}
        />
      </main>

      <AnimatePresence>
        {adding && <AddTaskDialog onClose={() => setAdding(false)} onAdd={handleAdd} />}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            actionLabel={toast.actionLabel}
            onAction={toast.onAction}
            onDismiss={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
