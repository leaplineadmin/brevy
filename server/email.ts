import { Resend } from 'resend';
import { logger } from '@shared/logger';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Logo simple en texte pour éviter les problèmes de blocage d'images
const LOGO_TEXT = `<div style="font-size: 24px; font-weight: bold; color: #FF6B35; text-align: center; margin-bottom: 20px;">
  <span style="color: #2563EB;">Bre</span><span style="color: #FF6B35;">vy</span>
</div>`;

// Template HTML avec logo pour les emails
const getEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Brevy</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo svg {
      height: 50px;
      width: auto;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      margin-bottom: 20px;
      text-align: center;
    }
    p {
      margin-bottom: 16px;
      font-size: 16px;
      line-height: 1.6;
      text-align: center;
    }
    .button {
      display: inline-block;
      background-color: rgb(37, 99, 235);
      color: white !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      font-size: 14px;
      color: #666;
    }
    .reset-link {
      display: inline-block;
      background: rgb(37, 99, 235);
      color: white !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      ${LOGO_TEXT}
    </div>
    ${content}
    <div class="footer">
      <p>© 2025 Brevy. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  logger.debug("Starting sendEmail function", "EMAIL");
  
  if (!resend) {
    console.error("❌ Resend not initialized. API key missing?");
    console.error("❌ RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
    return false;
  }

  try {
    
    console.log("📧 [EMAIL] Attempting to send email:", {
      to: params.to,
      subject: params.subject,
      from: 'Brevy <noreply@mail.brevy.me>'
    });
    
    const emailData = {
      from: 'Brevy <noreply@mail.brevy.me>',
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
    };
    
    console.log("📧 [EMAIL] Sending to Resend API...");
    const { data, error } = await resend.emails.send(emailData);
    
    console.log("📧 [EMAIL] Resend response:", { data, error });


    if (error) {
      console.error('❌ Detailed Resend error:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log("✅ [EMAIL] Email sent successfully:", data);
    return true;
  } catch (exception) {
    console.error('❌ === EXCEPTION in sendEmail ===');
    console.error('❌ Exception:', exception);
    console.error('❌ Stack:', (exception as Error).stack);
    return false;
  }
}

// Welcome email
export async function sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
  const content = `
    <h1>Welcome to Brevy!</h1>
    <p>Hello ${firstName},</p>
    <p>Thank you for signing up for Brevy! Your account has been successfully created.</p>
    <p>You can now create professional resumes in minutes with our modern and customizable templates.</p>
    <p style="text-align: center;">
      <a href="https://brevy.me/dashboard" class="button">Access my dashboard</a>
    </p>
    <p>We look forward to helping you create the perfect resume!</p>
    <p>The Brevy team</p>
  `;

  const html = getEmailTemplate(content);
  
  const textContent = `
Hello ${firstName},

Thank you for signing up for Brevy! Your account has been successfully created.

You can now create professional resumes in minutes with our modern and customizable templates.

Access your dashboard: https://brevy.me/dashboard

We look forward to helping you create the perfect resume!

The Brevy team
  `.trim();

  return await sendEmail({
    to,
    subject: 'Welcome to Brevy!',
    html,
    text: textContent,
  });
}

// Password reset email
export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
  const resetUrl = `https://brevy.me/reset-password?token=${resetToken}`;

  const content = `
    <h1>Reset your password</h1>
    <p>You requested to reset your password for Brevy.</p>
    <p>If this was you, click the button below:</p>
    <p style="text-align: center;">
      <a href="${resetUrl}" class="reset-link">Renew my password</a>
    </p>
    <p>This link is valid for 1 hour.</p>
    <p>If you didn't make this request, you can ignore this message.</p>
  `;

  const html = getEmailTemplate(content);

  const textContent = `
Reset your password

You requested to reset your password for Brevy.

If this was you, click the link below to renew your password:
${resetUrl}

This link is valid for 1 hour.

If you didn't make this request, you can ignore this message.
  `.trim();

  const result = await sendEmail({
    to,
    subject: 'Reset your Brevy password',
    html,
    text: textContent,
  });

  if (!result) {
    console.error('❌ [EMAIL] Failed to send password reset email via Resend');
  } else {
    console.log('✅ [EMAIL] Password reset email queued successfully');
  }

  return result;
}

// Account deletion confirmation email
export async function sendAccountDeletionEmail(to: string, firstName: string, subscriptionCancelled: boolean = false): Promise<boolean> {
  
  // Parameter validation
  if (!to || !firstName) {
    console.error('❌ MISSING PARAMETERS:');
    console.error('  - to:', to);
    console.error('  - firstName:', firstName);
    return false;
  }
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured');
    return false;
  }
  
  const content = `
    <h1>Account deletion</h1>
    <p>Hello ${firstName},</p>
    <p>Your Brevy account has been successfully deleted.</p>
    ${subscriptionCancelled 
      ? '<p style="color: #dc2626; font-weight: 600;">Your premium subscription has been cancelled and you have lost access to premium features immediately.</p>' 
      : ''
    }
    <p>We hope to see you again on our platform someday.</p>
    <p>Thank you for your trust.</p>
  `;

  const html = getEmailTemplate(content);
  
  const textContent = `
Hello ${firstName},

Your Brevy account has been successfully deleted.
${subscriptionCancelled ? '\nYour premium subscription has been cancelled and you have lost access to premium features immediately.' : ''}

We hope to see you again on our platform someday.

Thank you for your trust.
  `.trim();

  
  const result = await sendEmail({
    to,
    subject: 'Account deletion - Brevy',
    html,
    text: textContent,
  });
  
  
  return result;
}

