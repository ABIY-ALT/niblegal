export type LegalRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VALIDATED'
  | 'ASSIGNED'
  | 'DRAFTING'
  | 'REVIEW'
  | 'RETURNED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'DISPATCHED'
  | 'CLOSED'
  | 'ARCHIVED'
  | 'REJECTED'
  | 'ESCALATED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';

export type ConfidentialityLevel =
  | 'PUBLIC_INTERNAL'
  | 'RESTRICTED'
  | 'CONFIDENTIAL'
  | 'HIGHLY_CONFIDENTIAL';

export type RequestType =
  | 'LEGAL_OPINION'
  | 'CONTRACT_REVIEW_REQUEST'
  | 'COMPLIANCE_ADVICE'
  | 'DISPUTE_ADVICE'
  | 'GENERAL_INQUIRY'
  | 'OTHER';

export type ApprovalStage = 'PEER_REVIEW' | 'DIVISION_MANAGER' | 'LEGAL_DIRECTOR';
export type ApprovalDecision = 'APPROVED' | 'REJECTED' | 'RETURNED' | 'DELEGATED';
export type AssignmentAction = 'ASSIGNED' | 'REASSIGNED' | 'ESCALATED' | 'PRIORITY_CHANGED' | 'SLA_UPDATED';
export type LegalAttachmentCategory = 'SUPPORTING_DOCUMENT' | 'DISPATCH_DOCUMENT' | 'OTHER';

export interface UserRef {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface LegalRequestListItem {
  id: string;
  requestNumber: string;
  subject: string;
  status: LegalRequestStatus;
  priority: Priority;
  requestType: RequestType;
  category: { id: string; name: string };
  requestingDepartment: { id: string; name: string };
  requester: UserRef;
  assignee: UserRef | null;
  slaDeadline: string;
  slaBreached: boolean;
  createdAt: string;
  dueDate: string | null;
}

export interface LegalRequestDetail extends LegalRequestListItem {
  description: string;
  confidentiality: ConfidentialityLevel;
  slaHours: number;
  slaMetAt: string | null;
  requiresDirectorApproval: boolean;
  tags: string[];
  closedAt: string | null;
  archivedAt: string | null;
  relatedContractId: string | null;
  relatedContract: { id: string; contractNumber: string; title: string } | null;
  updatedAt: string;
  opinion: LegalOpinionData | null;
  assignments: LegalAssignmentRecord[];
  approvals: LegalApprovalRecord[];
  workflowSteps: LegalWorkflowStep[];
  comments: LegalCommentRecord[];
  attachments: LegalAttachmentRecord[];
  history: LegalHistoryRecord[];
  auditLogs: AuditLogRecord[];
}

export interface LegalOpinionData {
  id: string;
  currentVersion: number;
  content: string;
  referenceNumber: string | null;
  contentHash: string | null;
  digitallySignedBy: string | null;
  digitallySignedAt: string | null;
  dispatchedAt: string | null;
  versions: LegalOpinionVersionRecord[];
}

export interface LegalOpinionVersionRecord {
  id: string;
  versionNumber: number;
  content: string;
  changeNote: string | null;
  createdBy: UserRef;
  createdAt: string;
}

export interface LegalAssignmentRecord {
  id: string;
  action: AssignmentAction;
  notes: string | null;
  priority: Priority | null;
  slaHours: number | null;
  officer: UserRef | null;
  previousOfficer: UserRef | null;
  assignedBy: UserRef;
  createdAt: string;
}

export interface LegalApprovalRecord {
  id: string;
  stage: ApprovalStage;
  decision: ApprovalDecision;
  comments: string | null;
  decidedAt: string;
  approver: UserRef;
  delegatedTo: UserRef | null;
}

export interface LegalWorkflowStep {
  id: string;
  stage: LegalRequestStatus;
  enteredAt: string;
  exitedAt: string | null;
  notes: string | null;
  actor: UserRef | null;
}

export interface LegalCommentRecord {
  id: string;
  text: string;
  isInternal: boolean;
  author: UserRef;
  createdAt: string;
}

export interface LegalAttachmentRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  category: LegalAttachmentCategory;
  uploadedBy: UserRef;
  createdAt: string;
}

export interface LegalHistoryRecord {
  id: string;
  action: string;
  fromValue: string | null;
  toValue: string | null;
  description: string;
  actor: UserRef | null;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  details: string;
  ipAddress: string | null;
  user: UserRef;
  createdAt: string;
}

export interface LegalRequestCategoryOption {
  id: string;
  name: string;
  code: string;
  defaultSlaHours: number | null;
}
