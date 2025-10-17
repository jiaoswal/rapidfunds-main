// Database type definitions for RapidFunds

export interface User {
  id: string;
  orgId: string;
  email: string;
  password: string;
  fullName: string;
  jobTitle?: string;
  phoneNumber?: string;
  role: 'Admin' | 'Approver' | 'Finance' | 'Member' | 'Requester';
  department?: string;
  digestTime: string;
  notificationPreferences: any;
  isOnline: boolean;
  customFieldsData: any;
  emailVerified: boolean;
  createdAt: Date;
}

export interface Organization {
  orgId: string;              // stable unique id
  name: string;
  inviteCode: string;         // single-use or multi-use per org
  createdBy: string;          // userId of creator
  createdAt: Date;
  settings: {
    primaryColor: string;
    secondaryColor: string;
    defaultDigestTime: string;
    customFields: any[];
    checklistTemplates: any[];
    approvalRules: any[];
    domain?: string;
    logoUrl?: string;
  };
}

export interface FundingRequest {
  id: string;
  orgId: string;
  requesterId: string;
  approverId?: string;
  title: string;
  description: string;
  amount: number;
  category: 'Advance' | 'Reimbursement' | 'Vendor' | 'Budget' | 'Other';
  customCategory?: string;
  status: 'Open' | 'Needs Info' | 'Approved' | 'Rejected' | 'Closed';
  currentApprovalLevel: number;
  approvalChainId?: string;
  participants: string[];
  attachments: any[];
  checklist: any[];
  aiSummary?: string;
  slaDeadline?: Date;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueryMessage {
  id: string;
  requestId: string;
  userId?: string;
  messageType: 'text' | 'file' | 'system_event';
  content: string;
  attachments: any[];
  createdAt: Date;
}

export interface OrgChartNode {
  id: string;
  orgId: string;
  userId?: string;
  name: string;
  role: string;
  department?: string;
  parentId?: string;
  hierarchyLevelId?: string;
  position: { x: number; y: number };
  color: string;
  shape: 'rectangle' | 'circle' | 'rounded';
  level: number;
  budgetResponsibility?: string;
  email?: string;
  profilePicture?: string;
  isExpanded: boolean;
  isApproved: boolean;
  reportingManager?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InviteToken {
  id: string;
  orgId: string;
  token: string;
  role: 'Admin' | 'Approver' | 'Finance' | 'Member' | 'Requester';
  createdBy: string;
  expiresAt: Date;
  usedAt?: Date;
  usedBy?: string;
  createdAt: Date;
}

export interface ApprovalChain {
  id: string;
  orgId: string;
  name: string;
  department?: string;
  category?: string;
  isDefault: boolean;
  levels: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalHistory {
  id: string;
  requestId: string;
  level: number;
  approverId: string;
  action: 'Approved' | 'Rejected' | 'RequestInfo' | 'Overridden';
  comments?: string;
  isFastTrack: boolean;
  createdAt: Date;
}

// Org-scoped member document
export interface OrgMember {
  memberId: string;           // user id (stable)
  orgId: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  status: 'active' | 'pending' | 'removed';
  profile: {
    avatar?: string;
    title?: string;
    department?: string;
    jobTitle?: string;
    [key: string]: any;
  };
}

// Org-scoped request document
export interface OrgRequest {
  requestId: string;
  orgId: string;
  type: 'approval' | 'join' | 'change' | 'other';
  submittedBy: string;        // memberId
  submittedAt: Date;
  payload: any;               // arbitrary request data
  status: 'pending' | 'approved' | 'rejected';
  handledBy?: string;         // memberId
  handledAt?: Date;
}

// Org-scoped org chart document
export interface OrgChart {
  orgId: string;
  nodes: OrgChartNode[];
  updatedAt: Date;
}

// Audit log for org operations
export interface OrgAuditLog {
  id: string;
  orgId: string;
  action: string;             // 'create', 'update', 'delete', 'join', 'leave', etc.
  performedBy: string;        // memberId
  performedAt: Date;
  targetType: string;         // 'member', 'request', 'orgChart', etc.
  targetId?: string;
  details: any;               // action-specific data
}

// Helper function to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Database initialization and seeding functions
export async function seedDatabase(): Promise<void> {
  const { browserStorage } = await import('./browserStorage');
  await browserStorage.seedDatabase();
}

export async function clearDatabase(): Promise<void> {
  const { browserStorage } = await import('./browserStorage');
  await browserStorage.clearDatabase();
}


export async function migrateDatabase(): Promise<void> {
  // Migration logic for existing data
  const { browserStorage } = await import('./browserStorage');
  
  // The seedDatabase function now handles checking if data exists
  await browserStorage.seedDatabase();
}