// Premium welcome email after successful subscription
export async function sendPremiumWelcomeEmail(to: string, firstName: string, nextInvoiceDate: Date): Promise<boolean> {
  
  if (!to || !firstName) {
    console.error('❌ Missing parameters for premium welcome email');
    return false;
  }
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured');
    return false;
  }
  
  const content = `
    <h1>✅ Your Brevy Premium subscription is active!</h1>
    <p>Hi ${firstName},</p>
    <p>Thank you for subscribing to Brevy Premium! 🎉</p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Your subscription details:</h3>
      <p><strong>Plan:</strong> Premium</p>
      <p><strong>Price:</strong> €3.90 / month</p>
      <p><strong>Status:</strong> Active</p>
      <p><strong>Next payment:</strong> ${nextInvoiceDate.toLocaleDateString()}</p>
    </div>
    
    <p>You now have full access to all premium features. 🚀</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://brevy.me/dashboard" class="button" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
        👉 Go to your dashboard
      </a>
    </div>
    
    <p>Thanks again for supporting Brevy!</p>
    <p>Best,<br>The Brevy Team</p>
  `;

  const html = getEmailTemplate(content);
  
  const textContent = `
Hi ${firstName},

Thank you for subscribing to Brevy Premium!

Your subscription details:
- Plan: Premium
- Price: €3.90 / month  
- Status: Active
- Next payment: ${nextInvoiceDate.toLocaleDateString()}

You now have full access to all premium features.

Go to your dashboard: https://brevy.me/dashboard

Thanks again for supporting Brevy!

Best,
The Brevy Team
  `.trim();

  const result = await sendEmail({
    to,
    subject: '✅ Your Brevy Premium subscription is active!',
    html,
    text: textContent,
  });
  
  
  return result;
}

// Subscription cancellation email
export async function sendSubscriptionCancellationEmail(to: string, firstName: string, subscriptionEndDate: Date): Promise<boolean> {
  
  if (!to || !firstName) {
    console.error('❌ Missing parameters for cancellation email');
    return false;
  }
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured');
    return false;
  }
  
  const content = `
    <h1>⚠️ Your Brevy Premium subscription will end soon</h1>
    <p>Hi ${firstName},</p>
    <p>We've received your request to cancel your Brevy Premium subscription.<br>Here's what happens next:</p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>✅ Your premium features will remain available until ${subscriptionEndDate.toLocaleDateString()} (the end of your current billing period).</strong></p>
      
      <p><strong>🆓 After that date, your account will automatically switch back to the free plan, and you'll still be able to use Brevy with limited features.</strong></p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://brevy.me/dashboard" class="button" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
        👉 Go to your dashboard
      </a>
    </div>
    
    <p>We're sad to see you leave Premium, but you're always welcome back!</p>
    <p>Best,<br>The Brevy Team</p>
  `;

  const html = getEmailTemplate(content);
  
  const textContent = `
Hi ${firstName},

We've received your request to cancel your Brevy Premium subscription.
Here's what happens next:

✅ Your premium features will remain available until ${subscriptionEndDate.toLocaleDateString()} (the end of your current billing period).

🆓 After that date, your account will automatically switch back to the free plan, and you'll still be able to use Brevy with limited features.

Go to your dashboard: https://brevy.me/dashboard

We're sad to see you leave Premium, but you're always welcome back!

Best,
The Brevy Team
  `.trim();

  const result = await sendEmail({
    to,
    subject: '⚠️ Your Brevy Premium subscription will end soon',
    html,
    text: textContent,
  });
  
  
  return result;
}