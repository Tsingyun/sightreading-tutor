/**
 * ToastSystem 组件
 * ============================================
 * 右下角非侵入式通知。每条 toast 4 秒后自动消失。
 * 使用 AnimatePresence 实现从右侧滑入 / 滑出 + 淡入 / 淡出。
 */

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ToastItem } from '../types';

interface ToastSystemProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

/** 单条 toast：内部维护 4 秒自动消失计时器 */
function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      className={`toast toast--${toast.variant}`}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onDismiss(toast.id)}
      role="status"
    >
      <span className="toast__icon">{toast.icon}</span>
      <div className="toast__content">
        <div className="toast__title">{toast.title}</div>
        <div className="toast__message">{toast.message}</div>
      </div>
    </motion.div>
  );
}

export function ToastSystem({ toasts, onDismiss }: ToastSystemProps) {
  return (
    <div className="toast-container">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
