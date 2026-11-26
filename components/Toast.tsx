'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
}

export function Toast({ message, actionLabel, onAction, onDismiss }: ToastProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 6000);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        role="status"
        aria-live="polite"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        className="glass glass-sheen pointer-events-auto fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] mx-auto flex max-w-md items-center justify-between gap-3 rounded-glass px-4 py-3 text-[13.5px] sm:inset-x-auto sm:right-6 sm:mx-0"
      >
        <span className="text-soft">{message}</span>
        {actionLabel && (
          <button
            type="button"
            onClick={() => {
              onAction?.();
              onDismiss();
            }}
            className="shrink-0 rounded-[10px] px-2 py-1.5 font-medium text-ink underline decoration-line underline-offset-4 transition hover:decoration-current"
          >
            {actionLabel}
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
