import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const RecipePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  const apiKey = "8f67ae0242414d98888d2bef7ceee978";

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      try {
        const res = await fetch(
          `https://api.spoonacular.com/recipes/${id}/information?includeNutrition=true&apiKey=${apiKey}`
        );
        const data = await res.json();
        setRecipe(data);
      } catch (error) {
        console.error("Error fetching recipe info:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipeDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
        <p className="animate-pulse text-xl">Loading recipe...</p>
      </div>
    );
  }

  if (!recipe) return null;

  const { title, image, extendedIngredients, nutrition, instructions } = recipe;
  const nutrients = (name) =>
    nutrition?.nutrients?.find((n) => n.name === name)?.amount ?? "—";

  const share = () => {
    const url = location.href;
    if (navigator.share) {
      navigator.share({ title, url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="sticky top-0 z-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={share}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
              title="Share"
            >
              Share
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700"
              title="Print"
            >
              Print
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold">{title}</h1>

        <img
          src={image}
          alt={title}
          className="w-full max-w-3xl aspect-[4/3] object-cover rounded-lg shadow"
        />

        <section>
          <h2 className="text-xl font-bold mb-3">🍽️ Nutritional Info</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[
              ["Calories", nutrients("Calories")],
              ["Protein (g)", nutrients("Protein")],
              ["Carbs (g)", nutrients("Carbohydrates")],
              ["Fat (g)", nutrients("Fat")],
            ].map(([label, val]) => (
              <div key={label} className="rounded-md bg-slate-100 dark:bg-slate-800 p-3">
                <div className="text-slate-500 dark:text-slate-400">{label}</div>
                <div className="text-lg font-semibold">{val}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">🧂 Ingredients</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-200">
            {extendedIngredients?.map((ing) => (
              <li key={ing.id} className="rounded bg-slate-100/70 dark:bg-slate-800/70 px-3 py-2">
                {ing.original}
              </li>
            ))}
          </ul>
        </section>

        {instructions && (
          <section className="print:break-inside-avoid">
            <h2 className="text-xl font-bold mb-3">📋 Instructions</h2>
            <div
              className="prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: instructions }}
            />
          </section>
        )}
      </div>
    </motion.div>
  );
};

export default RecipePage;
