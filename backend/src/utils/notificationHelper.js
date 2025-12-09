const emailService = require('../services/emailService');
const { User } = require('../models');

// Send notification through various channels (email, in-app, etc.)
exports.sendNotification = async (userId, type, data) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Send email notification
    await sendEmailNotification(user, type, data);

    // Add more notification channels here (e.g., SMS, push notifications)

  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Send email notification
const sendEmailNotification = async (user, type, data) => {
  const emailContent = generateEmailContent(type, data);

  // Use the centralized email service
  // Note: legacy vars SMTP_FROM vs EMAIL_FROM are handled by existing emailService config
  await emailService.sendEmail(user.email, emailContent.subject, emailContent.body);
};

// Generate email content based on notification type
const generateEmailContent = (type, data) => {
  switch (type) {
    case 'new_advisory':
      return {
        subject: 'New Advisory Request',
        body: `
          <h2>New Advisory Request</h2>
          <p>You have received a new advisory request from ${data.farmerName}.</p>
          <p>Please log in to your account to view and respond to the request.</p>
        `
      };

    case 'advisory_response':
      return {
        subject: 'New Advisory Response',
        body: `
          <h2>New Advisory Response</h2>
          <p>${data.respondentName} has responded to your advisory request.</p>
          <p>Please log in to your account to view the response.</p>
        `
      };

    case 'status_change':
      return {
        subject: 'Advisory Status Updated',
        body: `
          <h2>Advisory Status Updated</h2>
          <p>The status of your advisory request has been updated to: ${data.status}</p>
          <p>Please log in to your account for more details.</p>
        `
      };

    default:
      throw new Error('Invalid notification type');
  }
};