/**
 * Debug endpoint to see what environment variables are available
 * This will help us figure out why PADDLE_VENDOR_ID isn't loading
 */
/* eslint-disable no-undef */
export default async function handler(req, res) {
  // Only allow in development
  if (process.env.VERCEL_ENV === 'production') {
    res.status(403).json({ error: 'Not available in production' });
    return;
  }

  const origin = req.headers.origin;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get all PADDLE variables (without exposing full values)
  const paddleVars = {};
  const allEnvKeys = Object.keys(process.env);

  allEnvKeys
    .filter(key => key.startsWith('PADDLE'))
    .forEach(key => {
      const value = process.env[key];
      paddleVars[key] = {
        exists: true,
        length: value?.length || 0,
        firstChars: value ? value.substring(0, 10) + '...' : 'undefined',
        hasQuotes: value ? value.startsWith('"') && value.endsWith('"') : false,
        rawValue: value, // Show full value for debugging
      };
    });

  res.status(200).json({
    message: 'Environment variables debug',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    paddleVariables: paddleVars,
    allPaddleKeys: allEnvKeys.filter(k => k.startsWith('PADDLE')),
    totalPaddleVars: allEnvKeys.filter(k => k.startsWith('PADDLE')).length,
    // Check specific ones
    checks: {
      PADDLE_VENDOR_ID: {
        exists: !!process.env.PADDLE_VENDOR_ID,
        value: process.env.PADDLE_VENDOR_ID || 'NOT SET',
        length: process.env.PADDLE_VENDOR_ID?.length || 0,
      },
      PADDLE_API_KEY: {
        exists: !!process.env.PADDLE_API_KEY,
        value: process.env.PADDLE_API_KEY
          ? process.env.PADDLE_API_KEY.substring(0, 20) + '...'
          : 'NOT SET',
        length: process.env.PADDLE_API_KEY?.length || 0,
      },
      PADDLE_ENV: {
        exists: !!process.env.PADDLE_ENV,
        value: process.env.PADDLE_ENV || 'NOT SET',
      },
    },
  });
}
