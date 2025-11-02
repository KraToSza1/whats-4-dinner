/**
 * Haptic feedback utilities for mobile devices
 */

export const triggerHaptic = (style = "light") => {
    if (!("vibrate" in navigator)) return;
    
    const patterns = {
        light: 10,
        medium: 20,
        heavy: 30,
        success: [10, 50, 10],
        error: [20, 20, 20, 20],
        warning: [15, 30, 15],
    };

    const duration = patterns[style] || patterns.light;
    navigator.vibrate(duration);
};

export const triggerSuccess = () => triggerHaptic("success");
export const triggerError = () => triggerHaptic("error");
export const triggerWarning = () => triggerHaptic("warning");

/**
 * Higher-order function to add haptic feedback to event handlers
 */
export const withHaptic = (handler, style = "light") => {
    return (e) => {
        triggerHaptic(style);
        handler(e);
    };
};

