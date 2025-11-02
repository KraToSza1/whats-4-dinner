import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, MessageCircle, Facebook, Mail, Link as LinkIcon } from "lucide-react";

export default function ShareButton({ title, text, url }) {
    const [showMenu, setShowMenu] = useState(false);

    const shareData = {
        title: title || "Check this out!",
        text: text || "",
        url: url || window.location.href
    };

    const handleShare = async (type) => {
        setShowMenu(false);
        
        if (type === "native") {
            // Native Web Share API
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                    return;
                } catch (error) {
                    if (error.name !== "AbortError") {
                        console.error("Share failed:", error);
                    }
                }
            }
        }

        if (type === "copy") {
            // Copy to clipboard
            try {
                await navigator.clipboard.writeText(url || window.location.href);
                alert("Link copied to clipboard! 📋");
                return;
            } catch (error) {
                alert("Failed to copy link");
            }
        }

        // Social media sharing
        const encodedUrl = encodeURIComponent(url || window.location.href);
        const encodedTitle = encodeURIComponent(title || "");
        
        const socialLinks = {
            twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
            pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`
        };

        if (socialLinks[type]) {
            window.open(socialLinks[type], "_blank", "width=600,height=400");
        }
    };

    return (
        <div className="relative">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    // Try native share first
                    if (navigator.share) {
                        handleShare("native");
                    } else {
                        setShowMenu(!showMenu);
                    }
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
                title="Share"
            >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
            </motion.button>

            {/* Dropdown menu for non-native share */}
            <AnimatePresence>
                {showMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowMenu(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
                        >
                            <div className="p-2">
                                <button
                                    onClick={() => handleShare("copy")}
                                    className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <LinkIcon className="w-4 h-4 text-blue-500" />
                                    <span>Copy Link</span>
                                </button>
                                <button
                                    onClick={() => handleShare("whatsapp")}
                                    className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <MessageCircle className="w-4 h-4 text-green-500" />
                                    <span>WhatsApp</span>
                                </button>
                                <button
                                    onClick={() => handleShare("pinterest")}
                                    className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.08 3.158 9.417 7.618 11.174-.105-.949-.2-2.403.041-3.44.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.746.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.226-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.487.535 6.624 0 12-5.373 12-12S18.626 0 12 0z"/>
                                    </svg>
                                    <span>Pinterest</span>
                                </button>
                                <button
                                    onClick={() => handleShare("twitter")}
                                    className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4 text-black dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                    </svg>
                                    <span>X (Twitter)</span>
                                </button>
                                <button
                                    onClick={() => handleShare("facebook")}
                                    className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Facebook className="w-4 h-4 text-blue-600" />
                                    <span>Facebook</span>
                                </button>
                                <button
                                    onClick={() => handleShare("email")}
                                    className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Mail className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                    <span>Email</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

