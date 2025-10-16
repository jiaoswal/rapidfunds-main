import { browserStorage as storage } from './browserStorage';
import { authManager } from './browserAuth';
import { generateId } from './database';
import type { User, Organization } from './database';

// Browser-based API that mimics the server API endpoints
export class BrowserApi {
  // Authentication endpoints
  async login(email: string, password: string): Promise<User> {
    return await authManager.login(email, password);
  }

  async register(orgCode: string, name: string, adminEmail: string, adminPassword: string, adminFullName: string): Promise<{ organization: Organization; user: User; message: string }> {
    const user = await authManager.register(orgCode, name, adminEmail, adminPassword, adminFullName);
    const org = authManager.getCurrentOrganization()!;
    
    return {
      organization: org,
      user,
      message: "Organization created successfully! You are now logged in."
    };
  }

  async joinOrganization(inviteCode: string, email: string, password: string, fullName: string, phoneNumber?: string): Promise<{ user: User; message: string }> {
    const user = await authManager.joinOrganization(inviteCode, email, password, fullName, phoneNumber);
    
    return {
      user,
      message: "Account created successfully! You are now logged in."
    };
  }

  async logout(): Promise<void> {
    authManager.logout();
  }

  async getCurrentUser(): Promise<User | null> {
    return authManager.getCurrentUser();
  }

  // Organization endpoints
  async getOrganization(): Promise<Organization> {
    const org = authManager.getCurrentOrganization();
    if (!org) throw new Error('No organization found');
    return org;
  }

  async updateOrganization(data: Partial<Organization>): Promise<Organization> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    if (!isAdmin()) throw new Error('Admin access required');
    
