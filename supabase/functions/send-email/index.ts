// Supabase Edge Function for sending emails
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Email templates
const EMAIL_TEMPLATES = {
  verification: (data: any) => `
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
          <p>Hello ${data.name},</p>
          <p>Thank you for signing up for RapidFunds! To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0EA5E9;">${data.verificationUrl}</p>
          <p>This verification link will expire in 24 hours for security reasons.</p>
          <p>If you didn't create an account with RapidFunds, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>The RapidFunds Team</p>
        </div>
      </div>
    </body>
    </html>
  `,
  
  'password-reset': (data: any) => `
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
          <p>Hello ${data.name},</p>
          <p>We received a request to reset your password for your RapidFunds account. Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${data.resetUrl}" class="button">Reset Password</a>
          </p>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0EA5E9;">${data.resetUrl}</p>
          <p>This password reset link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>The RapidFunds Team</p>
        </div>
      </div>
    </body>
    </html>
  `,
  
  welcome: (data: any) => `
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
          <p>Hello ${data.name},</p>
          <p>Welcome to RapidFunds! Your account has been successfully created with the role of <strong>${data.role}</strong>.</p>
          <p>You can now:</p>
          <ul>
            <li>Access your organization's dashboard</li>
            <li>Create and manage funding requests</li>
            <li>View organizational charts</li>
            <li>Collaborate with your team members</li>
          </ul>
          <p style="text-align: center;">
            <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
          </p>
          <p>If you have any questions or need help getting started, don't hesitate to reach out to your organization's admin.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>The RapidFunds Team</p>
        </div>
      </div>
    </body>
    </html>
  `
}

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { to, subject, template, data } = await req.json()

    if (!to || !subject || !template) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, template' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate HTML content based on template
    const templateFunction = EMAIL_TEMPLATES[template as keyof typeof EMAIL_TEMPLATES]
    if (!templateFunction) {
      return new Response(
        JSON.stringify({ error: `Unknown template: ${template}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const htmlContent = templateFunction(data)

    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Resend
    // For now, we'll just log the email and return success

    console.log('📧 Email would be sent:', {
      to,
      subject,
      template,
      timestamp: new Date().toISOString()
    })

    // Log the HTML content for debugging
    console.log('📄 Email HTML:', htmlContent)

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        to,
        subject,
        template
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Email function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Example integration with SendGrid (uncomment to use):
/*
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(Deno.env.get('SENDGRID_API_KEY')!)

const sendEmail = async (to: string, subject: string, html: string) => {
  const msg = {
    to,
    from: Deno.env.get('FROM_EMAIL') || 'noreply@rapidfunds.com',
    subject,
    html,
  }

  try {
    await sgMail.send(msg)
    console.log('Email sent successfully')
  } catch (error) {
    console.error('SendGrid error:', error)
    throw error
  }
}
*/

// Example integration with Resend (uncomment to use):
/*
import { Resend } from 'resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const data = await resend.emails.send({
      from: Deno.env.get('FROM_EMAIL') || 'RapidFunds <noreply@rapidfunds.com>',
      to: [to],
      subject,
      html,
    })
    console.log('Email sent successfully:', data)
  } catch (error) {
    console.error('Resend error:', error)
    throw error
  }
}
*/
