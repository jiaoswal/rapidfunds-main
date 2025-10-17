import { browserStorage as storage } from './browserStorage';
import { emailService } from './emailService';
import type { User, Organization, InviteToken, OrgMember, OrgRequest } from './database';
import { nanoid } from 'nanoid';

// Simple password hashing using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Authentication state management
class AuthManager {
  private currentUser: User | null = null;
  private currentOrg: Organization | null = null;
  private listeners: Array<(user: User | null) => void> = [];

  constructor() {
    // Try to restore session from localStorage
    this.restoreSession();
  }

  private async restoreSession() {
    try {
      const savedUserId = localStorage.getItem('currentUserId');
      if (savedUserId) {
        const user = await storage.getUser(savedUserId);
        if (user) {
          this.currentUser = user;
          this.currentOrg = await storage.getOrganizationById(user.orgId);
          this.notifyListeners();
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      this.clearSession();
    }
  }

  private saveSession() {
    if (this.currentUser) {
      localStorage.setItem('currentUserId', this.currentUser.id);
    } else {
      localStorage.removeItem('currentUserId');
    }
  }

  private clearSession() {
    this.currentUser = null;
    this.currentOrg = null;
    localStorage.removeItem('currentUserId');
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  // Public methods
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getCurrentOrganization(): Organization | null {
    return this.currentOrg;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  addAuthListener(listener: (user: User | null) => void) {
    this.listeners.push(listener);
    // Call immediately with current state
    listener(this.currentUser);
  }

  removeAuthListener(listener: (user: User | null) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  async login(email: string, password: string): Promise<User> {
    try {
      console.log('🔐 Login attempt:', { email, passwordLength: password.length });
      
      let user = await storage.getUserByEmail(email);
      console.log('👤 User found:', user ? { id: user.id, email: user.email, role: user.role } : 'null');

      if (!user) {
        console.log('👤 User not found, attempting to auto-create...');
        
        // Check if there are any organizations to join
        const organizations = await storage.getAllOrganizations();
        if (organizations.length === 0) {
          console.log('❌ No organizations available to join');
          throw new Error('No organizations available. Please contact an administrator to create an organization first.');
        }

        // Use the first available organization (in a real app, you might want to let users choose)
        const defaultOrg = organizations[0];
        console.log('🏢 Using default organization:', { id: defaultOrg.orgId, name: defaultOrg.name });

        // Auto-create user with the provided credentials
        const hashedPassword = await hashPassword(password);
        const fullName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        user = await storage.createUser({
          orgId: defaultOrg.orgId,
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          fullName: fullName,
          role: 'Member', // Default role for auto-created users
          department: undefined,
          digestTime: '09:00',
          notificationPreferences: { push: true, email: true },
          isOnline: false,
          customFieldsData: {},
          emailVerified: true
        });
        
        console.log('✅ User auto-created:', { id: user.id, email: user.email, role: user.role });
      } else {
        // Verify password for existing user
        const hashedPassword = await hashPassword(password);
        console.log('🔒 Password check:', { 
          inputHash: hashedPassword.substring(0, 10) + '...', 
          storedHash: user.password.substring(0, 10) + '...',
          match: user.password === hashedPassword 
        });
        
        if (user.password !== hashedPassword) {
          console.log('❌ Password mismatch');
          throw new Error('Invalid email or password');
        }
      }

      // Set current user and organization
      this.currentUser = user;
      this.currentOrg = await storage.getOrganization(user.orgId);
      
      console.log('✅ Login successful:', { userId: user.id, orgId: user.orgId });
      
      this.saveSession();
      this.notifyListeners();

      return user;
    } catch (error) {
      console.log('❌ Login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  }

  async register(orgCode: string, name: string, adminEmail: string, adminPassword: string, adminFullName: string): Promise<User> {
    try {
      // Check if org code already exists
      const existingOrg = await storage.getOrganizationByCode(orgCode);
      if (existingOrg) {
        throw new Error('Organization code already exists');
      }

      // Check if admin email already exists
      const existingUser = await storage.getUserByEmail(adminEmail.toLowerCase().trim());
      if (existingUser) {
        throw new Error('Email already in use');
      }

      // Create organization with new schema
      const orgId = crypto.randomUUID();
      const org = await storage.createOrganization({
        name,
        inviteCode: orgCode,
        createdBy: 'temp', // Will be updated after user creation
        settings: {
          primaryColor: '#0EA5E9',
          secondaryColor: '#10B981',
          customFields: [],
          checklistTemplates: [],
          approvalRules: [],
          defaultDigestTime: '09:00'
        }
      });

      // Create admin user
      const hashedPassword = await hashPassword(adminPassword);
      const adminUser = await storage.createUser({
        orgId: org.orgId,
        email: adminEmail.toLowerCase().trim(),
        password: hashedPassword,
        fullName: adminFullName,
        role: 'Admin',
        department: undefined,
        digestTime: '09:00',
        notificationPreferences: { push: true, email: true },
        isOnline: false,
        customFieldsData: {},
        emailVerified: true
      });

      // Update org with creator ID
      await storage.updateOrganization(org.orgId, { createdBy: adminUser.id });

      // Create org member record for admin
      await storage.createOrgMember({
        orgId: org.orgId,
        email: adminEmail.toLowerCase().trim(),
        fullName: adminFullName,
        role: 'admin',
        joinedAt: new Date(),
        status: 'active',
        profile: {
          title: 'Admin',
          department: 'Management'
        }
      });

      // Auto-login the admin user
      this.currentUser = adminUser;
      this.currentOrg = org;
      
      this.saveSession();
      this.notifyListeners();

      return adminUser;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  async joinOrganization(inviteCode: string, email: string, password: string, fullName: string, phoneNumber?: string): Promise<User> {
    try {
      // Validate invite code
      const inviteData = await this.validateInviteCode(inviteCode);
      if (!inviteData) {
        throw new Error('Invalid or expired invite code');
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email.toLowerCase().trim());
      if (existingUser) {
        throw new Error('Email already in use');
      }

      // Get organization
      const org = await storage.getOrganizationById(inviteData.orgId);
      if (!org) {
        throw new Error('Organization not found');
      }

      // Create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        orgId: org.orgId,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        fullName,
        phoneNumber: phoneNumber || undefined,
        role: inviteData.role as 'Admin' | 'Approver' | 'Finance' | 'Member',
        department: undefined,
        digestTime: '09:00',
        notificationPreferences: { push: true, email: true },
        isOnline: false,
        customFieldsData: {},
        emailVerified: true
      });

      // Create org member record
      await storage.createOrgMember({
        orgId: org.orgId,
        email: email.toLowerCase().trim(),
        fullName,
        phone: phoneNumber,
        role: 'member',
        joinedAt: new Date(),
        status: 'active',
        profile: {
          title: inviteData.role,
          department: 'General'
        }
      });

      // Mark invite token as used
      const token = await storage.getInviteTokenByToken(inviteCode);
      if (token) {
        await storage.markInviteTokenAsUsed(token.id, user.id);
      }

      // Auto-login the user
      this.currentUser = user;
      this.currentOrg = org;
      
      this.saveSession();
      this.notifyListeners();

      return user;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to join organization');
    }
  }

  async joinOrganizationByCode(orgCode: string, email: string, password: string, fullName: string, role: string, department?: string): Promise<User> {
    try {
      // Find existing organization
      const org = await storage.getOrganizationByCode(orgCode);
      if (!org) {
        throw new Error('Organization not found');
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email.toLowerCase().trim());
      if (existingUser) {
        throw new Error('Email already in use');
      }

      // Create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        orgId: org.orgId,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        fullName,
        role: role as 'Admin' | 'Approver' | 'Finance' | 'Member' | 'Requester',
        department: department || undefined,
        digestTime: '09:00',
        notificationPreferences: { push: true, email: true },
        isOnline: false,
        customFieldsData: {},
          emailVerified: true
      });

          // Email verification disabled

      // Set current user and organization
      this.currentUser = user;
      this.currentOrg = org;
      
      this.saveSession();
      this.notifyListeners();

      return user;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Join organization failed');
    }
  }

  logout() {
    this.clearSession();
  }

  // Invite code management methods
  async generateInviteCode(orgId: string, role: string, createdBy: string, expiresInDays: number = 7): Promise<string> {
    try {
      // Generate a unique invite code
      const inviteCode = nanoid(12).toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      
      // Create invite token
      await storage.createInviteToken({
        orgId,
        token: inviteCode,
        role: role as 'Admin' | 'Approver' | 'Finance' | 'Member' | 'Requester',
        createdBy,
        expiresAt,
        usedAt: undefined,
        usedBy: undefined
      });
      
      return inviteCode;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to generate invite code');
    }
  }

  async validateInviteCode(inviteCode: string): Promise<{ orgId: string; role: string; orgName: string } | null> {
    try {
      const token = await storage.getInviteTokenByToken(inviteCode);
      if (!token) {
        return null;
      }
      
      // Check if token is expired
      if (token.expiresAt && new Date() > token.expiresAt) {
        return null;
      }
      
      // Check if token is already used
      if (token.usedAt) {
        return null;
      }
      
      // Get organization details
      const org = await storage.getOrganizationById(token.orgId);
      if (!org) {
        return null;
      }
      
      return {
        orgId: token.orgId,
        role: token.role,
        orgName: org.name
      };
    } catch (error) {
      return null;
    }
  }

  async getInviteCodes(orgId: string): Promise<InviteToken[]> {
    try {
      return await storage.getInviteTokensByOrg(orgId);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get invite codes');
    }
  }

  async revokeInviteCode(tokenId: string): Promise<void> {
    try {
      await storage.deleteInviteToken(tokenId);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to revoke invite code');
    }
  }

  async updateUser(data: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    const updatedUser = await storage.updateUser(this.currentUser.id, data);
    this.currentUser = updatedUser;
    this.notifyListeners();
    return updatedUser;
  }

  async updateOrganization(data: Partial<Organization>): Promise<Organization> {
    if (!this.currentOrg) {
      throw new Error('No organization loaded');
    }

    const updatedOrg = await storage.updateOrganization(this.currentOrg.orgId, data);
    this.currentOrg = updatedOrg;
    return updatedOrg;
  }

  // Email verification methods
  async sendVerificationEmail(user: User): Promise<void> {
    try {
      // Generate verification token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create verification record
      await storage.createEmailVerification({
        userId: user.id,
        email: user.email,
        token,
        expiresAt
      });

      // Send email
      await emailService.sendVerificationEmail(user, token);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to send verification email');
    }
  }

  async verifyEmail(token: string): Promise<User> {
    try {
      // Find verification record
      const verification = await storage.getEmailVerificationByToken(token);
      if (!verification) {
        throw new Error('Invalid verification token');
      }

      // Check if token is expired
      if (new Date(verification.expiresAt) < new Date()) {
        throw new Error('Verification token has expired');
      }

      // Check if already verified
      if (verification.verifiedAt) {
        throw new Error('Email already verified');
      }

      // Mark as verified
      await storage.markEmailAsVerified(token);

      // Update user email verification status
      const user = await storage.getUser(verification.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const updatedUser = await storage.updateUser(user.id, { emailVerified: true });

      // Update current user if it's the same user
      if (this.currentUser && this.currentUser.id === user.id) {
        this.currentUser = updatedUser;
        this.notifyListeners();
      }

      return updatedUser;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Email verification failed');
    }
  }

  async resendVerificationEmail(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    await this.sendVerificationEmail(this.currentUser);
  }

  // Password reset methods
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return;
      }

      // Generate reset token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Create password reset record
      await storage.createPasswordReset({
        userId: user.id,
        email: user.email,
        token,
        expiresAt
      });

      // Send email
      await emailService.sendPasswordResetEmail(user, token);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to send password reset email');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Find reset record
      const reset = await storage.getPasswordResetByToken(token);
      if (!reset) {
        throw new Error('Invalid reset token');
      }

      // Check if token is expired
      if (new Date(reset.expiresAt) < new Date()) {
        throw new Error('Reset token has expired');
      }

      // Check if already used
      if (reset.usedAt) {
        throw new Error('Reset token has already been used');
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      await storage.updateUser(reset.userId, { password: hashedPassword });

      // Mark reset as used
      await storage.markPasswordResetAsUsed(token);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Password reset failed');
    }
  }

  // Check if user's email is verified
  isEmailVerified(): boolean {
    return this.currentUser?.emailVerified ?? false;
  }
}

// Create and export auth manager instance
export const authManager = new AuthManager();

// Helper function to check if user has required role
export function hasRole(requiredRoles: string[]): boolean {
  const user = authManager.getCurrentUser();
  return user ? requiredRoles.includes(user.role) : false;
}

// Helper function to check if user is admin
export function isAdmin(): boolean {
  return hasRole(['Admin']);
}

// Helper function to check if user can approve
export function canApprove(): boolean {
  return hasRole(['Admin', 'Approver']);
}
