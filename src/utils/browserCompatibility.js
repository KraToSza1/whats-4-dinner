/**
 * Browser Compatibility Utilities
 * Ensures the app works on ALL browsers including older ones
 */

// Safe localStorage wrapper with fallback
export const safeLocalStorage = {
  getItem: key => {
    try {
      if (typeof Storage !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // localStorage might be disabled or quota exceeded
      console.warn('localStorage.getItem failed:', e);
    }
    return null;
  },
  setItem: (key, value) => {
    try {
      if (typeof Storage !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return true;
      }
    } catch (e) {
      // localStorage might be disabled, quota exceeded, or in private mode
      console.warn('localStorage.setItem failed:', e);
    }
    return false;
  },
  removeItem: key => {
    try {
      if (typeof Storage !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return true;
      }
    } catch (e) {
      console.warn('localStorage.removeItem failed:', e);
    }
    return false;
  },
  clear: () => {
    try {
      if (typeof Storage !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
        return true;
      }
    } catch (e) {
      console.warn('localStorage.clear failed:', e);
    }
    return false;
  },
};

// Safe sessionStorage wrapper with fallback
export const safeSessionStorage = {
  getItem: key => {
    try {
      if (typeof Storage !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch (e) {
      console.warn('sessionStorage.getItem failed:', e);
    }
    return null;
  },
  setItem: (key, value) => {
    try {
      if (typeof Storage !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
        return true;
      }
    } catch (e) {
      console.warn('sessionStorage.setItem failed:', e);
    }
    return false;
  },
  removeItem: key => {
    try {
      if (typeof Storage !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
        return true;
      }
    } catch (e) {
      console.warn('sessionStorage.removeItem failed:', e);
    }
    return false;
  },
};

// Safe JSON parse with fallback
export const safeJSONParse = (str, fallback = null) => {
  try {
    if (typeof str === 'string' && str.length > 0) {
      return JSON.parse(str);
    }
  } catch (e) {
    console.warn('JSON.parse failed:', e);
  }
  return fallback;
};

// Safe JSON stringify with fallback
export const safeJSONStringify = (obj, fallback = '') => {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    console.warn('JSON.stringify failed:', e);
    return fallback;
  }
};

// Check if feature is supported
export const isFeatureSupported = {
  localStorage: () => {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },
  sessionStorage: () => {
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },
  fetch: () => typeof fetch !== 'undefined',
  Promise: () => typeof Promise !== 'undefined',
  asyncAwait: () => {
    try {
      eval('(async () => {})');
      return true;
    } catch {
      return false;
    }
  },
  intersectionObserver: () => typeof IntersectionObserver !== 'undefined',
  resizeObserver: () => typeof ResizeObserver !== 'undefined',
  webShare: () => typeof navigator !== 'undefined' && 'share' in navigator,
  serviceWorker: () => 'serviceWorker' in navigator,
};

// Polyfill for Array.includes (IE11)
if (!Array.prototype.includes) {
  Array.prototype.includes = function (searchElement, fromIndex) {
    if (this == null) {
      throw new TypeError('"this" is null or not defined');
    }
    const o = Object(this);
    const len = parseInt(o.length, 10) || 0;
    if (len === 0) {
      return false;
    }
    const n = parseInt(fromIndex, 10) || 0;
    let k = n >= 0 ? n : Math.max(len + n, 0);
    function sameValueZero(x, y) {
      return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
    }
    for (; k < len; k++) {
      if (sameValueZero(o[k], searchElement)) {
        return true;
      }
    }
    return false;
  };
}

// Polyfill for Array.find (IE11)
if (!Array.prototype.find) {
  Array.prototype.find = function (predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    const list = Object(this);
    const length = parseInt(list.length, 10) || 0;
    const thisArg = arguments[1];
    let value;
    for (let i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

// Polyfill for Array.findIndex (IE11)
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function (predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.findIndex called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    const list = Object(this);
    const length = parseInt(list.length, 10) || 0;
    const thisArg = arguments[1];
    let value;
    for (let i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}

// Polyfill for String.includes (IE11)
if (!String.prototype.includes) {
  String.prototype.includes = function (search, start) {
    if (typeof start !== 'number') {
      start = 0;
    }
    if (start + search.length > this.length) {
      return false;
    }
    return this.indexOf(search, start) !== -1;
  };
}

// Polyfill for String.startsWith (IE11)
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (searchString, position) {
    position = position || 0;
    return this.substr(position, searchString.length) === searchString;
  };
}

// Polyfill for String.endsWith (IE11)
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function (searchString, length) {
    if (length === undefined || length > this.length) {
      length = this.length;
    }
    return this.substring(length - searchString.length, length) === searchString;
  };
}

// Polyfill for Object.assign (IE11)
if (typeof Object.assign !== 'function') {
  Object.assign = function (target) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    const to = Object(target);
    for (let index = 1; index < arguments.length; index++) {
      const nextSource = arguments[index];
      if (nextSource != null) {
        for (const nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}

// Safe window.location access
export const safeLocation = {
  get href() {
    return typeof window !== 'undefined' && window.location ? window.location.href : '';
  },
  get origin() {
    return typeof window !== 'undefined' && window.location ? window.location.origin : '';
  },
  get pathname() {
    return typeof window !== 'undefined' && window.location ? window.location.pathname : '';
  },
  get search() {
    return typeof window !== 'undefined' && window.location ? window.location.search : '';
  },
  reload: () => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  },
};

// Safe navigator access
export const safeNavigator = {
  get language() {
    return typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';
  },
  get languages() {
    return typeof navigator !== 'undefined' && navigator.languages
      ? navigator.languages
      : ['en-US'];
  },
  get userAgent() {
    return typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : '';
  },
  share: data => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      return navigator.share(data);
    }
    return Promise.reject(new Error('Web Share API not supported'));
  },
};

// Initialize compatibility layer
export const initBrowserCompatibility = () => {
  if (typeof window === 'undefined') return;

  // Log browser info in dev mode
  if (import.meta.env?.DEV) {
    console.log('🌐 Browser Compatibility Check:', {
      localStorage: isFeatureSupported.localStorage(),
      sessionStorage: isFeatureSupported.sessionStorage(),
      fetch: isFeatureSupported.fetch(),
      Promise: isFeatureSupported.Promise(),
      webShare: isFeatureSupported.webShare(),
      serviceWorker: isFeatureSupported.serviceWorker(),
      userAgent: safeNavigator.userAgent,
    });
  }

  // Warn if critical features are missing
  if (!isFeatureSupported.fetch()) {
    console.error('❌ Fetch API not supported - app may not work correctly');
  }
  if (!isFeatureSupported.Promise()) {
    console.error('❌ Promise not supported - app will not work');
  }
};

// Auto-initialize
if (typeof window !== 'undefined') {
  initBrowserCompatibility();
}
