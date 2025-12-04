import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { isAdmin, isAdminModeEnabled } from '../utils/admin';

const AdminCtx = createContext(null);

export function AdminProvider({ children }) {
  const { user } = useAuth();

  // Check if user is an admin based on their email
  const isAdminUser = useMemo(() => {
    if (!user) {
      return false;
    }

    const userIsAdmin = isAdmin(user);
    return userIsAdmin;
  }, [user]);

  // Compute admin mode enabled state directly (no setState in effect)
  // If user is admin, always enable admin mode (even in production)
  const adminModeEnabled = useMemo(() => {
    const enabled = isAdminModeEnabled();
    // If user is admin, always enable admin mode (even in production)
    return (enabled || isAdminUser) && isAdminUser; // Only enabled if user is actually an admin
  }, [isAdminUser]);

  const value = useMemo(
    () => ({
      isAdmin: isAdminUser,
      adminModeEnabled,
    }),
    [isAdminUser, adminModeEnabled]
  );

  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
