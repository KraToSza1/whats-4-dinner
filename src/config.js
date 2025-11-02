export const APP = {
    name: "What's 4 Dinner",
    version: "0.1.0",
};

export const SPOONACULAR = {
    base: "https://api.spoonacular.com",
    key: import.meta.env.VITE_SPOONACULAR_KEY, // set in .env.local and host env
};

export const FEATURES = {
    enableServiceWorker: true,
    resultsPerPage: 24,
};
