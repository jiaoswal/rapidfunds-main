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
    
    // Version 1: Original schema
    this.version(1).stores({
      users: '++id, orgId, email, fullName, role, department, createdAt',
      organizations: '++orgId, name, inviteCode, createdBy, createdAt',
      fundingRequests: '++id, orgId, requesterId, approverId, title, status, amount, category, createdAt',
      queryMessages: '++id, requestId, userId, messageType, content, createdAt',
      orgChartNodes: '++id, orgId, userId, name, role, department, parentId, level, createdAt',
      inviteTokens: '++id, orgId, token, role, createdBy, expiresAt, usedAt',
      approvalChains: '++id, orgId, name, department, category, isDefault, createdAt',
      approvalHistory: '++id, requestId, level, approverId, action, comments, createdAt'
    });

    // Version 2: Add org-scoped tables
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
    }).upgrade(async (trans) => {
      // Migration logic: Create org members from existing users
      console.log('🔄 Migrating existing users to org members...');
      
      const users = await (trans as any).users.toArray();
      const organizations = await (trans as any).organizations.toArray();
      
      for (const user of users) {
        const org = organizations.find((o: any) => o.orgId === user.orgId);
        if (org) {
          // Create org member record
          await (trans as any).orgMembers.add({
            memberId: user.id,
            orgId: user.orgId,
            email: user.email,
            fullName: user.fullName,
            phone: user.phoneNumber,
            role: user.role === 'Admin' ? 'admin' : 'member',
            joinedAt: user.createdAt,
            status: 'active',
            profile: {
              title: user.jobTitle || user.role,
              department: user.department || 'General'
            }
          });
        }
      }
      
      console.log(`✅ Migrated ${users.length} users to org members`);
    });
  }
}

// Create database instance with error handling
export const db = new BrowserStorage();

// Handle database initialization errors
db.on('close', async () => {
  console.log('📦 Database closed');
});

// Add error handling wrapper for database operations
const handleDatabaseError = async (error: any) => {
  console.error('❌ Database error:', error);
  if (error.name === 'DatabaseClosedError' || error.message.includes('UpgradeError')) {
    console.log('🔄 Attempting to reset database due to migration error...');
    try {
      await db.close();
      await db.delete();
      console.log('✅ Database reset complete - please refresh the page');
      // Show user notification
      if (typeof window !== 'undefined') {
        alert('Database migration error detected. The app will reset your local data and refresh. Please refresh the page to continue.');
        window.location.reload();
      }
    } catch (resetError) {
      console.error('❌ Failed to reset database:', resetError);
    }
  }
};

