import React, { useEffect, useState } from "react";

export default function ProModal({ open, onClose }) {
    const [selectedPlan, setSelectedPlan] = useState("free");

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
            period: "forever",
            emoji: "🎉",
            color: "emerald",
            limits: "10 searches/day",
            features: [
                "🍳 10 recipe searches per day",
                "📋 Basic grocery lists",
                "⭐ Save up to 20 favorites",
                "🔍 Filter by diet & time",
                "📱 Works on all devices",
                "💚 No ads, ever"
            ]
        },
        supporter: {
            name: "Supporter",
            price: 3.99,
            period: "month",
            emoji: "☕",
            badge: "Most Popular!",
            color: "amber",
            limits: "50 searches/day",
            features: [
                "✨ 50 searches per day",
                "📊 Nutrition info unlocked",
                "🛒 Unlimited smart grocery lists",
                "💾 Cloud sync across devices",
                "⭐ Save unlimited favorites",
                "🚀 Priority recipe results",
                "💝 Help keep us free for others"
            ]
        },
        unlimited: {
            name: "Unlimited",
            price: 7.99,
            period: "month",
            emoji: "🦸",
            badge: "Best Value!",
            color: "violet",
            limits: "Unlimited!",
            features: [
                "✨ Unlimited searches, forever",
                "⚡ Instant recipe loading",
                "🍽️ Meal planning calendar",
                "📸 Recipe photo uploads",
                "🎯 Advanced dietary filters",
                "📈 Recipe analytics & insights",
                "🏆 Early access to new features"
            ]
        },
        family: {
            name: "Family Plan",
            price: 9.99,
            period: "month",
            emoji: "🏠",
            badge: "New!",
            color: "rose",
            limits: "10 members",
            features: [
                "✨ Everything in Unlimited",
                "👨‍👩‍👧‍👦 Up to 10 family members",
                "⚠️ Per-person allergy tracking",
                "🍴 Portion control by age",
                "✅ Meal completion checklist",
                "👶 Kid-safe recipe filtering",
                "📊 Family meal logs & reports"
            ]
        }
    };

    const currentPlan = plans[selectedPlan];

    const handleSubscribe = async () => {
        if (selectedPlan === "free") {
            alert("You're all set! Start cooking! 🎉");
            onClose();
            return;
        }
        alert(`Thanks for supporting us! ${currentPlan.name} ($${currentPlan.price}/mo) coming soon! 🌟`);
        onClose();
    };


    return (
        <>
            {open && (
                <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 py-8 overflow-y-auto">
                    <div className="w-full max-w-3xl flex flex-col rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl my-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="text-3xl sm:text-4xl">
                                    🍽️
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl sm:text-2xl">Choose Your Plan</h3>
                                    <p className="text-xs sm:text-sm text-slate-400">All plans = no ads, ever!</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-2xl hover:text-emerald-400 transition-colors"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[70vh]">
                            {/* All Plans Stacked Vertically */}
                            <div className="space-y-4">
                                {Object.entries(plans).map(([key, plan], index) => (
                                    <div
                                        key={key}
                                        className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
                                            selectedPlan === key
                                                ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                                                : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
                                        }`}
                                        onClick={() => setSelectedPlan(key)}
                                    >
                                        {plan.badge && (
                                            <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                                                {plan.badge}
                                            </span>
                                        )}
                                        
                                        {/* Plan Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-4xl">{plan.emoji}</span>
                                                <div>
                                                    <div className="font-bold text-xl">{plan.name}</div>
                                                    <div className="text-xs text-slate-400">{plan.limits}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-extrabold text-emerald-500">
                                                    {plan.price === 0 ? "FREE" : `$${plan.price}`}
                                                    {plan.price > 0 && (
                                                        <span className="text-lg text-slate-400">/{plan.period}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Features */}
                                        <div className="space-y-2">
                                            {plan.features.map((feature, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-start gap-3 text-sm"
                                                >
                                                    <span className="text-xl flex-shrink-0">{feature.split(" ")[0]}</span>
                                                    <span>{feature.split(" ").slice(1).join(" ")}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Subscribe Button for Selected Plan */}
                                        {selectedPlan === key && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSubscribe();
                                                }}
                                                className={`w-full mt-4 px-6 py-3 rounded-xl font-bold text-lg transition-all shadow-lg ${
                                                    selectedPlan === "free"
                                                        ? "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/50 text-white"
                                                        : selectedPlan === "supporter"
                                                            ? "bg-amber-600 hover:bg-amber-700 hover:shadow-amber-500/50 text-white"
                                                            : "bg-violet-600 hover:bg-violet-700 hover:shadow-violet-500/50 text-white"
                                                }`}
                                            >
                                                {selectedPlan === "free" ? "Start Cooking Now! 🎉" : `Upgrade to ${plan.name}!`}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <p className="text-center text-xs text-slate-500 mt-6">
                                Made with ❤️ to help you decide what's for dinner
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
