import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast.jsx';
import {
  Calendar,
  ShoppingCart,
  ChefHat,
  Search,
  Heart,
  AlertTriangle,
  Users,
  TrendingUp,
} from 'lucide-react';

const STORAGE_KEY = 'family:members:v1';
const MEAL_LOG_KEY = 'family:meal:logs:v1';

const ALLERGIES = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Soy',
  'Wheat',
  'Sesame',
  'Gluten',
  'Dairy',
  'Lactose',
];

const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Keto',
  'Paleo',
  'Low-Carb',
  'Low-Sodium',
  'Diabetic',
  'Halal',
  'Kosher',
];

// Comprehensive family member roles
const ROLES = [
  'parent',
  'mom',
  'dad',
  'grandparent',
  'grandma',
  'grandpa',
  'child',
  'baby',
  'toddler',
  'teenager',
  'teen',
  'nanny',
  'au pair',
  'caregiver',
  'guardian',
  'other',
];

const COMMON_MEMBERS = [
  { name: 'Mom', role: 'mom', icon: '👩' },
  { name: 'Dad', role: 'dad', icon: '👨' },
  { name: 'Parent', role: 'parent', icon: '👤' },
  { name: 'Baby', role: 'baby', icon: '👶', ageRange: '0-1 year' },
  { name: 'Toddler', role: 'toddler', icon: '🧒', ageRange: '2-3 years' },
  { name: 'Child', role: 'child', icon: '👦', ageRange: '4-10 years' },
  { name: 'Teenager', role: 'teenager', icon: '🧑', ageRange: '11-17 years' },
  { name: 'Grandma', role: 'grandma', icon: '👵' },
  { name: 'Grandpa', role: 'grandpa', icon: '👴' },
  { name: 'Nanny', role: 'nanny', icon: '👷' },
  { name: 'Au Pair', role: 'au pair', icon: '👨‍🏫' },
  { name: 'Caregiver', role: 'caregiver', icon: '👨‍⚕️' },
];

function readFamilyMembers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeFamilyMembers(members) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