// Global functions for manual database operations (for debugging)
if (typeof window !== 'undefined') {
  (window as any).resetRapidFundsDatabase = async () => {
    try {
      await db.close();
      await db.delete();
      console.log('✅ Database manually reset - please refresh the page');
      alert('Database reset complete. Please refresh the page to continue.');
      window.location.reload();
    } catch (error) {
      console.error('❌ Failed to reset database:', error);
      alert('Failed to reset database. Please check console for details.');
    }
  };

  (window as any).testRapidFundsDatabase = async () => {
    try {
      console.log('🧪 Testing RapidFunds database...');
      await db.open();
      
      const userCount = await db.users.count();
      const orgCount = await db.organizations.count();
      const memberCount = await db.orgMembers.count();
      const requestCount = await db.orgRequests.count();
      const chartCount = await db.orgCharts.count();
      const auditCount = await db.orgAuditLogs.count();
      
      console.log('📊 Database Statistics:');
      console.log(`  Users: ${userCount}`);
      console.log(`  Organizations: ${orgCount}`);
      console.log(`  Org Members: ${memberCount}`);
      console.log(`  Org Requests: ${requestCount}`);
      console.log(`  Org Charts: ${chartCount}`);
      console.log(`  Audit Logs: ${auditCount}`);
      
      console.log('✅ Database test completed successfully!');
      return { userCount, orgCount, memberCount, requestCount, chartCount, auditCount };
    } catch (error) {
      console.error('❌ Database test failed:', error);
      throw error;
    }
  };

  (window as any).clearRapidFundsDatabase = async () => {
    try {
      console.log('🧹 Clearing RapidFunds database...');
      await browserStorage.clearDatabase();
      console.log('✅ Database cleared successfully!');
      alert('Database cleared successfully!');
    } catch (error) {
      console.error('❌ Failed to clear database:', error);
      alert('Failed to clear database. Please check console for details.');
    }
  };
}

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
    try {
      console.log('🔍 Searching for user by email:', email);
      const user = await db.users.where('email').equals(email).first() || null;
      console.log('👤 Database result:', user ? { id: user.id, email: user.email, role: user.role } : 'null');
      return user;
    } catch (error: any) {
      console.error('❌ Error getting user by email:', error);
      await handleDatabaseError(error);
      throw error;
    }
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

  // ===== ORG-SCOPED OPERATIONS =====

  // Org Members operations
  async createOrgMember(member: Omit<OrgMember, 'memberId'>): Promise<OrgMember> {
    const newMember: OrgMember = {
      ...member,
      memberId: crypto.randomUUID(),
    };
    await db.orgMembers.add(newMember);
    await this.logAuditAction(member.orgId, 'create', 'member', newMember.memberId, { member: newMember });
    return newMember;
  }

  async getOrgMembers(orgId: string): Promise<OrgMember[]> {
    return await db.orgMembers.where('orgId').equals(orgId).toArray();
  }

  async getOrgMember(orgId: string, memberId: string): Promise<OrgMember | null> {
    return await db.orgMembers.where('[orgId+memberId]').equals([orgId, memberId]).first() || null;
  }

  async updateOrgMember(orgId: string, memberId: string, updates: Partial<OrgMember>): Promise<OrgMember> {
    await db.orgMembers.where('[orgId+memberId]').equals([orgId, memberId]).modify(updates);
    const updated = await db.orgMembers.where('[orgId+memberId]').equals([orgId, memberId]).first();
    if (!updated) throw new Error('Org member not found');
    await this.logAuditAction(orgId, 'update', 'member', memberId, { updates });
    return updated;
  }

  async deleteOrgMember(orgId: string, memberId: string): Promise<void> {
    await db.orgMembers.where('[orgId+memberId]').equals([orgId, memberId]).delete();
    await this.logAuditAction(orgId, 'delete', 'member', memberId, {});
  }

  async upsertOrgMember(member: Omit<OrgMember, 'memberId'>): Promise<OrgMember> {
    // Check if member already exists
    const existing = await db.orgMembers.where('[orgId+email]').equals([member.orgId, member.email]).first();
    
    if (existing) {
      // Update existing member
      await db.orgMembers.where('[orgId+email]').equals([member.orgId, member.email]).modify(member);
      const updated = await db.orgMembers.where('[orgId+email]').equals([member.orgId, member.email]).first();
      if (!updated) throw new Error('Failed to update org member');
      await this.logAuditAction(member.orgId, 'update', 'member', updated.memberId, { member: updated });
      return updated;
    } else {
      // Create new member
      return await this.createOrgMember(member);
    }
  }

  // Org Requests operations
  async createOrgRequest(request: Omit<OrgRequest, 'requestId'>): Promise<OrgRequest> {
    const newRequest: OrgRequest = {
      ...request,
      requestId: crypto.randomUUID(),
    };
    await db.orgRequests.add(newRequest);
    await this.logAuditAction(request.orgId, 'create', 'request', newRequest.requestId, { request: newRequest });
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
    return await db.orgRequests.where('[orgId+requestId]').equals([orgId, requestId]).first() || null;
  }

  async updateOrgRequest(orgId: string, requestId: string, updates: Partial<OrgRequest>): Promise<OrgRequest> {
    await db.orgRequests.where('[orgId+requestId]').equals([orgId, requestId]).modify(updates);
    const updated = await db.orgRequests.where('[orgId+requestId]').equals([orgId, requestId]).first();
    if (!updated) throw new Error('Org request not found');
    await this.logAuditAction(orgId, 'update', 'request', requestId, { updates });
    return updated;
  }

  async deleteOrgRequest(orgId: string, requestId: string): Promise<void> {
    await db.orgRequests.where('[orgId+requestId]').equals([orgId, requestId]).delete();
    await this.logAuditAction(orgId, 'delete', 'request', requestId, {});
  }

  // Org Chart operations
  async getOrgChart(orgId: string): Promise<OrgChart | null> {
    return await db.orgCharts.where('orgId').equals(orgId).first() || null;
  }

  async saveOrgChart(orgChart: OrgChart): Promise<OrgChart> {
    const existing = await db.orgCharts.where('orgId').equals(orgChart.orgId).first();
    
    if (existing) {
      await db.orgCharts.where('orgId').equals(orgChart.orgId).modify({
        nodes: orgChart.nodes,
        updatedAt: new Date()
      });
    } else {
      await db.orgCharts.add(orgChart);
    }
    
    await this.logAuditAction(orgChart.orgId, 'update', 'orgChart', orgChart.orgId, { nodes: orgChart.nodes });
    return orgChart;
  }

  // Audit logging
  async logAuditAction(orgId: string, action: string, targetType: string, targetId: string, details: any): Promise<void> {
    const auditLog: OrgAuditLog = {
      id: crypto.randomUUID(),
      orgId,
      action,
      performedBy: 'system', // TODO: Get from auth context
      performedAt: new Date(),
      targetType,
      targetId,
      details
    };
    await db.orgAuditLogs.add(auditLog);
  }

  async getOrgAuditLogs(orgId: string): Promise<OrgAuditLog[]> {
    return await db.orgAuditLogs.where('orgId').equals(orgId).reverse().sortBy('performedAt');
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

  async resetDatabase(): Promise<void> {
    console.log('🔄 Resetting database...');
    try {
      await db.close();
      await db.delete();
      console.log('✅ Database reset complete');
    } catch (error) {
      console.error('❌ Error resetting database:', error);
      throw error;
    }
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

    console.log('✅ Database seeding completed successfully!');
  }
}

// Export the storage instance
export const browserStorage = new BrowserStorageImpl();
