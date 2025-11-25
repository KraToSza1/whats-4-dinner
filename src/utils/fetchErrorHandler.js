/**
 * Better error handling for fetch failures
 * Provides user-friendly error messages
 */

export function handleFetchError(error, context = '') {
  console.error(`[Fetch Error${context ? `: ${context}` : ''}]`, error);

  // Network errors (no internet, CORS, etc.)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Network error. Please check your internet connection.',
      type: 'network',
      userMessage: 'Unable to connect. Please check your internet connection and try again.',
    };
  }

  // CORS errors
  if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
    return {
      message: 'CORS error - cross-origin request blocked',
      type: 'cors',
      userMessage: 'Connection blocked. Please try refreshing the page.',
    };
  }

  // Timeout errors
  if (error.message.includes('timeout') || error.name === 'TimeoutError') {
    return {
      message: 'Request timeout',
      type: 'timeout',
      userMessage: 'Request took too long. Please try again.',
    };
  }

  // Abort errors
  if (error.name === 'AbortError') {
    return {
      message: 'Request aborted',
      type: 'abort',
      userMessage: 'Request was cancelled.',
    };
  }

  // Generic error
  return {
    message: error.message || 'Unknown error',
    type: 'unknown',
    userMessage: 'Something went wrong. Please try again.',
  };
}

export async function safeFetch(url, options = {}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }

    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw error;
  }
}
