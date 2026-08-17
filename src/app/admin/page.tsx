import Link from 'next/link';
import {
  Bell,
  Building2,
  GitMerge,
  List,
  Mail,
  Settings,
  Shield,
  Users,
} from 'lucide-react';

const adminSections = [
  {
    href: '/admin/users',
    title: 'User Management',
    description: 'Create users, assign departments, and reset access.',
    icon: Users,
    stat: 'Accounts',
  },
  {
    href: '/admin/roles',
    title: 'Role Security',
    description: 'Control permissions for every legal workflow area.',
    icon: Shield,
    stat: 'Permissions',
  },
  {
    href: '/admin/departments',
    title: 'Departments',
    description: 'Maintain departments, leaders, and operating units.',
    icon: Building2,
    stat: 'Structure',
  },
  {
    href: '/admin/workflows',
    title: 'Workflows',
    description: 'Configure CMS and LAHD approval processes.',
    icon: GitMerge,
    stat: 'Automation',
  },
  {
    href: '/admin/emails',
    title: 'Email Templates',
    description: 'Manage outbound templates for alerts and approvals.',
    icon: Mail,
    stat: 'Templates',
  },
  {
    href: '/admin/notifications',
    title: 'Notification Settings',
    description: 'Tune alert channels, priorities, and reminders.',
    icon: Bell,
    stat: 'Alerts',
  },
  {
    href: '/admin/settings',
    title: 'System Settings',
    description: 'Set defaults for security, sessions, and retention.',
    icon: Settings,
    stat: 'Defaults',
  },
  {
    href: '/admin/audit-logs',
    title: 'Audit Trail',
    description: 'Review recorded system activity and export evidence.',
    icon: List,
    stat: 'Compliance',
  },
];

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card card-sm border-l-4 border-l-accent">
          <div className="text-muted text-[11px] font-bold uppercase tracking-wider mb-2">Admin Areas</div>
          <div className="text-2xl font-bold font-mono text-primary">{adminSections.length}</div>
        </div>
        <div className="card card-sm border-l-4 border-l-success">
          <div className="text-muted text-[11px] font-bold uppercase tracking-wider mb-2">Access Control</div>
          <div className="text-2xl font-bold font-mono text-primary">Active</div>
        </div>
        <div className="card card-sm border-l-4 border-l-warning">
          <div className="text-muted text-[11px] font-bold uppercase tracking-wider mb-2">Alert Policy</div>
          <div className="text-2xl font-bold font-mono text-primary">On</div>
        </div>
        <div className="card card-sm border-l-4 border-l-info">
          <div className="text-muted text-[11px] font-bold uppercase tracking-wider mb-2">Audit Capture</div>
          <div className="text-2xl font-bold font-mono text-primary">Live</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {adminSections.map(section => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="card hover-card no-underline text-primary flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <span className="badge bg-bg-input text-muted">{section.stat}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold m-0">{section.title}</h2>
                <p className="text-sm text-muted mt-2">{section.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
