const { Resend } = require('resend');

let instance = null;

class EmailService {
  constructor() {
    const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_PASSWORD;

    if (!apiKey) {
      console.warn('⚠️ No RESEND_API_KEY set - emails will not be sent');
      this.resend = null;
    } else {
      this.resend = new Resend(apiKey);
      console.log('📧 Resend API configured');
    }

    this.fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  }

  async sendEmail(to, subject, html) {
    if (!this.resend) {
      console.warn('Email not sent - Resend not configured');
      return null;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: `YCD Farmer Guide <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error('Resend error:', error);
        return null;
      }

      console.log('Email sent:', data.id);
      return data;
    } catch (error) {
      console.error('Error sending email:', error.message);
      return null;
    }
  }

  async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://ycd-app.com'}/verify-email?token=${verificationToken}`;
    const html = `
      <h1>Welcome to YCD Farmer Guide!</h1>
      <p>Hello ${user.first_name},</p>
      <p>Thank you for registering. Please verify your email:</p>
      <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
    `;
    return this.sendEmail(user.email, 'Verify Your Email', html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://ycd-app.com'}/reset-password?token=${resetToken}`;
    const html = `
      <h1>Password Reset</h1>
      <p>Hello ${user.first_name},</p>
      <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">
        Reset Password
      </a>
      <p>This link expires in 1 hour.</p>
    `;
    return this.sendEmail(user.email, 'Reset Your Password', html);
  }

  async sendAccountApprovalEmail(user, status) {
    const subject = status === 'approved' ? 'Account Approved' : 'Account Status';
    const content = status === 'approved'
      ? `<h1>Account Approved!</h1><p>Hello ${user.first_name}, your account has been approved. You can now log in and start using YCD Farmer Guide!</p>`
      : `<h1>Account Update</h1><p>Hello ${user.first_name}, your account application was declined. Please contact support for more information.</p>`;
    return this.sendEmail(user.email, subject, content);
  }

  async sendWelcomeEmail(user) {
    const html = `<h1>Welcome to YCD!</h1><p>Hello ${user.first_name}, thanks for joining us!</p>`;
    return this.sendEmail(user.email, 'Welcome', html);
  }

  async sendOrderConfirmation(user, order, orderItems) {
    try {
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
      return null;
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