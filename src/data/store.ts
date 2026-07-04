import { format, addDays, subDays, addHours, subHours } from 'date-fns';
import type {
  User, Contract, AdvisoryRequest, KnowledgeItem,
  ContractStatus, AdvisoryStatus, AuditEntry, Comment, UserRole,
  ContractVersion, Notification, Permission, Role
} from '../types';

// ─── Local Storage Helpers ────────────────────────────────────────────────────

const STORAGE_KEY_CONTRACTS = 'nib-contracts';
const STORAGE_KEY_ADVISORY = 'nib-advisory';
const STORAGE_KEY_KNOWLEDGE = 'nib-knowledge';
const STORAGE_KEY_NOTIFICATIONS = 'nib-notifications';
const STORAGE_KEY_USERS = 'nib-users';
const STORAGE_KEY_ROLES = 'nib-roles';
const STORAGE_KEY_SEQS = 'nib-seqs';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    console.error('Error loading from localStorage', e);
    return defaultValue;
  }
}

function saveToStorage(key: string, value: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initialSeqs = { cmsSeq: 42, lahdSeq: 17, itemSeq: 100 };
const storedSeqs = loadFromStorage(STORAGE_KEY_SEQS, initialSeqs);
let cmsSeq = storedSeqs.cmsSeq;
let lahdSeq = storedSeqs.lahdSeq;
let itemSeq = storedSeqs.itemSeq;

function saveSeqs() {
  saveToStorage(STORAGE_KEY_SEQS, { cmsSeq, lahdSeq, itemSeq });
}

export function generateContractId(): string {
  cmsSeq += 1;
  saveSeqs();
  return `NIB-CMS-2026-${String(cmsSeq).padStart(5, '0')}`;
}

export function generateAdvisoryId(): string {
  lahdSeq += 1;
  saveSeqs();
  return `NIB-LAHD-2026-${String(lahdSeq).padStart(5, '0')}`;
}

export function generateKnowledgeId(): string {
  itemSeq += 1;
  saveSeqs();
  return `NIB-KR-${String(itemSeq).padStart(4, '0')}`;
}

export function generateAuditEntry(
  userId: string, userName: string, action: AuditEntry['action'],
  details: string, module: 'CMS' | 'LAHD',
  metadata: Pick<AuditEntry, 'oldValue' | 'newValue' | 'ipAddress'> = {}
): AuditEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userId, userName, action, details, module,
    ...metadata,
  };
}

export function generateComment(userId: string, userName: string, userRole: UserRole, text: string): Comment {
  return {
    id: crypto.randomUUID(),
    userId, userName, userRole, text,
    createdAt: new Date().toISOString(),
  };
}

const now = new Date();
const fmt = (d: Date) => d.toISOString();

// ─── Users ────────────────────────────────────────────────────────────────────

const defaultUsers: User[] = [
  { id: 'u001', name: 'Hana Tesfaye', role: 'admin_assistant', department: 'Legal', email: 'h.tesfaye@nibbank.et', isActive: true, createdAt: fmt(subDays(now, 365)) },
  { id: 'u002', name: 'Yonas Bekele', role: 'legal_officer', department: 'Legal', email: 'y.bekele@nibbank.et', isActive: true, createdAt: fmt(subDays(now, 300)) },
  { id: 'u003', name: 'Meron Alemu', role: 'legal_officer', department: 'Legal', email: 'm.alemu@nibbank.et', isActive: true, createdAt: fmt(subDays(now, 250)) },
  { id: 'u004', name: 'Dr. Tadesse Girma', role: 'manager', department: 'Legal', email: 't.girma@nibbank.et', isActive: true, createdAt: fmt(subDays(now, 400)) },
  { id: 'u005', name: 'Selamawit Wolde', role: 'requesting_organ', department: 'Operations', email: 's.wolde@nibbank.et', isActive: true, createdAt: fmt(subDays(now, 200)) },
  { id: 'u006', name: 'Biruk Haile', role: 'requesting_organ', department: 'Finance', email: 'b.haile@nibbank.et', isActive: true, createdAt: fmt(subDays(now, 180)) },
  { id: 'u007', name: 'Tigist Abebe', role: 'requesting_organ', department: 'IT', email: 't.abebe@nibbank.et', isActive: true, createdAt: fmt(subDays(now, 150)) },
  { id: 'u008', name: 'Admin System', role: 'admin_assistant', department: 'Legal', email: 'system@nibbank.et', isActive: true, createdAt: fmt(subDays(now, 500)) },
];

export let users: User[] = loadFromStorage(STORAGE_KEY_USERS, defaultUsers);
export const USERS: User[] = users; // For backward compatibility
export let currentUser: User = users[3]; // default: manager view

export function setCurrentUser(userId: string) {
  const u = users.find(u => u.id === userId);
  if (u) currentUser = u;
}

