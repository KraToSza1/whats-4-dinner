import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAllSupportTickets,
  getSupportTicketStats,
  updateSupportTicket,
  addTicketComment,
} from '../utils/supportTickets';
import { useToast } from './Toast';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Mail,
  Edit2,
  Send,
  Eye,
  EyeOff,
  Zap,
  AlertTriangle,
  Info,
  ExternalLink,
  RefreshCw,
  Tag,
  Calendar,
  MessageCircle,
} from 'lucide-react';

export default function UserSupportManagement() {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
  });
  const [newComment, setNewComment] = useState('');
  const [showInternalOnly, setShowInternalOnly] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [filters]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const result = await getAllSupportTickets(filters);
      setTickets(result.tickets || []);
    } catch (error) {
      toast.error('Failed to load support tickets');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await getSupportTicketStats();
      setStats(result.stats);
    } catch (error) {
      console.error('Failed to load ticket stats:', error);
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    setUpdating(true);
    try {
      const result = await updateSupportTicket(ticketId, { status: newStatus });
      if (result.success) {
        toast.success(`Ticket status updated to ${newStatus}`);
        loadTickets();
        loadStats();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(result.ticket);
        }
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update ticket status');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityUpdate = async (ticketId, newPriority) => {
    setUpdating(true);
    try {
      const result = await updateSupportTicket(ticketId, { priority: newPriority });
      if (result.success) {
        toast.success(`Ticket priority updated to ${newPriority}`);
        loadTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(result.ticket);
        }
      } else {
        toast.error(result.error || 'Failed to update priority');
      }
    } catch (error) {
      toast.error('Failed to update ticket priority');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;

    setUpdating(true);
    try {
      const result = await addTicketComment(selectedTicket.id, {
        adminId: currentUser?.id,
        adminEmail: currentUser?.email,
        message: newComment,
        internal: showInternalOnly,
      });

      if (result.success) {
        toast.success('Comment added successfully');
        setNewComment('');
        setShowInternalOnly(false);
        loadTickets();
        setSelectedTicket(result.ticket);
      } else {
        toast.error(result.error || 'Failed to add comment');
      }
    } catch (error) {
      toast.error('Failed to add comment');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'resolved':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'closed':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getPriorityColor = priority => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getPriorityIcon = priority => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4" />;
      case 'high':
        return <AlertCircle className="w-4 h-4" />;
      case 'medium':
        return <Info className="w-4 h-4" />;
      case 'low':
        return <Tag className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filters.status !== 'all' && ticket.status !== filters.status) return false;
    if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        ticket.subject?.toLowerCase().includes(searchLower) ||
        ticket.description?.toLowerCase().includes(searchLower) ||
        ticket.user?.email?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            Support Ticket Management
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage user support requests and issues
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            loadTickets();
            loadStats();
          }}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'from-slate-500 to-slate-600' },
            { label: 'Open', value: stats.open, color: 'from-blue-500 to-cyan-500' },
            { label: 'In Progress', value: stats.inProgress, color: 'from-yellow-500 to-amber-500' },
            { label: 'Resolved', value: stats.resolved, color: 'from-green-500 to-emerald-500' },
            { label: 'Closed', value: stats.closed, color: 'from-slate-400 to-slate-500' },
            { label: 'Urgent', value: stats.urgent, color: 'from-red-500 to-rose-500' },
            { label: 'High', value: stats.high, color: 'from-orange-500 to-red-500' },
            { label: 'Medium', value: stats.medium, color: 'from-yellow-500 to-orange-500' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 text-white shadow-lg`}
            >
              <p className="text-xs font-medium opacity-90 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
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
              placeholder="🔍 Search tickets by subject, description, or user email..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filters.priority}
            onChange={e => setFilters({ ...filters, priority: e.target.value })}
            className="px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </motion.div>

      {/* Tickets List and Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Tickets ({filteredTickets.length})
              </h3>
            </div>
            <div className="max-h-[800px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-4 animate-spin" />
                  <p className="text-slate-500 dark:text-slate-400">Loading tickets...</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">No tickets found</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredTickets.map((ticket, index) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 border-b border-slate-200 dark:border-slate-700 cursor-pointer transition-colors ${
                        selectedTicket?.id === ticket.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">
                          {ticket.subject}
                        </h4>
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded-full ${getPriorityColor(
                            ticket.priority
                          )} flex items-center gap-1`}
                        >
                          {getPriorityIcon(ticket.priority)}
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {ticket.user?.email || 'Unknown user'}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Detail View */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg p-6 space-y-6"
            >
              {/* Ticket Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-200 dark:border-slate-700 pb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedTicket.subject}
                    </h3>
                    <span
                      className={`px-3 py-1 text-sm font-bold rounded-full ${getPriorityColor(
                        selectedTicket.priority
                      )} flex items-center gap-2`}
                    >
                      {getPriorityIcon(selectedTicket.priority)}
                      {selectedTicket.priority}
                    </span>
                    <span
                      className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(
                        selectedTicket.status
                      )}`}
                    >
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {selectedTicket.user?.email || 'Unknown user'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      {selectedTicket.category || 'general'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStatusUpdate(selectedTicket.id, 'open')}
                  disabled={updating || selectedTicket.status === 'open'}
                  className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-semibold"
                >
                  Open
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStatusUpdate(selectedTicket.id, 'in_progress')}
                  disabled={updating || selectedTicket.status === 'in_progress'}
                  className="px-3 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded-lg font-semibold"
                >
                  In Progress
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStatusUpdate(selectedTicket.id, 'resolved')}
                  disabled={updating || selectedTicket.status === 'resolved'}
                  className="px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg font-semibold"
                >
                  Resolve
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStatusUpdate(selectedTicket.id, 'closed')}
                  disabled={updating || selectedTicket.status === 'closed'}
                  className="px-3 py-1.5 text-xs bg-slate-500 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg font-semibold"
                >
                  Close
                </motion.button>
                <div className="flex-1" />
                <select
                  value={selectedTicket.priority}
                  onChange={e => handlePriorityUpdate(selectedTicket.id, e.target.value)}
                  disabled={updating}
                  className="px-3 py-1.5 text-xs border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Description</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Comments Section */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                  Comments ({selectedTicket.comments?.length || 0})
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {selectedTicket.comments?.length > 0 ? (
                    selectedTicket.comments.map((comment, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          comment.internal
                            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {comment.admin_email || 'Admin'}
                            {comment.internal && (
                              <span className="ml-2 px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded text-[10px]">
                                Internal
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {comment.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                      No comments yet
                    </p>
                  )}
                </div>

                {/* Add Comment */}
                <div className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment or note..."
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={showInternalOnly}
                        onChange={e => setShowInternalOnly(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                      />
                      <span>Internal note (user won't see this)</span>
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || updating}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Add Comment
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {selectedTicket.metadata && Object.keys(selectedTicket.metadata).length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Metadata</h4>
                  <pre className="text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedTicket.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg p-12 text-center">
              <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                Select a ticket to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

