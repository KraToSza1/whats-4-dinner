export const APP = {
  name: "What's 4 Dinner",
  version: '0.1.0',
};

export const SPOONACULAR = {
  base: 'https://api.spoonacular.com',
  key: import.meta.env.VITE_SPOONACULAR_KEY, // set in .env.local and host env
};

const envFlag = value => value === '1' || value === 'true';

export const FEATURES = {
  enableServiceWorker: true,
  resultsPerPage: 24,
  disableSpoonacular: envFlag(import.meta.env.VITE_DISABLE_SPOONACULAR),
  disableImageProxy:
    envFlag(import.meta.env.VITE_DISABLE_IMAGE_PROXY) ||
    (!('VITE_DISABLE_IMAGE_PROXY' in import.meta.env) && import.meta.env.DEV),
};
