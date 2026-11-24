import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Composer } from './components/Composer';
import { Matrix } from './components/Matrix';
import { Explainer } from './components/Explainer';
import { Toast } from './components/Toast';
import { useTasks } from './lib/useTasks';
import { applyTheme, loadTheme, saveTheme, type ThemeChoice } from './lib/storage';
import type { Task } from './lib/types';

export default function App() {
  const store = useTasks();
  const [theme, setTheme] = useState<ThemeChoice>(() => loadTheme());
  const [removed, setRemoved] = useState<Task | null>(null);

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  const handleRemove = useCallback(
    (id: string) => {
      const task = store.tasks.find((item) => item.id === id) ?? null;
      store.remove(id);
      setRemoved(task);
    },
    [store],
  );

  const started = store.total.open + store.total.done > 0;

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

        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-3">
          <p className="text-[13px] text-soft">
            {started ? `${store.total.open} open · ${store.total.done} done` : 'Nothing sorted yet. Add one real task and place it honestly.'}
          </p>
          {store.total.done > 0 && (
            <button
              type="button"
              onClick={store.clearDone}
              className="text-[12.5px] text-soft underline decoration-line underline-offset-4 transition hover:text-ink hover:decoration-current"
            >
              Clear completed
            </button>
          )}
        </div>

        <Matrix
          tasks={store.tasks}
          onAdd={store.add}
          onToggle={store.toggle}
          onMove={store.move}
          onRename={store.rename}
          onRemove={handleRemove}
        />

        <Explainer />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-page flex-col gap-2 px-5 py-8 text-[12.5px] text-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Quadrant keeps your board in this browser only. No account, no server, no analytics.</p>
          <p>Built on the Eisenhower method, popularised by Stephen Covey.</p>
        </div>
      </footer>

      {removed && (
        <Toast
          message={`Deleted “${removed.title}”`}
          actionLabel="Undo"
          onAction={() => store.restore(removed)}
          onDismiss={() => setRemoved(null)}
        />
      )}
    </div>
  );
}
