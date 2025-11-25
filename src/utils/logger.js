/**
 * Production-safe logging utility
 * Removes console.log in production, keeps errors and warnings
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

class Logger {
  log(...args) {
    if (isDevelopment) {
      console.log(...args);
    }
  }

  error(...args) {
    // Always log errors, even in production
    console.error(...args);

    // In production, you might want to send to error tracking service
    if (isProduction && typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(new Error(args.join(' ')));
    }
  }

  warn(...args) {
    // Always log warnings
    console.warn(...args);
  }

  info(...args) {
    if (isDevelopment) {
      console.info(...args);
    }
  }

  debug(...args) {
    if (isDevelopment) {
      console.debug(...args);
    }
  }

  // Grouped logging for better organization
  group(label, ...args) {
    if (isDevelopment) {
      console.group(label);
      this.log(...args);
      console.groupEnd();
    }
  }

  // Table logging for objects/arrays
  table(data) {
    if (isDevelopment) {
      console.table(data);
    }
  }
}

export const logger = new Logger();
export default logger;
