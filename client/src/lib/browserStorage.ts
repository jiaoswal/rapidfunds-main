import Dexie, { Table } from 'dexie';
import { User, Organization, FundingRequest, QueryMessage, OrgChartNode, InviteToken, ApprovalChain, ApprovalHistory, OrgMember, OrgRequest, OrgChart, OrgAuditLog } from './database';

// Define the database schema
export class BrowserStorage extends Dexie {
  users!: Table<User>;
  organizations!: Table<Organization>;
  fundingRequests!: Table<FundingRequest>;
  queryMessages!: Table<QueryMessage>;
  orgChartNodes!: Table<OrgChartNode>;
  inviteTokens!: Table<InviteToken>;
  approvalChains!: Table<ApprovalChain>;
  approvalHistory!: Table<ApprovalHistory>;
  // New org-scoped tables
  orgMembers!: Table<OrgMember>;
  orgRequests!: Table<OrgRequest>;
  orgCharts!: Table<OrgChart>;
  orgAuditLogs!: Table<OrgAuditLog>;

  constructor() {
    super('RapidFundsDB');
    this.version(2).stores({
      users: '++id, orgId, email, fullName, role, department, createdAt',
      organizations: '++orgId, name, inviteCode, createdBy, createdAt',
      fundingRequests: '++id, orgId, requesterId, approverId, title, status, amount, category, createdAt',
      queryMessages: '++id, requestId, userId, messageType, content, createdAt',
      orgChartNodes: '++id, orgId, userId, name, role, department, parentId, level, createdAt',
      inviteTokens: '++id, orgId, token, role, createdBy, expiresAt, usedAt',
      approvalChains: '++id, orgId, name, department, category, isDefault, createdAt',
      approvalHistory: '++id, requestId, level, approverId, action, comments, createdAt',
      // New org-scoped tables
      orgMembers: '++memberId, orgId, email, fullName, role, status, joinedAt',
      orgRequests: '++requestId, orgId, type, submittedBy, status, submittedAt',
      orgCharts: '++orgId, updatedAt',
      orgAuditLogs: '++id, orgId, action, performedBy, performedAt, targetType, targetId'
    });
  }
}

// Create database instance
export const db = new BrowserStorage();

