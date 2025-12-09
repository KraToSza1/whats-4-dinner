import React from 'react';
import Avatar from 'react-avatar';
import { getUserAvatar, getUserInitials, getUserDisplayName, getDefaultAvatar } from '../utils/avatar.js';

/**
 * UserAvatar Component
 * Displays user avatar with fallback options
 */
export default function UserAvatar({ user, size = 80, className = '', showBorder = true }) {
  const avatarData = getUserAvatar();
  const defaultAvatar = getDefaultAvatar(user);
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);

  // If user has custom avatar
  if (avatarData) {
    if (avatarData.type === 'image' && avatarData.value) {
      // Custom uploaded image
      return (
        <div
          className={`rounded-full overflow-hidden ${showBorder ? 'ring-2 ring-emerald-500 dark:ring-emerald-400' : ''} ${className}`}
          style={{ width: size, height: size }}
        >
          <img
            src={avatarData.value}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div
            className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold"
            style={{ display: 'none', fontSize: size * 0.4 }}
          >
            {initials}
          </div>
        </div>
      );
    }

    if (avatarData.type === 'emoji' && avatarData.value) {
      // Emoji avatar
      return (
        <div
          className={`rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center ${showBorder ? 'ring-2 ring-purple-500 dark:ring-purple-400' : ''} ${className}`}
          style={{ width: size, height: size, fontSize: size * 0.6 }}
        >
          {avatarData.value}
        </div>
      );
    }

    if (avatarData.type === 'gradient' && avatarData.value) {
      // Custom gradient
      return (
        <div
          className={`rounded-full flex items-center justify-center text-white font-bold ${showBorder ? 'ring-2 ring-emerald-500 dark:ring-emerald-400' : ''} ${className}`}
          style={{
            width: size,
            height: size,
            background: avatarData.value,
            fontSize: size * 0.4,
          }}
        >
          {avatarData.initials || initials}
        </div>
      );
    }
  }

  // Default: Use react-avatar with initials
  return (
    <div className={className}>
      <Avatar
        name={displayName}
        size={size.toString()}
        round={true}
        textSizeRatio={2.5}
        className={showBorder ? 'ring-2 ring-emerald-500 dark:ring-emerald-400' : ''}
        style={{ border: showBorder ? '2px solid' : 'none' }}
      />
    </div>
  );
}

