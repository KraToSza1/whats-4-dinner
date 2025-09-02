import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const RecipeCard = ({ recipe, onFavorite, isFavorite }) => {
  const navigate = useNavigate();

  const handleCardClick = () => navigate(`/recipe/${recipe.id}`);
  const title = recipe.title || "Recipe";

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm hover:shadow-md transition"
      onClick={handleCardClick}
    >
      <div className="relative">
        <img
          src={recipe.image}
          alt={title}
          loading="lazy"
          className="w-full aspect-[4/3] object-cover"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite?.();
          }}
          aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
          aria-pressed={!!isFavorite}
          className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/70 shadow border border-slate-200 dark:border-slate-700 hover:scale-105"
          title="Toggle favorite"
        >
          <span aria-hidden className={isFavorite ? "text-rose-500" : "text-slate-500"}>
            ❤
          </span>
        </button>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold line-clamp-2">{title}</h3>
      </div>
    </motion.div>
  );
};

export default RecipeCard;
