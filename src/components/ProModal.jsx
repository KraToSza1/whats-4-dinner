import React, { useEffect, useState } from 'react';
import {
  PLAN_DETAILS,
  PLANS,
  setCurrentPlan,
  getCurrentPlanSync,
  getCurrentPlan,
} from '../utils/subscription.js';
import { redirectToCheckout } from '../utils/paymentProviders.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProModal({ open, onClose }) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(() => getCurrentPlanSync() || PLANS.FREE);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // "monthly" or "yearly"
  const [isProcessing, setIsProcessing] = useState(false);

  // Refresh plan when modal opens or plan changes
  useEffect(() => {
    if (open) {
      // Refresh plan from Supabase when modal opens
      getCurrentPlan().then(plan => {
        setSelectedPlan(plan || PLANS.FREE);
      });
    }
  }, [open]);

  // Listen for plan changes
  useEffect(() => {
    const handlePlanChange = () => {
      const currentPlan = getCurrentPlanSync() || PLANS.FREE;
      setSelectedPlan(currentPlan);
    };
    window.addEventListener('subscriptionPlanChanged', handlePlanChange);
    return () => window.removeEventListener('subscriptionPlanChanged', handlePlanChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const plans = {
    free: {
      name: 'Free',
      price: 0,
      priceMonthly: 0,
      priceYearly: 0,
      period: 'forever',
      emoji: '🎉',
      color: 'emerald',
      limits: 'Unlimited!',
      badge: null,
      description: 'Perfect for trying out the app',
      whyUpgrade:
        'Upgrade to unlock filters, instant loading, AI meal planner, food scan, dietician AI, and more!',
      features: [
        '✨ Unlimited recipe searches',
        '⭐ Unlimited favorites',
        '🛒 Unlimited grocery lists',
        '💧 Water tracker',
        '📊 Full nutrition details',
      ],
      adNote: null, // No ads for anyone!
    },
    supporter: {
      name: 'Supporter',
      price: 2.99,
      priceMonthly: 2.99,
      priceYearly: 29.99,
      period: 'month',
      emoji: '☕',
      badge: 'Most Popular!',
      color: 'amber',
      limits: 'Unlimited!',
      description: 'Perfect for daily cooking enthusiasts',
      whyUpgrade:
        'Unlock AI meal planner, meal planning calendar, limited analytics & budget tracker!',
      benefits: [
        '✨ Unlimited searches - Find recipes for every meal',
        '⭐ Unlimited favorites - Build your personal recipe collection',
        '🤖 AI meal planner - Smart meal suggestions powered by AI',
        '🍽️ Meal planning calendar - Plan your week ahead (7 days)',
        '📊 Limited analytics - Track your cooking habits',
        '💰 Limited budget tracker - Monitor your spending',
        '📊 Full nutrition info - Make informed food choices',
        '🛒 Unlimited grocery lists - Organize all your shopping',
        '💝 Support development - Help us build better features',
      ],
      features: [
        '✨ Unlimited searches',
        '⭐ Unlimited favorites',
        '🤖 AI meal planner',
        '🍽️ Meal planning calendar (7 days)',
        '📊 Limited analytics & insights',
        '💰 Limited budget tracker',
        '📊 Full nutrition info',
        '🛒 Unlimited grocery lists',
        '💝 Support the app development',
      ],
      savings: 'Save 17% with yearly ($2.50/mo)',
      valueProp: 'Best for: Daily home cooks who want AI meal planning',
    },
    unlimited: {
      name: 'Unlimited',
      price: 4.99,
      priceMonthly: 4.99,
      priceYearly: 49.99,
      period: 'month',
      emoji: '🦸',
      badge: 'Best Value!',
      color: 'violet',
      limits: 'Unlimited!',
      description: 'For serious home chefs and meal planners',
      whyUpgrade:
        'Unlock smart food scan, water tracker, dietician AI, full analytics & budget tracker!',
      benefits: [
        '✨ Unlimited searches - Never run out of recipe ideas',
        '⭐ Unlimited favorites - Save every recipe you love',
        '⚡ Instant loading - Fast, smooth recipe browsing',
        '🤖 AI meal planner - Smart meal suggestions',
        '📸 Smart food scan - Take a photo, get instant nutrition',
        '💧 Water tracker - Track hydration with reminders',
        '👨‍⚕️ Dietician AI - Professional meal planning assistance',
        '📈 Full analytics - Comprehensive cooking insights',
        '💰 Full budget tracker - Complete spending analysis',
        '🍽️ Unlimited meal planning - Plan as far ahead as you want',
        '🎯 Advanced filters - Find exactly what you need',
        '🏆 Early access - Try new features first',
      ],
      features: [
        '✨ Unlimited searches, forever',
        '⭐ Unlimited favorites',
        '⚡ Instant recipe loading',
        '🤖 AI meal planner',
        '📸 Smart food scan (photo to nutrition)',
        '💧 Water tracker with reminders',
        '👨‍⚕️ Dietician AI meal planner',
        '📈 Full analytics & insights',
        '💰 Full budget tracker',
        '🍽️ Unlimited meal planning',
        '🎯 Advanced dietary filters',
        '🏆 Early access to new features',
      ],
      savings: 'Save 16% with yearly ($4.17/mo)',
      valueProp: 'Best for: Serious cooks who want AI-powered features',
    },
    family: {
      name: 'Family',
      price: 9.99,
      priceMonthly: 9.99,
      priceYearly: 99.99,
      period: 'month',
      emoji: '🏠',
      badge: 'New!',
      color: 'rose',
      limits: 'Unlimited members',
      description: 'Perfect for families with multiple dietary needs',
      whyUpgrade:
        "Manage your entire family's meals, allergies, and preferences with unlimited members!",
      benefits: [
        '✨ Everything in Unlimited - All premium features included',
        '👨‍👩‍👧‍👦 Unlimited family members - Track everyone in your family',
        '📸 Smart food scan - Scan meals for instant nutrition',
        '💧 Water tracker - Track hydration for each family member',
        '👨‍⚕️ Dietician AI - Professional meal planning for your family',
        '⚠️ Per-person allergy tracking - Keep everyone safe',
        '🍴 Portion control by age - Right portions for kids and adults',
        '✅ Meal completion checklist - Ensure everyone eats well',
        '👶 Kid-safe filtering - Age-appropriate recipes only',
        '📊 Full family analytics - Track nutrition for the whole family',
        '💰 Full budget tracker - Manage family meal costs',
        '💾 Generous cloud storage - All family data synced',
      ],
      features: [
        '✨ Everything in Unlimited',
        '👨‍👩‍👧‍👦 Unlimited family members',
        '📸 Smart food scan',
        '💧 Water tracker',
        '👨‍⚕️ Dietician AI meal planner',
        '⚠️ Per-person allergy tracking',
        '🍴 Portion control by age',
        '✅ Meal completion checklist',
        '👶 Kid-safe recipe filtering',
        '📊 Full family analytics & reports',
        '💰 Full budget tracker',
        '💾 Generous cloud storage',
      ],
      savings: 'Save 17% with yearly ($8.33/mo)',
      valueProp: 'Best for: Families who want unlimited members and full features',
    },
  };

  const currentPlan = plans[selectedPlan] || plans.free; // Fallback to free plan if invalid
  const currentPrice =
    billingPeriod === 'yearly' ? currentPlan?.priceYearly || 0 : currentPlan?.priceMonthly || 0;
  const pricePerMonth = billingPeriod === 'yearly' ? (currentPrice / 12).toFixed(2) : currentPrice;

  const handleSubscribe = async () => {
    if (selectedPlan === 'free') {
      // Stay on free plan
      setCurrentPlan(PLANS.FREE);
      // Use window event to show toast
      if (window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent('showToast', {
            detail: {
              type: 'success',
              message: "You're all set! Start cooking! 🎉",
              duration: 5000,
            },
          })
        );
      } else {
        alert("You're all set! Start cooking! 🎉");
      }
      onClose();
      return;
    }

    setIsProcessing(true);

    try {
      // Get user email if available
      const userEmail = user?.email || null;

      // Redirect to Paddle checkout (or configured payment provider)
      await redirectToCheckout(selectedPlan, billingPeriod, userEmail);

      // Note: User will be redirected to Paddle, so we don't need to do anything else here
      // The webhook will handle updating the subscription when payment is successful
    } catch (error) {
      console.error('Subscription error:', error);
      setIsProcessing(false);
      // Error message is already shown in redirectToCheckout
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-1 xs:p-2 sm:p-3 md:p-4 overflow-y-auto safe-px">
          <div
            className="w-full max-w-[calc(100vw-0.5rem)] xs:max-w-[calc(100vw-1rem)] sm:max-w-3xl flex flex-col rounded-lg xs:rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl my-auto max-h-[calc(100vh-0.5rem)] xs:max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6 border-b border-slate-800 shrink-0 gap-2">
              <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="text-xl xs:text-2xl sm:text-3xl md:text-4xl flex-shrink-0">🍽️</div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl truncate break-words">
                    Choose Your Plan
                  </h3>
                  <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-slate-400 line-clamp-2 break-words">
                    {selectedPlan === 'free'
                      ? 'Free plan includes ads. Upgrade to remove them!'
                      : 'All paid plans include no ads!'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-lg xs:text-xl sm:text-2xl hover:text-emerald-400 transition-colors flex-shrink-0 ml-1 xs:ml-2 sm:ml-3 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 flex items-center justify-center touch-manipulation min-h-[44px] xs:min-h-0"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6 overflow-y-auto max-h-[calc(100vh-120px)] xs:max-h-[calc(100vh-140px)] sm:max-h-[70vh] scrollbar-hide">
              {/* Billing Period Toggle (shown for all plans, but only affects paid plans) */}
              <div className="mb-4 sm:mb-6 flex items-center justify-center gap-1.5 sm:gap-2 bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all min-h-[36px] sm:min-h-0 ${
                    billingPeriod === 'monthly'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all relative min-h-[36px] sm:min-h-0 ${
                    billingPeriod === 'yearly'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Yearly
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                    Save
                  </span>
                </button>
              </div>
              {selectedPlan !== 'free' && billingPeriod === 'yearly' && (
                <div className="mb-4 p-2 sm:p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
                  <p className="text-[10px] sm:text-xs text-amber-300 font-semibold">
                    💰 Save up to 17% with yearly billing!
                  </p>
                </div>
              )}

              {/* All Plans Stacked Vertically */}
              <div className="space-y-3 sm:space-y-4">
                {Object.entries(plans).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`relative p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border-2 transition-all cursor-pointer ${
                      selectedPlan === key
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                        : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                    }`}
                    onClick={() => setSelectedPlan(key)}
                  >
                    {plan.badge && (
                      <span className="absolute -top-1.5 sm:-top-2 left-1/2 transform -translate-x-1/2 px-2 sm:px-3 py-0.5 sm:py-1 bg-amber-500 text-white text-[10px] sm:text-xs font-bold rounded-full whitespace-nowrap">
                        {plan.badge}
                      </span>
                    )}

                    {/* Plan Header */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <span className="text-2xl sm:text-3xl md:text-4xl flex-shrink-0">
                          {plan.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-base sm:text-lg md:text-xl truncate">
                            {plan.name}
                          </div>
                          <div className="text-[10px] sm:text-xs text-slate-400 truncate">
                            {plan.limits}
                          </div>
                          {plan.description && (
                            <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 truncate">
                              {/* Shortened for mobile */}
                              <span className="hidden sm:inline">{plan.description}</span>
                              <span className="sm:hidden">
                                {plan.description.length > 30
                                  ? plan.description.substring(0, 27) + '...'
                                  : plan.description}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-500 leading-tight">
                          {plan.price === 0 ? (
                            <>
                              <span className="text-emerald-400">FREE</span>
                              <div className="text-[10px] sm:text-xs text-slate-400 mt-1">
                                Forever
                              </div>
                              {/* Show what paid plans cost for comparison */}
                              <div className="text-[9px] sm:text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-700">
                                <div>Supporter: ${plans.supporter.priceMonthly}/mo</div>
                                <div>Unlimited: ${plans.unlimited.priceMonthly}/mo</div>
                                <div>Family: ${plans.family.priceMonthly}/mo</div>
                              </div>
                            </>
                          ) : (
                            <>
                              {billingPeriod === 'yearly' && key !== 'free' ? (
                                <>
                                  <span className="text-sm sm:text-base md:text-lg text-slate-400 line-through mr-1">
                                    ${plan.priceMonthly}/mo
                                  </span>
                                  <br />
                                  <span className="text-emerald-400">
                                    ${(plan.priceYearly / 12).toFixed(2)}/mo
                                  </span>
                                  <span className="text-sm sm:text-base md:text-lg text-slate-400">
                                    {' '}
                                    (${plan.priceYearly}/yr)
                                  </span>
                                </>
                              ) : (
                                <>
                                  ${plan.priceMonthly}
                                  <span className="text-sm sm:text-base md:text-lg text-slate-400">
                                    /mo
                                  </span>
                                  {billingPeriod === 'yearly' && (
                                    <div className="text-[10px] sm:text-xs text-slate-400 mt-1">
                                      or ${plan.priceYearly}/yr
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                        {billingPeriod === 'yearly' && key !== 'free' && plan.savings && (
                          <div className="text-[10px] sm:text-xs text-emerald-400 font-normal mt-1 line-clamp-1">
                            💰 {plan.savings}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ad Note for Free Plan */}
                    {key === 'free' && plan.adNote && (
                      <div className="mb-3 p-2 sm:p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-[10px] sm:text-xs text-amber-400 font-medium">
                          {plan.adNote}
                        </p>
                      </div>
                    )}

                    {/* Why Upgrade (for paid plans) */}
                    {key !== 'free' && plan.whyUpgrade && (
                      <div className="mb-3 p-2 sm:p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-lg">
                        <p className="text-[10px] sm:text-xs text-emerald-300 font-semibold">
                          ✨ <span className="hidden sm:inline">{plan.whyUpgrade}</span>
                          <span className="sm:hidden">
                            {plan.whyUpgrade.length > 50
                              ? plan.whyUpgrade.substring(0, 47) + '...'
                              : plan.whyUpgrade}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Value Proposition */}
                    {key !== 'free' && plan.valueProp && (
                      <div className="mb-3 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-[10px] sm:text-xs text-slate-300 italic">
                          <span className="hidden sm:inline">{plan.valueProp}</span>
                          <span className="sm:hidden">
                            {plan.valueProp.length > 40
                              ? plan.valueProp.substring(0, 37) + '...'
                              : plan.valueProp}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Features */}
                    <div className="space-y-1.5 sm:space-y-2">
                      {(plan.benefits || plan.features).map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm"
                        >
                          <span className="text-base sm:text-lg md:text-xl flex-shrink-0">
                            {feature.split(' ')[0]}
                          </span>
                          <span className="min-w-0 flex-1 break-words">
                            {feature.split(' ').slice(1).join(' ')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Savings Note for Yearly */}
                    {billingPeriod === 'yearly' && key !== 'free' && plan.savings && (
                      <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <p className="text-[10px] sm:text-xs text-emerald-400 font-medium text-center line-clamp-1">
                          💰 {plan.savings}
                        </p>
                      </div>
                    )}

                    {/* Subscribe Button for Selected Plan */}
                    {selectedPlan === key && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleSubscribe();
                        }}
                        className={`w-full mt-3 sm:mt-4 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all shadow-lg min-h-[36px] sm:min-h-0 touch-manipulation ${
                          selectedPlan === 'free'
                            ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/50 text-white'
                            : selectedPlan === 'supporter'
                              ? 'bg-amber-600 hover:bg-amber-700 hover:shadow-amber-500/50 text-white'
                              : selectedPlan === 'unlimited'
                                ? 'bg-violet-600 hover:bg-violet-700 hover:shadow-violet-500/50 text-white'
                                : 'bg-rose-600 hover:bg-rose-700 hover:shadow-rose-500/50 text-white'
                        }`}
                      >
                        <span className="line-clamp-2">
                          {isProcessing ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="animate-spin">⏳</span>
                              Redirecting to checkout...
                            </span>
                          ) : selectedPlan === 'free' ? (
                            'Start Cooking Now! 🎉'
                          ) : (
                            <>
                              {billingPeriod === 'yearly' ? (
                                <>
                                  Upgrade to {plan.name} - ${(currentPrice / 12).toFixed(2)}/mo
                                  <br />
                                  <span className="text-xs opacity-90">
                                    (Billed ${currentPrice}/year)
                                  </span>
                                </>
                              ) : (
                                `Upgrade to ${plan.name} - $${pricePerMonth}/mo`
                              )}
                            </>
                          )}
                        </span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-center text-[10px] sm:text-xs text-slate-500 mt-4 sm:mt-6 px-2">
                Made with ❤️ to help you decide what's for dinner
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
