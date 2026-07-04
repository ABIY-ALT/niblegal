export type KnowledgeStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | 'EXPIRED';

export type ConfidentialityLevel = 'PUBLIC_INTERNAL' | 'RESTRICTED' | 'CONFIDENTIAL' | 'HIGHLY_CONFIDENTIAL';

export type KnowledgeApprovalStage = 'REVIEWER' | 'MANAGER';
export type ApprovalDecision = 'APPROVED' | 'REJECTED' | 'RETURNED' | 'DELEGATED';

export interface UserRef {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface KnowledgeCategoryOption {
  id: string;
  name: string;
  code: string | null;
  icon: string | null;
  parentId: string | null;
  documentCount?: number;
  children?: KnowledgeCategoryOption[];
}

export interface KnowledgeTagOption {
  id: string;
  name: string;
}

export interface KnowledgeDocumentListItem {
  id: string;
  documentNumber: string;
  title: string;
  status: KnowledgeStatus;
  confidentiality: ConfidentialityLevel;
  category: { id: string; name: string };
  tags: KnowledgeTagOption[];
  author: UserRef;
  currentVersion: number;
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocumentDetail extends KnowledgeDocumentListItem {
  description: string | null;
  content: string | null;
  keywords: string[];
  coverImageUrl: string | null;
  lawName: string | null;
  articleNumber: string | null;
  sectionNumber: string | null;
  effectiveDate: string | null;
  reviewDate: string | null;
  expiryDate: string | null;
  relatedContract: { id: string; contractNumber: string; title: string } | null;
  relatedLegalRequest: { id: string; requestNumber: string; subject: string } | null;
  relatedDepartment: { id: string; name: string } | null;
  relatedDocuments: { id: string; documentNumber: string; title: string; status: KnowledgeStatus }[];
  versions: KnowledgeVersionRecord[];
  attachments: KnowledgeAttachmentRecord[];
  comments: KnowledgeCommentRecord[];
  bookmarks: { id: string; userId: string; isPinned: boolean }[];
  downloadLogs: { id: string; user: UserRef; createdAt: string }[];
  history: KnowledgeHistoryRecord[];
  approvals: KnowledgeApprovalRecord[];
  auditLogs: AuditLogRecord[];
}

export interface KnowledgeVersionRecord {
  id: string;
  versionNumber: number;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  content: string | null;
  changes: string | null;
  uploadedBy: UserRef;
  approvedBy: UserRef | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface KnowledgeAttachmentRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: UserRef;
  createdAt: string;
}

export interface KnowledgeCommentRecord {
  id: string;
  text: string;
  isInternal: boolean;
  author: UserRef;
  createdAt: string;
}

export interface KnowledgeHistoryRecord {
  id: string;
  action: string;
  fromValue: string | null;
  toValue: string | null;
  description: string;
  actor: UserRef | null;
  createdAt: string;
}

export interface KnowledgeApprovalRecord {
  id: string;
  stage: KnowledgeApprovalStage;
  decision: ApprovalDecision;
  comments: string | null;
  decidedAt: string;
  approver: UserRef;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  details: string;
  ipAddress: string | null;
  user: UserRef;
  createdAt: string;
}
