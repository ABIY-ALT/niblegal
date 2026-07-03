import { 
  LayoutDashboard, FileText, Scale, BookOpen, BarChart3, 
  Bell, Settings, FilePlus, Files, UserCheck, CheckSquare, 
  Archive, FileClock, FolderSearch, Search, Gavel, FileSignature,
  FileLock, Inbox, AlertTriangle, Clock, Users, Shield, Building2,
  Workflow, Mail, Sliders, ScrollText, Library, HelpCircle
} from 'lucide-react';
import { UserRole } from '@/types';

export type NavItem = {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  roles: UserRole[];
  submenu?: NavItem[];
  badge?: 'pending' | 'critical' | number;
};

// Map the requested roles to the existing UserRole type:
// 'manager' -> Director, Division Manager
// 'legal_officer' -> Legal Officer
// 'admin_assistant' -> System Administrator, Administrative Assistant, Internal Auditor
// 'requesting_organ' -> Requesting Department User
const ALL_ROLES: UserRole[] = ['manager', 'legal_officer', 'admin_assistant', 'requesting_organ'];

export const NAVIGATION: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={18} />,
    roles: ALL_ROLES,
  },
  {
    title: 'Contract Management',
    icon: <FileText size={18} />,
    roles: ALL_ROLES,
    submenu: [
      { title: 'Dashboard', href: '/contracts', roles: ['manager', 'legal_officer', 'admin_assistant'] },
      { title: 'New Contract Request', href: '/contracts/new', roles: ALL_ROLES },
      { title: 'My Contracts', href: '/contracts/my', roles: ALL_ROLES },
      { title: 'Assigned Contracts', href: '/contracts/assigned', roles: ['manager', 'legal_officer'] },
      { title: 'Draft Contracts', href: '/contracts/drafts', roles: ['manager', 'legal_officer'] },
      { title: 'Pending Review', href: '/contracts/review', roles: ['manager', 'legal_officer'], badge: 'pending' },
      { title: 'Pending Approval', href: '/contracts/approval', roles: ['manager'], badge: 'pending' },
      { title: 'Executed Contracts', href: '/contracts/executed', roles: ALL_ROLES },
      { title: 'Expiring Contracts', href: '/contracts/expiring', roles: ['manager', 'legal_officer', 'admin_assistant'], badge: 'critical' },
      { title: 'Repository', href: '/repository', roles: ALL_ROLES },
      { title: 'Templates', href: '/knowledge?category=templates', roles: ALL_ROLES },
      { title: 'Archive', href: '/contracts/archive', roles: ['manager', 'admin_assistant'] },
    ],
  },
  {
    title: 'Legal Advisory',
    icon: <Scale size={18} />,
    roles: ALL_ROLES,
    submenu: [
      { title: 'Dashboard', href: '/advisory', roles: ['manager', 'legal_officer', 'admin_assistant'] },
      { title: 'New Advisory Request', href: '/advisory/new', roles: ALL_ROLES },
      { title: 'My Requests', href: '/advisory/my', roles: ALL_ROLES },
      { title: 'Assigned Requests', href: '/advisory/assigned', roles: ['manager', 'legal_officer'] },
      { title: 'Draft Opinions', href: '/advisory/drafts', roles: ['manager', 'legal_officer'] },
      { title: 'Pending Review', href: '/advisory/review', roles: ['manager', 'legal_officer'] },
      { title: 'Pending Approval', href: '/advisory/approval', roles: ['manager'], badge: 'pending' },
      { title: 'Approved Opinions', href: '/advisory/approved', roles: ['manager', 'legal_officer'] },
      { title: 'Dispatched Opinions', href: '/advisory/dispatched', roles: ['manager', 'legal_officer', 'admin_assistant'] },
      { title: 'Closed Requests', href: '/advisory/closed', roles: ALL_ROLES },
    ],
  },
  {
    title: 'Knowledge Center',
    icon: <BookOpen size={18} />,
    roles: ALL_ROLES,
    submenu: [
      { title: 'Contract Templates', href: '/knowledge?tab=contracts', roles: ALL_ROLES },
      { title: 'Legal Opinion Templates', href: '/knowledge?tab=opinions', roles: ALL_ROLES },
      { title: 'Legal Policies', href: '/knowledge?tab=policies', roles: ALL_ROLES },
      { title: 'NBE Directives', href: '/knowledge?tab=nbe', roles: ALL_ROLES },
      { title: 'Laws & Regulations', href: '/knowledge?tab=laws', roles: ALL_ROLES },
      { title: 'Legal Research', href: '/knowledge?tab=research', roles: ['manager', 'legal_officer', 'admin_assistant'] },
      { title: 'Articles', href: '/knowledge?tab=articles', roles: ALL_ROLES },
      { title: 'FAQ', href: '/knowledge?tab=faq', roles: ALL_ROLES },
    ],
  },
  {
    title: 'Reports & Analytics',
    icon: <BarChart3 size={18} />,
    roles: ['manager', 'legal_officer', 'admin_assistant'],
    submenu: [
      { title: 'Contract Reports', href: '/reports/contracts', roles: ['manager', 'admin_assistant'] },
      { title: 'Advisory Reports', href: '/reports/advisory', roles: ['manager', 'admin_assistant'] },
      { title: 'SLA Reports', href: '/reports/sla', roles: ['manager', 'admin_assistant'] },
      { title: 'Performance Reports', href: '/reports/performance', roles: ['manager'] },
      { title: 'Compliance Reports', href: '/reports/compliance', roles: ['manager', 'admin_assistant'] },
      { title: 'Audit Reports', href: '/reports/audit', roles: ['manager', 'admin_assistant'] },
    ],
  },
  {
    title: 'Notifications',
    icon: <Bell size={18} />,
    roles: ALL_ROLES,
    submenu: [
      { title: 'Inbox', href: '/notifications/inbox', roles: ALL_ROLES },
      { title: 'Critical Alerts', href: '/notifications/critical', roles: ALL_ROLES, badge: 'critical' },
      { title: 'Expiry Alerts', href: '/notifications/expiry', roles: ['manager', 'legal_officer', 'admin_assistant'] },
      { title: 'SLA Alerts', href: '/notifications/sla', roles: ['manager', 'legal_officer'] },
    ],
  },
  {
    title: 'Administration',
    icon: <Settings size={18} />,
    roles: ['manager', 'admin_assistant'],
    submenu: [
      { title: 'Dashboard', href: '/admin', roles: ['manager', 'admin_assistant'] },
      { title: 'Users', href: '/admin/users', roles: ['manager', 'admin_assistant'] },
      { title: 'Roles & Permissions', href: '/admin/roles', roles: ['manager'] },
      { title: 'Departments', href: '/admin/departments', roles: ['manager', 'admin_assistant'] },
      { title: 'Workflow Configuration', href: '/admin/workflows', roles: ['manager'] },
      { title: 'Email Templates', href: '/admin/emails', roles: ['manager', 'admin_assistant'] },
      { title: 'Notification Settings', href: '/admin/notifications', roles: ['manager', 'admin_assistant'] },
      { title: 'System Settings', href: '/admin/settings', roles: ['manager'] },
      { title: 'Audit Logs', href: '/admin/audit', roles: ['manager', 'admin_assistant'] },
    ],
  },
];