export function logout() {
  currentUser = users[0]; // Reset to default or handle null if typed. Since it's not null typed, use a default.
  if (typeof window !== 'undefined') {
    localStorage.removeItem('nib-currentUser');
  }
}

// User Mutations
export function addUser(user: Omit<User, 'id' | 'createdAt'>) {
  const newUser: User = {
    id: crypto.randomUUID(),
    ...user,
    createdAt: fmt(new Date()),
  };
  users = [newUser, ...users];
  saveToStorage(STORAGE_KEY_USERS, users);
}

export function updateUser(id: string, updates: Partial<User>) {
  users = users.map(u => u.id === id ? { ...u, ...updates } : u);
  if (currentUser.id === id) {
    currentUser = users.find(u => u.id === id)!;
  }
  saveToStorage(STORAGE_KEY_USERS, users);
}

export function toggleUserActive(id: string) {
  updateUser(id, { isActive: !users.find(u => u.id === id)?.isActive });
}

export function resetUserPassword(userId: string) {
  // In real app this would send email, here we just log a notification
  console.log(`Password reset requested for user ${userId}`);
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const seedVersions = (n: number): ContractVersion[] =>
  Array.from({ length: n }, (_, i) => ({
    version: i + 1,
    uploadedBy: 'Yonas Bekele',
    uploadedAt: subDays(now, n - i).toISOString(),
    notes: i === 0 ? 'Initial draft' : `Revision ${i}`,
    fileSize: `${(80 + i * 12).toFixed(0)} KB`,
  }));

const defaultContracts: Contract[] = [
  {
    id: 'NIB-CMS-2026-00001',
    title: 'Core Banking Software Maintenance Agreement',
    category: 'service_agreement',
    status: 'active',
    counterparty: 'Temenos AG',
    requestingDepartment: 'IT',
    requestedBy: 'Tigist Abebe',
    assignedOfficer: 'Yonas Bekele',
    reviewedBy: 'Meron Alemu',
    approvedBy: 'Dr. Tadesse Girma',
    executedBy: 'Dr. Tadesse Girma',
    value: 4500000, currency: 'ETB',
    startDate: fmt(subDays(now, 180)),
    expiryDate: fmt(addDays(now, 185)),
    createdAt: fmt(subDays(now, 200)),
    updatedAt: fmt(subDays(now, 10)),
    description: 'Annual maintenance and support contract for the core banking platform.',
    tags: ['IT', 'software', 'maintenance'],
    renewalAlertDays: 60,
    slaDeadline: fmt(addDays(now, 5)),
    versions: seedVersions(3),
    comments: [
      generateComment('u004', 'Dr. Tadesse Girma', 'manager', 'Approved after legal review. Ensure compliance with NBE directives.'),
    ],
    auditTrail: [
      generateAuditEntry('u005', 'Selamawit Wolde', 'submitted', 'Contract request submitted', 'CMS'),
      generateAuditEntry('u002', 'Yonas Bekele', 'assigned', 'Assigned to Legal Officer', 'CMS'),
      generateAuditEntry('u002', 'Yonas Bekele', 'reviewed', 'Initial draft reviewed', 'CMS'),
      generateAuditEntry('u004', 'Dr. Tadesse Girma', 'approved', 'Contract approved by Manager', 'CMS'),
      generateAuditEntry('u004', 'Dr. Tadesse Girma', 'executed', 'Contract executed and filed', 'CMS'),
    ],
  },
  {
    id: 'NIB-CMS-2026-00012',
    title: 'Head Office Lease Agreement – Bole Sub City',
    category: 'lease',
    status: 'expiring_soon',
    counterparty: 'Ethio Real Estate PLC',
    requestingDepartment: 'Facilities',
    requestedBy: 'Selamawit Wolde',
    assignedOfficer: 'Meron Alemu',
    reviewedBy: 'Meron Alemu',
    approvedBy: 'Dr. Tadesse Girma',
    executedBy: 'Dr. Tadesse Girma',
    value: 2800000, currency: 'ETB',
    startDate: fmt(subDays(now, 300)),
    expiryDate: fmt(addDays(now, 25)),
    createdAt: fmt(subDays(now, 320)),
    updatedAt: fmt(subDays(now, 5)),
    description: 'Office lease agreement for Nib Bank Head Office premises.',
    tags: ['lease', 'facilities', 'property'],
    renewalAlertDays: 45,
    versions: seedVersions(2),
    comments: [],
    auditTrail: [
      generateAuditEntry('u005', 'Selamawit Wolde', 'submitted', 'Lease renewal request submitted', 'CMS'),
      generateAuditEntry('u003', 'Meron Alemu', 'reviewed', 'Lease terms reviewed', 'CMS'),
      generateAuditEntry('u004', 'Dr. Tadesse Girma', 'approved', 'Approved by Director', 'CMS'),
    ],
  },
  {
    id: 'NIB-CMS-2026-00028',
    title: 'ATM Outsourcing and Management Contract',
    category: 'service_agreement',
    status: 'pending_approval',
    counterparty: 'NETS Ethiopia Ltd',
    requestingDepartment: 'Operations',
    requestedBy: 'Selamawit Wolde',
    assignedOfficer: 'Yonas Bekele',
    reviewedBy: 'Yonas Bekele',
    value: 6200000, currency: 'ETB',
    startDate: fmt(addDays(now, 15)),
    expiryDate: fmt(addDays(now, 380)),
    createdAt: fmt(subDays(now, 20)),
    updatedAt: fmt(subDays(now, 2)),
    description: 'Outsourcing of ATM network management and maintenance across branches.',
    tags: ['ATM', 'operations', 'outsourcing'],
    renewalAlertDays: 30,
    slaDeadline: fmt(addDays(now, 3)),
    versions: seedVersions(2),
    comments: [
      generateComment('u002', 'Yonas Bekele', 'legal_officer', 'Review completed. Recommend approval with minor amendments to clause 8.3.'),
    ],
    auditTrail: [
      generateAuditEntry('u005', 'Selamawit Wolde', 'submitted', 'ATM contract request submitted', 'CMS'),
      generateAuditEntry('u002', 'Yonas Bekele', 'assigned', 'Assigned for drafting', 'CMS'),
      generateAuditEntry('u002', 'Yonas Bekele', 'reviewed', 'Draft reviewed and submitted for approval', 'CMS'),
    ],
  },
  {
    id: 'NIB-CMS-2026-00035',
    title: 'Staff Canteen Services Agreement',
    category: 'service_agreement',
    status: 'draft',
    counterparty: 'Addis Catering PLC',
    requestingDepartment: 'HR',
    requestedBy: 'Biruk Haile',
    assignedOfficer: 'Meron Alemu',
    value: 480000, currency: 'ETB',
    createdAt: fmt(subDays(now, 5)),
    updatedAt: fmt(subDays(now, 1)),
    description: 'Provision of canteen and catering services for Head Office staff.',
    tags: ['HR', 'services', 'catering'],
    renewalAlertDays: 30,
    slaDeadline: fmt(addDays(now, 7)),
    versions: seedVersions(1),
    comments: [],
    auditTrail: [
      generateAuditEntry('u006', 'Biruk Haile', 'submitted', 'Canteen contract request submitted', 'CMS'),
      generateAuditEntry('u003', 'Meron Alemu', 'assigned', 'Assigned to Legal Officer', 'CMS'),
    ],
  },
  {
    id: 'NIB-CMS-2026-00039',
    title: 'NDA – FinTech Partnership Due Diligence',
    category: 'nda',
    status: 'executed',
    counterparty: 'M-Birr Technologies',
    requestingDepartment: 'Strategy',
    requestedBy: 'Tigist Abebe',
    assignedOfficer: 'Yonas Bekele',
    reviewedBy: 'Meron Alemu',
    approvedBy: 'Dr. Tadesse Girma',
    executedBy: 'Dr. Tadesse Girma',
    value: 0, currency: 'ETB',
    startDate: fmt(subDays(now, 10)),
    expiryDate: fmt(addDays(now, 355)),
    createdAt: fmt(subDays(now, 15)),
    updatedAt: fmt(subDays(now, 8)),
    description: 'Non-Disclosure Agreement covering proprietary financial technology information.',
    tags: ['NDA', 'FinTech', 'partnership'],
    renewalAlertDays: 30,
    versions: seedVersions(2),
    comments: [],
    auditTrail: [
      generateAuditEntry('u007', 'Tigist Abebe', 'submitted', 'NDA request submitted', 'CMS'),
      generateAuditEntry('u002', 'Yonas Bekele', 'reviewed', 'NDA reviewed and finalized', 'CMS'),
      generateAuditEntry('u004', 'Dr. Tadesse Girma', 'approved', 'NDA approved', 'CMS'),
      generateAuditEntry('u004', 'Dr. Tadesse Girma', 'executed', 'NDA executed', 'CMS'),
    ],
  },
  {
    id: 'NIB-CMS-2026-00041',
    title: 'Security Guard Services Contract – Branch Network',
    category: 'service_agreement',
    status: 'expired',
    counterparty: 'Shield Guard PLC',
    requestingDepartment: 'Security',
    requestedBy: 'Selamawit Wolde',
    assignedOfficer: 'Meron Alemu',
    value: 1200000, currency: 'ETB',
    startDate: fmt(subDays(now, 400)),
    expiryDate: fmt(subDays(now, 35)),
    createdAt: fmt(subDays(now, 420)),
    updatedAt: fmt(subDays(now, 35)),
    description: 'Security services for all Nib Bank branch locations.',
    tags: ['security', 'branches', 'services'],
    renewalAlertDays: 30,
    versions: seedVersions(2),
    comments: [],
    auditTrail: [
      generateAuditEntry('u003', 'Meron Alemu', 'assigned', 'Assigned for review', 'CMS'),
      generateAuditEntry('u004', 'Dr. Tadesse Girma', 'approved', 'Approved', 'CMS'),
      generateAuditEntry('u008', 'Admin System', 'expired', 'Contract has expired. Renewal required.', 'CMS'),
    ],
  },
];

const defaultAdvisoryRequests: AdvisoryRequest[] = [
  {
    id: 'NIB-LAHD-2026-00001',
    title: 'Legal Opinion on NBE Foreign Currency Directive',
    category: 'banking_regulation',
    status: 'dispatched',
    urgency: 'high',
    requestingDepartment: 'Finance',
    requestedBy: 'Biruk Haile',
    assignedOfficer: 'Yonas Bekele',
    reviewedBy: 'Yonas Bekele',
    approvedBy: 'Dr. Tadesse Girma',
    slaHours: 48,
    slaDeadline: fmt(subDays(now, 5)),
    createdAt: fmt(subDays(now, 8)),
    updatedAt: fmt(subDays(now, 4)),
    description: 'Request for legal interpretation of NBE Directive No. FXD/74/2024 regarding foreign currency purchase limits for importers.',
    legalOpinion: 'Based on our analysis of NBE Directive No. FXD/74/2024, the Bank must adhere to the maximum foreign currency allotment per transaction. Exceptions require Board-level authorization and NBE notification within 5 business days...',
    tags: ['NBE', 'forex', 'compliance', 'directive'],
    attachments: ['nbe_directive_74.pdf', 'analysis_brief.docx'],
    comments: [
      generateComment('u002', 'Yonas Bekele', 'legal_officer', 'Opinion drafted and submitted for manager approval.'),
      generateComment('u004', 'Dr. Tadesse Girma', 'manager', 'Reviewed and approved. Dispatch to Finance.'),
    ],
    auditTrail: [
      generateAuditEntry('u006', 'Biruk Haile', 'submitted', 'Advisory request submitted', 'LAHD'),
      generateAuditEntry('u001', 'Hana Tesfaye', 'assigned', 'Assigned to Yonas Bekele', 'LAHD'),
      generateAuditEntry('u002', 'Yonas Bekele', 'reviewed', 'Legal opinion drafted', 'LAHD'),
      generateAuditEntry('u004', 'Dr. Tadesse Girma', 'approved', 'Opinion approved', 'LAHD'),
      generateAuditEntry('u001', 'Hana Tesfaye', 'dispatched', 'Opinion dispatched to Finance Dept', 'LAHD'),
    ],
  },
  {
    id: 'NIB-LAHD-2026-00008',
    title: 'Advisory – Staff Misconduct Disciplinary Proceedings',
    category: 'employment_law',
    status: 'pending_approval',
    urgency: 'medium',
    requestingDepartment: 'HR',
    requestedBy: 'Selamawit Wolde',
    assignedOfficer: 'Meron Alemu',
    reviewedBy: 'Meron Alemu',
    slaHours: 72,
    slaDeadline: fmt(addDays(now, 1)),
    createdAt: fmt(subDays(now, 5)),
    updatedAt: fmt(subDays(now, 1)),
    description: 'Request for legal guidance on disciplinary process for a senior officer involved in unauthorized transaction approval.',
    legalOpinion: 'The disciplinary proceedings should follow the Bank\'s HR Manual Section 14 and the Labour Proclamation No. 1156/2019. A fact-finding committee must be formed within 5 working days...',
    tags: ['HR', 'disciplinary', 'employment', 'labour law'],
    attachments: ['hr_manual_extract.pdf'],
    comments: [
      generateComment('u003', 'Meron Alemu', 'legal_officer', 'Draft opinion ready for manager review.'),
    ],
    auditTrail: [
      generateAuditEntry('u005', 'Selamawit Wolde', 'submitted', 'Advisory request submitted', 'LAHD'),
      generateAuditEntry('u003', 'Meron Alemu', 'assigned', 'Assigned for drafting', 'LAHD'),
      generateAuditEntry('u003', 'Meron Alemu', 'reviewed', 'Draft submitted for approval', 'LAHD'),
    ],
  },
  {
    id: 'NIB-LAHD-2026-00014',
    title: 'Contract Review – Mobile Banking Third-Party Integration',
    category: 'contract_review',
    status: 'drafting',
    urgency: 'high',
    requestingDepartment: 'IT',
    requestedBy: 'Tigist Abebe',
    assignedOfficer: 'Yonas Bekele',
    slaHours: 48,
    slaDeadline: fmt(addDays(now, 2)),
    createdAt: fmt(subDays(now, 3)),
    updatedAt: fmt(subDays(now, 1)),
    description: 'Legal review of proposed API integration agreement with a third-party mobile banking solution provider.',
    tags: ['IT', 'mobile banking', 'API', 'third-party'],
    attachments: ['draft_api_agreement_v1.docx'],
    comments: [],
    auditTrail: [
      generateAuditEntry('u007', 'Tigist Abebe', 'submitted', 'Contract review request submitted', 'LAHD'),
      generateAuditEntry('u002', 'Yonas Bekele', 'assigned', 'Assigned to Yonas Bekele', 'LAHD'),
    ],
  },
  {
    id: 'NIB-LAHD-2026-00016',
    title: 'Regulatory Compliance Advisory – Anti-Money Laundering Policy Update',
    category: 'regulatory_compliance',
    status: 'submitted',
    urgency: 'critical',
    requestingDepartment: 'Compliance',
    requestedBy: 'Biruk Haile',
    slaHours: 24,
    slaDeadline: fmt(addHours(now, 20)),
    createdAt: fmt(subDays(now, 1)),
    updatedAt: fmt(subDays(now, 1)),
    description: 'Urgent advisory required on NBE AML directive updates effective next month. Impact assessment on current Bank AML policy needed.',
    tags: ['AML', 'compliance', 'NBE', 'regulatory', 'urgent'],
    attachments: ['nbe_aml_circular_2026.pdf'],
    comments: [],
    auditTrail: [
      generateAuditEntry('u006', 'Biruk Haile', 'submitted', 'Critical AML advisory request submitted', 'LAHD'),
    ],
  },
];

const defaultKnowledgeItems: KnowledgeItem[] = [
  // Contract Templates
  { id: 'NIB-KR-0001', title: 'Standard Service Agreement Template', type: 'template', category: 'Contract Templates', uploadedBy: 'Yonas Bekele', uploadedAt: fmt(subDays(now, 90)), tags: ['template', 'service', 'agreement'], downloads: 47, description: 'Standard template for service agreements with Ethiopian entities.' },
  { id: 'NIB-KR-0002', title: 'NDA Template – Bilateral', type: 'template', category: 'Contract Templates', uploadedBy: 'Meron Alemu', uploadedAt: fmt(subDays(now, 75)), tags: ['NDA', 'template', 'confidentiality'], downloads: 38, description: 'Bilateral NDA template compliant with Ethiopian contract law.' },
  { id: 'NIB-KR-0007', title: 'Loan Agreement Template', type: 'template', category: 'Contract Templates', uploadedBy: 'Dr. Tadesse Girma', uploadedAt: fmt(subDays(now, 100)), tags: ['loan', 'template', 'agreement'], downloads: 25, description: 'Standard loan agreement template for NIB Bank customers.' },
  
  // Legal Opinions
  { id: 'NIB-KR-0003', title: 'NBE Directive FXD/74/2024 – Legal Analysis', type: 'legal_opinion', category: 'Legal Opinions', uploadedBy: 'Yonas Bekele', uploadedAt: fmt(subDays(now, 20)), tags: ['NBE', 'forex', 'directive'], downloads: 29, description: 'Comprehensive legal analysis of the NBE foreign currency directive.' },
  { id: 'NIB-KR-0008', title: 'Legal Opinion on Data Privacy Compliance', type: 'legal_opinion', category: 'Legal Opinions', uploadedBy: 'Meron Alemu', uploadedAt: fmt(subDays(now, 30)), tags: ['privacy', 'compliance', 'data'], downloads: 18, description: 'Legal opinion on compliance with Ethiopian data protection regulations.' },
  
  // Policies
  { id: 'NIB-KR-0009', title: 'NIB Bank Anti-Money Laundering Policy', type: 'standard_clause', category: 'Policies', uploadedBy: 'Dr. Tadesse Girma', uploadedAt: fmt(subDays(now, 120)), tags: ['AML', 'policy', 'compliance'], downloads: 62, description: 'Official AML policy document for NIB Bank employees and partners.' },
  { id: 'NIB-KR-0010', title: 'Employee Code of Conduct', type: 'standard_clause', category: 'Policies', uploadedBy: 'Hana Tesfaye', uploadedAt: fmt(subDays(now, 150)), tags: ['HR', 'policy', 'conduct'], downloads: 89, description: 'Comprehensive code of conduct for all NIB Bank employees.' },
  
  // NBE Directives
  { id: 'NIB-KR-0011', title: 'NBE Directive No. FXD/75/2024 – Foreign Exchange', type: 'legal_update', category: 'NBE Directives', uploadedBy: 'Yonas Bekele', uploadedAt: fmt(subDays(now, 10)), tags: ['NBE', 'forex', 'directive'], downloads: 56, description: 'Full text and analysis of the latest NBE foreign exchange directive.' },
  { id: 'NIB-KR-0012', title: 'NBE Directive on Capital Adequacy', type: 'legal_update', category: 'NBE Directives', uploadedBy: 'Meron Alemu', uploadedAt: fmt(subDays(now, 60)), tags: ['NBE', 'capital', 'regulation'], downloads: 31, description: 'Guidance on compliance with NBE capital adequacy requirements.' },
  
  // Research
  { id: 'NIB-KR-0013', title: 'Research on Ethiopian Contract Law Trends', type: 'article', category: 'Research', uploadedBy: 'Dr. Tadesse Girma', uploadedAt: fmt(subDays(now, 40)), tags: ['research', 'contracts', 'law'], downloads: 14, description: 'Research report on recent trends in Ethiopian contract law and precedents.' },
  { id: 'NIB-KR-0014', title: 'Banking Sector Regulatory Outlook 2026', type: 'article', category: 'Research', uploadedBy: 'Yonas Bekele', uploadedAt: fmt(subDays(now, 5)), tags: ['research', 'banking', 'regulation'], downloads: 22, description: 'Research paper on upcoming regulatory changes in the Ethiopian banking sector.' },
  
  // Articles
  { id: 'NIB-KR-0004', title: 'Labour Proclamation 1156/2019 – HR Guidance', type: 'legal_update', category: 'Articles', uploadedBy: 'Meron Alemu', uploadedAt: fmt(subDays(now, 45)), tags: ['labour', 'HR', 'employment'], downloads: 52, description: 'Practical guidance note on applying the Ethiopian Labour Proclamation.' },
  { id: 'NIB-KR-0005', title: 'Procurement Contract Standard Clauses', type: 'standard_clause', category: 'Articles', uploadedBy: 'Dr. Tadesse Girma', uploadedAt: fmt(subDays(now, 60)), tags: ['procurement', 'clauses', 'standard'], downloads: 33, description: 'Bank-approved standard clauses for all procurement contracts.' },
  { id: 'NIB-KR-0006', title: 'AML Compliance Framework – Legal Perspective', type: 'article', category: 'Articles', uploadedBy: 'Yonas Bekele', uploadedAt: fmt(subDays(now, 15)), tags: ['AML', 'compliance', 'banking'], downloads: 41, description: 'Legal article on the Ethiopian AML framework and its banking implications.' },
];

const defaultNotifications: Notification[] = [
  { id: crypto.randomUUID(), type: 'expiry', status: 'unread', title: 'Contract Expiring Soon', message: 'Head Office Lease Agreement expires in 25 days.', relatedId: 'NIB-CMS-2026-00012', relatedModule: 'CMS', createdAt: fmt(subDays(now, 1)), priority: 'high' },
  { id: crypto.randomUUID(), type: 'sla', status: 'unread', title: 'SLA Breach Warning', message: 'Legal Advisory on Employee Disciplinary is overdue.', relatedId: 'NIB-LAHD-2026-00008', relatedModule: 'LAHD', createdAt: fmt(subHours(now, 5)), priority: 'critical' },
  { id: crypto.randomUUID(), type: 'workflow', status: 'unread', title: 'Contract Pending Approval', message: 'ATM Outsourcing Contract is waiting for your approval.', relatedId: 'NIB-CMS-2026-00028', relatedModule: 'CMS', createdAt: fmt(subDays(now, 2)), priority: 'medium' },
  { id: crypto.randomUUID(), type: 'email', status: 'unread', title: 'New Legal Request Received', message: 'Finance department submitted a new advisory request on AML directives.', relatedId: 'NIB-LAHD-2026-00016', relatedModule: 'LAHD', createdAt: fmt(subDays(now, 3)), priority: 'high' },
  { id: crypto.randomUUID(), type: 'workflow', status: 'read', title: 'Legal Opinion Dispatched', message: 'NBE Foreign Currency Directive opinion was sent to Finance.', relatedId: 'NIB-LAHD-2026-00001', relatedModule: 'LAHD', createdAt: fmt(subDays(now, 5)), readAt: fmt(subDays(now, 4)), priority: 'low' },
  { id: crypto.randomUUID(), type: 'expiry', status: 'read', title: 'Contract Expired', message: 'Security Guard Services Contract has expired.', relatedId: 'NIB-CMS-2026-00041', relatedModule: 'CMS', createdAt: fmt(subDays(now, 35)), readAt: fmt(subDays(now, 35)), priority: 'medium' },
];

// ─── State with Persistence ───────────────────────────────────────────────────

export let contracts: Contract[] = loadFromStorage(STORAGE_KEY_CONTRACTS, defaultContracts);
export let advisoryRequests: AdvisoryRequest[] = loadFromStorage(STORAGE_KEY_ADVISORY, defaultAdvisoryRequests);
export let knowledgeItems: KnowledgeItem[] = loadFromStorage(STORAGE_KEY_KNOWLEDGE, defaultKnowledgeItems);
export let notifications: Notification[] = loadFromStorage(STORAGE_KEY_NOTIFICATIONS, defaultNotifications);

// ─── Computed Stats ───────────────────────────────────────────────────────────

export function getCMSStats() {
  return {
    totalContracts: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    expiringSoon: contracts.filter(c => c.status === 'expiring_soon').length,
    expired: contracts.filter(c => c.status === 'expired').length,
    pendingApproval: contracts.filter(c => c.status === 'pending_approval').length,
    draftCount: contracts.filter(c => c.status === 'draft').length,
  };
}

export function getLAHDStats() {
  const open = advisoryRequests.filter(r => !['dispatched', 'closed'].includes(r.status)).length;
  const dispatched = advisoryRequests.filter(r => r.status === 'dispatched').length;
  const now2 = new Date();
  const slaBreached = advisoryRequests.filter(r =>
    !['dispatched', 'closed'].includes(r.status) && new Date(r.slaDeadline) < now2
  ).length;
  return {
    totalRequests: advisoryRequests.length,
    open,
    dispatched,
    slaBreached,
    avgTurnaroundHours: 38,
    pendingApproval: advisoryRequests.filter(r => r.status === 'pending_approval').length,
  };
}

// ─── Mutations with Persistence ────────────────────────────────────────────────

export function addContract(contract: Contract) {
  contracts = [contract, ...contracts];
  saveToStorage(STORAGE_KEY_CONTRACTS, contracts);
}

export function updateContract(id: string, updates: Partial<Contract>) {
  contracts = contracts.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c);
  saveToStorage(STORAGE_KEY_CONTRACTS, contracts);
}

