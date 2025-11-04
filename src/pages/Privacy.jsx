import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
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
                    <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
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
                        <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
                        <p>
                            <strong>Local Storage Data:</strong> Your favorites, meal plans, grocery
                            lists, and preferences are stored locally in your browser. This data never
                            leaves your device unless you choose to export it.
                        </p>
                        <p>
                            <strong>Authentication Data:</strong> If you sign in with email or Google,
                            we use Supabase for authentication. Your email address is stored securely
                            with Supabase. We do not have access to your password (if applicable).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
                        <p>We use your information to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide and improve the Service</li>
                            <li>Personalize your experience</li>
                            <li>Authenticate your account</li>
                            <li>Send you important updates (if you opt in)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">3. Data Storage</h2>
                        <p>
                            <strong>Local Storage:</strong> Most of your data (favorites, meal plans,
                            grocery lists) is stored in your browser's local storage. This data is
                            private to you and not transmitted to our servers.
                        </p>
                        <p>
                            <strong>Cloud Storage:</strong> If you sign in, your authentication data is
                            stored securely with Supabase. We do not store your personal recipe data
                            on our servers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">4. Third-Party Services</h2>
                        <p>
                            <strong>Spoonacular API:</strong> Recipe data is provided by Spoonacular.
                            When you search for recipes, your search queries are sent to Spoonacular.
                            Please review their privacy policy.
                        </p>
                        <p>
                            <strong>Supabase:</strong> We use Supabase for authentication. Your
                            authentication data is handled by Supabase according to their privacy
                            policy.
                        </p>
                        <p>
                            <strong>Google OAuth:</strong> If you sign in with Google, Google handles
                            the authentication process. We receive your email address and basic profile
                            information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">5. Data Sharing</h2>
                        <p>
                            We do not sell, trade, or rent your personal information to third parties.
                            We may share aggregated, anonymized data for analytics purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Access your data (export feature)</li>
                            <li>Delete your data (delete account feature)</li>
                            <li>Modify your data (through the app settings)</li>
                            <li>Opt out of data collection (by not signing in)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">7. Data Security</h2>
                        <p>
                            We implement reasonable security measures to protect your information.
                            However, no method of transmission over the internet is 100% secure. You
                            use the Service at your own risk.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
                        <p>
                            Our Service is not intended for children under 13. We do not knowingly
                            collect personal information from children under 13. If you are a parent
                            or guardian and believe your child has provided us with personal
                            information, please contact us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">9. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of
                            any changes by posting the new Privacy Policy on this page and updating the
                            "Last updated" date.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">10. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please visit the Help
                            page or contact us through your Profile settings.
                        </p>
                    </section>
                </motion.div>
            </div>
        </div>
    );
}

