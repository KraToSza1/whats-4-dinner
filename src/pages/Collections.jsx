import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import RecipeCard from "../components/RecipeCard.jsx";
import {
    getCollections,
    getRecipesInCollection,
    deleteCollection,
} from "../utils/recipeCollections.js";
import { getRecipeInformation } from "../api/spoonacular.js";

export default function Collections() {
    const navigate = useNavigate();
    const [collections, setCollections] = useState(getCollections());
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [favorites, setFavorites] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("favorites") || "[]");
        } catch {
            return [];
        }
    });

    useEffect(() => {
        setCollections(getCollections());
    }, []);

    const loadCollectionRecipes = async (collectionId) => {
        setLoading(true);
        setSelectedCollection(collectionId);
        try {
            const recipeIds = getRecipesInCollection(collectionId);
            if (recipeIds.length === 0) {
                setRecipes([]);
                setLoading(false);
                return;
            }
            const recipePromises = recipeIds.map(id => 
                getRecipeInformation(id).catch(err => {
                    console.error(`Error loading recipe ${id}:`, err);
                    return null;
                })
            );
            const loadedRecipes = await Promise.all(recipePromises);
            setRecipes(loadedRecipes.filter(Boolean));
        } catch (err) {
            console.error("Error loading collection recipes:", err);
            setRecipes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCollection = (collectionId) => {
        if (confirm("Delete this collection? Recipes will be removed from it.")) {
            deleteCollection(collectionId);
            setCollections(getCollections());
            if (selectedCollection === collectionId) {
                setSelectedCollection(null);
                setRecipes([]);
            }
        }
    };

    const handleFavorite = (recipe) => {
        const isFavorite = favorites.some(fav => fav.id === recipe.id);
        if (isFavorite) {
            setFavorites(favorites.filter(fav => fav.id !== recipe.id));
            localStorage.setItem("favorites", JSON.stringify(favorites.filter(fav => fav.id !== recipe.id)));
        } else {
            const newFavorites = [...favorites, recipe];
            setFavorites(newFavorites);
            localStorage.setItem("favorites", JSON.stringify(newFavorites));
        }
    };

    const selectedCollectionData = collections.find(c => c.id === selectedCollection);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">Recipe Collections</h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Organize your recipes into collections
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Collections Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                            <h2 className="text-lg font-bold mb-4">Your Collections</h2>
                            <div className="space-y-2">
                                {collections.map((collection) => {
                                    const recipeCount = getRecipesInCollection(collection.id).length;
                                    const isSelected = selectedCollection === collection.id;
                                    return (
                                        <motion.button
                                            key={collection.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => loadCollectionRecipes(collection.id)}
                                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                                isSelected
                                                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{collection.emoji}</span>
                                                    <div>
                                                        <div className="font-medium text-sm">{collection.name}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                            {recipeCount} {recipeCount === 1 ? "recipe" : "recipes"}
                                                        </div>
                                                    </div>
                                                </div>
                                                {collection.custom && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteCollection(collection.id);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 text-sm"
                                                        title="Delete collection"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Recipes Grid */}
                    <div className="lg:col-span-3">
                        {selectedCollection ? (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold mb-2">
                                        {selectedCollectionData?.emoji} {selectedCollectionData?.name}
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
                                    </p>
                                </div>

                                {loading ? (
                                    <div className="text-center py-12">
                                        <div className="text-4xl mb-4">⏳</div>
                                        <p className="text-slate-600 dark:text-slate-400">Loading recipes...</p>
                                    </div>
                                ) : recipes.length === 0 ? (
                                    <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <div className="text-6xl mb-4">📁</div>
                                        <h3 className="text-xl font-bold mb-2">No recipes yet</h3>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Add recipes to this collection from recipe pages
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {recipes.map((recipe, index) => (
                                            <RecipeCard
                                                key={recipe.id}
                                                recipe={recipe}
                                                isFavorite={favorites.some(fav => fav.id === recipe.id)}
                                                onFavorite={() => handleFavorite(recipe)}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="text-6xl mb-4">📁</div>
                                <h3 className="text-xl font-bold mb-2">Select a collection</h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Choose a collection from the sidebar to view recipes
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

