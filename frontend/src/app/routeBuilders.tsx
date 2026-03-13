import React from 'react';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import type { CompanySettingsShellProps, CompanySettingsTab } from '@/pages/SettingsPage';

export const COMPANY_SETTINGS_ROUTES: Array<{ path: string; tab: CompanySettingsTab }> = [
  { path: '/company/:companyId/settings/brand-intelligence', tab: 'brand-intelligence' },
  { path: '/company/:companyId/settings/workflow', tab: 'workflow' },
  { path: '/company/:companyId/settings/team', tab: 'team' },
  { path: '/company/:companyId/settings/integrations', tab: 'integrations' },
  { path: '/company/:companyId/settings/audit', tab: 'audit' },
];

type AdminRouteTab = NonNullable<React.ComponentProps<typeof AdminDashboardPage>['tab']>;

export const ADMIN_ROUTES: Array<{ path: string; tab: AdminRouteTab }> = [
  { path: '/admin/overview', tab: 'overview' },
  { path: '/admin/users', tab: 'users' },
  { path: '/admin/companies', tab: 'companies' },
  { path: '/admin/health', tab: 'health' },
  { path: '/admin/logs', tab: 'logs' },
  { path: '/admin/settings', tab: 'toolbox' },
  { path: '/admin/prompts', tab: 'prompts' },
];

export function buildSettingsPageProps(
  tab: CompanySettingsTab,
  sharedProps: Omit<CompanySettingsShellProps, 'tab'>,
): CompanySettingsShellProps {
  return {
    ...sharedProps,
    tab,
  };
}

export function buildAdminDashboardProps(
  tab: AdminRouteTab,
  sharedProps: Omit<React.ComponentProps<typeof AdminDashboardPage>, 'tab'>,
): React.ComponentProps<typeof AdminDashboardPage> {
  return {
    ...sharedProps,
    tab,
  };
}
