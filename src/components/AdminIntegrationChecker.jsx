import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

/**
 * Admin Integration Checker
 * Verifies Vercel, Paddle, and Supabase integrations are properly configured
 */
export default function AdminIntegrationChecker() {
  const [checks, setChecks] = useState({
    supabase: { status: 'checking', message: 'Checking...' },
    paddle: { status: 'checking', message: 'Checking...' },
    vercel: { status: 'checking', message: 'Checking...' },
  });
  const [loading, setLoading] = useState(true);

  const checkSupabase = useCallback(async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return {
          status: 'error',
          message: 'Missing environment variables',
          details: `URL: ${supabaseUrl ? '✅' : '❌'}, Key: ${supabaseKey ? '✅' : '❌'}`,
        };
      }

      // Test connection
      const { error } = await supabase.from('recipes').select('id').limit(1);

      if (error) {
        return {
          status: 'error',
          message: 'Connection failed',
          details: error.message,
        };
      }

      // Check if key is correct type
      const isAnonKey = supabaseKey.includes('anon') || supabaseKey.includes('eyJ');
      if (!isAnonKey) {
        return {
          status: 'warning',
          message: 'Key format suspicious',
          details: "Make sure you're using the ANON key, not SERVICE_ROLE key",
        };
      }

      return {
        status: 'success',
        message: 'Connected successfully',
        details: `URL: ${supabaseUrl.substring(0, 30)}...`,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Check failed',
        details: error.message,
      };
    }
  }, []);

  const checkPaddle = useCallback(async () => {
    try {
      const paddleToken =
        import.meta.env.VITE_PADDLE_PUBLIC_TOKEN ||
        import.meta.env.VITE_PADDLE_CLIENT_TOKEN ||
        import.meta.env.VITE_PADDLE_TOKEN;

      if (!paddleToken) {
        return {
          status: 'error',
          message: 'No Paddle token found',
          details: 'Set VITE_PADDLE_PUBLIC_TOKEN in Vercel',
        };
      }

      const isSandbox = paddleToken.startsWith('test_');
      const isProduction = paddleToken.startsWith('live_');

      if (!isSandbox && !isProduction) {
        return {
          status: 'warning',
          message: 'Token format invalid',
          details: 'Token should start with "test_" (sandbox) or "live_" (production)',
        };
      }

      // Check if Paddle.js is loaded
      const paddleLoaded = typeof window !== 'undefined' && window.Paddle;

      return {
        status: paddleLoaded ? 'success' : 'warning',
        message: `${isSandbox ? 'Sandbox' : 'Production'} token found`,
        details: paddleLoaded
          ? 'Paddle.js loaded successfully'
          : 'Paddle.js not loaded (may need page refresh)',
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Check failed',
        details: error.message,
      };
    }
  }, []);

  const checkVercel = useCallback(async () => {
    try {
      const isVercel =
        window.location.hostname.includes('vercel.app') ||
        import.meta.env.VITE_VERCEL_ENV ||
        import.meta.env.VERCEL;

      if (!isVercel && import.meta.env.PROD) {
        return {
          status: 'warning',
          message: 'Not detected on Vercel',
          details: 'App may be deployed elsewhere',
        };
      }

      // Check Vercel environment
      const vercelEnv = import.meta.env.VITE_VERCEL_ENV || import.meta.env.VERCEL_ENV || 'unknown';

      return {
        status: isVercel ? 'success' : 'info',
        message: isVercel ? 'Deployed on Vercel' : 'Local development',
        details: `Environment: ${vercelEnv}`,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Check failed',
        details: error.message,
      };
    }
  }, []);

  const runChecks = useCallback(async () => {
    setLoading(true);
    const results = {
      supabase: await checkSupabase(),
      paddle: await checkPaddle(),
      vercel: await checkVercel(),
    };
    setChecks(results);
    setLoading(false);
  }, [checkSupabase, checkPaddle, checkVercel]);

  useEffect(() => {
    runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusIcon = status => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'success':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'border-amber-500 bg-amber-50 dark:bg-amber-900/20';
      default:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Integration Status</h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={runChecks}
          disabled={loading}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Supabase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border-2 ${getStatusColor(checks.supabase.status)}`}
        >
          <div className="flex items-start gap-3">
            {getStatusIcon(checks.supabase.status)}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Supabase</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                {checks.supabase.message}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {checks.supabase.details}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Paddle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-4 rounded-xl border-2 ${getStatusColor(checks.paddle.status)}`}
        >
          <div className="flex items-start gap-3">
            {getStatusIcon(checks.paddle.status)}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Paddle</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                {checks.paddle.message}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">{checks.paddle.details}</p>
            </div>
          </div>
        </motion.div>

        {/* Vercel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-4 rounded-xl border-2 ${getStatusColor(checks.vercel.status)}`}
        >
          <div className="flex items-start gap-3">
            {getStatusIcon(checks.vercel.status)}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Vercel</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                {checks.vercel.message}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">{checks.vercel.details}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2 pt-2">
        <a
          href="https://app.supabase.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Supabase Dashboard
        </a>
        <a
          href="https://vendors.paddle.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Paddle Dashboard
        </a>
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Vercel Dashboard
        </a>
      </div>
    </div>
  );
}