export function advanceContractStatus(id: string, newStatus: ContractStatus, actor: User) {
  const actionMap: Record<ContractStatus, AuditEntry['action']> = {
    draft: 'created', under_review: 'reviewed', pending_approval: 'submitted',
    approved: 'approved', executed: 'executed', active: 'executed',
    expiring_soon: 'escalated', expired: 'expired', terminated: 'rejected', renewed: 'renewed',
  };
  contracts = contracts.map(c => {
    if (c.id !== id) return c;
    const entry = generateAuditEntry(actor.id, actor.name, actionMap[newStatus] ?? 'commented', `Status changed to ${newStatus}`, 'CMS');
    return { ...c, status: newStatus, updatedAt: new Date().toISOString(), auditTrail: [...c.auditTrail, entry] };
  });
  saveToStorage(STORAGE_KEY_CONTRACTS, contracts);
}

export function addContractComment(id: string, comment: Comment) {
  contracts = contracts.map(c =>
    c.id === id ? { ...c, comments: [...c.comments, comment] } : c
  );
  saveToStorage(STORAGE_KEY_CONTRACTS, contracts);
}

export function addAdvisoryRequest(req: AdvisoryRequest) {
  advisoryRequests = [req, ...advisoryRequests];
  saveToStorage(STORAGE_KEY_ADVISORY, advisoryRequests);
}

