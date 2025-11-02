// Unit conversion utilities for serving-size-adjusted ingredients

const UNIT_SYSTEMS = {
    metric: { flag: "🌍", name: "Metric" },
    us: { flag: "🇺🇸", name: "US" },
    uk: { flag: "🇬🇧", name: "UK" },
};

const CONVERSIONS = {
    // Common volume conversions (to ml)
    cups: { metric: 240, us: 236.588, uk: 284 },
    tbsp: { metric: 15, us: 14.7868, uk: 17.758 },
    tsp: { metric: 5, us: 4.92892, uk: 5.919 },
    "fluid oz": { metric: 30, us: 29.5735, uk: 28.413 },
    
    // Common weight conversions (to grams)
    oz: { metric: 28.35, us: 28.3495, uk: 28.3495 },
    lb: { metric: 454, us: 453.592, uk: 453.592 },
    gram: { metric: 1, us: 1, uk: 1 },
    kilogram: { metric: 1000, us: 1000, uk: 1000 },
};

/**
 * Get current unit system preference from localStorage
 */
export function getUnitSystem() {
    try {
        return localStorage.getItem("unitSystem") || "metric";
    } catch {
        return "metric";
    }
}

/**
 * Convert a unit to the preferred system
 */
export function convertUnit(amount, unit, targetSystem = null) {
    const system = targetSystem || getUnitSystem();
    
    if (system === "us") {
        // US uses original units mostly
        return `${amount} ${unit}`;
    }
    
    const unitLower = unit.toLowerCase();
    const conversions = CONVERSIONS[unitLower] || {};
    
    if (!conversions[system]) {
        return `${amount} ${unit}`;
    }
    
    const baseValue = amount * (CONVERSIONS[unitLower].us || 1);
    const convertedAmount = baseValue / conversions[system];
    
    // Round appropriately
    const rounded = Math.round(convertedAmount * 10) / 10;
    
    // Return with appropriate unit
    if (unitLower.includes("cup") || unitLower.includes("tbsp") || unitLower.includes("tsp")) {
        return `${rounded} ml`;
    }
    if (unitLower.includes("oz") || unitLower.includes("lb")) {
        return `${rounded} g`;
    }
    
    return `${rounded} ${unit}`;
}

/**
 * Convert an entire ingredient text string
 */
export function convertIngredient(ingredientText, targetSystem = null) {
    if (!ingredientText) return ingredientText;
    
    const system = targetSystem || getUnitSystem();
    if (system === "us") return ingredientText;
    
    // Pattern matching for common units
    let result = ingredientText;
    
    // Convert cups
    result = result.replace(/(\d+(?:\.\d+)?)\s*cup(s)?/gi, (match, num) => {
        const converted = parseFloat(num) * (system === "uk" ? 284 : 240);
        return `${Math.round(converted)} ml`;
    });
    
    // Convert tablespoons
    result = result.replace(/(\d+(?:\.\d+)?)\s*tbsp/gi, (match, num) => {
        const converted = parseFloat(num) * (system === "uk" ? 17.758 : 15);
        return `${Math.round(converted)} ml`;
    });
    
    // Convert teaspoons
    result = result.replace(/(\d+(?:\.\d+)?)\s*tsp/gi, (match, num) => {
        const converted = parseFloat(num) * (system === "uk" ? 5.919 : 5);
        return `${Math.round(converted)} ml`;
    });
    
    // Convert ounces (weight)
    result = result.replace(/(\d+(?:\.\d+)?)\s*oz/gi, (match, num) => {
        const converted = parseFloat(num) * 28.35;
        return `${Math.round(converted)} g`;
    });
    
    // Convert pounds
    result = result.replace(/(\d+(?:\.\d+)?)\s*lb(s)?/gi, (match, num) => {
        const converted = parseFloat(num) * 454;
        return `${Math.round(converted)} g`;
    });
    
    return result;
}

export { UNIT_SYSTEMS };

