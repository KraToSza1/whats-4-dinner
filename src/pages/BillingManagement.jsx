import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { getLocalPrice, getAllLocalPrices } from '../utils/pricing.js';
import {
  initializeCurrency,
  getCurrencySettings,
  formatCurrency,
  convertToLocal,
} from '../utils/currency.js';
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
  const { user } = useAuth();
  const toast = useToast();
  const [currentPlan, setCurrentPlan] = useState(getCurrentPlan());
  const [showProModal, setShowProModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [openFAQ, setOpenFAQ] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [currencyLoading, setCurrencyLoading] = useState(true);
  const [monthlyPrice, setMonthlyPrice] = useState(null);
  const [convertedAmounts, setConvertedAmounts] = useState({});

  // Initialize currency and load prices
  useEffect(() => {
    const loadCurrencyAndPrices = async () => {
      try {
        await initializeCurrency();
        await getAllLocalPrices();

        // Get current plan's monthly price
        if (!isFreePlan()) {
          const price = await getLocalPrice(currentPlan, 'monthly');
          setMonthlyPrice(price);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error loading currency/prices:', error);
        }
      } finally {
        setCurrencyLoading(false);
      }
    };

    loadCurrencyAndPrices();
  }, [currentPlan]);

  useEffect(() => {
    // Load billing history from localStorage (in a real app, this would come from your backend)
    try {
      const history = JSON.parse(localStorage.getItem('billing:history:v1') || '[]');
      setBillingHistory(history);
    } catch {
      setBillingHistory([]);
    }
  }, []);

  // Convert billing history amounts when currency is loaded
  useEffect(() => {
    if (currencyLoading || billingHistory.length === 0) return;

    const convertAmounts = async () => {
      try {
        const settings = getCurrencySettings();
        if (settings.currency !== 'USD') {
          const converted = {};
          for (const invoice of billingHistory) {
            if (invoice.amount && !converted[invoice.id || invoice.date]) {
              try {
                const localAmount = await convertToLocal(invoice.amount || 0);
                converted[invoice.id || invoice.date] = localAmount;
              } catch (_error) {
                // Fallback to original amount if conversion fails
                converted[invoice.id || invoice.date] = invoice.amount;
              }
            }
          }
          setConvertedAmounts(converted);
        } else {
          // If USD, use original amounts
          const converted = {};
          billingHistory.forEach(invoice => {
            converted[invoice.id || invoice.date] = invoice.amount || 0;
          });
          setConvertedAmounts(converted);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error converting amounts:', error);
        }
      }
    };

    convertAmounts();
  }, [currencyLoading, billingHistory]);

  const planDetails = PLAN_DETAILS[currentPlan] || PLAN_DETAILS[PLANS.FREE];
  const isFree = isFreePlan();

  // Format price helper
  const formatPrice = amount => {
    if (amount === null || amount === undefined) return formatCurrency(0);
    return formatCurrency(amount);
  };

  // Get formatted monthly price for current plan
  const getCurrentPlanPrice = () => {
    if (isFree) return 'Free Forever';
    if (monthlyPrice !== null) {
      return formatPrice(monthlyPrice);
    }
    // Fallback to USD if currency not loaded yet
    return `$${planDetails.priceMonthly}/month`;
  };

  // Get converted amount for an invoice
  const getInvoiceAmount = invoice => {
    const key = invoice.id || invoice.date;
    if (convertedAmounts[key] !== undefined) {
      return convertedAmounts[key];
    }
    // Fallback to original amount if not converted yet
    return invoice.amount || 0;
  };

  // Calculate total spent in local currency
  const getTotalSpent = () => {
    return billingHistory.reduce((sum, inv) => sum + getInvoiceAmount(inv), 0);
  };

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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50/20 to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-3 xs:px-4 sm:px-6 py-4 xs:py-6 sm:py-8">
        {/* Hero Section - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 xs:mb-6 sm:mb-8"
        >
          <div className="flex items-start gap-3 sm:gap-4 mb-3 xs:mb-4">
            <div className="flex-shrink-0">
              <BackToHome className="mb-0" />
            </div>
            <div className="flex items-start xs:items-center gap-3 xs:gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl xs:rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shrink-0">
                <CreditCard className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight truncate">
                  Billing & Subscription
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 text-xs xs:text-sm sm:text-base hidden sm:block">
                  Manage your subscription, payment methods, and billing history
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-1.5 xs:gap-2 mb-4 xs:mb-5 sm:mb-6 overflow-x-auto scrollbar-hide pb-2 -mx-3 xs:-mx-4 sm:mx-0 px-3 xs:px-4 sm:px-0"
        >
          {[
            { id: 'overview', label: 'Overview', icon: Sparkles, shortLabel: 'Overview' },
            { id: 'plans', label: 'Plans', icon: Crown, shortLabel: 'Plans' },
            { id: 'history', label: 'Billing History', icon: Receipt, shortLabel: 'History' },
            { id: 'payment', label: 'Payment Methods', icon: CardIcon, shortLabel: 'Payment' },
            { id: 'help', label: 'Help & FAQ', icon: HelpCircle, shortLabel: 'Help' },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-lg xs:rounded-xl font-medium transition-all whitespace-nowrap shrink-0 text-xs xs:text-sm touch-manipulation min-h-[44px] ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95'
                }`}
              >
                <Icon className="w-3.5 h-3.5 xs:w-4 xs:h-4 shrink-0" />
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4 xs:space-y-5 sm:space-y-6">
            {/* Current Subscription Card - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl xs:rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-700 p-4 xs:p-5 sm:p-6 md:p-8"
            >
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4 mb-4 xs:mb-5 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl xs:text-2xl font-bold mb-1 xs:mb-2">
                    Current Subscription
                  </h2>
                  <p className="text-sm xs:text-base text-slate-600 dark:text-slate-400">
                    Your active plan and billing information
                  </p>
                </div>
                {!isFree && (
                  <div className="flex xs:hidden sm:flex items-center gap-2 px-3 xs:px-4 py-1.5 xs:py-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg shrink-0">
                    <CheckCircle2 className="w-4 h-4 xs:w-5 xs:h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold text-sm xs:text-base text-emerald-700 dark:text-emerald-300">
                      Active
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-5 sm:gap-6 mb-4 xs:mb-5 sm:mb-6">
                <div className="p-4 xs:p-5 sm:p-6 bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                  <div className="text-xs xs:text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Current Plan
                  </div>
                  <div className="flex items-center gap-2 xs:gap-3 mb-2 flex-wrap">
                    <div className="text-2xl xs:text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                      {getPlanName()}
                    </div>
                    {!isFree && (
                      <Crown className="w-5 h-5 xs:w-6 xs:h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                  </div>
                  {!isFree ? (
                    <div className="text-base xs:text-lg sm:text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                      {currencyLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="animate-pulse">...</span>
                        </span>
                      ) : (
                        <span>{getCurrentPlanPrice()}/month</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-base xs:text-lg font-semibold text-slate-600 dark:text-slate-400">
                      Free Forever
                    </div>
                  )}
                </div>

                {!isFree && (
                  <div className="p-4 xs:p-5 sm:p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                    <div className="text-xs xs:text-sm text-slate-600 dark:text-slate-400 mb-2">
                      Next Billing Date
                    </div>
                    <div className="text-xl xs:text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-xs xs:text-sm text-slate-500 dark:text-slate-400">
                      Auto-renewal enabled
                    </div>
                  </div>
                )}
              </div>

              {/* Plan Features - Mobile Optimized */}
              {!isFree && (
                <div className="mb-4 xs:mb-5 sm:mb-6">
                  <h3 className="text-base xs:text-lg font-semibold mb-3 xs:mb-4 flex items-center gap-2">
                    <Sparkle className="w-4 h-4 xs:w-5 xs:h-5 text-emerald-500 shrink-0" />
                    Plan Features
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 xs:gap-3">
                    {planDetails.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2.5 xs:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                      >
                        <CheckCircle2 className="w-4 h-4 xs:w-5 xs:h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs xs:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions - Mobile Optimized */}
              <div className="flex flex-col xs:flex-row flex-wrap gap-2 xs:gap-3 pt-4 xs:pt-5 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
                {isFree ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveTab('plans');
                      setTimeout(() => setShowProModal(true), 300);
                    }}
                    className="w-full xs:w-auto px-5 xs:px-6 py-3 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                  >
                    <Crown className="w-4 h-4 xs:w-5 xs:h-5 shrink-0" />
                    <span>Upgrade to Premium</span>
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveTab('plans');
                        setTimeout(() => setShowProModal(true), 300);
                      }}
                      className="w-full xs:w-auto px-4 xs:px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                    >
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      <span>Change Plan</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpdatePaymentMethod}
                      className="w-full xs:w-auto px-4 xs:px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                    >
                      <CardIcon className="w-4 h-4 shrink-0" />
                      <span>Update Payment</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancelSubscription}
                      disabled={loading}
                      className="w-full xs:w-auto px-4 xs:px-5 py-2.5 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                          <span>Cancelling...</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 shrink-0" />
                          <span>Cancel Subscription</span>
                        </>
                      )}
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>

            {/* Quick Stats - Mobile Optimized */}
            {!isFree && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 xs:gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 xs:p-5 sm:p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs xs:text-sm text-slate-600 dark:text-slate-400">
                      Total Spent
                    </span>
                    <DollarSign className="w-4 h-4 xs:w-5 xs:h-5 text-emerald-500 shrink-0" />
                  </div>
                  <div className="text-xl xs:text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                    {currencyLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="animate-pulse">...</span>
                      </span>
                    ) : (
                      formatPrice(getTotalSpent())
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {billingHistory.length} {billingHistory.length === 1 ? 'payment' : 'payments'}
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 xs:p-5 sm:p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs xs:text-sm text-slate-600 dark:text-slate-400">
                      Member Since
                    </span>
                    <Calendar className="w-4 h-4 xs:w-5 xs:h-5 text-emerald-500 shrink-0" />
                  </div>
                  <div className="text-xl xs:text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
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
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 xs:p-5 sm:p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg sm:col-span-2 md:col-span-1"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs xs:text-sm text-slate-600 dark:text-slate-400">
                      Savings
                    </span>
                    <Gift className="w-4 h-4 xs:w-5 xs:h-5 text-emerald-500 shrink-0" />
                  </div>
                  <div className="text-xl xs:text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                    {currencyLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="animate-pulse">...</span>
                      </span>
                    ) : (
                      formatPrice(0)
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Switch to yearly to save
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        )}

        {/* Plans Tab - Mobile Optimized */}
        {activeTab === 'plans' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl xs:rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-700 p-4 xs:p-5 sm:p-6 md:p-8"
          >
            <div className="text-center mb-6 xs:mb-7 sm:mb-8">
              <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-2 xs:mb-3">
                Choose Your Plan
              </h2>
              <p className="text-sm xs:text-base text-slate-600 dark:text-slate-400 px-2">
                Select the perfect plan for your needs. All plans include a 30-day money-back
                guarantee.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowProModal(true)}
              className="w-full sm:w-auto mx-auto block px-6 xs:px-8 py-3 xs:py-4 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg text-base xs:text-lg touch-manipulation min-h-[44px]"
            >
              View All Plans & Pricing
            </motion.button>
          </motion.div>
        )}

        {/* Billing History Tab - Mobile Optimized */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl xs:rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-700 p-4 xs:p-5 sm:p-6 md:p-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 xs:gap-4 mb-4 xs:mb-5 sm:mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl xs:text-2xl font-bold mb-1">Billing History</h2>
                <p className="text-sm xs:text-base text-slate-600 dark:text-slate-400">
                  View and download your invoices
                </p>
              </div>
              {billingHistory.length > 0 && (
                <div className="flex gap-1.5 xs:gap-2 overflow-x-auto scrollbar-hide pb-2 w-full sm:w-auto -mx-4 xs:-mx-5 sm:mx-0 px-4 xs:px-5 sm:px-0">
                  {['all', 'paid', 'pending', 'failed'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg font-medium whitespace-nowrap transition-all text-xs xs:text-sm touch-manipulation min-h-[44px] shrink-0 ${
                        selectedFilter === filter
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredHistory.length > 0 ? (
              <div className="space-y-2 xs:space-y-3">
                {filteredHistory.map((invoice, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 xs:gap-4 p-3 xs:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all"
                  >
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <div className="flex items-center gap-2 xs:gap-3 mb-2 flex-wrap">
                        <Receipt className="w-4 h-4 xs:w-5 xs:h-5 text-emerald-500 shrink-0" />
                        <div className="font-semibold text-sm xs:text-base text-slate-900 dark:text-white min-w-0 flex-1">
                          <span className="wrap-break-word">
                            {invoice.plan || 'Subscription'} Plan
                          </span>
                          <span className="hidden xs:inline"> - {invoice.period || 'Monthly'}</span>
                        </div>
                        <div className="shrink-0">{getStatusBadge(invoice.status || 'paid')}</div>
                      </div>
                      <div className="text-xs xs:text-sm text-slate-600 dark:text-slate-400 ml-6 xs:ml-8">
                        {new Date(invoice.date || Date.now()).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 xs:gap-4 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <div className="text-lg xs:text-xl font-bold text-slate-900 dark:text-white">
                          {currencyLoading ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="animate-pulse">...</span>
                            </span>
                          ) : (
                            formatPrice(getInvoiceAmount(invoice))
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Invoice #{invoice.id || `INV-${idx + 1}`}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDownloadInvoice(invoice.id || idx)}
                        className="px-3 xs:px-4 py-2 bg-emerald-100 dark:bg-emerald-900/20 hover:bg-emerald-200 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium rounded-lg flex items-center gap-1.5 xs:gap-2 transition-colors touch-manipulation min-h-[44px] shrink-0"
                      >
                        <Download className="w-3.5 h-3.5 xs:w-4 xs:h-4 shrink-0" />
                        <span className="text-xs xs:text-sm">Download</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 xs:py-10 sm:py-12">
                <Receipt className="w-12 h-12 xs:w-16 xs:h-16 text-slate-300 dark:text-slate-600 mx-auto mb-3 xs:mb-4" />
                <p className="text-slate-500 dark:text-slate-400 text-base xs:text-lg mb-2">
                  No billing history available
                </p>
                {isFree && (
                  <p className="text-sm xs:text-base text-slate-400 dark:text-slate-500 px-4">
                    Subscribe to a plan to see your billing history here.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Payment Methods Tab - Mobile Optimized */}
        {activeTab === 'payment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 xs:space-y-5 sm:space-y-6"
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl xs:rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-700 p-4 xs:p-5 sm:p-6 md:p-8">
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4 mb-4 xs:mb-5 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl xs:text-2xl font-bold mb-1">Payment Methods</h2>
                  <p className="text-sm xs:text-base text-slate-600 dark:text-slate-400">
                    Manage your payment methods securely
                  </p>
                </div>
                {!isFree && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpdatePaymentMethod}
                    className="w-full xs:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 touch-manipulation min-h-[44px] shrink-0"
                  >
                    <CardIcon className="w-4 h-4 shrink-0" />
                    <span>Update Payment Method</span>
                  </motion.button>
                )}
              </div>

              {isFree ? (
                <div className="text-center py-6 xs:py-8">
                  <CardIcon className="w-12 h-12 xs:w-16 xs:h-16 text-slate-300 dark:text-slate-600 mx-auto mb-3 xs:mb-4" />
                  <p className="text-sm xs:text-base text-slate-500 dark:text-slate-400 mb-4 px-4">
                    No payment method on file. Subscribe to a plan to add a payment method.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveTab('plans');
                      setTimeout(() => setShowProModal(true), 300);
                    }}
                    className="px-5 xs:px-6 py-2.5 xs:py-3 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl touch-manipulation min-h-[44px]"
                  >
                    View Plans
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3 xs:space-y-4">
                  <div className="p-4 xs:p-5 sm:p-6 bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4 mb-3 xs:mb-4">
                      <div className="flex items-center gap-2 xs:gap-3">
                        <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-md shrink-0">
                          <CardIcon className="w-5 h-5 xs:w-6 xs:h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm xs:text-base text-slate-900 dark:text-white wrap-break-word">
                            •••• •••• •••• 4242
                          </div>
                          <div className="text-xs xs:text-sm text-slate-600 dark:text-slate-400">
                            Expires 12/25
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Shield className="w-4 h-4 xs:w-5 xs:h-5 text-emerald-500" />
                        <span className="text-xs xs:text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          Secure
                        </span>
                      </div>
                    </div>
                    <p className="text-xs xs:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      💡 Your payment information is securely stored by our payment processor. Click
                      "Update Payment Method" to change your card or billing details.
                    </p>
                  </div>

                  <div className="p-3 xs:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="text-xs xs:text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Billing Email
                    </div>
                    <div className="font-medium text-sm xs:text-base text-slate-900 dark:text-white flex items-center gap-2 break-all">
                      <Mail className="w-3.5 h-3.5 xs:w-4 xs:h-4 shrink-0" />
                      <span className="min-w-0 wrap-break-word">{user?.email || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Security Info - Mobile Optimized */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 xs:p-5 sm:p-6 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3 xs:gap-4">
                <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base xs:text-lg mb-2 flex items-center gap-2 flex-wrap">
                    <Shield className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Your Payment Information is Secure</span>
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 text-xs xs:text-sm mb-3 leading-relaxed">
                    We use industry-leading payment processors (Stripe, Paddle, Paystack) that are
                    PCI-DSS compliant. Your card details are encrypted and never stored on our
                    servers. All transactions are processed securely.
                  </p>
                  <div className="flex flex-wrap gap-1.5 xs:gap-2">
                    {['PCI-DSS Compliant', '256-bit SSL Encryption', 'SOC 2 Certified'].map(
                      badge => (
                        <span
                          key={badge}
                          className="px-2.5 xs:px-3 py-1 bg-white dark:bg-slate-800 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300"
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

        {/* Help & FAQ Tab - Mobile Optimized */}
        {activeTab === 'help' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl xs:rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-700 p-4 xs:p-5 sm:p-6 md:p-8"
          >
            <div className="mb-4 xs:mb-5 sm:mb-6">
              <h2 className="text-xl xs:text-2xl font-bold mb-2 flex items-center gap-2 flex-wrap">
                <HelpCircle className="w-5 h-5 xs:w-6 xs:h-6 text-emerald-500 shrink-0" />
                <span>Billing & Subscription FAQ</span>
              </h2>
              <p className="text-sm xs:text-base text-slate-600 dark:text-slate-400">
                Common questions about billing, payments, and subscriptions
              </p>
            </div>

            <div className="space-y-2 xs:space-y-3">
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
                      className="w-full px-4 xs:px-5 py-3 xs:py-4 flex items-start justify-between gap-3 xs:gap-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors touch-manipulation min-h-[44px]"
                    >
                      <div className="flex items-start gap-2 xs:gap-3 flex-1 min-w-0">
                        <HelpCircle className="w-4 h-4 xs:w-5 xs:h-5 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="font-semibold text-sm xs:text-base text-slate-900 dark:text-white text-left leading-snug">
                          {item.q}
                        </span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 xs:w-5 xs:h-5 text-slate-400 shrink-0 transition-transform ${
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
                          <p className="px-4 xs:px-5 pb-3 xs:pb-4 ml-6 xs:ml-8 text-xs xs:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Additional Help - Mobile Optimized */}
            <div className="mt-6 xs:mt-7 sm:mt-8 pt-6 xs:pt-7 sm:pt-8 border-t border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-base xs:text-lg mb-3 xs:mb-4">Still Need Help?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                <a
                  href="/help"
                  className="p-3 xs:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 xs:gap-3 touch-manipulation min-h-[44px]"
                >
                  <HelpCircle className="w-4 h-4 xs:w-5 xs:h-5 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm xs:text-base">Help Center</div>
                    <div className="text-xs xs:text-sm text-slate-600 dark:text-slate-400">
                      Browse all help articles
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-slate-400 shrink-0" />
                </a>
                <a
                  href="/terms"
                  className="p-3 xs:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 xs:gap-3 touch-manipulation min-h-[44px]"
                >
                  <FileText className="w-4 h-4 xs:w-5 xs:h-5 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm xs:text-base">Terms & Policies</div>
                    <div className="text-xs xs:text-sm text-slate-600 dark:text-slate-400">
                      Read our terms of service
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-slate-400 shrink-0" />
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
