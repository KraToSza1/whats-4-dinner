import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "family:members:v1";
const MEAL_LOG_KEY = "family:meal:logs:v1";

const ALLERGIES = [
    "Peanuts", "Tree Nuts", "Milk", "Eggs", "Fish", "Shellfish", 
    "Soy", "Wheat", "Sesame", "Gluten", "Dairy", "Lactose"
];

const DIETARY_RESTRICTIONS = [
    "Vegetarian", "Vegan", "Keto", "Paleo", "Low-Carb", 
    "Low-Sodium", "Diabetic", "Halal", "Kosher"
];

const ROLES = ["parent", "child", "nanny"];

const COMMON_MEMBERS = [
    { name: "Mom", role: "parent", icon: "👩" },
    { name: "Dad", role: "parent", icon: "👨" },
    { name: "Parent", role: "parent", icon: "👤" },
    { name: "Child 1", role: "child", icon: "👶", ageRange: "0-2 years" },
    { name: "Child 2", role: "child", icon: "👦", ageRange: "3-5 years" },
    { name: "Child 3", role: "child", icon: "👧", ageRange: "6-10 years" },
    { name: "Teenager", role: "child", icon: "🧑", ageRange: "11-17 years" },
    { name: "Baby", role: "child", icon: "👶", ageRange: "0-1 year" },
    { name: "Toddler", role: "child", icon: "🧒", ageRange: "2-3 years" },
    { name: "Nanny", role: "nanny", icon: "👷" },
    { name: "Au Pair", role: "nanny", icon: "👨‍🏫" },
    { name: "Grandma", role: "parent", icon: "👵" },
    { name: "Grandpa", role: "parent", icon: "👴" },
];

function readFamilyMembers() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
}

function writeFamilyMembers(members) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

function readMealLogs() {
    try {
        return JSON.parse(localStorage.getItem(MEAL_LOG_KEY) || "{}");
    } catch {
        return {};
    }
}

function writeMealLogs(logs) {
    localStorage.setItem(MEAL_LOG_KEY, JSON.stringify(logs));
}

