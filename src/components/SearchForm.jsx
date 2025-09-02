import { useState } from "react";
import { motion } from "framer-motion";

export default function SearchForm({ onSearch }) {
  const [ingredients, setIngredients] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = ingredients.trim();
    if (!q) return;
    onSearch(q);
  };

  const clear = () => setIngredients("");

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-3xl mx-auto flex items-center gap-3"
      role="search"
      aria-label="Recipe ingredient search form"
    >
      <input
        type="text"
        className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 ring-1 ring-black/10 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-brand-400"
        placeholder="Enter ingredients (e.g. chicken, rice, tomato)"
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        aria-label="Search ingredients"
      />
      {ingredients && (
        <button type="button" className="btn-ghost" onClick={clear}>
          Clear
        </button>
      )}
      <button type="submit" className="btn-primary">
        Search
      </button>
    </motion.form>
  );
}
