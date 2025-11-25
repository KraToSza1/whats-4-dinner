/**
 * Environment Variable Validation
 * Validates required environment variables on app startup
 */

const REQUIRED_ENV_VARS = {
  // Supabase - Required for auth and database
  VITE_SUPABASE_URL: {
    required: true,
    description: 'Supabase project URL',
    validate: value => value && value.startsWith('https://') && value.includes('.supabase.co'),
  },
  VITE_SUPABASE_ANON_KEY: {
    required: true,
    description: 'Supabase anonymous key',
    validate: value => value && value.length > 20,
  },
};

const OPTIONAL_ENV_VARS = {
  VITE_SPOONACULAR_KEY: {
    description: 'Spoonacular API key (optional if using Supabase only)',
  },
  VITE_DISABLE_SPOONACULAR: {
    description: 'Disable Spoonacular API',
  },
  VITE_DISABLE_IMAGE_PROXY: {
    description: 'Disable image proxy',
  },
};

export function validateEnvironment() {
  const missing = [];
  const invalid = [];
  const warnings = [];

  // Check required variables
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
    const value = import.meta.env[key];

    if (!value) {
      if (config.required) {
        missing.push({ key, description: config.description });
      }
    } else if (config.validate && !config.validate(value)) {
      invalid.push({ key, description: config.description, value: value.substring(0, 20) + '...' });
    }
  });

  // Check optional variables and warn if missing
  Object.entries(OPTIONAL_ENV_VARS).forEach(([key, config]) => {
    const value = import.meta.env[key];
    if (!value && import.meta.env.PROD) {
      warnings.push({ key, description: config.description });
    }
  });

  // Log errors in development
  if (import.meta.env.DEV) {
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(({ key, description }) => {
        console.error(`  - ${key}: ${description}`);
      });
      console.error('\n💡 Add these to your .env.local file or Vercel environment variables');
    }

    if (invalid.length > 0) {
      console.warn('⚠️ Invalid environment variables:');
      invalid.forEach(({ key, description, value }) => {
        console.warn(`  - ${key}: ${description} (current: ${value})`);
      });
    }

    if (warnings.length > 0) {
      console.info('ℹ️ Optional environment variables not set:');
      warnings.forEach(({ key, description }) => {
        console.info(`  - ${key}: ${description}`);
      });
    }
  }

  // In production, show user-friendly error if critical vars missing
  if (import.meta.env.PROD && missing.length > 0) {
    const errorMessage = `Missing required configuration: ${missing.map(m => m.key).join(', ')}`;
    console.error(errorMessage);

    // You might want to show this to users or send to error tracking
    if (typeof window !== 'undefined') {
      document.body.innerHTML = `
                <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                    <h1>Configuration Error</h1>
                    <p>The application is missing required configuration.</p>
                    <p style="color: #666; font-size: 0.9rem;">Please contact support.</p>
                </div>
            `;
    }
  }

  return {
    isValid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    warnings,
  };
}

// Auto-validate on import in development
if (import.meta.env.DEV) {
  validateEnvironment();
}