    return await authManager.updateOrganization(data);
  }

  // User endpoints
  async getUsers(): Promise<User[]> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    const user = authManager.getCurrentUser()!;
    return await storage.getUsersByOrg(user.orgId);
  }

  async getApprovers(): Promise<User[]> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    const user = authManager.getCurrentUser()!;
    
    // Get all users in the organization except the current user
    const allUsers = await storage.getUsersByOrg(user.orgId);
    
    // Filter out the current user (can't approve own requests) and return all others
    return allUsers.filter(u => u.id !== user.id);
  }

  // Funding Request endpoints
  async getRequests(): Promise<any[]> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    const user = authManager.getCurrentUser()!;
    return await storage.getFundingRequestsByOrg(user.orgId);
  }

  async createRequest(data: any): Promise<any> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    const user = authManager.getCurrentUser()!;
    
    return await storage.createFundingRequest({
      ...data,
      orgId: user.orgId,
      requesterId: user.id,
      status: 'Open',
      currentApprovalLevel: 1,
      participants: [],
      attachments: [],
      checklist: [],
      lastActivityAt: new Date()
    });
  }

  async updateRequestStatus(id: string, status: string, comments?: string, isFastTrack?: boolean): Promise<any> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    const user = authManager.getCurrentUser()!;
    
    if (!canApprove()) throw new Error('Approval access required');
    
    const request = await storage.getFundingRequest(id);
    if (!request) throw new Error('Request not found');
    if (request.orgId !== user.orgId) throw new Error('Access denied');

    // Create approval history entry
    await storage.createApprovalHistory({
      requestId: id,
      level: request.currentApprovalLevel || 1,
      approverId: user.id,
      action: status as any,
      comments: comments || undefined,
      isFastTrack: isFastTrack || false
    });

    // Handle approval chain logic
    // TODO: Implement approval chain logic when getApprovalChainById method is available
    if (false && status === 'Approved' && !isFastTrack && request?.approvalChainId) {
      // const chain = await storage.getApprovalChainById(request.approvalChainId);
      
      // if (chain) {
      //   const currentLevel = request.currentApprovalLevel || 1;
      //   const nextLevel = currentLevel + 1;
      //   const nextApprover = chain.levels.find((l: any) => l.level === nextLevel);

      //   if (nextApprover) {
      //     // Forward to next level
      //     const updated = await storage.updateFundingRequest(id, {
      //       currentApprovalLevel: nextLevel,
      //       approverId: nextApprover.approverId,
      //       status: 'Open',
      //       lastActivityAt: new Date()
      //     });
      //     
      //     return {
      //       ...updated,
      //       message: `Request forwarded to Level ${nextLevel} approver: ${nextApprover.approverName}`
      //     };
      //   } else {
      //     // Final approval
      //     const updated = await storage.updateFundingRequest(id, {
      //       status: 'Approved',
      //       lastActivityAt: new Date()
      //     });
      //     
      //     return {
      //       ...updated,
      //       message: 'Request fully approved - all levels complete'
      //     };
      //   }
      // }
    }

    // Simple status update
    return await storage.updateFundingRequest(id, {
      status: status as any,
      lastActivityAt: new Date()
    });
  }

  // Query Messages endpoints
  async getRequestMessages(requestId: string): Promise<any[]> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    return await storage.getMessagesByRequest(requestId);
  }

  async createRequestMessage(requestId: string, data: any): Promise<any> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    const user = authManager.getCurrentUser()!;
    
    return await storage.createQueryMessage({
      requestId,
      userId: user.id,
      messageType: data.messageType || 'text',
      content: data.content,
      attachments: data.attachments || []
    });
  }

  // Invite Token endpoints
  async getInviteTokens(): Promise<any[]> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    if (!isAdmin()) throw new Error('Admin access required');
    
    const user = authManager.getCurrentUser()!;
    return await storage.getInviteTokensByOrg(user.orgId);
  }

  async createInviteToken(role: string, expiresInDays: number = 7): Promise<any> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    if (!isAdmin()) throw new Error('Admin access required');
    
    const user = authManager.getCurrentUser()!;
    const inviteCode = await authManager.generateInviteCode(user.orgId, role, user.id, expiresInDays);
    
    // Get the created token from storage
    const token = await storage.getInviteTokenByToken(inviteCode);
    return token;
  }

  async deleteInviteToken(id: string): Promise<void> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    if (!isAdmin()) throw new Error('Admin access required');
    
    await storage.deleteInviteToken(id);
  }

  async validateInviteToken(token: string): Promise<any> {
    const inviteToken = await storage.getInviteTokenByToken(token);
    
    if (!inviteToken) {
      return { valid: false, error: 'Token not found' };
    }

    if (new Date(inviteToken.expiresAt) < new Date()) {
      return { valid: false, error: 'Token has expired' };
    }

    if (inviteToken.usedAt) {
      return { valid: false, error: 'Token has already been used' };
    }

    const org = await storage.getOrganization(inviteToken.orgId);
    if (!org) {
      return { valid: false, error: 'Organization not found' };
    }

    return {
      valid: true,
      role: inviteToken.role,
      orgCode: org.orgCode,
      orgName: org.name,
      expiresAt: inviteToken.expiresAt
    };
  }


  // Org Chart endpoints
  async getOrgChart(): Promise<any[]> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    const user = authManager.getCurrentUser()!;
    return await storage.getOrgChartNodesByOrg(user.orgId);
  }

  async createOrgChartNode(data: any): Promise<any> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    if (!isAdmin()) throw new Error('Admin access required');
    
    const user = authManager.getCurrentUser()!;
    return await storage.createOrgChartNode({
      ...data,
      orgId: user.orgId
    });
  }

  async deleteOrgChartNode(id: string): Promise<void> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    if (!isAdmin()) throw new Error('Admin access required');
    
    await storage.deleteOrgChartNode(id);
  }

  async moveOrgChartNode(nodeId: string, newParentId: string | null, newLevel: number): Promise<OrgChartNode> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    if (!isAdmin()) throw new Error('Admin access required');
    
    const user = authManager.getCurrentUser()!;
    
    // Get the current node
    const currentNode = await storage.getOrgChartNode(nodeId);
    if (!currentNode) throw new Error('Node not found');
    
    // Update the node with new parent and level
    const updatedNode = await storage.updateOrgChartNode(nodeId, {
      parentId: newParentId,
      level: newLevel,
      updatedAt: new Date()
    });
    
    return updatedNode;
  }

  // Approval Chain endpoints
  async getApprovalChains(): Promise<any[]> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    if (!isAdmin()) throw new Error('Admin access required');
    
    const user = authManager.getCurrentUser()!;
    return await storage.getApprovalChainsByOrgId(user.orgId);
  }

  async getDefaultApprovalChain(): Promise<any> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    const user = authManager.getCurrentUser()!;
    return await storage.getDefaultApprovalChain(user.orgId);
  }

  async createApprovalChain(data: any): Promise<any> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    if (!isAdmin()) throw new Error('Admin access required');
    
    const user = authManager.getCurrentUser()!;
    return await storage.createApprovalChain({
      ...data,
      orgId: user.orgId
    });
  }

  async updateApprovalChain(id: string, data: any): Promise<any> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    if (!isAdmin()) throw new Error('Admin access required');
    
    return await storage.updateApprovalChain(id, data);
  }

  async deleteApprovalChain(id: string): Promise<void> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    if (!isAdmin()) throw new Error('Admin access required');
    
    await storage.deleteApprovalChain(id);
  }

  // Approval History endpoints
  async getApprovalHistory(requestId: string): Promise<any[]> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    return await storage.getApprovalHistoryByRequestId(requestId);
  }

  // File upload simulation (store in localStorage for demo)
  async uploadFile(file: File): Promise<{ name: string; url: string; size: number; id: string }> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    
    const fileId = generateId();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        try {
          // Store file data in localStorage (in a real app, you'd use IndexedDB or cloud storage)
          const fileData = {
            id: fileId,
            name: file.name,
            data: reader.result,
            size: file.size,
            type: file.type
          };
          
          localStorage.setItem(`file_${fileId}`, JSON.stringify(fileData));
          
          resolve({
            name: file.name,
            url: `/api/files/${fileId}`,
            size: file.size,
            id: fileId
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    if (!authManager.isAuthenticated()) throw new Error('Not authenticated');
    if (!isAdmin()) throw new Error('Admin access required');
    
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }
    
    const fileId = generateId();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        try {
          const fileData = {
            id: fileId,
            name: file.name,
            data: reader.result,
            size: file.size,
            type: file.type
          };
          
          localStorage.setItem(`logo_${fileId}`, JSON.stringify(fileData));
          
          resolve({
            logoUrl: `/api/public/logo-${fileId}`
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
}

// Helper functions
function isAdmin(): boolean {
  const user = authManager.getCurrentUser();
  return user?.role === 'Admin';
}

function canApprove(): boolean {
  const user = authManager.getCurrentUser();
  return user?.role === 'Admin' || user?.role === 'Approver';
}

// Create and export API instance
export const browserApi = new BrowserApi();
