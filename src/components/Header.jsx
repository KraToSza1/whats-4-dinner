// src/components/Header.jsx
import React from "react";
import Logo from "../assets/Logo.tsx"; // you added a logo file; keep or swap path
import { exportFavorites, importFavorites } from "../helpers/favoritesIO";

const Header = ({
  theme,
  toggleTheme,
  favorites,
  setFavorites,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="w-6 h-6 text-emerald-500" />
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            What’s <span className="text-emerald-500">4</span> Dinner?
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Export / Import favorites (no accounts) */}
          <button
            className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => exportFavorites(favorites)}
            title="Export favorites"
          >
            Export
          </button>

          <label className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-sm border border-slate-300 dark:border-slate-700 cursor-pointer text-slate-700 dark:text-slate-200">
            Import
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) =>
                importFavorites(e.target.files[0], (data) => {
                  setFavorites(data);
                  localStorage.setItem("favorites", JSON.stringify(data));
                })
              }
            />
          </label>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-300 dark:border-slate-700"
            title="Toggle theme"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
