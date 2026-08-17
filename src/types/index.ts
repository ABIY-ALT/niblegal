// ─── Shared ─────────────────────────────────────────────────────────────────

export type UserRole = 'admin_assistant' | 'legal_officer' | 'manager' | 'requesting_organ';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export type ActivityAction =
  | 'created' | 'submitted' | 'assigned' | 'reviewed' | 'approved'
  | 'rejected' | 'returned' | 'executed' | 'expired' | 'renewed'
  | 'dispatched' | 'uploaded' | 'commented' | 'escalated';

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: ActivityAction;
  details: string;
  module: 'CMS' | 'LAHD';
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}

// ─── CMS ─────────────────────────────────────────────────────────────────────

export type ContractStatus =
  | 'draft' | 'under_review' | 'pending_approval' | 'approved'
  | 'executed' | 'active' | 'expiring_soon' | 'expired' | 'terminated' | 'renewed';

export type ContractCategory = string;

export interface ContractVersion {
  version: number;
  uploadedBy: string;
  uploadedAt: string;
  notes: string;
  fileSize: string;
}

export interface Contract {
  id: string;                  // e.g. NIB-CMS-2026-00042
  title: string;
  category: ContractCategory;
  status: ContractStatus;
  counterparty: string;
  requestingDepartment: string;
  requestedBy: string;
  assignedOfficer?: string;
  reviewedBy?: string;
  approvedBy?: string;
  executedBy?: string;
  value?: number;
  currency?: string;
  startDate?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  tags: string[];
  versions: ContractVersion[];
  comments: Comment[];
  auditTrail: AuditEntry[];
  slaDeadline?: string;
  renewalAlertDays?: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  text: string;
  createdAt: string;
}

// ─── LAHD ────────────────────────────────────────────────────────────────────

export type AdvisoryStatus =
  | 'submitted' | 'assigned' | 'drafting' | 'under_review'
  | 'pending_approval' | 'approved' | 'dispatched' | 'closed';

export type AdvisoryCategory =
  | 'contract_review' | 'regulatory_compliance' | 'employment_law'
  | 'litigation' | 'corporate_governance' | 'banking_regulation'
  | 'intellectual_property' | 'general_advisory' | 'other';

export interface AdvisoryRequest {
  id: string;                  // e.g. NIB-LAHD-2026-00017
  title: string;
  category: AdvisoryCategory;
  status: AdvisoryStatus;
  requestingDepartment: string;
  requestedBy: string;
  assignedOfficer?: string;
  reviewedBy?: string;
  approvedBy?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  tags: string[];
  slaHours: number;
  slaDeadline: string;
  createdAt: string;
  updatedAt: string;
  legalOpinion?: string;
  attachments: string[];
  comments: Comment[];
  auditTrail: AuditEntry[];
}

// ─── Knowledge Repository ────────────────────────────────────────────────────

export type KnowledgeItemType = 'template' | 'legal_opinion' | 'legal_update' | 'article' | 'standard_clause';

export type KnowledgeItemCategory =
  | 'Contract Templates'
  | 'Legal Opinions'
  | 'Policies'
  | 'NBE Directives'
  | 'Research'
  | 'Articles';

export interface KnowledgeItem {
  id: string;
  title: string;
  type: KnowledgeItemType;
  category: KnowledgeItemCategory;
  uploadedBy: string;
  uploadedAt: string;
  tags: string[];
  downloads: number;
  description: string;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export interface CMSStats {
  totalContracts: number;
  active: number;
  expiringSoon: number;
  expired: number;
  pendingApproval: number;
  draftCount: number;
}

export interface LAHDStats {
  totalRequests: number;
  open: number;
  dispatched: number;
  slaBreached: number;
  avgTurnaroundHours: number;
  pendingApproval: number;
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType = 
  | 'email' 
  | 'workflow' 
  | 'expiry' 
  | 'sla';

export type NotificationStatus = 'unread' | 'read';

export interface Notification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  relatedId?: string;
  relatedModule?: 'CMS' | 'LAHD';
  createdAt: string;
  readAt?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// ─── Role Management ───────────────────────────────────────────────────────────

export type Permission =
  // Menu permissions
  | 'menu:dashboard'
  | 'menu:contracts'
  | 'menu:advisory'
  | 'menu:repository'
  | 'menu:expiry'
  | 'menu:notifications'
  | 'menu:reports'
  | 'menu:knowledge'
  | 'menu:users'
  | 'menu:roles'
  | 'menu:admin'
  // CMS (Contracts) permissions
  | 'cms:view'
  | 'cms:create'
  | 'cms:edit'
  | 'cms:delete'
  | 'cms:review'
  | 'cms:approve'
  | 'cms:execute'
  | 'cms:export'
  // LAHD (Legal Advisory) permissions
  | 'lahd:view'
  | 'lahd:create'
  | 'lahd:edit'
  | 'lahd:delete'
  | 'lahd:review'
  | 'lahd:approve'
  | 'lahd:dispatch'
  | 'lahd:export'
  // Knowledge repository permissions
  | 'knowledge:view'
  | 'knowledge:create'
  | 'knowledge:edit'
  | 'knowledge:delete'
  | 'knowledge:download'
  // Reports permissions
  | 'reports:view'
  | 'reports:export'
  // User management permissions
  | 'users:view'
  | 'users:create'
  | 'users:edit'
  | 'users:deactivate'
  | 'users:reset_password'
  // Role management permissions
  | 'roles:view'
  | 'roles:create'
  | 'roles:edit'
  | 'roles:delete';

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}
