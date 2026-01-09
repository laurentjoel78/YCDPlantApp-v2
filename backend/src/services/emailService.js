const SibApiV3Sdk = require('@getbrevo/brevo');

let instance = null;

class EmailService {
  constructor() {
    // Brevo API Key
    const brevoApiKey = process.env.BREVO_API_KEY;

    // Check if we should use mock email (no external provider)
    this.useMockEmail = process.env.USE_MOCK_EMAIL === 'true' || !brevoApiKey;

    if (this.useMockEmail) {
      console.log('📧 Using mock email service - emails will be logged but not sent');
      this.brevoClient = null;
    } else {
      // Initialize Brevo API client
      this.brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
      const apiKey = this.brevoClient.authentications['apiKey'];
      apiKey.apiKey = brevoApiKey;
      console.log('📧 Brevo email service configured');
    }

    this.fromEmail = process.env.EMAIL_FROM || 'noreply@ycd-app.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'YCD Farmer Guide';
  }

  async sendEmail(to, subject, html) {
    // If using mock email, just log and return success
    if (this.useMockEmail) {
      console.log('📧 [MOCK EMAIL]');
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Content: ${html.substring(0, 100)}...`);
      // Return a fake success response
      return { id: `mock-${Date.now()}`, success: true };
    }

    if (!this.brevoClient) {
      console.warn('Email not sent - Brevo not configured');
      return null;
    }

    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.sender = { name: this.fromName, email: this.fromEmail };
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = html;

      const result = await this.brevoClient.sendTransacEmail(sendSmtpEmail);
      console.log('📧 Email sent via Brevo:', result.messageId);
      return { id: result.messageId, success: true };
    } catch (error) {
      console.error('❌ Brevo email error:', error.message || error);
      // Log more details for debugging
      if (error.response) {
        console.error('   Response:', error.response.text || error.response.body);
      }
      return null;
    }
  }

  async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://ycd-app.com'}/verify-email?token=${verificationToken}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; display: inline-block; border-radius: 25px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 Welcome to YCD Farmer Guide!</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${user.first_name || 'there'}</strong>,</p>
            <p>Thank you for registering with YCD Farmer Guide. To complete your registration, please verify your email address by clicking the button below:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">✓ Verify My Email</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4CAF50;">${verificationUrl}</p>
            <p><strong>This link expires in 24 hours.</strong></p>
          </div>
          <div class="footer">
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>© ${new Date().getFullYear()} YCD Farmer Guide</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail(user.email, '🌱 Verify Your Email - YCD Farmer Guide', html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    // Use backend URL for password reset page (mobile app doesn't have a web frontend)
    const backendUrl = process.env.BACKEND_URL || process.env.RAILWAY_PUBLIC_DOMAIN 
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` 
      : 'https://zippy-flow-production-62fe.up.railway.app';
    const resetUrl = `${backendUrl}/reset-password?token=${resetToken}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { background-color: #2196F3; color: white; padding: 14px 28px; text-decoration: none; display: inline-block; border-radius: 25px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background-color: #fff3cd; padding: 10px; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${user.first_name || 'there'}</strong>,</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">🔑 Reset My Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2196F3;">${resetUrl}</p>
            <div class="warning">
              <p><strong>⏰ This link expires in 1 hour.</strong></p>
            </div>
          </div>
          <div class="footer">
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p>© ${new Date().getFullYear()} YCD Farmer Guide</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail(user.email, '🔐 Reset Your Password - YCD Farmer Guide', html);
  }

  async sendAccountApprovalEmail(user, status, reason = '') {
    const isApproved = status === 'approved';
    const subject = isApproved ? '✅ Account Approved!' : '❌ Account Status Update';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${isApproved ? '#4CAF50' : '#f44336'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; display: inline-block; border-radius: 25px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isApproved ? '🎉 Account Approved!' : '📋 Account Update'}</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${user.first_name || 'there'}</strong>,</p>
            ${isApproved ? `
              <p>Great news! Your farmer account has been <strong>approved</strong>.</p>
              <p>You can now:</p>
              <ul>
                <li>🌾 Add and manage your farms</li>
                <li>🛒 List products on the marketplace</li>
                <li>👨‍🌾 Connect with agricultural experts</li>
                <li>📊 Access farming guidance and insights</li>
              </ul>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://ycd-app.com'}" class="button">🚀 Start Using YCD</a>
              </p>
            ` : `
              <p>Unfortunately, your account application was <strong>not approved</strong> at this time.</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              <p>If you believe this was a mistake or have questions, please contact our support team.</p>
            `}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} YCD Farmer Guide</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  async sendWelcomeEmail(user) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #4CAF50; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 Welcome to YCD Farmer Guide!</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${user.first_name || 'there'}</strong>,</p>
            <p>Welcome to the YCD Farmer Guide community! We're excited to have you on board.</p>
            <h3>What you can do:</h3>
            <div class="feature">🌾 <strong>Farm Management</strong> - Track and manage your farms</div>
            <div class="feature">🛒 <strong>Marketplace</strong> - Buy and sell agricultural products</div>
            <div class="feature">👨‍🌾 <strong>Expert Advice</strong> - Connect with agricultural experts</div>
            <div class="feature">🌡️ <strong>Weather & Guidance</strong> - Get personalized farming tips</div>
            <p style="margin-top: 20px;">Need help? Reply to this email or visit our support center.</p>
          </div>
          <div class="footer">
            <p>Happy Farming! 🚜</p>
            <p>© ${new Date().getFullYear()} YCD Farmer Guide</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail(user.email, '🌱 Welcome to YCD Farmer Guide!', html);
  }

  async sendOrderConfirmation(user, order, orderItems) {
    try {
      const itemsList = orderItems.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product?.name || 'Product'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${parseFloat(item.price_at_add || 0).toLocaleString()} XAF</td>
        </tr>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .order-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #4CAF50; color: white; padding: 10px; text-align: left; }
            .total { font-size: 20px; font-weight: bold; color: #4CAF50; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛒 Order Confirmed!</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${user.first_name || 'Customer'}</strong>,</p>
              <p>Thank you for your order! Here are the details:</p>
              
              <div class="order-info">
                <p><strong>Order ID:</strong> #${order.id.substring(0, 8).toUpperCase()}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${order.status || 'Pending'}</p>
              </div>

              <h3>Items Ordered:</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
              </table>

              <div class="order-info" style="text-align: right;">
                <span class="total">Total: ${parseFloat(order.total_amount || 0).toLocaleString()} XAF</span>
              </div>

              ${order.shipping_address ? `
                <div class="order-info">
                  <p><strong>📍 Delivery Address:</strong></p>
                  <p>${order.shipping_address}</p>
                </div>
              ` : ''}

              <p>We'll notify you when your order is on its way!</p>
            </div>
            <div class="footer">
              <p>Questions about your order? Reply to this email.</p>
              <p>© ${new Date().getFullYear()} YCD Farmer Guide</p>
            </div>
          </div>
        </body>
        </html>
      `;

      return this.sendEmail(user.email, `🛒 Order Confirmed - #${order.id.substring(0, 8).toUpperCase()}`, html);
    } catch (error) {
      console.error('Order email error:', error);
      return null;
    }
  }

