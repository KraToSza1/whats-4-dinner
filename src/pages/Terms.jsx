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
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-shrink-0">
              <BackToHome className="mb-0" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-4xl font-bold mb-2 truncate">Terms of Service</h1>
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
            <h2 className="text-2xl font-bold mb-4">6. Medical and Health Disclaimers</h2>
            <p className="font-semibold text-red-600 dark:text-red-400 mb-3">
              IMPORTANT: READ THIS SECTION CAREFULLY
            </p>
            <p>
              <strong>Not Medical Advice:</strong> What's 4 Dinner is a recipe and meal planning
              application. We are NOT a medical service, healthcare provider, or nutritionist. The
              information provided in this app, including but not limited to nutritional information,
              calorie counts, dietary recommendations, and recipe suggestions, is for informational
              and entertainment purposes only.
            </p>
            <p>
              <strong>No Medical Diagnosis or Treatment:</strong> This app does not provide medical
              diagnosis, treatment, or advice. Nutritional information, calorie tracking, BMI
              calculations, and dietary suggestions are tools to help you make informed decisions,
              but they are NOT substitutes for professional medical advice, diagnosis, or treatment.
            </p>
            <p>
              <strong>Consult Healthcare Professionals:</strong> Always seek the advice of your
              physician, registered dietitian, or other qualified health provider with any questions
              you may have regarding a medical condition, dietary needs, allergies, or health goals.
              Never disregard professional medical advice or delay in seeking it because of
              something you have read or used in this app.
            </p>
            <p>
              <strong>Allergy and Dietary Restrictions:</strong> While we provide tools to track
              allergies and dietary restrictions, we CANNOT guarantee that recipes are safe for
              your specific needs. Recipe information may contain errors, omissions, or
              cross-contamination risks. Always:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Verify all ingredients before cooking</li>
              <li>Check for potential allergens in all recipe components</li>
              <li>Read product labels carefully</li>
              <li>Be aware of cross-contamination risks in your kitchen</li>
              <li>Consult with healthcare professionals for serious allergies or medical conditions</li>
            </ul>
            <p>
              <strong>Nutritional Information Accuracy:</strong> Nutritional information is
              provided as estimates and may not be 100% accurate. Values can vary based on
              ingredient brands, preparation methods, serving sizes, and other factors. We are not
              responsible for any discrepancies in nutritional data.
            </p>
            <p>
              <strong>Weight Management and Health Goals:</strong> Calorie tracking, BMI
              calculations, and nutrition analytics are tools to help you understand your eating
              patterns. They are NOT medical devices or diagnostic tools. For weight management,
              health conditions, or dietary changes, consult with qualified healthcare professionals.
            </p>
            <p>
              <strong>Food Safety:</strong> We provide cooking instructions and techniques, but you
              are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proper food handling and storage</li>
              <li>Ensuring food is cooked to safe temperatures</li>
              <li>Following food safety guidelines</li>
              <li>Preventing foodborne illness</li>
            </ul>
            <p>
              <strong>Emergency Situations:</strong> If you experience a severe allergic reaction,
              food poisoning, or any medical emergency, seek immediate medical attention. Do NOT
              rely on this app for emergency medical guidance.
            </p>
            <p>
              <strong>No Liability for Health Outcomes:</strong> We are NOT responsible for any
              health outcomes, allergic reactions, foodborne illnesses, or medical conditions that
              may result from using recipes, following dietary suggestions, or using nutritional
              information from this app. You use this app at your own risk regarding your health and
              wellbeing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Dietary and Allergy Information</h2>
            <p>
              While we provide tools to track allergies and dietary restrictions, we cannot
              guarantee that recipes are safe for your specific needs. Always verify ingredients and
              potential cross-contamination risks. Consult with healthcare professionals for serious
              allergies. See Section 6 (Medical and Health Disclaimers) for complete information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. General Disclaimer</h2>
            <p>
              The materials on the Service are provided on an 'as is' basis. We make no warranties,
              expressed or implied, and hereby disclaim and negate all other warranties including,
              without limitation, implied warranties or conditions of merchantability, fitness for a
              particular purpose, or non-infringement of intellectual property or other violation of
              rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Limitations of Liability</h2>
            <p>
              In no event shall What's 4 Dinner or its suppliers be liable for any damages
              (including, without limitation, damages for loss of data or profit, or due to business
              interruption) arising out of the use or inability to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Intellectual Property</h2>
            <p>
              <strong>Our Content:</strong> All content on What's 4 Dinner, including but not
              limited to text, graphics, logos, images, software, and the compilation of all
              content, is the property of What's 4 Dinner or its content suppliers and is protected
              by copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              <strong>User Content:</strong> You retain ownership of any content you create or
              upload (such as recipe notes, collections, meal plans). By using the Service, you
              grant us a license to use, store, and display your content solely for the purpose of
              providing the Service to you.
            </p>
            <p>
              <strong>Recipe Content:</strong> Recipe information may be sourced from various
              sources including user-generated content, public databases, and third-party
              providers. We do not claim ownership of recipe content and respect the intellectual
              property rights of recipe creators.
            </p>
            <p>
              <strong>Embedded Videos:</strong> Cooking Skills videos are embedded from YouTube. We
              do not own or claim ownership of these videos. Video content is subject to YouTube's
              Terms of Service and the respective video creators' rights.
            </p>
            <p>
              <strong>Prohibited Use:</strong> You may not copy, reproduce, distribute, modify,
              create derivative works, publicly display, or exploit any content from the Service
              without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Upload or transmit any viruses, malware, or harmful code</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated systems (bots, scrapers) to access the Service</li>
              <li>Impersonate any person or entity</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Violate any third-party rights, including intellectual property rights</li>
            </ul>
            <p>
              <strong>Termination:</strong> We reserve the right to suspend or terminate your
              account immediately if you violate these terms or engage in prohibited conduct.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">12. Third-Party Services</h2>
            <p>
              <strong>Payment Processors:</strong> We use third-party payment processors (Stripe,
              Paddle, Paystack) to handle payments. Your use of these services is subject to their
              respective terms of service and privacy policies.
            </p>
            <p>
              <strong>Authentication:</strong> We use Supabase for authentication and Google for
              OAuth. Your use of these services is subject to their terms of service.
            </p>
            <p>
              <strong>YouTube Videos:</strong> Cooking Skills videos are embedded from YouTube. Your
              use of embedded videos is subject to YouTube's Terms of Service.
            </p>
            <p>
              <strong>No Endorsement:</strong> References to third-party services, products, or
              websites do not constitute endorsement. We are not responsible for the content,
              policies, or practices of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">13. Revisions</h2>
            <p>
              We may revise these terms of service at any time without notice. By using this
              Service, you are agreeing to be bound by the current version of these terms of
              service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">14. Payment Terms</h2>
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
            <h2 className="text-2xl font-bold mb-4">15. Refund Policy</h2>
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
            <h2 className="text-2xl font-bold mb-4">16. Subscription Cancellation</h2>
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
            <h2 className="text-2xl font-bold mb-4">17. Auto-Renewal</h2>
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
            <h2 className="text-2xl font-bold mb-4">18. Payment Provider Terms</h2>
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
            <h2 className="text-2xl font-bold mb-4">19. Governing Law</h2>
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws
              of the jurisdiction in which What's 4 Dinner operates, without regard to its conflict
              of law provisions. Any disputes arising from these terms or your use of the Service
              shall be resolved in the appropriate courts of that jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">20. Severability</h2>
            <p>
              If any provision of these Terms of Service is found to be unenforceable or invalid,
              that provision shall be limited or eliminated to the minimum extent necessary, and the
              remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">21. Entire Agreement</h2>
            <p>
              These Terms of Service, together with our Privacy Policy, constitute the entire
              agreement between you and What's 4 Dinner regarding your use of the Service and
              supersede all prior agreements and understandings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">22. Contact Information</h2>
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
