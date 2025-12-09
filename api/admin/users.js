/**
 * Admin API: Get All Users
 * Uses service role key to fetch all users from auth.users and merge with profiles
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Verify admin access (check email from auth token)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    // Initialize Supabase with service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Verify the user's token and check if they're an admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Check if user is admin
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(user.email?.toLowerCase());
    
    if (!isAdmin) {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    // Get all users from auth.users
    const { data: authUsersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      res.status(500).json({ error: 'Failed to fetch users', details: listError.message });
      return;
    }

    const authUsers = authUsersData?.users || [];

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      // Continue even if profiles fail - we'll still return auth users
    }

    // Create a map of profile data by user ID
    const profilesMap = new Map();
    (profiles || []).forEach(profile => {
      profilesMap.set(profile.id, profile);
    });

    // Merge auth users with profile data
    const mergedUsers = authUsers.map(authUser => {
      const profile = profilesMap.get(authUser.id) || {};
      
      return {
        id: authUser.id,
        email: authUser.email || profile.email || 'N/A',
        created_at: authUser.created_at || profile.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        email_confirmed_at: authUser.email_confirmed_at,
        // Profile data (subscription info)
        plan: profile.plan || 'free',
        billing_period: profile.billing_period || 'monthly',
        subscription_status: profile.subscription_status || 'inactive',
        paddle_customer_id: profile.paddle_customer_id,
        paddle_subscription_id: profile.paddle_subscription_id,
        stripe_customer_id: profile.stripe_customer_id,
        stripe_subscription_id: profile.stripe_subscription_id,
        paystack_customer_code: profile.paystack_customer_code,
        paystack_subscription_code: profile.paystack_subscription_code,
        updated_at: profile.updated_at,
        // Additional metadata
        user_metadata: authUser.user_metadata,
        app_metadata: authUser.app_metadata,
      };
    });

    // Calculate stats
    const stats = {
      total: mergedUsers.length,
      free: 0,
      supporter: 0,
      family: 0,
      active: 0,
    };

    mergedUsers.forEach(user => {
      if (!user.plan || user.plan === 'free') {
        stats.free++;
      } else if (user.plan === 'supporter') {
        stats.supporter++;
      } else if (user.plan === 'family') {
        stats.family++;
      }

      if (user.subscription_status === 'active') {
        stats.active++;
      }
    });

    res.status(200).json({
      users: mergedUsers,
      stats,
      total: mergedUsers.length,
    });
  } catch (error) {
    console.error('Error in admin users API:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

