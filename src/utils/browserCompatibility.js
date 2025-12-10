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

// Polyfill for Promise (very old browsers)
if (typeof Promise === 'undefined') {
  // Minimal Promise polyfill - for full support, use core-js
  window.Promise = function (executor) {
    const self = this;
    self.state = 'pending';
    self.value = undefined;
    self.handlers = [];

    function resolve(result) {
      if (self.state === 'pending') {
        self.state = 'fulfilled';
        self.value = result;
        self.handlers.forEach(handle);
        self.handlers = null;
      }
    }

    function reject(error) {
      if (self.state === 'pending') {
        self.state = 'rejected';
        self.value = error;
        self.handlers.forEach(handle);
        self.handlers = null;
      }
    }

    function handle(handler) {
      if (self.state === 'pending') {
        self.handlers.push(handler);
      } else {
        if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
          handler.onFulfilled(self.value);
        }
        if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
          handler.onRejected(self.value);
        }
      }
    }

    self.then = function (onFulfilled, onRejected) {
      return new Promise(function (resolve, reject) {
        handle({
          onFulfilled: function (result) {
            try {
              resolve(onFulfilled ? onFulfilled(result) : result);
            } catch (ex) {
              reject(ex);
            }
          },
          onRejected: function (error) {
            try {
              resolve(onRejected ? onRejected(error) : error);
            } catch (ex) {
              reject(ex);
            }
          },
        });
      });
    };

    executor(resolve, reject);
  };
}

// Polyfill for fetch (older browsers)
if (typeof fetch === 'undefined') {
  window.fetch = function (url, options) {
    return new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest();
      const method = (options && options.method) || 'GET';
      const body = options && options.body;

      xhr.open(method, url, true);

      if (options && options.headers) {
        Object.keys(options.headers).forEach(function (key) {
          xhr.setRequestHeader(key, options.headers[key]);
        });
      }

      xhr.onload = function () {
        const response = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          url: xhr.responseURL,
          json: function () {
            return Promise.resolve(JSON.parse(xhr.responseText));
          },
          text: function () {
            return Promise.resolve(xhr.responseText);
          },
          blob: function () {
            return Promise.resolve(new Blob([xhr.response]));
          },
        };
        resolve(response);
      };

      xhr.onerror = function () {
        reject(new Error('Network request failed'));
      };

      xhr.send(body);
    });
  };
}

// Polyfill for URL (older browsers)
if (typeof URL === 'undefined' || typeof URLSearchParams === 'undefined') {
  // Basic URL polyfill
  window.URL = window.URL || function (url, base) {
    if (base) {
      const baseUrl = new URL(base);
      if (url.startsWith('/')) {
        return new URL(url, baseUrl.origin);
      }
      return new URL(url, base);
    }
    const a = document.createElement('a');
    a.href = url;
    return {
      href: a.href,
      origin: a.origin,
      protocol: a.protocol,
      host: a.host,
      hostname: a.hostname,
      port: a.port,
      pathname: a.pathname,
      search: a.search,
      hash: a.hash,
    };
  };

  // Basic URLSearchParams polyfill
  window.URLSearchParams = window.URLSearchParams || function (search) {
    const params = {};
    const pairs = (search || '').replace(/^\?/, '').split('&');
    pairs.forEach(function (pair) {
      const parts = pair.split('=');
      const key = decodeURIComponent(parts[0] || '');
      const value = decodeURIComponent(parts[1] || '');
      if (key) {
        if (params[key]) {
          if (Array.isArray(params[key])) {
            params[key].push(value);
          } else {
            params[key] = [params[key], value];
          }
        } else {
          params[key] = value;
        }
      }
    });

    this.get = function (key) {
      return params[key] || null;
    };
    this.getAll = function (key) {
      return Array.isArray(params[key]) ? params[key] : params[key] ? [params[key]] : [];
    };
    this.has = function (key) {
      return key in params;
    };
    this.set = function (key, value) {
      params[key] = value;
    };
    this.append = function (key, value) {
      if (params[key]) {
        if (Array.isArray(params[key])) {
          params[key].push(value);
        } else {
          params[key] = [params[key], value];
        }
      } else {
        params[key] = value;
      }
    };
    this.delete = function (key) {
      delete params[key];
    };
    this.toString = function () {
      return Object.keys(params)
        .map(function (key) {
          const value = params[key];
          if (Array.isArray(value)) {
            return value.map(function (v) {
              return encodeURIComponent(key) + '=' + encodeURIComponent(v);
            }).join('&');
          }
          return encodeURIComponent(key) + '=' + encodeURIComponent(value);
        })
        .join('&');
    };
  };
}

