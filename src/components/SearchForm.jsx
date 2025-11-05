import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const LS_KEY = "w4d:lastQuery";

export default function SearchForm({ onSearch, placeholder = "Enter ingredients (e.g. chicken, rice, tomato)" }) {
    const [ingredients, setIngredients] = useState("");
    const [listening, setListening] = useState(false);
    const inputRef = useRef(null);
    const recogRef = useRef(null);

    // load last query once
    useEffect(() => {
        try {
            const last = localStorage.getItem(LS_KEY);
            if (last) setIngredients(last);
        } catch {}
    }, []);

    // Web Speech API (best-effort)
    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        const r = new SR();
        r.lang = "en-US";
        r.interimResults = false;
        r.maxAlternatives = 1;
        r.onresult = (e) => {
            const text = (e.results?.[0]?.[0]?.transcript || "").trim();
            if (text) setIngredients((cur) => (cur ? `${cur}, ${text}` : text));
        };
        r.onend = () => setListening(false);
        r.onerror = () => setListening(false);
        recogRef.current = r;
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const q = ingredients.trim();
        if (!q) return;
        try { localStorage.setItem(LS_KEY, q); } catch {}
        onSearch(q);
    };

    const clear = () => {
        setIngredients("");
        inputRef.current?.focus();
    };

    const startVoice = () => {
        if (!recogRef.current) return;
        setListening(true);
        try { recogRef.current.start(); } catch { setListening(false); }
    };

    const onPaste = (e) => {
        const text = (e.clipboardData || window.clipboardData)?.getData("text") || "";
        if (text) {
            e.preventDefault();
            setIngredients((cur) => (cur ? `${cur}, ${text.trim()}` : text.trim()));
        }
    };

    const onDrop = (e) => {
        const text = e.dataTransfer?.getData("text") || "";
        if (text) {
            e.preventDefault();
            setIngredients((cur) => (cur ? `${cur}, ${text.trim()}` : text.trim()));
        }
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-3xl mx-auto"
            role="search"
            aria-label="Recipe ingredient search form"
        >
            {/* Icon container with input wrapper */}
            <div className="relative flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-3 sm:p-4 border-2 border-emerald-200 dark:border-emerald-800 shadow-lg hover:shadow-xl transition-all">
                {/* Search icon - only shown on desktop (outside input) */}
                <span className="hidden sm:block text-xl sm:text-2xl flex-shrink-0">🔍</span>
                
                {/* Input - no button inside */}
                <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-slate-800 ring-2 ring-emerald-300 dark:ring-emerald-700 focus:outline-none focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all text-sm sm:text-base min-h-[44px] sm:min-h-0"
                    placeholder={placeholder}
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    onPaste={onPaste}
                    onDrop={onDrop}
                    aria-label="Search ingredients"
                    autoComplete="off"
                    spellCheck={false}
                />
                
                {recogRef.current && (
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={listening ? {
                            scale: [1, 1.2, 1],
                            transition: { duration: 1, repeat: Infinity }
                        } : {}}
                        onClick={startVoice}
                        className={`px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-xl border-2 flex-shrink-0 min-h-[44px] sm:min-h-0 touch-manipulation ${
                            listening 
                                ? "border-emerald-500 text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 shadow-sm" 
                                : "border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 bg-white dark:bg-slate-800"
                        } transition-all`}
                        title="Speak ingredients"
                        aria-pressed={listening}
                    >
                        <span className="text-base sm:text-lg">🎤</span>
                    </motion.button>
                )}

                {ingredients && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium min-h-[44px] sm:min-h-0 touch-manipulation flex-shrink-0"
                        onClick={clear}
                    >
                        ✕
                    </motion.button>
                )}

                {/* Search button - icon on mobile, text on desktop, always outside input */}
                <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(5, 150, 105, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg sm:text-base shadow-md hover:shadow-lg transition-all min-h-[44px] sm:min-h-0 touch-manipulation flex-shrink-0 flex items-center justify-center"
                    title="Search recipes"
                >
                    <span className="sm:hidden">🔍</span>
                    <span className="hidden sm:inline">Search</span>
                </motion.button>
            </div>
        </motion.form>
    );
}