import type { User, EmailVerification, PasswordReset } from './database';

// Email service interface - in a real app, this would connect to an email provider
// For this demo, we'll simulate email sending with localStorage and console logs
export interface EmailService {
  sendVerificationEmail(user: User, token: string): Promise<void>;
  sendPasswordResetEmail(user: User, token: string): Promise<void>;
  sendWelcomeEmail(user: User): Promise<void>;
}

// Mock email service for demo purposes
// In production, you'd integrate with services like:
// - SendGrid, Mailgun, AWS SES, or similar
// - SMTP server
// - EmailJS for client-side email sending
class MockEmailService implements EmailService {
  private getBaseUrl(): string {
    // In production, this would be your actual domain
    return window.location.origin;
  }

  async sendVerificationEmail(user: User, token: string): Promise<void> {
    const verificationUrl = `${this.getBaseUrl()}/verify-email?token=${token}`;
    
    // Store email data in localStorage for demo purposes
    const emailData = {
      to: user.email,
      subject: 'Verify Your RapidFunds Account',
      type: 'verification',
      body: this.generateVerificationEmailHTML(user.fullName, verificationUrl),
      timestamp: new Date().toISOString(),
      url: verificationUrl
    };
    
    // Store in localStorage for demo
    const emails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
    emails.push(emailData);
    localStorage.setItem('sentEmails', JSON.stringify(emails));
    
    // Log to console for development
    console.log('📧 Verification Email Sent:', {
      to: user.email,
      subject: emailData.subject,
      verificationUrl,
      timestamp: emailData.timestamp
    });
    
    // In production, you would make an API call to your email service here
    // await fetch('/api/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(emailData)
    // });
  }

  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    const resetUrl = `${this.getBaseUrl()}/reset-password?token=${token}`;
    
    const emailData = {
      to: user.email,
      subject: 'Reset Your RapidFunds Password',
      type: 'password-reset',
      body: this.generatePasswordResetEmailHTML(user.fullName, resetUrl),
      timestamp: new Date().toISOString(),
      url: resetUrl
    };
    
    // Store in localStorage for demo
    const emails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
    emails.push(emailData);
    localStorage.setItem('sentEmails', JSON.stringify(emails));
    
    console.log('📧 Password Reset Email Sent:', {
      to: user.email,
      subject: emailData.subject,
      resetUrl,
      timestamp: emailData.timestamp
    });
  }

  async sendWelcomeEmail(user: User): Promise<void> {
    const emailData = {
      to: user.email,
      subject: 'Welcome to RapidFunds!',
      type: 'welcome',
      body: this.generateWelcomeEmailHTML(user.fullName, user.role),
      timestamp: new Date().toISOString()
    };
    
    const emails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
    emails.push(emailData);
    localStorage.setItem('sentEmails', JSON.stringify(emails));
    
    console.log('📧 Welcome Email Sent:', {
      to: user.email,
      subject: emailData.subject,
      timestamp: emailData.timestamp
    });
  }

  private generateVerificationEmailHTML(name: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your RapidFunds Account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0EA5E9 0%, #10B981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #0EA5E9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RapidFunds</h1>
            <h2>Verify Your Email Address</h2>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Thank you for signing up for RapidFunds! To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0EA5E9;">${verificationUrl}</p>
            <p>This verification link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with RapidFunds, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The RapidFunds Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePasswordResetEmailHTML(name: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your RapidFunds Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0EA5E9 0%, #10B981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #0EA5E9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RapidFunds</h1>
            <h2>Reset Your Password</h2>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>We received a request to reset your password for your RapidFunds account. Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0EA5E9;">${resetUrl}</p>
            <p>This password reset link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The RapidFunds Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmailHTML(name: string, role: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to RapidFunds</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0EA5E9 0%, #10B981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #0EA5E9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RapidFunds</h1>
            <h2>Welcome to the Team!</h2>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Welcome to RapidFunds! Your account has been successfully created with the role of <strong>${role}</strong>.</p>
            <p>You can now:</p>
            <ul>
              <li>Access your organization's dashboard</li>
              <li>Create and manage funding requests</li>
              <li>View organizational charts</li>
              <li>Collaborate with your team members</li>
            </ul>
            <p style="text-align: center;">
              <a href="${this.getBaseUrl()}/dashboard" class="button">Go to Dashboard</a>
            </p>
            <p>If you have any questions or need help getting started, don't hesitate to reach out to your organization's admin.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The RapidFunds Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Utility functions for demo/testing
export function getSentEmails(): any[] {
  return JSON.parse(localStorage.getItem('sentEmails') || '[]');
}

export function clearSentEmails(): void {
  localStorage.removeItem('sentEmails');
}

export function getEmailPreview(type: 'verification' | 'password-reset' | 'welcome'): string {
  const emails = getSentEmails();
  const email = emails.find(e => e.type === type);
  return email ? email.body : '';
}

// Create and export email service instance
export const emailService: EmailService = new MockEmailService();

// Production email service implementation example
// You would replace the MockEmailService with a real implementation like this:

/*
import { createClient } from '@supabase/supabase-js';

class SupabaseEmailService implements EmailService {
  private supabase = createClient(process.env.REACT_APP_SUPABASE_URL!, process.env.REACT_APP_SUPABASE_ANON_KEY!);

  async sendVerificationEmail(user: User, token: string): Promise<void> {
    await this.supabase.functions.invoke('send-email', {
      body: {
        to: user.email,
        subject: 'Verify Your RapidFunds Account',
        template: 'verification',
        data: { name: user.fullName, token }
      }
    });
  }

  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    await this.supabase.functions.invoke('send-email', {
      body: {
        to: user.email,
        subject: 'Reset Your RapidFunds Password',
        template: 'password-reset',
        data: { name: user.fullName, token }
      }
    });
  }

  async sendWelcomeEmail(user: User): Promise<void> {
    await this.supabase.functions.invoke('send-email', {
      body: {
        to: user.email,
        subject: 'Welcome to RapidFunds!',
        template: 'welcome',
        data: { name: user.fullName, role: user.role }
      }
    });
  }
}
*/
