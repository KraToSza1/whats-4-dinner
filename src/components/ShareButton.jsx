import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, MessageCircle, Facebook, Mail, Link as LinkIcon } from 'lucide-react';
import { useToast } from './Toast.jsx';

export default function ShareButton({ title, text, url, recipeId }) {
  const [showMenu, setShowMenu] = useState(false);
  const [position, setPosition] = useState({ right: 0, top: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const toast = useToast();

  // Generate shareable URL - use /recipe/shared/:id for public access
  const shareableUrl = recipeId
    ? `${window.location.origin}/recipe/shared/${recipeId}`
    : url || window.location.href;

  const shareData = {
    title: title || 'Check this out!',
    text: text || '',
    url: shareableUrl,
  };

  const handleShare = async type => {
    setShowMenu(false);

    if (type === 'native') {
      // Native Web Share API
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          toast.success('Shared successfully! 🎉');
          // Track share event
          if (recipeId && typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('recipeShared', {
                detail: { recipeId, method: 'native', url: shareableUrl },
              })
            );
          }
          return;
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Share failed:', error);
            toast.error('Failed to share. Please try again.');
          }
          // If user cancels or share fails, don't show menu again
        }
      }
      return;
    }

    if (type === 'copy') {
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareableUrl);
        toast.success('Shareable link copied! 📋');
        // Track share event
        if (recipeId && typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('recipeShared', {
              detail: { recipeId, method: 'copy', url: shareableUrl },
            })
          );
        }
        return;
      } catch (error) {
        console.error('Copy failed:', error);
        toast.error('Failed to copy link. Please try again.');
      }
    }

    // Social media sharing
    const encodedUrl = encodeURIComponent(shareableUrl);
    const encodedTitle = encodeURIComponent(title || '');

    const socialLinks = {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    };

    if (socialLinks[type]) {
      window.open(socialLinks[type], '_blank', 'width=600,height=400');
      // Track share event
      if (recipeId && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('recipeShared', {
            detail: { recipeId, method: type, url: shareableUrl },
          })
        );
      }
    }
  };

  // Calculate smart positioning on mobile
  useEffect(() => {
    if (showMenu && buttonRef.current && dropdownRef.current) {
      // Defer state update to avoid synchronous setState in effect
      setTimeout(() => {
        if (!buttonRef.current || !dropdownRef.current) return;

        const isMobile = window.innerWidth < 640;

        if (isMobile) {
          const rect = buttonRef.current.getBoundingClientRect();
          const dropdownWidth = 200; // Fixed width for mobile
          const maxHeight = window.innerHeight - 24;

          // Position dropdown - align with button's right edge by default
          let right = window.innerWidth - rect.right;

          // Ensure it doesn't go off the right edge
          if (right < 12) {
            right = 12;
          }

          // Ensure it doesn't go off the left edge
          if (right + dropdownWidth > window.innerWidth - 12) {
            right = window.innerWidth - dropdownWidth - 12;
          }

          // Position vertically
          let top = rect.bottom + 8;
          const estimatedHeight = Math.min(300, maxHeight);

          if (top + estimatedHeight > window.innerHeight - 12) {
            top = rect.top - estimatedHeight - 8;
            if (top < 12) {
              top = 12;
            }
            // Make sure bottom doesn't go off screen either
            if (top + estimatedHeight > window.innerHeight - 12) {
              top = window.innerHeight - estimatedHeight - 12;
            }
          }

          setPosition({ right, top });
        } else {
          // Reset position for desktop (uses absolute positioning)
          setPosition({ right: 0, top: 0 });
        }
      }, 0);
    }
  }, [showMenu]);

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          // Always show the menu so users can choose their preferred sharing method
          setShowMenu(!showMenu);
        }}
        onTouchStart={e => {
          e.stopPropagation();
        }}
        className="inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-medium touch-manipulation min-h-[36px] sm:min-h-0 flex-shrink-0"
        title="Share"
        aria-label="Share recipe"
      >
        <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="hidden sm:inline">Share</span>
      </motion.button>

      {/* Dropdown menu for non-native share */}
      <AnimatePresence>
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
              onClick={() => setShowMenu(false)}
              onTouchStart={e => {
                e.preventDefault();
                setShowMenu(false);
              }}
            />
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed sm:absolute z-50 sm:right-0 sm:translate-x-0 sm:top-auto sm:translate-y-0 sm:mt-2 w-[200px] sm:w-48 bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden overscroll-contain max-h-[calc(100vh-2rem)] sm:max-h-none"
              style={{
                right: window.innerWidth < 640 ? `${position.right}px` : undefined,
                top: window.innerWidth < 640 ? `${position.top}px` : undefined,
              }}
            >
              <div className="p-1.5 sm:p-2 overflow-y-auto max-h-[calc(100vh-2rem)] sm:max-h-none overscroll-contain scrollbar-hide">
                {/* Native Share (if available) */}
                {navigator.share && (
                  <button
                    onClick={() => handleShare('native')}
                    onTouchStart={e => e.stopPropagation()}
                    className="w-full text-left px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 flex items-center gap-2 text-xs sm:text-sm touch-manipulation min-h-[40px] sm:min-h-0 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">Share via...</span>
                  </button>
                )}
                <button
                  onClick={() => handleShare('copy')}
                  onTouchStart={e => e.stopPropagation()}
                  className="w-full text-left px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 flex items-center gap-2 text-xs sm:text-sm touch-manipulation min-h-[40px] sm:min-h-0 transition-colors"
                >
                  <LinkIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="truncate">Copy Link</span>
                </button>
                <button
                  onClick={() => handleShare('whatsapp')}
                  onTouchStart={e => e.stopPropagation()}
                  className="w-full text-left px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 flex items-center gap-2 text-xs sm:text-sm touch-manipulation min-h-[40px] sm:min-h-0 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="truncate">WhatsApp</span>
                </button>
                <button
                  onClick={() => handleShare('pinterest')}
                  onTouchStart={e => e.stopPropagation()}
                  className="w-full text-left px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 flex items-center gap-2 text-xs sm:text-sm touch-manipulation min-h-[40px] sm:min-h-0 transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-red-600 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.08 3.158 9.417 7.618 11.174-.105-.949-.2-2.403.041-3.44.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.746.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.226-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.487.535 6.624 0 12-5.373 12-12S18.626 0 12 0z" />
                  </svg>
                  <span className="truncate">Pinterest</span>
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  onTouchStart={e => e.stopPropagation()}
                  className="w-full text-left px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 flex items-center gap-2 text-xs sm:text-sm touch-manipulation min-h-[40px] sm:min-h-0 transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-black dark:text-white flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="truncate">X (Twitter)</span>
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  onTouchStart={e => e.stopPropagation()}
                  className="w-full text-left px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 flex items-center gap-2 text-xs sm:text-sm touch-manipulation min-h-[40px] sm:min-h-0 transition-colors"
                >
                  <Facebook className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Facebook</span>
                </button>
                <button
                  onClick={() => handleShare('email')}
                  onTouchStart={e => e.stopPropagation()}
                  className="w-full text-left px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 flex items-center gap-2 text-xs sm:text-sm touch-manipulation min-h-[40px] sm:min-h-0 transition-colors"
                >
                  <Mail className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                  <span className="truncate">Email</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
