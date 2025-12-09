import { safeLocalStorage } from './browserCompatibility.js';

const AVATAR_STORAGE_KEY = 'user:avatar:v1';

/**
 * Get user avatar data from localStorage
 * @returns {Object|null} Avatar data with type and value, or null
 */
export function getUserAvatar() {
  try {
    const stored = safeLocalStorage.getItem(AVATAR_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Save user avatar data to localStorage
 * @param {Object} avatarData - Avatar data with type ('initials', 'image', 'emoji', 'gradient') and value
 */
export function saveUserAvatar(avatarData) {
  try {
    safeLocalStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(avatarData));
    // Dispatch event for other components to update
    window.dispatchEvent(new CustomEvent('avatarChanged', { detail: avatarData }));
  } catch (error) {
    console.error('Failed to save avatar:', error);
  }
}

/**
 * Get user's display name from email or user object
 * @param {Object|null} user - User object with email property
 * @returns {string} Display name or 'User'
 */
export function getUserDisplayName(user) {
  if (!user) return 'User';
  
  // Try to get name from user object
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name;
  }
  if (user.user_metadata?.name) {
    return user.user_metadata.name;
  }
  
  // Fallback to email username
  if (user.email) {
    const emailParts = user.email.split('@');
    return emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
  }
  
  return 'User';
}

/**
 * Get user initials from name or email
 * @param {Object|null} user - User object
 * @returns {string} User initials (max 2 characters)
 */
export function getUserInitials(user) {
  const displayName = getUserDisplayName(user);
  
  // If it's a full name, get initials
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  
  // Otherwise use first 2 characters
  return displayName.substring(0, 2).toUpperCase();
}

/**
 * Generate a gradient color based on user identifier
 * @param {Object|null} user - User object
 * @returns {string} CSS gradient string
 */
export function getUserGradient(user) {
  const identifier = user?.email || user?.id || 'default';
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate colors based on hash
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 60) % 360;
  
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 50%))`;
}

/**
 * Get default avatar configuration for a user
 * @param {Object|null} user - User object
 * @returns {Object} Default avatar configuration
 */
export function getDefaultAvatar(user) {
  return {
    type: 'gradient',
    value: getUserGradient(user),
    initials: getUserInitials(user),
  };
}

