import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000, action = null) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration, action };
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
    (message, duration, action) => addToast(message, 'success', duration, action),
    [addToast]
  );
  const error = useCallback(
    (message, duration, action) => addToast(message, 'error', duration, action),
    [addToast]
  );
  const warning = useCallback(
    (message, duration, action) => addToast(message, 'warning', duration, action),
    [addToast]
  );
  const info = useCallback(
    (message, duration, action) => addToast(message, 'info', duration, action),
    [addToast]
  );

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
      className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-4 sm:left-auto sm:right-4 z-[9999] flex flex-col-reverse sm:flex-col gap-2 sm:gap-3 max-w-full sm:max-w-md md:max-w-lg w-full sm:w-auto pointer-events-none px-2 sm:px-0 pb-safe sm:pb-0"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({ toast, onClose }) {
  const { message, type, action } = toast;

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

  // Handle click/touch to dismiss
  const handleClick = (e) => {
    // Don't dismiss if clicking action button or close button
    if (e.target.closest('button')) {
      return;
    }
    onClose();
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95, x: 0 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ 
        opacity: 0, 
        scale: 0.95, 
        y: 20,
        x: 300,
        transition: { duration: 0.2 } 
      }}
      onClick={handleClick}
      className={`${colors[type]} border-2 rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-4 pointer-events-auto flex flex-col sm:flex-row items-start gap-2.5 sm:gap-3 w-full sm:min-w-[320px] sm:max-w-md backdrop-blur-sm cursor-pointer active:scale-[0.98] transition-transform touch-manipulation`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-2.5 sm:gap-3 w-full sm:w-auto">
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${iconColors[type]} bg-white/50 dark:bg-black/20`}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
          <div className="text-sm sm:text-base font-semibold sm:font-bold break-words whitespace-pre-line leading-relaxed">
            {message}
          </div>
          {action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
                if (action.dismissOnClick !== false) {
                  onClose();
                }
              }}
              className="mt-2 sm:mt-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-white/80 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 border border-current/20 transition-colors touch-manipulation min-h-[36px] sm:min-h-[40px]"
            >
              {action.label || 'Action'}
            </button>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 dark:text-slate-500 transition-colors p-1.5 sm:p-2 -mt-1 -mr-1 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center self-start"
          aria-label="Close notification"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </motion.div>
  );
}
