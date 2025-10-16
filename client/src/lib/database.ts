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
  id: string;
  orgCode: string;
  name: string;
  domain?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  customFields: any[];
  checklistTemplates: any[];
  approvalRules: any[];
  defaultDigestTime: string;
  createdAt: Date;
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

export interface EmailVerification {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  verifiedAt?: Date;
  createdAt: Date;
}

export interface PasswordReset {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export async function migrateDatabase(): Promise<void> {
  // Migration logic for existing data
  const { browserStorage } = await import('./browserStorage');
  
  // Check if database is empty and seed if needed
  const orgs = await browserStorage.getOrganizationByCode('DEMO');
  if (!orgs) {
    await browserStorage.seedDatabase();
  }
}
