import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BackToHome from '../components/BackToHome.jsx';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <BackToHome className="mb-4" />
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
              By accessing and using What's 4 Dinner ("the Service"), you accept and agree to be
              bound by the terms and provision of this agreement. If you do not agree to abide by
              the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily use the Service for personal, non-commercial
              transitory viewing only. This is the grant of a license, not a transfer of title, and
              under this license you may not:
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
              You are responsible for maintaining the confidentiality of your account and password.
              You agree to accept responsibility for all activities that occur under your account.
              You may not share your account with others.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Data Storage</h2>
            <p>
              Your data (favorites, meal plans, grocery lists) is stored locally in your browser. We
              do not store your personal data on our servers unless you choose to sign in with email
              or Google authentication. You are responsible for backing up your data using the
              export feature.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Recipe Content</h2>
            <p>
              Recipe information is provided by our database and user-generated content. We are not
              responsible for the accuracy, completeness, or safety of recipe information. Always
              verify cooking instructions and allergen information before preparing meals.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Dietary and Allergy Information</h2>
            <p>
              While we provide tools to track allergies and dietary restrictions, we cannot
              guarantee that recipes are safe for your specific needs. Always verify ingredients and
              potential cross-contamination risks. Consult with healthcare professionals for serious
              allergies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Disclaimer</h2>
            <p>
              The materials on the Service are provided on an 'as is' basis. We make no warranties,
              expressed or implied, and hereby disclaim and negate all other warranties including,
              without limitation, implied warranties or conditions of merchantability, fitness for a
              particular purpose, or non-infringement of intellectual property or other violation of
              rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Limitations</h2>
            <p>
              In no event shall What's 4 Dinner or its suppliers be liable for any damages
              (including, without limitation, damages for loss of data or profit, or due to business
              interruption) arising out of the use or inability to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Revisions</h2>
            <p>
              We may revise these terms of service at any time without notice. By using this
              Service, you are agreeing to be bound by the current version of these terms of
              service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Payment Terms</h2>
            <p>
              <strong>Subscription Plans:</strong> We offer various subscription plans (Free,
              Supporter, Unlimited, Family) with different features and pricing. All paid
              subscriptions are billed on a recurring basis (monthly or yearly) unless cancelled.
            </p>
            <p>
              <strong>Payment Methods:</strong> We accept payments through third-party payment
              processors including Stripe, Paddle, and Paystack. By subscribing, you authorize us to
              charge your payment method for the subscription fee and any applicable taxes.
            </p>
            <p>
              <strong>Billing Cycle:</strong> Subscriptions are billed in advance on a monthly or
              yearly basis. Your subscription will automatically renew at the end of each billing
              period unless you cancel before the renewal date.
            </p>
            <p>
              <strong>Price Changes:</strong> We reserve the right to modify subscription prices at
              any time. Price changes will be communicated to you at least 30 days in advance. If
              you do not agree to the new price, you may cancel your subscription before the change
              takes effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Refund Policy</h2>
            <p>
              <strong>Refund Eligibility:</strong> We offer refunds for subscription payments within
              14 days of the initial purchase or renewal, provided you have not exceeded reasonable
              usage of the Service. Refund requests must be submitted through your Profile settings
              or by contacting support.
            </p>
            <p>
              <strong>Processing:</strong> Approved refunds will be processed to your original
              payment method within 5-10 business days. Your subscription will be cancelled
              immediately upon refund approval.
            </p>
            <p>
              <strong>Non-Refundable:</strong> Refunds are not available for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscriptions cancelled after 14 days from purchase/renewal</li>
              <li>Partial billing periods</li>
              <li>Accounts that have violated these Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">12. Subscription Cancellation</h2>
            <p>
              <strong>How to Cancel:</strong> You may cancel your subscription at any time through
              your Profile settings or Billing Management page. Cancellation takes effect at the end
              of your current billing period. You will continue to have access to premium features
              until the end of the period you've already paid for.
            </p>
            <p>
              <strong>No Refund for Partial Periods:</strong> Cancelling your subscription does not
              entitle you to a refund for the remaining days in your current billing period. You
              will retain access until the period ends.
            </p>
            <p>
              <strong>Downgrade:</strong> You may downgrade your subscription plan at any time. The
              change will take effect at the start of your next billing cycle. No refunds are
              provided for downgrades.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">13. Auto-Renewal</h2>
            <p>
              <strong>Automatic Renewal:</strong> Unless cancelled, your subscription will
              automatically renew at the end of each billing period. We will charge your payment
              method on file for the renewal fee.
            </p>
            <p>
              <strong>Payment Failure:</strong> If payment fails, we will attempt to charge your
              payment method multiple times. If payment continues to fail, your subscription will be
              suspended and you will lose access to premium features. You may update your payment
              method at any time to restore access.
            </p>
            <p>
              <strong>Notification:</strong> We will notify you via email before each renewal. You
              are responsible for ensuring your payment method and email address are up to date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">14. Payment Provider Terms</h2>
            <p>
              <strong>Third-Party Processors:</strong> Payments are processed by third-party payment
              providers (Stripe, Paddle, Paystack). Your use of these services is subject to their
              respective terms of service and privacy policies. We are not responsible for the
              actions or policies of these payment processors.
            </p>
            <p>
              <strong>Disputes:</strong> If you have a billing dispute, please contact us first
              through your Profile settings. If we cannot resolve the dispute, you may contact your
              payment provider. Chargebacks may result in immediate suspension of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">15. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please visit the Help page or
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
                onClick={() => navigate('/privacy')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg font-semibold transition-colors"
              >
                Privacy Policy
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
