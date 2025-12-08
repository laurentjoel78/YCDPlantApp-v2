const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

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

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: user.email,
    subject: emailContent.subject,
    html: emailContent.body
  };

  await transporter.sendMail(mailOptions);
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