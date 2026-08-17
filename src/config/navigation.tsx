import {
  LayoutDashboard, FileText, Scale, BookOpen, BarChart3,
  Bell, Settings, Gavel,
} from 'lucide-react';
import { UserRole } from '@/types';

export type NavItem = {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  /**
   * Built-in role slugs that may see this item. Kept as a fallback for entries
   * with no equivalent in the permission catalog (litigation, notifications).
   */
  roles: UserRole[];
  /** Single permission that grants this item. */
  permission?: string;
  /** Any one of these permissions grants this item — used for module headings. */
  anyOf?: string[];
  submenu?: NavItem[];
  badge?: 'pending' | 'critical' | number;
};

export type NavGroup = {
  groupLabel?: string;
  items: NavItem[];
};

const ALL_ROLES: UserRole[] = ['manager', 'legal_officer', 'admin_assistant', 'requesting_organ'];

/* Module-level "any of" sets live in lib/access so pages and nav agree. */
import { ANY_CONTRACT, ANY_ADVISORY, ANY_KNOWLEDGE, ANY_LITIGATION, ANY_REPORTS, ANY_ADMIN } from '@/lib/access';

/* Entries with no role or permission criteria are open to any signed-in user.
   Dashboard and Notifications are personal, not privileged. */
const OPEN: UserRole[] = [];

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard size={18} />,
        roles: OPEN,
      },
    ],
  },
  {
    groupLabel: 'LEGAL OPERATIONS',
    items: [
      {
        title: 'Contract Management',
        icon: <FileText size={18} />,
        roles: ALL_ROLES,
        anyOf: ANY_CONTRACT,
        submenu: [
          { title: 'Dashboard', href: '/contracts', roles: ['manager', 'legal_officer', 'admin_assistant'], anyOf: ANY_CONTRACT },
          { title: 'New Contract Request', href: '/contracts/new', roles: ALL_ROLES, permission: 'contract.create' },
          { title: 'My Contracts', href: '/contracts/my', roles: ALL_ROLES, anyOf: ANY_CONTRACT },
          { title: 'Assigned Contracts', href: '/contracts/assigned', roles: ['manager', 'legal_officer'], anyOf: ['contract.review', 'contract.assign', 'contract.approve'] },
          { title: 'Draft Contracts', href: '/contracts/drafts', roles: ['manager', 'legal_officer'], anyOf: ['contract.review', 'contract.assign'] },
          { title: 'Pending Review', href: '/contracts/review', roles: ['manager', 'legal_officer'], permission: 'contract.review', badge: 'pending' },
          { title: 'Pending Approval', href: '/contracts/approval', roles: ['manager'], permission: 'contract.approve', badge: 'pending' },
          { title: 'Executed Contracts', href: '/contracts/executed', roles: ALL_ROLES, anyOf: ANY_CONTRACT },
          { title: 'Expiring Contracts', href: '/contracts/expiring', roles: ['manager', 'legal_officer', 'admin_assistant'], anyOf: ANY_CONTRACT, badge: 'critical' },
          { title: 'Repository', href: '/repository', roles: ALL_ROLES, anyOf: ANY_CONTRACT },
          { title: 'Archive', href: '/contracts/archive', roles: ['manager', 'admin_assistant'], anyOf: ANY_CONTRACT },
        ],
      },
      {
        title: 'Legal Advisory',
        icon: <Scale size={18} />,
        roles: ALL_ROLES,
        anyOf: ANY_ADVISORY,
        submenu: [
          { title: 'Dashboard', href: '/advisory', roles: ['manager', 'legal_officer', 'admin_assistant'], anyOf: ANY_ADVISORY },
          { title: 'New Advisory Request', href: '/advisory/new', roles: ALL_ROLES, permission: 'advisory.create' },
          { title: 'My Requests', href: '/advisory/my', roles: ALL_ROLES, anyOf: ANY_ADVISORY },
          { title: 'Assigned Requests', href: '/advisory/assigned', roles: ['manager', 'legal_officer'], anyOf: ['advisory.draft', 'advisory.assign', 'advisory.approve'] },
          { title: 'Draft Opinions', href: '/advisory/drafts', roles: ['manager', 'legal_officer'], permission: 'advisory.draft' },
          { title: 'Pending Review', href: '/advisory/review', roles: ['manager', 'legal_officer'], anyOf: ['advisory.draft', 'advisory.approve'] },
          { title: 'Pending Approval', href: '/advisory/approval', roles: ['manager'], permission: 'advisory.approve', badge: 'pending' },
          { title: 'Approved Opinions', href: '/advisory/approved', roles: ['manager', 'legal_officer'], anyOf: ['advisory.approve', 'advisory.dispatch'] },
          { title: 'Dispatched Opinions', href: '/advisory/dispatched', roles: ['manager', 'legal_officer', 'admin_assistant'], anyOf: ANY_ADVISORY },
          { title: 'Closed Requests', href: '/advisory/closed', roles: ALL_ROLES, anyOf: ANY_ADVISORY },
        ],
      },
      {
        title: 'Litigation',
        icon: <Gavel size={18} />,
        roles: ALL_ROLES,
        anyOf: ANY_LITIGATION,
        submenu: [
          { title: 'Dashboard', href: '/litigation', roles: ['manager', 'legal_officer', 'admin_assistant'], anyOf: ANY_LITIGATION },
          { title: 'Active Cases', href: '/litigation/active', roles: ALL_ROLES, anyOf: ANY_LITIGATION },
          { title: 'Court Schedule', href: '/litigation/schedule', roles: ALL_ROLES, anyOf: ANY_LITIGATION, badge: 'critical' },
          { title: 'Case Archive', href: '/litigation/archive', roles: ['manager', 'admin_assistant'], permission: 'litigation.manage' },
        ],
      },
      {
        title: 'Knowledge Center',
        icon: <BookOpen size={18} />,
        roles: ALL_ROLES,
        anyOf: ANY_KNOWLEDGE,
        submenu: [
          { title: 'Contract Templates', href: '/knowledge?tab=contracts', roles: ALL_ROLES, anyOf: ANY_KNOWLEDGE },
          { title: 'Legal Opinion Templates', href: '/knowledge?tab=opinions', roles: ALL_ROLES, anyOf: ANY_KNOWLEDGE },
          { title: 'Legal Policies', href: '/knowledge?tab=policies', roles: ALL_ROLES, anyOf: ANY_KNOWLEDGE },
          { title: 'NBE Directives', href: '/knowledge?tab=nbe', roles: ALL_ROLES, anyOf: ANY_KNOWLEDGE },
          { title: 'Laws & Regulations', href: '/knowledge?tab=laws', roles: ALL_ROLES, anyOf: ANY_KNOWLEDGE },
          { title: 'FAQ', href: '/knowledge?tab=faq', roles: ALL_ROLES, anyOf: ANY_KNOWLEDGE },
        ],
      },
    ],
  },
  {
    groupLabel: 'REPORTS & ALERTS',
    items: [
      {
        title: 'Reports & Analytics',
        icon: <BarChart3 size={18} />,
        roles: ['manager', 'legal_officer', 'admin_assistant'],
        anyOf: ANY_REPORTS,
        submenu: [
          { title: 'Executive Dashboard', href: '/reports/executive', roles: ['manager', 'legal_officer'], permission: 'reports.view' },
          { title: 'Contract Reports', href: '/reports/contracts', roles: ['manager', 'legal_officer', 'admin_assistant'], permission: 'reports.view' },
          { title: 'Advisory Reports', href: '/reports/advisory', roles: ['manager', 'legal_officer', 'admin_assistant'], permission: 'reports.view' },
          { title: 'SLA Dashboard', href: '/reports/sla', roles: ['manager', 'legal_officer', 'admin_assistant'], permission: 'reports.view' },
          { title: 'Audit Reports', href: '/reports/audit', roles: ['manager', 'admin_assistant'], permission: 'reports.view' },
          { title: 'Export Center', href: '/reports/export', roles: ['manager', 'legal_officer', 'admin_assistant'], permission: 'reports.export' },
        ],
      },
      {
        // Notifications are personal to the signed-in user — no permission gate.
        title: 'Notifications',
        icon: <Bell size={18} />,
        roles: OPEN,
        submenu: [
          { title: 'Inbox', href: '/notifications/inbox', roles: OPEN },
          { title: 'Critical Alerts', href: '/notifications/critical', roles: OPEN, badge: 'critical' },
          { title: 'Expiry Alerts', href: '/notifications/expiry', roles: OPEN },
          { title: 'SLA Alerts', href: '/notifications/sla', roles: OPEN },
        ],
      },
    ],
  },
  {
    groupLabel: 'ADMINISTRATION',
    items: [
      {
        title: 'System Management',
        icon: <Settings size={18} />,
        roles: ['manager', 'admin_assistant'],
        anyOf: ANY_ADMIN,
        submenu: [
          { title: 'Overview', href: '/admin', roles: ['manager', 'admin_assistant'], anyOf: ANY_ADMIN },
          { title: 'User Management', href: '/admin/users', roles: ['manager', 'admin_assistant'], permission: 'admin.users' },
          { title: 'Roles & Permissions', href: '/admin/roles', roles: ['manager'], permission: 'admin.roles' },
          { title: 'Departments', href: '/admin/departments', roles: ['manager', 'admin_assistant'], permission: 'admin.settings' },
          { title: 'Workflow Config', href: '/admin/workflows', roles: ['manager'], permission: 'admin.settings' },
          { title: 'Email Templates', href: '/admin/emails', roles: ['manager', 'admin_assistant'], permission: 'admin.settings' },
          { title: 'System Settings', href: '/admin/settings', roles: ['manager'], permission: 'admin.settings' },
          { title: 'Audit Logs', href: '/admin/audit-logs', roles: ['manager', 'admin_assistant'], permission: 'admin.settings' },
        ],
      },
    ],
  },
];

// Flat list for backward compat
export const NAVIGATION: NavItem[] = NAV_GROUPS.flatMap(g => g.items);