export function updateAdvisoryRequest(id: string, updates: Partial<AdvisoryRequest>) {
  advisoryRequests = advisoryRequests.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r);
  saveToStorage(STORAGE_KEY_ADVISORY, advisoryRequests);
}

export function advanceAdvisoryStatus(id: string, newStatus: AdvisoryStatus, actor: User) {
  const actionMap: Record<AdvisoryStatus, AuditEntry['action']> = {
    submitted: 'submitted', assigned: 'assigned', drafting: 'reviewed',
    under_review: 'reviewed', pending_approval: 'submitted', approved: 'approved',
    dispatched: 'dispatched', closed: 'dispatched',
  };
  advisoryRequests = advisoryRequests.map(r => {
    if (r.id !== id) return r;
    const entry = generateAuditEntry(actor.id, actor.name, actionMap[newStatus] ?? 'commented', `Status changed to ${newStatus}`, 'LAHD');
    return { ...r, status: newStatus, updatedAt: new Date().toISOString(), auditTrail: [...r.auditTrail, entry] };
  });
  saveToStorage(STORAGE_KEY_ADVISORY, advisoryRequests);
}

export function addAdvisoryComment(id: string, comment: Comment) {
  advisoryRequests = advisoryRequests.map(r =>
    r.id === id ? { ...r, comments: [...r.comments, comment] } : r
  );
  saveToStorage(STORAGE_KEY_ADVISORY, advisoryRequests);
}