// Storage implementation using IndexedDB
export class BrowserStorageImpl {
  // User operations
  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    await db.users.add(newUser);
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    return await db.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    console.log('🔍 Searching for user by email:', email);
    const user = await db.users.where('email').equals(email).first() || null;
    console.log('👤 Database result:', user ? { id: user.id, email: user.email, role: user.role } : 'null');
    return user;
  }

  async getUsersByOrgId(orgId: string): Promise<User[]> {
    return await db.users.where('orgId').equals(orgId).toArray();
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await db.users.update(id, updates);
    const updated = await db.users.get(id);
    if (!updated) throw new Error('User not found');
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.users.delete(id);
  }

  // Alias methods for compatibility
  async getUser(id: string): Promise<User | null> {
    return this.getUserById(id);
  }

  async getOrganization(id: string): Promise<Organization | null> {
    return this.getOrganizationById(id);
  }

  async getUserByEmailAndOrgCode(email: string, orgId: string): Promise<User | null> {
    return await db.users.where('email').equals(email).and(user => user.orgId === orgId).first() || null;
  }

  async markInviteTokenAsUsed(tokenId: string, userId: string): Promise<void> {
    await db.inviteTokens.update(tokenId, { usedAt: new Date(), usedBy: userId });
  }

  async createEmailVerification(data: { userId: string; email: string; token: string; expiresAt: Date }): Promise<void> {
    // For now, we'll store this in localStorage since we don't have an email_verifications table
    const verification = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date()
    };
    localStorage.setItem(`email_verification_${data.token}`, JSON.stringify(verification));
  }

  async getEmailVerificationByToken(token: string): Promise<any> {
    const stored = localStorage.getItem(`email_verification_${token}`);
    return stored ? JSON.parse(stored) : null;
  }

  async markEmailAsVerified(token: string): Promise<void> {
    const stored = localStorage.getItem(`email_verification_${token}`);
    if (stored) {
      const verification = JSON.parse(stored);
      verification.verifiedAt = new Date();
      localStorage.setItem(`email_verification_${token}`, JSON.stringify(verification));
    }
  }

  async createPasswordReset(data: { userId: string; email: string; token: string; expiresAt: Date }): Promise<void> {
    // For now, we'll store this in localStorage since we don't have a password_resets table
    const reset = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date()
    };
    localStorage.setItem(`password_reset_${data.token}`, JSON.stringify(reset));
  }

  async getPasswordResetByToken(token: string): Promise<any> {
    const stored = localStorage.getItem(`password_reset_${token}`);
    return stored ? JSON.parse(stored) : null;
  }

  async markPasswordResetAsUsed(token: string): Promise<void> {
    const stored = localStorage.getItem(`password_reset_${token}`);
    if (stored) {
      const reset = JSON.parse(stored);
      reset.usedAt = new Date();
      localStorage.setItem(`password_reset_${token}`, JSON.stringify(reset));
    }
  }

  // Additional methods needed by browserApi
  async getUsersByOrg(orgId: string): Promise<User[]> {
    return this.getUsersByOrgId(orgId);
  }

  async getUsersByOrgAndRole(orgId: string, role: string): Promise<User[]> {
    return await db.users.where('orgId').equals(orgId).and(user => user.role === role).toArray();
  }

  async getFundingRequestsByOrg(orgId: string): Promise<FundingRequest[]> {
    return this.getFundingRequestsByOrgId(orgId);
  }

  async getFundingRequest(id: string): Promise<FundingRequest | null> {
    return this.getFundingRequestById(id);
  }

  async getMessagesByRequest(requestId: string): Promise<QueryMessage[]> {
    return this.getQueryMessagesByRequestId(requestId);
  }

  async getInviteTokensByOrg(orgId: string): Promise<InviteToken[]> {
    return await db.inviteTokens.where('orgId').equals(orgId).toArray();
  }

  async getOrgChartNodesByOrg(orgId: string): Promise<OrgChartNode[]> {
    return this.getOrgChartNodesByOrgId(orgId);
  }

  async getDefaultApprovalChain(orgId: string): Promise<ApprovalChain | null> {
    return await db.approvalChains.where('orgId').equals(orgId).and(chain => chain.isDefault === true).first() || null;
  }

  // Organization operations
  async createOrganization(org: Omit<Organization, 'orgId' | 'createdAt'>): Promise<Organization> {
    const newOrg: Organization = {
      ...org,
      orgId: crypto.randomUUID(),
      createdAt: new Date()
    };
    await db.organizations.add(newOrg);
    return newOrg;
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    return await db.organizations.get(id) || null;
  }

  async getOrganizationByCode(orgCode: string): Promise<Organization | null> {
    return await db.organizations.where('inviteCode').equals(orgCode).first() || null;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return await db.organizations.toArray();
  }

  async getAllUsers(): Promise<User[]> {
    return await db.users.toArray();
  }

  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<Organization> {
    await db.organizations.update(orgId, updates);
    const updated = await db.organizations.get(orgId);
    if (!updated) throw new Error('Organization not found');
    return updated;
  }

  async deleteOrganization(id: string): Promise<void> {
    await db.organizations.delete(id);
  }

  // Org Chart operations
  async createOrgChartNode(node: Omit<OrgChartNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrgChartNode> {
    const newNode: OrgChartNode = {
      ...node,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.orgChartNodes.add(newNode);
    return newNode;
  }

  async getOrgChartNodesByOrgId(orgId: string): Promise<OrgChartNode[]> {
    return await db.orgChartNodes.where('orgId').equals(orgId).toArray();
  }

  async updateOrgChartNode(id: string, updates: Partial<OrgChartNode>): Promise<OrgChartNode> {
    const updateData = { ...updates, updatedAt: new Date() };
    await db.orgChartNodes.update(id, updateData);
    const updated = await db.orgChartNodes.get(id);
    if (!updated) throw new Error('Org chart node not found');
    return updated;
  }

  async deleteOrgChartNode(id: string): Promise<void> {
    await db.orgChartNodes.delete(id);
  }

  async getOrgChartNode(id: string): Promise<OrgChartNode | null> {
    return await db.orgChartNodes.get(id) || null;
  }

  // Funding Request operations
  async createFundingRequest(request: Omit<FundingRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<FundingRequest> {
    const newRequest: FundingRequest = {
      ...request,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.fundingRequests.add(newRequest);
    return newRequest;
  }

  async getFundingRequestById(id: string): Promise<FundingRequest | null> {
    return await db.fundingRequests.get(id) || null;
  }

  async getFundingRequestsByOrgId(orgId: string): Promise<FundingRequest[]> {
    return await db.fundingRequests.where('orgId').equals(orgId).toArray();
  }

  async updateFundingRequest(id: string, updates: Partial<FundingRequest>): Promise<FundingRequest> {
    const updateData = { ...updates, updatedAt: new Date() };
    await db.fundingRequests.update(id, updateData);
    const updated = await db.fundingRequests.get(id);
    if (!updated) throw new Error('Funding request not found');
    return updated;
  }

  async deleteFundingRequest(id: string): Promise<void> {
    await db.fundingRequests.delete(id);
  }

  // Query Message operations
  async createQueryMessage(message: Omit<QueryMessage, 'id' | 'createdAt'>): Promise<QueryMessage> {
    const newMessage: QueryMessage = {
      ...message,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    await db.queryMessages.add(newMessage);
    return newMessage;
  }

  async getQueryMessagesByRequestId(requestId: string): Promise<QueryMessage[]> {
    return await db.queryMessages.where('requestId').equals(requestId).toArray();
  }

  // Invite Token operations
  async createInviteToken(token: Omit<InviteToken, 'id' | 'createdAt'>): Promise<InviteToken> {
    const newToken: InviteToken = {
      ...token,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    await db.inviteTokens.add(newToken);
    return newToken;
  }

  async getInviteTokenByToken(token: string): Promise<InviteToken | null> {
    return await db.inviteTokens.where('token').equals(token).first() || null;
  }

  async updateInviteToken(id: string, updates: Partial<InviteToken>): Promise<InviteToken> {
    await db.inviteTokens.update(id, updates);
    const updated = await db.inviteTokens.get(id);
    if (!updated) throw new Error('Invite token not found');
    return updated;
  }

  async deleteInviteToken(id: string): Promise<void> {
    await db.inviteTokens.delete(id);
  }

  // Approval Chain operations
  async createApprovalChain(chain: Omit<ApprovalChain, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApprovalChain> {
    const newChain: ApprovalChain = {
      ...chain,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.approvalChains.add(newChain);
    return newChain;
  }

  async getApprovalChainsByOrgId(orgId: string): Promise<ApprovalChain[]> {
    return await db.approvalChains.where('orgId').equals(orgId).toArray();
  }

  async updateApprovalChain(id: string, updates: Partial<ApprovalChain>): Promise<ApprovalChain> {
    const updateData = { ...updates, updatedAt: new Date() };
    await db.approvalChains.update(id, updateData);
    const updated = await db.approvalChains.get(id);
    if (!updated) throw new Error('Approval chain not found');
    return updated;
  }

  async deleteApprovalChain(id: string): Promise<void> {
    await db.approvalChains.delete(id);
  }

  // Approval History operations
  async createApprovalHistory(history: Omit<ApprovalHistory, 'id' | 'createdAt'>): Promise<ApprovalHistory> {
    const newHistory: ApprovalHistory = {
      ...history,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    await db.approvalHistory.add(newHistory);
    return newHistory;
  }

  async getApprovalHistoryByRequestId(requestId: string): Promise<ApprovalHistory[]> {
    return await db.approvalHistory.where('requestId').equals(requestId).toArray();
  }

  // ===== NEW ORG-SCOPED OPERATIONS =====

  // Org Member operations
  async createOrgMember(member: Omit<OrgMember, 'memberId'>): Promise<OrgMember> {
    const newMember: OrgMember = {
      ...member,
      memberId: crypto.randomUUID()
    };
    await db.orgMembers.add(newMember);
    await this.logAudit(member.orgId, 'create', 'system', 'member', newMember.memberId, { action: 'member_created', member });
    return newMember;
  }

  async getOrgMembers(orgId: string): Promise<OrgMember[]> {
    return await db.orgMembers.where('orgId').equals(orgId).toArray();
  }

  async getOrgMember(orgId: string, memberId: string): Promise<OrgMember | null> {
    return await db.orgMembers.where(['orgId', 'memberId']).equals([orgId, memberId]).first() || null;
  }

  async updateOrgMember(orgId: string, memberId: string, updates: Partial<OrgMember>): Promise<OrgMember> {
    const updated = await db.orgMembers.where(['orgId', 'memberId']).equals([orgId, memberId]).modify(updates);
    const member = await this.getOrgMember(orgId, memberId);
    if (!member) throw new Error('Member not found');
    await this.logAudit(orgId, 'update', 'system', 'member', memberId, { action: 'member_updated', updates });
    return member;
  }

  async deleteOrgMember(orgId: string, memberId: string): Promise<void> {
    await db.orgMembers.where(['orgId', 'memberId']).equals([orgId, memberId]).delete();
    await this.logAudit(orgId, 'delete', 'system', 'member', memberId, { action: 'member_deleted' });
  }

  // Org Request operations
  async createOrgRequest(request: Omit<OrgRequest, 'requestId'>): Promise<OrgRequest> {
    const newRequest: OrgRequest = {
      ...request,
      requestId: crypto.randomUUID()
    };
    await db.orgRequests.add(newRequest);
    await this.logAudit(request.orgId, 'create', request.submittedBy, 'request', newRequest.requestId, { action: 'request_created', request });
    return newRequest;
  }

  async getOrgRequests(orgId: string, status?: string): Promise<OrgRequest[]> {
    let query = db.orgRequests.where('orgId').equals(orgId);
    if (status) {
      query = query.and(req => req.status === status);
    }
    return await query.toArray();
  }

  async getOrgRequest(orgId: string, requestId: string): Promise<OrgRequest | null> {
    return await db.orgRequests.where(['orgId', 'requestId']).equals([orgId, requestId]).first() || null;
  }

  async updateOrgRequest(orgId: string, requestId: string, updates: Partial<OrgRequest>): Promise<OrgRequest> {
    await db.orgRequests.where(['orgId', 'requestId']).equals([orgId, requestId]).modify(updates);
    const request = await this.getOrgRequest(orgId, requestId);
    if (!request) throw new Error('Request not found');
    await this.logAudit(orgId, 'update', updates.handledBy || 'system', 'request', requestId, { action: 'request_updated', updates });
    return request;
  }

  // Org Chart operations
  async getOrgChart(orgId: string): Promise<OrgChart | null> {
    return await db.orgCharts.get(orgId) || null;
  }

  async saveOrgChart(orgChart: OrgChart): Promise<OrgChart> {
    const updatedChart = { ...orgChart, updatedAt: new Date() };
    await db.orgCharts.put(updatedChart);
    await this.logAudit(orgChart.orgId, 'update', 'system', 'orgChart', orgChart.orgId, { action: 'org_chart_updated', chart: updatedChart });
    return updatedChart;
  }

  // Audit logging
  async logAudit(orgId: string, action: string, performedBy: string, targetType: string, targetId?: string, details?: any): Promise<void> {
    const auditLog: OrgAuditLog = {
      id: crypto.randomUUID(),
      orgId,
      action,
      performedBy,
      performedAt: new Date(),
      targetType,
      targetId,
      details
    };
    await db.orgAuditLogs.add(auditLog);
  }

  async getAuditLogs(orgId: string, limit: number = 100): Promise<OrgAuditLog[]> {
    return await db.orgAuditLogs
      .where('orgId')
      .equals(orgId)
      .reverse()
      .limit(limit)
      .toArray();
  }

  // Utility functions
  async clearDatabase(): Promise<void> {
    await db.transaction('rw', [
      db.users,
      db.organizations,
      db.fundingRequests,
      db.queryMessages,
      db.orgChartNodes,
      db.inviteTokens,
      db.approvalChains,
      db.approvalHistory,
      db.orgMembers,
      db.orgRequests,
      db.orgCharts,
      db.orgAuditLogs
    ], async () => {
      await db.users.clear();
      await db.organizations.clear();
      await db.fundingRequests.clear();
      await db.queryMessages.clear();
      await db.orgChartNodes.clear();
      await db.inviteTokens.clear();
      await db.approvalChains.clear();
      await db.approvalHistory.clear();
      await db.orgMembers.clear();
      await db.orgRequests.clear();
      await db.orgCharts.clear();
      await db.orgAuditLogs.clear();
    });
  }

  async seedDatabase(): Promise<void> {
    console.log('🌱 Starting database seeding...');
    
    // Check if database already has data
    const existingOrgs = await db.organizations.count();
    const existingUsers = await db.users.count();
    
    if (existingOrgs > 0 || existingUsers > 0) {
      console.log('📊 Database already has data, skipping seeding');
      return;
    }
    
    // Don't create demo data automatically - let users create their own organizations
    console.log('📊 No demo data created - users will create their own organizations');
    return;
    
    // Import hashPassword function
    const { hashPassword } = await import('./browserAuth');
    
    // Create demo organization
    const demoOrg = await this.createOrganization({
      name: 'Demo Organization',
      inviteCode: 'DEMO',
      createdBy: 'temp',
      settings: {
        primaryColor: '#0EA5E9',
        secondaryColor: '#10B981',
        customFields: [],
        checklistTemplates: [],
        approvalRules: [],
        defaultDigestTime: '09:00'
      }
    });
    console.log('🏢 Demo organization created:', { id: demoOrg.orgId, code: demoOrg.inviteCode });

    // Create demo admin user
    const hashedPassword = await hashPassword('demo123');
    console.log('🔒 Demo password hashed:', hashedPassword.substring(0, 10) + '...');
    
    const demoAdmin = await this.createUser({
      orgId: demoOrg.orgId,
      email: 'admin@demo.com',
      password: hashedPassword,
      fullName: 'Demo Admin',
      role: 'Admin',
      department: 'Administration',
      digestTime: '09:00',
      notificationPreferences: { push: true, email: true },
      isOnline: false,
      customFieldsData: {},
      emailVerified: true
    });
    console.log('👤 Demo admin user created:', { id: demoAdmin.id, email: demoAdmin.email });

    // Create additional demo users
    const kavyaPassword = await hashPassword('jiaoswal');
    const kavyaUser = await this.createUser({
      orgId: demoOrg.orgId,
      email: 'kavya@star.com',
      password: kavyaPassword,
      fullName: 'Kavya Star',
      role: 'Member',
      department: 'Engineering',
      digestTime: '09:00',
      notificationPreferences: { push: true, email: true },
      isOnline: false,
      customFieldsData: {},
      emailVerified: true
    });
    console.log('👤 Kavya user created:', { id: kavyaUser.id, email: kavyaUser.email });

    // Create demo org chart nodes
    const orgChartNodes = [
      {
        orgId: demoOrg.orgId,
        name: 'Allan Munger',
        role: 'Process Optimization Lead',
        department: 'Executive',
        level: 1,
        budgetResponsibility: '$2.5M',
        email: 'allanmunger@rapidfunds.com',
        position: { x: 0, y: 0 },
        color: '#0EA5E9',
        shape: 'rectangle' as const,
        isExpanded: true,
        isApproved: true
      },
      {
        orgId: demoOrg.orgId,
        name: 'Kayo',
        role: 'Chief People Officer',
        department: 'Human Resources & Admin',
        level: 2,
        budgetResponsibility: '$1.2M',
        email: 'kayo@rapidfunds.com',
        position: { x: -200, y: 100 },
        color: '#10B981',
        shape: 'rectangle' as const,
        isExpanded: true,
        isApproved: true
      },
      {
        orgId: demoOrg.orgId,
        name: 'Daisy Phillips',
        role: 'Senior Procurement Executive',
        department: 'Operations Department',
        level: 2,
        budgetResponsibility: '$1.2M',
        email: 'daisyphillips@rapidfunds.com',
        position: { x: 200, y: 100 },
        color: '#F59E0B',
        shape: 'rectangle' as const,
        isExpanded: true,
        isApproved: true
      },
      {
        orgId: demoOrg.orgId,
        name: 'David Power',
        role: 'Administrator',
        department: 'Human Resources & Admin',
        level: 3,
        budgetResponsibility: '$500K',
        email: 'davidpower@rapidfunds.com',
        position: { x: -200, y: 200 },
        color: '#10B981',
        shape: 'rectangle' as const,
        isExpanded: true,
        isApproved: true
      },
      {
        orgId: demoOrg.orgId,
        name: 'Ashley McCarthy',
        role: 'Procurement Assistant',
        department: 'Operations Department',
        level: 3,
        budgetResponsibility: '$500K',
        email: 'ashleymccarthy@rapidfunds.com',
        position: { x: 200, y: 200 },
        color: '#F59E0B',
        shape: 'rectangle' as const,
        isExpanded: true,
        isApproved: true
      }
    ];

    for (const node of orgChartNodes) {
      await this.createOrgChartNode(node);
    }

    console.log('✅ Database seeding completed successfully!');
  }
}

// Export the storage instance
export const browserStorage = new BrowserStorageImpl();
