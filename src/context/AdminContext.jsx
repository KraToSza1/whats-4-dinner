import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { isAdmin, isAdminModeEnabled } from '../utils/admin';

const AdminCtx = createContext(null);

export function AdminProvider({ children }) {
  // FORCE ADMIN - ALWAYS TRUE - NO STATE, NO CHECKS, NO CONDITIONS
  console.log('🔑 [ADMIN CONTEXT] =========================================');
  console.log('🔑 [ADMIN CONTEXT] PROVIDER RENDERING - FORCING ADMIN = TRUE');
  console.log('🔑 [ADMIN CONTEXT] =========================================');

  // ALWAYS return true - no state, no effects, no conditions
  const value = useMemo(() => {
    console.log('🔑 [ADMIN CONTEXT] useMemo - RETURNING ADMIN = TRUE');
    return {
      isAdmin: true, // FORCED TO TRUE
      adminModeEnabled: true, // FORCED TO TRUE
    };
  }, []); // Empty deps - always returns true

  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
