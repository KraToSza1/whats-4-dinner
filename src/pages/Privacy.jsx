import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BackToHome from '../components/BackToHome.jsx';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-shrink-0">
              <BackToHome className="mb-0" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-4xl font-bold mb-2 truncate">Privacy Policy</h1>
              <p className="text-xs sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
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
              <strong>Local Storage Data:</strong> The following data is stored locally in your
              browser and never leaves your device unless you choose to export it or sign in:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Favorite recipes and collections</li>
              <li>Meal plans and calendar entries</li>
              <li>Grocery lists and shopping items</li>
              <li>Recipe notes and personal modifications</li>
              <li>Pantry ingredients</li>
              <li>User preferences (units, theme, etc.)</li>
              <li>Calorie tracking data and meal logs</li>
              <li>Weight logs and health metrics</li>
              <li>Family member information (if using Family Plan)</li>
              <li>Budget tracking data</li>
              <li>Water intake logs</li>
              <li>Analytics and usage statistics</li>
              <li>Search history and filters</li>
            </ul>
            <p>
              <strong>Authentication Data:</strong> If you sign in with email or Google, we use
              Supabase for authentication. Your email address is stored securely with Supabase. We
              do not have access to your password (if applicable). Google OAuth provides us with
              your email and basic profile information only.
            </p>
            <p>
              <strong>Subscription Data:</strong> When you subscribe, we collect and store:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscription plan type and status</li>
              <li>Billing period (monthly/yearly)</li>
              <li>Transaction IDs and payment history</li>
              <li>Subscription start and end dates</li>
              <li>Payment method type (not full card details)</li>
            </ul>
            <p>
              <strong>Usage Data:</strong> We may collect anonymous usage statistics such as:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Features used and frequency</li>
              <li>Recipe views and interactions</li>
              <li>Search queries (anonymized)</li>
              <li>App performance metrics</li>
              <li>Error logs (without personal information)</li>
            </ul>
            <p>
              <strong>Device Information:</strong> We may collect device information including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Screen resolution</li>
              <li>IP address (for security and analytics)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve the Service</li>
              <li>Personalize your experience (recommendations, preferences)</li>
              <li>Authenticate your account and manage subscriptions</li>
              <li>Process payments and manage billing</li>
              <li>Sync your data across devices (when signed in)</li>
              <li>Provide customer support</li>
              <li>Analyze usage patterns to improve features</li>
              <li>Send you important updates (if you opt in)</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p>
              <strong>We do NOT:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Sell your personal information to third parties</li>
              <li>Use your data for advertising without consent</li>
              <li>Share your recipe data, meal plans, or personal notes</li>
              <li>Access your local storage data unless you sign in and sync</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Data Storage</h2>
            <p>
              <strong>Local Storage:</strong> Most of your data (favorites, meal plans, grocery
              lists, notes, calorie logs, family data) is stored in your browser's local storage.
              This data is private to you and not transmitted to our servers unless you choose to
              sign in and sync.
            </p>
            <p>
              <strong>Cloud Storage (Supabase):</strong> If you sign in, the following data may be
              stored securely with Supabase:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Authentication credentials (email, OAuth tokens)</li>
              <li>User profile information</li>
              <li>Subscription status and billing information</li>
              <li>Synced data (if you choose to sync across devices)</li>
            </ul>
            <p>
              <strong>Data Retention:</strong> We retain your data for as long as your account is
              active or as needed to provide services. If you delete your account, we will delete
              your personal data within 30 days, except where we are required to retain it for
              legal purposes.
            </p>
            <p>
              <strong>Data Backup:</strong> We recommend using the Export Data feature regularly to
              backup your information. We are not responsible for data loss due to browser data
              clearing, device failure, or other circumstances.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Third-Party Services</h2>
            <p>
              <strong>Supabase:</strong> We use Supabase for authentication and database storage.
              Your authentication data is handled by Supabase according to their privacy policy.
              Learn more at{' '}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                supabase.com/privacy
              </a>
              .
            </p>
            <p>
              <strong>Google OAuth:</strong> If you sign in with Google, Google handles the
              authentication process. We receive your email address and basic profile information.
              Your use of Google OAuth is subject to Google's Privacy Policy.
            </p>
            <p>
              <strong>Payment Processors:</strong> We use Stripe, Paddle, and Paystack to process
              payments. These services collect and process payment information according to their
              privacy policies. We do not store full credit card numbers or CVV codes.
            </p>
            <p>
              <strong>YouTube:</strong> We embed YouTube videos in our Cooking Skills feature.
              YouTube may collect usage data when you watch embedded videos. This is subject to
              YouTube's Privacy Policy and Terms of Service.
            </p>
            <p>
              <strong>Analytics:</strong> We may use analytics services to understand how the app is
              used. These services collect anonymous usage data and do not identify individual
              users.
            </p>
            <p>
              <strong>CDN and Hosting:</strong> Recipe images and static assets are served through
              content delivery networks (CDNs) which may log IP addresses for performance and
              security purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Data Sharing and Disclosure</h2>
            <p>
              <strong>We do NOT sell your data:</strong> We do not sell, trade, or rent your
              personal information to third parties for marketing purposes.
            </p>
            <p>
              <strong>Service Providers:</strong> We may share your information with trusted service
              providers who assist us in operating the app, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment processors (Stripe, Paddle, Paystack) - for billing</li>
              <li>Authentication providers (Supabase, Google) - for sign-in</li>
              <li>Hosting and CDN services - for app delivery</li>
              <li>Analytics services - for understanding usage (anonymized)</li>
            </ul>
            <p>
              <strong>Legal Requirements:</strong> We may disclose your information if required by
              law, court order, or government regulation, or to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Comply with legal obligations</li>
              <li>Protect our rights and property</li>
              <li>Prevent fraud or abuse</li>
              <li>Protect user safety</li>
            </ul>
            <p>
              <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale
              of assets, your information may be transferred to the new entity, subject to the same
              privacy protections.
            </p>
            <p>
              <strong>Aggregated Data:</strong> We may share aggregated, anonymized data that does
              not identify individual users for analytics, research, or business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Your Rights and Choices</h2>
            <p>
              <strong>Access Your Data:</strong> You can access and export all your data at any time
              using the "Export All Data" feature in your Profile settings. This downloads a JSON
              file with all your information.
            </p>
            <p>
              <strong>Modify Your Data:</strong> You can modify most of your data directly through
              the app settings, Profile page, or within individual features (meal plans, grocery
              lists, etc.).
            </p>
            <p>
              <strong>Delete Your Data:</strong> You can delete your account and all associated
              data using the "Delete Account" feature in your Profile settings. This action is
              permanent and cannot be undone. We recommend exporting your data first.
            </p>
            <p>
              <strong>Opt Out of Data Collection:</strong> You can use the app without signing in
              to minimize data collection. Most features work with local storage only. Signing in
              enables cloud sync and subscription features.
            </p>
            <p>
              <strong>Cookie and Local Storage Control:</strong> You can clear your browser's local
              storage and cookies at any time through your browser settings. Note: This will delete
              all locally stored data including favorites, meal plans, and preferences.
            </p>
            <p>
              <strong>Subscription Management:</strong> You can manage your subscription, update
              payment methods, and cancel at any time through your Profile → Billing Management
              page.
            </p>
            <p>
              <strong>GDPR Rights (EU Users):</strong> If you are in the European Union, you have
              additional rights under GDPR:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Right to access your personal data</li>
              <li>Right to rectification (correction)</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to withdraw consent</li>
            </ul>
            <p>
              <strong>CCPA Rights (California Users):</strong> If you are a California resident,
              you have rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed</li>
              <li>Right to opt-out of sale of personal information</li>
              <li>Right to access your personal information</li>
              <li>Right to deletion</li>
              <li>Right to non-discrimination for exercising your rights</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us through your Profile settings or
              visit the Help page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Data Security</h2>
            <p>
              <strong>Security Measures:</strong> We implement industry-standard security measures
              to protect your information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption in transit (SSL/TLS) for all data transmission</li>
              <li>Secure authentication through Supabase</li>
              <li>PCI DSS compliance for payment processing</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication requirements</li>
              <li>Secure data storage with Supabase</li>
            </ul>
            <p>
              <strong>Local Storage Security:</strong> Data stored locally in your browser is
              protected by your browser's security features. However, anyone with access to your
              device and browser can potentially access this data.
            </p>
            <p>
              <strong>No Guarantee:</strong> While we implement reasonable security measures, no
              method of transmission over the internet or electronic storage is 100% secure. You use
              the Service at your own risk. We cannot guarantee absolute security.
            </p>
            <p>
              <strong>Your Responsibility:</strong> You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Keeping your account credentials secure</li>
              <li>Not sharing your account with others</li>
              <li>Logging out on shared devices</li>
              <li>Using strong, unique passwords (if applicable)</li>
              <li>Keeping your device and browser secure</li>
            </ul>
            <p>
              <strong>Data Breach:</strong> In the unlikely event of a data breach, we will notify
              affected users and relevant authorities as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
            <p>
              <strong>Age Requirement:</strong> Our Service is not intended for children under 13
              (or 16 in the EU). We do not knowingly collect personal information from children
              under the applicable age limit.
            </p>
            <p>
              <strong>Family Plan:</strong> The Family Plan feature allows parents/guardians to
              manage family members including children. When you add a child to your Family Plan,
              you are responsible for their data and consenting on their behalf. We do not
              directly collect information from children.
            </p>
            <p>
              <strong>Parental Rights:</strong> If you are a parent or guardian and believe your
              child has provided us with personal information, please contact us immediately. We
              will delete such information upon verification.
            </p>
            <p>
              <strong>COPPA Compliance:</strong> We comply with the Children's Online Privacy
              Protection Act (COPPA) and do not knowingly collect information from children under
              13 without parental consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. International Data Transfers</h2>
            <p>
              <strong>Data Location:</strong> Your data may be stored and processed in countries
              other than your country of residence. By using the Service, you consent to the
              transfer of your information to these countries.
            </p>
            <p>
              <strong>EU Users:</strong> If you are in the European Union, we ensure appropriate
              safeguards are in place for data transfers, including standard contractual clauses and
              adequacy decisions.
            </p>
            <p>
              <strong>Data Processing:</strong> Supabase and other service providers may process your
              data in various locations. We ensure they comply with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Cookies and Tracking Technologies</h2>
            <p>
              <strong>Local Storage:</strong> We use browser local storage to save your preferences,
              favorites, and other data. This is not the same as cookies but serves a similar
              purpose.
            </p>
            <p>
              <strong>Session Storage:</strong> We use session storage for temporary data that is
              cleared when you close your browser.
            </p>
            <p>
              <strong>Third-Party Cookies:</strong> Third-party services (payment processors,
              analytics) may set cookies. These are subject to their respective privacy policies.
            </p>
            <p>
              <strong>Do Not Track:</strong> We respect "Do Not Track" browser settings where
              technically feasible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our
              practices, technology, legal requirements, or other factors. We will notify you of any
              material changes by:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Posting the new Privacy Policy on this page</li>
              <li>Updating the "Last updated" date</li>
              <li>Sending an email notification (if you're subscribed)</li>
              <li>Displaying a notice in the app for significant changes</li>
            </ul>
            <p>
              <strong>Continued Use:</strong> Your continued use of the Service after changes
              become effective constitutes acceptance of the updated Privacy Policy. If you do not
              agree with the changes, you should stop using the Service and delete your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">12. Payment Data</h2>
            <p>
              <strong>Payment Information:</strong> When you subscribe to a paid plan, we collect
              payment information through our payment processors (Stripe, Paddle, Paystack). We do
              not store your full credit card number, CVV, or other sensitive payment details on our
              servers. Payment data is handled securely by our payment processors according to PCI
              DSS standards.
            </p>
            <p>
              <strong>Billing Information:</strong> We may collect and store billing information
              such as billing address, payment method type (credit card, PayPal, etc.), and
              transaction history. This information is used to process payments and provide you with
              billing history.
            </p>
            <p>
              <strong>Payment Processor Data Sharing:</strong> Your payment information is shared
              with our payment processors to process transactions. These processors have their own
              privacy policies and security measures. We recommend reviewing their privacy policies:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Stripe:{' '}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  stripe.com/privacy
                </a>
              </li>
              <li>
                Paddle:{' '}
                <a
                  href="https://paddle.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  paddle.com/privacy
                </a>
              </li>
              <li>
                Paystack:{' '}
                <a
                  href="https://paystack.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  paystack.com/privacy
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">13. Payment Security</h2>
            <p>
              <strong>Security Measures:</strong> We implement industry-standard security measures
              to protect your payment information. All payment transactions are encrypted using
              SSL/TLS technology. We comply with PCI DSS requirements for handling payment card
              data.
            </p>
            <p>
              <strong>No Storage of Sensitive Data:</strong> We do not store your full credit card
              number, CVV, or PIN on our servers. All sensitive payment data is handled exclusively
              by our PCI-compliant payment processors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">14. Data Retention</h2>
            <p>
              <strong>Active Accounts:</strong> We retain your data for as long as your account is
              active or as needed to provide services to you.
            </p>
            <p>
              <strong>Deleted Accounts:</strong> When you delete your account, we will delete your
              personal data within 30 days, except where we are required to retain it for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Legal compliance and obligations</li>
              <li>Dispute resolution</li>
              <li>Enforcement of agreements</li>
              <li>Fraud prevention</li>
            </ul>
            <p>
              <strong>Backup Data:</strong> Deleted data may persist in backups for up to 90 days
              before being permanently deleted.
            </p>
            <p>
              <strong>Anonymized Data:</strong> We may retain anonymized, aggregated data that does
              not identify you for analytics and business purposes indefinitely.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">15. Special Categories of Data</h2>
            <p>
              <strong>Health and Medical Data:</strong> The app may collect health-related
              information such as:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Calorie intake and meal logs</li>
              <li>Weight and BMI data</li>
              <li>Allergy and dietary restriction information</li>
              <li>Family member health data (Family Plan)</li>
            </ul>
            <p>
              <strong>Consent:</strong> By using features that collect health data, you consent to
              the collection and processing of this information. You can stop using these features
              or delete your data at any time.
            </p>
            <p>
              <strong>Protection:</strong> We treat health-related data with extra care and
              security. However, this data is NOT protected health information (PHI) under HIPAA,
              as we are not a healthcare provider.
            </p>
            <p>
              <strong>Not Medical Records:</strong> This data is for personal tracking purposes only
              and does not constitute medical records. We are not a healthcare provider and this
              data is not subject to medical privacy laws like HIPAA.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">16. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please visit the Help page or
              contact us through your Profile settings.
            </p>
          </section>

          {/* Quick Links */}
          <section className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-4">Related Links</h2>
            <div className="flex flex-wrap gap-3">
              <motion.button
                onClick={() => navigate('/help')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
              >
                Help & FAQ
              </motion.button>
              <motion.button
                onClick={() => navigate('/terms')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg font-semibold transition-colors"
              >
                Terms of Service
              </motion.button>
              <motion.button
                onClick={() => navigate('/profile?tab=account')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg font-semibold transition-colors"
              >
                Account Settings
              </motion.button>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
