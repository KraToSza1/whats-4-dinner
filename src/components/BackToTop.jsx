import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BackToTop() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShow(window.scrollY > 400);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.button
                    initial={{ opacity: 0, scale: 0, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0, y: 50 }}
                    onClick={scrollToTop}
                    className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-2xl hover:shadow-emerald-500/50 flex items-center justify-center group transition-all"
                    aria-label="Back to top"
                >
                    <motion.svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </motion.svg>
                </motion.button>
            )}
        </AnimatePresence>
    );
}

