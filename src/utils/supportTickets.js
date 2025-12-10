/**
 * Support Ticket Management Utilities
 * Functions for managing user support tickets and issues
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Get all support tickets with optional filters
 */
export async function getAllSupportTickets(filters = {}) {
  try {
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        user:profiles!support_tickets_user_id_fkey (
          id,
          email,
          plan,
          subscription_status
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.search) {
      query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      tickets: data || [],
      total: count || data?.length || 0,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return {
      tickets: [],
      total: 0,
      error: error.message,
    };
  }
}

/**
 * Get support ticket statistics
 */
export async function getSupportTicketStats() {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('status, priority');

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    data?.forEach(ticket => {
      if (ticket.status === 'open') stats.open++;
      if (ticket.status === 'in_progress') stats.inProgress++;
      if (ticket.status === 'resolved') stats.resolved++;
      if (ticket.status === 'closed') stats.closed++;
      if (ticket.priority === 'urgent') stats.urgent++;
      if (ticket.priority === 'high') stats.high++;
      if (ticket.priority === 'medium') stats.medium++;
      if (ticket.priority === 'low') stats.low++;
    });

    return {
      stats,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching support ticket stats:', error);
    return {
      stats: null,
      error: error.message,
    };
  }
}

/**
 * Create a new support ticket
 */
export async function createSupportTicket(ticketData) {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: ticketData.userId,
        subject: ticketData.subject,
        description: ticketData.description,
        category: ticketData.category || 'general',
        priority: ticketData.priority || 'medium',
        status: 'open',
        metadata: ticketData.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      ticket: data,
      error: null,
    };
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return {
      success: false,
      ticket: null,
      error: error.message,
    };
  }
}

/**
 * Update support ticket
 */
export async function updateSupportTicket(ticketId, updates) {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      ticket: data,
      error: null,
    };
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return {
      success: false,
      ticket: null,
      error: error.message,
    };
  }
}

/**
 * Add a comment/note to a support ticket
 */
export async function addTicketComment(ticketId, commentData) {
  try {
    // First, get the ticket to append to existing comments
    const { data: ticket, error: fetchError } = await supabase
      .from('support_tickets')
      .select('comments')
      .eq('id', ticketId)
      .single();

    if (fetchError) throw fetchError;

    const existingComments = ticket.comments || [];
    const newComment = {
      id: Date.now().toString(),
      admin_id: commentData.adminId,
      admin_email: commentData.adminEmail,
      message: commentData.message,
      created_at: new Date().toISOString(),
      internal: commentData.internal || false,
    };

    const updatedComments = [...existingComments, newComment];

    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        comments: updatedComments,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      ticket: data,
      error: null,
    };
  } catch (error) {
    console.error('Error adding ticket comment:', error);
    return {
      success: false,
      ticket: null,
      error: error.message,
    };
  }
}

/**
 * Get tickets for a specific user
 */
export async function getUserSupportTickets(userId) {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      tickets: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Error fetching user support tickets:', error);
    return {
      tickets: [],
      error: error.message,
    };
  }
}

