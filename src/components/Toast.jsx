import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback(
    (message, duration) => addToast(message, 'success', duration),
    [addToast]
  );
  const error = useCallback(
    (message, duration) => addToast(message, 'error', duration),
    [addToast]
  );
  const warning = useCallback(
    (message, duration) => addToast(message, 'warning', duration),
    [addToast]
  );
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback for components outside provider
    return {
      success: msg => console.log('✅', msg),
      error: msg => console.error('❌', msg),
      warning: msg => console.warn('⚠️', msg),
      info: msg => console.info('ℹ️', msg),
    };
  }
  return context;
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div
      className="fixed bottom-4 left-4 right-4 xs:bottom-auto xs:top-4 xs:left-auto xs:right-4 z-[9999] flex flex-col gap-2 xs:gap-3 max-w-md xs:max-w-lg w-full xs:w-auto pointer-events-none px-2 xs:px-0"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({ toast, onClose }) {
  const { message, type } = toast;

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success:
      'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100',
    error:
      'bg-red-50 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100',
    warning:
      'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100',
  };

  const iconColors = {
    success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50',
    error: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50',
    warning: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50',
    info: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50',
  };

  const Icon = icons[type] || Info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }}
      className={`${colors[type]} border-2 rounded-xl xs:rounded-2xl shadow-2xl p-3 xs:p-4 pointer-events-auto flex items-start gap-2.5 xs:gap-3 w-full xs:min-w-[320px] xs:max-w-md backdrop-blur-sm`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div
        className={`w-8 h-8 xs:w-10 xs:h-10 rounded-lg xs:rounded-xl flex items-center justify-center shrink-0 ${iconColors[type]} bg-white/50 dark:bg-black/20`}
      >
        <Icon className={`w-4 h-4 xs:w-5 xs:h-5`} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5 xs:pt-1">
        <div className="text-sm xs:text-base font-semibold xs:font-bold break-words whitespace-pre-line leading-relaxed">
          {message}
        </div>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 dark:text-slate-500 transition-colors p-1.5 xs:p-2 -mt-1 -mr-1 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Close notification"
      >
        <X className="w-4 h-4 xs:w-5 xs:h-5" />
      </button>
    </motion.div>
  );
}