export function addKnowledgeItem(item: KnowledgeItem) {
  knowledgeItems = [item, ...knowledgeItems];
  saveToStorage(STORAGE_KEY_KNOWLEDGE, knowledgeItems);
}

export function updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>) {
  knowledgeItems = knowledgeItems.map(item =>
    item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
  );
  saveToStorage(STORAGE_KEY_KNOWLEDGE, knowledgeItems);
}

export function getAllAuditTrail(): AuditEntry[] {
  const cmsEntries = contracts.flatMap(c => c.auditTrail);
  const lahdEntries = advisoryRequests.flatMap(r => r.auditTrail);
  return [...cmsEntries, ...lahdEntries].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

// ─── Notification Mutations ───────────────────────────────────────────────────

export function markNotificationAsRead(id: string) {
  notifications = notifications.map(n => 
    n.id === id ? { ...n, status: 'read', readAt: new Date().toISOString() } : n
  );
  saveToStorage(STORAGE_KEY_NOTIFICATIONS, notifications);
}

export function markAllNotificationsAsRead() {
  notifications = notifications.map(n => 
    n.status === 'unread' ? { ...n, status: 'read', readAt: new Date().toISOString() } : n
  );
  saveToStorage(STORAGE_KEY_NOTIFICATIONS, notifications);
}

export function addNotification(notification: Notification) {
  notifications = [notification, ...notifications];
  saveToStorage(STORAGE_KEY_NOTIFICATIONS, notifications);
}

export function deleteNotification(id: string) {
  notifications = notifications.filter(n => n.id !== id);
  saveToStorage(STORAGE_KEY_NOTIFICATIONS, notifications);
}

// ─── Role Management ─────────────────────────────────────────────────────────

const defaultRoles: Role[] = [
  {
    id: 'role_admin_assistant',
    name: 'Admin Assistant',
    description: 'Supports legal operations with document management and basic tasks',
    permissions: [
      'menu:dashboard', 'menu:contracts', 'menu:advisory', 'menu:repository', 'menu:expiry', 'menu:notifications',
      'cms:view', 'cms:create', 'cms:edit', 'cms:export',
      'lahd:view', 'lahd:create', 'lahd:edit', 'lahd:export',
      'knowledge:view', 'knowledge:download'
    ],
    isSystem: true,
    createdAt: fmt(subDays(now, 500)),
    updatedAt: fmt(subDays(now, 500)),
  },
  {
    id: 'role_legal_officer',
    name: 'Legal Officer',
    description: 'Reviews contracts, drafts legal opinions, and manages cases',
    permissions: [
      'menu:dashboard', 'menu:contracts', 'menu:advisory', 'menu:repository', 'menu:expiry', 'menu:notifications', 'menu:knowledge',
      'cms:view', 'cms:create', 'cms:edit', 'cms:review', 'cms:execute', 'cms:export',
      'lahd:view', 'lahd:create', 'lahd:edit', 'lahd:review', 'lahd:dispatch', 'lahd:export',
      'knowledge:view', 'knowledge:create', 'knowledge:edit', 'knowledge:download'
    ],
    isSystem: true,
    createdAt: fmt(subDays(now, 500)),
    updatedAt: fmt(subDays(now, 500)),
  },
  {
    id: 'role_manager',
    name: 'Manager / Director',
    description: 'Approves contracts, reviews reports, and manages the legal team',
    permissions: [
      'menu:dashboard', 'menu:contracts', 'menu:advisory', 'menu:repository', 'menu:expiry', 'menu:notifications', 'menu:reports', 'menu:knowledge', 'menu:users', 'menu:roles',
      'cms:view', 'cms:create', 'cms:edit', 'cms:review', 'cms:approve', 'cms:execute', 'cms:export',
      'lahd:view', 'lahd:create', 'lahd:edit', 'lahd:review', 'lahd:approve', 'lahd:dispatch', 'lahd:export',
      'knowledge:view', 'knowledge:create', 'knowledge:edit', 'knowledge:download',
      'reports:view', 'reports:export',
      'users:view',
      'roles:view'
    ],
    isSystem: true,
    createdAt: fmt(subDays(now, 500)),
    updatedAt: fmt(subDays(now, 500)),
  },
  {
    id: 'role_requesting_organ',
    name: 'Requesting Department',
    description: 'Submits contract and legal advice requests',
    permissions: [
      'menu:dashboard', 'menu:contracts', 'menu:advisory', 'menu:repository', 'menu:notifications',
      'cms:view', 'cms:create',
      'lahd:view', 'lahd:create',
      'knowledge:view', 'knowledge:download'
    ],
    isSystem: true,
    createdAt: fmt(subDays(now, 500)),
    updatedAt: fmt(subDays(now, 500)),
  }
];

export let roles: Role[] = loadFromStorage(STORAGE_KEY_ROLES, defaultRoles);

export function addRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>) {
  const newRole: Role = {
    id: crypto.randomUUID(),
    ...role,
    isSystem: false,
    createdAt: fmt(new Date()),
    updatedAt: fmt(new Date()),
  };
  roles = [...roles, newRole];
  saveToStorage(STORAGE_KEY_ROLES, roles);
}

export function updateRole(id: string, updates: Partial<Role>) {
  roles = roles.map(r => r.id === id ? { ...r, ...updates, updatedAt: fmt(new Date()) } : r);
  saveToStorage(STORAGE_KEY_ROLES, roles);
}

export function deleteRole(id: string) {
  roles = roles.filter(r => r.id !== id);
  saveToStorage(STORAGE_KEY_ROLES, roles);
}
