const nodemailer = require('nodemailer');

let instance = null;

class EmailService {
  constructor() {
    // Create a test account for development
    if (process.env.NODE_ENV !== 'production') {
      this.createTestAccount();
    } else {
      this.initializeTransporter();
    }
  }

  async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('Test email account created:', testAccount.user);
    } catch (error) {
      console.error('Error creating test email account:', error);
      this.initializeTransporter();
    }
  }

  initializeTransporter() {
    // Use Resend SMTP settings
    const host = process.env.EMAIL_HOST || 'smtp.resend.com';
    const port = parseInt(process.env.EMAIL_PORT || '465', 10);
    const user = process.env.EMAIL_USER || 'resend';
    const pass = process.env.EMAIL_PASSWORD || process.env.RESEND_API_KEY;

    if (!pass) {
      console.warn('⚠️ No EMAIL_PASSWORD or RESEND_API_KEY set - emails will fail');
      this.transporter = null;
      return;
    }

    console.log(`📧 Email configured: ${host}:${port} (user: ${user})`);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  async sendEmail(to, subject, html) {
    if (!this.transporter) {
      console.warn('Email not sent - transporter not configured');
      return null;
    }

    try {
      const from = process.env.EMAIL_FROM || 'noreply@ycd.com';
      const info = await this.transporter.sendMail({
        from: `"YCD Farmer Guide" <${from}>`,
        to,
        subject,
        html,
      });
      console.log('Email sent: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error.message);
      // Don't throw - emails should not block core functionality
      return null;
    }
  }


  async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const html = `
      <h1>Welcome to YCD Farmer Guide!</h1>
      <p>Hello ${user.first_name},</p>
      <p>Thank you for registering. Please verify your email:</p>
      <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
    `;
    return this.sendEmail(user.email, 'Verify Your Email', html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = `
      <h1>Password Reset</h1>
      <p>Hello ${user.first_name},</p>
      <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none;">
        Reset Password
      </a>
      <p>This link expires in 1 hour.</p>
    `;
    return this.sendEmail(user.email, 'Reset Your Password', html);
  }

  async sendAccountApprovalEmail(user, status) {
    const subject = status === 'approved' ? 'Account Approved' : 'Account Status';
    const content = status === 'approved'
      ? `<h1>Account Approved!</h1><p>Hello ${user.first_name}, your account has been approved.</p>`
      : `<h1>Account Update</h1><p>Hello ${user.first_name}, your account application was declined.</p>`;
    return this.sendEmail(user.email, subject, content);
  }

  async sendWelcomeEmail(user) {
    const html = `<h1>Welcome to YCD!</h1><p>Hello ${user.first_name}, thanks for joining us!</p>`;
    return this.sendEmail(user.email, 'Welcome', html);
  }

  async sendOrderConfirmation(user, order, orderItems) {
    try {
      // Simple, safe email without delivery address
      const itemsList = orderItems.map(item => `
        ${item.product.name} - Qty: ${item.quantity} - ${parseFloat(item.price_at_add).toLocaleString()} XAF
      `).join('<br>');

      const html = `
        <h2>Order Confirmation</h2>
        <p>Hello ${user.first_name || 'Customer'},</p>
        <p>Thank you for your order!</p>
        <p><strong>Order ID:</strong> ${order.id.substring(0, 8)}</p>
        <p><strong>Items:</strong></p>
        <p>${itemsList}</p>
        <p><strong>Total:</strong> ${parseFloat(order.total_amount).toLocaleString()} XAF</p>
        <p><strong>Delivery Address:</strong> ${order.shipping_address || 'N/A'}</p>
        <p>We'll notify you when your order ships.</p>
      `;

      return this.sendEmail(user.email, `Order Confirmation - #${order.id.substring(0, 8)}`, html);
    } catch (error) {
      console.error('Order email error:', error);
      // Don't throw - email is non-critical
    }
  }
}

const getEmailService = () => {
  if (!instance) {
    instance = new EmailService();
  }
  return instance;
};

module.exports = getEmailService();