/**
 * Analytics utilities - Aggregate and analyze all user data
 */

// Recipe view tracking
const VIEW_KEY = "analytics:recipe:views";
const INTERACTION_KEY = "analytics:recipe:interactions";

export function trackRecipeView(recipeId) {
    try {
        const views = JSON.parse(localStorage.getItem(VIEW_KEY) || "{}");
        const today = new Date().toISOString().split("T")[0];
        if (!views[today]) views[today] = {};
        views[today][recipeId] = (views[today][recipeId] || 0) + 1;
        localStorage.setItem(VIEW_KEY, JSON.stringify(views));
    } catch (e) {
        console.warn("[Analytics] Failed to track view", e);
    }
}

export function trackRecipeInteraction(recipeId, type, data = {}) {
    try {
        const interactions = JSON.parse(localStorage.getItem(INTERACTION_KEY) || "[]");
        interactions.push({
            recipeId,
            type, // "view", "favorite", "add_to_plan", "add_to_grocery", "rate", "share"
            timestamp: new Date().toISOString(),
            ...data,
        });
        // Keep last 1000 interactions
        if (interactions.length > 1000) {
            interactions.splice(0, interactions.length - 1000);
        }
        localStorage.setItem(INTERACTION_KEY, JSON.stringify(interactions));
    } catch (e) {
        console.warn("[Analytics] Failed to track interaction", e);
    }
}

export function getRecipeViews(days = 30) {
    try {
        const views = JSON.parse(localStorage.getItem(VIEW_KEY) || "{}");
        const result = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            const dayViews = views[dateStr] || {};
            const total = Object.values(dayViews).reduce((sum, count) => sum + count, 0);
            result.push({
                date: dateStr,
                total,
                unique: Object.keys(dayViews).length,
            });
        }
        return result;
    } catch {
        return [];
    }
}

export function getTopRecipes(limit = 10) {
    try {
        const views = JSON.parse(localStorage.getItem(VIEW_KEY) || "{}");
        const recipeCounts = {};
        
        Object.values(views).forEach((dayViews) => {
            Object.entries(dayViews).forEach(([recipeId, count]) => {
                recipeCounts[recipeId] = (recipeCounts[recipeId] || 0) + count;
            });
        });
        
        return Object.entries(recipeCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([recipeId, count]) => ({ recipeId, count }));
    } catch {
        return [];
    }
}

export function getCalorieHistory(days = 30) {
    try {
        const mealLogs = JSON.parse(localStorage.getItem("calorie:meals:v1") || "{}");
        const result = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            const dayMeals = mealLogs[dateStr] || [];
            const total = dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
            
            // Calculate macros if available
            const macros = {
                protein: 0,
                carbs: 0,
                fat: 0,
            };
            
            result.push({
                date: dateStr,
                calories: total,
                meals: dayMeals.length,
                macros,
            });
        }
        return result;
    } catch {
        return [];
    }
}

export function getMealPlanStats() {
    try {
        const plan = JSON.parse(localStorage.getItem("meal:plan:v2") || "{}");
        const stats = {
            totalMeals: 0,
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            daysPlanned: 0,
        };
        
        Object.values(plan).forEach((day) => {
            if (day && typeof day === "object") {
                let hasMeals = false;
                if (day.breakfast) {
                    stats.breakfast++;
                    stats.totalMeals++;
                    hasMeals = true;
                }
                if (day.lunch) {
                    stats.lunch++;
                    stats.totalMeals++;
                    hasMeals = true;
                }
                if (day.dinner) {
                    stats.dinner++;
                    stats.totalMeals++;
                    hasMeals = true;
                }
                if (hasMeals) stats.daysPlanned++;
            }
        });
        
        return stats;
    } catch {
        return {
            totalMeals: 0,
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            daysPlanned: 0,
        };
    }
}

export function getFavoritesStats() {
    try {
        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        const ratings = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("recipeRating:")) {
                const recipeId = key.replace("recipeRating:", "");
                const data = JSON.parse(localStorage.getItem(key) || "{}");
                if (data.rating) {
                    ratings[recipeId] = data.rating;
                }
            }
        }
        
        const ratedFavorites = favorites.filter((f) => ratings[f.id]);
        const avgRating = ratedFavorites.length > 0
            ? ratedFavorites.reduce((sum, f) => sum + (ratings[f.id] || 0), 0) / ratedFavorites.length
            : 0;
        
        return {
            total: favorites.length,
            rated: ratedFavorites.length,
            avgRating: Math.round(avgRating * 10) / 10,
        };
    } catch {
        return { total: 0, rated: 0, avgRating: 0 };
    }
}

export function getNutritionalInsights() {
    try {
        const mealLogs = JSON.parse(localStorage.getItem("calorie:meals:v1") || "{}");
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            const dayMeals = mealLogs[dateStr] || [];
            const total = dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
            last7Days.push(total);
        }
        
        const avgCalories = last7Days.reduce((sum, cal) => sum + cal, 0) / last7Days.length;
        const maxCalories = Math.max(...last7Days, 0);
        const minCalories = Math.min(...last7Days.filter(c => c > 0), 0) || 0;
        
        return {
            avgCalories: Math.round(avgCalories),
            maxCalories,
            minCalories,
            trend: last7Days[6] > last7Days[0] ? "up" : last7Days[6] < last7Days[0] ? "down" : "stable",
        };
    } catch {
        return {
            avgCalories: 0,
            maxCalories: 0,
            minCalories: 0,
            trend: "stable",
        };
    }
}

export function getActivitySummary() {
    try {
        const interactions = JSON.parse(localStorage.getItem(INTERACTION_KEY) || "[]");
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        
        const recent = interactions.filter((i) => new Date(i.timestamp) > last30Days);
        
        const byType = {};
        recent.forEach((interaction) => {
            byType[interaction.type] = (byType[interaction.type] || 0) + 1;
        });
        
        return {
            totalInteractions: recent.length,
            byType,
            mostActiveDay: getMostActiveDay(recent),
        };
    } catch {
        return { totalInteractions: 0, byType: {}, mostActiveDay: null };
    }
}

function getMostActiveDay(interactions) {
    const dayCounts = {};
    interactions.forEach((i) => {
        const date = new Date(i.timestamp).toISOString().split("T")[0];
        dayCounts[date] = (dayCounts[date] || 0) + 1;
    });
    
    const maxDay = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0];
    return maxDay ? { date: maxDay[0], count: maxDay[1] } : null;
}

