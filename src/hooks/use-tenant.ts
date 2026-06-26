'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabase } from '@/supabase/provider';
import { useSupabaseDoc } from '@/supabase/hooks/use-doc';
import { useSupabaseCollection } from '@/supabase/hooks/use-collection';
import { supabase } from '@/supabase/client';

export function useTenant() {
  const { user, isLoading: isAuthLoading } = useSupabase();

  // 1. Get User Profile from Supabase 'User' table
  const { data: profile, isLoading: isProfileLoading } = useSupabaseDoc('User', user?.id || null);
  
  const companyId = profile?.company_id;
  const roleId = profile?.role_id; // SUPER_ADMIN, MANAGER, EMPLOYEE, ACCOUNTS, MARKETING_SALES

  // 2. Get Super Admin Status
  const { data: superAdmin, isLoading: isSuperAdminLoading } = useSupabaseDoc('SuperAdmin', user?.id || null);

  // 3. Get Company Context
  const { data: company, isLoading: isCompanyLoading } = useSupabaseDoc('Company', companyId || null);

  // 4. Get Company Settings (currencies, enabled modules, timezone)
  const { data: settingsArray, isLoading: isSettingsLoading } = useSupabaseCollection('CompanySettings', {
    where: companyId ? { company_id: companyId } : undefined
  });
  const settings = settingsArray?.[0] || null;

  // Defensive Profile Self-Healing Hook
  useEffect(() => {
    if (isAuthLoading || isProfileLoading) return;
    if (user && !profile) {
      console.warn("useTenant: Public profile missing! Re-generating sync row in background...");
      
      const regenerateProfile = async () => {
        try {
          const { data: companies } = await supabase
            .from('Company')
            .select('id')
            .limit(1);

          const firstCompanyId = companies && companies.length > 0 ? companies[0].id : null;

          const assignedRole = user.user_metadata?.role || 'EMPLOYEE';
          const assignedDept = assignedRole === 'TALENT' ? 'Talent' : assignedRole === 'CLIENT' ? 'Client' : 'Production';

          await supabase
            .from('User')
            .insert({
              id: user.id,
              email: user.email,
              fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
              status: 'pending',
              role_id: assignedRole,
              company_id: firstCompanyId,
              onboarding_status: 'awaiting_approval',
              department: assignedDept
            });
        } catch (err) {
          console.error("Defensive self-healing profile generation failed:", err);
        }
      };

      regenerateProfile();
    }
  }, [user, profile, isAuthLoading, isProfileLoading]);

  const isLoading = isAuthLoading || 
                    isProfileLoading || 
                    isSuperAdminLoading || 
                    isCompanyLoading || 
                    isSettingsLoading;
  
  const isSuperAdmin = !!superAdmin || user?.email === 'arundevv.com@gmail.com' || roleId === 'SUPER_ADMIN';

  // Strict Enterprise RBAC Permission Matrix (Memoized)
  const hasPermission = useCallback((module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'approve' = 'view') => {
    if (isSuperAdmin) return true;

    if (!roleId) return false;

    // Check dynamic permissions first
    if (settings?.role_permissions) {
      const customPermissions = settings.role_permissions as Record<string, string[]>;
      if (customPermissions[roleId]) {
        // If the role has a custom configuration, enforce it strictly.
        if (!customPermissions[roleId].includes(module)) return false;
        
        // Retain hardcoded logic for destructive actions to prevent employees from deleting data even if module is enabled
        if (roleId === 'EMPLOYEE' && (action === 'delete' || action === 'approve')) return false;
        return true;
      }
    }

    // Fallback to strict Enterprise RBAC Permission Matrix
    switch (roleId) {
      case 'SUPER_ADMIN':
        return true;

      case 'MANAGER':
        // Managers have extensive visibility, but cannot manage system admin settings or global billing
        if (module === 'admin_settings' || module === 'global_billing') return false;
        return true;

      case 'EMPLOYEE':
        // Employees only see their own assigned modules and cannot perform deletions/approvals
        const employeeAllowed = ['dashboard', 'projects', 'tasks', 'talents'];
        if (!employeeAllowed.includes(module)) return false;
        if (action === 'delete' || action === 'approve') return false;
        return true;

      case 'ACCOUNTS':
        // Accounts team only sees financial ledgers, invoicing, budgets, expenses, and GST
        const accountsAllowed = ['dashboard', 'finance', 'invoices', 'expenses', 'gst_filings', 'payroll'];
        if (module === 'projects' && action === 'view') return true; // Can view projects to check budgets, but not edit/create
        return accountsAllowed.includes(module);

      case 'MARKETING_SALES':
        // Sales team has access to CRM pipeline, proposals, and portfolios
        const marketingAllowed = ['dashboard', 'crm', 'proposals', 'talents'];
        if (module === 'invoices' && action === 'view') return true; // Can see invoice totals in CRM/leads but cannot edit
        return marketingAllowed.includes(module);

      default:
        // By default, pending or undefined users have no access
        return false;
    }
  }, [isSuperAdmin, roleId, settings?.role_permissions]);

  const isModuleEnabled = useCallback((moduleName: string) => {
    // First, enforce company-level module enablement (this overrides even super admin)
    if (settings?.modules_enabled && !settings.modules_enabled.includes(moduleName)) {
      return false;
    }

    if (isSuperAdmin) return true;
    
    // Enforce role-based module gating
    if (!hasPermission(moduleName, 'view')) return false;

    return true;
  }, [isSuperAdmin, hasPermission, settings?.modules_enabled]);

  // Perfectly memoize the returned object to enforce absolute reference stability
  return useMemo(() => ({
    user,
    profile,
    company,
    settings,
    isLoading,
    companyId,
    roleId,
    isSuperAdmin,
    hasPermission,
    isModuleEnabled,
  }), [
    user,
    profile,
    company,
    settings,
    isLoading,
    companyId,
    roleId,
    isSuperAdmin,
    hasPermission,
    isModuleEnabled,
  ]);
}
