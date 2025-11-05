import React, { useEffect, useState } from "react";
import { PLAN_DETAILS, PLANS, setCurrentPlan, getCurrentPlan } from "../utils/subscription.js";
import { redirectToCheckout } from "../utils/paymentProviders.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProModal({ open, onClose }) {
    const { user } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState(getCurrentPlan());
    const [billingPeriod, setBillingPeriod] = useState("monthly"); // "monthly" or "yearly"
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    if (!open) return null;

    const plans = {
        free: {
            name: "Free",
            price: 0,
            priceMonthly: 0,
            priceYearly: 0,
            period: "forever",
            emoji: "🎉",
            color: "emerald",
            limits: "10 searches/day",
            badge: null,
            features: [
                "🍳 10 recipe searches per day",
                "📋 Basic grocery lists",
                "⭐ Save up to 20 favorites",
                "🔍 Filter by diet & time",
                "📱 Works on all devices",
                "📢 Ad-supported (removable)"
            ],
            adNote: "Free plan includes ads. Upgrade to remove them!",
        },
        supporter: {
            name: "Supporter",
            price: 2.99,
            priceMonthly: 2.99,
            priceYearly: 29.99,
            period: "month",
            emoji: "☕",
            badge: "Most Popular!",
            color: "amber",
            limits: "50 searches/day",
            features: [
                "🚫 No ads, ever",
                "✨ 50 searches per day",
                "⭐ Save up to 100 favorites",
                "📊 Nutrition info unlocked",
                "🛒 Unlimited smart grocery lists",
                "💾 Cloud sync across devices",
                "💝 Support the app development"
            ],
            savings: "Save 17% with yearly ($2.50/mo)",
        },
        unlimited: {
            name: "Unlimited",
            price: 4.99,
            priceMonthly: 4.99,
            priceYearly: 49.99,
            period: "month",
            emoji: "🦸",
            badge: "Best Value!",
            color: "violet",
            limits: "Unlimited!",
            features: [
                "🚫 No ads, ever",
                "✨ Unlimited searches, forever",
                "⭐ Unlimited favorites",
                "⚡ Instant recipe loading",
                "🍽️ Meal planning calendar",
                "📈 Recipe analytics & insights",
                "🎯 Advanced dietary filters",
                "🏆 Early access to new features"
            ],
            savings: "Save 16% with yearly ($4.17/mo)",
        },
        family: {
            name: "Family",
            price: 9.99,
            priceMonthly: 9.99,
            priceYearly: 99.99,
            period: "month",
            emoji: "🏠",
            badge: "New!",
            color: "rose",
            limits: "10 members",
            features: [
                "🚫 No ads, ever",
                "✨ Everything in Unlimited",
                "👨‍👩‍👧‍👦 Up to 10 family members",
                "⚠️ Per-person allergy tracking",
                "🍴 Portion control by age",
                "✅ Meal completion checklist",
                "👶 Kid-safe recipe filtering",
                "📊 Family meal logs & reports"
            ],
            savings: "Save 17% with yearly ($8.33/mo)",
        },
    };

    const currentPlan = plans[selectedPlan];
    const currentPrice = billingPeriod === "yearly" ? currentPlan.priceYearly : currentPlan.priceMonthly;
    const pricePerMonth = billingPeriod === "yearly" ? (currentPrice / 12).toFixed(2) : currentPrice;

    const handleSubscribe = async () => {
        if (selectedPlan === "free") {
            // Stay on free plan
            setCurrentPlan(PLANS.FREE);
            alert("You're all set! Start cooking! 🎉");
            onClose();
            return;
        }
        
        setIsProcessing(true);
        
        try {
            // Get user email if available
            const userEmail = user?.email || null;
            
            // Redirect to Stripe checkout
            await redirectToCheckout(selectedPlan, billingPeriod, userEmail);
            
            // Note: User will be redirected to Stripe, so we don't need to do anything else here
            // The webhook will handle updating the subscription when payment is successful
        } catch (error) {
            console.error("Subscription error:", error);
            setIsProcessing(false);
            // Error message is already shown in redirectToCheckout
        }
    };


    return (
        <>
            {open && (
                <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
                    <div className="w-full max-w-3xl flex flex-col rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl my-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-slate-800 shrink-0">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div className="text-2xl sm:text-3xl md:text-4xl flex-shrink-0">
                                    🍽️
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-base sm:text-xl md:text-2xl truncate">Choose Your Plan</h3>
                                    <p className="text-[10px] sm:text-xs md:text-sm text-slate-400 line-clamp-2">
                                        {selectedPlan === "free" 
                                            ? "Free plan includes ads. Upgrade to remove them!" 
                                            : "All paid plans include no ads!"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-xl sm:text-2xl hover:text-emerald-400 transition-colors flex-shrink-0 ml-2 sm:ml-3 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[75vh] sm:max-h-[70vh]">
                            {/* Billing Period Toggle (for paid plans) */}
                            {selectedPlan !== "free" && (
                                <div className="mb-4 sm:mb-6 flex items-center justify-center gap-1.5 sm:gap-2 bg-slate-800 rounded-lg p-1">
                                    <button
                                        onClick={() => setBillingPeriod("monthly")}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all min-h-[36px] sm:min-h-0 ${
                                            billingPeriod === "monthly"
                                                ? "bg-emerald-600 text-white"
                                                : "text-slate-400 hover:text-slate-200"
                                        }`}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        onClick={() => setBillingPeriod("yearly")}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all relative min-h-[36px] sm:min-h-0 ${
                                            billingPeriod === "yearly"
                                                ? "bg-emerald-600 text-white"
                                                : "text-slate-400 hover:text-slate-200"
                                        }`}
                                    >
                                        Yearly
                                        <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full">
                                            Save
                                        </span>
                                    </button>
                                </div>
                            )}
                            
                            {/* All Plans Stacked Vertically */}
                            <div className="space-y-3 sm:space-y-4">
                                {Object.entries(plans).map(([key, plan], index) => (
                                    <div
                                        key={key}
                                        className={`relative p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border-2 transition-all cursor-pointer ${
                                            selectedPlan === key
                                                ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                                                : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
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
                                                <span className="text-2xl sm:text-3xl md:text-4xl flex-shrink-0">{plan.emoji}</span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-base sm:text-lg md:text-xl truncate">{plan.name}</div>
                                                    <div className="text-[10px] sm:text-xs text-slate-400 truncate">{plan.limits}</div>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-500 leading-tight">
                                                    {plan.price === 0 ? "FREE" : (
                                                        <>
                                                            ${billingPeriod === "yearly" && key !== "free" ? plan.priceYearly : plan.priceMonthly}
                                                            {plan.price > 0 && (
                                                                <span className="text-sm sm:text-base md:text-lg text-slate-400">
                                                                    /{billingPeriod === "yearly" ? "yr" : plan.period === "month" ? "mo" : plan.period}
                                                                </span>
                                                            )}
                                                            {billingPeriod === "yearly" && key !== "free" && plan.savings && (
                                                                <div className="text-[10px] sm:text-xs text-emerald-400 font-normal mt-0.5 sm:mt-1 line-clamp-1">
                                                                    {plan.savings}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ad Note for Free Plan */}
                                        {key === "free" && plan.adNote && (
                                            <div className="mb-3 p-2 sm:p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                                <p className="text-[10px] sm:text-xs text-amber-400 font-medium">{plan.adNote}</p>
                                            </div>
                                        )}
                                        
                                        {/* Features */}
                                        <div className="space-y-1.5 sm:space-y-2">
                                            {plan.features.map((feature, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm"
                                                >
                                                    <span className="text-base sm:text-lg md:text-xl flex-shrink-0">{feature.split(" ")[0]}</span>
                                                    <span className="min-w-0 flex-1 break-words">{feature.split(" ").slice(1).join(" ")}</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Savings Note for Yearly */}
                                        {billingPeriod === "yearly" && key !== "free" && plan.savings && (
                                            <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                                <p className="text-[10px] sm:text-xs text-emerald-400 font-medium text-center line-clamp-1">
                                                    💰 {plan.savings}
                                                </p>
                                            </div>
                                        )}

                                        {/* Subscribe Button for Selected Plan */}
                                        {selectedPlan === key && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSubscribe();
                                                }}
                                                className={`w-full mt-3 sm:mt-4 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all shadow-lg min-h-[36px] sm:min-h-0 touch-manipulation ${
                                                    selectedPlan === "free"
                                                        ? "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/50 text-white"
                                                        : selectedPlan === "supporter"
                                                            ? "bg-amber-600 hover:bg-amber-700 hover:shadow-amber-500/50 text-white"
                                                            : selectedPlan === "unlimited"
                                                                ? "bg-violet-600 hover:bg-violet-700 hover:shadow-violet-500/50 text-white"
                                                                : "bg-rose-600 hover:bg-rose-700 hover:shadow-rose-500/50 text-white"
                                                }`}
                                            >
                                                <span className="line-clamp-2">
                                                    {isProcessing ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <span className="animate-spin">⏳</span>
                                                            Processing...
                                                        </span>
                                                    ) : selectedPlan === "free" ? (
                                                        "Start Cooking Now! 🎉"
                                                    ) : (
                                                        `Upgrade to ${plan.name} - $${pricePerMonth}/mo`
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