// Polyfill for IntersectionObserver (older browsers)
if (typeof IntersectionObserver === 'undefined') {
  window.IntersectionObserver = function (callback, options) {
    this.callback = callback;
    this.options = options || {};
    this.elements = [];

    this.observe = function (element) {
      this.elements.push(element);
      // Simple fallback - just call callback immediately
      setTimeout(() => {
        this.callback([{ target: element, isIntersecting: true }], this);
      }, 0);
    };

    this.unobserve = function (element) {
      this.elements = this.elements.filter(el => el !== element);
    };

    this.disconnect = function () {
      this.elements = [];
    };
  };
}

// Polyfill for ResizeObserver (older browsers)
if (typeof ResizeObserver === 'undefined') {
  window.ResizeObserver = function (callback) {
    this.callback = callback;
    this.elements = [];

    this.observe = function (element) {
      this.elements.push(element);
      // Simple fallback - just call callback on window resize
      const handler = () => {
        this.callback([{ target: element }], this);
      };
      window.addEventListener('resize', handler);
      element._resizeObserverHandler = handler;
    };

    this.unobserve = function (element) {
      this.elements = this.elements.filter(el => el !== element);
      if (element._resizeObserverHandler) {
        window.removeEventListener('resize', element._resizeObserverHandler);
        delete element._resizeObserverHandler;
      }
    };

    this.disconnect = function () {
      this.elements.forEach(element => {
        if (element._resizeObserverHandler) {
          window.removeEventListener('resize', element._resizeObserverHandler);
          delete element._resizeObserverHandler;
        }
      });
      this.elements = [];
    };
  };
}

// Polyfill for Array.from (IE11)
if (!Array.from) {
  Array.from = function (arrayLike, mapFn, thisArg) {
    const C = this;
    const items = Object(arrayLike);
    if (arrayLike == null) {
      throw new TypeError('Array.from requires an array-like object - not null or undefined');
    }
    const mapFunction = mapFn ? function (value, index) {
      return mapFn.call(thisArg, value, index);
    } : undefined;
    const length = parseInt(items.length, 10) || 0;
    const A = typeof C === 'function' ? Object(new C(length)) : new Array(length);
    let k = 0;
    while (k < length) {
      const kValue = items[k];
      if (mapFunction) {
        A[k] = mapFunction(kValue, k);
      } else {
        A[k] = kValue;
      }
      k += 1;
    }
    A.length = length;
    return A;
  };
}

// Polyfill for Array.isArray (very old browsers)
if (!Array.isArray) {
  Array.isArray = function (arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

// Polyfill for Number.isNaN (IE11)
if (!Number.isNaN) {
  Number.isNaN = function (value) {
    return typeof value === 'number' && isNaN(value);
  };
}

// Polyfill for Number.isFinite (IE11)
if (!Number.isFinite) {
  Number.isFinite = function (value) {
    return typeof value === 'number' && isFinite(value) && value !== Infinity && value !== -Infinity;
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

// Browser detection
export const detectBrowser = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { name: 'unknown', version: '0', isModern: false };
  }

  const ua = navigator.userAgent;
  let browser = { name: 'unknown', version: '0', isModern: false };

  // Chrome/Edge
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    const match = ua.match(/Chrome\/(\d+)/);
    browser = {
      name: 'chrome',
      version: match ? match[1] : '0',
      isModern: match ? parseInt(match[1], 10) >= 87 : false,
    };
  }
  // Edge
  else if (ua.includes('Edg')) {
    const match = ua.match(/Edg\/(\d+)/);
    browser = {
      name: 'edge',
      version: match ? match[1] : '0',
      isModern: match ? parseInt(match[1], 10) >= 88 : false,
    };
  }
  // Firefox
  else if (ua.includes('Firefox')) {
    const match = ua.match(/Firefox\/(\d+)/);
    browser = {
      name: 'firefox',
      version: match ? match[1] : '0',
      isModern: match ? parseInt(match[1], 10) >= 78 : false,
    };
  }
  // Safari
  else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/(\d+)/);
    browser = {
      name: 'safari',
      version: match ? match[1] : '0',
      isModern: match ? parseInt(match[1], 10) >= 14 : false,
    };
  }
  // IE
  else if (ua.includes('MSIE') || ua.includes('Trident')) {
    const match = ua.match(/(?:MSIE |rv:)(\d+)/);
    browser = {
      name: 'ie',
      version: match ? match[1] : '0',
      isModern: false,
    };
  }

  return browser;
};

// Initialize compatibility layer
export const initBrowserCompatibility = () => {
  if (typeof window === 'undefined') return;

  const browser = detectBrowser();

  // Log browser info in dev mode
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.log('🌐 Browser Compatibility Check:', {
      browser: browser.name,
      version: browser.version,
      isModern: browser.isModern,
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

  // Show warning for very old browsers
  if (!browser.isModern && browser.name !== 'unknown') {
    console.warn(
      `⚠️ You are using an older version of ${browser.name} (${browser.version}). Some features may not work correctly. Please update your browser.`
    );
  }
};

// Auto-initialize
if (typeof window !== 'undefined') {
  initBrowserCompatibility();
}
