import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Composer } from './components/Composer';
import { Matrix } from './components/Matrix';
import { Explainer } from './components/Explainer';
import { Toast } from './components/Toast';
import { useTasks } from './lib/useTasks';
import {
  applyTheme,
  exportBoard,
  loadFocus,
  loadTheme,
  readBoardFile,
  saveFocus,
  saveTheme,
  type ThemeChoice,
} from './lib/storage';
import { completedRecently } from './lib/taskLogic';

interface ToastState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function App() {
  const store = useTasks();
  const [theme, setTheme] = useState<ThemeChoice>(() => loadTheme());
  const [focus, setFocus] = useState<boolean>(() => loadFocus());
  const [toast, setToast] = useState<ToastState | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveFocus(focus);
  }, [focus]);

  const handleRemove = useCallback(
    (id: string) => {
      const task = store.tasks.find((item) => item.id === id) ?? null;
      store.remove(id);
      if (task) {
        setToast({
          message: `Deleted “${task.title}”`,
          actionLabel: 'Undo',
          onAction: () => store.restore([task]),
        });
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
        setToast({
          message: 'That file is not a Quadrant board. Nothing changed.',
        });
        return;
      }
      store.replaceAll(imported);
      setToast({
        message: `Imported ${imported.length} ${imported.length === 1 ? 'task' : 'tasks'}, replacing this board`,
      });
    },
    [store],
  );

  const started = store.total.open + store.total.done > 0;
  const week = completedRecently(store.tasks);

  return (
    <div id="top" className="min-h-dvh">
      <Header theme={theme} onThemeChange={setTheme} />

      <main className="mx-auto max-w-page px-5 pb-24 pt-8 sm:px-8 sm:pt-10">
        <section className="fade-rise lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:items-end lg:gap-12">
          <div>
            <h1 className="max-w-[18ch] text-[33px] leading-[1.05] tracking-[-0.035em] sm:text-[42px] lg:text-[46px]">
              Decide what actually matters
            </h1>
            <p className="mt-3 max-w-[46ch] text-[15px] leading-[1.6] text-soft sm:text-[15.5px]">
              Most task lists treat every item as urgent. Sort your work by urgency and importance instead, and
              the things that move your week stop losing to the things that are simply loud.
            </p>
          </div>

          <Composer onAdd={store.add} />
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-line pt-3">
          <div>
            <p className="text-[13px] text-soft">
              {started
                ? `${store.total.open} open · ${store.total.done} done`
                : 'Nothing sorted yet. Add one real task and place it honestly.'}
            </p>
            {week.total > 0 && (
              <p className="mt-0.5 text-[12px] text-faint">
                {week.total} completed in the last 7 days
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              type="button"
              onClick={() => setFocus((value) => !value)}
              aria-pressed={focus}
              className={
                focus
                  ? 'rounded-pill border border-q2 bg-q2t px-2.5 py-1 text-[12.5px] font-medium text-ink'
                  : 'rounded-pill border border-line px-2.5 py-1 text-[12.5px] text-soft transition hover:border-line-strong hover:text-ink'
              }
            >
              Focus
            </button>

            <span className="h-4 w-px bg-line" aria-hidden="true" />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => exportBoard(store.tasks)}
                disabled={!started}
                className="text-[12.5px] text-soft underline decoration-line underline-offset-4 transition hover:text-ink hover:decoration-current disabled:cursor-not-allowed disabled:text-faint disabled:no-underline"
              >
                Export
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-[12.5px] text-soft underline decoration-line underline-offset-4 transition hover:text-ink hover:decoration-current"
              >
                Import
              </button>
            </div>

            {store.total.done > 0 && (
              <>
                <span className="h-4 w-px bg-line" aria-hidden="true" />
                <button
                  type="button"
                  onClick={handleClearDone}
                  className="text-[12.5px] text-soft underline decoration-line underline-offset-4 transition hover:text-q1 hover:decoration-q1"
                >
                  Clear completed
                </button>
              </>
            )}

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

        <Explainer />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-page flex-col gap-2 px-5 py-8 text-[12.5px] text-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Quadrant keeps your board in this browser only. Export it if you want a copy.</p>
          <p>Built on the Eisenhower method, popularised by Stephen Covey.</p>
        </div>
      </footer>

      {toast && (
        <Toast
          message={toast.message}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
