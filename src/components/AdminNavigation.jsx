import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Users, BarChart3, Activity, Settings, Zap } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'recipes', label: 'Recipes', icon: BookOpen },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'features', label: 'Features', icon: Zap },
  { id: 'system', label: 'System', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminNavigation({ activeTab, onTabChange }) {
  return (
    <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors
                border-b-2 -mb-px whitespace-nowrap
                ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
