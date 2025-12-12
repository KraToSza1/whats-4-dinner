import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

export default function AuthModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Lock background scroll while modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      setEmail('');
      setSent(false);
      setError('');
      setLoading(false);
    };
  }, [open]);

  // Build redirect URL - Supabase needs the exact URL that will receive the callback
  // Use window.location.origin to automatically get the correct port and protocol
  const redirectTo = window.location.origin;

  const sendMagicLink = async e => {
    e?.preventDefault?.();
    if (!email) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (err) {
        console.error('🔐 [AUTH] Magic link error:', err);
        throw err;
      }
      setSent(true);
    } catch (err) {
      console.error('🔐 [AUTH] Magic link failed:', err);
      setError(err.message || 'Failed to send link');
    } finally {
      setLoading(false);
    }
  };

  const signInWith = async provider => {
    setError('');
    setLoading(true);
    try {
      // Build the full redirect URL - Supabase will handle the callback
      // The redirectTo should be the base URL where Supabase will redirect after OAuth
      // Supabase automatically appends the auth callback path
      const fullRedirectTo = redirectTo;

      // Check if we're in a WebView or iframe (Google blocks OAuth in these)
      const isInWebView = 
        /wv|WebView/i.test(navigator.userAgent) ||
        window.self !== window.top; // In an iframe

      if (isInWebView) {
        setError(
          `Google OAuth doesn't work in embedded browsers. Please open this page in your regular browser (Chrome, Firefox, Safari) instead of an in-app browser.`
        );
        setLoading(false);
        return;
      }

      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: fullRedirectTo,
          skipBrowserRedirect: false, // Force full browser redirect (not popup)
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            // Add ux_mode to force redirect mode (helps Google recognize it's a real browser)
            ux_mode: 'redirect',
          },
        },
      });
      if (err) {
        console.error('🔐 [AUTH] OAuth error:', err);
        if (err.message?.includes('provider is not enabled')) {
          setError(
            `Google OAuth is not enabled in Supabase. Please enable it in your Supabase dashboard under Authentication > Providers > Google.`
          );
        } else if (err.message?.includes('redirect_uri_mismatch')) {
          setError(
            `Redirect URL mismatch. Add "${fullRedirectTo}" to your Supabase dashboard under Authentication > URL Configuration > Redirect URLs.`
          );
        } else if (err.message?.includes('disallowed_useragent') || err.message?.includes('403')) {
          setError(
            `Google is blocking this sign-in because it detected an embedded browser. Please try: 1) Using email magic link instead, 2) Opening this page in your regular browser (not an in-app browser), 3) Disabling any browser extensions that might be modifying your user agent, or 4) Clearing your browser cache and cookies.`
          );
        } else {
          setError(err.message || 'OAuth sign-in failed. Please try again.');
        }
        setLoading(false);
      } else if (data?.url) {
        // Redirect immediately - Supabase will handle the OAuth flow
        window.location.href = data.url;
        // Note: User will be redirected, so we don't need to setLoading(false)
      } else {
        console.error('🔐 [AUTH] No redirect URL in OAuth response');
        setError('OAuth sign-in failed. No redirect URL received.');
        setLoading(false);
      }
    } catch (err) {
      console.error('🔐 [AUTH] OAuth exception:', err);
      setError(err.message || 'OAuth sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 xs:p-4 sm:p-6 py-4 xs:py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md max-h-[calc(100vh-1rem)] xs:max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col rounded-2xl xs:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 shadow-2xl border-2 border-slate-700 my-auto overflow-hidden"
      >
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 p-4 xs:p-5 sm:p-6">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-30" />
          <div className="relative flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base xs:text-lg sm:text-xl truncate">Welcome Back</h3>
                <p className="text-emerald-100 text-xs xs:text-sm truncate">
                  Sign in to your account
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-sm flex-shrink-0 touch-manipulation min-h-[44px] xs:min-h-0"
              aria-label="Close modal"
            >
              <svg
                className="w-4 h-4 xs:w-5 xs:h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.button>
          </div>
        </div>
        <div className="overflow-auto flex-1 bg-slate-900/50">
          <form onSubmit={sendMagicLink} className="p-4 xs:p-5 sm:p-6 space-y-3 xs:space-y-4">
            <div className="space-y-1.5 xs:space-y-2">
              <label className="block text-xs xs:text-sm font-semibold text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-2.5 xs:left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    className="w-4 h-4 xs:w-5 xs:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 xs:pl-11 pr-3 xs:pr-4 py-2.5 xs:py-3 text-sm xs:text-base rounded-lg xs:rounded-xl bg-slate-800/50 border-2 border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-500 min-h-[44px] xs:min-h-0"
                  placeholder="your@email.com"
                  autoFocus
                />
              </div>
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 text-sm xs:text-base font-bold rounded-lg xs:rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 min-h-[44px] xs:min-h-0 touch-manipulation"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 xs:h-5 xs:w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Sending…</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 xs:w-5 xs:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>Send Magic Link</span>
                </>
              )}
            </motion.button>
            <AnimatePresence>
              {sent && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-2.5 xs:p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50"
                >
                  <svg
                    className="w-4 h-4 xs:w-5 xs:h-5 text-emerald-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-emerald-400 text-xs xs:text-sm font-medium">
                    Check your email for the magic link!
                  </p>
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-2.5 xs:p-3 rounded-lg bg-red-500/20 border border-red-500/50"
                >
                  <svg
                    className="w-4 h-4 xs:w-5 xs:h-5 text-red-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <p className="text-red-400 text-xs xs:text-sm font-medium break-words">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="px-4 xs:px-5 sm:px-6 pb-4 xs:pb-5 sm:pb-6">
            <div className="flex items-center gap-2 xs:gap-3 my-4 xs:my-5 sm:my-6">
              <span className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
              <span className="text-slate-500 text-xs xs:text-sm font-medium whitespace-nowrap">
                or continue with
              </span>
              <span className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
            </div>
            <div className="space-y-2.5 xs:space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => signInWith('google')}
                className="w-full px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 text-sm xs:text-base rounded-lg xs:rounded-xl border-2 border-slate-700 hover:border-blue-500 hover:bg-blue-500/10 flex items-center justify-center gap-2 xs:gap-3 transition-all group min-h-[44px] xs:min-h-0 touch-manipulation"
              >
                <svg className="w-5 h-5 xs:w-6 xs:h-6 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-semibold group-hover:text-blue-400 transition-colors whitespace-nowrap">
                  Google
                </span>
              </motion.button>
              {/* Apple Sign In - Hidden until user has revenue (requires $99/year Apple Developer Account) */}
              {/* Uncomment when ready:
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => signInWith("apple")}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-700 hover:border-white hover:bg-white/10 flex items-center justify-center gap-3 transition-all group"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                                </svg>
                                <span className="font-semibold">Apple</span>
                            </motion.button>
                            */}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