function readMealLogs() {
  try {
    return JSON.parse(localStorage.getItem(MEAL_LOG_KEY) || '{}');
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
  const toast = useToast();
  const [members, setMembers] = useState(() => {
    const saved = readFamilyMembers();
    console.log('👨‍👩‍👧‍👦 [FAMILY PLAN] Loaded members from storage:', saved);
    return saved;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [mealLogs, setMealLogs] = useState(readMealLogs);

  // Calculate BMI for children/adults
  const calculateBMI = (weight, height, weightUnit, heightUnit) => {
    if (!weight || !height) return null;

    // Convert to kg and meters
    let weightKg = parseFloat(weight);
    let heightM = parseFloat(height);

    if (weightUnit === 'lbs') weightKg = weightKg * 0.453592; // Convert lbs to kg
    if (heightUnit === 'in') heightM = heightM * 0.0254; // Convert inches to meters
    if (heightUnit === 'cm') heightM = heightM / 100; // Convert cm to meters

    if (heightM <= 0) return null;

    const bmi = weightKg / (heightM * heightM);
    return Math.round(bmi * 10) / 10;
  };

  // Get BMI category for children (based on CDC growth charts)
  const getBMICategory = (bmi, ageMonths, role) => {
    if (!bmi || isNaN(bmi)) return null;

    // If no ageMonths provided, use adult ranges
    if (!ageMonths || ageMonths === '') {
      // Adult BMI ranges
      if (bmi < 18.5) return { label: 'Underweight', color: 'blue', emoji: '📉' };
      if (bmi < 25) return { label: 'Normal Weight', color: 'green', emoji: '✅' };
      if (bmi < 30) return { label: 'Overweight', color: 'amber', emoji: '⚠️' };
      return { label: 'Obese', color: 'red', emoji: '🔴' };
    }

    const ageYears = parseFloat(ageMonths) / 12;
    if (isNaN(ageYears)) return null;

    // For children 2-20 years, use simplified BMI ranges
    // Note: Actual CDC charts use percentiles based on age and gender
    // This is a simplified version for general guidance
    if (ageYears >= 2 && ageYears <= 20) {
      // Age-adjusted BMI ranges (simplified)
      const minHealthy = 14 + (ageYears - 2) * 0.5; // Rough estimate
      const maxHealthy = 18 + (ageYears - 2) * 0.3;

      if (bmi < minHealthy) return { label: 'Underweight', color: 'blue', emoji: '📉' };
      if (bmi <= maxHealthy) return { label: 'Healthy Weight', color: 'green', emoji: '✅' };
      if (bmi <= maxHealthy + 3) return { label: 'Overweight', color: 'amber', emoji: '⚠️' };
      return { label: 'Obese', color: 'red', emoji: '🔴' };
    }

    // For adults (20+)
    if (ageYears > 20) {
      if (bmi < 18.5) return { label: 'Underweight', color: 'blue', emoji: '📉' };
      if (bmi < 25) return { label: 'Normal Weight', color: 'green', emoji: '✅' };
      if (bmi < 30) return { label: 'Overweight', color: 'amber', emoji: '⚠️' };
      return { label: 'Obese', color: 'red', emoji: '🔴' };
    }

    return null;
  };

  // Get age-appropriate nutritional recommendations
  const getNutritionalRecommendations = (role, ageMonths, weight) => {
    const recommendations = [];
    const ageYears = ageMonths ? parseFloat(ageMonths) / 12 : null;

    if (role === 'baby' || (ageYears && ageYears < 1)) {
      recommendations.push('Breast milk or formula is primary nutrition');
      recommendations.push('Introduce solid foods around 6 months');
      recommendations.push('Avoid honey before 12 months');
      recommendations.push('Focus on iron-rich foods');
    } else if (role === 'toddler' || (ageYears && ageYears >= 1 && ageYears < 3)) {
      recommendations.push('3 meals + 2-3 snacks per day');
      recommendations.push('Offer variety of fruits and vegetables');
      recommendations.push('Limit juice to 4-6 oz per day');
      recommendations.push('Encourage self-feeding');
    } else if (role === 'child' || (ageYears && ageYears >= 3 && ageYears < 10)) {
      recommendations.push('Balanced meals with protein, grains, fruits, vegetables');
      recommendations.push('Encourage water as primary beverage');
      recommendations.push('Limit processed foods and added sugars');
      recommendations.push('Family meals together when possible');
    } else if (
      role === 'teenager' ||
      role === 'teen' ||
      (ageYears && ageYears >= 10 && ageYears < 18)
    ) {
      recommendations.push('Increased caloric needs for growth');
      recommendations.push('Focus on calcium for bone development');
      recommendations.push('Iron-rich foods (especially for girls)');
      recommendations.push('Encourage healthy snacking');
    }

    return recommendations;
  };

  // Realistic portion size multipliers based on age/role/weight
  const getPortionMultiplier = (role, ageRange, weight = null, ageMonths = null) => {
    const ageYears = ageMonths ? parseFloat(ageMonths) / 12 : null;

    // Baby (0-1 year): ~0.25 of adult serving
    if (role === 'baby' || (ageRange && ageRange.includes('0-1')) || (ageYears && ageYears < 1)) {
      return { multiplier: 0.25, label: 'Baby (¼ serving)', value: 'baby' };
    }
    // Toddler (1-3 years): ~0.5 of adult serving
    if (
      role === 'toddler' ||
      (ageRange && ageRange.includes('2-3')) ||
      (ageYears && ageYears >= 1 && ageYears < 3)
    ) {
      return { multiplier: 0.5, label: 'Toddler (½ serving)', value: 'toddler' };
    }
    // Child (3-10 years): ~0.75 of adult serving
    if (
      role === 'child' ||
      (ageRange && /^[4-9]|10/.test(ageRange)) ||
      (ageYears && ageYears >= 3 && ageYears < 10)
    ) {
      return { multiplier: 0.75, label: 'Child (¾ serving)', value: 'child' };
    }
    // Teenager (11-17 years): ~1.0-1.25 of adult serving (growing!)
    if (
      role === 'teenager' ||
      role === 'teen' ||
      (ageRange && ageRange.includes('11-17')) ||
      (ageYears && ageYears >= 10 && ageYears < 18)
    ) {
      return { multiplier: 1.25, label: 'Teenager (1.25 servings)', value: 'teen' };
    }
    // Senior/Grandparent: ~0.75-0.9 of adult serving
    if (role === 'grandparent' || role === 'grandma' || role === 'grandpa') {
      return { multiplier: 0.85, label: 'Senior (0.85 serving)', value: 'senior' };
    }
    // Adult/Parent: Standard 1.0 serving
    return { multiplier: 1.0, label: 'Adult (1 serving)', value: 'adult' };
  };

  // Available portion size options with realistic multipliers
  const PORTION_SIZES = [
    { value: 'baby', label: 'Baby (¼ serving)', multiplier: 0.25, description: '0-1 year' },
    { value: 'toddler', label: 'Toddler (½ serving)', multiplier: 0.5, description: '2-3 years' },
    { value: 'child', label: 'Child (¾ serving)', multiplier: 0.75, description: '4-10 years' },
    {
      value: 'teen',
      label: 'Teenager (1.25 servings)',
      multiplier: 1.25,
      description: '11-17 years',
    },
    { value: 'small', label: 'Small (0.75 serving)', multiplier: 0.75, description: 'Light eater' },
    {
      value: 'normal',
      label: 'Normal (1 serving)',
      multiplier: 1.0,
      description: 'Standard adult',
    },
    { value: 'large', label: 'Large (1.5 servings)', multiplier: 1.5, description: 'Big appetite' },
    {
      value: 'xlarge',
      label: 'Extra Large (2 servings)',
      multiplier: 2.0,
      description: 'Athlete/heavy eater',
    },
  ];

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: 'child',
    ageRange: '',
    ageMonths: '',
    weight: '',
    weightUnit: 'lbs', // lbs or kg
    height: '',
    heightUnit: 'in', // in or cm
    allergies: [],
    dietaryRestrictions: [],
    portionSize: 'normal',
    notes: '',
  });

  useEffect(() => {
    console.log('👨‍👩‍👧‍👦 [FAMILY PLAN] Members changed, saving to localStorage:', members);
    writeFamilyMembers(members);
  }, [members]);

  useEffect(() => {
    writeMealLogs(mealLogs);
  }, [mealLogs]);

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('👨‍👩‍👧‍👦 [FAMILY PLAN] Component mounted, current members:', members);
  }, []);

  const handleAddMember = () => {
    const defaultPortion = getPortionMultiplier('child', '').value;
    setFormData({
      name: '',
      role: 'child',
      ageRange: '',
      ageMonths: '',
      weight: '',
      weightUnit: 'lbs',
      height: '',
      heightUnit: 'in',
      allergies: [],
      dietaryRestrictions: [],
      portionSize: defaultPortion,
      notes: '',
    });
    setEditingMember(null);
    setShowAddModal(true);
  };

  const handleEditMember = member => {
    setFormData(member);
    setEditingMember(member.id);
    setShowAddModal(true);
  };

  const handleSaveMember = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    console.log('👨‍👩‍👧‍👦 [FAMILY PLAN] Saving member:', formData);
    console.log('👨‍👩‍👧‍👦 [FAMILY PLAN] Current members before save:', members);
    console.log('👨‍👩‍👧‍👦 [FAMILY PLAN] Editing member ID:', editingMember);

    let updatedMembers;
    if (editingMember) {
      // Editing existing member
      updatedMembers = members.map(m =>
        m.id === editingMember ? { ...formData, id: editingMember } : m
      );
      toast.success(`${formData.name} updated successfully!`);
    } else {
      // Adding new member
      const newMember = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      updatedMembers = [...members, newMember];
      toast.success(`${formData.name} added to family!`);
    }

    console.log('👨‍👩‍👧‍👦 [FAMILY PLAN] Updated members after save:', updatedMembers);
    setMembers(updatedMembers);

    // Reset form
    setFormData({
      name: '',
      role: 'child',
      ageRange: '',
      ageMonths: '',
      weight: '',
      weightUnit: 'lbs',
      height: '',
      heightUnit: 'in',
      allergies: [],
      dietaryRestrictions: [],
      portionSize: 'normal',
      notes: '',
    });

    setShowAddModal(false);
    setEditingMember(null);
  };

  const handleDeleteMember = id => {
    const member = members.find(m => m.id === id);
    if (
      member &&
      window.confirm(`Are you sure you want to remove ${member.name} from your family?`)
    ) {
      setMembers(members.filter(m => m.id !== id));
      // Also remove from meal logs
      const newLogs = { ...mealLogs };
      Object.keys(newLogs).forEach(date => {
        newLogs[date] = newLogs[date].filter(log => log.memberId !== id);
      });
      setMealLogs(newLogs);
      toast.success(`${member.name} removed from family`);
    }
  };

  const handleToggleAllergy = allergy => {
    setFormData({
      ...formData,
      allergies: formData.allergies.includes(allergy)
        ? formData.allergies.filter(a => a !== allergy)
        : [...formData.allergies, allergy],
    });
  };

  const handleToggleRestriction = restriction => {
    setFormData({
      ...formData,
      dietaryRestrictions: formData.dietaryRestrictions.includes(restriction)
        ? formData.dietaryRestrictions.filter(r => r !== restriction)
        : [...formData.dietaryRestrictions, restriction],
    });
  };

  const handleMealComplete = (memberId, date, mealType) => {
    const dateKey = date || new Date().toISOString().split('T')[0];
    const logKey = `${dateKey}-${mealType}`;

    if (!mealLogs[dateKey]) {
      mealLogs[dateKey] = [];
    }

    const existingIndex = mealLogs[dateKey].findIndex(
      log => log.memberId === memberId && log.mealType === mealType
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

  // Get meals for a member based on their age/role
  const getMealsForMember = member => {
    const ageYears = member.ageMonths ? parseFloat(member.ageMonths) / 12 : null;
    const role = member.role;

    // Babies (0-1 year): Formula/breast milk + snacks when starting solids
    if (role === 'baby' || (ageYears && ageYears < 1)) {
      return [
        { type: 'breakfast', label: 'Breakfast', emoji: '🌅', required: true },
        { type: 'morning_snack', label: 'Morning Snack', emoji: '🍎', required: false },
        { type: 'lunch', label: 'Lunch', emoji: '☀️', required: true },
        { type: 'afternoon_snack', label: 'Afternoon Snack', emoji: '🥕', required: false },
        { type: 'dinner', label: 'Dinner', emoji: '🌙', required: true },
        { type: 'evening_snack', label: 'Evening Snack', emoji: '🍌', required: false },
      ];
    }

    // Toddlers (1-3 years): 3 meals + 2-3 snacks
    if (role === 'toddler' || (ageYears && ageYears >= 1 && ageYears < 3)) {
      return [
        { type: 'breakfast', label: 'Breakfast', emoji: '🌅', required: true },
        { type: 'morning_snack', label: 'Morning Snack', emoji: '🍎', required: true },
        { type: 'lunch', label: 'Lunch', emoji: '☀️', required: true },
        { type: 'afternoon_snack', label: 'Afternoon Snack', emoji: '🥕', required: true },
        { type: 'dinner', label: 'Dinner', emoji: '🌙', required: true },
        { type: 'evening_snack', label: 'Evening Snack', emoji: '🍌', required: false },
      ];
    }

    // Children (3-10 years): 3 meals + 2 snacks
    if (role === 'child' || (ageYears && ageYears >= 3 && ageYears < 10)) {
      return [
        { type: 'breakfast', label: 'Breakfast', emoji: '🌅', required: true },
        { type: 'morning_snack', label: 'Morning Snack', emoji: '🍎', required: true },
        { type: 'lunch', label: 'Lunch', emoji: '☀️', required: true },
        { type: 'afternoon_snack', label: 'Afternoon Snack', emoji: '🥕', required: true },
        { type: 'dinner', label: 'Dinner', emoji: '🌙', required: true },
        { type: 'evening_snack', label: 'Evening Snack', emoji: '🍌', required: false },
      ];
    }

    // Teenagers (10-18 years): 3 meals + optional snacks
    if (role === 'teenager' || role === 'teen' || (ageYears && ageYears >= 10 && ageYears < 18)) {
      return [
        { type: 'breakfast', label: 'Breakfast', emoji: '🌅', required: true },
        { type: 'morning_snack', label: 'Morning Snack', emoji: '🍎', required: false },
        { type: 'lunch', label: 'Lunch', emoji: '☀️', required: true },
        { type: 'afternoon_snack', label: 'Afternoon Snack', emoji: '🥕', required: false },
        { type: 'dinner', label: 'Dinner', emoji: '🌙', required: true },
        { type: 'evening_snack', label: 'Evening Snack', emoji: '🍌', required: false },
      ];
    }

    // Adults: 3 meals (snacks optional)
    return [
      { type: 'breakfast', label: 'Breakfast', emoji: '🌅', required: true },
      { type: 'morning_snack', label: 'Morning Snack', emoji: '🍎', required: false },
      { type: 'lunch', label: 'Lunch', emoji: '☀️', required: true },
      { type: 'afternoon_snack', label: 'Afternoon Snack', emoji: '🥕', required: false },
      { type: 'dinner', label: 'Dinner', emoji: '🌙', required: true },
      { type: 'evening_snack', label: 'Evening Snack', emoji: '🍌', required: false },
    ];
  };

  const isMealComplete = (memberId, date, mealType) => {
    const dateKey = date || new Date().toISOString().split('T')[0];
    return (
      mealLogs[dateKey]?.some(log => log.memberId === memberId && log.mealType === mealType) ||
      false
    );
  };

  const getTodayMeals = () => {
    const today = new Date().toISOString().split('T')[0];
    return mealLogs[today] || [];
  };

  // TEMPORARY: Allow access without login during development
  // Login check disabled - everyone can access family plan
  // if (!user) {
  //     return (
  //         <div className="min-h-screen flex items-center justify-center p-4">
  //             <div className="text-center">
  //                 <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
  //                 <button
  //                     onClick={() => navigate("/")}
  //                     className="px-4 py-2 rounded-md bg-emerald-600 text-white"
  //                 >
  //                     Go to Home
  //                 </button>
  //             </div>
  //         </div>
  //     );
  // }

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

        {/* Quick Actions for Parents */}
        {members.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/meal-planner')}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all touch-manipulation"
              >
                <Calendar className="w-6 h-6" />
                <span className="text-sm font-semibold">Plan Meals</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Get all allergies and restrictions
                  const allAllergies = [...new Set(members.flatMap(m => m.allergies || []))];
                  const allRestrictions = [
                    ...new Set(members.flatMap(m => m.dietaryRestrictions || [])),
                  ];
                  navigate('/', {
                    state: {
                      searchFilters: {
                        intolerances: allAllergies.join(','),
                        diet: allRestrictions[0] || '',
                      },
                    },
                  });
                }}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all touch-manipulation"
              >
                <Search className="w-6 h-6" />
                <span className="text-sm font-semibold">Find Recipes</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/grocery-list')}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all touch-manipulation"
              >
                <ShoppingCart className="w-6 h-6" />
                <span className="text-sm font-semibold">Shopping List</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/favorites')}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all touch-manipulation"
              >
                <Heart className="w-6 h-6" />
                <span className="text-sm font-semibold">Favorites</span>
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* Family Health & Safety Summary */}
        {members.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl shadow-sm border border-amber-200 dark:border-amber-800 p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Family Health & Safety
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* All Allergies */}
              {(() => {
                const allAllergies = [...new Set(members.flatMap(m => m.allergies || []))];
                return allAllergies.length > 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      Allergies to Avoid
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allAllergies.map(allergy => (
                        <span
                          key={allergy}
                          className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full font-medium"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
              {/* All Dietary Restrictions */}
              {(() => {
                const allRestrictions = [
                  ...new Set(members.flatMap(m => m.dietaryRestrictions || [])),
                ];
                return allRestrictions.length > 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <span className="text-blue-500">🥗</span>
                      Dietary Preferences
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allRestrictions.map(restriction => (
                        <span
                          key={restriction}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full font-medium"
                        >
                          {restriction}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
            {(() => {
              const allAllergies = [...new Set(members.flatMap(m => m.allergies || []))];
              const allRestrictions = [
                ...new Set(members.flatMap(m => m.dietaryRestrictions || [])),
              ];
              if (allAllergies.length === 0 && allRestrictions.length === 0) {
                return (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    ✅ No allergies or dietary restrictions recorded. Add them when editing family
                    members to get personalized recipe suggestions!
                  </p>
                );
              }
              return null;
            })()}
          </motion.section>
        )}

        {/* Family Servings Summary */}
        {members.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-800 p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Family Servings Summary
              </h2>
              <span className="text-2xl">🍽️</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Total Family Members
                </div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {members.length}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {
                    members.filter(
                      m =>
                        m.role === 'child' ||
                        m.role === 'baby' ||
                        m.role === 'toddler' ||
                        m.role === 'teenager' ||
                        m.role === 'teen'
                    ).length
                  }{' '}
                  children
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Total Servings Needed
                </div>
                <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                  {Math.ceil(
                    members.reduce((sum, m) => {
                      const multiplier =
                        PORTION_SIZES.find(s => s.value === m.portionSize)?.multiplier || 1.0;
                      return sum + multiplier;
                    }, 0)
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  For a 4-serving recipe
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Average Per Person
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {(
                    members.reduce((sum, m) => {
                      const multiplier =
                        PORTION_SIZES.find(s => s.value === m.portionSize)?.multiplier || 1.0;
                      return sum + multiplier;
                    }, 0) / members.length
                  ).toFixed(2)}
                  x
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Portion multiplier
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <p className="text-sm text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
                <span className="text-lg">💡</span>
                <span>
                  Recipe servings will automatically adjust based on your family members when
                  viewing recipes. Perfect for meal planning!
                </span>
              </p>
            </div>
          </motion.section>
        )}

        {/* Today's Meals Summary */}
        {members.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6 mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                Today's Meals & Snacks
              </h2>
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const todayMeals = mealLogs[today] || [];

                // Calculate total expected meals (required meals only)
                const totalRequiredMeals = members.reduce((sum, member) => {
                  const meals = getMealsForMember(member);
                  return sum + meals.filter(m => m.required).length;
                }, 0);

                const completedMeals = todayMeals.length;
                const percentage =
                  totalRequiredMeals > 0
                    ? Math.round((completedMeals / totalRequiredMeals) * 100)
                    : 0;

                return (
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>
                        {completedMeals}/{totalRequiredMeals} required meals
                      </span>
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {members.map(member => {
                const today = new Date().toISOString().split('T')[0];
                const memberMeals = (mealLogs[today] || []).filter(
                  log => log.memberId === member.id
                );
                const meals = getMealsForMember(member);
                const requiredMeals = meals.filter(m => m.required);
                const completedRequired = requiredMeals.filter(m =>
                  isMealComplete(member.id, null, m.type)
                ).length;
                const allRequiredComplete = completedRequired === requiredMeals.length;

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-base sm:text-lg">{member.name}</h3>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {completedRequired}/{requiredMeals.length} required meals
                        </p>
                      </div>
                      {allRequiredComplete && (
                        <span
                          className="text-green-500 text-lg sm:text-xl flex-shrink-0"
                          title="All required meals completed!"
                        >
                          ✅
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      {meals.map(meal => {
                        const isComplete = isMealComplete(member.id, null, meal.type);
                        return (
                          <label
                            key={meal.type}
                            className={`flex items-center gap-2 sm:gap-3 cursor-pointer p-1.5 sm:p-2 rounded-lg transition-all touch-manipulation ${
                              isComplete
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                : meal.required
                                  ? 'hover:bg-slate-100 dark:hover:bg-slate-700'
                                  : 'opacity-75 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isComplete}
                              onChange={() => handleMealComplete(member.id, null, meal.type)}
                              className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-slate-300 dark:border-slate-600 checked:bg-green-500 checked:border-green-500 flex-shrink-0 touch-manipulation"
                            />
                            <span className="text-base sm:text-lg flex-shrink-0">{meal.emoji}</span>
                            <span
                              className={`text-xs sm:text-sm font-medium flex-1 ${meal.required ? '' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                              {meal.label}
                              {!meal.required && (
                                <span className="ml-1 text-[10px]">(optional)</span>
                              )}
                            </span>
                            {isComplete && (
                              <span className="text-green-500 text-sm sm:text-base flex-shrink-0">
                                ✓
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
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
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Family Members
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map(member => {
                const roleEmojis = {
                  mom: '👩',
                  dad: '👨',
                  parent: '👤',
                  child: '👦',
                  baby: '👶',
                  toddler: '🧒',
                  teenager: '🧑',
                  teen: '🧑',
                  grandma: '👵',
                  grandpa: '👴',
                  grandparent: '👴',
                  nanny: '👷',
                  'au pair': '👨‍🏫',
                  caregiver: '👨‍⚕️',
                  guardian: '🛡️',
                  other: '👤',
                };
                const roleEmoji = roleEmojis[member.role] || '👤';
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4 }}
                    className="bg-white dark:bg-slate-900 rounded-xl shadow-md border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-6 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-3xl sm:text-4xl">{roleEmoji}</div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold break-words">
                            {member.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 capitalize">
                            {member.role}
                            {member.ageRange && ` • ${member.ageRange}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEditMember(member)}
                          className="p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors touch-manipulation"
                          title="Edit"
                        >
                          ✏️
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors touch-manipulation"
                          title="Delete"
                        >
                          🗑️
                        </motion.button>
                      </div>
                    </div>

                    {member.allergies.length > 0 && (
                      <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/30">
                        <label className="text-[10px] sm:text-xs font-semibold text-red-700 dark:text-red-300 mb-1.5 sm:mb-2 block flex items-center gap-1">
                          <span>⚠️</span>
                          Allergies
                        </label>
                        <div className="flex flex-wrap gap-1 sm:gap-1.5">
                          {member.allergies.map(allergy => (
                            <span
                              key={allergy}
                              className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full font-medium break-words"
                            >
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {member.dietaryRestrictions.length > 0 && (
                      <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-900/30">
                        <label className="text-[10px] sm:text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5 sm:mb-2 block flex items-center gap-1">
                          <span>🥗</span>
                          Dietary Preferences
                        </label>
                        <div className="flex flex-wrap gap-1 sm:gap-1.5">
                          {member.dietaryRestrictions.map(restriction => (
                            <span
                              key={restriction}
                              className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full font-medium break-words"
                            >
                              {restriction}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Weight & Height Info */}
                    {(member.weight || member.height) && (
                      <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-1">
                          <span>📏</span>
                          Growth Info
                        </label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {member.weight && (
                            <div>
                              <span className="text-slate-600 dark:text-slate-400">Weight: </span>
                              <span className="font-semibold">
                                {member.weight} {member.weightUnit || 'lbs'}
                              </span>
                            </div>
                          )}
                          {member.height && (
                            <div>
                              <span className="text-slate-600 dark:text-slate-400">Height: </span>
                              <span className="font-semibold">
                                {member.height} {member.heightUnit || 'in'}
                              </span>
                            </div>
                          )}
                          {member.ageMonths && (
                            <div className="col-span-2">
                              <span className="text-slate-600 dark:text-slate-400">Age: </span>
                              <span className="font-semibold">
                                {member.ageMonths} months (
                                {Math.floor(parseFloat(member.ageMonths) / 12)} years{' '}
                                {parseFloat(member.ageMonths) % 12} months)
                              </span>
                            </div>
                          )}
                        </div>
                        {(() => {
                          const bmi = calculateBMI(
                            member.weight,
                            member.height,
                            member.weightUnit,
                            member.heightUnit
                          );
                          const bmiCategory = bmi
                            ? getBMICategory(bmi, member.ageMonths, member.role)
                            : null;
                          return bmi && bmiCategory ? (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                  BMI:{' '}
                                </span>
                                <span className="text-xs font-bold">{bmi}</span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    bmiCategory.color === 'green'
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                      : bmiCategory.color === 'amber'
                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                                        : bmiCategory.color === 'red'
                                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                  }`}
                                >
                                  {bmiCategory.emoji} {bmiCategory.label}
                                </span>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {/* Nutritional Recommendations Display */}
                    {(() => {
                      const recommendations = getNutritionalRecommendations(
                        member.role,
                        member.ageMonths,
                        member.weight
                      );
                      return recommendations.length > 0 ? (
                        <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-900/30">
                          <label className="text-[10px] sm:text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1.5 sm:mb-2 block flex items-center gap-1">
                            <span>💡</span>
                            Recommendations
                          </label>
                          <ul className="space-y-0.5 sm:space-y-1">
                            {recommendations.slice(0, 2).map((rec, idx) => (
                              <li
                                key={idx}
                                className="text-[10px] sm:text-xs text-purple-800 dark:text-purple-200 break-words"
                              >
                                • {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null;
                    })()}

                    <div className="p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                      <label className="text-[10px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1.5 sm:mb-2 block flex items-center gap-1">
                        <span>🍽️</span>
                        Portion Size
                      </label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                        <span className="text-xs sm:text-sm font-bold capitalize text-emerald-800 dark:text-emerald-200 break-words">
                          {PORTION_SIZES.find(s => s.value === member.portionSize)?.label ||
                            member.portionSize}
                        </span>
                        {PORTION_SIZES.find(s => s.value === member.portionSize) && (
                          <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full w-fit">
                            {PORTION_SIZES.find(s => s.value === member.portionSize).multiplier}x
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {member.notes && (
                      <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-900/30">
                        <label className="text-[10px] sm:text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1 block flex items-center gap-1">
                          <span>📝</span>
                          Notes
                        </label>
                        <p className="text-[10px] sm:text-xs text-amber-800 dark:text-amber-200 break-words">
                          {member.notes}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
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
                className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
              >
                <div
                  className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 overscroll-contain"
                  onClick={e => e.stopPropagation()}
                >
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                    {editingMember ? 'Edit Family Member' : 'Add Family Member'}
                  </h2>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Quick Add Common Members */}
                    {!editingMember && (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-2">
                          Quick Add Common Members
                        </label>
                        <div className="flex flex-wrap gap-2 p-2 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          {COMMON_MEMBERS.map((member, idx) => (
                            <motion.button
                              key={idx}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => {
                                const portionInfo = getPortionMultiplier(
                                  member.role,
                                  member.ageRange || '',
                                  null,
                                  null
                                );
                                setFormData({
                                  ...formData,
                                  name: member.name,
                                  role: member.role,
                                  ageRange: member.ageRange || '',
                                  ageMonths: '',
                                  weight: '',
                                  weightUnit: 'lbs',
                                  height: '',
                                  heightUnit: 'in',
                                  allergies: [],
                                  dietaryRestrictions: [],
                                  portionSize: portionInfo.value,
                                  notes: '',
                                });
                              }}
                              className="px-2.5 sm:px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium touch-manipulation"
                            >
                              <span className="text-base sm:text-lg">{member.icon}</span>
                              <span>{member.name}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 touch-manipulation"
                        placeholder="Enter name"
                      />
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">Role</label>
                      <select
                        value={formData.role}
                        onChange={e => {
                          const newRole = e.target.value;
                          const portionInfo = getPortionMultiplier(
                            newRole,
                            formData.ageRange,
                            formData.weight,
                            formData.ageMonths
                          );
                          setFormData({
                            ...formData,
                            role: newRole,
                            portionSize: portionInfo.value,
                          });
                        }}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 touch-manipulation"
                      >
                        {ROLES.map(role => (
                          <option key={role} value={role}>
                            {role.charAt(0).toUpperCase() +
                              role
                                .slice(1)
                                .replace(/([A-Z])/g, ' $1')
                                .trim()}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Age Range */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">
                        Age Range
                        <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                          (Helps auto-adjust portion size)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.ageRange}
                        onChange={e => {
                          const newAgeRange = e.target.value;
                          const portionInfo = getPortionMultiplier(
                            formData.role,
                            newAgeRange,
                            formData.weight,
                            formData.ageMonths
                          );
                          setFormData({
                            ...formData,
                            ageRange: newAgeRange,
                            portionSize: portionInfo.value,
                          });
                        }}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 touch-manipulation"
                        placeholder="e.g., 5-10 years, 30-40 years, etc."
                      />
                    </div>

                    {/* Age in Months (for children) */}
                    {(formData.role === 'baby' ||
                      formData.role === 'toddler' ||
                      formData.role === 'child' ||
                      formData.role === 'teenager' ||
                      formData.role === 'teen') && (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-2">
                          Age in Months
                          <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                            (For precise growth tracking)
                          </span>
                        </label>
                        <input
                          type="number"
                          value={formData.ageMonths}
                          onChange={e => {
                            const newAgeMonths = e.target.value;
                            const portionInfo = getPortionMultiplier(
                              formData.role,
                              formData.ageRange,
                              formData.weight,
                              newAgeMonths
                            );
                            setFormData({
                              ...formData,
                              ageMonths: newAgeMonths,
                              portionSize: portionInfo.value,
                            });
                          }}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 touch-manipulation"
                          placeholder="e.g., 24 (for 2 years old)"
                          min="0"
                          max="240"
                        />
                      </div>
                    )}

                    {/* Weight & Height */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-2">Weight</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={formData.weight}
                            onChange={e => {
                              const newWeight = e.target.value;
                              const portionInfo = getPortionMultiplier(
                                formData.role,
                                formData.ageRange,
                                newWeight,
                                formData.ageMonths
                              );
                              setFormData({
                                ...formData,
                                weight: newWeight,
                                portionSize: portionInfo.value,
                              });
                            }}
                            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 touch-manipulation"
                            placeholder="0"
                            min="0"
                            step="0.1"
                          />
                          <select
                            value={formData.weightUnit}
                            onChange={e => setFormData({ ...formData, weightUnit: e.target.value })}
                            className="px-2.5 sm:px-3 py-2.5 sm:py-2 text-xs sm:text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 touch-manipulation"
                          >
                            <option value="lbs">lbs</option>
                            <option value="kg">kg</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-2">Height</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={formData.height}
                            onChange={e => setFormData({ ...formData, height: e.target.value })}
                            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 touch-manipulation"
                            placeholder="0"
                            min="0"
                            step="0.1"
                          />
                          <select
                            value={formData.heightUnit}
                            onChange={e => setFormData({ ...formData, heightUnit: e.target.value })}
                            className="px-2.5 sm:px-3 py-2.5 sm:py-2 text-xs sm:text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 touch-manipulation"
                          >
                            <option value="in">in</option>
                            <option value="cm">cm</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* BMI Display (if weight and height are provided) */}
                    {formData.weight &&
                      formData.height &&
                      (() => {
                        const bmi = calculateBMI(
                          formData.weight,
                          formData.height,
                          formData.weightUnit,
                          formData.heightUnit
                        );
                        const bmiCategory = bmi
                          ? getBMICategory(bmi, formData.ageMonths, formData.role)
                          : null;
                        return bmi && bmiCategory ? (
                          <div className="p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <span className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300">
                                BMI: {bmi}
                              </span>
                              <span
                                className={`text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium ${
                                  bmiCategory.color === 'green'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                    : bmiCategory.color === 'amber'
                                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                                      : bmiCategory.color === 'red'
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                }`}
                              >
                                {bmiCategory.emoji} {bmiCategory.label}
                              </span>
                            </div>
                          </div>
                        ) : null;
                      })()}

                    {/* Nutritional Recommendations */}
                    {(() => {
                      const recommendations = getNutritionalRecommendations(
                        formData.role,
                        formData.ageMonths,
                        formData.weight
                      );
                      return recommendations.length > 0 ? (
                        <div className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-900/30">
                          <label className="block text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
                            💡 Age-Appropriate Recommendations
                          </label>
                          <ul className="space-y-1 sm:space-y-1.5">
                            {recommendations.map((rec, idx) => (
                              <li
                                key={idx}
                                className="text-[10px] sm:text-xs text-purple-800 dark:text-purple-200 flex items-start gap-1.5 sm:gap-2"
                              >
                                <span className="flex-shrink-0">•</span>
                                <span className="break-words">{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null;
                    })()}

                    {/* Notes */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">
                        Notes
                        <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                          (Track important info, preferences, etc.)
                        </span>
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 min-h-[80px] touch-manipulation resize-y"
                        placeholder="e.g., Picky eater, loves pasta, needs extra protein..."
                      />
                    </div>

                    {/* Allergies */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">Allergies</label>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {ALLERGIES.map(allergy => (
                          <button
                            key={allergy}
                            onClick={() => handleToggleAllergy(allergy)}
                            className={`px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-md text-xs sm:text-sm transition-colors touch-manipulation ${
                              formData.allergies.includes(allergy)
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {allergy}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dietary Restrictions */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">
                        Dietary Restrictions
                      </label>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {DIETARY_RESTRICTIONS.map(restriction => (
                          <button
                            key={restriction}
                            onClick={() => handleToggleRestriction(restriction)}
                            className={`px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-md text-xs sm:text-sm transition-colors touch-manipulation ${
                              formData.dietaryRestrictions.includes(restriction)
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {restriction}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Portion Size */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">
                        Portion Size
                        <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                          (Auto-adjusted based on role/age)
                        </span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                        {PORTION_SIZES.map(size => (
                          <button
                            key={size.value}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                portionSize: size.value,
                              })
                            }
                            className={`px-2 sm:px-3 py-2 rounded-md transition-all text-left touch-manipulation ${
                              formData.portionSize === size.value
                                ? 'bg-emerald-600 text-white border-2 border-emerald-500'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-2 border-transparent'
                            }`}
                            title={size.description}
                          >
                            <div className="font-medium text-[10px] sm:text-xs md:text-sm break-words">
                              {size.label}
                            </div>
                            <div className="text-[9px] sm:text-[10px] opacity-75 mt-0.5">
                              {size.multiplier}x
                            </div>
                          </button>
                        ))}
                      </div>
                      {formData.portionSize && (
                        <div className="mt-2 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                          Selected:{' '}
                          <strong>
                            {PORTION_SIZES.find(s => s.value === formData.portionSize)?.label}
                          </strong>{' '}
                          • {PORTION_SIZES.find(s => s.value === formData.portionSize)?.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                    <button
                      onClick={handleSaveMember}
                      className="flex-1 px-4 py-2.5 sm:py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-medium touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-4 py-2.5 sm:py-2 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm sm:text-base font-medium touch-manipulation min-h-[44px] sm:min-h-0"
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
