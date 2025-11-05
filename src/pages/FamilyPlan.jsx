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

// Comprehensive family member roles
const ROLES = [
    "parent",
    "mom",
    "dad",
    "grandparent",
    "grandma",
    "grandpa",
    "child",
    "baby",
    "toddler",
    "teenager",
    "teen",
    "nanny",
    "au pair",
    "caregiver",
    "guardian",
    "other"
];

const COMMON_MEMBERS = [
    { name: "Mom", role: "mom", icon: "👩" },
    { name: "Dad", role: "dad", icon: "👨" },
    { name: "Parent", role: "parent", icon: "👤" },
    { name: "Baby", role: "baby", icon: "👶", ageRange: "0-1 year" },
    { name: "Toddler", role: "toddler", icon: "🧒", ageRange: "2-3 years" },
    { name: "Child", role: "child", icon: "👦", ageRange: "4-10 years" },
    { name: "Teenager", role: "teenager", icon: "🧑", ageRange: "11-17 years" },
    { name: "Grandma", role: "grandma", icon: "👵" },
    { name: "Grandpa", role: "grandpa", icon: "👴" },
    { name: "Nanny", role: "nanny", icon: "👷" },
    { name: "Au Pair", role: "au pair", icon: "👨‍🏫" },
    { name: "Caregiver", role: "caregiver", icon: "👨‍⚕️" },
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

    // Realistic portion size multipliers based on age/role
    const getPortionMultiplier = (role, ageRange) => {
        // Baby (0-1 year): ~0.25 of adult serving
        if (role === "baby" || (ageRange && ageRange.includes("0-1"))) {
            return { multiplier: 0.25, label: "Baby (¼ serving)", value: "baby" };
        }
        // Toddler (2-3 years): ~0.5 of adult serving
        if (role === "toddler" || (ageRange && ageRange.includes("2-3"))) {
            return { multiplier: 0.5, label: "Toddler (½ serving)", value: "toddler" };
        }
        // Child (4-10 years): ~0.75 of adult serving
        if (role === "child" || (ageRange && /^[4-9]|10/.test(ageRange))) {
            return { multiplier: 0.75, label: "Child (¾ serving)", value: "child" };
        }
        // Teenager (11-17 years): ~1.0-1.25 of adult serving (growing!)
        if (role === "teenager" || role === "teen" || (ageRange && ageRange.includes("11-17"))) {
            return { multiplier: 1.25, label: "Teenager (1.25 servings)", value: "teen" };
        }
        // Senior/Grandparent: ~0.75-0.9 of adult serving
        if (role === "grandparent" || role === "grandma" || role === "grandpa") {
            return { multiplier: 0.85, label: "Senior (0.85 serving)", value: "senior" };
        }
        // Adult/Parent: Standard 1.0 serving
        // Large appetite: 1.25-1.5 servings
        return { multiplier: 1.0, label: "Adult (1 serving)", value: "adult" };
    };

    // Available portion size options with realistic multipliers
    const PORTION_SIZES = [
        { value: "baby", label: "Baby (¼ serving)", multiplier: 0.25, description: "0-1 year" },
        { value: "toddler", label: "Toddler (½ serving)", multiplier: 0.5, description: "2-3 years" },
        { value: "child", label: "Child (¾ serving)", multiplier: 0.75, description: "4-10 years" },
        { value: "teen", label: "Teenager (1.25 servings)", multiplier: 1.25, description: "11-17 years" },
        { value: "small", label: "Small (0.75 serving)", multiplier: 0.75, description: "Light eater" },
        { value: "normal", label: "Normal (1 serving)", multiplier: 1.0, description: "Standard adult" },
        { value: "large", label: "Large (1.5 servings)", multiplier: 1.5, description: "Big appetite" },
        { value: "xlarge", label: "Extra Large (2 servings)", multiplier: 2.0, description: "Athlete/heavy eater" },
    ];

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        role: "child",
        ageRange: "",
        allergies: [],
        dietaryRestrictions: [],
        portionSize: "normal",
    });

    useEffect(() => {
        writeFamilyMembers(members);
    }, [members]);

    useEffect(() => {
        writeMealLogs(mealLogs);
    }, [mealLogs]);

    const handleAddMember = () => {
        const defaultPortion = getPortionMultiplier("child", "").value;
        setFormData({
            name: "",
            role: "child",
            ageRange: "",
            allergies: [],
            dietaryRestrictions: [],
            portionSize: defaultPortion,
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

                {/* Family Servings Summary */}
                {members.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-800 p-6 mb-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">Family Servings Summary</h2>
                            <span className="text-2xl">🍽️</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Family Members</div>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{members.length}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Servings Needed</div>
                                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                    {Math.ceil(members.reduce((sum, m) => {
                                        const multiplier = PORTION_SIZES.find(s => s.value === m.portionSize)?.multiplier || 1.0;
                                        return sum + multiplier;
                                    }, 0))}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Average Per Person</div>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {(members.reduce((sum, m) => {
                                        const multiplier = PORTION_SIZES.find(s => s.value === m.portionSize)?.multiplier || 1.0;
                                        return sum + multiplier;
                                    }, 0) / members.length).toFixed(2)}x
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">
                            💡 Recipe servings will automatically adjust based on your family members when viewing recipes
                        </p>
                    </motion.section>
                )}

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
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium capitalize">
                                            {PORTION_SIZES.find(s => s.value === member.portionSize)?.label || member.portionSize}
                                        </span>
                                        {PORTION_SIZES.find(s => s.value === member.portionSize) && (
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                ({PORTION_SIZES.find(s => s.value === member.portionSize).multiplier}x)
                                            </span>
                                        )}
                                    </div>
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
                                                                const portionInfo = getPortionMultiplier(member.role, member.ageRange || "");
                                                                setFormData({
                                                                    ...formData,
                                                                    name: member.name,
                                                                    role: member.role,
                                                                    ageRange: member.ageRange || "",
                                                                    allergies: [],
                                                                    dietaryRestrictions: [],
                                                                    portionSize: portionInfo.value,
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
                                                onChange={(e) => {
                                                    const newRole = e.target.value;
                                                    const portionInfo = getPortionMultiplier(newRole, formData.ageRange);
                                                    setFormData({ 
                                                        ...formData, 
                                                        role: newRole,
                                                        portionSize: portionInfo.value
                                                    });
                                                }}
                                                className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                            >
                                                {ROLES.map((role) => (
                                                    <option key={role} value={role}>
                                                        {role.charAt(0).toUpperCase() + role.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Age Range */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Age Range
                                                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                                                    (Helps auto-adjust portion size)
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.ageRange}
                                                onChange={(e) => {
                                                    const newAgeRange = e.target.value;
                                                    const portionInfo = getPortionMultiplier(formData.role, newAgeRange);
                                                    setFormData({
                                                        ...formData,
                                                        ageRange: newAgeRange,
                                                        portionSize: portionInfo.value,
                                                    });
                                                }}
                                                className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                placeholder="e.g., 5-10 years, 30-40 years, etc."
                                            />
                                        </div>

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
                                                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                                                    (Auto-adjusted based on role/age)
                                                </span>
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {PORTION_SIZES.map((size) => (
                                                    <button
                                                        key={size.value}
                                                        type="button"
                                                        onClick={() =>
                                                            setFormData({
                                                                ...formData,
                                                                portionSize: size.value,
                                                            })
                                                        }
                                                        className={`px-3 py-2 rounded-md transition-all text-left ${
                                                            formData.portionSize === size.value
                                                                ? "bg-emerald-600 text-white border-2 border-emerald-500"
                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-2 border-transparent"
                                                        }`}
                                                        title={size.description}
                                                    >
                                                        <div className="font-medium text-xs sm:text-sm">{size.label}</div>
                                                        <div className="text-[10px] opacity-75 mt-0.5">
                                                            {size.multiplier}x
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            {formData.portionSize && (
                                                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                                    Selected: <strong>{PORTION_SIZES.find(s => s.value === formData.portionSize)?.label}</strong> 
                                                    {" "}• {PORTION_SIZES.find(s => s.value === formData.portionSize)?.description}
                                                </div>
                                            )}
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

