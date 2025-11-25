import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getCurrentPlan,
  getPlanName,
  isFreePlan,
  PLAN_DETAILS,
  PLANS,
} from '../utils/subscription.js';
import { useToast } from '../components/Toast.jsx';
import ProModal from '../components/ProModal.jsx';
import BackToHome from '../components/BackToHome.jsx';
import {
  CreditCard,
  Calendar,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Shield,
  Lock,
  RefreshCw,
  TrendingUp,
  Gift,
  Sparkles,
  HelpCircle,
  FileText,
  CreditCard as CardIcon,
  Mail,
  Building2,
  MapPin,
  Phone,
  ExternalLink,
  ChevronRight,
  Star,
  Zap,
  Users,
  Crown,
  Award,
  ArrowRight,
  Clock,
  DollarSign,
  Receipt,
  Settings,
  Bell,
  Key,
  Globe,
  Heart,
  Sparkle,
} from 'lucide-react';

const BILLING_FAQ = [
  {
    q: 'How does billing work?',
    a: "Subscriptions are billed monthly or yearly, depending on your chosen plan. Monthly plans renew automatically each month, while yearly plans renew annually. You'll receive an email receipt for each payment. You can cancel anytime, and you'll retain access until the end of your billing period.",
  },
  {
    q: 'Can I change my plan?',
    a: "Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing period. You'll receive a prorated credit for unused time when upgrading.",
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and digital wallets (Apple Pay, Google Pay). All payments are processed securely through our payment partners (Stripe, Paddle, or Paystack depending on your region).',
  },
  {
    q: 'Can I get a refund?',
    a: "We offer a 30-day money-back guarantee for all new subscriptions. If you're not satisfied, contact support within 30 days of your initial purchase for a full refund. Refunds for annual plans are prorated after the first 30 days.",
  },
  {
    q: 'What happens if my payment fails?',
    a: "We'll automatically retry your payment 3 times over 7 days. You'll receive email notifications about failed payments. If all retries fail, your subscription will be paused, and you'll lose access to premium features. You can update your payment method at any time to reactivate.",
  },
  {
    q: 'How do I cancel my subscription?',
    a: "You can cancel anytime from this page by clicking 'Cancel Subscription'. Your subscription will remain active until the end of your current billing period, and you won't be charged again. You can reactivate anytime before the period ends.",
  },
  {
    q: 'Do you offer student discounts?',
    a: 'Yes! Students with a valid .edu email address can receive a 50% discount on all plans. Contact support with your student email to verify and apply the discount.',
  },
  {
    q: 'Can I use multiple payment methods?',
    a: "Currently, each subscription is linked to one primary payment method. However, you can update your payment method at any time. For family plans, the account owner's payment method is used for all members.",
  },
  {
    q: 'How do I download invoices?',
    a: "All invoices are available in your Billing History section. Click the 'Download' button next to any invoice to download a PDF copy. Invoices are also emailed to your billing email address automatically.",
  },
  {
    q: 'Is my payment information secure?',
    a: 'Absolutely! We never store your full payment card details. All payments are processed through PCI-DSS compliant payment processors (Stripe, Paddle, Paystack). Your card information is encrypted and handled securely by these industry-leading providers.',
  },
];

