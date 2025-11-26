export const APP = {
  name: "What's 4 Dinner",
  version: '0.1.0',
};

const envFlag = value => value === '1' || value === 'true';

export const FEATURES = {
  enableServiceWorker: true,
  resultsPerPage: 24,
  disableSpoonacular: true, // Spoonacular is completely removed
  disableImageProxy:
    envFlag(import.meta.env.VITE_DISABLE_IMAGE_PROXY) ||
    (!('VITE_DISABLE_IMAGE_PROXY' in import.meta.env) && import.meta.env.DEV),
};