export default function FamilyPlan() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [members, setMembers] = useState(readFamilyMembers);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [mealLogs, setMealLogs] = useState(readMealLogs);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        role: "child",
        ageRange: "",
        allergies: [],
        dietaryRestrictions: [],
        portionSize: "normal", // "small", "normal", "large"
    });

    useEffect(() => {
        writeFamilyMembers(members);
    }, [members]);

    useEffect(() => {
        writeMealLogs(mealLogs);
    }, [mealLogs]);

    const handleAddMember = () => {
        setFormData({
            name: "",
            role: "child",
            ageRange: "",
            allergies: [],
            dietaryRestrictions: [],
            portionSize: "normal",
        });
        setEditingMember(null);
        setShowAddModal(true);
    };

    const handleEditMember = (member) => {
        setFormData(member);
        setEditingMember(member.id);
        setShowAddModal(true);
    };

    const handleSaveMember = () => {
        if (!formData.name.trim()) {
            alert("Please enter a name");
            return;
        }

        if (editingMember) {
            setMembers(members.map((m) => 
                m.id === editingMember ? { ...formData, id: editingMember } : m
            ));
        } else {
            const newMember = {
                ...formData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
            };
            setMembers([...members, newMember]);
        }

        setShowAddModal(false);
        setEditingMember(null);
    };

    const handleDeleteMember = (id) => {
        setMembers(members.filter((m) => m.id !== id));
        // Also remove from meal logs
        const newLogs = { ...mealLogs };
        Object.keys(newLogs).forEach((date) => {
            newLogs[date] = newLogs[date].filter((log) => log.memberId !== id);
        });
        setMealLogs(newLogs);
    };

    const handleToggleAllergy = (allergy) => {
        setFormData({
            ...formData,
            allergies: formData.allergies.includes(allergy)
                ? formData.allergies.filter((a) => a !== allergy)
                : [...formData.allergies, allergy],
        });
    };

    const handleToggleRestriction = (restriction) => {
        setFormData({
            ...formData,
            dietaryRestrictions: formData.dietaryRestrictions.includes(restriction)
                ? formData.dietaryRestrictions.filter((r) => r !== restriction)
                : [...formData.dietaryRestrictions, restriction],
        });
    };

    const handleMealComplete = (memberId, date, mealType) => {
        const dateKey = date || new Date().toISOString().split("T")[0];
        const logKey = `${dateKey}-${mealType}`;
        
        if (!mealLogs[dateKey]) {
            mealLogs[dateKey] = [];
        }

        const existingIndex = mealLogs[dateKey].findIndex(
            (log) => log.memberId === memberId && log.mealType === mealType
        );

        if (existingIndex >= 0) {
            // Toggle
            mealLogs[dateKey] = mealLogs[dateKey].filter((_, i) => i !== existingIndex);
        } else {
            // Add
            mealLogs[dateKey].push({
                memberId,
                mealType,
                completedAt: new Date().toISOString(),
            });
        }

        setMealLogs({ ...mealLogs });
    };

    const isMealComplete = (memberId, date, mealType) => {
        const dateKey = date || new Date().toISOString().split("T")[0];
        return mealLogs[dateKey]?.some(
            (log) => log.memberId === memberId && log.mealType === mealType
        ) || false;
    };

    const getTodayMeals = () => {
        const today = new Date().toISOString().split("T")[0];
        return mealLogs[today] || [];
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
                    <button
                        onClick={() => navigate("/")}
                        className="px-4 py-2 rounded-md bg-emerald-600 text-white"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Family Plan</h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                Manage family members, allergies, and meal tracking
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddMember}
                            className="px-3 sm:px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm sm:text-base min-h-[36px] sm:min-h-0 touch-manipulation flex items-center justify-center gap-1.5 sm:gap-2"
                            title="Add family member"
                        >
                            <span className="text-lg sm:text-xl">➕</span>
                            <span className="hidden sm:inline">Add Member</span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* Today's Meals Summary */}
                {members.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6"
                    >
                        <h2 className="text-xl font-bold mb-4">Today's Meals</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {members.map((member) => (
                                <div
                                    key={member.id}
                                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                                >
                                    <h3 className="font-semibold mb-3">{member.name}</h3>
                                    <div className="space-y-2">
                                        {["breakfast", "lunch", "dinner"].map((mealType) => (
                                            <label
                                                key={mealType}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isMealComplete(member.id, null, mealType)}
                                                    onChange={() =>
                                                        handleMealComplete(member.id, null, mealType)
                                                    }
                                                    className="w-4 h-4 rounded"
                                                />
                                                <span className="capitalize">{mealType}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* Family Members */}
                {members.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center"
                    >
                        <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
                        <h2 className="text-2xl font-bold mb-2">No family members yet</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Add family members to track allergies, dietary restrictions, and meals
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddMember}
                            className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm sm:text-base min-h-[36px] sm:min-h-0 touch-manipulation flex items-center justify-center gap-2 mx-auto"
                            title="Add family member"
                        >
                            <span className="text-lg sm:text-xl">➕</span>
                            <span className="hidden xs:inline">Add Your First Family Member</span>
                            <span className="xs:hidden">Add Member</span>
                        </motion.button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {members.map((member) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold">{member.name}</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                                            {member.role}
                                            {member.ageRange && ` • ${member.ageRange}`}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditMember(member)}
                                            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMember(member.id)}
                                            className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30"
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                {member.allergies.length > 0 && (
                                    <div className="mb-3">
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                                            Allergies
                                        </label>
                                        <div className="flex flex-wrap gap-1">
                                            {member.allergies.map((allergy) => (
                                                <span
                                                    key={allergy}
                                                    className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded"
                                                >
                                                    {allergy}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {member.dietaryRestrictions.length > 0 && (
                                    <div className="mb-3">
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                                            Dietary Restrictions
                                        </label>
                                        <div className="flex flex-wrap gap-1">
                                            {member.dietaryRestrictions.map((restriction) => (
                                                <span
                                                    key={restriction}
                                                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded"
                                                >
                                                    {restriction}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                                        Portion Size
                                    </label>
                                    <span className="text-sm capitalize">{member.portionSize}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Add/Edit Modal */}
                <AnimatePresence>
                    {showAddModal && (
                        <>
                            <div
                                className="fixed inset-0 bg-black/50 z-40"
                                onClick={() => setShowAddModal(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            >
                                <div
                                    className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <h2 className="text-2xl font-bold mb-6">
                                        {editingMember ? "Edit Family Member" : "Add Family Member"}
                                    </h2>

                                    <div className="space-y-4">
                                        {/* Quick Add Common Members */}
                                        {!editingMember && (
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Quick Add Common Members
                                                </label>
                                                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    {COMMON_MEMBERS.map((member, idx) => (
                                                        <motion.button
                                                            key={idx}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({
                                                                    ...formData,
                                                                    name: member.name,
                                                                    role: member.role,
                                                                    ageRange: member.ageRange || "",
                                                                    allergies: [],
                                                                    dietaryRestrictions: [],
                                                                    portionSize: member.role === "child" ? "small" : "normal",
                                                                });
                                                            }}
                                                            className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center gap-2 text-sm font-medium"
                                                        >
                                                            <span className="text-lg">{member.icon}</span>
                                                            <span>{member.name}</span>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, name: e.target.value })
                                                }
                                                className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                placeholder="Enter name"
                                            />
                                        </div>

                                        {/* Role */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Role
                                            </label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, role: e.target.value })
                                                }
                                                className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                            >
                                                {ROLES.map((role) => (
                                                    <option key={role} value={role}>
                                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Age Range (for children) */}
                                        {formData.role === "child" && (
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Age Range
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.ageRange}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            ageRange: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                    placeholder="e.g., 5-10 years"
                                                />
                                            </div>
                                        )}

                                        {/* Allergies */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Allergies
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {ALLERGIES.map((allergy) => (
                                                    <button
                                                        key={allergy}
                                                        onClick={() => handleToggleAllergy(allergy)}
                                                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                                                            formData.allergies.includes(allergy)
                                                                ? "bg-red-600 text-white"
                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                        }`}
                                                    >
                                                        {allergy}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Dietary Restrictions */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Dietary Restrictions
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {DIETARY_RESTRICTIONS.map((restriction) => (
                                                    <button
                                                        key={restriction}
                                                        onClick={() =>
                                                            handleToggleRestriction(restriction)
                                                        }
                                                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                                                            formData.dietaryRestrictions.includes(
                                                                restriction
                                                            )
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                        }`}
                                                    >
                                                        {restriction}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Portion Size */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Portion Size
                                            </label>
                                            <div className="flex gap-2">
                                                {["small", "normal", "large"].map((size) => (
                                                    <button
                                                        key={size}
                                                        onClick={() =>
                                                            setFormData({
                                                                ...formData,
                                                                portionSize: size,
                                                            })
                                                        }
                                                        className={`px-4 py-2 rounded-md transition-colors capitalize ${
                                                            formData.portionSize === size
                                                                ? "bg-emerald-600 text-white"
                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                        }`}
                                                    >
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-6">
                                        <button
                                            onClick={handleSaveMember}
                                            className="flex-1 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setShowAddModal(false)}
                                            className="flex-1 px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