  async sendExpertConsultationNotification(expert, user, consultation) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2196F3; }
          .button { background-color: #2196F3; color: white; padding: 14px 28px; text-decoration: none; display: inline-block; border-radius: 25px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👨‍🌾 New Consultation Request</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${expert.first_name || 'Expert'}</strong>,</p>
            <p>You have received a new consultation request!</p>
            
            <div class="info-box">
              <p><strong>From:</strong> ${user.first_name} ${user.last_name}</p>
              <p><strong>Topic:</strong> ${consultation.topic || 'General Inquiry'}</p>
              ${consultation.message ? `<p><strong>Message:</strong> ${consultation.message}</p>` : ''}
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://ycd-app.com'}" class="button">📱 Open App to Respond</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} YCD Farmer Guide</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail(expert.email, '👨‍🌾 New Consultation Request - YCD Farmer Guide', html);
  }

  async sendOrderStatusUpdate(user, order, newStatus) {
    const statusEmoji = {
      'pending': '⏳',
      'confirmed': '✅',
      'processing': '📦',
      'shipped': '🚚',
      'delivered': '🎉',
      'cancelled': '❌'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .status-box { background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .status { font-size: 24px; font-weight: bold; color: #FF9800; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Order Status Update</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${user.first_name || 'Customer'}</strong>,</p>
            <p>Your order status has been updated!</p>
            
            <div class="status-box">
              <p>Order #${order.id.substring(0, 8).toUpperCase()}</p>
              <p class="status">${statusEmoji[newStatus] || '📋'} ${newStatus.toUpperCase()}</p>
            </div>

            <p>Thank you for shopping with YCD Farmer Guide!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} YCD Farmer Guide</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail(user.email, `📦 Order Update - #${order.id.substring(0, 8).toUpperCase()} is now ${newStatus}`, html);
  }
}

const getEmailService = () => {
  if (!instance) {
    instance = new EmailService();
  }
  return instance;
};

module.exports = getEmailService();