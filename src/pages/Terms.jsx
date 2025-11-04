import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Terms() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <button
                        onClick={() => navigate("/")}
                        className="mb-4 text-emerald-600 hover:underline flex items-center gap-2"
                    >
                        ← Back to Home
                    </button>
                    <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 prose prose-slate dark:prose-invert max-w-none"
                >
                    <section>
                        <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using What's 4 Dinner ("the Service"), you accept and
                            agree to be bound by the terms and provision of this agreement. If you do
                            not agree to abide by the above, please do not use this service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
                        <p>
                            Permission is granted to temporarily use the Service for personal,
                            non-commercial transitory viewing only. This is the grant of a license, not
                            a transfer of title, and under this license you may not:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Modify or copy the materials</li>
                            <li>Use the materials for any commercial purpose</li>
                            <li>Attempt to reverse engineer any software contained in the Service</li>
                            <li>Remove any copyright or other proprietary notations from the materials</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
                        <p>
                            You are responsible for maintaining the confidentiality of your account and
                            password. You agree to accept responsibility for all activities that occur
                            under your account. You may not share your account with others.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">4. Data Storage</h2>
                        <p>
                            Your data (favorites, meal plans, grocery lists) is stored locally in your
                            browser. We do not store your personal data on our servers unless you choose
                            to sign in with email or Google authentication. You are responsible for
                            backing up your data using the export feature.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">5. Recipe Content</h2>
                        <p>
                            Recipe information is provided by third-party services (Spoonacular API).
                            We are not responsible for the accuracy, completeness, or safety of recipe
                            information. Always verify cooking instructions and allergen information
                            before preparing meals.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">6. Dietary and Allergy Information</h2>
                        <p>
                            While we provide tools to track allergies and dietary restrictions, we
                            cannot guarantee that recipes are safe for your specific needs. Always
                            verify ingredients and potential cross-contamination risks. Consult with
                            healthcare professionals for serious allergies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">7. Disclaimer</h2>
                        <p>
                            The materials on the Service are provided on an 'as is' basis. We make no
                            warranties, expressed or implied, and hereby disclaim and negate all other
                            warranties including, without limitation, implied warranties or conditions
                            of merchantability, fitness for a particular purpose, or non-infringement
                            of intellectual property or other violation of rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">8. Limitations</h2>
                        <p>
                            In no event shall What's 4 Dinner or its suppliers be liable for any
                            damages (including, without limitation, damages for loss of data or profit,
                            or due to business interruption) arising out of the use or inability to use
                            the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">9. Revisions</h2>
                        <p>
                            We may revise these terms of service at any time without notice. By using
                            this Service, you are agreeing to be bound by the current version of
                            these terms of service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">10. Contact Information</h2>
                        <p>
                            If you have any questions about these Terms of Service, please visit the
                            Help page or contact us through your Profile settings.
                        </p>
                    </section>
                </motion.div>
            </div>
        </div>
    );
}

