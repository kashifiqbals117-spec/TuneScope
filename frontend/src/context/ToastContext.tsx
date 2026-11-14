import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep at most 5 toasts at once

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback((message: string, title?: string) => {
    return showToast({ type: 'success', title: title || 'Success', message });
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    return showToast({ type: 'error', title: title || 'Notice', message });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    return showToast({ type: 'warning', title: title || 'Attention', message });
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    return showToast({ type: 'info', title: title || 'Information', message });
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Internal Container Component
const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
          info: <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-500/20 bg-dark-900/95 text-emerald-200',
          error: 'border-rose-500/20 bg-dark-900/95 text-rose-200',
          warning: 'border-amber-500/20 bg-dark-900/95 text-amber-200',
          info: 'border-cyan-500/20 bg-dark-900/95 text-cyan-200',
        };

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-in ${borders[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <p className="text-xs font-bold text-white tracking-wide uppercase mb-0.5">
                  {toast.title}
                </p>
              )}
              <p className="text-xs text-slate-300 leading-relaxed break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition flex-shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
