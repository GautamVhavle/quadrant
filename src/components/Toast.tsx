import { useEffect } from 'react';

interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
}

export function Toast({ message, actionLabel, onAction, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 6000);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fade-rise fixed inset-x-4 bottom-4 z-50 mx-auto flex w-auto max-w-sm items-center justify-between gap-3 rounded-control border border-line bg-surface px-3.5 py-2.5 text-[13.5px] shadow-[0_18px_40px_-20px_rgba(20,26,23,0.6)] sm:inset-x-auto sm:right-6 sm:mx-0"
    >
      <span className="text-soft">{message}</span>
      {actionLabel && (
        <button
          type="button"
          onClick={() => {
            onAction?.();
            onDismiss();
          }}
          className="shrink-0 rounded-[5px] px-2 py-1 font-medium text-ink underline decoration-line underline-offset-4 transition hover:decoration-current"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
