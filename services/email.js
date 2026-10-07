const nodemailer = require('nodemailer');

async function sendConfirmationEmail({ to, name, event }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service is not configured');
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  const eventName = String(event)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'THEATRON 2026 – Event Details & Important Information',
    text: `Dear ${name},

Greetings from Team IMMERSE, Chennai Institute of Technology!

Thank you for registering for THEATRON 2026, our inter-collegiate Film Festival. We’re excited to have you be a part of the event!

Here are the details regarding your registered event:

Event: ${eventName}
Date: 10 November 2026
Registration Fee: ₹99

The reporting time and venue details will be updated shortly. We request you to stay tuned for further updates.

For all the latest announcements, event updates and important information, do follow our official Instagram page: @immerse_cit.

Please make sure to go through the event rules and guidelines before the event. Further instructions will also be shared with you through our official communication channels.

We look forward to welcoming you to THEATRON 2026!

Regards,
Team IMMERSE
Chennai Institute of Technology
THEATRON 2026`,
  });
}

module.exports = { sendConfirmationEmail };
