import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { isAdmin, isAdminModeEnabled } from '../utils/admin';

const AdminCtx = createContext(null);

export function AdminProvider({ children }) {
  const { user } = useAuth();
  const [adminModeEnabled, setAdminModeEnabled] = useState(false);

  // Check if user is an admin based on their email
  const isAdminUser = useMemo(() => {
    if (!user) {
      return false;
    }

    const userIsAdmin = isAdmin(user);
    return userIsAdmin;
  }, [user]);

  // Check if admin mode is enabled (for UI visibility)
  // Re-check when user changes to ensure admin access works in production
  useEffect(() => {
    const enabled = isAdminModeEnabled();
    // If user is admin, always enable admin mode (even in production)
    const shouldEnable = enabled || isAdminUser;
    setAdminModeEnabled(shouldEnable);
  }, [isAdminUser]);

  const value = useMemo(
    () => ({
      isAdmin: isAdminUser,
      adminModeEnabled: adminModeEnabled && isAdminUser, // Only enabled if user is actually an admin
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