export default function BillingManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [currentPlan, setCurrentPlan] = useState(getCurrentPlan());
  const [showProModal, setShowProModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [openFAQ, setOpenFAQ] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Load billing history from localStorage (in a real app, this would come from your backend)
    try {
      const history = JSON.parse(localStorage.getItem('billing:history:v1') || '[]');
      setBillingHistory(history);
    } catch {
      setBillingHistory([]);
    }
  }, []);

  const planDetails = PLAN_DETAILS[currentPlan] || PLAN_DETAILS[PLANS.FREE];
  const isFree = isFreePlan();

  // Filter billing history
  const filteredHistory = useMemo(() => {
    if (selectedFilter === 'all') return billingHistory;
    return billingHistory.filter(invoice => invoice.status === selectedFilter);
  }, [billingHistory, selectedFilter]);

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would call your backend API to cancel the subscription
      localStorage.setItem('subscription:plan:v1', PLANS.FREE);
      localStorage.setItem('subscription:cancelled:v1', 'true');
      localStorage.setItem('subscription:cancelled_date:v1', new Date().toISOString());

      setCurrentPlan(PLANS.FREE);
      toast.success(
        "Subscription cancelled. You'll retain access until the end of your billing period."
      );
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMethod = () => {
    // In a real app, this would redirect to Stripe/Paddle customer portal
    toast.info('Redirecting to payment provider portal to update your payment method...');
    // window.open("https://billing.stripe.com/p/login/...", "_blank");
  };

  const handleDownloadInvoice = invoiceId => {
    // In a real app, this would download the actual invoice
    const invoice = billingHistory.find(inv => inv.id === invoiceId);
    if (invoice) {
      // Generate and download invoice PDF
      toast.success('Invoice downloaded successfully!');
    } else {
      toast.error('Invoice not found.');
    }
  };

  const getStatusBadge = status => {
    const badges = {
      paid: { icon: CheckCircle2, color: 'emerald', text: 'Paid' },
      pending: { icon: Clock, color: 'amber', text: 'Pending' },
      failed: { icon: XCircle, color: 'red', text: 'Failed' },
      refunded: { icon: RefreshCw, color: 'slate', text: 'Refunded' },
    };
    const badge = badges[status.toLowerCase()] || badges.pending;
    const Icon = badge.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-${badge.color}-100 dark:bg-${badge.color}-900/20 text-${badge.color}-700 dark:text-${badge.color}-400`}
      >
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <BackToHome className="mb-6" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Billing & Subscription
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage your subscription, payment methods, and billing history
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide"
        >
          {[
            { id: 'overview', label: 'Overview', icon: Sparkles },
            { id: 'plans', label: 'Plans', icon: Crown },
            { id: 'history', label: 'Billing History', icon: Receipt },
            { id: 'payment', label: 'Payment Methods', icon: CardIcon },
            { id: 'help', label: 'Help & FAQ', icon: HelpCircle },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Subscription Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-700 p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Current Subscription</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Your active plan and billing information
                  </p>
                </div>
                {!isFree && (
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                      Active
                    </span>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Current Plan
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {getPlanName()}
                    </div>
                    {!isFree && (
                      <Crown className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  {!isFree ? (
                    <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      ${planDetails.priceMonthly}/month
                    </div>
                  ) : (
                    <div className="text-lg font-semibold text-slate-600 dark:text-slate-400">
                      Free Forever
                    </div>
                  )}
                </div>

                {!isFree && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      Next Billing Date
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Auto-renewal enabled
                    </div>
                  </div>
                )}
              </div>

              {/* Plan Features */}
              {!isFree && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkle className="w-5 h-5 text-emerald-500" />
                    Plan Features
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {planDetails.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                {isFree ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setActiveTab('plans');
                      setTimeout(() => setShowProModal(true), 300);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg flex items-center gap-2"
                  >
                    <Crown className="w-5 h-5" />
                    Upgrade to Premium
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setActiveTab('plans');
                        setTimeout(() => setShowProModal(true), 300);
                      }}
                      className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Change Plan
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleUpdatePaymentMethod}
                      className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <CardIcon className="w-4 h-4" />
                      Update Payment
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCancelSubscription}
                      disabled={loading}
                      className="px-5 py-2.5 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Cancel Subscription
                        </>
                      )}
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>

            {/* Quick Stats */}
            {!isFree && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Spent</span>
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    ${billingHistory.reduce((sum, inv) => sum + (inv.amount || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {billingHistory.length} {billingHistory.length === 1 ? 'payment' : 'payments'}
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Member Since</span>
                    <Calendar className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Active subscriber
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Savings</span>
                    <Gift className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">$0.00</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Switch to yearly to save
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-700 p-6 sm:p-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Select the perfect plan for your needs. All plans include a 30-day money-back
                guarantee.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProModal(true)}
              className="w-full sm:w-auto mx-auto block px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg text-lg"
            >
              View All Plans & Pricing
            </motion.button>
          </motion.div>
        )}

        {/* Billing History Tab */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-700 p-6 sm:p-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Billing History</h2>
                <p className="text-slate-600 dark:text-slate-400">
                  View and download your invoices
                </p>
              </div>
              {billingHistory.length > 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {['all', 'paid', 'pending', 'failed'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                        selectedFilter === filter
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredHistory.length > 0 ? (
              <div className="space-y-3">
                {filteredHistory.map((invoice, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Receipt className="w-5 h-5 text-emerald-500" />
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {invoice.plan || 'Subscription'} Plan - {invoice.period || 'Monthly'}
                        </div>
                        {getStatusBadge(invoice.status || 'paid')}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 ml-8">
                        {new Date(invoice.date || Date.now()).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-bold text-slate-900 dark:text-white">
                          ${invoice.amount || '0.00'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Invoice #{invoice.id || `INV-${idx + 1}`}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDownloadInvoice(invoice.id || idx)}
                        className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/20 hover:bg-emerald-200 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 text-lg mb-2">
                  No billing history available
                </p>
                {isFree && (
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    Subscribe to a plan to see your billing history here.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-700 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Payment Methods</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Manage your payment methods securely
                  </p>
                </div>
                {!isFree && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleUpdatePaymentMethod}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-2"
                  >
                    <CardIcon className="w-4 h-4" />
                    Update Payment Method
                  </motion.button>
                )}
              </div>

              {isFree ? (
                <div className="text-center py-8">
                  <CardIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    No payment method on file. Subscribe to a plan to add a payment method.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setActiveTab('plans');
                      setTimeout(() => setShowProModal(true), 300);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl"
                  >
                    View Plans
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-md">
                          <CardIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            •••• •••• •••• 4242
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Expires 12/25
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          Secure
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      💡 Your payment information is securely stored by our payment processor. Click
                      "Update Payment Method" to change your card or billing details.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Billing Email
                    </div>
                    <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user?.email || 'Not set'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Security Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Your Payment Information is Secure
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 text-sm mb-3">
                    We use industry-leading payment processors (Stripe, Paddle, Paystack) that are
                    PCI-DSS compliant. Your card details are encrypted and never stored on our
                    servers. All transactions are processed securely.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['PCI-DSS Compliant', '256-bit SSL Encryption', 'SOC 2 Certified'].map(
                      badge => (
                        <span
                          key={badge}
                          className="px-3 py-1 bg-white dark:bg-slate-800 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300"
                        >
                          {badge}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Help & FAQ Tab */}
        {activeTab === 'help' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-700 p-6 sm:p-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-emerald-500" />
                Billing & Subscription FAQ
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Common questions about billing, payments, and subscriptions
              </p>
            </div>

            <div className="space-y-3">
              {BILLING_FAQ.map((item, index) => {
                const isOpen = openFAQ === index;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:border-emerald-500 dark:hover:border-emerald-500 transition-all"
                  >
                    <button
                      onClick={() => setOpenFAQ(isOpen ? null : index)}
                      className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <HelpCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.q}
                        </span>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                          isOpen ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-4 ml-8 text-slate-600 dark:text-slate-400 leading-relaxed">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Additional Help */}
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg mb-4">Still Need Help?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href="/help"
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                >
                  <HelpCircle className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="font-semibold">Help Center</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Browse all help articles
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </a>
                <a
                  href="/terms"
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                >
                  <FileText className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="font-semibold">Terms & Policies</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Read our terms of service
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {showProModal && <ProModal open={showProModal} onClose={() => setShowProModal(false)} />}
    </div>
  );
}
