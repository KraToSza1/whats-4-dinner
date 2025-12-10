import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllUsers, searchUsers, updateUserPlan, getUserStats, flushUserCache } from '../utils/userManagement';
import { getUserSupportTickets } from '../utils/supportTickets';
import { useToast } from './Toast';
import {
  Search,
  Mail,
  Calendar,
  CreditCard,
  Edit2,
  Check,
  X,
  Download,
  Filter,
  Users as UsersIcon,
  Sparkles,
  Crown,
  Zap,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function UserManagement() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [newPlan, setNewPlan] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [userTickets, setUserTickets] = useState({});

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  useEffect(() => {
    // Load support tickets for all users
    const loadUserTickets = async () => {
      const ticketsMap = {};
      for (const user of users) {
        try {
          const result = await getUserSupportTickets(user.id);
          const openTickets = result.tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
          ticketsMap[user.id] = openTickets.length;
        } catch (error) {
          console.error(`Error loading tickets for user ${user.id}:`, error);
        }
      }
      setUserTickets(ticketsMap);
    };

    if (users.length > 0) {
      loadUserTickets();
    }
  }, [users]);

  useEffect(() => {
    if (debouncedSearchQuery) {
      handleSearch();
    } else {
      loadUsers();
    }
  }, [debouncedSearchQuery, filterPlan]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getAllUsers(1000);
      setUsers(result.users || []);
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await getUserStats();
      setStats(result.stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!debouncedSearchQuery.trim()) {
      loadUsers();
      return;
    }

    setLoading(true);
    try {
      const result = await searchUsers(debouncedSearchQuery);
      let filtered = result.users || [];

      if (filterPlan !== 'all') {
        filtered = filtered.filter(u => u.plan === filterPlan);
      }

      setUsers(filtered);
      setCurrentPage(1);
    } catch (error) {
      toast.error('Search failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlushUserCache = async (userId, userEmail) => {
    if (!confirm(`Are you sure you want to flush cache for ${userEmail || 'this user'}?`)) {
      return;
    }

    try {
      const result = await flushUserCache(userId);
      if (result.success) {
        toast.success(`✨ Cache flushed for ${userEmail || 'user'}. They will clear cache on next load.`);
      } else {
        toast.error(`Failed to flush cache: ${result.error}`);
      }
    } catch (error) {
      toast.error('Error flushing user cache');
      console.error(error);
    }
  };

  const handleUpdatePlan = async (userId) => {
    if (!newPlan) {
      toast.error('Please select a plan');
      return;
    }

    try {
      const result = await updateUserPlan(userId, newPlan);
      if (result.success) {
        toast.success(`✨ Plan updated to ${newPlan}!`);
        setEditingUser(null);
        setNewPlan('');
        loadUsers();
        loadStats();
      } else {
        toast.error(result.error || 'Failed to update plan');
      }
    } catch (error) {
      toast.error('Failed to update plan');
      console.error(error);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Email', 'Plan', 'Status', 'Joined Date'].join(','),
      ...filteredUsers.map(user =>
        [
          user.email || '',
          user.plan || 'free',
          user.subscription_status || 'inactive',
          user.created_at ? new Date(user.created_at).toLocaleDateString() : '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('📥 Users exported successfully!');
  };

  const filteredUsers = users.filter(user => {
    if (filterPlan === 'all') return true;
    if (filterPlan === 'free') return !user.plan || user.plan === 'free';
    return user.plan === filterPlan;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const planColors = {
    free: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    supporter: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    family: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  };

  const planIcons = {
    free: UsersIcon,
    supporter: Zap,
    family: Crown,
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'from-slate-500 to-slate-600' },
            { label: 'Free', value: stats.free, color: 'from-green-500 to-emerald-500' },
            {
              label: 'Supporter',
              value: stats.supporter,
              color: 'from-blue-500 to-cyan-500',
            },
            {
              label: 'Family',
              value: stats.family,
              color: 'from-purple-500 to-pink-500',
            },
            { label: 'Active', value: stats.active, color: 'from-orange-500 to-red-500' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 text-white shadow-lg`}
            >
              <p className="text-sm font-medium opacity-90 mb-2">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Enhanced Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="🔍 Search users by email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <select
              value={filterPlan}
              onChange={e => setFilterPlan(e.target.value)}
              className="px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="supporter">Supporter</option>
              <option value="family">Family</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </motion.button>
          </div>
        </div>
        {filteredUsers.length > 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
            Showing {paginatedUsers.length} of {filteredUsers.length} users
          </p>
        )}
      </motion.div>

      {/* Enhanced Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-slate-500 dark:text-slate-400">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
              No users found
            </p>
            {searchQuery && (
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                Try adjusting your search or filters
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Support
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  <AnimatePresence>
                    {paginatedUsers.map((user, index) => {
                      const PlanIcon = planIcons[user.plan || 'free'] || UsersIcon;
                      const ticketCount = userTickets[user.id] || 0;
                      return (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                                <Mail className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                {user.email || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1.5 text-xs font-bold rounded-full flex items-center gap-2 w-fit ${
                                planColors[user.plan || 'free']
                              }`}
                            >
                              <PlanIcon className="w-3 h-3" />
                              {(user.plan || 'free').charAt(0).toUpperCase() +
                                (user.plan || 'free').slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                                user.subscription_status === 'active'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {user.subscription_status || 'inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {ticketCount > 0 ? (
                              <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                                  {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400 dark:text-slate-500">No tickets</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingUser === user.id ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={newPlan}
                                  onChange={e => setNewPlan(e.target.value)}
                                  className="px-3 py-1.5 text-sm border-2 border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select plan</option>
                                  <option value="free">Free</option>
                                  <option value="supporter">Supporter</option>
                                  <option value="family">Family</option>
                                </select>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleUpdatePlan(user.id)}
                                  className="p-1.5 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                >
                                  <Check className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => {
                                    setEditingUser(null);
                                    setNewPlan('');
                                  }}
                                  className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <X className="w-5 h-5" />
                                </motion.button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => {
                                    setEditingUser(user.id);
                                    setNewPlan(user.plan || 'free');
                                  }}
                                  className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                  title="Edit Plan"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleFlushUserCache(user.id, user.email)}
                                  className="p-2 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                                  title="Flush User Cache"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </motion.button>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Previous
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    Next
                  </motion.button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
